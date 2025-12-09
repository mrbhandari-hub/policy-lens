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

export interface PolicyLensRequest {
    content_text: string;
    content_image_base64?: string;
    context_hint?: string;
    selected_judges: string[];
}

export interface PolicyLensResponse {
    request_id: string;
    content_preview: string;
    judge_verdicts: JudgeVerdict[];
    synthesis: SynthesisResult;
}

export interface JudgeInfo {
    id: string;
    name: string;
    description: string;
}
