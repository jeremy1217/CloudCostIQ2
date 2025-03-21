from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler, MinMaxScaler
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import Sequential, Model
from tensorflow.keras.layers import Dense, LSTM, Dropout, RepeatVector, TimeDistributed, Input
import joblib
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple, Optional
import json

class DeepAnomalyDetector:
    """Advanced anomaly detection model for cloud cost data using deep learning."""
    
    def __init__(self, 
                model_path: Optional[str] = None, 
                version: str = "2.0.0",
                params: Dict[str, Any] = None):
        """Initialize the deep anomaly detector."""
        self.version = version
        self.params = params or {
            "lstm_units": 64,
            "dense_units": 32,
            "dropout_rate": 0.2,
            "seq_length": 7,  # Use one week of data as sequence
            "threshold_percentile": 95,
            "random_state": 42
        }
        self.training_date = None
        self.threshold = None
        self.scaler = MinMaxScaler()
        
        if model_path:
            self._load_model(model_path)
        else:
            self._build_model()
    
    def _build_model(self):
        """Build an LSTM autoencoder for anomaly detection."""
        # Define the sequence length
        seq_length = self.params["seq_length"]
        
        # Determine input shape (sequence length, number of features)
        # We'll assume 5 features for now but this will be adjusted during fitting
        input_shape = (seq_length, 5)  
        
        # Build encoder
        inputs = Input(shape=input_shape)
        encoded = LSTM(self.params["lstm_units"], activation='relu', return_sequences=False)(inputs)
        encoded = Dropout(self.params["dropout_rate"])(encoded)
        encoded = Dense(self.params["dense_units"], activation='relu')(encoded)
        
        # Build decoder
        decoded = RepeatVector(seq_length)(encoded)
        decoded = LSTM(self.params["lstm_units"], activation='relu', return_sequences=True)(decoded)
        decoded = Dropout(self.params["dropout_rate"])(decoded)
        decoded = TimeDistributed(Dense(input_shape[1]))(decoded)
        
        # Create autoencoder model
        self.model = Model(inputs, decoded)
        self.model.compile(optimizer='adam', loss='mse')
        
        # Also create a traditional Isolation Forest as backup/comparison
        self.isolation_forest = IsolationForest(
            contamination=0.05,
            random_state=self.params["random_state"]
        )
    
    def _load_model(self, model_path: str):
        """Load the model from disk."""
        try:
            # Load Keras model
            self.model = tf.keras.models.load_model(f"{model_path}_keras")
            
            # Load metadata
            metadata = joblib.load(f"{model_path}_metadata")
            self.version = metadata.get("version", self.version)
            self.params = metadata.get("params", self.params)
            self.training_date = metadata.get("training_date")
            self.threshold = metadata.get("threshold")
            self.scaler = metadata.get("scaler", MinMaxScaler())
            
            # Load isolation forest
            self.isolation_forest = joblib.load(f"{model_path}_iforest")
            
        except Exception as e:
            print(f"Error loading model: {e}")
            # Fallback to building a new model
            self._build_model()
    
    def _create_sequences(self, data: np.ndarray, seq_length: int) -> np.ndarray:
        """Create sequences for LSTM processing."""
        xs = []
        for i in range(len(data) - seq_length):
            xs.append(data[i:i+seq_length])
        return np.array(xs)
    
    def _preprocess_data(self, cost_data: List[Dict[str, Any]]) -> pd.DataFrame:
        """Preprocess cost data for anomaly detection."""
        # Convert to DataFrame
        df = pd.DataFrame(cost_data)
        
        # Ensure data is sorted by date
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date')
        
        # Feature engineering
        features = []
        
        # Daily cost is our primary feature
        if 'daily_cost' in df.columns:
            features.append('daily_cost')
        
        # Day-over-day change
        if 'daily_cost' in df.columns:
            df['day_over_day_change'] = df['daily_cost'].pct_change()
            features.append('day_over_day_change')
        
        # Rolling statistics
        for window in [3, 7, 14]:
            if 'daily_cost' in df.columns:
                df[f'rolling_{window}d_mean'] = df['daily_cost'].rolling(window=window).mean()
                df[f'rolling_{window}d_std'] = df['daily_cost'].rolling(window=window).std()
                df[f'z_score_{window}d'] = (df['daily_cost'] - df[f'rolling_{window}d_mean']) / df[f'rolling_{window}d_std'].replace(0, 1)
                
                features.append(f'rolling_{window}d_mean')
                features.append(f'rolling_{window}d_std')
                features.append(f'z_score_{window}d')
        
        # Add day of week (to capture weekly seasonality)
        if 'date' in df.columns:
            df['day_of_week'] = df['date'].dt.dayofweek
            # One-hot encode day of week
            day_dummies = pd.get_dummies(df['day_of_week'], prefix='day')
            df = pd.concat([df, day_dummies], axis=1)
            features.extend([f'day_{i}' for i in range(7)])
        
        # Handle missing values by forward-filling and then backward-filling
        df = df.fillna(method='ffill').fillna(method='bfill')
        
        # If still have NAs (e.g., at the beginning), fill with 0
        df = df.fillna(0)
        
        # Select features
        features_df = df[features].copy()
        
        return features_df
    
    def train(self, cost_data: List[Dict[str, Any]], validation_split: float = 0.2, epochs: int = 50, batch_size: int = 32) -> Dict[str, Any]:
        """Train the anomaly detection model.
        
        Args:
            cost_data: List of dictionaries containing cost data.
            validation_split: Fraction of data to use for validation.
            epochs: Number of training epochs.
            batch_size: Training batch size.
            
        Returns:
            Dictionary containing training history and metrics.
        """
        # Preprocess data
        features_df = self._preprocess_data(cost_data)
        
        # Scale the data
        scaled_data = self.scaler.fit_transform(features_df)
        
        # Create sequences
        seq_length = self.params["seq_length"]
        sequences = self._create_sequences(scaled_data, seq_length)
        
        # Train the model
        if sequences.shape[0] > 0:
            history = self.model.fit(
                sequences, sequences,
                epochs=epochs,
                batch_size=batch_size,
                validation_split=validation_split,
                shuffle=True,
                verbose=1
            )
            
            # Compute reconstruction error on the training data
            reconstructions = self.model.predict(sequences)
            reconstruction_errors = np.mean(np.square(sequences - reconstructions), axis=(1, 2))
            
            # Set threshold based on the percentile of reconstruction errors
            self.threshold = np.percentile(reconstruction_errors, self.params["threshold_percentile"])
            
            # Also train the isolation forest on the flattened data
            self.isolation_forest.fit(scaled_data)
            
            # Store training date
            self.training_date = datetime.now().isoformat()
            
            return {
                "history": history.history,
                "threshold": self.threshold,
                "reconstruction_errors": reconstruction_errors.tolist(),
                "training_samples": sequences.shape[0]
            }
        else:
            raise ValueError("Not enough data to create sequences for training")
    
    def detect_anomalies(self, cost_data: List[Dict[str, Any]], ensemble: bool = True) -> List[Dict[str, Any]]:
        """Detect anomalies in cost data.
        
        Args:
            cost_data: List of dictionaries containing cost data.
            ensemble: Whether to use ensemble (LSTM + Isolation Forest) detection.
            
        Returns:
            List of anomalous data points with anomaly scores and explanations.
        """
        # Create a copy of the input data
        result_data = cost_data.copy()
        
        # Preprocess data
        features_df = self._preprocess_data(cost_data)
        
        # Scale the data
        scaled_data = self.scaler.transform(features_df)
        
        # Create sequences
        seq_length = self.params["seq_length"]
        sequences = self._create_sequences(scaled_data, seq_length)
        
        # Get anomaly scores from LSTM autoencoder
        lstm_anomalies = []
        if sequences.shape[0] > 0:
            reconstructions = self.model.predict(sequences)
            reconstruction_errors = np.mean(np.square(sequences - reconstructions), axis=(1, 2))
            
            # If threshold is not set (e.g., model was not trained), use percentile
            if self.threshold is None:
                self.threshold = np.percentile(reconstruction_errors, self.params["threshold_percentile"])
            
            # Identify anomalies
            lstm_anomalies = reconstruction_errors > self.threshold
            
            # Apply detection to results
            for i, is_anomaly in enumerate(lstm_anomalies):
                if i + seq_length < len(result_data):
                    idx = i + seq_length  # the prediction is for the point after the sequence
                    result_data[idx]['lstm_anomaly'] = bool(is_anomaly)
                    result_data[idx]['lstm_score'] = float(reconstruction_errors[i])
        
        # Get anomaly scores from Isolation Forest
        iforest_scores = self.isolation_forest.decision_function(scaled_data)
        iforest_anomalies = self.isolation_forest.predict(scaled_data) == -1
        
        for i, (score, is_anomaly) in enumerate(zip(iforest_scores, iforest_anomalies)):
            result_data[i]['iforest_anomaly'] = bool(is_anomaly)
            result_data[i]['iforest_score'] = float(score)
            
            # For ensemble approach, determine final anomaly status
            if ensemble:
                # Use LSTM if available for the data point, otherwise use Isolation Forest
                if i >= seq_length and i < len(result_data) - 1:
                    lstm_idx = i - seq_length
                    if lstm_idx < len(lstm_anomalies):
                        result_data[i]['is_anomaly'] = bool(lstm_anomalies[lstm_idx] or is_anomaly)
                    else:
                        result_data[i]['is_anomaly'] = bool(is_anomaly)
                else:
                    result_data[i]['is_anomaly'] = bool(is_anomaly)
            else:
                # If not using ensemble, just use Isolation Forest for consistent coverage
                result_data[i]['is_anomaly'] = bool(is_anomaly)
        
        # Generate explanations for anomalies
        for i, data_point in enumerate(result_data):
            if data_point.get('is_anomaly', False):
                data_point['explanation'] = self._generate_explanation(
                    data_point, 
                    i, 
                    features_df, 
                    cost_data
                )
        
        # Return only the anomalies
        anomalies = [d for d in result_data if d.get('is_anomaly', False)]
        return anomalies
    
    def _generate_explanation(self, data_point: Dict[str, Any], index: int, features_df: pd.DataFrame, original_data: List[Dict[str, Any]]) -> str:
        """Generate a human-readable explanation for why a point was detected as an anomaly."""
        explanations = []
        
        # Get the original data point
        original = original_data[index]
        
        # Check if we have daily cost
        if 'daily_cost' in features_df.columns:
            # Get recent history (7 days)
            start_idx = max(0, index - 7)
            recent_costs = features_df['daily_cost'].iloc[start_idx:index].values
            
            if len(recent_costs) > 0:
                # Calculate stats
                recent_mean = np.mean(recent_costs)
                recent_std = np.std(recent_costs) if len(recent_costs) > 1 else 0
                
                # Current value
                current_cost = features_df['daily_cost'].iloc[index]
                
                # Calculate z-score
                if recent_std > 0:
                    z_score = (current_cost - recent_mean) / recent_std
                    
                    if abs(z_score) > 3:
                        direction = "higher" if z_score > 0 else "lower"
                        explanations.append(
                            f"Daily cost (${current_cost:.2f}) is {abs(z_score):.1f} standard deviations "
                            f"{direction} than the 7-day average (${recent_mean:.2f})."
                        )
                
                # Check for day-over-day change
                if index > 0 and 'daily_cost' in features_df.columns:
                    previous_cost = features_df['daily_cost'].iloc[index-1]
                    if previous_cost > 0:
                        pct_change = (current_cost - previous_cost) / previous_cost * 100
                        if abs(pct_change) > 20:  # More than 20% change
                            direction = "increase" if pct_change > 0 else "decrease"
                            explanations.append(
                                f"Day-over-day {direction} of {abs(pct_change):.1f}% "
                                f"(from ${previous_cost:.2f} to ${current_cost:.2f})."
                            )
        
        # If we have service information
        if 'service' in original:
            explanations.append(f"Primary service: {original['service']}")
        
        # If we have provider information
        if 'cloud_provider' in original:
            explanations.append(f"Cloud provider: {original['cloud_provider']}")
        
        # Add detection method
        methods = []
        if data_point.get('lstm_anomaly', False):
            methods.append("deep learning model")
        if data_point.get('iforest_anomaly', False):
            methods.append("statistical model")
        
        if methods:
            method_str = " and ".join(methods)
            explanations.append(f"Detected by {method_str}.")
        
        # Return combined explanation
        if explanations:
            return " ".join(explanations)
        else:
            return "Unusual spending pattern detected based on historical patterns."
    
    def save_model(self, model_path: str) -> None:
        """Save the trained model to disk.
        
        Args:
            model_path: Path to save the model files.
        """
        # Save Keras model
        self.model.save(f"{model_path}_keras")
        
        # Save isolation forest
        joblib.dump(self.isolation_forest, f"{model_path}_iforest")
        
        # Save metadata
        metadata = {
            "version": self.version,
            "training_date": self.training_date,
            "params": self.params,
            "threshold": self.threshold,
            "scaler": self.scaler
        }
        joblib.dump(metadata, f"{model_path}_metadata")

# Example function to evaluate model performance
def evaluate_anomaly_detection(
    model: DeepAnomalyDetector, 
    test_data: List[Dict[str, Any]], 
    known_anomalies: List[int] = None
) -> Dict[str, Any]:
    """Evaluate anomaly detection model performance.
    
    Args:
        model: Trained DeepAnomalyDetector model.
        test_data: Test data as list of dictionaries.
        known_anomalies: List of indices that are known anomalies (for calculating precision/recall).
        
    Returns:
        Dictionary with evaluation metrics.
    """
    # Detect anomalies
    detected_anomalies = model.detect_anomalies(test_data)
    
    # Get indices of detected anomalies
    detected_indices = [test_data.index(anomaly) for anomaly in detected_anomalies if anomaly in test_data]
    
    results = {
        "num_detected": len(detected_anomalies),
        "detected_percent": len(detected_anomalies) / len(test_data) * 100,
        "detected_indices": detected_indices
    }
    
    # If we have known anomalies, calculate precision and recall
    if known_anomalies:
        true_positives = len(set(detected_indices).intersection(set(known_anomalies)))
        false_positives = len(detected_indices) - true_positives
        false_negatives = len(known_anomalies) - true_positives
        
        precision = true_positives / (true_positives + false_positives) if (true_positives + false_positives) > 0 else 0
        recall = true_positives / (true_positives + false_negatives) if (true_positives + false_negatives) > 0 else 0
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
        
        results.update({
            "precision": precision,
            "recall": recall,
            "f1_score": f1,
            "true_positives": true_positives,
            "false_positives": false_positives,
            "false_negatives": false_negatives
        })
    
    return results

# Usage example:
if __name__ == "__main__":
    # Generate some sample data
    np.random.seed(42)
    
    # Create 90 days of cost data
    dates = [datetime.now() - timedelta(days=i) for i in range(90, 0, -1)]
    
    # Base pattern: weekday effect + slight upward trend + monthly seasonality
    base_cost = 100.0
    costs = []
    
    for i, date in enumerate(dates):
        # Weekday effect
        weekday_factor = 1.0 if date.weekday() < 5 else 0.7
        
        # Upward trend
        trend_factor = 1.0 + (i / len(dates)) * 0.3
        
        # Monthly seasonality (higher at month end)
        monthly_factor = 1.0 + (0.2 if date.day > 25 else 0.0)
        
        # Random noise
        noise = np.random.normal(1.0, 0.05)
        
        # Calculate daily cost
        daily_cost = base_cost * weekday_factor * trend_factor * monthly_factor * noise
        
        cost_entry = {
            'date': date.strftime('%Y-%m-%d'),
            'daily_cost': daily_cost,
            'service': 'EC2',
            'cloud_provider': 'AWS'
        }
        
        costs.append(cost_entry)
    
    # Inject anomalies
    known_anomalies = [20, 40, 60]
    for idx in known_anomalies:
        costs[idx]['daily_cost'] *= 3.0  # Triple the cost
    
    # Split data for training and testing
    train_data = costs[:70]
    test_data = costs[70:]
    
    # Create and train model
    detector = DeepAnomalyDetector()
    training_results = detector.train(
        train_data,
        epochs=20,
        batch_size=8
    )
    
    # Detect anomalies in test data
    anomalies = detector.detect_anomalies(test_data)
    
    # Print results
    print(f"Detected {len(anomalies)} anomalies in test data:")
    for anomaly in anomalies:
        print(f"Date: {anomaly['date']}, Cost: ${anomaly['daily_cost']:.2f}")
        print(f"Explanation: {anomaly.get('explanation', 'None')}")
        print("---")