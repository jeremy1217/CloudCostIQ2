// src/hooks/useMockData.ts - Hook for accessing mock data

import { useState, useEffect } from 'react';
import mockDataService from '../services/mockData';

/**
 * Custom hook to access the mock data service
 * @param options - Options to control loading behavior
 * @returns Mock data and loading states
 */
export const useMockData = (options: {
  fetchResources?: boolean;
  fetchCostData?: boolean;
  fetchUtilization?: boolean;
  fetchAnomalies?: boolean;
  fetchBudgets?: boolean;
  fetchOptimization?: boolean;
  fetchForecast?: boolean;
  daysForForecast?: number;
  daysForTimeSeries?: number;
  timeSeriesGroupBy?: 'provider' | 'service' | 'daily';
  simulateLoading?: boolean;
} = {}) => {
  // Default options
  const {
    fetchResources = false,
    fetchCostData = false,
    fetchUtilization = false,
    fetchAnomalies = false,
    fetchBudgets = false,
    fetchOptimization = false,
    fetchForecast = false,
    daysForForecast = 30,
    daysForTimeSeries = 30,
    timeSeriesGroupBy = 'provider',
    simulateLoading = true
  } = options;

  // State for each data type
  const [resources, setResources] = useState<any[]>([]);
  const [costData, setCostData] = useState<any[]>([]);
  const [utilization, setUtilization] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [optimization, setOptimization] = useState<any>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [timeSeries, setTimeSeries] = useState<any>(null);
  const [costByProvider, setCostByProvider] = useState<Record<string, number>>({});
  const [costByService, setCostByService] = useState<Record<string, number>>({});

  // Loading states
  const [isLoadingResources, setIsLoadingResources] = useState<boolean>(false);
  const [isLoadingCostData, setIsLoadingCostData] = useState<boolean>(false);
  const [isLoadingUtilization, setIsLoadingUtilization] = useState<boolean>(false);
  const [isLoadingAnomalies, setIsLoadingAnomalies] = useState<boolean>(false);
  const [isLoadingBudgets, setIsLoadingBudgets] = useState<boolean>(false);
  const [isLoadingOptimization, setIsLoadingOptimization] = useState<boolean>(false);
  const [isLoadingForecast, setIsLoadingForecast] = useState<boolean>(false);
  const [isLoadingTimeSeries, setIsLoadingTimeSeries] = useState<boolean>(false);

  // Function to simulate loading delay
  const loadWithDelay = <T>(setter: (data: T) => void, data: T, setLoading: (loading: boolean) => void): void => {
    setLoading(true);
    
    if (simulateLoading) {
      // Simulate network delay
      setTimeout(() => {
        setter(data);
        setLoading(false);
      }, 800 + Math.random() * 1200); // Random delay between 800-2000ms
    } else {
      setter(data);
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    if (fetchResources) {
      loadWithDelay(setResources, mockDataService.getResources(), setIsLoadingResources);
    }
    
    if (fetchCostData) {
      loadWithDelay(setCostData, mockDataService.getCostData(), setIsLoadingCostData);
      loadWithDelay(setCostByProvider, mockDataService.getCostByProvider(), setIsLoadingCostData);
      loadWithDelay(setCostByService, mockDataService.getCostByService(), setIsLoadingCostData);
      loadWithDelay(
        setTimeSeries, 
        mockDataService.getCostTimeSeries(daysForTimeSeries, timeSeriesGroupBy), 
        setIsLoadingTimeSeries
      );
    }
    
    if (fetchUtilization) {
      loadWithDelay(setUtilization, mockDataService.getUtilizationData(), setIsLoadingUtilization);
    }
    
    if (fetchAnomalies) {
      loadWithDelay(setAnomalies, mockDataService.getAnomalies(), setIsLoadingAnomalies);
    }
    
    if (fetchBudgets) {
      loadWithDelay(setBudgets, mockDataService.getBudgets(), setIsLoadingBudgets);
    }
    
    if (fetchOptimization) {
      loadWithDelay(setOptimization, mockDataService.getOptimizationData(), setIsLoadingOptimization);
    }
    
    if (fetchForecast) {
      loadWithDelay(setForecast, mockDataService.generateForecastData(mockDataService.getCostData(), daysForForecast), setIsLoadingForecast);
    }
  }, [
    fetchResources, 
    fetchCostData, 
    fetchUtilization, 
    fetchAnomalies, 
    fetchBudgets, 
    fetchOptimization, 
    fetchForecast,
    daysForForecast,
    daysForTimeSeries,
    timeSeriesGroupBy
  ]);

  return {
    // Data
    resources,
    costData,
    utilization,
    anomalies,
    budgets,
    optimization,
    forecast,
    timeSeries,
    costByProvider,
    costByService,
    
    // Loading states
    isLoadingResources,
    isLoadingCostData,
    isLoadingUtilization,
    isLoadingAnomalies,
    isLoadingBudgets,
    isLoadingOptimization,
    isLoadingForecast,
    isLoadingTimeSeries,
    
    // Service reference for direct access
    mockDataService
  };
};

export default useMockData;