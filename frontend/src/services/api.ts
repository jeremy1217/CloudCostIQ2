// src/services/api.ts
import axios from 'axios';
import mockDataService from './mockData';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Enable/disable mock mode
const USE_MOCK_API = process.env.REACT_APP_USE_MOCK_API === 'true' || true;

// Define types for the data structures
export interface CostDataPoint {
  date: string;
  daily_cost: number;
  service?: string;
  cloud_provider?: string;
  [key: string]: any; // For any additional properties
}

export interface UtilizationDataPoint {
  resource_id: string;
  timestamp: string;
  cpu_percent: number;
  memory_percent: number;
  [key: string]: any; // For any additional properties
}

export interface UsageDataPoint {
  // Add relevant properties based on your data structure
  [key: string]: any;
}

// Response types for better type safety
export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
  config: any;
}

// Add a delay to mock responses to simulate network latency
const mockDelay = (ms = 800) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to create mock API responses
const createMockResponse = <T>(data: T): Promise<ApiResponse<T>> => {
  return mockDelay().then(() => ({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {}
  }));
};

// Function to determine if we should use mock data
const shouldUseMock = () => {
  return USE_MOCK_API;
};

// AI features with proper type annotations
export const detectAnomalies = async (costData: CostDataPoint[]): Promise<ApiResponse<{
  anomalies: any[];
  count: number;
}>> => {
  if (shouldUseMock()) {
    const anomalies = mockDataService.getAnomalies();
    
    return createMockResponse({
      anomalies: anomalies,
      count: anomalies.length
    });
  }
  
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
  if (shouldUseMock()) {
    const forecast = mockDataService.generateForecastData(costData, days);
    
    return createMockResponse({
      forecast
    });
  }
  
  return axios.post(`${API_BASE_URL}/cost-analysis/ai-forecast`, { 
    cost_data: costData,
    forecast_days: days 
  });
};

export const getResourceOptimization = async (utilizationData: UtilizationDataPoint[], usageData: UsageDataPoint[]): Promise<ApiResponse<{
  optimization_results: any;
  estimated_savings: number;
}>> => {
  if (shouldUseMock()) {
    const optimization = mockDataService.getOptimizationData();
    
    return createMockResponse({
      optimization_results: optimization,
      estimated_savings: optimization?.estimated_monthly_savings || 0
    });
  }
  
  return axios.post(`${API_BASE_URL}/recommendations/ai-optimization`, {
    utilization_data: utilizationData,
    usage_data: usageData
  });
};

// Get resources
export const getResources = async (queryParams?: any): Promise<ApiResponse<{
  resources: any[];
  total_count: number;
}>> => {
  if (shouldUseMock()) {
    const resources = mockDataService.getResources();
    
    return createMockResponse({
      resources,
      total_count: resources.length
    });
  }
  
  return axios.get(`${API_BASE_URL}/resources/inventory`, { params: queryParams });
};

// Get cost data/analysis
export const getCostAnalysis = async (queryParams?: any): Promise<ApiResponse<any>> => {
  if (shouldUseMock()) {
    const timeSeries = mockDataService.getCostTimeSeries(30, 'provider');
    const costByProvider = mockDataService.getCostByProvider();
    const costByService = mockDataService.getCostByService();
    
    const totalCost = Object.values(costByProvider).reduce((sum, cost) => sum + cost, 0);
    
    return createMockResponse({
      total_cost: totalCost,
      cost_by_provider: costByProvider,
      cost_by_service: costByService,
      time_series: timeSeries
    });
  }
  
  return axios.get(`${API_BASE_URL}/cost-analysis/dashboard-summary`, { params: queryParams });
};

// Get budgets
export const getBudgets = async (): Promise<ApiResponse<{
  budgets: any[];
}>> => {
  if (shouldUseMock()) {
    const budgets = mockDataService.getBudgets();
    
    return createMockResponse({
      budgets
    });
  }
  
  return axios.get(`${API_BASE_URL}/budgets`);
};

// Create budget
export const createBudget = async (budgetData: any): Promise<ApiResponse<{
  budget: any;
}>> => {
  if (shouldUseMock()) {
    // In a real app, we would add this to the mock data service
    return createMockResponse({
      budget: {
        id: `budget-${Date.now()}`,
        ...budgetData,
        createdAt: new Date().toISOString(),
        status: 'active'
      }
    });
  }
  
  return axios.post(`${API_BASE_URL}/budgets`, budgetData);
};

// Update budget
export const updateBudget = async (budgetId: string, budgetData: any): Promise<ApiResponse<{
  budget: any;
}>> => {
  if (shouldUseMock()) {
    return createMockResponse({
      budget: {
        id: budgetId,
        ...budgetData,
        lastUpdated: new Date().toISOString()
      }
    });
  }
  
  return axios.put(`${API_BASE_URL}/budgets/${budgetId}`, budgetData);
};

// Delete budget
export const deleteBudget = async (budgetId: string): Promise<ApiResponse<{
  success: boolean;
}>> => {
  if (shouldUseMock()) {
    return createMockResponse({
      success: true
    });
  }
  
  return axios.delete(`${API_BASE_URL}/budgets/${budgetId}`);
};

// Get utilization data for resources
export const getResourceUtilization = async (resourceId: string, queryParams?: any): Promise<ApiResponse<{
  resource_id: string;
  utilization: any[];
}>> => {
  if (shouldUseMock()) {
    const utilization = mockDataService.getUtilizationData()
      .filter(u => u.resource_id === resourceId);
    
    return createMockResponse({
      resource_id: resourceId,
      utilization
    });
  }
  
  return axios.get(`${API_BASE_URL}/resources/utilization/${resourceId}`, { params: queryParams });
};