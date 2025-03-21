import sys
import os
from pathlib import Path

# Get the correct paths for imports
CURRENT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = CURRENT_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent

# Add directories to the Python path
sys.path.insert(0, str(PROJECT_ROOT))  # Add project root
sys.path.insert(0, str(BACKEND_DIR))   # Add backend directory

# Now try to import modules
try:
    from ai_modules.ai_integration_api import (
        anomaly_detection_router,
        forecasting_router,
        optimization_router
    )
except ImportError as e:
    print(f"Warning: Could not import AI modules: {e}")
    # Define empty placeholders if needed
    anomaly_detection_router = None
    forecasting_router = None
    optimization_router = None

# Now import from your app package with the proper path
from backend.app.api.endpoints import cost_analysis, recommendations, cloud_resources, auth

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Print debug info
print(f"Python path: {sys.path}")
print(f"Current directory: {os.getcwd()}")

# Initialize FastAPI app
app = FastAPI(
    title="CloudCostIQ API",
    description="FinOps API for multi-cloud cost optimization",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to CloudCostIQ API"}

# Include routers with the correct paths
app.include_router(cost_analysis.router, prefix="/api/cost-analysis", tags=["Cost Analysis"])
app.include_router(recommendations.router, prefix="/api/recommendations", tags=["Recommendations"])
app.include_router(cloud_resources.router, prefix="/api/resources", tags=["Cloud Resources"])
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])

# Include AI routers conditionally
if anomaly_detection_router:
    app.include_router(anomaly_detection_router, prefix="/api/ai/anomalies", tags=["AI Anomaly Detection"])
if forecasting_router:
    app.include_router(forecasting_router, prefix="/api/ai/forecasting", tags=["AI Forecasting"])
if optimization_router:
    app.include_router(optimization_router, prefix="/api/ai/optimization", tags=["AI Optimization"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)