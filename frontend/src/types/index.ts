// PolicyLens v2.0 - TypeScript Types

export type VerdictTier = 'REMOVE' | 'AGE_GATE' | 'REDUCE_REACH' | 'LABEL' | 'ALLOW';

export type ConsensusBadge = 'UNANIMOUS' | 'MAJORITY' | 'SPLIT' | 'CHAOS';

export interface JudgeVerdict {
    judge_id: string;
    verdict_tier: VerdictTier;
    confidence_score: number;
    primary_policy_axis: string;
    reasoning_bullets: string[];
    mitigating_factors: string[];
    refusal_to_instruct: boolean;
}

export interface SynthesisResult {
    consensus_badge: ConsensusBadge;
    verdict_distribution: Record<string, number>;
    crux_narrative: string;
    primary_tension: string;
    watermark: string;
}

// =============================================================================
// DEBATE MODE TYPES
// =============================================================================

export interface DebateArgument {
    role: 'advocate' | 'defender';
    position: 'REMOVE' | 'ALLOW';
    argument_summary: string;
    key_points: string[];
    strongest_evidence: string;
    acknowledged_weaknesses: string[];
}

export type DecisionDifficulty = 'clear' | 'moderate' | 'difficult' | 'highly_ambiguous';

export interface RefereeDecision {
    winning_side: 'advocate' | 'defender' | 'tie';
    verdict_tier: VerdictTier;
    confidence_score: number;
    reasoning: string;
    key_factor: string;
    decision_difficulty?: DecisionDifficulty;
    ambiguity_factors?: string[];
}

export interface DebateResult {
    advocate: DebateArgument;
    defender: DebateArgument;
    referee: RefereeDecision;
}

// =============================================================================
// CROSS-MODEL AGREEMENT TYPES
// =============================================================================

export type AgreementLevel = 'full' | 'partial' | 'disagreement';

export interface ModelVerdict {
    model_family: 'openai' | 'anthropic' | 'google';
    model_id: string;
    verdict_tier: VerdictTier;
    confidence_score: number;
    reasoning_summary: string;
    key_policy_concern: string;
}

export interface CrossModelResult {
    verdicts: ModelVerdict[];
    agreement_level: AgreementLevel;
    escalation_recommended: boolean;
    disagreement_summary: string | null;
}

// =============================================================================
// ADVANCED DEEP DIVE TYPES
// =============================================================================

// Counterfactual Analysis
export interface CounterfactualScenario {
    change_description: string;
    new_verdict: VerdictTier;
    confidence_impact: string;
    explanation: string;
}

export interface CounterfactualResult {
    original_verdict: VerdictTier;
    flip_to_allow: CounterfactualScenario[];
    flip_to_remove: CounterfactualScenario[];
    most_sensitive_factor: string;
    boundary_clarity: 'clear_boundaries' | 'fuzzy_boundaries' | 'knife_edge';
}

// Red Team Analysis
export interface RedTeamVulnerability {
    attack_vector: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    example_exploitation: string;
    mitigation: string;
}

export interface RedTeamResult {
    evasion_techniques: string[];
    context_manipulations: string[];
    vulnerabilities: RedTeamVulnerability[];
    overall_robustness: 'robust' | 'moderate' | 'fragile';
    recommendations: string[];
}

// Temporal Sensitivity
export interface TemporalContext {
    context_name: string;
    verdict: VerdictTier;
    confidence: number;
    reasoning: string;
}

export interface TemporalResult {
    baseline_verdict: VerdictTier;
    temporal_contexts: TemporalContext[];
    most_sensitive_context: string;
    time_decay: string;
    recommendation: string;
}

// Appeal Anticipation
export interface AppealArgument {
    argument: string;
    strength: 'weak' | 'moderate' | 'strong' | 'compelling';
    likely_response: string;
    success_probability: number;
}

export interface AppealResult {
    predicted_appeals: AppealArgument[];
    strongest_appeal: string;
    overall_appeal_success_rate: number;
    missing_context: string[];
    recommended_clarifications: string[];
}

// =============================================================================
// REQUEST/RESPONSE TYPES
// =============================================================================

export interface PolicyLensRequest {
    content_text: string;
    content_image_base64?: string;
    context_hint?: string;
    selected_judges: string[];
    // Original deep dives
    run_debate?: boolean;
    run_cross_model?: boolean;
    // New advanced deep dives
    run_counterfactual?: boolean;
    run_red_team?: boolean;
    run_temporal?: boolean;
    run_appeal?: boolean;
}

export interface PolicyLensResponse {
    request_id: string;
    content_preview: string;
    judge_verdicts: JudgeVerdict[];
    synthesis: SynthesisResult;
    // Original deep dives
    debate?: DebateResult;
    cross_model?: CrossModelResult;
    // New advanced deep dives
    counterfactual?: CounterfactualResult;
    red_team?: RedTeamResult;
    temporal?: TemporalResult;
    appeal?: AppealResult;
}

export interface JudgeInfo {
    id: string;
    name: string;
    description: string;
    category: string;
}

export interface JudgeCategory {
    name: string;
    description: string;
    icon: string;
    order: number;
}
