"""PolicyLens v2.0 - Core Data Models"""
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class VerdictTier(str, Enum):
    """The Mitigation Ladder - Beyond binary decisions"""
    REMOVE = "REMOVE"
    AGE_GATE = "AGE_GATE"
    REDUCE_REACH = "REDUCE_REACH"
    LABEL = "LABEL"
    ALLOW = "ALLOW"


class JudgeVerdict(BaseModel):
    """Structured output from each simulated judge"""
    judge_id: str = Field(..., description="Unique identifier for the judge persona")
    verdict_tier: VerdictTier = Field(..., description="The mitigation action recommended")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Confidence in verdict (0-1)")
    primary_policy_axis: str = Field(..., description="Main policy area triggered (e.g., 'Hate Speech / Dehumanization')")
    reasoning_bullets: list[str] = Field(..., description="Key reasoning points for the verdict")
    mitigating_factors: list[str] = Field(default_factory=list, description="Factors that reduce severity")
    refusal_to_instruct: bool = Field(default=True, description="Confirms no evasion advice was given")


class ConsensusBadge(str, Enum):
    """Classification of agreement level among judges"""
    UNANIMOUS = "UNANIMOUS"
    MAJORITY = "MAJORITY"  
    SPLIT = "SPLIT"
    CHAOS = "CHAOS"


class SynthesisResult(BaseModel):
    """Output from the Meta-Judge synthesis layer"""
    consensus_badge: ConsensusBadge
    verdict_distribution: dict[str, int] = Field(
        ..., description="Count of judges per verdict tier"
    )
    crux_narrative: str = Field(
        ..., description="The key disagreement insight"
    )
    primary_tension: str = Field(
        ..., description="Main axis of disagreement (e.g., 'Intent vs Harm')"
    )
    watermark: str = Field(
        default="⚠️ Simulated AI Verdict - Not a binding policy decision",
        description="Required safety watermark"
    )


# =============================================================================
# DEBATE MODE MODELS
# =============================================================================

class DebateArgument(BaseModel):
    """Argument from either the Advocate (for takedown) or Defender (for allowing)"""
    role: str = Field(..., description="'advocate' or 'defender'")
    position: str = Field(..., description="'REMOVE' or 'ALLOW'")
    argument_summary: str = Field(..., description="One-sentence summary of the argument")
    key_points: list[str] = Field(..., description="Main supporting arguments")
    strongest_evidence: str = Field(..., description="The single most compelling piece of evidence")
    acknowledged_weaknesses: list[str] = Field(default_factory=list, description="Honest acknowledgment of argument weaknesses")


class DecisionDifficulty(str, Enum):
    """How difficult was this decision for the referee"""
    CLEAR = "clear"              # One side clearly won, easy call
    MODERATE = "moderate"        # Some tension but a defensible decision
    DIFFICULT = "difficult"      # Close call, reasonable people could disagree
    HIGHLY_AMBIGUOUS = "highly_ambiguous"  # Genuinely too close to call with confidence


class RefereeDecision(BaseModel):
    """The Referee's verdict after hearing both sides"""
    winning_side: str = Field(..., description="'advocate', 'defender', or 'tie'")
    verdict_tier: VerdictTier = Field(..., description="Final recommended action")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Confidence in the decision")
    reasoning: str = Field(..., description="Explanation of the decision")
    key_factor: str = Field(..., description="The decisive factor that tipped the balance")
    decision_difficulty: DecisionDifficulty = Field(
        default=DecisionDifficulty.MODERATE,
        description="How difficult was this call to make"
    )
    ambiguity_factors: list[str] = Field(
        default_factory=list,
        description="What made this decision difficult (if applicable)"
    )


class DebateResult(BaseModel):
    """Complete result of the Pro/Con debate"""
    advocate: DebateArgument
    defender: DebateArgument
    referee: RefereeDecision


# =============================================================================
# CROSS-MODEL AGREEMENT MODELS
# =============================================================================

class ModelVerdict(BaseModel):
    """Verdict from a single model family"""
    model_family: str = Field(..., description="'openai', 'anthropic', or 'google'")
    model_id: str = Field(..., description="Specific model used (e.g., 'gpt-4o', 'claude-sonnet-4-20250514', 'gemini-2.0-flash')")
    verdict_tier: VerdictTier = Field(..., description="The recommended action")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Confidence in verdict")
    reasoning_summary: str = Field(..., description="Brief explanation of the verdict")
    key_policy_concern: str = Field(..., description="Primary policy area of concern")


class AgreementLevel(str, Enum):
    """Classification of cross-model agreement"""
    FULL = "full"
    PARTIAL = "partial"
    DISAGREEMENT = "disagreement"


class CrossModelResult(BaseModel):
    """Result of cross-model agreement analysis"""
    verdicts: list[ModelVerdict] = Field(..., description="Verdicts from each model family")
    agreement_level: AgreementLevel = Field(..., description="Level of agreement between models")
    escalation_recommended: bool = Field(..., description="Whether human review is recommended due to disagreement")
    disagreement_summary: Optional[str] = Field(None, description="Explanation of where models disagree")


# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================

# =============================================================================
# ADVANCED DEEP DIVE MODELS
# =============================================================================

class CounterfactualScenario(BaseModel):
    """A single counterfactual scenario"""
    change_description: str = Field(..., description="What would need to change")
    new_verdict: VerdictTier = Field(..., description="Resulting verdict after the change")
    confidence_impact: str = Field(..., description="How this affects confidence")
    explanation: str = Field(..., description="Why this change matters")


class CounterfactualResult(BaseModel):
    """Counterfactual analysis: what would change the verdict"""
    original_verdict: VerdictTier = Field(..., description="The baseline verdict")
    flip_to_allow: list[CounterfactualScenario] = Field(..., description="Changes that would make content allowed")
    flip_to_remove: list[CounterfactualScenario] = Field(..., description="Changes that would require removal")
    most_sensitive_factor: str = Field(..., description="The factor the verdict is most sensitive to")
    boundary_clarity: str = Field(..., description="'clear_boundaries' | 'fuzzy_boundaries' | 'knife_edge'")


class RedTeamVulnerability(BaseModel):
    """A single vulnerability identified by red team"""
    attack_vector: str = Field(..., description="How bad actors could exploit this")
    severity: str = Field(..., description="'low' | 'medium' | 'high' | 'critical'")
    example_exploitation: str = Field(..., description="Concrete example of the exploit")
    mitigation: str = Field(..., description="How to defend against this")


class RedTeamResult(BaseModel):
    """Red team adversarial analysis"""
    evasion_techniques: list[str] = Field(..., description="Ways content could evade detection")
    context_manipulations: list[str] = Field(..., description="Context changes that would flip verdict")
    vulnerabilities: list[RedTeamVulnerability] = Field(..., description="Identified vulnerabilities")
    overall_robustness: str = Field(..., description="'robust' | 'moderate' | 'fragile'")
    recommendations: list[str] = Field(..., description="How to improve detection")


class ConsistencySample(BaseModel):
    """A single sample from consistency sampling"""
    verdict: VerdictTier
    confidence: float
    key_reasoning: str


class SelfConsistencyResult(BaseModel):
    """Self-consistency sampling results"""
    samples: list[ConsistencySample] = Field(..., description="Individual sample results")
    verdict_distribution: dict[str, int] = Field(..., description="Count of each verdict")
    majority_verdict: VerdictTier = Field(..., description="Most common verdict")
    consistency_score: float = Field(..., ge=0.0, le=1.0, description="How consistent the samples are (1.0 = unanimous)")
    variance_factors: list[str] = Field(..., description="What caused variation between samples")
    recommendation: str = Field(..., description="Human escalation recommendation based on consistency")


class TemporalContext(BaseModel):
    """Verdict in a specific temporal context"""
    context_name: str = Field(..., description="Name of the temporal context")
    verdict: VerdictTier = Field(..., description="Verdict in this context")
    confidence: float = Field(..., ge=0.0, le=1.0)
    reasoning: str = Field(..., description="Why the verdict changes in this context")


class TemporalResult(BaseModel):
    """Temporal sensitivity analysis"""
    baseline_verdict: VerdictTier = Field(..., description="Normal context verdict")
    temporal_contexts: list[TemporalContext] = Field(..., description="How verdict changes in different times")
    most_sensitive_context: str = Field(..., description="The context where verdict changes most")
    time_decay: str = Field(..., description="How verdict might change over time")
    recommendation: str = Field(..., description="Context-aware enforcement recommendation")


class AppealArgument(BaseModel):
    """A predicted appeal argument"""
    argument: str = Field(..., description="The appeal argument")
    strength: str = Field(..., description="'weak' | 'moderate' | 'strong' | 'compelling'")
    likely_response: str = Field(..., description="How the platform would likely respond")
    success_probability: float = Field(..., ge=0.0, le=1.0, description="Estimated success rate")


class AppealResult(BaseModel):
    """Appeal anticipation analysis"""
    predicted_appeals: list[AppealArgument] = Field(..., description="Likely appeal arguments")
    strongest_appeal: str = Field(..., description="The most compelling appeal argument")
    overall_appeal_success_rate: float = Field(..., ge=0.0, le=1.0, description="Overall likelihood of successful appeal")
    missing_context: list[str] = Field(..., description="Context that could change the verdict if provided")
    recommended_clarifications: list[str] = Field(..., description="Questions to ask the content creator")


class SycophancyCheck(BaseModel):
    """Result of a sycophancy test variation"""
    framing: str = Field(..., description="How the content was framed")
    verdict: VerdictTier = Field(..., description="Verdict with this framing")
    confidence: float = Field(..., ge=0.0, le=1.0)
    key_difference: Optional[str] = Field(None, description="What changed vs baseline")


class SycophancyResult(BaseModel):
    """Sycophancy detection analysis"""
    baseline_verdict: VerdictTier = Field(..., description="Verdict with neutral framing")
    variations: list[SycophancyCheck] = Field(..., description="Results with different framings")
    bias_detected: bool = Field(..., description="Whether framing changed the verdict")
    bias_direction: Optional[str] = Field(None, description="Which framing direction showed bias")
    robustness_score: float = Field(..., ge=0.0, le=1.0, description="How robust the verdict is to framing (1.0 = no bias)")
    recommendation: str = Field(..., description="What this means for the verdict's reliability")


# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================

class PolicyLensRequest(BaseModel):
    """Input request for content analysis"""
    content_text: Optional[str] = Field(None, max_length=10000, description="Text content to analyze")
    content_image_base64: Optional[str] = Field(None, description="Base64-encoded image (JPG/PNG)")
    context_hint: Optional[str] = Field(
        None, 
        description="Intent/context hint (e.g., 'Verified news account reporting on war zone')"
    )
    selected_judges: list[str] = Field(
        default=["walled_garden", "town_square", "viral_stage"],
        description="Judge IDs to include in the panel"
    )
    # Original deep dives
    run_debate: bool = Field(default=False, description="Run Pro/Con debate analysis")
    run_cross_model: bool = Field(default=False, description="Run cross-model agreement analysis")
    # New advanced deep dives
    run_counterfactual: bool = Field(default=False, description="Run counterfactual boundary analysis")
    run_red_team: bool = Field(default=False, description="Run red team adversarial analysis")
    run_consistency: bool = Field(default=False, description="Run self-consistency sampling")
    run_temporal: bool = Field(default=False, description="Run temporal sensitivity analysis")
    run_appeal: bool = Field(default=False, description="Run appeal anticipation analysis")
    run_sycophancy: bool = Field(default=False, description="Run sycophancy bias detection")


class PolicyLensResponse(BaseModel):
    """Complete analysis response"""
    request_id: str
    content_preview: str = Field(..., description="Truncated content preview for reference")
    judge_verdicts: list[JudgeVerdict]
    synthesis: SynthesisResult
    # Original deep dives
    debate: Optional[DebateResult] = Field(None, description="Pro/Con debate result (if requested)")
    cross_model: Optional[CrossModelResult] = Field(None, description="Cross-model agreement result (if requested)")
    # New advanced deep dives
    counterfactual: Optional[CounterfactualResult] = Field(None, description="Counterfactual analysis (if requested)")
    red_team: Optional[RedTeamResult] = Field(None, description="Red team analysis (if requested)")
    consistency: Optional[SelfConsistencyResult] = Field(None, description="Self-consistency sampling (if requested)")
    temporal: Optional[TemporalResult] = Field(None, description="Temporal sensitivity analysis (if requested)")
    appeal: Optional[AppealResult] = Field(None, description="Appeal anticipation analysis (if requested)")
    sycophancy: Optional[SycophancyResult] = Field(None, description="Sycophancy detection (if requested)")
