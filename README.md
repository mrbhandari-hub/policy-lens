# PolicyLens v2.0

**A multi-perspective disagreement engine for Trust & Safety professionals.**

PolicyLens allows you to analyze content through multiple simulated judge personas - platform simulators (Meta, X, TikTok proxies) and cultural simulators (Conservative, Progressive, Libertarian) - to understand where and why content policies diverge.

## Features

- 🎯 **Mitigation Ladder**: Beyond binary Ban/Allow - judges choose from Remove, Age-Gate, Reduce Reach, Label, or Allow
- 🔍 **6 Judge Personas**: 3 platform simulators + 3 cultural perspectives
- 📊 **Disagreement Analysis**: Visual heatmaps and "Crux" narratives explaining tensions
- 🖼️ **Multimodal**: Analyze text and images together
- 🔒 **Safety-First**: Built-in guardrails prevent jailbreak advice

## Tech Stack

- **Backend**: Python, FastAPI, Pydantic, Google Gemini 3 Pro Preview
- **Frontend**: Next.js 16, TypeScript, Tailwind CSS

## Quick Start

### 1. Set up your Google AI API key

Get your API key from [Google AI Studio](https://aistudio.google.com/)

```bash
export GOOGLE_API_KEY=your-api-key-here
```

### 2. Start the backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Open the app

Navigate to [http://localhost:3001](http://localhost:3001)

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/judges` | GET | List available judge personas |
| `/analyze` | POST | Analyze content through selected judges |

## Judge Personas

### Platform Simulators (Corporate)

1. **The Walled Garden** (Meta-proxy): Prioritizes Safety & Dignity
2. **The Town Square** (X-proxy): Prioritizes Free Expression  
3. **The Viral Stage** (TikTok-proxy): Prioritizes Youth Safety & Brand Risk

### Cultural Simulators (Ideological)

4. **Global Conservative**: Sensitive to traditional values and religious mockery
5. **Global Progressive**: Sensitive to systemic harm and inclusivity
6. **Civil Libertarian**: Resists censorship of 'lawful but awful' content

## Output Schema

```json
{
  "judge_id": "walled_garden",
  "verdict_tier": "REDUCE_REACH",
  "confidence_score": 0.85,
  "primary_policy_axis": "Hate Speech / Dehumanization",
  "reasoning_bullets": ["..."],
  "mitigating_factors": ["..."],
  "refusal_to_instruct": true
}
```

## Safety Measures

- All judge prompts include explicit instructions to NOT provide evasion advice
- Outputs are watermarked as "Simulated AI Verdict"
- `refusal_to_instruct` flag confirms safety compliance

## License

MIT
