// Import axios or whatever HTTP client you're using
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// Define types for the data structures
interface CostDataPoint {
  date: string;
  daily_cost: number;
  service?: string;
  cloud_provider?: string;
  [key: string]: any; // For any additional properties
}

interface UtilizationDataPoint {
  resource_id: string;
  timestamp: string;
  cpu_percent: number;
  memory_percent: number;
  [key: string]: any; // For any additional properties
}

interface UsageDataPoint {
  // Add relevant properties based on your data structure
  [key: string]: any;
}

// Response types for better type safety
interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
  config: any;
}

// Existing API methods...
// You can add your existing API methods here with proper type annotations

// AI features with proper type annotations
export const detectAnomalies = async (costData: CostDataPoint[]): Promise<ApiResponse<{
  anomalies: any[];
  count: number;
}>> => {
  return axios.post(`${API_BASE_URL}/cost-analysis/ai-anomalies`, { cost_data: costData });
};

export const getForecast = async (costData: CostDataPoint[], days: number = 30): Promise<ApiResponse<{
  forecast: {
    forecast_values: number[];
    forecast_dates: string[];
    lower_bound?: number[];
    upper_bound?: number[];
    confidence_level?: number;
  }
}>> => {
  return axios.post(`${API_BASE_URL}/cost-analysis/ai-forecast`, { 
    cost_data: costData,
    forecast_days: days 
  });
};

export const getResourceOptimization = async (utilizationData: UtilizationDataPoint[], usageData: UsageDataPoint[]): Promise<ApiResponse<{
  optimization_results: any;
  estimated_savings: number;
  organization_id?: string;
}>> => {
  return axios.post(`${API_BASE_URL}/recommendations/ai-optimization`, {
    utilization_data: utilizationData,
    usage_data: usageData
  });
};