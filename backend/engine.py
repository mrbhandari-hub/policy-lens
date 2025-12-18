"""PolicyLens v2.0 - Judge Engine (Gemini Integration)

Optimized for parallel execution - all judges run concurrently.
"""
import asyncio
import json
import uuid
import base64
import os
from typing import Optional
from concurrent.futures import ThreadPoolExecutor

from google import genai
from google.genai import types

from models import (
    JudgeVerdict, PolicyLensRequest, PolicyLensResponse,
    SynthesisResult, ConsensusBadge, VerdictTier
)
from judges import get_judge_prompt


# Model configuration
# gemini-3-flash-preview provides best balance of speed and quality
# Set POLICYLENS_FAST_MODE=0 to use gemini-3-pro-preview for highest quality
FAST_MODE = os.getenv("POLICYLENS_FAST_MODE", "1") == "1"
MODEL_ID = "gemini-2.5-flash-preview-05-20" if FAST_MODE else "gemini-3-pro-preview"

# Thread pool for parallel API calls (Gemini SDK is synchronous)
# 25 workers ensures all 18 judges + synthesis can run truly in parallel
_executor = ThreadPoolExecutor(max_workers=25)


class JudgeEngine:
    """Orchestrates parallel judge evaluations using Gemini"""
    
    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)
        self.api_key = api_key
        print(f"  Using model: {MODEL_ID} ({'fast mode' if FAST_MODE else 'quality mode'})")
    
    async def evaluate_content(self, request: PolicyLensRequest) -> PolicyLensResponse:
        """Run all selected judges in TRUE parallel and synthesize results"""
        request_id = str(uuid.uuid4())
        
        # Pre-process image once (not per-judge)
        image_bytes = None
        if request.content_image_base64:
            image_bytes = base64.b64decode(request.content_image_base64)
        
        # Create all judge tasks
        loop = asyncio.get_event_loop()
        judge_futures = [
            loop.run_in_executor(
                _executor,
                self._run_judge_sync,
                judge_id,
                request.content_text,
                request.context_hint,
                image_bytes
            )
            for judge_id in request.selected_judges
        ]
        
        # Run ALL judges truly in parallel
        verdicts = await asyncio.gather(*judge_futures, return_exceptions=True)
        
        # Filter out failures
        valid_verdicts = [
            v for v in verdicts 
            if isinstance(v, JudgeVerdict)
        ]
        
        # Log any errors
        for i, v in enumerate(verdicts):
            if isinstance(v, Exception):
                print(f"Judge {request.selected_judges[i]} failed: {v}")
        
        # Synthesize results (can run while we have verdicts)
        synthesis = await self._synthesize(valid_verdicts, request)
        
        # Safe text for preview
        safe_text = request.content_text or "[Image Only Content]"
        
        return PolicyLensResponse(
            request_id=request_id,
            content_preview=safe_text[:200] + "..." if len(safe_text) > 200 else safe_text,
            judge_verdicts=valid_verdicts,
            synthesis=synthesis
        )
    
    def _run_judge_sync(
        self,
        judge_id: str,
        content_text: Optional[str],
        context_hint: Optional[str],
        image_bytes: Optional[bytes]
    ) -> JudgeVerdict:
        """Synchronous judge execution (runs in thread pool)"""
        judge_config = get_judge_prompt(judge_id)
        
        # Build the content parts
        parts = []
        
        # Add text content
        safe_text = content_text or ""
        content_prompt = f"""
CONTENT TO ANALYZE:
---
{safe_text}
---
"""
        if context_hint:
            content_prompt += f"""
PROVIDED CONTEXT:
{context_hint}
---
"""
        content_prompt += """
Analyze this content and provide your verdict as a JSON object.
"""
        parts.append(types.Part.from_text(text=content_prompt))
        
        # Add image if provided
        if image_bytes:
            parts.append(types.Part.from_bytes(
                data=image_bytes,
                mime_type="image/jpeg"
            ))
        
        # Configure for structured JSON output
        config = types.GenerateContentConfig(
            system_instruction=judge_config["system_prompt"],
            response_mime_type="application/json",
            temperature=0.3,
        )
        
        # Make the API call (this blocks, but we're in a thread)
        response = self.client.models.generate_content(
            model=MODEL_ID,
            contents=[types.Content(role="user", parts=parts)],
            config=config
        )
        
        # Parse response
        verdict_data = json.loads(response.text)
        verdict_data["judge_id"] = judge_id
        return JudgeVerdict(**verdict_data)
    
    async def _synthesize(
        self,
        verdicts: list[JudgeVerdict],
        request: PolicyLensRequest
    ) -> SynthesisResult:
        """Meta-Judge: Analyze verdicts and generate synthesis"""
        
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
        
        # Generate the "Crux" narrative using Gemini (in thread pool)
        loop = asyncio.get_event_loop()
        try:
            crux_data = await loop.run_in_executor(
                _executor,
                self._generate_crux_sync,
                verdicts,
                request.content_text[:500]
            )
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
    
    def _generate_crux_sync(
        self,
        verdicts: list[JudgeVerdict],
        content_preview: str
    ) -> dict:
        """Generate crux narrative synchronously (runs in thread pool)"""
        crux_prompt = f"""
You are the Meta-Judge synthesizing multiple content moderation verdicts from different platform perspectives.

ORIGINAL CONTENT (preview):
{content_preview}

JUDGE VERDICTS:
{json.dumps([v.model_dump() for v in verdicts], indent=2, default=str)}

Analyze the disagreements and generate:
1. A one-sentence "crux narrative" explaining WHY the judges disagree (focus on the philosophical tension between platforms)
2. The primary axis of tension (e.g., "Youth Safety vs Expression", "Brand Safety vs Free Speech", "Proactive vs Reactive Moderation")

Be specific about WHICH platforms disagree and WHY based on their stated policies.

Respond with JSON:
{{
  "crux_narrative": "<one sentence explaining the core disagreement>",
  "primary_tension": "<2-4 word tension axis>"
}}
"""
        
        config = types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.5,
        )
        
        response = self.client.models.generate_content(
            model=MODEL_ID,
            contents=[types.Content(role="user", parts=[
                types.Part.from_text(text=crux_prompt)
            ])],
            config=config
        )
        
        return json.loads(response.text)
