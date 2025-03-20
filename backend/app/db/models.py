from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import JSON
from sqlalchemy.ext.mutable import MutableDict
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, JSON, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base
import json
from app.security.encryption import encrypt_data, decrypt_data
from app.schemas.credentials import AWSCredentials, AzureCredentials, GCPCredentials

class CloudProvider(Base):
    __tablename__ = "cloud_providers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    api_key = Column(String)
    api_secret = Column(String)
    # Replace the Text column with JSONB
    # credentials = Column(JSONB)  # Use JSONB for PostgreSQL
    credentials = Column(MutableDict.as_mutable(JSON))
    
    resources = relationship("CloudResource", back_populates="provider")
    costs = relationship("CostEntry", back_populates="provider")
   
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
    
    def set_credentials(self, credentials_dict, provider_type):
        """Validate and encrypt credentials"""
        # Validate based on provider type
        if provider_type.lower() == 'aws':
            AWSCredentials(**credentials_dict)  # Raises ValidationError if invalid
        elif provider_type.lower() == 'azure':
            AzureCredentials(**credentials_dict)
        elif provider_type.lower() == 'gcp':
            GCPCredentials(**credentials_dict)
        else:
            raise ValueError(f"Unsupported provider type: {provider_type}")
            
        # Encrypt the credentials
        json_str = json.dumps(credentials_dict)
        self.credentials = encrypt_data(json_str)
    def set_credentials(self, credentials_dict):
        """Encrypt credentials before storing"""
        if credentials_dict:
            json_str = json.dumps(credentials_dict)
            self.credentials = encrypt_data(json_str)
    
    def get_credentials(self):
        """Decrypt credentials when retrieving"""
        if self.credentials:
            decrypted = decrypt_data(self.credentials)
            return json.loads(decrypted)
        return {}


class CloudResource(Base):
    __tablename__ = "cloud_resources"
    
    id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(String, index=True)
    provider_id = Column(Integer, ForeignKey("cloud_providers.id"))
    name = Column(String)
    type = Column(String)
    region = Column(String)
    tags = Column(Text)
    properties = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow)
    
    provider = relationship("CloudProvider", back_populates="resources")
    costs = relationship("CostEntry", back_populates="resource")

    def __init__(self, **kwargs):
        if 'tags' in kwargs and isinstance(kwargs['tags'], dict):
            kwargs['tags'] = json.dumps(kwargs['tags'])
        if 'properties' in kwargs and isinstance(kwargs['properties'], dict):
            kwargs['properties'] = json.dumps(kwargs['properties'])
        super().__init__(**kwargs)


class CostEntry(Base):
    __tablename__ = "cost_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("cloud_providers.id"))
    resource_id = Column(Integer, ForeignKey("cloud_resources.id"))
    date = Column(DateTime)
    amount = Column(Float)
    currency = Column(String, default="USD")
    service = Column(String)
    region = Column(String)
    tags = Column(Text)
    
    provider = relationship("CloudProvider", back_populates="costs")
    resource = relationship("CloudResource", back_populates="costs")

    def __init__(self, **kwargs):
        if 'tags' in kwargs and isinstance(kwargs['tags'], dict):
            kwargs['tags'] = json.dumps(kwargs['tags'])
        super().__init__(**kwargs)


class Recommendation(Base):
    __tablename__ = "recommendations"
    
    id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(Integer, ForeignKey("cloud_resources.id"))
    type = Column(String)  # rightsizing, unused, reservations
    title = Column(String)
    description = Column(String)
    current_config = Column(Text)
    recommended_config = Column(Text)
    monthly_savings = Column(Float)
    savings_percentage = Column(Float)
    confidence = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    implemented = Column(Boolean, default=False)
    
    resource = relationship("CloudResource")

    def __init__(self, **kwargs):
        if 'current_config' in kwargs and isinstance(kwargs['current_config'], dict):
            kwargs['current_config'] = json.dumps(kwargs['current_config'])
        if 'recommended_config' in kwargs and isinstance(kwargs['recommended_config'], dict):
            kwargs['recommended_config'] = json.dumps(kwargs['recommended_config'])
        super().__init__(**kwargs) 

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    
    organization = relationship("Organization", back_populates="users")