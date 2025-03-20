class AnomalyDetector:
    """Anomaly detection model for cloud cost data."""
    
    def __init__(self, 
                model_path: Optional[str] = None, 
                version: str = "1.0.0",
                params: Dict[str, Any] = None):
        """Initialize the anomaly detector."""
        self.version = version
        self.params = params or {
            "n_estimators": 100,
            "contamination": 0.05,
            "random_state": 42
        }
        self.training_date = None
        
        if model_path:
            model_data = joblib.load(model_path)
            if isinstance(model_data, dict) and "model" in model_data:
                # New format with metadata
                self.model = model_data["model"]
                self.scaler = model_data["scaler"]
                self.version = model_data.get("version", version)
                self.training_date = model_data.get("training_date")
            else:
                # Legacy format
                self.model = model_data
                self.scaler = joblib.load(f"{model_path}_scaler")
        else:
            self.model = IsolationForest(**self.params)
            self.scaler = StandardScaler()
    
    def save_model(self, model_path: str, metadata: Dict[str, Any] = None) -> None:
        """Save the trained model with metadata."""
        model_data = {
            "model": self.model,
            "scaler": self.scaler,
            "version": self.version,
            "training_date": datetime.now().isoformat(),
        }
        
        if metadata:
            model_data.update(metadata)
            
        joblib.dump(model_data, model_path)