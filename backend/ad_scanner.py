"""Meta Ads Library Scanner - Ad Analysis Module

Provides functionality to scan and analyze ads through the PolicyLens judge panel.
Enhanced with scam fingerprinting and policy violation mapping for investigative journalism.
"""
from enum import Enum
from typing import Optional, Literal
from pydantic import BaseModel, Field
import re


class AdCategory(str, Enum):
    """Classification based on judge consensus"""
    VIOLATING = "violating"    # Clear policy violations (REMOVE/AGE_GATE majority)
    MIXED = "mixed"            # Split consensus (SPLIT/CHAOS badges)
    BENIGN = "benign"          # Allowed content (ALLOW/LABEL majority)


class ScamType(str, Enum):
    """Known scam fingerprint categories"""
    CRYPTO_SCAM = "crypto_scam"
    FAKE_CELEBRITY = "fake_celebrity"
    PHISHING = "phishing"
    MLM_SCHEME = "mlm_scheme"
    FAKE_WEIGHT_LOSS = "fake_weight_loss"
    ROMANCE_SCAM = "romance_scam"
    FAKE_JOB = "fake_job"
    URGENCY_SCAM = "urgency_scam"
    FAKE_GIVEAWAY = "fake_giveaway"
    HEALTH_MIRACLE = "health_miracle"
    GET_RICH_QUICK = "get_rich_quick"
    NONE = "none"


class PolicyViolation(BaseModel):
    """Maps to specific Meta Advertising Standards"""
    policy_code: str = Field(..., description="Policy section code, e.g., §4.2.3")
    policy_name: str = Field(..., description="Human-readable policy name")
    policy_section: str = Field(..., description="Policy category section")
    severity: Literal["critical", "high", "medium", "low"] = Field(default="medium")
    meta_policy_url: str = Field(
        default="https://www.facebook.com/policies/ads/",
        description="Link to Meta's policy documentation"
    )


class ScamFingerprint(BaseModel):
    """Detected scam pattern"""
    type: ScamType
    confidence: float = Field(..., ge=0, le=1, description="Confidence 0-1")
    matched_patterns: list[str] = Field(default_factory=list)
    risk_score: int = Field(..., ge=1, le=10, description="Risk severity 1-10")


# =============================================================================
# SCAM FINGERPRINT DATABASE - Known scam patterns
# =============================================================================

SCAM_PATTERNS = {
    ScamType.CRYPTO_SCAM: {
        "patterns": [
            r"(?i)crypto\s*(giveaway|airdrop)",
            r"(?i)send\s*[\d.]+\s*(?:btc|eth|bitcoin|ethereum)",
            r"(?i)double\s*your\s*(?:btc|crypto|bitcoin)",
            r"(?i)bitcoin\s*(?:investment|opportunity)",
            r"(?i)guaranteed\s*(?:returns?|profit)",
            r"(?i)(?:10x|100x)\s*(?:returns?|gains?)",
            r"(?i)next\s*(?:big|huge)\s*crypto",
        ],
        "risk_score": 9,
        "policy": PolicyViolation(
            policy_code="§4.2",
            policy_name="Prohibited Financial Products and Services",
            policy_section="Financial Services",
            severity="critical",
            meta_policy_url="https://www.facebook.com/policies/ads/prohibited_content/financial_products_and_services"
        )
    },
    ScamType.FAKE_CELEBRITY: {
        "patterns": [
            r"(?i)elon\s*musk\s*(?:reveals?|announces?|says?|just)",
            r"(?i)(?:breaking|urgent):\s*(?:elon|trump|bezos|gates)",
            r"(?i)celebrity\s*(?:endorsed?|secret|reveals?)",
            r"(?i)(?:billionaire|ceo)\s*(?:reveals?|secret)",
            r"(?i)(?:oprah|ellen|dr\.?\s*oz)\s*(?:recommends?|uses?)",
        ],
        "risk_score": 9,
        "policy": PolicyViolation(
            policy_code="§3.2",
            policy_name="Misleading or False Content",
            policy_section="Deceptive Practices",
            severity="critical",
            meta_policy_url="https://www.facebook.com/policies/ads/prohibited_content/misinformation"
        )
    },
    ScamType.PHISHING: {
        "patterns": [
            r"(?i)(?:verify|confirm)\s*your\s*(?:account|identity)",
            r"(?i)(?:suspended|locked|limited)\s*account",
            r"(?i)click\s*(?:here|now)\s*(?:to\s*)?(?:verify|unlock|confirm)",
            r"(?i)(?:unusual|suspicious)\s*(?:activity|login)",
            r"(?i)pay\s*(?:with|using)\s*gift\s*card",
        ],
        "risk_score": 10,
        "policy": PolicyViolation(
            policy_code="§1.1",
            policy_name="Illegal Products and Services",
            policy_section="Prohibited Content",
            severity="critical",
            meta_policy_url="https://www.facebook.com/policies/ads/prohibited_content"
        )
    },
    ScamType.FAKE_WEIGHT_LOSS: {
        "patterns": [
            r"(?i)lost?\s*\d+\s*(?:lbs?|pounds?|kg)\s*in\s*\d+\s*(?:days?|weeks?)",
            r"(?i)(?:without|no)\s*(?:diet|exercise|working\s*out)",
            r"(?i)(?:burn|melt)\s*(?:fat|belly)",
            r"(?i)one\s*(?:simple|weird)\s*trick",
            r"(?i)(?:before|after)\s*(?:transformation|results?)",
        ],
        "risk_score": 7,
        "policy": PolicyViolation(
            policy_code="§5.1",
            policy_name="Health and Wellness Claims",
            policy_section="Restricted Content",
            severity="high",
            meta_policy_url="https://www.facebook.com/policies/ads/restricted_content/weight_loss"
        )
    },
    ScamType.HEALTH_MIRACLE: {
        "patterns": [
            r"(?i)doctors?\s*(?:don'?t\s*want|hate\s*this|won'?t\s*tell)",
            r"(?i)big\s*pharma\s*(?:hides?|doesn'?t\s*want)",
            r"(?i)cure[sd]?\s*(?:diabetes|cancer|covid|arthritis)",
            r"(?i)(?:miracle|secret|ancient)\s*(?:cure|remedy|treatment)",
            r"(?i)fda\s*(?:approved|banned)\s*(?:this|secret)",
        ],
        "risk_score": 9,
        "policy": PolicyViolation(
            policy_code="§5.2",
            policy_name="Unsubstantiated Health Claims",
            policy_section="Restricted Content",
            severity="critical",
            meta_policy_url="https://www.facebook.com/policies/ads/restricted_content/health"
        )
    },
    ScamType.GET_RICH_QUICK: {
        "patterns": [
            r"(?i)made?\s*\$[\d,]+\s*(?:in|within)\s*\d+\s*(?:days?|hours?|weeks?)",
            r"(?i)(?:free|secret)\s*(?:money|cash|income)\s*(?:method|system)",
            r"(?i)(?:banks?|government)\s*(?:don'?t\s*want|hates?\s*this)",
            r"(?i)passive\s*income\s*(?:secret|system|method)",
            r"(?i)(?:quit|leave)\s*(?:your|my)\s*(?:job|9.?5)",
            r"(?i)dm\s*(?:me|now)\s*['\"']?(?:money|cash|info)",
        ],
        "risk_score": 8,
        "policy": PolicyViolation(
            policy_code="§4.3",
            policy_name="Misleading Financial Claims",
            policy_section="Financial Services",
            severity="high",
            meta_policy_url="https://www.facebook.com/policies/ads/prohibited_content/misleading_claims"
        )
    },
    ScamType.URGENCY_SCAM: {
        "patterns": [
            r"(?i)(?:urgent|warning|alert)[:,]?\s*(?:your|this)",
            r"(?i)(?:expires?|ends?)\s*(?:in\s*)?\d+\s*(?:hours?|minutes?)",
            r"(?i)(?:act|click|buy)\s*(?:now|fast|immediately)",
            r"(?i)(?:limited|last)\s*(?:time|chance|spots?|offer)",
            r"(?i)(?:before\s*)?(?:they|it)\s*(?:take[s]?\s*(?:this|it)\s*down|runs?\s*out)",
        ],
        "risk_score": 6,
        "policy": PolicyViolation(
            policy_code="§3.4",
            policy_name="Pressure Tactics",
            policy_section="Deceptive Practices",
            severity="medium",
            meta_policy_url="https://www.facebook.com/policies/ads/prohibited_content/low_quality"
        )
    },
    ScamType.FAKE_GIVEAWAY: {
        "patterns": [
            r"(?i)(?:free|giving\s*away)\s*(?:iphone|macbook|tesla|ps5|xbox)",
            r"(?i)(?:won|winner|selected)\s*(?:for|of)\s*(?:a|the)\s*(?:prize|giveaway)",
            r"(?i)(?:claim|collect)\s*your\s*(?:prize|reward|gift)",
            r"(?i)congratulations[!,]?\s*you'?(?:ve|re)",
        ],
        "risk_score": 8,
        "policy": PolicyViolation(
            policy_code="§3.1",
            policy_name="Deceptive Promotions",
            policy_section="Deceptive Practices",
            severity="high",
            meta_policy_url="https://www.facebook.com/policies/ads/prohibited_content/misleading_claims"
        )
    },
    ScamType.FAKE_JOB: {
        "patterns": [
            r"(?i)(?:no\s*experience|anyone\s*can)\s*(?:needed|required|do\s*this)",
            r"(?i)\$\d+[-/]\d+\s*(?:per\s*)?(?:hr|hour)",
            r"(?i)(?:work|earn)\s*(?:from\s*)?home\s*(?:today|now)",
            r"(?i)(?:hiring|looking\s*for)\s*(?:immediately|now|today)",
            r"(?i)(?:data\s*entry|typing)\s*(?:job|work|position)",
        ],
        "risk_score": 5,
        "policy": PolicyViolation(
            policy_code="§6.1",
            policy_name="Employment Opportunities",
            policy_section="Restricted Content",
            severity="medium",
            meta_policy_url="https://www.facebook.com/policies/ads/restricted_content/employment"
        )
    },
    ScamType.MLM_SCHEME: {
        "patterns": [
            r"(?i)(?:join\s*my|become\s*a)\s*team",
            r"(?i)(?:financial|time)\s*freedom",
            r"(?i)(?:boss|bossbabe|ceo)\s*(?:babe|life|mode)",
            r"(?i)residual\s*(?:income|earnings?)",
            r"(?i)(?:network|multi.?level)\s*marketing",
        ],
        "risk_score": 6,
        "policy": PolicyViolation(
            policy_code="§4.4",
            policy_name="Multi-Level Marketing",
            policy_section="Financial Services",
            severity="medium",
            meta_policy_url="https://www.facebook.com/policies/ads/restricted_content/mlm"
        )
    },
    ScamType.ROMANCE_SCAM: {
        "patterns": [
            r"(?i)(?:lonely|single)\s*(?:ladies?|women|men|guys?)",
            r"(?i)(?:hot|beautiful)\s*(?:singles?|women|ladies?)\s*(?:near|in)\s*(?:your|my)\s*area",
            r"(?i)(?:meet|date|chat\s*with)\s*(?:local|hot|beautiful)",
        ],
        "risk_score": 7,
        "policy": PolicyViolation(
            policy_code="§2.3",
            policy_name="Adult Content and Dating",
            policy_section="Restricted Content",
            severity="high",
            meta_policy_url="https://www.facebook.com/policies/ads/restricted_content/dating"
        )
    },
}


def detect_scam_fingerprints(ad_text: str) -> list[ScamFingerprint]:
    """
    Analyze ad text for known scam patterns.
    Returns list of detected scam fingerprints with confidence scores.
    """
    fingerprints = []
    text_lower = ad_text.lower()
    
    for scam_type, config in SCAM_PATTERNS.items():
        patterns = config["patterns"]
        matched = []
        
        for pattern in patterns:
            if re.search(pattern, ad_text, re.IGNORECASE):
                matched.append(pattern)
        
        if matched:
            # Confidence based on number of patterns matched
            confidence = min(1.0, len(matched) / 3)  # 3+ patterns = 100% confidence
            fingerprints.append(ScamFingerprint(
                type=scam_type,
                confidence=confidence,
                matched_patterns=matched,
                risk_score=config["risk_score"]
            ))
    
    # Sort by risk score (highest first)
    fingerprints.sort(key=lambda x: x.risk_score, reverse=True)
    return fingerprints


def get_policy_violations(scam_fingerprints: list[ScamFingerprint]) -> list[PolicyViolation]:
    """Extract unique policy violations from detected scam fingerprints."""
    violations = []
    seen_codes = set()
    
    for fp in scam_fingerprints:
        if fp.type in SCAM_PATTERNS:
            policy = SCAM_PATTERNS[fp.type]["policy"]
            if policy.policy_code not in seen_codes:
                violations.append(policy)
                seen_codes.add(policy.policy_code)
    
    return violations


def calculate_harm_score(
    scam_fingerprints: list[ScamFingerprint],
    verdict_distribution: dict[str, int]
) -> int:
    """
    Calculate composite harm score (1-100) based on:
    - Scam fingerprint risk scores
    - Judge verdict distribution
    """
    base_score = 0
    
    # Add scam fingerprint contributions (max 50 points)
    if scam_fingerprints:
        max_risk = max(fp.risk_score for fp in scam_fingerprints)
        avg_risk = sum(fp.risk_score for fp in scam_fingerprints) / len(scam_fingerprints)
        base_score += int((max_risk * 3 + avg_risk * 2) / 5 * 5)  # Scale to 50
    
    # Add judge verdict contributions (max 50 points)
    total_votes = sum(verdict_distribution.values())
    if total_votes > 0:
        remove_votes = verdict_distribution.get("REMOVE", 0)
        age_gate_votes = verdict_distribution.get("AGE_GATE", 0)
        restrictive_ratio = (remove_votes + age_gate_votes * 0.7) / total_votes
        base_score += int(restrictive_ratio * 50)
    
    return min(100, max(1, base_score))


def build_ad_library_url(ad_id: str) -> str:
    """Build a direct link to the ad in Meta's Ad Library."""
    return f"https://www.facebook.com/ads/library/?id={ad_id}"


class MetaAd(BaseModel):
    """Represents an ad from Meta Ads Library"""
    ad_id: str = Field(..., description="Unique identifier for the ad")
    text: str = Field(..., description="Ad copy/text content")
    advertiser_name: str = Field(..., description="Name of the advertiser/page")
    image_url: Optional[str] = Field(None, description="URL to ad creative image")
    page_id: Optional[str] = Field(None, description="Meta Page ID")
    start_date: Optional[str] = Field(None, description="When the ad started running")
    is_active: bool = Field(default=True, description="Whether the ad is currently active")
    # NEW: Enhanced metadata for investigations
    ad_library_url: Optional[str] = Field(None, description="Direct link to Meta Ad Library")
    country_targeting: Optional[list[str]] = Field(None, description="Countries targeted")
    spend_range: Optional[str] = Field(None, description="Estimated spend range")
    impressions_range: Optional[str] = Field(None, description="Estimated impressions range")
    # NEW: Landing page context for comprehensive analysis
    landing_page_url: Optional[str] = Field(None, description="Destination URL when clicking the ad")
    landing_page_content: Optional[str] = Field(None, description="Crawled/extracted text from landing page")
    landing_page_crawl_error: Optional[str] = Field(None, description="Error message if crawl failed")
    # NEW: Video and additional media
    video_url: Optional[str] = Field(None, description="URL to video creative if ad is video")
    thumbnail_urls: Optional[list[str]] = Field(None, description="All thumbnail/image URLs for the ad")


class AdScanRequest(BaseModel):
    """Request to scan ads for a keyword"""
    keyword: str = Field(..., description="Search keyword for Meta Ads Library")
    ads: list[MetaAd] = Field(default_factory=list, description="Ads to analyze (demo mode)")
    selected_judges: list[str] = Field(
        default=["meta_ads_integrity", "ftc_consumer_protection", "youtube_scams_expert", "tiktok_scams_expert", "x_twitter"],
        description="Judges to use for analysis"
    )
    max_ads: int = Field(default=50, description="Maximum ads to analyze (up to 100)")
    use_real_ads: bool = Field(default=True, description="Fetch real ads from Meta Ads Library")
    refresh: bool = Field(default=False, description="Bypass cache and fetch fresh ads")


class AdAnalysisResult(BaseModel):
    """Result of analyzing a single ad - Enhanced for investigative journalism"""
    ad: MetaAd
    category: AdCategory
    consensus_badge: str  # UNANIMOUS, MAJORITY, SPLIT, CHAOS
    verdict_distribution: dict[str, int]
    crux_narrative: str
    judge_verdicts: list[dict]  # Simplified verdict info for display
    # NEW: Scam detection
    scam_fingerprints: Optional[list[dict]] = Field(default=None, description="Detected scam patterns")
    policy_violations: Optional[list[dict]] = Field(default=None, description="Specific Meta policy violations")
    harm_score: Optional[int] = Field(default=None, ge=1, le=100, description="Composite harm score 1-100")
    

class ScanStats(BaseModel):
    """Summary statistics for a scan"""
    scam_type_distribution: dict[str, int] = Field(default_factory=dict)
    total_harm_score: int = 0
    avg_harm_score: float = 0.0
    top_policy_violations: list[dict] = Field(default_factory=list)


class AdScanResponse(BaseModel):
    """Complete response from ad scanning - Enhanced"""
    keyword: str
    total_ads: int
    violating: list[AdAnalysisResult]
    mixed: list[AdAnalysisResult]
    benign: list[AdAnalysisResult]
    scan_timestamp: str
    # NEW: Summary statistics
    stats: Optional[ScanStats] = Field(default=None, description="Aggregate statistics")



# =============================================================================
# SAMPLE ADS FOR DEMO MODE
# =============================================================================

SAMPLE_ADS = [
    # Potentially problematic: Addiction recovery with emotional manipulation
    MetaAd(
        ad_id="sample_001",
        text="Here's why addicted children don't receive our love – but using this new approach you can safely guide them to recovery (while regaining peace in your home and heart)... It's not because they don't want to get help... It's not because you're not giving them enough love or support....",
        advertiser_name="Barbara Decker",
        start_date="December 2025",
        is_active=True
    ),
    
    # Potentially problematic: Emotional health claims
    MetaAd(
        ad_id="sample_002",
        text="How moms of addicted adult children stop the strain on their marriages - and feel fully supported again (while finally feeling like good moms and partners). It's not because they don't want to get help... It's not because you're not giving them enough love or support...",
        advertiser_name="Barbara Decker",
        start_date="December 2025",
        is_active=True
    ),
    
    # Likely problematic: Get rich quick
    MetaAd(
        ad_id="sample_003",
        text="🚀 I made $47,000 in just 3 days using this FREE secret method that banks don't want you to know about! No experience needed - anyone can do this from home. DM me 'MONEY' for the free guide!",
        advertiser_name="Crypto Wealth Secrets",
        start_date="December 2025",
        is_active=True
    ),
    
    # Likely problematic: Health miracle claims
    MetaAd(
        ad_id="sample_004",
        text="🌿 DOCTORS HATE THIS! One weird trick discovered by a mom CURES diabetes in just 7 days. Big Pharma is trying to hide this natural remedy. Click before they take this down!",
        advertiser_name="Natural Health Secrets",
        start_date="December 2025",
        is_active=True
    ),
    
    # Borderline: Weight loss claims
    MetaAd(
        ad_id="sample_005",
        text="I lost 50 lbs in 30 days without exercise or diet changes! This celebrity-endorsed supplement is finally available to the public. See my before/after transformation. Limited time: 70% off!",
        advertiser_name="SlimFast Solutions",
        start_date="December 2025",
        is_active=True
    ),
    
    # Borderline: Financial services
    MetaAd(
        ad_id="sample_006",
        text="Bad credit? No problem! Get approved for a $10,000 personal loan in 60 seconds - no credit check required. Funds in your account today. Apply now before this offer expires!",
        advertiser_name="QuickCash Loans",
        start_date="December 2025",
        is_active=True
    ),
    
    # Likely benign: Standard product ad
    MetaAd(
        ad_id="sample_007",
        text="☕ Start your morning right with our organic fair-trade coffee. Roasted fresh weekly, shipped directly to your door. Use code FIRST20 for 20% off your first order.",
        advertiser_name="Mountain Roasters Coffee Co.",
        start_date="December 2025",
        is_active=True
    ),
    
    # Likely benign: Educational service
    MetaAd(
        ad_id="sample_008",
        text="Learn Spanish in 15 minutes a day! Our app uses proven spaced repetition to help you become conversational in just 3 months. Join 10 million learners worldwide. Free to start.",
        advertiser_name="LingoLearn App",
        start_date="December 2025",
        is_active=True
    ),
    
    # Likely benign: E-commerce 
    MetaAd(
        ad_id="sample_009",
        text="Winter Sale: Up to 50% off on all outerwear. Premium quality jackets and coats for the whole family. Free shipping on orders over $75. Shop now at our website.",
        advertiser_name="NorthWear Clothing",
        start_date="December 2025",
        is_active=True
    ),
    
    # Borderline: Work from home
    MetaAd(
        ad_id="sample_010",
        text="Looking for remote work? Companies are hiring data entry specialists - work from home, flexible hours, $25-40/hr. No experience required, we provide training. Apply today!",
        advertiser_name="RemoteJobs Hub",
        start_date="December 2025",
        is_active=True
    ),
    
    # Potentially problematic: Urgency + gift card scam signals
    MetaAd(
        ad_id="sample_011",
        text="⚠️ URGENT: Your package cannot be delivered! Click here to pay the $1.99 shipping fee with gift card to release your package. Offer expires in 24 hours or package will be returned!",
        advertiser_name="Delivery Updates",
        start_date="December 2025",
        is_active=True
    ),
    
    # Potentially problematic: Celebrity impersonation
    MetaAd(
        ad_id="sample_012",
        text="BREAKING: Elon Musk just announced a new crypto giveaway! Send 0.1 BTC and receive 1 BTC back instantly. This is 100% real - limited to first 1000 participants!",
        advertiser_name="Elon Musk Official",
        start_date="December 2025",
        is_active=True
    ),
]


def get_sample_ads_by_keyword(keyword: str, max_ads: int = 10) -> list[MetaAd]:
    """
    Filter sample ads by keyword (case-insensitive substring match).
    For demo purposes - in production this would call Meta Ads Library API.
    """
    keyword_lower = keyword.lower()
    matching = [
        ad for ad in SAMPLE_ADS
        if keyword_lower in ad.text.lower() or keyword_lower in ad.advertiser_name.lower()
    ]
    
    # If no exact matches, return random sample
    if not matching:
        return SAMPLE_ADS[:max_ads]
    
    return matching[:max_ads]


def categorize_by_consensus(
    consensus_badge: str,
    verdict_distribution: dict[str, int]
) -> AdCategory:
    """
    Categorize an ad based on judge consensus.
    
    Logic:
    - VIOLATING: Majority voted REMOVE or AGE_GATE
    - BENIGN: Majority voted ALLOW or LABEL  
    - MIXED: Split or chaotic verdicts
    """
    total = sum(verdict_distribution.values())
    if total == 0:
        return AdCategory.MIXED
    
    # Count restrictive vs permissive verdicts
    restrictive = verdict_distribution.get("REMOVE", 0) + verdict_distribution.get("AGE_GATE", 0)
    permissive = verdict_distribution.get("ALLOW", 0) + verdict_distribution.get("LABEL", 0)
    
    # Use 50% threshold for categorization
    if restrictive > total / 2:
        return AdCategory.VIOLATING
    elif permissive > total / 2:
        return AdCategory.BENIGN
    else:
        return AdCategory.MIXED
