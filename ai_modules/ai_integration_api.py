from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
import os
import json
import logging
import uuid
from typing import Dict, List, Any, Optional, Union, Tuple

# Import our ML modules
from enhanced_anomaly_detection import DeepAnomalyDetector
from advanced_forecasting import DeepLearningForecaster
from intelligent_resource_optimizer import (
    WorkloadClassifier, 
    OptimalInstanceSelector,
    AutoScalingOptimizer,
    ReservationOptimizer,
    ResourceOptimizationManager
)

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("ai_cost_api")

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize models
anomaly_detector = None
forecaster = None
optimizer = None

# Constants
MODEL_DIR = os.environ.get("MODEL_DIR", "./models")
CONFIG_DIR = os.environ.get("CONFIG_DIR", "./config")
DATA_DIR = os.environ.get("DATA_DIR", "./data")

# Ensure directories exist
os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(CONFIG_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

# Track API usage
api_usage_stats = {
    "total_requests": 0,
    "endpoint_usage": {},
    "errors": 0,
    "last_reset": datetime.now().isoformat()
}

# API Versioning
API_VERSION = "1.0.0"

# ===== Helper Functions =====

def load_models():
    """Load ML models from disk if available."""
    global anomaly_detector, forecaster, optimizer
    
    try:
        # Load anomaly detection model
        anomaly_model_path = os.path.join(MODEL_DIR, "anomaly_detector")
        if os.path.exists(f"{anomaly_model_path}_metadata"):
            logger.info("Loading anomaly detection model...")
            anomaly_detector = DeepAnomalyDetector(model_path=anomaly_model_path)
            logger.info("Anomaly detection model loaded successfully.")
        else:
            logger.info("No existing anomaly detection model found. Will initialize a new one.")
            anomaly_detector = DeepAnomalyDetector()
        
        # Load forecasting model
        forecast_model_path = os.path.join(MODEL_DIR, "forecaster")
        if os.path.exists(f"{forecast_model_path}_metadata"):
            logger.info("Loading forecasting model...")
            forecaster = DeepLearningForecaster(model_path=forecast_model_path)
            logger.info("Forecasting model loaded successfully.")
        else:
            logger.info("No existing forecasting model found. Will initialize a new one.")
            forecaster = DeepLearningForecaster()
        
        # Load resource optimization components
        instance_catalog_path = os.path.join(CONFIG_DIR, "instance_catalog.json")
        pricing_path = os.path.join(CONFIG_DIR, "pricing_data.json")
        
        if os.path.exists(instance_catalog_path) and os.path.exists(pricing_path):
            logger.info("Loading resource optimization components...")
            optimizer = ResourceOptimizationManager(
                instance_catalog_path=instance_catalog_path,
                pricing_path=pricing_path
            )
            logger.info("Resource optimization components loaded successfully.")
        else:
            logger.info("No existing resource data found. Will initialize with empty data.")
            optimizer = ResourceOptimizationManager()
        
    except Exception as e:
        logger.error(f"Error loading models: {str(e)}")
        # Initialize default models
        anomaly_detector = DeepAnomalyDetector()
        forecaster = DeepLearningForecaster()
        optimizer = ResourceOptimizationManager()

def save_models():
    global anomaly_detector, forecaster
    """Save ML models to disk."""
    try:
        # Save anomaly detection model
        anomaly_model_path = os.path.join(MODEL_DIR, "anomaly_detector")
        if anomaly_detector:
            logger.info("Saving anomaly detection model...")
            anomaly_detector.save_model(anomaly_model_path)
            logger.info("Anomaly detection model saved successfully.")
        
        # Save forecasting model
        forecast_model_path = os.path.join(MODEL_DIR, "forecaster")
        if forecaster and forecaster.trained:
            logger.info("Saving forecasting model...")
            forecaster.save_model(forecast_model_path)
            logger.info("Forecasting model saved successfully.")
    
    except Exception as e:
        logger.error(f"Error saving models: {str(e)}")
        
def log_api_call(endpoint: str):
    """Log API usage statistics."""
    api_usage_stats["total_requests"] += 1
    
    if endpoint not in api_usage_stats["endpoint_usage"]:
        api_usage_stats["endpoint_usage"][endpoint] = 1
    else:
        api_usage_stats["endpoint_usage"][endpoint] += 1

def log_error():
    """Log API error."""
    api_usage_stats["errors"] += 1

def validate_auth(auth_token: str) -> bool:
    """Validate authentication token."""
    # In a real implementation, this would check against a database
    # or validate with OAuth or similar
    valid_tokens = [
        "test-token-1234",  # Development token
        os.environ.get("API_AUTH_TOKEN", "")  # Token from environment
    ]
    
    return auth_token in valid_tokens

def load_instance_catalog() -> Dict[str, Any]:
    """Load instance catalog from disk."""
    catalog_path = os.path.join(CONFIG_DIR, "instance_catalog.json")
    if os.path.exists(catalog_path):
        with open(catalog_path, 'r') as f:
            return json.load(f)
    return {}

def load_pricing_data() -> Dict[str, Any]:
    """Load pricing data from disk."""
    pricing_path = os.path.join(CONFIG_DIR, "pricing_data.json")
    if os.path.exists(pricing_path):
        with open(pricing_path, 'r') as f:
            return json.load(f)
    return {}

def save_to_disk(data: Dict[str, Any], filename: str):
    """Save data to disk."""
    filepath = os.path.join(DATA_DIR, filename)
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)
    return filepath

# ===== Error Handling =====

@app.errorhandler(400)
def bad_request(error):
    log_error()
    return jsonify({
        "error": "Bad Request",
        "message": str(error),
        "status_code": 400
    }), 400

@app.errorhandler(401)
def unauthorized(error):
    log_error()
    return jsonify({
        "error": "Unauthorized",
        "message": "Valid authentication credentials are required",
        "status_code": 401
    }), 401

@app.errorhandler(404)
def not_found(error):
    log_error()
    return jsonify({
        "error": "Not Found",
        "message": str(error),
        "status_code": 404
    }), 404

@app.errorhandler(500)
def server_error(error):
    log_error()
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({
        "error": "Internal Server Error",
        "message": "An unexpected error occurred",
        "status_code": 500
    }), 500

# ===== API Endpoints =====

@app.route('/api/v1/status', methods=['GET'])
def get_status():
    """Get API status and version information."""
    log_api_call("/api/v1/status")
    
    return jsonify({
        "status": "operational",
        "version": API_VERSION,
        "timestamp": datetime.now().isoformat(),
        "models": {
            "anomaly_detector": "loaded" if anomaly_detector else "not_loaded",
            "forecaster": "loaded" if forecaster else "not_loaded",
            "optimizer": "loaded" if optimizer else "not_loaded"
        },
        "api_stats": {
            "total_requests": api_usage_stats["total_requests"],
            "errors": api_usage_stats["errors"],
            "uptime": str(datetime.now() - datetime.fromisoformat(api_usage_stats["last_reset"]))
        }
    })

@app.route('/api/v1/anomaly-detection/detect', methods=['POST'])
def detect_anomalies():
    """Detect anomalies in cost data."""
    log_api_call("/api/v1/anomaly-detection/detect")
    
    # Check authentication
    auth_token = request.headers.get('Authorization')
    if not auth_token or not validate_auth(auth_token.replace('Bearer ', '')):
        return jsonify({
            "error": "Unauthorized",
            "message": "Valid authentication token required"
        }), 401
    
    # Parse request
    try:
        data = request.get_json()
        cost_data = data.get('cost_data', [])
        
        if not cost_data:
            return jsonify({
                "error": "Bad Request",
                "message": "No cost data provided"
            }), 400
        
        # Detect anomalies
        anomalies = anomaly_detector.detect_anomalies(cost_data)
        
        # Return results
        return jsonify({
            "anomalies": anomalies,
            "count": len(anomalies),
            "timestamp": datetime.now().isoformat(),
            "processed_data_points": len(cost_data)
        })
    
    except Exception as e:
        logger.error(f"Error detecting anomalies: {str(e)}")
        return jsonify({
            "error": "Processing Error",
            "message": str(e)
        }), 500

@app.route('/api/v1/anomaly-detection/train', methods=['POST'])
def train_anomaly_detector():
    """Train the anomaly detection model with new data."""
    log_api_call("/api/v1/anomaly-detection/train")
    
    # Check authentication
    auth_token = request.headers.get('Authorization')
    if not auth_token or not validate_auth(auth_token.replace('Bearer ', '')):
        return jsonify({
            "error": "Unauthorized",
            "message": "Valid authentication token required"
        }), 401
    
    # Parse request
    try:
        data = request.get_json()
        cost_data = data.get('cost_data', [])
        validation_split = data.get('validation_split', 0.2)
        epochs = data.get('epochs', 50)
        batch_size = data.get('batch_size', 32)
        
        if not cost_data:
            return jsonify({
                "error": "Bad Request",
                "message": "No training data provided"
            }), 400
        
        # Train the model
        training_results = anomaly_detector.train(
            cost_data=cost_data,
            validation_split=validation_split,
            epochs=epochs,
            batch_size=batch_size
        )
        
        # Save the model
        save_models()
        
        # Return results
        return jsonify({
            "message": "Anomaly detection model trained successfully",
            "training_results": training_results,
            "timestamp": datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Error training anomaly detector: {str(e)}")
        return jsonify({
            "error": "Training Error",
            "message": str(e)
        }), 500

@app.route('/api/v1/forecasting/predict', methods=['POST'])
def forecast_costs():
    global forecaster
    """Generate cost forecasts."""
    log_api_call("/api/v1/forecasting/predict")
    
    # Check authentication
    auth_token = request.headers.get('Authorization')
    if not auth_token or not validate_auth(auth_token.replace('Bearer ', '')):
        return jsonify({
            "error": "Unauthorized",
            "message": "Valid authentication token required"
        }), 401
    
    # Parse request
    try:
        data = request.get_json()
        cost_data = data.get('cost_data', [])
        forecast_steps = data.get('forecast_steps', 30)
        return_confidence = data.get('return_confidence_intervals', True)
        confidence_level = data.get('confidence_level', 0.9)
        
        if not cost_data:
            return jsonify({
                "error": "Bad Request",
                "message": "No historical cost data provided"
            }), 400
        
        # Check if model is trained
        if not forecaster.trained:
            return jsonify({
                "error": "Model Not Trained",
                "message": "Forecasting model needs to be trained first"
            }), 400
        
        # Generate forecast
        forecast_result = forecaster.forecast(
            cost_data=cost_data,
            forecast_steps=forecast_steps,
            return_confidence_intervals=return_confidence,
            confidence_level=confidence_level
        )
        
        # Return results
        return jsonify({
            "forecast": forecast_result,
            "timestamp": datetime.now().isoformat(),
            "model_version": forecaster.version,
            "forecast_horizon": forecast_steps
        })
    
    except Exception as e:
        logger.error(f"Error generating forecast: {str(e)}")
        return jsonify({
            "error": "Forecasting Error",
            "message": str(e)
        }), 500

@app.route('/api/v1/forecasting/train', methods=['POST'])
def train_forecaster():
    global forecaster
    """Train the cost forecasting model with new data."""
    log_api_call("/api/v1/forecasting/train")
    
    # Check authentication
    auth_token = request.headers.get('Authorization')
    if not auth_token or not validate_auth(auth_token.replace('Bearer ', '')):
        return jsonify({
            "error": "Unauthorized",
            "message": "Valid authentication token required"
        }), 401
    
    # Parse request
    try:
        data = request.get_json()
        cost_data = data.get('cost_data', [])
        target_column = data.get('target_column', 'daily_cost')
        validation_split = data.get('validation_split', 0.2)
        epochs = data.get('epochs', 100)
        batch_size = data.get('batch_size', 32)
        patience = data.get('patience', 10)
        model_type = data.get('model_type', 'lstm')
        
        if not cost_data:
            return jsonify({
                "error": "Bad Request",
                "message": "No training data provided"
            }), 400
        
        # Create a new forecaster with the specified model type if needed
        if model_type != forecaster.model_type:
            forecaster = DeepLearningForecaster(model_type=model_type)
        
        # Train the model
        training_results = forecaster.train(
            cost_data=cost_data,
            target_column=target_column,
            validation_split=validation_split,
            epochs=epochs,
            batch_size=batch_size,
            patience=patience
        )
        
        # Save the model
        save_models()
        
        # Return results
        return jsonify({
            "message": "Forecasting model trained successfully",
            "training_results": training_results,
            "model_type": forecaster.model_type,
            "timestamp": datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Error training forecaster: {str(e)}")
        return jsonify({
            "error": "Training Error",
            "message": str(e)
        }), 500

@app.route('/api/v1/forecasting/scenario', methods=['POST'])
def scenario_forecasting():
    """Generate scenario-based forecasts."""
    log_api_call("/api/v1/forecasting/scenario")
    
    # Check authentication
    auth_token = request.headers.get('Authorization')
    if not auth_token or not validate_auth(auth_token.replace('Bearer ', '')):
        return jsonify({
            "error": "Unauthorized",
            "message": "Valid authentication token required"
        }), 401
    
    # Parse request
    try:
        data = request.get_json()
        cost_data = data.get('cost_data', [])
        scenarios = data.get('scenarios', [])
        forecast_steps = data.get('forecast_steps', 60)
        
        if not cost_data:
            return jsonify({
                "error": "Bad Request",
                "message": "No historical cost data provided"
            }), 400
        
        if not scenarios:
            return jsonify({
                "error": "Bad Request",
                "message": "No scenarios provided"
            }), 400
        
        # Check if model is trained
        if not forecaster.trained:
            return jsonify({
                "error": "Model Not Trained",
                "message": "Forecasting model needs to be trained first"
            }), 400
        
        # Generate scenario forecasts
        scenario_results = forecaster.scenario_forecast(
            cost_data=cost_data,
            scenarios=scenarios,
            forecast_steps=forecast_steps
        )
        
        # Return results
        return jsonify({
            "scenario_forecasts": scenario_results,
            "timestamp": datetime.now().isoformat(),
            "model_version": forecaster.version,
            "forecast_horizon": forecast_steps
        })
    
    except Exception as e:
        logger.error(f"Error generating scenario forecasts: {str(e)}")
        return jsonify({
            "error": "Forecasting Error",
            "message": str(e)
        }), 500

@app.route('/api/v1/optimization/analyze', methods=['POST'])
def analyze_resources():
    """Analyze resources for optimization opportunities."""
    log_api_call("/api/v1/optimization/analyze")
    
    # Check authentication
    auth_token = request.headers.get('Authorization')
    if not auth_token or not validate_auth(auth_token.replace('Bearer ', '')):
        return jsonify({
            "error": "Unauthorized",
            "message": "Valid authentication token required"
        }), 401
    
    # Parse request
    try:
        data = request.get_json()
        utilization_data = data.get('utilization_data', [])
        usage_data = data.get('usage_data', [])
        
        if not utilization_data:
            return jsonify({
                "error": "Bad Request",
                "message": "No utilization data provided"
            }), 400
        
        # Analyze infrastructure
        results = optimizer.analyze_infrastructure(
            utilization_data=utilization_data,
            usage_data=usage_data if usage_data else None
        )
        
        # Save results
        report_id = str(uuid.uuid4())
        file_path = save_to_disk(results, f"optimization_report_{report_id}.json")
        
        # Return results
        return jsonify({
            "optimization_results": results,
            "report_id": report_id,
            "timestamp": datetime.now().isoformat(),
            "report_path": file_path
        })
    
    except Exception as e:
        logger.error(f"Error analyzing resources: {str(e)}")
        return jsonify({
            "error": "Analysis Error",
            "message": str(e)
        }), 500

@app.route('/api/v1/optimization/simulate', methods=['POST'])
def simulate_optimization():
    """Simulate the impact of optimization recommendations."""
    log_api_call("/api/v1/optimization/simulate")
    
    # Check authentication
    auth_token = request.headers.get('Authorization')
    if not auth_token or not validate_auth(auth_token.replace('Bearer ', '')):
        return jsonify({
            "error": "Unauthorized",
            "message": "Valid authentication token required"
        }), 401
    
    # Parse request
    try:
        data = request.get_json()
        current_state = data.get('current_state', {})
        recommendations = data.get('recommendations', {})
        
        if not current_state or not recommendations:
            return jsonify({
                "error": "Bad Request",
                "message": "Current state and recommendations are required"
            }), 400
        
        # Simulate optimization impact
        impact = optimizer.simulate_optimization_impact(
            current_state=current_state,
            recommendations=recommendations
        )
        
        # Generate implementation plan
        plan = optimizer.generate_optimization_plan(recommendations)
        
        # Return results
        return jsonify({
            "impact": impact,
            "implementation_plan": plan,
            "timestamp": datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Error simulating optimization: {str(e)}")
        return jsonify({
            "error": "Simulation Error",
            "message": str(e)
        }), 500

@app.route('/api/v1/optimization/classify-workloads', methods=['POST'])
def classify_workloads():
    """Classify workloads based on utilization patterns."""
    log_api_call("/api/v1/optimization/classify-workloads")
    
    # Check authentication
    auth_token = request.headers.get('Authorization')
    if not auth_token or not validate_auth(auth_token.replace('Bearer ', '')):
        return jsonify({
            "error": "Unauthorized",
            "message": "Valid authentication token required"
        }), 401
    
    # Parse request
    try:
        data = request.get_json()
        utilization_data = data.get('utilization_data', [])
        n_clusters = data.get('n_clusters', 5)
        
        if not utilization_data:
            return jsonify({
                "error": "Bad Request",
                "message": "No utilization data provided"
            }), 400
        
        # Classify workloads
        classifier = WorkloadClassifier(n_clusters=n_clusters)
        classification_results = classifier.fit(utilization_data)
        
        # Return results
        return jsonify({
            "classification_results": classification_results,
            "timestamp": datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Error classifying workloads: {str(e)}")
        return jsonify({
            "error": "Classification Error",
            "message": str(e)
        }), 500

@app.route('/api/v1/optimization/recommend-instances', methods=['POST'])
def recommend_instances():
    """Recommend instance types based on workload requirements."""
    log_api_call("/api/v1/optimization/recommend-instances")
    
    # Check authentication
    auth_token = request.headers.get('Authorization')
    if not auth_token or not validate_auth(auth_token.replace('Bearer ', '')):
        return jsonify({
            "error": "Unauthorized",
            "message": "Valid authentication token required"
        }), 401
    
    # Parse request
    try:
        data = request.get_json()
        workload_data = data.get('workload_data', {})
        constraints = data.get('constraints', {})
        provider = data.get('provider')
        region = data.get('region')
        top_n = data.get('top_n', 5)
        
        if not workload_data:
            return jsonify({
                "error": "Bad Request",
                "message": "No workload data provided"
            }), 400
        
        # Ensure optimizer has instance data
        if not optimizer.instance_selector.instance_catalog:
            instance_catalog = load_instance_catalog()
            if instance_catalog:
                optimizer.set_instance_catalog(instance_catalog)
            else:
                return jsonify({
                    "error": "Configuration Error",
                    "message": "Instance catalog data not available"
                }), 500
        
        if not optimizer.instance_selector.pricing_data:
            pricing_data = load_pricing_data()
            if pricing_data:
                optimizer.set_pricing_data(pricing_data)
        
        # Recommend instances
        recommendations = optimizer.instance_selector.recommend_instances(
            workload_data=workload_data,
            constraints=constraints,
            provider=provider,
            region=region,
            top_n=top_n
        )
        
        # Return results
        return jsonify({
            "instance_recommendations": recommendations,
            "timestamp": datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Error recommending instances: {str(e)}")
        return jsonify({
            "error": "Recommendation Error",
            "message": str(e)
        }), 500

@app.route('/api/v1/optimization/optimize-scaling', methods=['POST'])
def optimize_scaling():
    """Optimize auto-scaling configuration based on utilization patterns."""
    log_api_call("/api/v1/optimization/optimize-scaling")
    
    # Check authentication
    auth_token = request.headers.get('Authorization')
    if not auth_token or not validate_auth(auth_token.replace('Bearer ', '')):
        return jsonify({
            "error": "Unauthorized",
            "message": "Valid authentication token required"
        }), 401
    
    # Parse request
    try:
        data = request.get_json()
        utilization_data = data.get('utilization_data', [])
        metric = data.get('metric', 'cpu_percent')
        
        if not utilization_data:
            return jsonify({
                "error": "Bad Request",
                "message": "No utilization data provided"
            }), 400
        
        # Analyze auto-scaling
        scaling_optimizer = AutoScalingOptimizer()
        recommendations = scaling_optimizer.analyze_and_recommend(
            utilization_data=utilization_data,
            metric=metric
        )
        
        # Simulate auto-scaling if configuration is provided
        simulation_results = None
        if "configuration" in recommendations:
            simulation_results = scaling_optimizer.simulate_scaling(
                utilization_data=utilization_data,
                config=recommendations["configuration"],
                metric=metric
            )
        
        # Return results
        return jsonify({
            "scaling_recommendations": recommendations,
            "simulation_results": simulation_results,
            "timestamp": datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Error optimizing scaling: {str(e)}")
        return jsonify({
            "error": "Optimization Error",
            "message": str(e)
        }), 500

@app.route('/api/v1/optimization/recommend-reservations', methods=['POST'])
def recommend_reservations():
    """Recommend reserved instances or savings plans based on usage patterns."""
    log_api_call("/api/v1/optimization/recommend-reservations")
    
    # Check authentication
    auth_token = request.headers.get('Authorization')
    if not auth_token or not validate_auth(auth_token.replace('Bearer ', '')):
        return jsonify({
            "error": "Unauthorized",
            "message": "Valid authentication token required"
        }), 401
    
    # Parse request
    try:
        data = request.get_json()
        usage_data = data.get('usage_data', [])
        commitment_term = data.get('commitment_term_months', 12)
        upfront_option = data.get('upfront_option', 'no_upfront')
        risk_tolerance = data.get('risk_tolerance', 'medium')
        
        if not usage_data:
            return jsonify({
                "error": "Bad Request",
                "message": "No usage data provided"
            }), 400
        
        # Ensure optimizer has pricing data
        if not optimizer.reservation_optimizer.pricing_data:
            pricing_data = load_pricing_data()
            if pricing_data:
                optimizer.set_pricing_data(pricing_data)
            else:
                return jsonify({
                    "error": "Configuration Error",
                    "message": "Pricing data not available"
                }), 500
        
        # Configure optimizer parameters
        from intelligent_resource_optimizer import ReservationOptimizationParams
        params = ReservationOptimizationParams(
            commitment_term_months=commitment_term,
            upfront_option=upfront_option,
            risk_tolerance=risk_tolerance
        )
        optimizer.reservation_optimizer.set_params(params)
        
        # Generate recommendations
        ri_analysis = optimizer.reservation_optimizer.analyze_usage_patterns(usage_data)
        sp_analysis = optimizer.reservation_optimizer.recommend_savings_plans(usage_data)
        comparison = optimizer.reservation_optimizer.compare_reservation_vs_savings_plan(usage_data)
        
        # Return results
        return jsonify({
            "reserved_instances": ri_analysis,
            "savings_plans": sp_analysis,
            "comparison": comparison,
            "recommended_approach": comparison["recommendation"],
            "timestamp": datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Error recommending reservations: {str(e)}")
        return jsonify({
            "error": "Recommendation Error",
            "message": str(e)
        }), 500

@app.route('/api/v1/config/update-instance-catalog', methods=['POST'])
def update_instance_catalog():
    """Update the instance catalog data."""
    log_api_call("/api/v1/config/update-instance-catalog")
    
    # Check authentication
    auth_token = request.headers.get('Authorization')
    if not auth_token or not validate_auth(auth_token.replace('Bearer ', '')):
        return jsonify({
            "error": "Unauthorized",
            "message": "Valid authentication token required"
        }), 401
    
    # Parse request
    try:
        data = request.get_json()
        instance_catalog = data.get('instance_catalog', {})
        
        if not instance_catalog:
            return jsonify({
                "error": "Bad Request",
                "message": "No instance catalog data provided"
            }), 400
        
        # Save instance catalog to disk
        catalog_path = os.path.join(CONFIG_DIR, "instance_catalog.json")
        with open(catalog_path, 'w') as f:
            json.dump(instance_catalog, f, indent=2)
        
        # Update optimizer with new data
        optimizer.set_instance_catalog(instance_catalog)
        
        # Return results
        return jsonify({
            "message": "Instance catalog updated successfully",
            "timestamp": datetime.now().isoformat(),
            "instance_types": sum(len(instances) for provider, instances in instance_catalog.items())
        })
    
    except Exception as e:
        logger.error(f"Error updating instance catalog: {str(e)}")
        return jsonify({
            "error": "Update Error",
            "message": str(e)
        }), 500

@app.route('/api/v1/config/update-pricing-data', methods=['POST'])
def update_pricing_data():
    """Update the pricing data."""
    log_api_call("/api/v1/config/update-pricing-data")
    
    # Check authentication
    auth_token = request.headers.get('Authorization')
    if not auth_token or not validate_auth(auth_token.replace('Bearer ', '')):
        return jsonify({
            "error": "Unauthorized",
            "message": "Valid authentication token required"
        }), 401
    
    # Parse request
    try:
        data = request.get_json()
        pricing_data = data.get('pricing_data', {})
        
        if not pricing_data:
            return jsonify({
                "error": "Bad Request",
                "message": "No pricing data provided"
            }), 400
        
        # Save pricing data to disk
        pricing_path = os.path.join(CONFIG_DIR, "pricing_data.json")
        with open(pricing_path, 'w') as f:
            json.dump(pricing_data, f, indent=2)
        
        # Update optimizer with new data
        optimizer.set_pricing_data(pricing_data)
        
        # Return results
        return jsonify({
            "message": "Pricing data updated successfully",
            "timestamp": datetime.now().isoformat(),
            "instance_types": sum(len(instances) for provider, instances in pricing_data.items())
        })
    
    except Exception as e:
        logger.error(f"Error updating pricing data: {str(e)}")
        return jsonify({
            "error": "Update Error",
            "message": str(e)
        }), 500

@app.route('/api/v1/combined/cost-analysis', methods=['POST'])
def combined_cost_analysis():
    """Perform comprehensive cost analysis combining anomaly detection and forecasting."""
    log_api_call("/api/v1/combined/cost-analysis")
    
    # Check authentication
    auth_token = request.headers.get('Authorization')
    if not auth_token or not validate_auth(auth_token.replace('Bearer ', '')):
        return jsonify({
            "error": "Unauthorized",
            "message": "Valid authentication token required"
        }), 401
    
    # Parse request
    try:
        data = request.get_json()
        cost_data = data.get('cost_data', [])
        forecast_steps = data.get('forecast_steps', 30)
        
        if not cost_data:
            return jsonify({
                "error": "Bad Request",
                "message": "No cost data provided"
            }), 400
        
        results = {}
        
        # Detect anomalies
        try:
            anomalies = anomaly_detector.detect_anomalies(cost_data)
            results["anomalies"] = {
                "detected": anomalies,
                "count": len(anomalies)
            }
        except Exception as e:
            logger.error(f"Error in anomaly detection during combined analysis: {str(e)}")
            results["anomalies"] = {"error": str(e)}
        
        # Generate forecast
        try:
            if forecaster.trained:
                forecast_result = forecaster.forecast(
                    cost_data=cost_data,
                    forecast_steps=forecast_steps
                )
                results["forecast"] = forecast_result
            else:
                results["forecast"] = {"error": "Forecasting model not trained"}
        except Exception as e:
            logger.error(f"Error in forecasting during combined analysis: {str(e)}")
            results["forecast"] = {"error": str(e)}
        
        # Calculate summary metrics
        try:
            # Calculate recent trends
            if len(cost_data) > 1:
                df = pd.DataFrame(cost_data)
                if 'date' in df.columns and 'daily_cost' in df.columns:
                    df['date'] = pd.to_datetime(df['date'])
                    df = df.sort_values('date')
                    
                    # Calculate trend over last 30 days
                    recent_data = df.tail(30)
                    if len(recent_data) > 1:
                        first_cost = recent_data['daily_cost'].iloc[0]
                        last_cost = recent_data['daily_cost'].iloc[-1]
                        change = ((last_cost - first_cost) / first_cost) * 100 if first_cost > 0 else 0
                        
                        results["trend"] = {
                            "period_days": len(recent_data),
                            "start_cost": float(first_cost),
                            "end_cost": float(last_cost),
                            "percent_change": float(change),
                            "direction": "up" if change > 0 else "down" if change < 0 else "stable"
                        }
            
            # Calculate anomaly impact
            if "anomalies" in results and "detected" in results["anomalies"]:
                anomaly_cost = sum(a.get('daily_cost', 0) for a in results["anomalies"]["detected"])
                normal_cost = sum(p.get('daily_cost', 0) for p in cost_data if p not in results["anomalies"]["detected"])
                total_cost = anomaly_cost + normal_cost
                
                results["anomaly_impact"] = {
                    "anomaly_cost": float(anomaly_cost),
                    "normal_cost": float(normal_cost),
                    "total_cost": float(total_cost),
                    "anomaly_percentage": float((anomaly_cost / total_cost * 100) if total_cost > 0 else 0)
                }
            
            # Calculate forecast impact (projected change)
            if "forecast" in results and "forecast_values" in results["forecast"]:
                current_cost = cost_data[-1].get('daily_cost', 0) if cost_data else 0
                projected_end_cost = results["forecast"]["forecast_values"][-1]
                projected_change = ((projected_end_cost - current_cost) / current_cost * 100) if current_cost > 0 else 0
                
                results["forecast_impact"] = {
                    "current_cost": float(current_cost),
                    "projected_end_cost": float(projected_end_cost),
                    "projected_change_percent": float(projected_change),
                    "direction": "up" if projected_change > 0 else "down" if projected_change < 0 else "stable",
                    "forecast_period_days": forecast_steps
                }
        except Exception as e:
            logger.error(f"Error calculating summary metrics: {str(e)}")
            results["summary_error"] = str(e)
        
        # Return combined results
        return jsonify({
            "cost_analysis": results,
            "timestamp": datetime.now().isoformat(),
            "analyzed_data_points": len(cost_data)
        })
    
    except Exception as e:
        logger.error(f"Error in combined cost analysis: {str(e)}")
        return jsonify({
            "error": "Analysis Error",
            "message": str(e)
        }), 500

@app.route('/api/v1/combined/full-optimization', methods=['POST'])
def full_optimization():
    """Perform comprehensive optimization analysis of all aspects of cloud infrastructure."""
    log_api_call("/api/v1/combined/full-optimization")
    
    # Check authentication
    auth_token = request.headers.get('Authorization')
    if not auth_token or not validate_auth(auth_token.replace('Bearer ', '')):
        return jsonify({
            "error": "Unauthorized",
            "message": "Valid authentication token required"
        }), 401
    
    # Parse request
    try:
        data = request.get_json()
        cost_data = data.get('cost_data', [])
        utilization_data = data.get('utilization_data', [])
        usage_data = data.get('usage_data', [])
        current_state = data.get('current_state', {})
        forecast_steps = data.get('forecast_steps', 60)
        
        if not cost_data or not utilization_data:
            return jsonify({
                "error": "Bad Request",
                "message": "Cost data and utilization data are required"
            }), 400
        
        # Initialize results structure
        results = {
            "analysis_date": datetime.now().isoformat(),
            "analysis_components": {}
        }
        
        # 1. Analyze cost anomalies
        try:
            anomalies = anomaly_detector.detect_anomalies(cost_data)
            
            # Calculate anomaly impact
            anomaly_cost = sum(a.get('daily_cost', 0) for a in anomalies)
            total_cost = sum(p.get('daily_cost', 0) for p in cost_data)
            
            results["analysis_components"]["cost_anomalies"] = {
                "detected_anomalies": anomalies,
                "count": len(anomalies),
                "anomaly_cost": float(anomaly_cost),
                "anomaly_percentage": float((anomaly_cost / total_cost * 100) if total_cost > 0 else 0)
            }
        except Exception as e:
            logger.error(f"Error in anomaly detection during full optimization: {str(e)}")
            results["analysis_components"]["cost_anomalies"] = {"error": str(e)}
        
        # 2. Generate cost forecast
        try:
            if forecaster.trained:
                forecast_result = forecaster.forecast(
                    cost_data=cost_data,
                    forecast_steps=forecast_steps
                )
                
                # Create high-growth scenario
                high_growth_scenario = {
                    "name": "High Growth",
                    "description": "Assumes 20% higher usage across all services",
                    "adjustments": {"daily_cost": 1.2}
                }
                
                # Create cost optimization scenario
                optimization_scenario = {
                    "name": "Cost Optimization",
                    "description": "Assumes 15% cost reduction from optimization efforts",
                    "adjustments": {"daily_cost": 0.85}
                }
                
                # Generate scenario forecasts
                scenario_results = forecaster.scenario_forecast(
                    cost_data=cost_data,
                    scenarios=[high_growth_scenario, optimization_scenario],
                    forecast_steps=forecast_steps
                )
                
                results["analysis_components"]["cost_forecast"] = {
                    "baseline_forecast": forecast_result,
                    "scenario_forecasts": scenario_results
                }
            else:
                results["analysis_components"]["cost_forecast"] = {"error": "Forecasting model not trained"}
        except Exception as e:
            logger.error(f"Error in forecasting during full optimization: {str(e)}")
            results["analysis_components"]["cost_forecast"] = {"error": str(e)}
        
        # 3. Analyze resource optimization
        try:
            optimization_results = optimizer.analyze_infrastructure(
                utilization_data=utilization_data,
                usage_data=usage_data
            )
            
            results["analysis_components"]["resource_optimization"] = optimization_results
        except Exception as e:
            logger.error(f"Error in resource optimization during full analysis: {str(e)}")
            results["analysis_components"]["resource_optimization"] = {"error": str(e)}
        
        # 4. Simulate optimization impact
        try:
            if "resource_optimization" in results["analysis_components"] and isinstance(results["analysis_components"]["resource_optimization"], dict):
                if current_state:
                    impact = optimizer.simulate_optimization_impact(
                        current_state=current_state,
                        recommendations=results["analysis_components"]["resource_optimization"]
                    )
                    
                    # Generate implementation plan
                    plan = optimizer.generate_optimization_plan(
                        results["analysis_components"]["resource_optimization"]
                    )
                    
                    results["analysis_components"]["optimization_impact"] = {
                        "impact": impact,
                        "implementation_plan": plan
                    }
        except Exception as e:
            logger.error(f"Error in optimization impact simulation: {str(e)}")
            results["analysis_components"]["optimization_impact"] = {"error": str(e)}
        
        # 5. Calculate overall savings potential
        total_savings = 0
        
        # Add anomaly savings (assuming anomalies can be prevented)
        if "cost_anomalies" in results["analysis_components"] and "anomaly_cost" in results["analysis_components"]["cost_anomalies"]:
            # Assume 80% of anomaly costs could be prevented
            anomaly_savings = results["analysis_components"]["cost_anomalies"]["anomaly_cost"] * 0.8
            total_savings += anomaly_savings
        
        # Add optimization savings
        if "resource_optimization" in results["analysis_components"] and "estimated_monthly_savings" in results["analysis_components"]["resource_optimization"]:
            optimization_savings = results["analysis_components"]["resource_optimization"]["estimated_monthly_savings"]
            total_savings += optimization_savings
        
        # Add scenario comparison savings (if optimization scenario was run)
        if "cost_forecast" in results["analysis_components"] and "scenario_forecasts" in results["analysis_components"]["cost_forecast"]:
            scenario_forecasts = results["analysis_components"]["cost_forecast"]["scenario_forecasts"]
            if "scenarios" in scenario_forecasts:
                for scenario in scenario_forecasts["scenarios"]:
                    if scenario["name"] == "Cost Optimization":
                        # Calculate difference between baseline and optimization scenario
                        baseline = scenario_forecasts["scenarios"][0]  # Assuming first scenario is baseline
                        if "forecast" in baseline and "forecast" in scenario:
                            baseline_sum = sum(baseline["forecast"]["forecast_values"])
                            optimization_sum = sum(scenario["forecast"]["forecast_values"])
                            scenario_savings = baseline_sum - optimization_sum
                            # Don't double count with other savings
                            # total_savings += scenario_savings / 2
        
        results["total_monthly_savings_potential"] = float(total_savings)
        results["annualized_savings_potential"] = float(total_savings * 12)
        
        # Save results
        report_id = str(uuid.uuid4())
        file_path = save_to_disk(results, f"full_optimization_report_{report_id}.json")
        
        # Return results
        return jsonify({
            "optimization_report": results,
            "report_id": report_id,
            "report_path": file_path,
            "timestamp": datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Error in full optimization analysis: {str(e)}")
        return jsonify({
            "error": "Analysis Error",
            "message": str(e)
        }), 500

# ===== Initialize API =====

# Load models on startup
@app.before_first_request
def before_first_request():
    """Initialize models before the first request."""
    load_models()

# Main entry point
if __name__ == '__main__':
    # Set port
    port = int(os.environ.get("PORT", 5000))
    
    # Run app
    app.run(host='0.0.0.0', port=port, debug=False)