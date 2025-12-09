"""PolicyLens v2.0 - Judge Engine (Gemini Integration)"""
import asyncio
import json
import uuid
from typing import Optional

from google import genai
from google.genai import types

from models import (
    JudgeVerdict, PolicyLensRequest, PolicyLensResponse,
    SynthesisResult, ConsensusBadge, VerdictTier
)
from judges import get_judge_prompt, JUDGES


# Model configuration - Using Gemini 3 Pro Preview
MODEL_ID = "gemini-3-pro-preview"


class JudgeEngine:
    """Orchestrates parallel judge evaluations using Gemini"""
    
    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)
    
    async def evaluate_content(self, request: PolicyLensRequest) -> PolicyLensResponse:
        """Run all selected judges in parallel and synthesize results"""
        request_id = str(uuid.uuid4())
        
        # Run judges in parallel
        judge_tasks = [
            self._run_judge(judge_id, request)
            for judge_id in request.selected_judges
        ]
        verdicts = await asyncio.gather(*judge_tasks)
        
        # Filter out any failed evaluations
        valid_verdicts = [v for v in verdicts if v is not None]
        
        # Synthesize results
        synthesis = await self._synthesize(valid_verdicts, request)
        
        return PolicyLensResponse(
            request_id=request_id,
            content_preview=request.content_text[:200] + "..." if len(request.content_text) > 200 else request.content_text,
            judge_verdicts=valid_verdicts,
            synthesis=synthesis
        )
    
    async def _run_judge(
        self, 
        judge_id: str, 
        request: PolicyLensRequest
    ) -> Optional[JudgeVerdict]:
        """Execute a single judge evaluation"""
        try:
            judge_config = get_judge_prompt(judge_id)
            
            # Build the content parts
            parts = []
            
            # Add text content
            content_prompt = f"""
CONTENT TO ANALYZE:
---
{request.content_text}
---
"""
            if request.context_hint:
                content_prompt += f"""
PROVIDED CONTEXT:
{request.context_hint}
---
"""
            content_prompt += """
Analyze this content and provide your verdict as a JSON object.
"""
            parts.append(types.Part.from_text(text=content_prompt))
            
            # Add image if provided
            if request.content_image_base64:
                import base64
                # Decode base64 to bytes
                image_bytes = base64.b64decode(request.content_image_base64)
                parts.append(types.Part.from_bytes(
                    data=image_bytes,
                    mime_type="image/jpeg"  # Adjust based on actual format
                ))
            
            # Configure for structured JSON output
            config = types.GenerateContentConfig(
                system_instruction=judge_config["system_prompt"],
                response_mime_type="application/json",
                temperature=0.3,  # Lower temperature for more consistent judgments
            )
            
            response = await asyncio.to_thread(
                self.client.models.generate_content,
                model=MODEL_ID,
                contents=[types.Content(role="user", parts=parts)],
                config=config
            )
            
            # Parse the structured response
            verdict_data = json.loads(response.text)
            verdict_data["judge_id"] = judge_id  # Ensure correct ID
            return JudgeVerdict(**verdict_data)
            
        except Exception as e:
            print(f"Error running judge {judge_id}: {e}")
            return None
    
    async def _synthesize(
        self, 
        verdicts: list[JudgeVerdict],
        request: PolicyLensRequest
    ) -> SynthesisResult:
        """Meta-Judge: Analyze the verdicts and generate synthesis"""
        
        # Calculate verdict distribution
        distribution: dict[str, int] = {tier.value: 0 for tier in VerdictTier}
        for v in verdicts:
            distribution[v.verdict_tier.value] += 1
        
        # Determine consensus badge
        total = len(verdicts)
        max_count = max(distribution.values()) if distribution else 0
        
        if total == 0:
            badge = ConsensusBadge.CHAOS
        elif max_count == total:
            badge = ConsensusBadge.UNANIMOUS
        elif max_count >= total * 0.6:
            badge = ConsensusBadge.MAJORITY
        elif max_count >= total * 0.4:
            badge = ConsensusBadge.SPLIT
        else:
            badge = ConsensusBadge.CHAOS
        
        # Generate the "Crux" narrative using Gemini
        crux_prompt = f"""
You are the Meta-Judge synthesizing multiple content moderation verdicts.

ORIGINAL CONTENT (preview):
{request.content_text[:500]}

JUDGE VERDICTS:
{json.dumps([v.model_dump() for v in verdicts], indent=2, default=str)}

Analyze the disagreements and generate:
1. A one-sentence "crux narrative" explaining WHY the judges disagree (focus on the philosophical tension)
2. The primary axis of tension (e.g., "Intent vs Harm", "Safety vs Expression", "Context vs Content")

Respond with JSON:
{{
  "crux_narrative": "<one sentence explaining the core disagreement>",
  "primary_tension": "<2-4 word tension axis>"
}}
"""
        
        try:
            config = types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.5,
            )
            
            response = await asyncio.to_thread(
                self.client.models.generate_content,
                model=MODEL_ID,
                contents=[types.Content(role="user", parts=[
                    types.Part.from_text(text=crux_prompt)
                ])],
                config=config
            )
            
            crux_data = json.loads(response.text)
            crux_narrative = crux_data.get("crux_narrative", "Unable to determine disagreement pattern.")
            primary_tension = crux_data.get("primary_tension", "Unknown")
            
        except Exception as e:
            print(f"Error generating synthesis: {e}")
            crux_narrative = "Synthesis unavailable due to processing error."
            primary_tension = "Unknown"
        
        return SynthesisResult(
            consensus_badge=badge,
            verdict_distribution=distribution,
            crux_narrative=crux_narrative,
            primary_tension=primary_tension
        )
