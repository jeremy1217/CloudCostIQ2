from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import date
from enum import Enum

class TimeRangeEnum(str, Enum):
    last_7d = "7d"
    last_30d = "30d"
    last_90d = "90d"
    ytd = "ytd"
    custom = "custom"

class CloudProviderEnum(str, Enum):
    aws = "aws"
    azure = "azure"
    gcp = "gcp"

class DashboardSummaryRequest(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    time_range: TimeRangeEnum = TimeRangeEnum.last_30d
    cloud_providers: Optional[List[CloudProviderEnum]] = None
    
    @validator('end_date')
    def end_date_must_be_after_start_date(cls, v, values):
        if v and 'start_date' in values and values['start_date'] and v < values['start_date']:
            raise ValueError('end_date must be after start_date')
        return v