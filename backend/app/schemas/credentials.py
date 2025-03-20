from pydantic import BaseModel, validator, Field
from typing import Optional, Dict, Any

class AWSCredentials(BaseModel):
    aws_access_key_id: str
    aws_secret_access_key: str
    region: str = "us-east-1"
    
    @validator('aws_access_key_id')
    def validate_access_key(cls, v):
        if not v.startswith('AKIA'):
            raise ValueError('Invalid AWS access key format')
        return v

class AzureCredentials(BaseModel):
    client_id: str
    client_secret: str
    tenant_id: str
    
    @validator('tenant_id')
    def validate_tenant_id(cls, v):
        if len(v) != 36:  # UUID format
            raise ValueError('Invalid Azure tenant ID format')
        return v

class GCPCredentials(BaseModel):
    type: str = Field(..., description="Type of account")
    project_id: str
    private_key_id: str
    private_key: str
    client_email: str
    client_id: str
    auth_uri: str = "https://accounts.google.com/o/oauth2/auth"
    token_uri: str = "https://oauth2.googleapis.com/token"
    
    @validator('type')
    def validate_type(cls, v):
        if v != "service_account":
            raise ValueError('Type must be "service_account"')
        return v