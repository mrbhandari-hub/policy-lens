"""PolicyLens v2.0 - Multi-Model Engine

Implements:
1. Pro/Con Debate Mode (Advocate vs Defender, judged by Referee)
2. Cross-Model Agreement (GPT-4, Claude, Gemini in parallel)
"""
import asyncio
import json
import os
from concurrent.futures import ThreadPoolExecutor
from typing import Optional

from models import (
    DebateArgument, RefereeDecision, DebateResult,
    ModelVerdict, CrossModelResult, AgreementLevel, VerdictTier
)

# Thread pool for parallel API calls
_executor = ThreadPoolExecutor(max_workers=10)

# =============================================================================
# PROMPTS
# =============================================================================

SAFETY_PREAMBLE = """
CRITICAL SAFETY RULES:
1. You are analyzing content to evaluate policy compliance - NOT to help create harmful content.
2. DO NOT suggest edits to make the content compliant. Only analyze the current state.
3. DO NOT provide "jailbreak" advice or ways to evade content filters.
"""

ADVOCATE_PROMPT = f"""{SAFETY_PREAMBLE}

You are the ADVOCATE in a structured content moderation debate. Your role is to argue the STRONGEST possible case for REMOVING or RESTRICTING this content.

Your goal is to steelman the case for takedown - find every legitimate policy reason why this content should not remain on the platform. Be thorough but intellectually honest.

Consider:
- Potential for real-world harm
- Policy violations (hate speech, violence, misinformation, etc.)
- Vulnerable populations who might be affected
- Platform liability and reputation risks
- Precedent this sets for similar content

You MUST respond with valid JSON:
{{
  "role": "advocate",
  "position": "REMOVE",
  "argument_summary": "<one sentence summary of your strongest argument>",
  "key_points": ["<point 1>", "<point 2>", "<point 3>"],
  "strongest_evidence": "<the single most compelling reason for removal>",
  "acknowledged_weaknesses": ["<weakness 1>", "<weakness 2>"]
}}
"""

DEFENDER_PROMPT = f"""{SAFETY_PREAMBLE}

You are the DEFENDER in a structured content moderation debate. Your role is to argue the STRONGEST possible case for ALLOWING this content to remain on the platform.

Your goal is to steelman the case for keeping the content up - find every legitimate reason why removal would be wrong or harmful. Be thorough but intellectually honest.

Consider:
- Free expression and speech rights
- Context that changes the meaning
- Educational, artistic, or journalistic value
- Chilling effects of over-moderation
- Whether the harm is speculative vs concrete
- Whether less restrictive alternatives exist (labels, age-gates)

You MUST respond with valid JSON:
{{
  "role": "defender",
  "position": "ALLOW",
  "argument_summary": "<one sentence summary of your strongest argument>",
  "key_points": ["<point 1>", "<point 2>", "<point 3>"],
  "strongest_evidence": "<the single most compelling reason to keep it up>",
  "acknowledged_weaknesses": ["<weakness 1>", "<weakness 2>"]
}}
"""

REFEREE_PROMPT = f"""{SAFETY_PREAMBLE}

You are the REFEREE in a structured content moderation debate. You have heard arguments from both sides:
- The ADVOCATE argued for removal/restriction
- The DEFENDER argued for allowing the content

Your job is to render a fair verdict based on the strength of the arguments, NOT your personal opinion. Consider:
- Which side made the more compelling case?
- Were the key points well-supported?
- Did either side fail to address critical weaknesses?
- What would a reasonable, balanced policy decision be?

VERDICT OPTIONS:
- REMOVE: Content clearly violates policy
- AGE_GATE: Content is adult-oriented, restrict to 18+
- REDUCE_REACH: Borderline content, limit algorithmic amplification
- LABEL: Add context labels but keep up
- ALLOW: Content is within policy

You MUST respond with valid JSON:
{{
  "winning_side": "advocate" | "defender" | "tie",
  "verdict_tier": "REMOVE" | "AGE_GATE" | "REDUCE_REACH" | "LABEL" | "ALLOW",
  "confidence_score": <float 0.0-1.0>,
  "reasoning": "<explanation of your decision>",
  "key_factor": "<the decisive factor that tipped the balance>"
}}
"""

NEUTRAL_ANALYST_PROMPT = f"""{SAFETY_PREAMBLE}

You are a neutral content policy analyst evaluating content for potential policy violations. Analyze objectively without ideological bias.

Consider all relevant policy areas:
- Violence and threats
- Hate speech and discrimination  
- Misinformation and harmful health claims
- Adult/sexual content
- Harassment and bullying
- Dangerous activities
- Spam and fraud

VERDICT OPTIONS:
- REMOVE: Content clearly violates policy
- AGE_GATE: Content is adult-oriented, restrict to 18+
- REDUCE_REACH: Borderline content, limit algorithmic amplification
- LABEL: Add context labels but keep up
- ALLOW: Content is within policy

You MUST respond with valid JSON:
{{
  "verdict_tier": "REMOVE" | "AGE_GATE" | "REDUCE_REACH" | "LABEL" | "ALLOW",
  "confidence_score": <float 0.0-1.0>,
  "reasoning_summary": "<brief explanation>",
  "key_policy_concern": "<primary policy area of concern, or 'None' if allowed>"
}}
"""


# =============================================================================
# CLIENT INITIALIZATION
# =============================================================================

class MultiModelEngine:
    """Engine for debate and cross-model analysis"""
    
    def __init__(self):
        self.google_client = None
        self.openai_client = None
        self.anthropic_client = None
        
        # Initialize Google (Gemini)
        google_key = os.getenv("GOOGLE_API_KEY")
        if google_key:
            from google import genai
            self.google_client = genai.Client(api_key=google_key)
            print("  ✓ Google (Gemini) client initialized")
        
        # Initialize OpenAI
        openai_key = os.getenv("OPENAI_API_KEY")
        if openai_key:
            from openai import OpenAI
            self.openai_client = OpenAI(api_key=openai_key)
            print("  ✓ OpenAI client initialized")
        
        # Initialize Anthropic
        anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        if anthropic_key:
            import anthropic
            self.anthropic_client = anthropic.Anthropic(api_key=anthropic_key)
            print("  ✓ Anthropic client initialized")
    
    # =========================================================================
    # DEBATE MODE
    # =========================================================================
    
    async def run_debate(
        self,
        content_text: str,
        context_hint: Optional[str] = None
    ) -> DebateResult:
        """Run the Pro/Con debate with Advocate, Defender, and Referee"""
        if not self.google_client:
            raise RuntimeError("Google API key required for debate mode")
        
        # Build content prompt
        content_prompt = f"CONTENT TO ANALYZE:\n---\n{content_text}\n---"
        if context_hint:
            content_prompt += f"\n\nCONTEXT PROVIDED:\n{context_hint}"
        
        loop = asyncio.get_event_loop()
        
        # Run Advocate and Defender in parallel
        advocate_future = loop.run_in_executor(
            _executor,
            self._run_gemini_sync,
            ADVOCATE_PROMPT,
            content_prompt
        )
        defender_future = loop.run_in_executor(
            _executor,
            self._run_gemini_sync,
            DEFENDER_PROMPT,
            content_prompt
        )
        
        advocate_data, defender_data = await asyncio.gather(
            advocate_future, defender_future
        )
        
        advocate = DebateArgument(**advocate_data)
        defender = DebateArgument(**defender_data)
        
        # Now run Referee with both arguments
        referee_content = f"""
{content_prompt}

ADVOCATE'S ARGUMENT (for removal):
{json.dumps(advocate_data, indent=2)}

DEFENDER'S ARGUMENT (for allowing):
{json.dumps(defender_data, indent=2)}

Now render your verdict.
"""
        referee_data = await loop.run_in_executor(
            _executor,
            self._run_gemini_sync,
            REFEREE_PROMPT,
            referee_content
        )
        
        referee = RefereeDecision(**referee_data)
        
        return DebateResult(
            advocate=advocate,
            defender=defender,
            referee=referee
        )
    
    def _run_gemini_sync(self, system_prompt: str, user_content: str) -> dict:
        """Run a Gemini call synchronously (for thread pool)"""
        from google.genai import types
        
        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            response_mime_type="application/json",
            temperature=0.4,
        )
        
        response = self.google_client.models.generate_content(
            model="gemini-3.0-flash",
            contents=[types.Content(role="user", parts=[
                types.Part.from_text(text=user_content)
            ])],
            config=config
        )
        
        return json.loads(response.text)
    
    # =========================================================================
    # CROSS-MODEL AGREEMENT
    # =========================================================================
    
    async def run_cross_model(
        self,
        content_text: str,
        context_hint: Optional[str] = None,
        image_bytes: Optional[bytes] = None
    ) -> CrossModelResult:
        """Run the same analysis across GPT-4, Claude, and Gemini"""
        
        # Build content prompt
        content_prompt = f"CONTENT TO ANALYZE:\n---\n{content_text}\n---"
        if context_hint:
            content_prompt += f"\n\nCONTEXT PROVIDED:\n{context_hint}"
        
        loop = asyncio.get_event_loop()
        futures = []
        model_info = []
        
        # Queue up all available models
        if self.google_client:
            futures.append(loop.run_in_executor(
                _executor,
                self._run_gemini_analyst_sync,
                content_prompt,
                image_bytes
            ))
            model_info.append(("google", "gemini-3.0-flash"))
        
        if self.openai_client:
            futures.append(loop.run_in_executor(
                _executor,
                self._run_openai_analyst_sync,
                content_prompt,
                image_bytes
            ))
            model_info.append(("openai", "o4-mini"))
        
        if self.anthropic_client:
            futures.append(loop.run_in_executor(
                _executor,
                self._run_anthropic_analyst_sync,
                content_prompt,
                image_bytes
            ))
            model_info.append(("anthropic", "claude-sonnet-4-5"))
        
        if not futures:
            raise RuntimeError("At least one API key required for cross-model analysis")
        
        # Run all in parallel
        results = await asyncio.gather(*futures, return_exceptions=True)
        
        # Build verdicts list
        verdicts = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                print(f"Cross-model error for {model_info[i]}: {result}")
                continue
            
            family, model_id = model_info[i]
            verdicts.append(ModelVerdict(
                model_family=family,
                model_id=model_id,
                verdict_tier=VerdictTier(result["verdict_tier"]),
                confidence_score=result["confidence_score"],
                reasoning_summary=result["reasoning_summary"],
                key_policy_concern=result["key_policy_concern"]
            ))
        
        # Calculate agreement level
        if len(verdicts) < 2:
            agreement_level = AgreementLevel.DISAGREEMENT
            escalation = True
            summary = "Insufficient model responses for comparison"
        else:
            verdict_tiers = [v.verdict_tier for v in verdicts]
            unique_verdicts = set(verdict_tiers)
            
            if len(unique_verdicts) == 1:
                agreement_level = AgreementLevel.FULL
                escalation = False
                summary = None
            elif len(unique_verdicts) == 2:
                # Check if it's a minor disagreement (adjacent tiers)
                tier_order = ["REMOVE", "AGE_GATE", "REDUCE_REACH", "LABEL", "ALLOW"]
                tier_indices = [tier_order.index(v.value) for v in verdict_tiers]
                spread = max(tier_indices) - min(tier_indices)
                
                if spread <= 1:
                    agreement_level = AgreementLevel.PARTIAL
                    escalation = False
                    summary = f"Models agree on general direction but differ on severity"
                else:
                    agreement_level = AgreementLevel.PARTIAL
                    escalation = True
                    summary = self._build_disagreement_summary(verdicts)
            else:
                agreement_level = AgreementLevel.DISAGREEMENT
                escalation = True
                summary = self._build_disagreement_summary(verdicts)
        
        return CrossModelResult(
            verdicts=verdicts,
            agreement_level=agreement_level,
            escalation_recommended=escalation,
            disagreement_summary=summary
        )
    
    def _build_disagreement_summary(self, verdicts: list[ModelVerdict]) -> str:
        """Build a human-readable summary of where models disagree"""
        parts = []
        for v in verdicts:
            parts.append(f"{v.model_family.title()} ({v.model_id}): {v.verdict_tier.value}")
        return "Model disagreement: " + " vs ".join(parts)
    
    def _run_gemini_analyst_sync(self, content_prompt: str, image_bytes: Optional[bytes] = None) -> dict:
        """Run Gemini as neutral analyst with optional image"""
        from google.genai import types
        
        # Build parts list
        parts = [types.Part.from_text(text=content_prompt)]
        
        # Add image if provided
        if image_bytes:
            parts.append(types.Part.from_bytes(
                data=image_bytes,
                mime_type="image/jpeg"
            ))
        
        config = types.GenerateContentConfig(
            system_instruction=NEUTRAL_ANALYST_PROMPT,
            response_mime_type="application/json",
            temperature=0.4,
        )
        
        response = self.google_client.models.generate_content(
            model="gemini-3.0-flash",
            contents=[types.Content(role="user", parts=parts)],
            config=config
        )
        
        return json.loads(response.text)
    
    def _run_openai_analyst_sync(self, content_prompt: str, image_bytes: Optional[bytes] = None) -> dict:
        """Run OpenAI GPT-4 as neutral analyst with optional image"""
        import base64
        
        # Build message content
        if image_bytes:
            # GPT-4o supports vision via base64 data URLs
            image_b64 = base64.b64encode(image_bytes).decode("utf-8")
            user_content = [
                {"type": "text", "text": content_prompt},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{image_b64}",
                        "detail": "high"
                    }
                }
            ]
        else:
            user_content = content_prompt
        
        response = self.openai_client.chat.completions.create(
            model="o4-mini",
            messages=[
                {"role": "system", "content": NEUTRAL_ANALYST_PROMPT},
                {"role": "user", "content": user_content}
            ],
            response_format={"type": "json_object"},
            temperature=0.4
        )
        
        return json.loads(response.choices[0].message.content)
    
    def _run_anthropic_analyst_sync(self, content_prompt: str, image_bytes: Optional[bytes] = None) -> dict:
        """Run Anthropic Claude as neutral analyst with optional image"""
        import base64
        
        # Claude doesn't have native JSON mode, so we ask nicely
        text_prompt = f"{content_prompt}\n\nRespond with ONLY valid JSON, no other text."
        
        # Build message content
        if image_bytes:
            # Claude supports vision via base64 image blocks
            image_b64 = base64.b64encode(image_bytes).decode("utf-8")
            user_content = [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/jpeg",
                        "data": image_b64
                    }
                },
                {"type": "text", "text": text_prompt}
            ]
        else:
            user_content = text_prompt
        
        response = self.anthropic_client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=1024,
            system=NEUTRAL_ANALYST_PROMPT,
            messages=[
                {"role": "user", "content": user_content}
            ]
        )
        
        # Extract text from response
        text = response.content[0].text
        
        # Try to parse JSON (handle potential markdown code blocks)
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1].split("```")[0]
        
        return json.loads(text.strip())


# Global instance (initialized in main.py)
multi_model_engine: Optional[MultiModelEngine] = None


def get_multi_model_engine() -> MultiModelEngine:
    """Get or create the multi-model engine"""
    global multi_model_engine
    if multi_model_engine is None:
        multi_model_engine = MultiModelEngine()
    return multi_model_engine

