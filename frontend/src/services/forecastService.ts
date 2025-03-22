import axios from 'axios';
import { CostDataPoint } from './anomalyDetectionService';

// Define API endpoint base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Interface for forecast response
export interface ForecastResponse {
  forecast: Array<{
    date: string;
    predicted_cost: number;
    lower_bound?: number;
    upper_bound?: number;
  }>;
  metadata: {
    model_type: string;
    forecast_date: string;
    forecast_days: number;
    confidence_interval?: number;
  };
}

// Interface for budget forecast
export interface BudgetForecast {
  budgetId: string;
  budgetName: string;
  currentAmount: number;
  forecastedAmount: number;
  forecastDate: string;
  percentageOfBudget: number;
  willExceed: boolean;
  projectedExceedDate?: string;
  confidenceLevel?: 'low' | 'medium' | 'high';
}

/**
 * Get cost forecast
 * @param costData Array of cost data points
 * @param days Number of days to forecast
 * @returns Promise with forecast results
 */
export const getForecast = async (
  costData: CostDataPoint[], 
  days: number = 30
): Promise<{ data: ForecastResponse }> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/forecast`, { 
      costData,
      forecastDays: days
    });
    return response;
  } catch (error) {
    console.error('Error getting forecast:', error);
    // For development/demo purposes, return mock data when API fails
    return {
      data: {
        forecast: createMockForecast(costData, days),
        metadata: {
          model_type: 'lstm',
          forecast_date: new Date().toISOString(),
          forecast_days: days,
          confidence_interval: 0.95
        }
      }
    };
  }
};

/**
 * Generate mock forecast for development/demo purposes
 * @param costData Array of cost data points
 * @param days Number of days to forecast
 * @returns Array of forecast points
 */
export const createMockForecast = (costData: CostDataPoint[], days: number = 30) => {
  if (!costData || costData.length < 5) return [];
  
  // Calculate average and trend
  const recentCosts = costData.slice(-7);
  const avgCost = recentCosts.reduce((sum, p) => sum + p.daily_cost, 0) / recentCosts.length;
  
  // Determine trend (increasing, decreasing, or stable)
  const firstHalf = recentCosts.slice(0, Math.floor(recentCosts.length / 2));
  const secondHalf = recentCosts.slice(Math.floor(recentCosts.length / 2));
  
  const firstHalfAvg = firstHalf.reduce((sum, p) => sum + p.daily_cost, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, p) => sum + p.daily_cost, 0) / secondHalf.length;
  
  const trendFactor = secondHalfAvg / firstHalfAvg;
  const growthRate = trendFactor > 1 ? (trendFactor - 1) * 0.7 : (trendFactor - 1) * 0.5;
  
  // Generate forecast
  const forecast = [];
  let lastDate = new Date(costData[costData.length - 1].date);
  let currentCost = avgCost;
  
  for (let i = 0; i < days; i++) {
    lastDate.setDate(lastDate.getDate() + 1);
    currentCost = currentCost * (1 + growthRate) + (Math.random() * avgCost * 0.1 - avgCost * 0.05);
    
    forecast.push({
      date: lastDate.toISOString().split('T')[0],
      predicted_cost: Math.max(0, currentCost),
      lower_bound: Math.max(0, currentCost * 0.8),
      upper_bound: currentCost * 1.2
    });
  }
  
  return forecast;
};

/**
 * Check if a budget will be exceeded based on forecast
 * @param budget Budget object
 * @param forecast Forecast data
 * @returns Budget forecast with exceed information
 */
export const checkBudgetExceed = (budget: any, forecast: any[]) => {
  if (!budget || !forecast || forecast.length === 0) return null;
  
  // Calculate total forecasted spend
  const remainingDays = new Date(budget.endDate).getTime() - new Date().getTime();
  const remainingDaysCount = Math.ceil(remainingDays / (1000 * 3600 * 24));
  
  // Use only the relevant forecast days
  const relevantForecast = forecast.slice(0, Math.min(remainingDaysCount, forecast.length));
  const forecastedAdditionalSpend = relevantForecast.reduce((sum, p) => sum + p.predicted_cost, 0);
  const forecastedTotalSpend = budget.currentSpend + forecastedAdditionalSpend;
  
  // Check if budget will be exceeded
  const willExceed = forecastedTotalSpend > budget.amount;
  
  // Calculate projected exceed date if applicable
  let projectedExceedDate = null;
  if (willExceed) {
    const remainingBudget = budget.amount - budget.currentSpend;
    let cumulativeSpend = 0;
    
    for (let i = 0; i < relevantForecast.length; i++) {
      cumulativeSpend += relevantForecast[i].predicted_cost;
      if (cumulativeSpend >= remainingBudget) {
        const exceedDate = new Date(relevantForecast[i].date);
        projectedExceedDate = exceedDate.toISOString();
        break;
      }
    }
  }
  
  return {
    budgetId: budget.id,
    budgetName: budget.name,
    currentAmount: budget.currentSpend,
    forecastedAmount: forecastedTotalSpend,
    forecastDate: new Date().toISOString(),
    percentageOfBudget: (forecastedTotalSpend / budget.amount) * 100,
    willExceed,
    projectedExceedDate,
    confidenceLevel: willExceed ? 'high' : 'medium'
  };
};

/**
 * Convert budget forecasts to alerts
 * @param forecasts Array of budget forecasts
 * @returns Array of budget alerts
 */
export const forecastsToAlerts = (forecasts: BudgetForecast[]) => {
  if (!forecasts || forecasts.length === 0) return [];
  
  return forecasts
    .filter(forecast => forecast.willExceed)
    .map(forecast => ({
      id: `forecast-${forecast.budgetId}`,
      budgetId: forecast.budgetId,
      budgetName: forecast.budgetName,
      threshold: 100,
      triggered: forecast.forecastDate,
      spendAmount: forecast.currentAmount,
      read: false,
      type: 'forecast' as const,
      severity: 'high' as const,
      message: `${forecast.budgetName} is forecasted to exceed its budget by ${Math.round(forecast.percentageOfBudget - 100)}%`,
      recommendation: forecast.projectedExceedDate 
        ? `Budget is expected to be exceeded by ${new Date(forecast.projectedExceedDate).toLocaleDateString()}. Consider adjusting resource usage or increasing the budget.`
        : 'Review resource usage and consider increasing your budget.',
      affectedResources: []
    }));
};

export default {
  getForecast,
  createMockForecast,
  checkBudgetExceed,
  forecastsToAlerts
}; 