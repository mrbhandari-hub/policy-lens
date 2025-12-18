"""Meta Ads Library API Client

Fetches real ads from Meta's Ads Library using:
1. Official Graph API (if META_ACCESS_TOKEN is set)
2. Web scraping fallback (for demo/testing)
"""
import os
import re
import json
import httpx
from typing import Optional
from ad_scanner import MetaAd


GRAPH_API_VERSION = "v21.0"
ADS_LIBRARY_API_URL = f"https://graph.facebook.com/{GRAPH_API_VERSION}/ads_archive"


class MetaAdsClient:
    """Client for fetching ads from Meta Ads Library"""
    
    def __init__(self, access_token: Optional[str] = None):
        self.access_token = access_token or os.getenv("META_ACCESS_TOKEN")
        self.http_client = httpx.AsyncClient(timeout=30.0)
    
    async def search_ads(
        self,
        keyword: str,
        country: str = "US",
        ad_type: str = "ALL",
        limit: int = 10
    ) -> list[MetaAd]:
        """
        Search for ads in Meta Ads Library.
        
        Strategy order:
        1. Official Meta Graph API (if META_ACCESS_TOKEN is set)
        2. Apify Facebook Ads Library API (if APIFY_API_TOKEN is set)
        3. Sample ads fallback
        
        Args:
            keyword: Search term
            country: Country code (default: US)
            ad_type: Type of ad (ALL, POLITICAL_AND_ISSUE_ADS, etc.)
            limit: Maximum number of ads to return
            
        Returns:
            List of MetaAd objects
        """
        # Try official Meta API first
        if self.access_token:
            ads = await self._search_via_api(keyword, country, ad_type, limit)
            if ads:
                return ads
        
        # Try Apify next (most reliable for real ads)
        apify_token = os.getenv("APIFY_API_TOKEN")
        if apify_token:
            ads = await self._search_via_apify(keyword, limit, country)
            if ads:
                return ads
        
        # Fall back to sample ads
        print("No API tokens available, returning sample ads")
        return []

    
    async def _search_via_api(
        self,
        keyword: str,
        country: str,
        ad_type: str,
        limit: int
    ) -> list[MetaAd]:
        """Search using official Meta Graph API"""
        params = {
            "access_token": self.access_token,
            "search_terms": keyword,
            "ad_reached_countries": country,
            "ad_type": ad_type,
            "ad_active_status": "ALL",
            "fields": "id,ad_creative_bodies,page_name,ad_delivery_start_time,ad_snapshot_url,publisher_platforms",
            "limit": limit
        }
        
        try:
            response = await self.http_client.get(ADS_LIBRARY_API_URL, params=params)
            response.raise_for_status()
            data = response.json()
            
            ads = []
            for item in data.get("data", []):
                # ad_creative_bodies is a list of text versions
                text = ""
                if item.get("ad_creative_bodies"):
                    text = item["ad_creative_bodies"][0] if item["ad_creative_bodies"] else ""
                
                ad = MetaAd(
                    ad_id=item.get("id", "unknown"),
                    text=text,
                    advertiser_name=item.get("page_name", "Unknown Advertiser"),
                    start_date=item.get("ad_delivery_start_time", ""),
                    is_active=True
                )
                ads.append(ad)
            
            return ads
            
        except httpx.HTTPError as e:
            print(f"Meta API error: {e}")
            return []
    
    async def _search_via_apify(self, keyword: str, limit: int, country: str = "US") -> list[MetaAd]:
        """Search using Apify's Premium URL-based Facebook Ads Library scraper."""
        from apify_ads_client import ApifyAdsClient
        
        client = ApifyAdsClient()
        try:
            # Build the URL with the keyword - this uses the Premium URL-based scraper
            ads_library_url = client.build_ads_library_url(keyword, country=country)
            print(f"Fetching real ads via Apify Premium for '{keyword}'...")
            print(f"Using URL: {ads_library_url}")
            
            ads = await client.search_ads_by_url(ads_library_url, limit)
            if ads:
                print(f"Apify returned {len(ads)} real ads")
                return ads
            else:
                print("Apify returned no ads")
                return []
        except Exception as e:
            print(f"Apify error: {e}")
            import traceback
            traceback.print_exc()
            return []
        finally:
            await client.close()
    
    async def _search_via_scraping(self, keyword: str, limit: int) -> list[MetaAd]:
        """
        Scrapes real ads using Playwright to handle the dynamic React application.
        Falls back to simulation if the browser process fails or is blocked.
        """
        print(f"Scraping real ads for '{keyword}' via Playwright...")
        from playwright.async_api import async_playwright
        
        try:
            async with async_playwright() as p:
                # Use a specific user agent to look like a real Mac user
                browser = await p.chromium.launch(
                    headless=True,
                    args=['--no-sandbox', '--disable-setuid-sandbox']
                )
                context = await browser.new_context(
                    user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    viewport={"width": 1280, "height": 800}
                )
                
                page = await context.new_page()
                
                # Construct the search URL
                url = f"https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&q={keyword}&search_type=keyword_unordered"
                
                await page.goto(url, wait_until="networkidle", timeout=20000)
                
                # Wait for the results container to load
                try:
                    # Generic selector for ad cards (they often have explicit aria labels or specific structures)
                    # We'll look for multiple common selectors
                    await page.wait_for_selector('div[role="main"]', timeout=10000)
                    
                    # Wait a bit for React hydration
                    await page.wait_for_timeout(3000)
                    
                    # Extract ads from the DOM
                    # Meta uses obfuscated classes, so we rely on structure
                    ads_data = await page.evaluate('''() => {
                        const ads = [];
                        // Look for all text blocks that might be ads
                        const cards = Array.from(document.querySelectorAll('div[style*="border-radius"]')); 
                        
                        // Fallback: look for large text blocks if generic cards aren't found
                        const candidates = cards.length > 0 ? cards : Array.from(document.querySelectorAll('div'));
                        
                        let count = 0;
                        for (const el of candidates) {
                            if (count >= 20) break;
                            
                            const text = el.innerText;
                            // Heuristic filter for ad-like content
                            if (text.length > 50 && text.length < 1000 && !text.includes("Filter")) {
                                // Try to find advertiser name (usually bold or at top)
                                const boldElem = el.querySelector('strong, span[style*="font-weight: 600"]');
                                const advertiser = boldElem ? boldElem.innerText : "Unknown Advertiser";
                                
                                // Ensure it's not just navigation text
                                if (advertiser.length < 50 && !advertiser.includes("Library")) {
                                    ads.push({
                                        ad_id: "scraped_" + Math.random().toString(36).substr(2, 9),
                                        text: text,
                                        advertiser_name: advertiser,
                                        is_active: true
                                    });
                                    count++;
                                }
                            }
                        }
                        return ads;
                    }''')
                    
                    print(f"Playwright found {len(ads_data)} potential ad elements")
                    
                    ads = []
                    seen_texts = set()
                    
                    for item in ads_data:
                        # Deduplicate and clean
                        if item['text'] in seen_texts:
                            continue
                        seen_texts.add(item['text'])
                        
                        # Basic cleaning
                        clean_text = item['text'].replace('\n', ' ').strip()
                        
                        ads.append(MetaAd(
                            ad_id=item['ad_id'],
                            text=clean_text[:500] + "..." if len(clean_text) > 500 else clean_text,
                            advertiser_name=item['advertiser_name'],
                            is_active=True,
                            start_date="Just Found"
                        ))
                    
                    if not ads:
                        print("Playwright found no ads")
                        return []
                        
                    return ads[:limit]
                    
                except Exception as e:
                    print(f"Playwright selector timeout or error: {e}")
                    return []
                    
                finally:
                    await browser.close()
                    
        except Exception as e:
            print(f"Playwright critical error: {e}")
            return []
    
    async def close(self):
        """Close the HTTP client"""
        await self.http_client.aclose()


async def fetch_real_ads(keyword: str, limit: int = 10) -> list[MetaAd]:
    """
    Convenience function to fetch real ads from Meta Ads Library.
    
    Args:
        keyword: Search term
        limit: Max ads to return
        
    Returns:
        List of MetaAd objects (may be empty if API access fails)
    """
    client = MetaAdsClient()
    try:
        ads = await client.search_ads(keyword, limit=limit)
        return ads
    finally:
        await client.close()
