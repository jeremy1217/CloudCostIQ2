// Import axios or whatever HTTP client you're using
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// Existing API methods...

// AI features
export const detectAnomalies = async (costData) => {
  return axios.post(`${API_BASE_URL}/cost-analysis/ai-anomalies`, { cost_data: costData });
};

export const getForecast = async (costData, days = 30) => {
  return axios.post(`${API_BASE_URL}/cost-analysis/ai-forecast`, { 
    cost_data: costData,
    forecast_days: days 
  });
};

export const getResourceOptimization = async (utilizationData, usageData) => {
  return axios.post(`${API_BASE_URL}/recommendations/ai-optimization`, {
    utilization_data: utilizationData,
    usage_data: usageData
  });
};