"""PolicyLens v2.0 - FastAPI Server"""
import asyncio
import os
import hashlib
from datetime import datetime, timedelta
from contextlib import asynccontextmanager
from typing import Dict, Tuple, Any
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import PolicyLensRequest, PolicyLensResponse, DebateResult, CrossModelResult
from judges import get_available_judges, get_judge_prompt, get_judge_categories
from engine import JudgeEngine
from multi_model import get_multi_model_engine, MultiModelEngine
from deep_dives import get_deep_dives_engine, DeepDivesEngine
from ad_scanner import (
    AdScanRequest, AdScanResponse, AdAnalysisResult, MetaAd, AdCategory, ScanStats,
    get_sample_ads_by_keyword, categorize_by_consensus, SAMPLE_ADS,
    detect_scam_fingerprints, get_policy_violations, calculate_harm_score,
    build_ad_library_url, ScamType
)
from meta_ads_client import fetch_real_ads
from landing_page_crawler import crawl_landing_page


# Initialize engines on startup
engine: JudgeEngine = None
multi_engine: MultiModelEngine = None
deep_engine: DeepDivesEngine = None

# =============================================================================
# CACHING SYSTEM
# =============================================================================

# Cache for raw ads fetched from Meta Ads Library (keyword -> (ads, timestamp))
ads_cache: Dict[str, Tuple[list, datetime]] = {}

# Cache for analyzed results (cache_key -> (response, timestamp))
results_cache: Dict[str, Tuple[Any, datetime]] = {}

# Cache TTL settings
ADS_CACHE_TTL = timedelta(hours=1)  # Raw ads cached for 1 hour
RESULTS_CACHE_TTL = timedelta(hours=24)  # Analyzed results cached for 24 hours


def get_cache_key(keyword: str, max_ads: int, judges: list[str]) -> str:
    """Generate a unique cache key for scan results"""
    judges_str = ",".join(sorted(judges))
    key_str = f"{keyword.lower()}:{max_ads}:{judges_str}"
    return hashlib.md5(key_str.encode()).hexdigest()


def get_cached_ads(keyword: str) -> list | None:
    """Get cached raw ads if still valid"""
    cache_entry = ads_cache.get(keyword.lower())
    if cache_entry:
        ads, timestamp = cache_entry
        if datetime.now() - timestamp < ADS_CACHE_TTL:
            print(f"Cache HIT for ads: {keyword}")
            return ads
        else:
            print(f"Cache EXPIRED for ads: {keyword}")
            del ads_cache[keyword.lower()]
    return None


def cache_ads(keyword: str, ads: list) -> None:
    """Cache raw ads"""
    ads_cache[keyword.lower()] = (ads, datetime.now())
    print(f"Cached {len(ads)} ads for: {keyword}")


def get_cached_results(cache_key: str) -> Any | None:
    """Get cached analysis results if still valid"""
    cache_entry = results_cache.get(cache_key)
    if cache_entry:
        results, timestamp = cache_entry
        if datetime.now() - timestamp < RESULTS_CACHE_TTL:
            print(f"Cache HIT for results: {cache_key[:8]}...")
            return results
        else:
            print(f"Cache EXPIRED for results: {cache_key[:8]}...")
            del results_cache[cache_key]
    return None


def cache_results(cache_key: str, results: Any) -> None:
    """Cache analysis results"""
    results_cache[cache_key] = (results, datetime.now())
    print(f"Cached results for: {cache_key[:8]}...")


@asynccontextmanager
async def lifespan(app: FastAPI):
    global engine, multi_engine, deep_engine
    
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key or api_key == "your-google-api-key-here":
        print("⚠️  WARNING: GOOGLE_API_KEY not set. The /analyze endpoint will not work.")
        print("   Get your API key from https://aistudio.google.com/")
        print("   Then set it: export GOOGLE_API_KEY=your-key-here")
        engine = None
    else:
        engine = JudgeEngine(api_key=api_key)
        print("✓ PolicyLens jury engine initialized")
    
    # Initialize multi-model engine (for debate and cross-model)
    print("Initializing multi-model engine...")
    multi_engine = get_multi_model_engine()
    print("✓ Multi-model engine ready")
    
    # Initialize deep dives engine
    print("Initializing deep dives engine...")
    deep_engine = get_deep_dives_engine()
    print("✓ Deep dives engine ready")
    
    yield


app = FastAPI(
    title="PolicyLens v2.0",
    description="Multi-perspective content moderation analysis engine",
    version="2.0.0",
    lifespan=lifespan
)

# CORS configuration - List all allowed frontend origins
# Note: Cannot use allow_origins=["*"] with allow_credentials=True
ALLOWED_ORIGINS = [
    "https://policylens.xyz",
    "https://www.policylens.xyz",
    "https://policy-pearl.vercel.app",
    "https://policy-rahuls-projects-4361375b.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Also allow any Vercel preview deployments
def get_allowed_origins():
    return ALLOWED_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    allow_origin_regex=r"https://policy.*\.vercel\.app",  # Allow all Vercel preview URLs
)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "2.0.0"}


@app.get("/judges")
async def list_judges():
    """Get available judge personas with categories"""
    return {
        "judges": get_available_judges(),
        "categories": get_judge_categories()
    }


@app.get("/judges/{judge_id}")
async def get_judge_details(judge_id: str):
    """Get full details for a specific judge, including the system prompt"""
    try:
        judge = get_judge_prompt(judge_id)
        return {
            "id": judge_id,
            "name": judge["name"],
            "description": judge["description"],
            "system_prompt": judge["system_prompt"]
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/analyze", response_model=PolicyLensResponse)
async def analyze_content(request: PolicyLensRequest):
    """
    Analyze content through multiple judge perspectives.
    
    Select 3-5 judges to form a panel. Returns:
    - Individual verdicts from each judge
    - Synthesis with consensus badge and disagreement analysis
    - Optional: Pro/Con debate result (if run_debate=True)
    - Optional: Cross-model agreement result (if run_cross_model=True)
    - Optional: Advanced deep dive analyses (counterfactual, red_team, etc.)
    """
    if not engine:
        raise HTTPException(
            status_code=503, 
            detail="GOOGLE_API_KEY not configured. Set the environment variable and restart the server."
        )
    
    if len(request.selected_judges) < 2:
        raise HTTPException(
            status_code=400, 
            detail="Select at least 2 judges for meaningful comparison"
        )
    
    # Build list of tasks to run in parallel
    tasks = []
    task_names = []
    
    content_text = request.content_text or ""
    context_hint = request.context_hint
    
    # Always run the jury analysis
    tasks.append(engine.evaluate_content(request))
    task_names.append("jury")
    
    # Optionally run debate
    if request.run_debate and multi_engine:
        tasks.append(multi_engine.run_debate(
            content_text=content_text,
            context_hint=context_hint
        ))
        task_names.append("debate")
    
    # Optionally run cross-model
    if request.run_cross_model and multi_engine:
        # Decode image if provided
        image_bytes = None
        if request.content_image_base64:
            import base64
            image_bytes = base64.b64decode(request.content_image_base64)
        
        tasks.append(multi_engine.run_cross_model(
            content_text=content_text,
            context_hint=context_hint,
            image_bytes=image_bytes
        ))
        task_names.append("cross_model")
    
    # =========================================================================
    # NEW ADVANCED DEEP DIVES
    # =========================================================================
    
    if deep_engine:
        if request.run_counterfactual:
            tasks.append(deep_engine.run_counterfactual(content_text, context_hint))
            task_names.append("counterfactual")
        
        if request.run_red_team:
            tasks.append(deep_engine.run_red_team(content_text, context_hint))
            task_names.append("red_team")
        
        if request.run_temporal:
            tasks.append(deep_engine.run_temporal(content_text, context_hint))
            task_names.append("temporal")
        
        if request.run_appeal:
            tasks.append(deep_engine.run_appeal(content_text, context_hint))
            task_names.append("appeal")
    
    try:
        # Run all analyses in parallel
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results
        response = None
        debate_result = None
        cross_model_result = None
        counterfactual_result = None
        red_team_result = None
        temporal_result = None
        appeal_result = None
        
        for i, result in enumerate(results):
            name = task_names[i]
            
            if isinstance(result, Exception):
                print(f"Error in {name} analysis: {result}")
                if name == "jury":
                    # Jury is required, re-raise
                    raise result
                continue
            
            if name == "jury":
                response = result
            elif name == "debate":
                debate_result = result
            elif name == "cross_model":
                cross_model_result = result
            elif name == "counterfactual":
                counterfactual_result = result
            elif name == "red_team":
                red_team_result = result
            elif name == "temporal":
                temporal_result = result
            elif name == "appeal":
                appeal_result = result
        
        if response is None:
            raise HTTPException(status_code=500, detail="Jury analysis failed")
        
        # Add optional results to response
        response.debate = debate_result
        response.cross_model = cross_model_result
        response.counterfactual = counterfactual_result
        response.red_team = red_team_result
        response.temporal = temporal_result
        response.appeal = appeal_result
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# AD SCANNER ENDPOINTS
# =============================================================================

@app.get("/sample-ads")
async def get_sample_ads(keyword: str = ""):
    """Get sample ads for demo mode, optionally filtered by keyword"""
    if keyword:
        ads = get_sample_ads_by_keyword(keyword)
    else:
        ads = SAMPLE_ADS
    return {"ads": [ad.model_dump() for ad in ads], "total": len(ads)}


@app.post("/scan-ads", response_model=AdScanResponse)
async def scan_ads(request: AdScanRequest):
    """
    Scan ads through the PolicyLens judge panel.
    
    For each ad:
    1. Run through selected judges
    2. Calculate consensus 
    3. Categorize as violating/mixed/benign
    
    Returns categorized ads with verdicts.
    
    Caching:
    - Raw ads are cached for 1 hour
    - Analysis results are cached for 24 hours
    - Use refresh=true to bypass cache and get fresh data
    """
    if not engine:
        raise HTTPException(
            status_code=503, 
            detail="GOOGLE_API_KEY not configured. Set the environment variable and restart the server."
        )
    
    # Generate cache key for full results
    cache_key = get_cache_key(request.keyword, request.max_ads, request.selected_judges)
    
    # Check for cached results first (unless refresh requested)
    if not request.refresh:
        cached_response = get_cached_results(cache_key)
        if cached_response:
            print(f"Returning cached results for '{request.keyword}'")
            return cached_response
    else:
        print(f"Refresh requested for '{request.keyword}', bypassing cache")
    
    # Get ads to analyze - either provided, fetch real ads, or use samples
    ads_to_analyze = []
    
    if request.ads:
        ads_to_analyze = request.ads
    elif request.use_real_ads:
        # Check ads cache first (unless refresh requested)
        if not request.refresh:
            cached_ads = get_cached_ads(request.keyword)
            if cached_ads:
                ads_to_analyze = cached_ads[:request.max_ads]
        
        # Fetch real ads if not cached
        if not ads_to_analyze:
            try:
                ads_to_analyze = await fetch_real_ads(request.keyword, limit=request.max_ads)
                if ads_to_analyze:
                    # Cache the raw ads
                    cache_ads(request.keyword, ads_to_analyze)
                else:
                    print(f"No real ads found for '{request.keyword}', falling back to samples")
                    ads_to_analyze = get_sample_ads_by_keyword(request.keyword, request.max_ads)
            except Exception as e:
                print(f"Error fetching real ads: {e}, falling back to samples")
                ads_to_analyze = get_sample_ads_by_keyword(request.keyword, request.max_ads)
    else:
        ads_to_analyze = get_sample_ads_by_keyword(request.keyword, request.max_ads)
    
    if not ads_to_analyze:
        raise HTTPException(status_code=400, detail="No ads to analyze")
    
    # =========================================================================
    # PHASE 1: Pre-crawl ALL landing pages in parallel (fast I/O-bound task)
    # This happens BEFORE any judge analysis to avoid sequential delays
    # =========================================================================
    
    print(f"\n📥 Phase 1: Pre-crawling {len(ads_to_analyze)} landing pages in parallel...")
    
    # Collect all landing page URLs to crawl
    urls_to_crawl = {}
    for ad in ads_to_analyze:
        if ad.landing_page_url and ad.landing_page_url not in urls_to_crawl:
            urls_to_crawl[ad.landing_page_url] = None  # Will store result
    
    # Define async crawler with semaphore to limit concurrent connections
    crawl_semaphore = asyncio.Semaphore(10)  # Max 10 concurrent crawls
    
    async def crawl_with_limit(url: str):
        async with crawl_semaphore:
            content, error = await crawl_landing_page(url)
            return url, content, error
    
    # Crawl all landing pages in parallel
    if urls_to_crawl:
        crawl_results = await asyncio.gather(
            *[crawl_with_limit(url) for url in urls_to_crawl.keys()],
            return_exceptions=True
        )
        
        # Store results in lookup dict
        landing_page_cache = {}
        for result in crawl_results:
            if isinstance(result, Exception):
                continue
            url, content, error = result
            landing_page_cache[url] = (content, error)
            if content:
                print(f"  ✓ Crawled: {url[:50]}... ({len(content)} chars)")
            elif error:
                print(f"  ✗ Failed: {url[:50]}... ({error})")
    else:
        landing_page_cache = {}
    
    print(f"✅ Phase 1 complete: {sum(1 for v in landing_page_cache.values() if v[0])} pages crawled successfully\n")
    
    # =========================================================================
    # PHASE 2: Analyze ALL ads in parallel (CPU/API-bound task)
    # Now that we have all landing page content cached, analyze ads quickly
    # =========================================================================
    
    print(f"🔍 Phase 2: Analyzing {len(ads_to_analyze)} ads through judges in parallel...")
    
    async def analyze_single_ad(ad: MetaAd) -> AdAnalysisResult:
        """Analyze a single ad with pre-crawled landing page content.
        
        IMPORTANT: Uses pre-cached landing page content for speed.
        """
        
        # Get pre-crawled landing page content (already done in Phase 1)
        landing_page_content = None
        landing_page_crawl_error = None
        
        if ad.landing_page_url and ad.landing_page_url in landing_page_cache:
            content, error = landing_page_cache[ad.landing_page_url]
            landing_page_content = content
            landing_page_crawl_error = error
        
        # Build COMPREHENSIVE context for judges
        context_parts = []
        
        # A. Basic ad information
        context_parts.append(f"=== ADVERTISEMENT INFORMATION ===")
        context_parts.append(f"Advertiser: {ad.advertiser_name}")
        context_parts.append(f"Ad ID: {ad.ad_id}")
        if ad.start_date:
            context_parts.append(f"Start Date: {ad.start_date}")
        context_parts.append(f"Status: {'Active' if ad.is_active else 'Inactive'}")
        
        # B. Ad copy/text (the main content)
        context_parts.append(f"\n=== AD COPY ===")
        context_parts.append(ad.text)
        
        # C. Landing page URL and content (CRITICAL for detecting bait-and-switch)
        if ad.landing_page_url:
            context_parts.append(f"\n=== LANDING PAGE ===")
            context_parts.append(f"URL: {ad.landing_page_url}")
            
            if landing_page_content:
                context_parts.append(f"\n--- CRAWLED CONTENT ---")
                context_parts.append(landing_page_content)
            elif landing_page_crawl_error:
                context_parts.append(f"(Unable to crawl: {landing_page_crawl_error})")
        
        # D. Image/Video URLs (judges should know what visuals are shown)
        if ad.image_url or ad.thumbnail_urls or ad.video_url:
            context_parts.append(f"\n=== MEDIA ===")
            if ad.image_url:
                context_parts.append(f"Primary Image: {ad.image_url}")
            if ad.thumbnail_urls:
                context_parts.append(f"All Images ({len(ad.thumbnail_urls)}): {', '.join(ad.thumbnail_urls[:5])}")
            if ad.video_url:
                context_parts.append(f"Video: {ad.video_url}")
        
        # E. Additional metadata
        if ad.country_targeting or ad.spend_range or ad.impressions_range:
            context_parts.append(f"\n=== TARGETING & REACH ===")
            if ad.country_targeting:
                context_parts.append(f"Countries: {', '.join(ad.country_targeting)}")
            if ad.spend_range:
                context_parts.append(f"Spend: {ad.spend_range}")
            if ad.impressions_range:
                context_parts.append(f"Impressions: {ad.impressions_range}")
        
        # Build the full content text for judges
        full_content = "\n".join(context_parts)
        
        # Build context hint with instructions for judges
        context_hint = f"""This is a Meta/Facebook advertisement. Analyze for policy compliance.

IMPORTANT: You have been provided with:
1. The full ad copy/text
2. The landing page URL and crawled content (if available)
3. Image/video URLs used in the ad
4. Advertiser information

When making your decision:
- Consider whether the ad copy matches what the landing page actually offers
- Check for bait-and-switch tactics (ad promises one thing, landing page sells another)
- Evaluate if the landing page has scam indicators (data collection forms, urgency tactics)
- Consider the advertiser's identity and legitimacy
"""
        
        # Run through judge engine with full context
        ad_request = PolicyLensRequest(
            content_text=full_content,
            context_hint=context_hint,
            selected_judges=request.selected_judges
        )
        
        response = await engine.evaluate_content(ad_request)
        
        # Categorize based on consensus
        category = categorize_by_consensus(
            response.synthesis.consensus_badge.value,
            response.synthesis.verdict_distribution
        )
        
        # Scam detection (include landing page content for better detection)
        combined_text = ad.text
        if landing_page_content:
            combined_text += "\n" + landing_page_content
        scam_fingerprints = detect_scam_fingerprints(combined_text)
        policy_violations = get_policy_violations(scam_fingerprints)
        harm_score = calculate_harm_score(scam_fingerprints, response.synthesis.verdict_distribution)
        
        # Build complete ad object with all context
        ad_with_full_context = MetaAd(
            ad_id=ad.ad_id,
            text=ad.text,
            advertiser_name=ad.advertiser_name,
            image_url=ad.image_url,
            page_id=ad.page_id,
            start_date=ad.start_date,
            is_active=ad.is_active,
            ad_library_url=build_ad_library_url(ad.ad_id),
            landing_page_url=ad.landing_page_url,
            landing_page_content=landing_page_content,
            landing_page_crawl_error=landing_page_crawl_error,
            video_url=ad.video_url,
            thumbnail_urls=ad.thumbnail_urls,
            country_targeting=ad.country_targeting,
            spend_range=ad.spend_range,
            impressions_range=ad.impressions_range
        )
        
        # Return full verdicts with all data
        full_verdicts = [
            {
                "judge_id": v.judge_id,
                "verdict_tier": v.verdict_tier.value,
                "confidence_score": v.confidence_score,
                "primary_policy_axis": v.primary_policy_axis,
                "reasoning_bullets": v.reasoning_bullets,
                "mitigating_factors": v.mitigating_factors,
                "refusal_to_instruct": v.refusal_to_instruct
            }
            for v in response.judge_verdicts
        ]
        
        return AdAnalysisResult(
            ad=ad_with_full_context,
            category=category,
            consensus_badge=response.synthesis.consensus_badge.value,
            verdict_distribution=response.synthesis.verdict_distribution,
            crux_narrative=response.synthesis.crux_narrative,
            judge_verdicts=full_verdicts,
            scam_fingerprints=[fp.model_dump() for fp in scam_fingerprints] if scam_fingerprints else None,
            policy_violations=[pv.model_dump() for pv in policy_violations] if policy_violations else None,
            harm_score=harm_score
        )
    
    try:
        # Run all ad analyses in parallel (landing pages already pre-crawled)
        results = await asyncio.gather(
            *[analyze_single_ad(ad) for ad in ads_to_analyze],
            return_exceptions=True
        )
        
        # Categorize results and collect stats
        violating = []
        mixed = []
        benign = []
        
        # NEW: Track aggregate statistics
        scam_type_counts: dict[str, int] = {}
        all_harm_scores: list[int] = []
        all_policy_violations: list[dict] = []
        
        for result in results:
            if isinstance(result, Exception):
                print(f"Error analyzing ad: {result}")
                continue
            
            # Collect scam type stats
            if result.scam_fingerprints:
                for fp in result.scam_fingerprints:
                    scam_type = fp.get("type", "unknown")
                    scam_type_counts[scam_type] = scam_type_counts.get(scam_type, 0) + 1
            
            # Collect harm scores
            if result.harm_score:
                all_harm_scores.append(result.harm_score)
            
            # Collect policy violations
            if result.policy_violations:
                for pv in result.policy_violations:
                    if pv not in all_policy_violations:
                        all_policy_violations.append(pv)
            
            if result.category == AdCategory.VIOLATING:
                violating.append(result)
            elif result.category == AdCategory.MIXED:
                mixed.append(result)
            else:
                benign.append(result)
        
        # NEW: Build scan statistics
        stats = ScanStats(
            scam_type_distribution=scam_type_counts,
            total_harm_score=sum(all_harm_scores) if all_harm_scores else 0,
            avg_harm_score=sum(all_harm_scores) / len(all_harm_scores) if all_harm_scores else 0.0,
            top_policy_violations=all_policy_violations[:5]  # Top 5 violations
        )
        
        response = AdScanResponse(
            keyword=request.keyword,
            total_ads=len(ads_to_analyze),
            violating=violating,
            mixed=mixed,
            benign=benign,
            scan_timestamp=datetime.utcnow().isoformat(),
            stats=stats
        )
        
        # Cache the results
        cache_results(cache_key, response)
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
