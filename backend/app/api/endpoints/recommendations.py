from fastapi import APIRouter, Query
from typing import List, Optional
from app.schemas.recommendations import (
    RightsizingRequest, RightsizingResponse,
    UnusedResourcesRequest, UnusedResourcesResponse,
    ReservationRequest, ReservationResponse
)
from app.auth.dependencies import get_current_user
from app.db.models import User

router = APIRouter()

@router.get("/rightsizing", response_model=RightsizingResponse)
async def get_rightsizing_recommendations(
    request: RightsizingRequest = Depends(),
    current_user: User = Depends(get_current_user)
    # cloud_provider: str = Query(..., description="Cloud provider (aws, azure, gcp)"),
    # resource_types: List[str] = Query(None, description="Resource types to analyze"),
    # min_saving_percentage: float = Query(10.0, description="Minimum saving percentage to include")
):
    """Get resource rightsizing recommendations."""
    # In production, this would analyze actual resource usage data and provide recommendations
    org_id = current_user.organization_id

    min_saving = request.min_saving_percentage

    return {
        "total_potential_savings": 1234.56,
        "recommendations": [
            {
                "resource_id": "i-0abc123def456789",
                "resource_type": "EC2 Instance",
                "current_size": "m5.xlarge",
                "recommended_size": "m5.large",
                "current_cost": 150.00,
                "projected_cost": 75.00,
                "savings_percentage": 50.0,
                "monthly_savings": 75.00,
                "confidence_score": 0.92,
                "utilization_metrics": {
                    "cpu_max": "45%",
                    "cpu_avg": "22%",
                    "memory_max": "38%",
                    "memory_avg": "30%"
                }
            },
            {
                "resource_id": "i-0def456789abc123",
                "resource_type": "EC2 Instance",
                "current_size": "r5.2xlarge",
                "recommended_size": "r5.xlarge",
                "current_cost": 320.00,
                "projected_cost": 160.00,
                "savings_percentage": 50.0,
                "monthly_savings": 160.00,
                "confidence_score": 0.88,
                "utilization_metrics": {
                    "cpu_max": "52%",
                    "cpu_avg": "28%",
                    "memory_max": "45%",
                    "memory_avg": "38%"
                }
            }
        ]
    }

@router.get("/unused-resources", response_model=UnusedResourcesResponse))
async def get_unused_resources(
    request: UnusedResourcesRequest = Depends(),
    current_user: User = Depends(get_current_user)
    # cloud_provider: str = Query(..., description="Cloud provider (aws, azure, gcp)"),
    # resource_types: List[str] = Query(None, description="Resource types to analyze"),
    # days_inactive: int = Query(30, description="Minimum days of inactivity")
):
    """Get unused resources that could be terminated."""
    # In production, this would analyze actual usage data

    org_id = current_user.organization_id
    
    # Filter by days inactive
    days_inactive = request.days_inactive

    return {
        "total_potential_savings": 987.65,
        "unused_resources": [
            {
                "resource_id": "vol-0abc123def456789",
                "resource_type": "EBS Volume",
                "region": "us-west-2",
                "last_used": "2022-11-15",
                "days_inactive": 60,
                "monthly_cost": 25.60,
                "recommendation": "Delete unused volume",
                "confidence_score": 0.98
            },
            {
                "resource_id": "eipalloc-0abc123def456789",
                "resource_type": "Elastic IP",
                "region": "us-east-1",
                "last_used": "2022-12-01",
                "days_inactive": 45,
                "monthly_cost": 7.20,
                "recommendation": "Release unused Elastic IP",
                "confidence_score": 0.99
            },
            {
                "resource_id": "i-0def456789abc123",
                "resource_type": "EC2 Instance",
                "region": "eu-west-1",
                "last_used": "2022-12-15",
                "days_inactive": 30,
                "monthly_cost": 105.85,
                "recommendation": "Stop or terminate idle instance",
                "confidence_score": 0.85
            }
        ]
    }

@router.get("/reservation-optimization", response_model=ReservationResponse))
async def get_reservation_recommendations(
    request: ReservationRequest = Depends(),
    current_user: User = Depends(get_current_user)
    # cloud_provider: str = Query(..., description="Cloud provider (aws, azure, gcp)"),
    # resource_types: List[str] = Query(None, description="Resource types to analyze"),
    # commitment_term: int = Query(12, description="Commitment period in months (12 or 36)")
):
    """Get reserved instance or savings plan recommendations."""
    # In production, this would analyze actual on-demand usage patterns
    org_id = current_user.organization_id
    
    # Only show recommendations for specified term length
    commitment_term = request.commitment_term
    
    # Mock response for development
    total_spend = 5432.10
    savings = 1875.50
    percentage = (savings / total_spend) * 100

    return {
        "total_on_demand_spend": 5432.10,
        "potential_savings": 1875.50,
        "savings_percentage": 34.53,
        "recommendations": [
            {
                "resource_type": "EC2 - General Purpose",
                "region": "us-east-1",
                "current_on_demand_spend": 2150.00,
                "recommended_commitment": "Savings Plan - Compute",
                "commitment_term": "1 Year",
                "upfront_option": "No Upfront",
                "commitment_amount": 1290.00,
                "projected_savings": 860.00,
                "savings_percentage": 40.0,
                "confidence_score": 0.90
            },
            {
                "resource_type": "RDS - MySQL",
                "region": "us-west-2",
                "current_on_demand_spend": 1345.00,
                "recommended_commitment": "Reserved Instances",
                "commitment_term": "1 Year",
                "upfront_option": "Partial Upfront",
                "commitment_amount": 875.00,
                "projected_savings": 470.00,
                "savings_percentage": 34.94,
                "confidence_score": 0.88
            }
        ]
    }

@router.get("/auto-scaling")
async def get_auto_scaling_recommendations(
    cloud_provider: str = Query(..., description="Cloud provider (aws, azure, gcp)"),
    resource_types: List[str] = Query(None, description="Resource types to analyze")
):
    """Get auto-scaling recommendations based on usage patterns."""
    # In production, this would analyze actual usage patterns and provide auto-scaling recommendations
    return {
        "recommendations": [
            {
                "resource_group": "web-servers",
                "resource_type": "EC2 Auto Scaling Group",
                "current_config": {
                    "min_instances": 5,
                    "max_instances": 10,
                    "scaling_metric": "CPU Utilization",
                    "scale_out_threshold": "70%",
                    "scale_in_threshold": "30%"
                },
                "recommended_config": {
                    "min_instances": 3,
                    "max_instances": 15,
                    "scaling_metric": "Request Count Per Target",
                    "scale_out_threshold": "1000 requests/minute",
                    "scale_in_threshold": "300 requests/minute"
                },
                "potential_benefits": "More responsive scaling with 15% cost reduction during low traffic periods",
                "confidence_score": 0.87
            },
            {
                "resource_group": "api-servers",
                "resource_type": "Kubernetes Cluster",
                "current_config": {
                    "min_pods": 8,
                    "max_pods": 16,
                    "scaling_metric": "CPU Utilization",
                    "scale_out_threshold": "75%",
                    "scale_in_threshold": "40%"
                },
                "recommended_config": {
                    "min_pods": 4,
                    "max_pods": 24,
                    "scaling_metric": "Concurrent Requests",
                    "scale_out_threshold": "1500 concurrent requests",
                    "scale_in_threshold": "500 concurrent requests"
                },
                "potential_benefits": "Better traffic handling and 20% cost reduction overnight",
                "confidence_score": 0.85
            }
        ]
    } 

@router.get("/auto-scaling", response_model=AutoScalingResponse)
async def get_auto_scaling_recommendations(
    request: AutoScalingRequest = Depends(),
    current_user: User = Depends(get_current_user)
):
    """Get auto-scaling recommendations based on usage patterns."""
    # In production, this would analyze actual usage patterns
    # and filter based on user's organization
    org_id = current_user.organization_id
    
    # Mock response for development
    return {
        "recommendations": [
            {
                "resource_group": "web-servers",
                "resource_type": "EC2 Auto Scaling Group",
                "current_config": {
                    "min_instances": 5,
                    "max_instances": 10,
                    "scaling_metric": "CPU Utilization",
                    "scale_out_threshold": "70%",
                    "scale_in_threshold": "30%"
                },
                "recommended_config": {
                    "min_instances": 3,
                    "max_instances": 15,
                    "scaling_metric": "Request Count Per Target",
                    "scale_out_threshold": "1000 requests/minute",
                    "scale_in_threshold": "300 requests/minute"
                },
                "potential_benefits": "More responsive scaling with 15% cost reduction during low traffic periods",
                "confidence_score": 0.87
            },
            {
                "resource_group": "api-servers",
                "resource_type": "Kubernetes Cluster",
                "current_config": {
                    "min_instances": 8,
                    "max_instances": 16,
                    "scaling_metric": "CPU Utilization",
                    "scale_out_threshold": "75%",
                    "scale_in_threshold": "40%"
                },
                "recommended_config": {
                    "min_instances": 4,
                    "max_instances": 24,
                    "scaling_metric": "Concurrent Requests",
                    "scale_out_threshold": "1500 concurrent requests",
                    "scale_in_threshold": "500 concurrent requests"
                },
                "potential_benefits": "Better traffic handling and 20% cost reduction overnight",
                "confidence_score": 0.85
            }
        ]
    }