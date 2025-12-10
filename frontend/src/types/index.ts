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

export interface RefereeDecision {
    winning_side: 'advocate' | 'defender' | 'tie';
    verdict_tier: VerdictTier;
    confidence_score: number;
    reasoning: string;
    key_factor: string;
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
// REQUEST/RESPONSE TYPES
// =============================================================================

export interface PolicyLensRequest {
    content_text: string;
    content_image_base64?: string;
    context_hint?: string;
    selected_judges: string[];
    run_debate?: boolean;
    run_cross_model?: boolean;
}

export interface PolicyLensResponse {
    request_id: string;
    content_preview: string;
    judge_verdicts: JudgeVerdict[];
    synthesis: SynthesisResult;
    debate?: DebateResult;
    cross_model?: CrossModelResult;
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
