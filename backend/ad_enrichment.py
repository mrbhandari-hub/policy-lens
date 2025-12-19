"""
Ad Enrichment Module - Uses web search and domain analysis to enrich ad investigations
"""

import os
import asyncio
import httpx
from urllib.parse import urlparse
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel


class DomainInfo(BaseModel):
    """Domain registration and reputation info"""
    domain: str
    registration_date: Optional[str] = None
    registrar: Optional[str] = None
    country: Optional[str] = None
    age_days: Optional[int] = None
    is_newly_registered: bool = False  # < 90 days
    ssl_valid: Optional[bool] = None
    error: Optional[str] = None


class WebResearch(BaseModel):
    """Web research results from Perplexity or similar"""
    company_info: Optional[str] = None
    scam_reports: Optional[str] = None
    legitimacy_assessment: Optional[str] = None
    red_flags: List[str] = []
    green_flags: List[str] = []
    sources: List[str] = []
    confidence: str = "low"  # low, medium, high
    error: Optional[str] = None


class AdEnrichment(BaseModel):
    """Complete enrichment data for an ad"""
    ad_id: str
    domain_info: Optional[DomainInfo] = None
    web_research: Optional[WebResearch] = None
    overall_risk_assessment: str = "unknown"  # likely_scam, suspicious, unclear, likely_legitimate
    enriched_at: str


async def get_domain_info(url: str) -> DomainInfo:
    """
    Get domain registration info using WHOIS lookup.
    Uses whoisxmlapi.com or falls back to basic DNS check.
    """
    try:
        parsed = urlparse(url)
        domain = parsed.netloc or parsed.path
        # Remove www prefix
        if domain.startswith('www.'):
            domain = domain[4:]
        
        # Try WHOIS XML API if key is available
        whois_api_key = os.getenv("WHOIS_API_KEY")
        
        if whois_api_key:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    f"https://www.whoisxmlapi.com/whoisserver/WhoisService",
                    params={
                        "apiKey": whois_api_key,
                        "domainName": domain,
                        "outputFormat": "JSON"
                    }
                )
                if resp.status_code == 200:
                    data = resp.json()
                    whois_record = data.get("WhoisRecord", {})
                    
                    created_date = whois_record.get("createdDate") or whois_record.get("registryData", {}).get("createdDate")
                    registrar = whois_record.get("registrarName")
                    country = whois_record.get("registrant", {}).get("country")
                    
                    age_days = None
                    is_newly_registered = False
                    if created_date:
                        try:
                            created = datetime.fromisoformat(created_date.replace('Z', '+00:00'))
                            age_days = (datetime.now(created.tzinfo) - created).days
                            is_newly_registered = age_days < 90
                        except:
                            pass
                    
                    return DomainInfo(
                        domain=domain,
                        registration_date=created_date,
                        registrar=registrar,
                        country=country,
                        age_days=age_days,
                        is_newly_registered=is_newly_registered
                    )
        
        # Fallback: just return domain without WHOIS data
        return DomainInfo(
            domain=domain,
            error="WHOIS API key not configured"
        )
        
    except Exception as e:
        return DomainInfo(
            domain=url,
            error=str(e)
        )


async def research_with_perplexity(
    advertiser_name: str,
    landing_page_url: Optional[str],
    ad_text: str,
    scam_types: List[str]
) -> WebResearch:
    """
    Use Perplexity API to research the advertiser and detect scams.
    Falls back to OpenAI if Perplexity is unavailable.
    """
    perplexity_key = os.getenv("PERPLEXITY_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    
    # Build the research query
    domain = ""
    if landing_page_url:
        try:
            parsed = urlparse(landing_page_url)
            domain = parsed.netloc or ""
        except:
            pass
    
    scam_context = f"Detected scam patterns: {', '.join(scam_types)}" if scam_types else ""
    
    research_prompt = f"""Research this advertiser/company to determine if it's legitimate or a potential scam:

Advertiser Name: {advertiser_name}
Website/Domain: {domain or 'Unknown'}
Landing Page: {landing_page_url or 'Unknown'}

Ad Text Preview:
{ad_text[:500]}

{scam_context}

Please research and provide:
1. What is known about this company/advertiser? Any official business records?
2. Are there any scam reports, complaints, or warnings about this entity online?
3. Red flags that suggest this might be a scam
4. Green flags that suggest this might be legitimate
5. Your overall assessment of legitimacy (likely_scam, suspicious, unclear, likely_legitimate)

Be specific and cite sources where possible. Focus on factual findings from the web."""

    # Try Perplexity first
    if perplexity_key:
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(
                    "https://api.perplexity.ai/chat/completions",
                    headers={
                        "Authorization": f"Bearer {perplexity_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "llama-3.1-sonar-small-128k-online",
                        "messages": [
                            {
                                "role": "system",
                                "content": "You are an investigative researcher helping identify potential scam advertisements. Provide factual, well-sourced information. Be direct about red flags and green flags."
                            },
                            {
                                "role": "user", 
                                "content": research_prompt
                            }
                        ],
                        "temperature": 0.2,
                        "max_tokens": 1500
                    }
                )
                
                if resp.status_code == 200:
                    data = resp.json()
                    content = data["choices"][0]["message"]["content"]
                    citations = data.get("citations", [])
                    
                    # Parse the response to extract structured data
                    return parse_research_response(content, citations)
                    
        except Exception as e:
            print(f"Perplexity API error: {e}")
    
    # Fallback to OpenAI (without live web search, but still useful)
    if openai_key:
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {openai_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "gpt-4o-mini",
                        "messages": [
                            {
                                "role": "system",
                                "content": "You are an investigative researcher helping identify potential scam advertisements. Based on the information provided and your training knowledge, assess the legitimacy of this advertiser. Note that you cannot do live web searches, so base your assessment on patterns and known scam tactics."
                            },
                            {
                                "role": "user",
                                "content": research_prompt
                            }
                        ],
                        "temperature": 0.2,
                        "max_tokens": 1500
                    }
                )
                
                if resp.status_code == 200:
                    data = resp.json()
                    content = data["choices"][0]["message"]["content"]
                    result = parse_research_response(content, [])
                    result.error = "Used OpenAI fallback (no live web search)"
                    return result
                    
        except Exception as e:
            print(f"OpenAI API error: {e}")
    
    return WebResearch(
        error="No API keys configured for web research (need PERPLEXITY_API_KEY or OPENAI_API_KEY)"
    )


def parse_research_response(content: str, citations: List[str]) -> WebResearch:
    """Parse the LLM response into structured WebResearch data"""
    
    red_flags = []
    green_flags = []
    confidence = "medium"
    assessment = "unclear"
    
    content_lower = content.lower()
    
    # Extract red flags
    if "red flag" in content_lower:
        lines = content.split('\n')
        in_red_flags = False
        for line in lines:
            if "red flag" in line.lower():
                in_red_flags = True
                continue
            if in_red_flags and line.strip().startswith(('-', '•', '*', '1', '2', '3', '4', '5')):
                flag = line.strip().lstrip('-•*0123456789. ')
                if flag and len(flag) > 5:
                    red_flags.append(flag)
            elif in_red_flags and ("green flag" in line.lower() or "assessment" in line.lower()):
                in_red_flags = False
    
    # Extract green flags
    if "green flag" in content_lower:
        lines = content.split('\n')
        in_green_flags = False
        for line in lines:
            if "green flag" in line.lower():
                in_green_flags = True
                continue
            if in_green_flags and line.strip().startswith(('-', '•', '*', '1', '2', '3', '4', '5')):
                flag = line.strip().lstrip('-•*0123456789. ')
                if flag and len(flag) > 5:
                    green_flags.append(flag)
            elif in_green_flags and ("assessment" in line.lower() or "conclusion" in line.lower()):
                in_green_flags = False
    
    # Determine assessment
    if "likely_scam" in content_lower or "likely scam" in content_lower or "almost certainly a scam" in content_lower:
        assessment = "likely_scam"
        confidence = "high"
    elif "suspicious" in content_lower and ("scam" in content_lower or "fraud" in content_lower):
        assessment = "suspicious"
        confidence = "medium"
    elif "likely_legitimate" in content_lower or "likely legitimate" in content_lower or "appears legitimate" in content_lower:
        assessment = "likely_legitimate"
        confidence = "medium"
    elif "unclear" in content_lower or "cannot determine" in content_lower or "insufficient" in content_lower:
        assessment = "unclear"
        confidence = "low"
    
    # Adjust confidence based on red/green flag count
    if len(red_flags) >= 3 and len(green_flags) == 0:
        confidence = "high"
        if assessment == "unclear":
            assessment = "suspicious"
    elif len(green_flags) >= 3 and len(red_flags) == 0:
        confidence = "high"
    
    return WebResearch(
        company_info=content[:500] if content else None,  # First part usually has company info
        scam_reports=None,  # Could parse this out more specifically
        legitimacy_assessment=content,
        red_flags=red_flags[:5],  # Limit to top 5
        green_flags=green_flags[:5],
        sources=citations[:5] if citations else [],
        confidence=confidence
    )


async def enrich_ad(
    ad_id: str,
    advertiser_name: str,
    ad_text: str,
    landing_page_url: Optional[str] = None,
    scam_types: List[str] = []
) -> AdEnrichment:
    """
    Fully enrich an ad with domain info and web research.
    """
    
    # Run domain lookup and web research in parallel
    domain_info = None
    web_research = None
    
    if landing_page_url:
        # Run both in parallel
        domain_task = get_domain_info(landing_page_url)
        research_task = research_with_perplexity(
            advertiser_name=advertiser_name,
            landing_page_url=landing_page_url,
            ad_text=ad_text,
            scam_types=scam_types
        )
        results = await asyncio.gather(domain_task, research_task, return_exceptions=True)
        domain_info = results[0] if not isinstance(results[0], Exception) else None
        web_research = results[1] if not isinstance(results[1], Exception) else None
    else:
        # Just run web research
        try:
            web_research = await research_with_perplexity(
                advertiser_name=advertiser_name,
                landing_page_url=landing_page_url,
                ad_text=ad_text,
                scam_types=scam_types
            )
        except Exception:
            pass
    
    # Determine overall risk
    risk = "unknown"
    if web_research and web_research.legitimacy_assessment:
        if "likely_scam" in (web_research.legitimacy_assessment or "").lower():
            risk = "likely_scam"
        elif "suspicious" in (web_research.legitimacy_assessment or "").lower():
            risk = "suspicious"
        elif "likely_legitimate" in (web_research.legitimacy_assessment or "").lower():
            risk = "likely_legitimate"
        else:
            risk = "unclear"
    
    # Boost risk if domain is newly registered
    if domain_info and domain_info.is_newly_registered and risk == "unclear":
        risk = "suspicious"
    
    return AdEnrichment(
        ad_id=ad_id,
        domain_info=domain_info,
        web_research=web_research,
        overall_risk_assessment=risk,
        enriched_at=datetime.utcnow().isoformat()
    )


# Batch enrichment for multiple ads
async def enrich_ads_batch(ads: List[Dict[str, Any]], max_concurrent: int = 3) -> List[AdEnrichment]:
    """
    Enrich multiple ads with rate limiting.
    """
    semaphore = asyncio.Semaphore(max_concurrent)
    
    async def enrich_with_limit(ad: Dict[str, Any]) -> AdEnrichment:
        async with semaphore:
            return await enrich_ad(
                ad_id=ad.get("ad_id", ""),
                advertiser_name=ad.get("advertiser_name", ""),
                ad_text=ad.get("text", ""),
                landing_page_url=ad.get("landing_page_url"),
                scam_types=ad.get("scam_types", [])
            )
    
    return await asyncio.gather(*[enrich_with_limit(ad) for ad in ads])

