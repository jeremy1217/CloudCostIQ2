from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime

class ResourceType(str, Enum):
    compute = "compute"
    storage = "storage"
    database = "database"
    networking = "networking"
    other = "other"

class CloudProviderEnum(str, Enum):
    aws = "aws"
    azure = "azure"
    gcp = "gcp"

class ResourceSummaryRequest(BaseModel):
    cloud_providers: Optional[List[CloudProviderEnum]] = None

class ResourceSummaryResponse(BaseModel):
    total_resources: int
    resources_by_provider: Dict[str, int]
    resources_by_type: Dict[str, int]

class ResourceInventoryRequest(BaseModel):
    cloud_provider: CloudProviderEnum = Field(..., description="Cloud provider (aws, azure, gcp)")
    resource_type: Optional[str] = Field(None, description="Resource type")
    region: Optional[str] = Field(None, description="Region/location")
    limit: int = Field(50, ge=1, le=100, description="Maximum number of resources to return")
    offset: int = Field(0, ge=0, description="Offset for pagination")

class ResourceTag(BaseModel):
    key: str
    value: str

class ResourceItem(BaseModel):
    id: str
    name: str
    type: str
    region: str
    status: str
    size: Optional[str] = None
    tags: Dict[str, str] = {}
    monthly_cost: float
    creation_date: str
    last_modified: str

class ResourceInventoryResponse(BaseModel):
    total_count: int
    returned_count: int
    resources: List[ResourceItem]

class UtilizationMetric(str, Enum):
    cpu = "cpu"
    memory = "memory"
    disk = "disk"
    network = "network"

class TimePeriod(str, Enum):
    day = "24h"
    week = "7d"
    month = "30d"

class ResourceUtilizationRequest(BaseModel):
    cloud_provider: CloudProviderEnum = Field(..., description="Cloud provider")
    resource_id: str = Field(..., description="Resource ID")
    metric: UtilizationMetric = Field(UtilizationMetric.cpu, description="Metric to retrieve")
    period: TimePeriod = Field(TimePeriod.week, description="Time period")

class ResourceUtilizationResponse(BaseModel):
    resource_id: str
    resource_name: str
    metric: str
    period: str
    timestamps: List[str]
    values: List[float]
    average: float
    max: float
    min: float
    p95: float