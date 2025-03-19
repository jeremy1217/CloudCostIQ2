from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

# Import and include routers
from app.api.endpoints import cost_analysis, recommendations, cloud_resources

app.include_router(cost_analysis.router, prefix="/api/cost-analysis", tags=["Cost Analysis"])
app.include_router(recommendations.router, prefix="/api/recommendations", tags=["Recommendations"])
app.include_router(cloud_resources.router, prefix="/api/resources", tags=["Cloud Resources"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True) 