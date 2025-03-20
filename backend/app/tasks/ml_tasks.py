from app.worker import celery_app
from app.ml_pipeline.pipeline import MLPipeline
from app.db.database import SessionLocal
from app.db.models import Organization
import logging

logger = logging.getLogger(__name__)

@celery_app.task
def train_all_models():
    """Train models for all organizations"""
    logger.info("Starting scheduled model training for all organizations")
    db = SessionLocal()
    try:
        organizations = db.query(Organization).all()
        for org in organizations:
            train_models_for_org.delay(org.id)
    finally:
        db.close()

@celery_app.task
def train_models_for_org(org_id: str):
    """Train all models for a specific organization"""
    logger.info(f"Training models for organization {org_id}")
    pipeline = MLPipeline()
    
    # Train anomaly detection
    anomaly_model_id = pipeline.train_anomaly_detection(org_id)
    if anomaly_model_id:
        logger.info(f"Successfully trained anomaly model: {anomaly_model_id}")
    else:
        logger.error(f"Failed to train anomaly model for org {org_id}")
    
    # Add similar code for cost forecasting and resource optimizer