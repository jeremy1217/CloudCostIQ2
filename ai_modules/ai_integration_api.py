import logging
import os
import json
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
import uuid
from typing import Dict, List, Any, Optional, Union, Tuple

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("ai_cost_api")

# Import FastAPI
try:
    from fastapi import APIRouter, Depends, HTTPException, Header, Body, Request
    from fastapi.responses import JSONResponse
    from pydantic import BaseModel, Field
except ImportError:
    logger.error("FastAPI is not available. Please install it with 'pip install fastapi'")
    raise ImportError("FastAPI is required but not installed")

# Import our ML modules
try:
    from .enhanced_anomaly_detection import DeepAnomalyDetector, TENSORFLOW_AVAILABLE
    from .advanced_forecasting import DeepLearningForecaster
    from .intelligent_resource_optimizer import (
        WorkloadClassifier, 
        OptimalInstanceSelector,
        AutoScalingOptimizer,
        ReservationOptimizer,
        ResourceOptimizationManager
    )
except ImportError as e:
    logger.error(f"Error importing ML modules: {e}")
    # Define placeholder classes if imports fail
    class DeepAnomalyDetector:
        def __init__(self, *args, **kwargs):
            pass
    class DeepLearningForecaster:
        def __init__(self, *args, **kwargs):
            self.trained = False
    class ResourceOptimizationManager:
        def __init__(self, *args, **kwargs):
            pass
    TENSORFLOW_AVAILABLE = False

# Constants
MODEL_DIR = os.environ.get("MODEL_DIR", "./models")
CONFIG_DIR = os.environ.get("CONFIG_DIR", "./config")
DATA_DIR = os.environ.get("DATA_DIR", "./data")

# Ensure directories exist
os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(CONFIG_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

# Initialize models
anomaly_detector = None
forecaster = None
optimizer = None

# Track API usage
api_usage_stats = {
    "total_requests": 0,
    "endpoint_usage": {},
    "errors": 0,
    "last_reset": datetime.now().isoformat()
}

# API Versioning
API_VERSION = "1.0.0"

# ===== Helper Functions =====

def load_models():
    """Load ML models from disk if available."""
    global anomaly_detector, forecaster, optimizer
    
    try:
        # Load anomaly detection model
        anomaly_model_path = os.path.join(MODEL_DIR, "anomaly_detector")
        if os.path.exists(f"{anomaly_model_path}_metadata"):
            logger.info("Loading anomaly detection model...")
            anomaly_detector = DeepAnomalyDetector(model_path=anomaly_model_path)
            logger.info("Anomaly detection model loaded successfully.")
        else:
            logger.info("No existing anomaly detection model found. Will initialize a new one.")
            anomaly_detector = DeepAnomalyDetector()
        
        # Load forecasting model
        forecast_model_path = os.path.join(MODEL_DIR, "forecaster")
        if os.path.exists(f"{forecast_model_path}_metadata"):
            logger.info("Loading forecasting model...")
            forecaster = DeepLearningForecaster(model_path=forecast_model_path)
            logger.info("Forecasting model loaded successfully.")
        else:
            logger.info("No existing forecasting model found. Will initialize a new one.")
            forecaster = DeepLearningForecaster()
        
        # Load resource optimization components
        instance_catalog_path = os.path.join(CONFIG_DIR, "instance_catalog.json")
        pricing_path = os.path.join(CONFIG_DIR, "pricing_data.json")
        
        if os.path.exists(instance_catalog_path) and os.path.exists(pricing_path):
            logger.info("Loading resource optimization components...")
            optimizer = ResourceOptimizationManager(
                instance_catalog_path=instance_catalog_path,
                pricing_path=pricing_path
            )
            logger.info("Resource optimization components loaded successfully.")
        else:
            logger.info("No existing resource data found. Will initialize with empty data.")
            optimizer = ResourceOptimizationManager()
        
    except Exception as e:
        logger.error(f"Error loading models: {str(e)}")
        # Initialize default models
        anomaly_detector = DeepAnomalyDetector()
        forecaster = DeepLearningForecaster()
        optimizer = ResourceOptimizationManager()

def save_models():
    """Save ML models to disk."""
    try:
        # Save anomaly detection model
        anomaly_model_path = os.path.join(MODEL_DIR, "anomaly_detector")
        if anomaly_detector:
            logger.info("Saving anomaly detection model...")
            anomaly_detector.save_model(anomaly_model_path)
            logger.info("Anomaly detection model saved successfully.")
        
        # Save forecasting model
        forecast_model_path = os.path.join(MODEL_DIR, "forecaster")
        if forecaster and forecaster.trained:
            logger.info("Saving forecasting model...")
            forecaster.save_model(forecast_model_path)
            logger.info("Forecasting model saved successfully.")
    
    except Exception as e:
        logger.error(f"Error saving models: {str(e)}")

def log_api_call(endpoint: str):
    """Log API usage statistics."""
    api_usage_stats["total_requests"] += 1
    
    if endpoint not in api_usage_stats["endpoint_usage"]:
        api_usage_stats["endpoint_usage"][endpoint] = 1
    else:
        api_usage_stats["endpoint_usage"][endpoint] += 1

def log_error():
    """Log API error."""
    api_usage_stats["errors"] += 1

def validate_auth(auth_token: str) -> bool:
    """Validate authentication token."""
    # In a real implementation, this would check against a database
    # or validate with OAuth or similar
    valid_tokens = [
        "test-token-1234",  # Development token
        os.environ.get("API_AUTH_TOKEN", "")  # Token from environment
    ]
    
    return auth_token in valid_tokens

def load_instance_catalog() -> Dict[str, Any]:
    """Load instance catalog from disk."""
    catalog_path = os.path.join(CONFIG_DIR, "instance_catalog.json")
    if os.path.exists(catalog_path):
        with open(catalog_path, 'r') as f:
            return json.load(f)
    return {}

def load_pricing_data() -> Dict[str, Any]:
    """Load pricing data from disk."""
    pricing_path = os.path.join(CONFIG_DIR, "pricing_data.json")
    if os.path.exists(pricing_path):
        with open(pricing_path, 'r') as f:
            return json.load(f)
    return {}

def save_to_disk(data: Dict[str, Any], filename: str):
    """Save data to disk."""
    filepath = os.path.join(DATA_DIR, filename)
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)
    return filepath

# ===== Define Pydantic models for requests and responses =====

# Auth dependency
async def get_token_header(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    token = authorization.replace("Bearer ", "")
    if not validate_auth(token):
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return token

# Anomaly Detection models
class CostData(BaseModel):
    cost_data: List[Dict[str, Any]]
    
class AnomalyDetectionRequest(CostData):
    pass

class AnomalyDetectionResponse(BaseModel):
    anomalies: List[Dict[str, Any]]
    count: int
    timestamp: str
    processed_data_points: int

class TrainingRequest(CostData):
    validation_split: float = 0.2
    epochs: int = 50
    batch_size: int = 32

class TrainingResponse(BaseModel):
    message: str
    training_results: Dict[str, Any]
    timestamp: str

# Forecasting models
class ForecastRequest(CostData):
    forecast_steps: int = 30
    return_confidence_intervals: bool = True
    confidence_level: float = 0.9

class ForecastResponse(BaseModel):
    forecast: Dict[str, Any]
    timestamp: str
    model_version: str
    forecast_horizon: int
    
class ForecastTrainingRequest(CostData):
    target_column: str = "daily_cost"
    validation_split: float = 0.2
    epochs: int = 100
    batch_size: int = 32
    patience: int = 10
    model_type: str = "lstm"

# ===== Initialize FastAPI routers =====

# Create routers
anomaly_detection_router = APIRouter(prefix="/api/v1/anomaly-detection", tags=["Anomaly Detection"])
forecasting_router = APIRouter(prefix="/api/v1/forecasting", tags=["Forecasting"])
optimization_router = APIRouter(prefix="/api/v1/optimization", tags=["Optimization"])
config_router = APIRouter(prefix="/api/v1/config", tags=["Configuration"])
combined_router = APIRouter(prefix="/api/v1/combined", tags=["Combined Analysis"])
status_router = APIRouter(prefix="/api/v1", tags=["Status"])

# Add startup event handlers
@anomaly_detection_router.on_event("startup")
@forecasting_router.on_event("startup")
@optimization_router.on_event("startup")
@config_router.on_event("startup")
@combined_router.on_event("startup")
@status_router.on_event("startup")
async def startup():
    """Load models at startup."""
    load_models()

# ===== API Endpoints =====

@status_router.get("/status")
async def get_status():
    """Get API status and version information."""
    log_api_call("/api/v1/status")
    
    return {
        "status": "operational",
        "version": API_VERSION,
        "timestamp": datetime.now().isoformat(),
        "models": {
            "anomaly_detector": "loaded" if anomaly_detector else "not_loaded",
            "forecaster": "loaded" if forecaster else "not_loaded",
            "optimizer": "loaded" if optimizer else "not_loaded"
        },
        "api_stats": {
            "total_requests": api_usage_stats["total_requests"],
            "errors": api_usage_stats["errors"],
            "uptime": str(datetime.now() - datetime.fromisoformat(api_usage_stats["last_reset"]))
        }
    }

@anomaly_detection_router.post("/detect", response_model=AnomalyDetectionResponse)
async def detect_anomalies(
    request: AnomalyDetectionRequest,
    token: str = Depends(get_token_header)
):
    """Detect anomalies in cost data."""
    log_api_call("/api/v1/anomaly-detection/detect")
    
    try:
        cost_data = request.cost_data
        
        if not cost_data:
            raise HTTPException(status_code=400, detail="No cost data provided")
        
        # Detect anomalies
        anomalies = anomaly_detector.detect_anomalies(cost_data)
        
        # Return results
        return {
            "anomalies": anomalies,
            "count": len(anomalies),
            "timestamp": datetime.now().isoformat(),
            "processed_data_points": len(cost_data)
        }
    
    except Exception as e:
        logger.error(f"Error detecting anomalies: {str(e)}")
        log_error()
        raise HTTPException(status_code=500, detail=f"Error detecting anomalies: {str(e)}")

@anomaly_detection_router.post("/train", response_model=TrainingResponse)
async def train_anomaly_detector(
    request: TrainingRequest,
    token: str = Depends(get_token_header)
):
    """Train the anomaly detection model with new data."""
    log_api_call("/api/v1/anomaly-detection/train")
    
    try:
        cost_data = request.cost_data
        validation_split = request.validation_split
        epochs = request.epochs
        batch_size = request.batch_size
        
        if not cost_data:
            raise HTTPException(status_code=400, detail="No training data provided")
        
        # Train the model
        training_results = anomaly_detector.train(
            cost_data=cost_data,
            validation_split=validation_split,
            epochs=epochs,
            batch_size=batch_size
        )
        
        # Save the model
        save_models()
        
        # Return results
        return {
            "message": "Anomaly detection model trained successfully",
            "training_results": training_results,
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error training anomaly detector: {str(e)}")
        log_error()
        raise HTTPException(status_code=500, detail=f"Error training anomaly detector: {str(e)}")

@forecasting_router.post("/predict", response_model=ForecastResponse)
async def forecast_costs(
    request: ForecastRequest,
    token: str = Depends(get_token_header)
):
    """Generate cost forecasts."""
    log_api_call("/api/v1/forecasting/predict")
    
    try:
        cost_data = request.cost_data
        forecast_steps = request.forecast_steps
        return_confidence = request.return_confidence_intervals
        confidence_level = request.confidence_level
        
        if not cost_data:
            raise HTTPException(status_code=400, detail="No historical cost data provided")
        
        # Check if model is trained
        if not forecaster.trained:
            raise HTTPException(status_code=400, detail="Forecasting model needs to be trained first")
        
        # Generate forecast
        forecast_result = forecaster.forecast(
            cost_data=cost_data,
            forecast_steps=forecast_steps,
            return_confidence_intervals=return_confidence,
            confidence_level=confidence_level
        )
        
        # Return results
        return {
            "forecast": forecast_result,
            "timestamp": datetime.now().isoformat(),
            "model_version": forecaster.version,
            "forecast_horizon": forecast_steps
        }
    
    except Exception as e:
        logger.error(f"Error generating forecast: {str(e)}")
        log_error()
        raise HTTPException(status_code=500, detail=f"Error generating forecast: {str(e)}")

@forecasting_router.post("/train", response_model=TrainingResponse)
async def train_forecaster(
    request: ForecastTrainingRequest, 
    token: str = Depends(get_token_header)
):
    """Train the cost forecasting model with new data."""
    log_api_call("/api/v1/forecasting/train")
    
    try:
        cost_data = request.cost_data
        target_column = request.target_column
        validation_split = request.validation_split
        epochs = request.epochs
        batch_size = request.batch_size
        patience = request.patience
        model_type = request.model_type
        
        if not cost_data:
            raise HTTPException(status_code=400, detail="No training data provided")
        
        # Create a new forecaster with the specified model type if needed
        if model_type != forecaster.model_type:
            forecaster = DeepLearningForecaster(model_type=model_type)
        
        # Train the model
        training_results = forecaster.train(
            cost_data=cost_data,
            target_column=target_column,
            validation_split=validation_split,
            epochs=epochs,
            batch_size=batch_size,
            patience=patience
        )
        
        # Save the model
        save_models()
        
        # Return results
        return {
            "message": "Forecasting model trained successfully",
            "training_results": training_results,
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error training forecaster: {str(e)}")
        log_error()
        raise HTTPException(status_code=500, detail=f"Error training forecaster: {str(e)}")

# Add other endpoints for forecasting_router, optimization_router, etc.
# Following the same pattern as above

# You can export all routers to be imported in your main FastAPI app
routers = [
    anomaly_detection_router,
    forecasting_router,
    optimization_router,
    config_router,
    combined_router,
    status_router
]