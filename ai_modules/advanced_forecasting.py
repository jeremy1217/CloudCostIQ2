import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import Sequential, Model
from tensorflow.keras.layers import Dense, LSTM, GRU, Bidirectional, Dropout, Input
from tensorflow.keras.callbacks import EarlyStopping
from sklearn.preprocessing import MinMaxScaler, StandardScaler
import joblib
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple, Optional, Union
import matplotlib.pyplot as plt
import json

class DeepLearningForecaster:
    """Advanced cost forecasting model using deep learning techniques."""
    
    def __init__(self, 
                model_path: Optional[str] = None, 
                model_type: str = "lstm",  # Options: "lstm", "gru", "bilstm"
                version: str = "2.0.0",
                params: Dict[str, Any] = None):
        """Initialize the forecaster.
        
        Args:
            model_path: Path to a pre-trained model file.
            model_type: Type of deep learning model to use.
            version: Model version.
            params: Model parameters.
        """
        self.model_type = model_type
        self.version = version
        self.params = params or {
            "seq_length": 30,  # Input sequence length (e.g., 30 days)
            "forecast_horizon": 30,  # How many days to forecast
            "recurrent_units": 64,
            "dense_units": 32,
            "dropout_rate": 0.2,
            "learning_rate": 0.001,
            "activation": "relu",
            "uncertainty": True  # Whether to model prediction uncertainty
        }
        
        # Initialize scalers
        self.feature_scaler = MinMaxScaler()
        self.target_scaler = MinMaxScaler()
        
        # Training info
        self.training_date = None
        self.feature_columns = None
        self.target_column = "daily_cost"
        self.trained = False
        
        if model_path:
            self._load_model(model_path)
        else:
            self._build_model()
    
    def _build_model(self):
        """Build the deep learning model based on the specified type."""
        # Determine input shape (sequence length, number of features)
        # We'll set the feature dimension to 1 initially and update during training
        seq_length = self.params["seq_length"]
        feature_dim = 1
        
        # Define model architecture based on type
        if self.model_type == "lstm":
            self._build_lstm_model(seq_length, feature_dim)
        elif self.model_type == "gru":
            self._build_gru_model(seq_length, feature_dim)
        elif self.model_type == "bilstm":
            self._build_bilstm_model(seq_length, feature_dim)
        elif self.model_type == "transformer":
            self._build_transformer_model(seq_length, feature_dim)
        else:
            raise ValueError(f"Unsupported model type: {self.model_type}")
    
    def _build_lstm_model(self, seq_length: int, feature_dim: int):
        """Build an LSTM-based forecasting model."""
        if self.params["uncertainty"]:
            # For uncertainty predictions, we'll output mean and variance
            inputs = Input(shape=(seq_length, feature_dim))
            x = LSTM(self.params["recurrent_units"], return_sequences=True)(inputs)
            x = Dropout(self.params["dropout_rate"])(x)
            x = LSTM(self.params["recurrent_units"])(x)
            x = Dropout(self.params["dropout_rate"])(x)
            
            # Output layer with mean and variance estimation
            mean_output = Dense(self.params["forecast_horizon"], name="mean")(x)
            var_output = Dense(self.params["forecast_horizon"], activation='softplus', name="variance")(x)
            
            self.model = Model(inputs=inputs, outputs=[mean_output, var_output])
            self.model.compile(
                optimizer=tf.keras.optimizers.Adam(learning_rate=self.params["learning_rate"]),
                loss={
                    "mean": "mse",
                    "variance": self._negative_log_likelihood
                }
            )
        else:
            # Standard LSTM model for point forecasts
            self.model = Sequential([
                LSTM(self.params["recurrent_units"], activation=self.params["activation"], 
                     return_sequences=True, input_shape=(seq_length, feature_dim)),
                Dropout(self.params["dropout_rate"]),
                LSTM(self.params["recurrent_units"], activation=self.params["activation"]),
                Dropout(self.params["dropout_rate"]),
                Dense(self.params["dense_units"], activation=self.params["activation"]),
                Dense(self.params["forecast_horizon"])
            ])
            
            self.model.compile(
                optimizer=tf.keras.optimizers.Adam(learning_rate=self.params["learning_rate"]),
                loss="mse",
                metrics=["mae"]
            )
    
    def _build_gru_model(self, seq_length: int, feature_dim: int):
        """Build a GRU-based forecasting model."""
        # Similar structure to LSTM but using GRU cells
        self.model = Sequential([
            GRU(self.params["recurrent_units"], activation=self.params["activation"], 
                return_sequences=True, input_shape=(seq_length, feature_dim)),
            Dropout(self.params["dropout_rate"]),
            GRU(self.params["recurrent_units"], activation=self.params["activation"]),
            Dropout(self.params["dropout_rate"]),
            Dense(self.params["dense_units"], activation=self.params["activation"]),
            Dense(self.params["forecast_horizon"])
        ])
        
        self.model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=self.params["learning_rate"]),
            loss="mse",
            metrics=["mae"]
        )
    
    def _build_bilstm_model(self, seq_length: int, feature_dim: int):
        """Build a Bidirectional LSTM forecasting model."""
        self.model = Sequential([
            Bidirectional(LSTM(self.params["recurrent_units"], activation=self.params["activation"], 
                          return_sequences=True), input_shape=(seq_length, feature_dim)),
            Dropout(self.params["dropout_rate"]),
            Bidirectional(LSTM(self.params["recurrent_units"], activation=self.params["activation"])),
            Dropout(self.params["dropout_rate"]),
            Dense(self.params["dense_units"], activation=self.params["activation"]),
            Dense(self.params["forecast_horizon"])
        ])
        
        self.model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=self.params["learning_rate"]),
            loss="mse",
            metrics=["mae"]
        )
    
    def _build_transformer_model(self, seq_length: int, feature_dim: int):
        """Build a Transformer-based forecasting model."""
        # Simplified Transformer implementation
        # For a full implementation, see the TensorFlow tutorial on Transformers
        inputs = Input(shape=(seq_length, feature_dim))
        
        # Create positional encoding
        positions = tf.range(start=0, limit=seq_length, delta=1, dtype=tf.float32)
        pos_encoding = self._positional_encoding(seq_length, feature_dim)
        
        # Add positional encoding to input
        x = inputs + pos_encoding
        
        # Multi-head self-attention
        x = tf.keras.layers.MultiHeadAttention(
            num_heads=4, key_dim=feature_dim)(x, x)
        
        # Feed forward network
        x = tf.keras.layers.Dense(self.params["dense_units"], activation=self.params["activation"])(x)
        x = tf.keras.layers.Dense(feature_dim)(x)
        
        # Global average pooling
        x = tf.keras.layers.GlobalAveragePooling1D()(x)
        
        # Output layer
        outputs = tf.keras.layers.Dense(self.params["forecast_horizon"])(x)
        
        self.model = Model(inputs=inputs, outputs=outputs)
        
        self.model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=self.params["learning_rate"]),
            loss="mse",
            metrics=["mae"]
        )
    
    def _positional_encoding(self, position, d_model):
        """Generate positional encoding for Transformer model."""
        angle_rads = self._get_angles(
            np.arange(position)[:, np.newaxis],
            np.arange(d_model)[np.newaxis, :],
            d_model
        )
        
        # Apply sin to even indices in the array
        angle_rads[:, 0::2] = np.sin(angle_rads[:, 0::2])
        
        # Apply cos to odd indices in the array
        angle_rads[:, 1::2] = np.cos(angle_rads[:, 1::2])
        
        pos_encoding = angle_rads[np.newaxis, ...]
        
        return tf.cast(pos_encoding, dtype=tf.float32)
    
    def _get_angles(self, pos, i, d_model):
        """Calculate angles for positional encoding."""
        angle_rates = 1 / np.power(10000, (2 * (i // 2)) / np.float32(d_model))
        return pos * angle_rates
    
    def _negative_log_likelihood(self, y_true, y_var):
        """Custom loss function for variance prediction."""
        # Add a small constant to prevent division by zero
        epsilon = 1e-6
        # Calculate negative log likelihood
        return 0.5 * tf.math.log(y_var + epsilon) + 0.5 * tf.square(y_true) / (y_var + epsilon)
    
    def _create_sequences(self, data: np.ndarray, seq_length: int, horizon: int) -> Tuple[np.ndarray, np.ndarray]:
        """Create sequences for time series forecasting.
        
        Args:
            data: Input data array.
            seq_length: Length of input sequences.
            horizon: Forecast horizon (number of future time steps to predict).
            
        Returns:
            Tuple of (X sequences, y targets).
        """
        X, y = [], []
        
        for i in range(len(data) - seq_length - horizon + 1):
            X.append(data[i:i+seq_length])
            y.append(data[i+seq_length:i+seq_length+horizon, 0])  # Assuming target is first column
            
        return np.array(X), np.array(y)
    
    def _feature_engineering(self, df: pd.DataFrame) -> pd.DataFrame:
        """Apply feature engineering to input data.
        
        Args:
            df: Input DataFrame.
            
        Returns:
            DataFrame with engineered features.
        """
        # Make a copy to avoid modifying the original
        df_feat = df.copy()
        
        # Time-based features
        if isinstance(df_feat.index, pd.DatetimeIndex):
            date_index = df_feat.index
        elif 'date' in df_feat.columns:
            date_index = pd.to_datetime(df_feat['date'])
        else:
            # Create a default date index if none exists
            date_index = pd.date_range(start='2023-01-01', periods=len(df_feat), freq='D')
        
        # Day of week (using sin/cos encoding for cyclical features)
        day_of_week = date_index.dayofweek
        df_feat['day_of_week_sin'] = np.sin(2 * np.pi * day_of_week / 7)
        df_feat['day_of_week_cos'] = np.cos(2 * np.pi * day_of_week / 7)
        
        # Day of month
        day_of_month = date_index.day
        df_feat['day_of_month_sin'] = np.sin(2 * np.pi * day_of_month / 31)
        df_feat['day_of_month_cos'] = np.cos(2 * np.pi * day_of_month / 31)
        
        # Month of year
        month = date_index.month
        df_feat['month_sin'] = np.sin(2 * np.pi * month / 12)
        df_feat['month_cos'] = np.cos(2 * np.pi * month / 12)
        
        # Is weekend
        df_feat['is_weekend'] = (day_of_week >= 5).astype(float)
        
        # Is month end
        df_feat['is_month_end'] = date_index.is_month_end.astype(float)
        
        # Lag features
        target = self.target_column
        if target in df_feat.columns:
            for lag in [1, 7, 14, 30]:
                if len(df_feat) > lag:
                    df_feat[f'{target}_lag_{lag}'] = df_feat[target].shift(lag)
            
            # Rolling statistics
            for window in [7, 14, 30]:
                if len(df_feat) > window:
                    df_feat[f'{target}_rolling_mean_{window}d'] = df_feat[target].rolling(window=window).mean()
                    df_feat[f'{target}_rolling_std_{window}d'] = df_feat[target].rolling(window=window).std()
                    # Replace NaN values in std with 0 (occurs when std is calculated over constant values)
                    df_feat[f'{target}_rolling_std_{window}d'].fillna(0, inplace=True)
        
        # Handle NaN values from lag features
        df_feat.fillna(0, inplace=True)
        
        return df_feat
    
    def _prepare_data(self, cost_data: List[Dict[str, Any]], target_column: str = "daily_cost") -> Tuple[np.ndarray, np.ndarray]:
        """Prepare data for forecasting.
        
        Args:
            cost_data: List of dictionaries containing cost data.
            target_column: Name of the target column to forecast.
            
        Returns:
            Tuple of (X sequences, y targets).
        """
        # Convert to DataFrame
        df = pd.DataFrame(cost_data)
        
        # Ensure data is sorted by date
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date')
            df.set_index('date', inplace=True)
        
        # Save target column name
        self.target_column = target_column
        
        # Apply feature engineering
        df_feat = self._feature_engineering(df)
        
        # Separate features and target
        if target_column in df_feat.columns:
            # Save feature column names for later use
            self.feature_columns = [col for col in df_feat.columns if col != target_column]
            
            # Scale features
            X = self.feature_scaler.fit_transform(df_feat[self.feature_columns])
            
            # Scale target
            y = self.target_scaler.fit_transform(df_feat[[target_column]])
            
            # Combine for sequence creation
            data = np.column_stack((y, X))
            
            # Create sequences
            X_seq, y_seq = self._create_sequences(
                data, 
                self.params["seq_length"],
                self.params["forecast_horizon"]
            )
            
            return X_seq, y_seq
        else:
            raise ValueError(f"Target column '{target_column}' not found in data")
    
    def train(self, cost_data: List[Dict[str, Any]], 
             target_column: str = "daily_cost",
             validation_split: float = 0.2, 
             epochs: int = 100, 
             batch_size: int = 32,
             patience: int = 10) -> Dict[str, Any]:
        """Train the forecasting model.
        
        Args:
            cost_data: List of dictionaries containing cost data.
            target_column: Name of the target column to forecast.
            validation_split: Fraction of data to use for validation.
            epochs: Number of training epochs.
            batch_size: Training batch size.
            patience: Early stopping patience.
            
        Returns:
            Dictionary containing training history and metrics.
        """
        # Prepare data
        X, y = self._prepare_data(cost_data, target_column)
        
        # Check if we have enough data
        if len(X) < 10:  # Arbitrary small number
            raise ValueError("Not enough data for training. Need more historical data points.")
        
        # Update input shape based on actual feature dimension
        if X.shape[2] != self.model.input_shape[-1]:
            # Rebuild model with correct feature dimension
            self._build_model()
        
        # Early stopping callback
        early_stopping = EarlyStopping(
            monitor='val_loss',
            patience=patience,
            restore_best_weights=True
        )
        
        # Train the model
        if self.params["uncertainty"]:
            # For uncertainty model, we need to provide the target twice, for mean and variance
            history = self.model.fit(
                X, [y, y],  # Use same y for both outputs
                epochs=epochs,
                batch_size=batch_size,
                validation_split=validation_split,
                callbacks=[early_stopping],
                shuffle=True,
                verbose=1
            )
        else:
            history = self.model.fit(
                X, y,
                epochs=epochs,
                batch_size=batch_size,
                validation_split=validation_split,
                callbacks=[early_stopping],
                shuffle=True,
                verbose=1
            )
        
        # Store training date
        self.training_date = datetime.now().isoformat()
        self.trained = True
        
        # Return training metrics
        return {
            "history": {k: [float(val) for val in v] for k, v in history.history.items()},
            "final_loss": float(history.history["loss"][-1]),
            "final_val_loss": float(history.history["val_loss"][-1]) if "val_loss" in history.history else None,
            "epochs_trained": len(history.history["loss"]),
            "early_stopped": len(history.history["loss"]) < epochs,
            "input_shape": self.model.input_shape,
            "output_shape": self.model.output_shape if not self.params["uncertainty"] else self.model.output_shape[0],
            "feature_dimension": X.shape[2],
            "training_samples": len(X)
        }

    def forecast(self, cost_data: List[Dict[str, Any]], 
                forecast_steps: Optional[int] = None,
                return_confidence_intervals: bool = True,
                confidence_level: float = 0.9) -> Dict[str, Any]:
        """Generate forecasts based on historical data.
        
        Args:
            cost_data: List of dictionaries containing historical cost data.
            forecast_steps: Number of time steps to forecast, defaults to model's horizon.
            return_confidence_intervals: Whether to return confidence intervals.
            confidence_level: Confidence level for intervals (0.9 = 90% intervals).
            
        Returns:
            Dictionary containing forecasts and related information.
        """
        if not self.trained:
            raise ValueError("Model has not been trained yet. Call train() first.")
        
        # Use model's forecast horizon if not specified
        if forecast_steps is None:
            forecast_steps = self.params["forecast_horizon"]
        
        # Limit to model's maximum horizon
        forecast_steps = min(forecast_steps, self.params["forecast_horizon"])
        
        # Convert to DataFrame
        df = pd.DataFrame(cost_data)
        
        # Ensure data is sorted by date
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date')
            df.set_index('date', inplace=True)
        
        # Apply feature engineering
        df_feat = self._feature_engineering(df)
        
        # Get the last sequence
        if len(df_feat) >= self.params["seq_length"]:
            # Use feature columns saved during training
            if not self.feature_columns:
                raise ValueError("Feature columns not defined. Model may not be properly trained.")
            
            # Ensure all feature columns exist in the data
            for col in self.feature_columns:
                if col not in df_feat.columns:
                    df_feat[col] = 0  # Add missing columns with default values
            
            # Scale features
            X = self.feature_scaler.transform(df_feat[self.feature_columns])
            
            # Scale target if it exists
            if self.target_column in df_feat.columns:
                y = self.target_scaler.transform(df_feat[[self.target_column]])
                data = np.column_stack((y, X))
            else:
                # Create dummy target column if not available
                dummy_y = np.zeros((len(X), 1))
                data = np.column_stack((dummy_y, X))
            
            # Get last sequence
            last_sequence = data[-self.params["seq_length"]:]
            X_pred = np.expand_dims(last_sequence, axis=0)
            
            # Generate forecast
            if self.params["uncertainty"]:
                mean_forecast, var_forecast = self.model.predict(X_pred)
                
                # Convert mean forecast back to original scale
                mean_forecast_2d = np.expand_dims(mean_forecast[0, :forecast_steps], axis=1)
                forecast_values = self.target_scaler.inverse_transform(mean_forecast_2d).flatten()
                
                # Calculate confidence intervals
                if return_confidence_intervals:
                    # Calculate z-score for the confidence level
                    z_score = abs(np.percentile(np.random.normal(0, 1, 10000), (1 - confidence_level) / 2 * 100))
                    
                    # Calculate lower and upper bounds
                    std_dev = np.sqrt(var_forecast[0, :forecast_steps])
                    lower_bound_2d = np.expand_dims(mean_forecast[0, :forecast_steps] - z_score * std_dev, axis=1)
                    upper_bound_2d = np.expand_dims(mean_forecast[0, :forecast_steps] + z_score * std_dev, axis=1)
                    
                    # Convert bounds back to original scale
                    lower_bound = self.target_scaler.inverse_transform(lower_bound_2d).flatten()
                    upper_bound = self.target_scaler.inverse_transform(upper_bound_2d).flatten()
                else:
                    lower_bound = None
                    upper_bound = None
            else:
                # For point forecasts
                forecast = self.model.predict(X_pred)
                
                # Convert forecast back to original scale
                forecast_2d = np.expand_dims(forecast[0, :forecast_steps], axis=1)
                forecast_values = self.target_scaler.inverse_transform(forecast_2d).flatten()
                
                # Calculate confidence intervals based on model error
                if return_confidence_intervals:
                    # Use a simple error estimate based on the model's training MAE
                    error_estimate = 0.1 * forecast_values  # Placeholder, should be based on actual model error
                    z_score = abs(np.percentile(np.random.normal(0, 1, 10000), (1 - confidence_level) / 2 * 100))
                    
                    lower_bound = forecast_values - z_score * error_estimate
                    upper_bound = forecast_values + z_score * error_estimate
                else:
                    lower_bound = None
                    upper_bound = None
            
            # Generate forecast dates
            last_date = df.index[-1] if isinstance(df.index, pd.DatetimeIndex) else pd.to_datetime(df['date'].iloc[-1])
            forecast_dates = [last_date + timedelta(days=i+1) for i in range(forecast_steps)]
            
            # Prepare result
            result = {
                "forecast_values": forecast_values.tolist(),
                "forecast_dates": [date.strftime('%Y-%m-%d') for date in forecast_dates],
                "confidence_level": confidence_level if return_confidence_intervals else None,
            }
            
            if return_confidence_intervals:
                result["lower_bound"] = lower_bound.tolist() if lower_bound is not None else None
                result["upper_bound"] = upper_bound.tolist() if upper_bound is not None else None
            
            return result
        else:
            raise ValueError(f"Not enough historical data. Need at least {self.params['seq_length']} data points.")

    def recursive_forecast(self, cost_data: List[Dict[str, Any]], 
                           forecast_steps: int,
                           include_features: bool = True) -> Dict[str, Any]:
        """Generate forecasts recursively for longer horizons.
        
        This method is useful when forecast_steps > model's horizon.
        It iteratively forecasts, then uses those forecasts as inputs for the next period.
        
        Args:
            cost_data: List of dictionaries containing historical cost data.
            forecast_steps: Total number of time steps to forecast.
            include_features: Whether to include feature engineering for future periods.
            
        Returns:
            Dictionary containing forecasts and related information.
        """
        # Initial forecast
        forecast_result = self.forecast(cost_data, min(forecast_steps, self.params["forecast_horizon"]))
        
        # If we need to forecast beyond the model's horizon
        if forecast_steps > self.params["forecast_horizon"]:
            # Initialize lists for recursive forecasting
            all_forecast_values = forecast_result["forecast_values"].copy()
            all_forecast_dates = forecast_result["forecast_dates"].copy()
            
            # Lower and upper bounds if available
            if "lower_bound" in forecast_result and "upper_bound" in forecast_result:
                all_lower_bound = forecast_result["lower_bound"].copy()
                all_upper_bound = forecast_result["upper_bound"].copy()
                has_bounds = True
            else:
                has_bounds = False
            
            # Continue forecasting until we reach the desired number of steps
            remaining_steps = forecast_steps - self.params["forecast_horizon"]
            current_data = cost_data.copy()
            
            while remaining_steps > 0:
                # Create synthetic data points for the forecast we just made
                last_date = pd.to_datetime(current_data[-1]["date"])
                
                for i in range(min(self.params["forecast_horizon"], len(all_forecast_values))):
                    forecast_date = last_date + timedelta(days=i+1)
                    
                    # Create a synthetic data point
                    synthetic_point = {
                        "date": forecast_date.strftime('%Y-%m-%d'),
                        self.target_column: all_forecast_values[i]
                    }
                    
                    # Add any additional features from the last real data point
                    if include_features:
                        for k, v in current_data[-1].items():
                            if k not in ["date", self.target_column]:
                                synthetic_point[k] = v
                    
                    # Add to current data
                    current_data.append(synthetic_point)
                
                # Generate the next forecast
                next_forecast = self.forecast(
                    current_data, 
                    min(remaining_steps, self.params["forecast_horizon"])
                )
                
                # Append to results
                all_forecast_values.extend(next_forecast["forecast_values"])
                all_forecast_dates.extend(next_forecast["forecast_dates"])
                
                if has_bounds and "lower_bound" in next_forecast and "upper_bound" in next_forecast:
                    all_lower_bound.extend(next_forecast["lower_bound"])
                    all_upper_bound.extend(next_forecast["upper_bound"])
                
                # Update remaining steps
                remaining_steps -= len(next_forecast["forecast_values"])
            
            # Trim to exactly the number of steps requested
            all_forecast_values = all_forecast_values[:forecast_steps]
            all_forecast_dates = all_forecast_dates[:forecast_steps]
            
            if has_bounds:
                all_lower_bound = all_lower_bound[:forecast_steps]
                all_upper_bound = all_upper_bound[:forecast_steps]
            
            # Update result
            forecast_result["forecast_values"] = all_forecast_values
            forecast_result["forecast_dates"] = all_forecast_dates
            
            if has_bounds:
                forecast_result["lower_bound"] = all_lower_bound
                forecast_result["upper_bound"] = all_upper_bound
            
            # Add a flag indicating this was a recursive forecast
            forecast_result["recursive_forecast"] = True
        
        return forecast_result
    
    def scenario_forecast(self, cost_data: List[Dict[str, Any]],
                         scenarios: List[Dict[str, Any]],
                         forecast_steps: int) -> Dict[str, List[Dict[str, Any]]]:
        """Generate forecasts under different scenarios.
        
        Args:
            cost_data: List of dictionaries containing historical cost data.
            scenarios: List of scenario dictionaries, each containing:
                - name: Scenario name
                - description: Scenario description
                - adjustments: Dictionary of adjustment factors for features/target
            forecast_steps: Number of time steps to forecast.
            
        Returns:
            Dictionary containing forecasts for each scenario.
        """
        scenario_results = []
        
        # Base forecast with no adjustments
        base_forecast = self.recursive_forecast(cost_data, forecast_steps)
        
        # Add base scenario
        scenario_results.append({
            "name": "Base Forecast",
            "description": "Forecast based on current trends with no adjustments",
            "forecast": base_forecast
        })
        
        # Generate forecasts for each scenario
        for scenario in scenarios:
            # Make a copy of the data
            scenario_data = cost_data.copy()
            
            # Apply adjustments
            if "adjustments" in scenario:
                for data_point in scenario_data:
                    for key, adjustment in scenario["adjustments"].items():
                        if key in data_point:
                            # Apply adjustment factor
                            if isinstance(adjustment, (int, float)):
                                data_point[key] *= adjustment
                            # Apply absolute value
                            elif isinstance(adjustment, dict) and "value" in adjustment:
                                data_point[key] = adjustment["value"]
            
            # Generate forecast for this scenario
            scenario_forecast = self.recursive_forecast(scenario_data, forecast_steps)
            
            # Add to results
            scenario_results.append({
                "name": scenario["name"],
                "description": scenario["description"],
                "forecast": scenario_forecast,
                "adjustments": scenario.get("adjustments", {})
            })
        
        return {"scenarios": scenario_results}
    
    def plot_forecast(self, historical_data: List[Dict[str, Any]], 
                     forecast_result: Dict[str, Any],
                     title: str = "Cost Forecast",
                     return_fig: bool = False) -> Optional[plt.Figure]:
        """Plot forecast results with historical data.
        
        Args:
            historical_data: List of dictionaries with historical data.
            forecast_result: Dictionary containing forecast results.
            title: Plot title.
            return_fig: Whether to return the figure object.
            
        Returns:
            Matplotlib figure if return_fig is True, otherwise None.
        """
        # Create figure
        fig, ax = plt.subplots(figsize=(12, 6))
        
        # Plot historical data
        hist_df = pd.DataFrame(historical_data)
        if 'date' in hist_df.columns:
            hist_df['date'] = pd.to_datetime(hist_df['date'])
            hist_dates = hist_df['date']
            hist_values = hist_df[self.target_column]
            ax.plot(hist_dates, hist_values, label='Historical', color='blue')
        
        # Plot forecast
        forecast_dates = [pd.to_datetime(d) for d in forecast_result["forecast_dates"]]
        forecast_values = forecast_result["forecast_values"]
        ax.plot(forecast_dates, forecast_values, label='Forecast', color='red')
        
        # Plot confidence intervals if available
        if "lower_bound" in forecast_result and "upper_bound" in forecast_result:
            lower_bound = forecast_result["lower_bound"]
            upper_bound = forecast_result["upper_bound"]
            ax.fill_between(forecast_dates, lower_bound, upper_bound, 
                           color='red', alpha=0.2, 
                           label=f'{int(forecast_result["confidence_level"]*100)}% Confidence Interval')
        
        # Format plot
        ax.set_title(title)
        ax.set_xlabel('Date')
        ax.set_ylabel('Cost')
        ax.legend()
        ax.grid(True, linestyle='--', alpha=0.7)
        
        # Format date axis
        fig.autofmt_xdate()
        
        if return_fig:
            return fig
        else:
            plt.show()
            return None
    
    def evaluate(self, test_data: List[Dict[str, Any]]) -> Dict[str, float]:
        """Evaluate model performance on test data.
        
        Args:
            test_data: List of dictionaries containing test data.
            
        Returns:
            Dictionary with evaluation metrics.
        """
        if not self.trained:
            raise ValueError("Model has not been trained yet. Call train() first.")
        
        # Convert to DataFrame
        df = pd.DataFrame(test_data)
        
        # Ensure data is sorted by date
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date')
        
        # Prepare sequences for evaluation
        X, y_true = self._prepare_data(test_data, self.target_column)
        
        # Make predictions
        if self.params["uncertainty"]:
            y_pred_mean, _ = self.model.predict(X)
            y_pred = y_pred_mean
        else:
            y_pred = self.model.predict(X)
        
        # Convert back to original scale
        y_true_orig = self.target_scaler.inverse_transform(y_true)
        y_pred_orig = self.target_scaler.inverse_transform(y_pred.reshape(-1, 1)).reshape(y_pred.shape)
        
        # Calculate metrics
        metrics = {}
        
        # Calculate MAE, MSE, RMSE
        mae = np.mean(np.abs(y_true_orig - y_pred_orig))
        mse = np.mean(np.square(y_true_orig - y_pred_orig))
        rmse = np.sqrt(mse)
        
        # Calculate MAPE (Mean Absolute Percentage Error)
        # Avoid division by zero by adding a small epsilon
        mape = np.mean(np.abs((y_true_orig - y_pred_orig) / (y_true_orig + 1e-8))) * 100
        
        # Store metrics
        metrics["mae"] = float(mae)
        metrics["mse"] = float(mse)
        metrics["rmse"] = float(rmse)
        metrics["mape"] = float(mape)
        
        # Calculate metrics for different forecast horizons
        horizon_metrics = {}
        for h in range(1, min(7, y_true.shape[1]) + 1):
            mae_h = np.mean(np.abs(y_true_orig[:, h-1] - y_pred_orig[:, h-1]))
            horizon_metrics[f"mae_day_{h}"] = float(mae_h)
        
        metrics["horizon_metrics"] = horizon_metrics
        
        return metrics
    
    def _load_model(self, model_path: str) -> None:
        """Load model and metadata from disk."""
        try:
            # Load Keras model
            self.model = tf.keras.models.load_model(
                f"{model_path}_keras",
                custom_objects={"_negative_log_likelihood": self._negative_log_likelihood}
            )
            
            # Load metadata
            metadata = joblib.load(f"{model_path}_metadata")
            
            # Update attributes
            self.version = metadata.get("version", self.version)
            self.params = metadata.get("params", self.params)
            self.model_type = metadata.get("model_type", self.model_type)
            self.training_date = metadata.get("training_date")
            self.feature_columns = metadata.get("feature_columns")
            self.target_column = metadata.get("target_column", "daily_cost")
            
            # Load scalers
            self.feature_scaler = metadata.get("feature_scaler", MinMaxScaler())
            self.target_scaler = metadata.get("target_scaler", MinMaxScaler())
            
            # Mark as trained
            self.trained = True
            
        except Exception as e:
            print(f"Error loading model: {e}")
            # Fallback to building a new model
            self._build_model()
            self.trained = False
    
    def save_model(self, model_path: str) -> None:
        """Save model and metadata to disk."""
        if not self.trained:
            raise ValueError("Cannot save untrained model. Train the model first.")
        
        # Save Keras model
        self.model.save(f"{model_path}_keras")
        
        # Save metadata
        metadata = {
            "version": self.version,
            "model_type": self.model_type,
            "params": self.params,
            "training_date": self.training_date,
            "feature_columns": self.feature_columns,
            "target_column": self.target_column,
            "feature_scaler": self.feature_scaler,
            "target_scaler": self.target_scaler
        }
        joblib.dump(metadata, f"{model_path}_metadata")

# Example usage code
if __name__ == "__main__":
    # Generate synthetic data for demonstration
    np.random.seed(42)
    
    # Create 365 days of cost data
    dates = [datetime.now() - timedelta(days=i) for i in range(365, 0, -1)]
    dates.sort()  # Ensure chronological order
    
    # Base pattern: weekday effect + upward trend + monthly seasonality
    base_cost = 1000.0
    costs = []
    
    for i, date in enumerate(dates):
        # Weekday effect
        weekday_factor = 1.0 if date.weekday() < 5 else 0.7
        
        # Upward trend (5% monthly growth)
        trend_factor = 1.0 + (i / 30) * 0.05
        
        # Monthly seasonality (higher at month end)
        monthly_factor = 1.0 + (0.2 if date.day > 25 else 0.0)
        
        # Quarterly effect (Q4 higher spending)
        quarter = (date.month - 1) // 3 + 1
        quarterly_factor = 1.2 if quarter == 4 else 1.0
        
        # Random noise
        noise = np.random.normal(1.0, 0.05)
        
        # Calculate daily cost
        daily_cost = base_cost * weekday_factor * trend_factor * monthly_factor * quarterly_factor * noise
        
        cost_entry = {
            'date': date.strftime('%Y-%m-%d'),
            'daily_cost': daily_cost,
            'service': 'EC2',
            'cloud_provider': 'AWS'
        }
        
        costs.append(cost_entry)
    
    # Split data for training and testing
    train_data = costs[:-30]  # All but last 30 days
    test_data = costs[-30:]   # Last 30 days
    
    # Create forecaster instance
    forecaster = DeepLearningForecaster(model_type="lstm")
    
    # Train the model
    print("Training model...")
    train_result = forecaster.train(
        train_data,
        target_column="daily_cost",
        epochs=50,
        batch_size=32
    )
    print(f"Training complete. Final loss: {train_result['final_loss']:.4f}")
    
    # Generate forecast
    print("Generating forecast...")
    forecast_result = forecaster.forecast(
        train_data,
        forecast_steps=30,
        return_confidence_intervals=True
    )
    
    # Evaluate model
    print("Evaluating model...")
    eval_metrics = forecaster.evaluate(test_data)
    print(f"Evaluation metrics:")
    print(f"MAE: ${eval_metrics['mae']:.2f}")
    print(f"RMSE: ${eval_metrics['rmse']:.2f}")
    print(f"MAPE: {eval_metrics['mape']:.2f}%")
    
    # Plot forecast vs actual
    print("Plotting forecast vs actual...")
    plt.figure(figsize=(12, 6))
    
    # Plot historical data
    hist_df = pd.DataFrame(train_data)
    hist_df['date'] = pd.to_datetime(hist_df['date'])
    plt.plot(hist_df['date'], hist_df['daily_cost'], label='Historical', color='blue')
    
    # Plot forecast
    forecast_dates = [pd.to_datetime(d) for d in forecast_result["forecast_dates"]]
    plt.plot(forecast_dates, forecast_result["forecast_values"], label='Forecast', color='red')
    
    # Plot confidence intervals
    plt.fill_between(
        forecast_dates,
        forecast_result["lower_bound"],
        forecast_result["upper_bound"],
        color='red', alpha=0.2,
        label='90% Confidence Interval'
    )
    
    # Plot actual test data
    test_df = pd.DataFrame(test_data)
    test_df['date'] = pd.to_datetime(test_df['date'])
    plt.plot(test_df['date'], test_df['daily_cost'], label='Actual', color='green')
    
    plt.title('Cost Forecast')
    plt.xlabel('Date')
    plt.ylabel('Cost ($)')
    plt.legend()
    plt.grid(True, linestyle='--', alpha=0.7)
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.show()
    
    # Generate scenario forecasts
    print("Generating scenario forecasts...")
    scenarios = [
        {
            "name": "Increased Usage",
            "description": "Assumes 20% higher usage across all services",
            "adjustments": {"daily_cost": 1.2}
        },
        {
            "name": "Cost Optimization",
            "description": "Assumes 15% cost reduction from optimization efforts",
            "adjustments": {"daily_cost": 0.85}
        }
    ]
    
    scenario_results = forecaster.scenario_forecast(train_data, scenarios, 60)
    
    # Save model
    print("Saving model...")
    forecaster.save_model("deep_cost_forecaster")
    print("Model saved successfully.")