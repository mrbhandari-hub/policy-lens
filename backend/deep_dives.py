"""PolicyLens v2.0 - Advanced Deep Dive Analyses

Implements 4 cutting-edge AI analysis techniques:
1. Counterfactual Analysis - What would change the verdict?
2. Red Team Mode - Adversarial vulnerability analysis
3. Temporal Sensitivity - How context timing affects verdict
4. Appeal Anticipation - Predict creator appeals
"""
import asyncio
import json
import os
from concurrent.futures import ThreadPoolExecutor
from typing import Optional

from google import genai
from google.genai import types

from models import (
    CounterfactualResult, CounterfactualScenario,
    RedTeamResult, RedTeamVulnerability,
    TemporalResult, TemporalContext,
    AppealResult, AppealArgument,
    VerdictTier
)

# Thread pool for parallel API calls
_executor = ThreadPoolExecutor(max_workers=15)

# Model configuration - use gemini-2.0-flash for best rate limits
MODEL_ID = "gemini-2.0-flash"

SAFETY_PREAMBLE = """
CRITICAL SAFETY RULES:
1. You are analyzing content to evaluate policy compliance - NOT to help create harmful content.
2. DO NOT suggest edits to make harmful content more harmful.
3. DO NOT provide "jailbreak" advice or ways to evade content filters.
4. Your analysis is for improving content moderation systems, not evading them.
"""


# =============================================================================
# PROMPTS FOR EACH DEEP DIVE
# =============================================================================

COUNTERFACTUAL_PROMPT = f"""{SAFETY_PREAMBLE}

You are an expert in counterfactual reasoning for content moderation. Your task is to analyze what changes to the content or context would cause the moderation verdict to change.

This helps decision-makers understand the "boundary conditions" - how close is this content to a different verdict?

Analyze the content and provide:
1. Changes that would make ALLOW the verdict (if currently something else)
2. Changes that would make REMOVE the verdict (if currently something else)
3. The most sensitive factor (what would most easily flip the verdict)
4. How clear or fuzzy the boundaries are

You MUST respond with valid JSON:
{{
  "original_verdict": "REMOVE" | "AGE_GATE" | "REDUCE_REACH" | "LABEL" | "ALLOW",
  "flip_to_allow": [
    {{
      "change_description": "<what would need to change>",
      "new_verdict": "ALLOW",
      "confidence_impact": "<how this affects certainty>",
      "explanation": "<why this matters>"
    }}
  ],
  "flip_to_remove": [
    {{
      "change_description": "<what would need to change>",
      "new_verdict": "REMOVE",
      "confidence_impact": "<how this affects certainty>",
      "explanation": "<why this matters>"
    }}
  ],
  "most_sensitive_factor": "<the factor verdict is most sensitive to>",
  "boundary_clarity": "clear_boundaries" | "fuzzy_boundaries" | "knife_edge"
}}

Provide 2-4 scenarios for each direction. Be specific and actionable.
"""

RED_TEAM_PROMPT = f"""{SAFETY_PREAMBLE}

You are a RED TEAM specialist analyzing content moderation systems for vulnerabilities. Your goal is to identify how bad actors could:
1. Evade detection with similar harmful content
2. Manipulate context to flip verdicts inappropriately
3. Exploit weaknesses in the moderation logic

This analysis helps improve moderation systems by identifying blind spots.

IMPORTANT: You are helping DEFENDERS, not attackers. Identify vulnerabilities so they can be fixed.

You MUST respond with valid JSON:
{{
  "evasion_techniques": [
    "<way content could evade detection while conveying same harm>"
  ],
  "context_manipulations": [
    "<context changes that would inappropriately flip the verdict>"
  ],
  "vulnerabilities": [
    {{
      "attack_vector": "<how bad actors could exploit this>",
      "severity": "low" | "medium" | "high" | "critical",
      "example_exploitation": "<concrete example>",
      "mitigation": "<how to defend against this>"
    }}
  ],
  "overall_robustness": "robust" | "moderate" | "fragile",
  "recommendations": [
    "<how to improve detection for this type of content>"
  ]
}}

Be thorough but responsible. Focus on realistic threats.
"""

TEMPORAL_PROMPT = f"""{SAFETY_PREAMBLE}

You are an expert in context-sensitive content moderation. Analyze how the verdict for this content would change in different temporal contexts.

Consider these contexts:
1. **Normal times**: Standard, everyday context
2. **Active crisis**: During a related emergency or breaking news
3. **Election period**: During political campaigns
4. **Anniversary**: Near the anniversary of a related event
5. **30 days later**: After initial context has faded
6. **Different region**: In a region where this is more/less sensitive

You MUST respond with valid JSON:
{{
  "baseline_verdict": "REMOVE" | "AGE_GATE" | "REDUCE_REACH" | "LABEL" | "ALLOW",
  "temporal_contexts": [
    {{
      "context_name": "<name of the context>",
      "verdict": "REMOVE" | "AGE_GATE" | "REDUCE_REACH" | "LABEL" | "ALLOW",
      "confidence": <float 0.0-1.0>,
      "reasoning": "<why the verdict changes or stays the same>"
    }}
  ],
  "most_sensitive_context": "<the context where verdict changes most dramatically>",
  "time_decay": "<how the verdict might change as time passes>",
  "recommendation": "<context-aware enforcement recommendation>"
}}

Provide at least 4 different temporal contexts.
"""

APPEAL_PROMPT = f"""{SAFETY_PREAMBLE}

You are an expert in content moderation appeals. Analyze what arguments a creator would likely make if appealing a moderation decision on this content.

Consider:
1. Context that wasn't considered
2. Artistic/educational/journalistic merit arguments
3. Free speech and expression arguments
4. Inconsistent enforcement claims
5. Misinterpretation of intent
6. Technical/procedural issues

You MUST respond with valid JSON:
{{
  "predicted_appeals": [
    {{
      "argument": "<the appeal argument>",
      "strength": "weak" | "moderate" | "strong" | "compelling",
      "likely_response": "<how platform would respond>",
      "success_probability": <float 0.0-1.0>
    }}
  ],
  "strongest_appeal": "<the most compelling appeal argument>",
  "overall_appeal_success_rate": <float 0.0-1.0>,
  "missing_context": [
    "<context that could change the verdict if provided>"
  ],
  "recommended_clarifications": [
    "<questions to ask the content creator>"
  ]
}}

Provide 3-5 potential appeal arguments.
"""


# =============================================================================
# DEEP DIVES ENGINE
# =============================================================================

class DeepDivesEngine:
    """Engine for running advanced deep dive analyses"""
    
    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)
        print(f"  DeepDives using model: {MODEL_ID}")
    
    def _run_sync(self, system_prompt: str, user_content: str, temperature: float = 0.4) -> dict:
        """Run a Gemini call synchronously (for thread pool)"""
        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            response_mime_type="application/json",
            temperature=temperature,
        )
        
        response = self.client.models.generate_content(
            model=MODEL_ID,
            contents=[types.Content(role="user", parts=[
                types.Part.from_text(text=user_content)
            ])],
            config=config
        )
        
        return json.loads(response.text)
    
    async def run_counterfactual(
        self,
        content_text: str,
        context_hint: Optional[str] = None
    ) -> CounterfactualResult:
        """Analyze what would change the verdict"""
        content_prompt = f"CONTENT TO ANALYZE:\n---\n{content_text}\n---"
        if context_hint:
            content_prompt += f"\n\nCONTEXT PROVIDED:\n{context_hint}"
        
        loop = asyncio.get_event_loop()
        data = await loop.run_in_executor(
            _executor,
            self._run_sync,
            COUNTERFACTUAL_PROMPT,
            content_prompt
        )
        
        return CounterfactualResult(
            original_verdict=VerdictTier(data["original_verdict"]),
            flip_to_allow=[CounterfactualScenario(**s) for s in data.get("flip_to_allow", [])],
            flip_to_remove=[CounterfactualScenario(**s) for s in data.get("flip_to_remove", [])],
            most_sensitive_factor=data["most_sensitive_factor"],
            boundary_clarity=data["boundary_clarity"]
        )
    
    async def run_red_team(
        self,
        content_text: str,
        context_hint: Optional[str] = None
    ) -> RedTeamResult:
        """Run adversarial vulnerability analysis"""
        content_prompt = f"CONTENT TO ANALYZE:\n---\n{content_text}\n---"
        if context_hint:
            content_prompt += f"\n\nCONTEXT PROVIDED:\n{context_hint}"
        
        loop = asyncio.get_event_loop()
        data = await loop.run_in_executor(
            _executor,
            self._run_sync,
            RED_TEAM_PROMPT,
            content_prompt
        )
        
        return RedTeamResult(
            evasion_techniques=data.get("evasion_techniques", []),
            context_manipulations=data.get("context_manipulations", []),
            vulnerabilities=[RedTeamVulnerability(**v) for v in data.get("vulnerabilities", [])],
            overall_robustness=data["overall_robustness"],
            recommendations=data.get("recommendations", [])
        )
    
    async def run_temporal(
        self,
        content_text: str,
        context_hint: Optional[str] = None
    ) -> TemporalResult:
        """Analyze temporal sensitivity"""
        content_prompt = f"CONTENT TO ANALYZE:\n---\n{content_text}\n---"
        if context_hint:
            content_prompt += f"\n\nCONTEXT PROVIDED:\n{context_hint}"
        
        loop = asyncio.get_event_loop()
        data = await loop.run_in_executor(
            _executor,
            self._run_sync,
            TEMPORAL_PROMPT,
            content_prompt
        )
        
        return TemporalResult(
            baseline_verdict=VerdictTier(data["baseline_verdict"]),
            temporal_contexts=[TemporalContext(
                context_name=c["context_name"],
                verdict=VerdictTier(c["verdict"]),
                confidence=c["confidence"],
                reasoning=c["reasoning"]
            ) for c in data.get("temporal_contexts", [])],
            most_sensitive_context=data["most_sensitive_context"],
            time_decay=data["time_decay"],
            recommendation=data["recommendation"]
        )
    
    async def run_appeal(
        self,
        content_text: str,
        context_hint: Optional[str] = None
    ) -> AppealResult:
        """Anticipate appeal arguments"""
        content_prompt = f"CONTENT TO ANALYZE:\n---\n{content_text}\n---"
        if context_hint:
            content_prompt += f"\n\nCONTEXT PROVIDED:\n{context_hint}"
        
        loop = asyncio.get_event_loop()
        data = await loop.run_in_executor(
            _executor,
            self._run_sync,
            APPEAL_PROMPT,
            content_prompt
        )
        
        return AppealResult(
            predicted_appeals=[AppealArgument(**a) for a in data.get("predicted_appeals", [])],
            strongest_appeal=data["strongest_appeal"],
            overall_appeal_success_rate=data["overall_appeal_success_rate"],
            missing_context=data.get("missing_context", []),
            recommended_clarifications=data.get("recommended_clarifications", [])
        )


# Global instance
_deep_dives_engine: Optional[DeepDivesEngine] = None


def get_deep_dives_engine() -> Optional[DeepDivesEngine]:
    """Get or create the deep dives engine"""
    global _deep_dives_engine
    if _deep_dives_engine is None:
        api_key = os.getenv("GOOGLE_API_KEY")
        if api_key:
            _deep_dives_engine = DeepDivesEngine(api_key=api_key)
    return _deep_dives_engine

