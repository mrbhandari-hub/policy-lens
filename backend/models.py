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


class RefereeDecision(BaseModel):
    """The Referee's verdict after hearing both sides"""
    winning_side: str = Field(..., description="'advocate', 'defender', or 'tie'")
    verdict_tier: VerdictTier = Field(..., description="Final recommended action")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Confidence in the decision")
    reasoning: str = Field(..., description="Explanation of the decision")
    key_factor: str = Field(..., description="The decisive factor that tipped the balance")


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
    run_debate: bool = Field(default=False, description="Run Pro/Con debate analysis")
    run_cross_model: bool = Field(default=False, description="Run cross-model agreement analysis")


class PolicyLensResponse(BaseModel):
    """Complete analysis response"""
    request_id: str
    content_preview: str = Field(..., description="Truncated content preview for reference")
    judge_verdicts: list[JudgeVerdict]
    synthesis: SynthesisResult
    debate: Optional[DebateResult] = Field(None, description="Pro/Con debate result (if requested)")
    cross_model: Optional[CrossModelResult] = Field(None, description="Cross-model agreement result (if requested)")
