from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import numpy as np
import pandas as pd
import joblib
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple, Optional

class CostForecaster:
    """Cost forecasting model for cloud spend prediction."""
    
    def __init__(self, model_path: Optional[str] = None):
        """Initialize the cost forecaster.
        
        Args:
            model_path: Path to a pre-trained model file.
        """
        if model_path:
            self.model = joblib.load(model_path)
            self.scaler = joblib.load(f"{model_path}_scaler")
        else:
            self.model = RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                random_state=42
            )
            self.scaler = StandardScaler()
    
    def _create_time_features(self, df: pd.DataFrame, date_col: str = 'date') -> pd.DataFrame:
        """Create time-based features from a date column.
        
        Args:
            df: DataFrame containing the date column.
            date_col: Name of the date column.
            
        Returns:
            DataFrame with added time features.
        """
        # Ensure date column is datetime type
        if not pd.api.types.is_datetime64_any_dtype(df[date_col]):
            df[date_col] = pd.to_datetime(df[date_col])
            
        # Extract time features
        df['day_of_week'] = df[date_col].dt.dayofweek
        df['day_of_month'] = df[date_col].dt.day
        df['month'] = df[date_col].dt.month
        df['quarter'] = df[date_col].dt.quarter
        df['is_weekend'] = df['day_of_week'].apply(lambda x: 1 if x >= 5 else 0)
        df['is_month_end'] = df[date_col].dt.is_month_end.astype(int)
        
        return df
    
    def _create_lag_features(self, df: pd.DataFrame, target_col: str = 'daily_cost', lags: List[int] = [1, 7, 14, 30]) -> pd.DataFrame:
        """Create lag features of the target variable.
        
        Args:
            df: DataFrame containing the target column.
            target_col: Name of the target column.
            lags: List of lag periods to create.
            
        Returns:
            DataFrame with added lag features.
        """
        for lag in lags:
            df[f'{target_col}_lag_{lag}'] = df[target_col].shift(lag)
            
        return df
    
    def _create_rolling_features(self, df: pd.DataFrame, target_col: str = 'daily_cost', windows: List[int] = [7, 14, 30]) -> pd.DataFrame:
        """Create rolling window features of the target variable.
        
        Args:
            df: DataFrame containing the target column.
            target_col: Name of the target column.
            windows: List of window sizes to create.
            
        Returns:
            DataFrame with added rolling window features.
        """
        for window in windows:
            df[f'{target_col}_mean_{window}d'] = df[target_col].rolling(window=window).mean()
            df[f'{target_col}_std_{window}d'] = df[target_col].rolling(window=window).std()
            df[f'{target_col}_min_{window}d'] = df[target_col].rolling(window=window).min()
            df[f'{target_col}_max_{window}d'] = df[target_col].rolling(window=window).max()
            
        return df
    
    def preprocess_data(self, cost_data: List[Dict[str, Any]], target_col: str = 'daily_cost') -> Tuple[pd.DataFrame, pd.Series]:
        """Preprocess cost data for forecasting.
        
        Args:
            cost_data: List of dictionaries containing cost data.
            target_col: Name of the target column.
            
        Returns:
            Tuple of (X features, y target)
        """
        # Convert to DataFrame
        df = pd.DataFrame(cost_data)
        
        # Create time features
        df = self._create_time_features(df)
        
        # Create lag features
        df = self._create_lag_features(df, target_col)
        
        # Create rolling features
        df = self._create_rolling_features(df, target_col)
        
        # Drop rows with NAs (resulting from lag/rolling features)
        df = df.dropna()
        
        # Select features
        feature_cols = [
            'day_of_week', 'day_of_month', 'month', 'quarter', 
            'is_weekend', 'is_month_end'
        ]
        
        # Add lag and rolling feature columns
        for col in df.columns:
            if '_lag_' in col or '_mean_' in col or '_std_' in col or '_min_' in col or '_max_' in col:
                feature_cols.append(col)
        
        # Cloud provider and service one-hot encoding
        if 'cloud_provider' in df.columns:
            provider_dummies = pd.get_dummies(df['cloud_provider'], prefix='provider')
            df = pd.concat([df, provider_dummies], axis=1)
            feature_cols.extend(provider_dummies.columns.tolist())
            
        if 'service' in df.columns:
            service_dummies = pd.get_dummies(df['service'], prefix='service')
            df = pd.concat([df, service_dummies], axis=1)
            feature_cols.extend(service_dummies.columns.tolist())
        
        X = df[feature_cols]
        y = df[target_col]
        
        return X, y
    
    def train(self, cost_data: List[Dict[str, Any]], target_col: str = 'daily_cost') -> None:
        """Train the cost forecasting model.
        
        Args:
            cost_data: List of dictionaries containing cost data.
            target_col: Name of the target column.
        """
        X, y = self.preprocess_data(cost_data, target_col)
        
        # Scale the features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train the model
        self.model.fit(X_scaled, y)
    
    def forecast(self, cost_data: List[Dict[str, Any]], days_to_forecast: int = 30, target_col: str = 'daily_cost') -> List[Dict[str, Any]]:
        """Forecast future costs.
        
        Args:
            cost_data: List of dictionaries containing historical cost data.
            days_to_forecast: Number of days to forecast.
            target_col: Name of the target column.
            
        Returns:
            List of dictionaries with forecasted costs.
        """
        # Convert to DataFrame
        df = pd.DataFrame(cost_data)
        
        # Sort by date to ensure proper forecasting
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        
        # Create features for available data
        df = self._create_time_features(df)
        df = self._create_lag_features(df, target_col)
        df = self._create_rolling_features(df, target_col)
        
        # Generate future dates
        last_date = df['date'].max()
        future_dates = [last_date + timedelta(days=i+1) for i in range(days_to_forecast)]
        
        # Create a forecast dataframe
        forecast_df = pd.DataFrame({'date': future_dates})
        forecast_df = self._create_time_features(forecast_df)
        
        # Initialize forecasted costs
        forecasted_costs = []
        
        # Copy the latest cloud provider and service
        if 'cloud_provider' in df.columns:
            latest_provider = df.iloc[-1]['cloud_provider']
            forecast_df['cloud_provider'] = latest_provider
        
        if 'service' in df.columns:
            latest_service = df.iloc[-1]['service']
            forecast_df['service'] = latest_service
        
        # Combine historical and future dataframes to help create features
        temp_df = pd.concat([df[[c for c in df.columns if c != 'date']], forecast_df[[c for c in forecast_df.columns if c != 'date']]])
        temp_df['date'] = pd.concat([df['date'], forecast_df['date']])
        temp_df = temp_df.reset_index(drop=True)
        
        # Iteratively forecast one day at a time
        for i in range(days_to_forecast):
            current_idx = len(df) + i
            
            # Prepare lag features
            for lag in [1, 7, 14, 30]:
                if current_idx - lag >= 0:
                    lag_idx = current_idx - lag
                    temp_df.loc[current_idx, f'{target_col}_lag_{lag}'] = temp_df.loc[lag_idx, target_col] if lag_idx < len(df) else temp_df.loc[lag_idx, f'{target_col}_forecast']
            
            # Prepare rolling window features
            for window in [7, 14, 30]:
                if current_idx - window >= 0:
                    values = []
                    for j in range(window):
                        idx = current_idx - window + j
                        if idx < len(df):
                            values.append(temp_df.loc[idx, target_col])
                        else:
                            values.append(temp_df.loc[idx, f'{target_col}_forecast'])
                    
                    temp_df.loc[current_idx, f'{target_col}_mean_{window}d'] = np.mean(values)
                    temp_df.loc[current_idx, f'{target_col}_std_{window}d'] = np.std(values) if len(values) > 1 else 0
                    temp_df.loc[current_idx, f'{target_col}_min_{window}d'] = np.min(values)
                    temp_df.loc[current_idx, f'{target_col}_max_{window}d'] = np.max(values)
            
            # Select features for this prediction
            feature_cols = [
                'day_of_week', 'day_of_month', 'month', 'quarter', 
                'is_weekend', 'is_month_end'
            ]
            
            # Add lag and rolling feature columns
            for col in temp_df.columns:
                if ('_lag_' in col or '_mean_' in col or '_std_' in col or '_min_' in col or '_max_' in col) and col != f'{target_col}_forecast':
                    feature_cols.append(col)
            
            # One-hot encoding
            if 'cloud_provider' in temp_df.columns:
                provider_dummies = pd.get_dummies(temp_df['cloud_provider'], prefix='provider')
                temp_df = pd.concat([temp_df, provider_dummies], axis=1)
                feature_cols.extend([c for c in provider_dummies.columns if c not in feature_cols])
                
            if 'service' in temp_df.columns:
                service_dummies = pd.get_dummies(temp_df['service'], prefix='service')
                temp_df = pd.concat([temp_df, service_dummies], axis=1)
                feature_cols.extend([c for c in service_dummies.columns if c not in feature_cols])
            
            # Get features for prediction
            try:
                X_pred = temp_df.loc[current_idx, feature_cols].values.reshape(1, -1)
                X_pred_scaled = self.scaler.transform(X_pred)
                
                # Make prediction
                prediction = self.model.predict(X_pred_scaled)[0]
                
                # Store prediction
                temp_df.loc[current_idx, f'{target_col}_forecast'] = prediction
                
                # Create forecast entry
                forecast_entry = {
                    'date': future_dates[i].strftime('%Y-%m-%d'),
                    'forecasted_cost': prediction,
                    'lower_bound': prediction * 0.9,  # Simplified confidence interval
                    'upper_bound': prediction * 1.1   # Simplified confidence interval
                }
                
                # Add cloud provider and service if available
                if 'cloud_provider' in df.columns:
                    forecast_entry['cloud_provider'] = latest_provider
                
                if 'service' in df.columns:
                    forecast_entry['service'] = latest_service
                
                forecasted_costs.append(forecast_entry)
            except Exception as e:
                # Handle missing features
                forecast_entry = {
                    'date': future_dates[i].strftime('%Y-%m-%d'),
                    'forecasted_cost': temp_df.loc[current_idx-1, target_col] if current_idx-1 < len(df) else temp_df.loc[current_idx-1, f'{target_col}_forecast'],
                    'lower_bound': None,
                    'upper_bound': None
                }
                forecasted_costs.append(forecast_entry)
        
        return forecasted_costs
    
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
    
    # Base cost with seasonal patterns
    base_cost = 1000.0
    
    # Create date range
    date_range = [start_date + timedelta(days=i) for i in range(days)]
    
    # Generate cost data with patterns
    cost_data = []
    
    for i, date in enumerate(date_range):
        # Day of week pattern (higher on weekdays)
        dow_factor = 1.0 if date.weekday() < 5 else 0.7
        
        # Monthly pattern (higher at month end)
        monthly_factor = 1.0 + (0.2 if date.day > 25 else 0.0)
        
        # Quarterly pattern (increasing each quarter)
        quarter = (date.month - 1) // 3 + 1
        quarterly_growth = 1.0 + (quarter - 1) * 0.05
        
        # Yearly seasonal pattern (higher in Q4)
        seasonal_factor = 1.0 + (0.1 if quarter == 4 else 0.0)
        
        # Linear growth trend
        trend = 1.0 + (i / days) * 0.2
        
        # Random variation
        random_factor = np.random.normal(1.0, 0.05)
        
        # Calculate daily cost
        daily_cost = base_cost * dow_factor * monthly_factor * quarterly_growth * seasonal_factor * trend * random_factor
        
        cost_entry = {
            'date': date.strftime('%Y-%m-%d'),
            'daily_cost': daily_cost,
            'service': 'EC2',
            'cloud_provider': 'AWS'
        }
        
        cost_data.append(cost_entry)
    
    return cost_data

def run_forecasting_test():
    """Run a test of the cost forecasting model with mock data."""
    # Generate mock data
    cost_data = generate_mock_cost_data(180)  # 6 months of data
    
    # Create and train the model
    forecaster = CostForecaster()
    forecaster.train(cost_data)
    
    # Generate forecast for next 30 days
    forecast = forecaster.forecast(cost_data, days_to_forecast=30)
    
    # Print forecast
    print(f"Generated forecast for next 30 days:")
    for i, day in enumerate(forecast[:5]):  # Print first 5 days
        print(f"Date: {day['date']}, Forecasted cost: ${day['forecasted_cost']:.2f} (${day['lower_bound']:.2f} - ${day['upper_bound']:.2f})")
    print("...")
    for i, day in enumerate(forecast[-5:]):  # Print last 5 days
        print(f"Date: {day['date']}, Forecasted cost: ${day['forecasted_cost']:.2f} (${day['lower_bound']:.2f} - ${day['upper_bound']:.2f})")
    
if __name__ == "__main__":
    run_forecasting_test() 