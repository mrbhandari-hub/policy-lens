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


class PolicyLensResponse(BaseModel):
    """Complete analysis response"""
    request_id: str
    content_preview: str = Field(..., description="Truncated content preview for reference")
    judge_verdicts: list[JudgeVerdict]
    synthesis: SynthesisResult
