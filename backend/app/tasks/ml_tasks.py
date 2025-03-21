from app.worker import celery_app
from ai_modules.enhanced_anomaly_detection import DeepAnomalyDetector
from ai_modules.advanced_forecasting import DeepLearningForecaster
from app.db.database import SessionLocal
from app.db.models import Organization, CostEntry, AIModel
import logging
import os

logger = logging.getLogger(__name__)

@celery_app.task
def train_ai_models(org_id: int):
    """Train AI models for an organization"""
    logger.info(f"Training AI models for organization {org_id}")
    db = SessionLocal()
    try:
        # Fetch historical cost data
        cost_entries = db.query(CostEntry).filter(
            CostEntry.provider.organization_id == org_id
        ).all()
        
        # Convert to format expected by models
        cost_data = []
        for entry in cost_entries:
            cost_data.append({
                "date": entry.date.strftime("%Y-%m-%d"),
                "daily_cost": entry.amount,
                "service": entry.service,
                "provider": entry.provider.name,
                "region": entry.region
            })
        
        # Train anomaly detection model
        anomaly_detector = DeepAnomalyDetector()
        try:
            training_results = anomaly_detector.train(cost_data)
            
            # Save model
            model_dir = f"./ml_models/org_{org_id}"
            os.makedirs(model_dir, exist_ok=True)
            model_path = f"{model_dir}/anomaly_detector"
            anomaly_detector.save_model(model_path)
            
            # Record in database
            ai_model = AIModel(
                organization_id=org_id,
                model_type="anomaly_detection",
                model_path=model_path,
                metrics=training_results,
                version="1.0.0"
            )
            db.add(ai_model)
            logger.info(f"Saved anomaly detection model for org {org_id}")
        except Exception as e:
            logger.error(f"Error training anomaly model: {str(e)}")
        
        # Train forecasting model
        forecaster = DeepLearningForecaster()
        try:
            training_results = forecaster.train(cost_data)
            
            # Save model
            model_path = f"{model_dir}/forecaster"
            forecaster.save_model(model_path)
            
            # Record in database
            ai_model = AIModel(
                organization_id=org_id,
                model_type="forecasting",
                model_path=model_path,
                metrics=training_results,
                version="1.0.0"
            )
            db.add(ai_model)
            logger.info(f"Saved forecasting model for org {org_id}")
        except Exception as e:
            logger.error(f"Error training forecasting model: {str(e)}")
        
        db.commit()
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error in train_ai_models: {str(e)}")
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()