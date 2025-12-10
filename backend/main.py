"""PolicyLens v2.0 - FastAPI Server"""
import asyncio
import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import PolicyLensRequest, PolicyLensResponse, DebateResult, CrossModelResult
from judges import get_available_judges, get_judge_prompt, get_judge_categories
from engine import JudgeEngine
from multi_model import get_multi_model_engine, MultiModelEngine


# Initialize engines on startup
engine: JudgeEngine = None
multi_engine: MultiModelEngine = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global engine, multi_engine
    
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key or api_key == "your-google-api-key-here":
        print("⚠️  WARNING: GOOGLE_API_KEY not set. The /analyze endpoint will not work.")
        print("   Get your API key from https://aistudio.google.com/")
        print("   Then set it: export GOOGLE_API_KEY=your-key-here")
        engine = None
    else:
        engine = JudgeEngine(api_key=api_key)
        print("✓ PolicyLens jury engine initialized")
    
    # Initialize multi-model engine (for debate and cross-model)
    print("Initializing multi-model engine...")
    multi_engine = get_multi_model_engine()
    print("✓ Multi-model engine ready")
    
    yield


app = FastAPI(
    title="PolicyLens v2.0",
    description="Multi-perspective content moderation analysis engine",
    version="2.0.0",
    lifespan=lifespan
)

# CORS configuration - Allow ALL origins to handle Vercel previews and production
# Security Note: in a strict production environment, we would list specific domains,
# but for this demo/diagnostic tool, allowing * ensures seamless preview deployments.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "2.0.0"}


@app.get("/judges")
async def list_judges():
    """Get available judge personas with categories"""
    return {
        "judges": get_available_judges(),
        "categories": get_judge_categories()
    }


@app.get("/judges/{judge_id}")
async def get_judge_details(judge_id: str):
    """Get full details for a specific judge, including the system prompt"""
    try:
        judge = get_judge_prompt(judge_id)
        return {
            "id": judge_id,
            "name": judge["name"],
            "description": judge["description"],
            "system_prompt": judge["system_prompt"]
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/analyze", response_model=PolicyLensResponse)
async def analyze_content(request: PolicyLensRequest):
    """
    Analyze content through multiple judge perspectives.
    
    Select 3-5 judges to form a panel. Returns:
    - Individual verdicts from each judge
    - Synthesis with consensus badge and disagreement analysis
    - Optional: Pro/Con debate result (if run_debate=True)
    - Optional: Cross-model agreement result (if run_cross_model=True)
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
    
    # Build list of tasks to run in parallel
    tasks = []
    task_names = []
    
    # Always run the jury analysis
    tasks.append(engine.evaluate_content(request))
    task_names.append("jury")
    
    # Optionally run debate
    if request.run_debate and multi_engine:
        tasks.append(multi_engine.run_debate(
            content_text=request.content_text or "",
            context_hint=request.context_hint
        ))
        task_names.append("debate")
    
    # Optionally run cross-model
    if request.run_cross_model and multi_engine:
        # Decode image if provided
        image_bytes = None
        if request.content_image_base64:
            import base64
            image_bytes = base64.b64decode(request.content_image_base64)
        
        tasks.append(multi_engine.run_cross_model(
            content_text=request.content_text or "",
            context_hint=request.context_hint,
            image_bytes=image_bytes
        ))
        task_names.append("cross_model")
    
    try:
        # Run all analyses in parallel
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results
        response = None
        debate_result = None
        cross_model_result = None
        
        for i, result in enumerate(results):
            name = task_names[i]
            
            if isinstance(result, Exception):
                print(f"Error in {name} analysis: {result}")
                if name == "jury":
                    # Jury is required, re-raise
                    raise result
                continue
            
            if name == "jury":
                response = result
            elif name == "debate":
                debate_result = result
            elif name == "cross_model":
                cross_model_result = result
        
        if response is None:
            raise HTTPException(status_code=500, detail="Jury analysis failed")
        
        # Add optional results to response
        response.debate = debate_result
        response.cross_model = cross_model_result
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
