from pydantic import BaseModel, Field, validator, root_validator
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime

class CloudProviderEnum(str, Enum):
    aws = "aws"
    azure = "azure"
    gcp = "gcp"

class ResourceTypeEnum(str, Enum):
    ec2 = "EC2 Instance"
    ebs = "EBS Volume"
    rds = "RDS Instance"
    s3 = "S3 Bucket"
    lambda_function = "Lambda Function"
    vm = "Virtual Machine"
    sql = "SQL Database"
    storage = "Storage Account"
    gce = "Compute Engine"
    gcs = "Cloud Storage"

class RightsizingRequest(BaseModel):
    cloud_provider: CloudProviderEnum = Field(..., description="Cloud provider")
    resource_types: Optional[List[str]] = Field(None, description="Resource types to analyze")
    min_saving_percentage: float = Field(10.0, ge=0, le=100, description="Minimum saving percentage")

class UtilizationMetrics(BaseModel):
    cpu_max: str
    cpu_avg: str
    memory_max: Optional[str] = None
    memory_avg: Optional[str] = None

class RightsizingRecommendation(BaseModel):
    resource_id: str
    resource_type: str
    current_size: str
    recommended_size: str
    current_cost: float
    projected_cost: float
    savings_percentage: float
    monthly_savings: float
    confidence_score: float
    utilization_metrics: UtilizationMetrics

class RightsizingResponse(BaseModel):
    total_potential_savings: float
    recommendations: List[RightsizingRecommendation]

class UnusedResourcesRequest(BaseModel):
    cloud_provider: CloudProviderEnum = Field(..., description="Cloud provider")
    resource_types: Optional[List[str]] = Field(None, description="Resource types to analyze")
    days_inactive: int = Field(30, ge=1, description="Minimum days of inactivity")

class UnusedResource(BaseModel):
    resource_id: str
    resource_type: str
    region: str
    last_used: str  # Date format
    days_inactive: int
    monthly_cost: float
    recommendation: str
    confidence_score: float

class UnusedResourcesResponse(BaseModel):
    total_potential_savings: float
    unused_resources: List[UnusedResource]

class ReservationTerm(int, Enum):
    one_year = 12
    three_years = 36

class ReservationRequest(BaseModel):
    cloud_provider: CloudProviderEnum = Field(..., description="Cloud provider")
    resource_types: Optional[List[str]] = Field(None, description="Resource types to analyze")
    commitment_term: ReservationTerm = Field(ReservationTerm.one_year, description="Commitment period in months")

class ReservationRecommendation(BaseModel):
    resource_type: str
    region: str
    current_on_demand_spend: float
    recommended_commitment: str
    commitment_term: str
    upfront_option: str
    commitment_amount: float
    projected_savings: float
    savings_percentage: float
    confidence_score: float

class ReservationResponse(BaseModel):
    total_on_demand_spend: float
    potential_savings: float
    savings_percentage: float
    recommendations: List[ReservationRecommendation]

    @validator('savings_percentage')
    def validate_savings_percentage(cls, v, values):
        # Verify the savings percentage is calculated correctly
        if 'total_on_demand_spend' in values and 'potential_savings' in values:
            if values['total_on_demand_spend'] > 0:
                expected = (values['potential_savings'] / values['total_on_demand_spend']) * 100
                if abs(v - expected) > 0.1:  # Allow small rounding difference
                    raise ValueError(f"Savings percentage should be {expected:.2f}%")
        return v

# Add for AutoScaling
class AutoScalingRequest(BaseModel):
    cloud_provider: CloudProviderEnum = Field(..., description="Cloud provider")
    resource_types: Optional[List[str]] = Field(None, description="Resource types to analyze")

class CurrentConfig(BaseModel):
    min_instances: int
    max_instances: int
    scaling_metric: str
    scale_out_threshold: str
    scale_in_threshold: str

class RecommendedConfig(BaseModel):
    min_instances: int
    max_instances: int
    scaling_metric: str
    scale_out_threshold: str
    scale_in_threshold: str

class AutoScalingRecommendation(BaseModel):
    resource_group: str
    resource_type: str
    current_config: CurrentConfig
    recommended_config: RecommendedConfig
    potential_benefits: str
    confidence_score: float

class AutoScalingResponse(BaseModel):
    recommendations: List[AutoScalingRecommendation]