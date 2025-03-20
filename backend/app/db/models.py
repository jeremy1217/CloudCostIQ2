from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, JSON, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base
import json

class CloudProvider(Base):
    __tablename__ = "cloud_providers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    api_key = Column(String)
    api_secret = Column(String)
    credentials = Column(Text)
    
    resources = relationship("CloudResource", back_populates="provider")
    costs = relationship("CostEntry", back_populates="provider")

    def __init__(self, **kwargs):
        if 'credentials' in kwargs and isinstance(kwargs['credentials'], dict):
            kwargs['credentials'] = json.dumps(kwargs['credentials'])
        super().__init__(**kwargs)


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