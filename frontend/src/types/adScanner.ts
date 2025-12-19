// Ad Scanner Types
// Types for the Meta Ads Library Scanner feature - ENHANCED for investigative journalism

export interface MetaAd {
    ad_id: string;
    text: string;
    advertiser_name: string;
    image_url?: string;
    page_id?: string;
    start_date?: string;
    is_active: boolean;
    // NEW: Additional metadata for investigations
    ad_library_url?: string;
    country_targeting?: string[];
    spend_range?: string;
    impressions_range?: string;
    // NEW: Landing page context
    landing_page_url?: string;
    landing_page_content?: string;
    landing_page_crawl_error?: string;
    // NEW: Video and thumbnails
    video_url?: string;
    thumbnail_urls?: string[];
}

export type AdCategoryType = 'violating' | 'mixed' | 'benign';

// NEW: Scam fingerprint types
export type ScamType =
    | 'crypto_scam'
    | 'fake_celebrity'
    | 'phishing'
    | 'mlm_scheme'
    | 'fake_weight_loss'
    | 'romance_scam'
    | 'fake_job'
    | 'urgency_scam'
    | 'fake_giveaway'
    | 'health_miracle'
    | 'get_rich_quick'
    | 'none';

export interface ScamFingerprint {
    type: ScamType;
    confidence: number;
    matched_patterns: string[];
    risk_score: number; // 1-10
}

// NEW: Meta policy violation mapping
export interface PolicyViolation {
    policy_code: string;        // e.g., "§4.2.3"
    policy_name: string;        // e.g., "Prohibited Financial Products"
    policy_section: string;     // e.g., "Financial Services"
    severity: 'critical' | 'high' | 'medium' | 'low';
    meta_policy_url: string;    // Link to Meta's policy documentation
}

export interface AdJudgeVerdict {
    judge_id: string;
    verdict_tier: string;
    confidence_score: number;
    primary_policy_axis: string;
    reasoning_bullets: string[];
    mitigating_factors: string[];
    refusal_to_instruct: boolean;
    // NEW: Policy mapping
    policy_violations?: PolicyViolation[];
}

export interface AdAnalysis {
    ad: MetaAd;
    category: AdCategoryType;
    consensus_badge: string;
    verdict_distribution: Record<string, number>;
    crux_narrative: string;
    judge_verdicts: AdJudgeVerdict[];
    // NEW: Scam detection
    scam_fingerprints?: ScamFingerprint[];
    harm_score?: number; // Composite risk score
    policy_violations?: PolicyViolation[];
}

export interface AdScanRequest {
    keyword: string;
    ads?: MetaAd[];
    selected_judges?: string[];
    max_ads?: number;
    use_real_ads?: boolean;
    refresh?: boolean;
}

export interface AdScanResponse {
    keyword: string;
    total_ads: number;
    violating: AdAnalysis[];
    mixed: AdAnalysis[];
    benign: AdAnalysis[];
    scan_timestamp: string;
    // NEW: Summary statistics
    stats?: {
        scam_type_distribution: Record<ScamType, number>;
        total_harm_score: number;
        avg_harm_score: number;
        top_policy_violations: PolicyViolation[];
    };
}

// NEW: Export types
export interface ExportOptions {
    format: 'pdf' | 'csv' | 'json';
    include_images: boolean;
    include_full_analysis: boolean;
}

// Ad Enrichment Types
export interface DomainInfo {
    domain: string;
    registration_date?: string;
    registrar?: string;
    country?: string;
    age_days?: number;
    is_newly_registered: boolean;
    ssl_valid?: boolean;
    error?: string;
}

export interface WebResearch {
    company_info?: string;
    scam_reports?: string;
    legitimacy_assessment?: string;
    red_flags: string[];
    green_flags: string[];
    sources: string[];
    confidence: 'low' | 'medium' | 'high';
    error?: string;
}

export interface AdEnrichment {
    ad_id: string;
    domain_info?: DomainInfo;
    web_research?: WebResearch;
    overall_risk_assessment: 'likely_scam' | 'suspicious' | 'unclear' | 'likely_legitimate' | 'unknown';
    enriched_at: string;
}
