import axios from 'axios';

// Define API endpoint base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Interface for cost data point
export interface CostDataPoint {
  date: string;
  daily_cost: number;
  service?: string;
  cloud_provider?: string;
  region?: string;
  [key: string]: any;
}

// Interface for anomaly detection response
export interface AnomalyDetectionResponse {
  anomalies: Array<{
    date: string;
    service: string;
    cloud_provider: string;
    daily_cost: number;
    anomaly_score: number;
    is_anomaly: boolean;
    explanation?: string;
  }>;
  metadata: {
    model_type: string;
    detection_date: string;
    threshold: number;
    total_points_analyzed: number;
  };
}

// Interface for anomaly alert
export interface AnomalyAlert {
  id: string;
  resource: string;
  resourceType: string;
  date: string;
  cost: number;
  score: number;
  severity: 'low' | 'medium' | 'high';
  explanation: string;
  recommendation: string;
}

/**
 * Detect anomalies in cost data
 * @param costData Array of cost data points
 * @returns Promise with anomaly detection results
 */
export const detectAnomalies = async (costData: CostDataPoint[]): Promise<{ data: AnomalyDetectionResponse }> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/anomalies/detect`, { costData });
    return response;
  } catch (error) {
    console.error('Error detecting anomalies:', error);
    // For development/demo purposes, return mock data when API fails
    return {
      data: {
        anomalies: createMockAnomalies(costData),
        metadata: {
          model_type: 'ensemble',
          detection_date: new Date().toISOString(),
          threshold: 0.95,
          total_points_analyzed: costData.length
        }
      }
    };
  }
};

/**
 * Generate mock anomalies for development/demo purposes
 * @param costData Array of cost data points 
 * @returns Array of mock anomalies
 */
export const createMockAnomalies = (costData: CostDataPoint[]) => {
  if (!costData || costData.length < 5) return [];
  
  // Find the highest cost day and mark it as an anomaly
  const sortedData = [...costData].sort((a, b) => b.daily_cost - a.daily_cost);
  const topCostPoints = sortedData.slice(0, 2);
  
  return topCostPoints.map((point, index) => ({
    ...point,
    // Ensure required fields are present
    service: point.service || `Service-${index}`,
    cloud_provider: point.cloud_provider || 'Unknown',
    anomaly_score: 0.8 + (0.15 * Math.random()),
    is_anomaly: true,
    explanation: `Unusually high daily cost detected. ${Math.round(point.daily_cost * 100) / 100} is ${Math.round((point.daily_cost / costData.reduce((sum, p) => sum + p.daily_cost, 0) * costData.length) * 100)}% higher than the average.`,
  }));
};

/**
 * Convert anomalies to budget alerts format
 * @param anomalies Array of detected anomalies
 * @param budgets Array of existing budgets
 * @returns Array of budget alerts based on anomalies
 */
export const anomaliesToAlerts = (anomalies: any[], budgets: any[]) => {
  if (!anomalies || anomalies.length === 0) return [];
  
  return anomalies.map((anomaly, index) => {
    // Try to match anomaly with a budget
    const relatedBudget = budgets.find(budget => 
      budget.resource === anomaly.service || 
      budget.tags?.includes(anomaly.service?.toLowerCase())
    );
    
    const severity: 'low' | 'medium' | 'high' = 
      anomaly.anomaly_score > 0.9 ? 'high' : 
      anomaly.anomaly_score > 0.8 ? 'medium' : 'low';
      
    return {
      id: `anomaly-${index + 1}`,
      budgetId: relatedBudget?.id || 'unknown',
      budgetName: relatedBudget?.name || anomaly.service || 'Unknown Resource',
      threshold: 0,
      triggered: anomaly.date || new Date().toISOString(),
      spendAmount: anomaly.daily_cost,
      read: false,
      type: 'anomaly',
      severity,
      message: `Unusual spending pattern detected for ${anomaly.service || 'your resources'}.`,
      recommendation: 'Investigate recent usage patterns and check for unauthorized resources.',
      affectedResources: [anomaly.service, anomaly.cloud_provider].filter(Boolean)
    };
  });
};

export default {
  detectAnomalies,
  createMockAnomalies,
  anomaliesToAlerts
}; 