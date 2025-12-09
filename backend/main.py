"""PolicyLens v2.0 - FastAPI Server"""
import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import PolicyLensRequest, PolicyLensResponse
from judges import get_available_judges
from engine import JudgeEngine


# Initialize engine on startup
engine: JudgeEngine = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global engine
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key or api_key == "your-google-api-key-here":
        print("⚠️  WARNING: GOOGLE_API_KEY not set. The /analyze endpoint will not work.")
        print("   Get your API key from https://aistudio.google.com/")
        print("   Then set it: export GOOGLE_API_KEY=your-key-here")
        engine = None
    else:
        engine = JudgeEngine(api_key=api_key)
        print("✓ PolicyLens engine initialized with Gemini 3 Pro Preview")
    yield


app = FastAPI(
    title="PolicyLens v2.0",
    description="Multi-perspective content moderation analysis engine",
    version="2.0.0",
    lifespan=lifespan
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "2.0.0"}


@app.get("/judges")
async def list_judges():
    """Get available judge personas"""
    return {"judges": get_available_judges()}


@app.post("/analyze", response_model=PolicyLensResponse)
async def analyze_content(request: PolicyLensRequest):
    """
    Analyze content through multiple judge perspectives.
    
    Select 3-5 judges to form a panel. Returns:
    - Individual verdicts from each judge
    - Synthesis with consensus badge and disagreement analysis
    """
    if not engine:
        raise HTTPException(
            status_code=503, 
            detail="GOOGLE_API_KEY not configured. Set the environment variable and restart the server."
        )
    
    if len(request.selected_judges) < 2:
        raise HTTPException(
            status_code=400, 
            detail="Select at least 2 judges for meaningful comparison"
        )
    
    if len(request.selected_judges) > 6:
        raise HTTPException(
            status_code=400,
            detail="Maximum 6 judges per analysis"
        )
    
    try:
        response = await engine.evaluate_content(request)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
