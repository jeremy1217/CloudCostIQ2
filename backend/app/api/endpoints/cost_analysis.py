from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from app.schemas.cost_analysis import DashboardSummaryRequest
from app.auth.dependencies import get_current_user
from app.db.models import User
from datetime import datetime, timedelta
from ai_modules.enhanced_anomaly_detection import DeepAnomalyDetector
from ai_modules.advanced_forecasting import DeepLearningForecaster

router = APIRouter()

# Initialize AI models
anomaly_detector = DeepAnomalyDetector()
forecaster = DeepLearningForecaster()




@router.get("/dashboard-summary")
async def get_dashboard_summary(
    request: DashboardSummaryRequest = Depends(),
    current_user: User = Depends(get_current_user)
    # start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    # end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    # cloud_providers: List[str] = Query(None, description="List of cloud providers to include")
):
    """Get a summary of costs across all cloud providers for the dashboard."""
    # This would connect to your actual data source in production
    # Mock response for development
    return {
        "total_cost": 12345.67,
        "cost_by_provider": {
            "aws": 5432.10,
            "azure": 4321.01,
            "gcp": 2592.56
        },
        "month_over_month_change": 7.5,
        "cost_by_service_type": {
            "compute": 6543.21,
            "storage": 3210.45,
            "database": 2109.87,
            "other": 482.14
        }
    }

@router.get("/time-series")
async def get_time_series_data(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    granularity: str = Query("daily", description="Data granularity (hourly, daily, weekly, monthly)"),
    cloud_providers: List[str] = Query(None, description="List of cloud providers to include")
):
    """Get time-series cost data for visualization."""
    # Mock time-series data
    # In production, this would query your database or cloud provider APIs
    return {
        "timestamps": ["2023-01-01", "2023-01-02", "2023-01-03", "2023-01-04", "2023-01-05"],
        "series": [
            {
                "name": "AWS",
                "data": [1234.56, 1245.67, 1256.78, 1267.89, 1278.90]
            },
            {
                "name": "Azure",
                "data": [987.65, 998.76, 1009.87, 1020.98, 1032.09]
            },
            {
                "name": "GCP",
                "data": [567.89, 578.90, 589.01, 600.12, 611.23]
            }
        ]
    }

@router.get("/resource-breakdown")
async def get_resource_breakdown(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    cloud_provider: str = Query(..., description="Cloud provider (aws, azure, gcp)"),
    group_by: str = Query("service", description="Grouping (service, region, account, tag)")
):
    """Get cost breakdown by resource grouping."""
    # Mock resource breakdown data
    return {
        "total": 9876.54,
        "groups": [
            {"name": "EC2", "cost": 4321.09, "percentage": 43.75},
            {"name": "S3", "cost": 2109.87, "percentage": 21.36},
            {"name": "RDS", "cost": 1598.76, "percentage": 16.19},
            {"name": "Lambda", "cost": 987.65, "percentage": 10.00},
            {"name": "Others", "cost": 859.17, "percentage": 8.70}
        ]
    }

@router.get("/anomalies")
async def get_cost_anomalies(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    cloud_providers: List[str] = Query(None, description="List of cloud providers to include"),
    sensitivity: float = Query(0.8, description="Anomaly detection sensitivity (0-1)")
):
    """Get detected cost anomalies based on ML models."""
    # In production, this would use actual ML models for anomaly detection
    return {
        "anomalies": [
            {
                "date": "2023-01-03",
                "service": "EC2",
                "expected_cost": 450.00,
                "actual_cost": 675.50,
                "percentage_increase": 50.11,
                "severity": "high",
                "possible_causes": ["Instance scaling event", "New instances launched"]
            },
            {
                "date": "2023-01-04",
                "service": "S3",
                "expected_cost": 120.00,
                "actual_cost": 165.75,
                "percentage_increase": 38.13,
                "severity": "medium",
                "possible_causes": ["Large data transfer", "Increased storage usage"]
            }
        ]
    }

@router.get("/forecast")
async def get_cost_forecast(
    days_to_forecast: int = Query(30, description="Number of days to forecast"),
    cloud_providers: List[str] = Query(None, description="List of cloud providers to include")
):
    """Get cost forecasts based on ML prediction models."""
    # In production, this would use actual ML prediction models
    return {
        "current_month_projected": 14500.00,
        "next_month_forecast": 15200.00,
        "forecast_data": {
            "timestamps": ["2023-02-01", "2023-02-02", "2023-02-03", "2023-02-04", "2023-02-05"],
            "lower_bound": [14200.00, 14220.00, 14250.00, 14260.00, 14300.00],
            "prediction": [14500.00, 14550.00, 14600.00, 14650.00, 14700.00],
            "upper_bound": [14800.00, 14880.00, 14950.00, 15040.00, 15100.00]
        }
    } 

# Add new AI-enhanced endpoints
@router.post("/ai-anomalies")
async def detect_cost_anomalies(
    data: dict,
    current_user: User = Depends(get_current_user)
):
    """Detect anomalies using AI/ML"""
    cost_data = data.get("cost_data", [])
    org_id = current_user.organization_id
    
    # Detect anomalies
    anomalies = anomaly_detector.detect_anomalies(cost_data)
    
    return {
        "anomalies": anomalies,
        "count": len(anomalies),
        "organization_id": org_id
    }

@router.post("/ai-forecast")
async def forecast_costs(
    data: dict,
    forecast_days: int = 30,
    current_user: User = Depends(get_current_user)
):
    """Generate cost forecasts using AI/ML"""
    cost_data = data.get("cost_data", [])
    org_id = current_user.organization_id
    
    # Generate forecast
    forecast = forecaster.forecast(cost_data, forecast_steps=forecast_days)
    
    return {
        "forecast": forecast,
        "organization_id": org_id
    }