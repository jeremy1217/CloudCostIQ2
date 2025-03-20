import os
from .database import Base, engine
from .models import CloudProvider, CloudResource, CostEntry, Recommendation
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from dotenv import load_dotenv

# Sample data for demonstration
SAMPLE_PROVIDERS = [
    {"name": "AWS", "api_key": "sample", "api_secret": "sample", "credentials": {}},
    {"name": "Azure", "api_key": "sample", "api_secret": "sample", "credentials": {}},
    {"name": "GCP", "api_key": "sample", "api_secret": "sample", "credentials": {}}
]

def init_db():
    """Initialize the database with tables and sample data"""
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Add sample data
    db = Session(engine)
    
    # Check if we already have data
    existing_providers = db.query(CloudProvider).all()
    if existing_providers:
        print("Database already contains data. Skipping sample data creation.")
        db.close()
        return
    
    # Add sample cloud providers
    for provider_data in SAMPLE_PROVIDERS:
        provider = CloudProvider(**provider_data)
        db.add(provider)
    
    db.commit()
    print("Database initialized with sample data.")
    db.close()

if __name__ == "__main__":
    # Load environment variables
    load_dotenv()
    
    # Initialize database
    init_db() 