from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import numpy as np
import pandas as pd
import joblib
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple, Optional

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
    
    def preprocess_data(self, cost_data: List[Dict[str, Any]]) -> pd.DataFrame:
        """Preprocess cost data for anomaly detection.
        
        Args:
            cost_data: List of dictionaries containing cost data.
            
        Returns:
            DataFrame with preprocessed features.
        """
        # Convert to DataFrame
        df = pd.DataFrame(cost_data)
        
        # Feature engineering
        features = []
        if 'daily_cost' in df.columns:
            features.append('daily_cost')
        if 'previous_day_cost' in df.columns:
            features.append('previous_day_cost')
            # Calculate day-over-day change
            df['day_over_day_change'] = (df['daily_cost'] - df['previous_day_cost']) / df['previous_day_cost']
            features.append('day_over_day_change')
        if 'week_avg_cost' in df.columns:
            features.append('week_avg_cost')
            # Calculate deviation from weekly average
            df['weekly_deviation'] = (df['daily_cost'] - df['week_avg_cost']) / df['week_avg_cost']
            features.append('weekly_deviation')
        
        # Fill NAs with 0 for new calculation columns
        df = df.fillna(0)
        
        # Select only numerical features for anomaly detection
        features_df = df[features]
        
        return features_df
    
    def train(self, cost_data: List[Dict[str, Any]]) -> None:
        """Train the anomaly detection model.
        
        Args:
            cost_data: List of dictionaries containing cost data.
        """
        features_df = self.preprocess_data(cost_data)
        
        # Scale the features
        X = self.scaler.fit_transform(features_df)
        
        # Train the model
        self.model.fit(X)
    
    def detect_anomalies(self, cost_data: List[Dict[str, Any]], threshold: float = -0.5) -> List[Dict[str, Any]]:
        """Detect anomalies in cost data.
        
        Args:
            cost_data: List of dictionaries containing cost data.
            threshold: Threshold for anomaly score (lower is more anomalous).
            
        Returns:
            List of anomalous data points with anomaly scores.
        """
        features_df = self.preprocess_data(cost_data)
        
        # Create a copy of the input data
        result_data = cost_data.copy()
        
        # Scale the features
        X = self.scaler.transform(features_df)
        
        # Get anomaly scores
        scores = self.model.decision_function(X)
        predictions = self.model.predict(X)
        
        # Add anomaly information to the result
        anomalies = []
        for i, (score, pred) in enumerate(zip(scores, predictions)):
            if score < threshold or pred == -1:
                result_data[i]['is_anomaly'] = True
                result_data[i]['anomaly_score'] = float(score)
                anomalies.append(result_data[i])
            else:
                result_data[i]['is_anomaly'] = False
                result_data[i]['anomaly_score'] = float(score)
        
        return anomalies
    
    def save_model(self, model_path: str) -> None:
        """Save the trained model.
        
        Args:
            model_path: Path to save the model file.
        """
        joblib.dump(self.model, model_path)
        joblib.dump(self.scaler, f"{model_path}_scaler")

def generate_mock_cost_data(days: int = 90, seed: int = 42) -> List[Dict[str, Any]]:
    """Generate mock cost data for testing.
    
    Args:
        days: Number of days of data to generate.
        seed: Random seed for reproducibility.
        
    Returns:
        List of dictionaries with mock cost data.
    """
    np.random.seed(seed)
    
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=days)
    
    # Base cost and seasonal patterns
    base_cost = 100.0
    
    # Create date range
    date_range = [start_date + timedelta(days=i) for i in range(days)]
    
    # Generate cost data with patterns
    cost_data = []
    
    for i, date in enumerate(date_range):
        # Day of week pattern (higher on weekdays)
        dow_factor = 1.0 if date.weekday() < 5 else 0.7
        
        # Monthly pattern (higher at month end)
        monthly_factor = 1.0 + (0.2 if date.day > 25 else 0.0)
        
        # Random variation
        random_factor = np.random.normal(1.0, 0.05)
        
        # Calculate daily cost
        daily_cost = base_cost * dow_factor * monthly_factor * random_factor
        
        # Add specific anomalies for testing
        if i == 30:  # Sudden spike
            daily_cost *= 3.0
        elif i == 60:  # Another spike
            daily_cost *= 2.5
        
        # Previous day cost
        previous_day_cost = cost_data[i-1]['daily_cost'] if i > 0 else daily_cost
        
        # Weekly average (simple calculation for mock data)
        week_avg_cost = np.mean([cost_data[j]['daily_cost'] for j in range(max(0, i-7), i)]) if i > 0 else daily_cost
        
        cost_entry = {
            'date': date.strftime('%Y-%m-%d'),
            'daily_cost': daily_cost,
            'previous_day_cost': previous_day_cost,
            'week_avg_cost': week_avg_cost,
            'service': 'EC2',
            'cloud_provider': 'AWS'
        }
        
        cost_data.append(cost_entry)
    
    return cost_data

def run_anomaly_detection_test():
    """Run a test of the anomaly detection model with mock data."""
    # Generate mock data
    cost_data = generate_mock_cost_data()
    
    # Create and train the model
    detector = AnomalyDetector()
    detector.train(cost_data)
    
    # Detect anomalies
    anomalies = detector.detect_anomalies(cost_data)
    
    # Print detected anomalies
    print(f"Detected {len(anomalies)} anomalies:")
    for anomaly in anomalies:
        print(f"Date: {anomaly['date']}, Cost: ${anomaly['daily_cost']:.2f}, Score: {anomaly['anomaly_score']:.4f}")
    
if __name__ == "__main__":
    run_anomaly_detection_test() 