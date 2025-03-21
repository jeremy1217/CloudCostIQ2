import os
from .database import Base, engine
from .models import CloudProvider, CloudResource, CostEntry, Recommendation, User, AIModel
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from dotenv import load_dotenv
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Sample data for demonstration
SAMPLE_PROVIDERS = [
    {"name": "AWS", "api_key": "sample", "api_secret": "sample", "credentials": {}},
    {"name": "Azure", "api_key": "sample", "api_secret": "sample", "credentials": {}},
    {"name": "GCP", "api_key": "sample", "api_secret": "sample", "credentials": {}}
]

def init_db():
    """Initialize the database with tables and sample data"""
    try:
        # Create tables
        logger.info("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
        
        # Add sample data
        db = Session(engine)
        
        # Check if we already have data
        existing_providers = db.query(CloudProvider).all()
        if existing_providers:
            logger.info("Database already contains data. Skipping sample data creation.")
            db.close()
            return
        
        # Add sample cloud providers
        for provider_data in SAMPLE_PROVIDERS:
            provider = CloudProvider(**provider_data)
            db.add(provider)
        
        db.commit()
        logger.info("Database initialized with sample data.")
        db.close()
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        raise

if __name__ == "__main__":
    # Load environment variables
    load_dotenv()
    
    # Initialize database
    init_db() 