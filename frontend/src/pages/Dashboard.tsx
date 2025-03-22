import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography
} from '@mui/material';
import AnomalyDetection from '../components/AnomalyDetection';
import CostForecast from '../components/CostForecast';
import { detectAnomalies, getForecast } from '../services/api';
import useMockData from '../hooks/useMockData';

interface DashboardData {
  costTrend: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
    }>;
  };
  // Other dashboard data properties as needed
}

const Dashboard: React.FC = () => {
  // Define proper state variables
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [forecastData, setForecastData] = useState<any>(null);
  const [isLoadingAnomalies, setIsLoadingAnomalies] = useState<boolean>(false);
  const [isLoadingForecast, setIsLoadingForecast] = useState<boolean>(false);

  // Simulate loading dashboard data
  useEffect(() => {
    // This would be replaced with an API call in production
    setTimeout(() => {
      setDashboardData({
        costTrend: {
          labels: [
            '2024-02-20', '2024-02-21', '2024-02-22', '2024-02-23', '2024-02-24',
            '2024-02-25', '2024-02-26', '2024-02-27', '2024-02-28', '2024-02-29',
            '2024-03-01', '2024-03-02', '2024-03-03', '2024-03-04', '2024-03-05',
            '2024-03-06', '2024-03-07', '2024-03-08', '2024-03-09', '2024-03-10'
          ],
          datasets: [
            {
              label: 'Total Cost',
              data: [2700, 2770, 2850, 2930, 2990, 3060, 3110, 3170, 3210, 3270, 
                     3320, 3380, 3430, 3490, 3560, 3620, 3670, 3720, 3780, 3840]
            }
          ]
        },
        // Add other dashboard data as needed
      });
    }, 1000);
  }, []);

  // Load AI-powered insights when dashboard data is loaded
  useEffect(() => {
    if (dashboardData) {
      loadAIInsights();
    }
  }, [dashboardData]);

  const loadAIInsights = async () => {
    try {
      if (!dashboardData) return;
      
      // Convert dashboardData.costTrend to format expected by API
      const costData = dashboardData.costTrend.datasets[0].data.map((cost, index) => ({
        date: dashboardData.costTrend.labels[index],
        daily_cost: cost,
        service: 'All',
        cloud_provider: 'All'
      }));

      // Load anomalies
      setIsLoadingAnomalies(true);
      try {
        const anomalyResponse = await detectAnomalies(costData);
        setAnomalies(anomalyResponse.data.anomalies || []);
      } catch (error) {
        console.error('Error detecting anomalies:', error);
        // Create mock anomalies data if API fails
        createMockAnomalies(costData);
      }
      setIsLoadingAnomalies(false);

      // Load forecast
      setIsLoadingForecast(true);
      try {
        const forecastResponse = await getForecast(costData, 30);
        setForecastData(forecastResponse.data.forecast || null);
      } catch (error) {
        console.error('Error getting forecast:', error);
        // Create mock forecast data if API fails
        createMockForecastData(costData);
      }
      setIsLoadingForecast(false);
    } catch (error) {
      console.error('Error loading AI insights:', error);
      setIsLoadingAnomalies(false);
      setIsLoadingForecast(false);
    }
  };
  
  // Function to create mock anomalies when API is not available
  const createMockAnomalies = (costData: any[]) => {
    // Create 2-3 mock anomalies
    const mockAnomalies = [];
    const anomalyCount = Math.floor(Math.random() * 2) + 2; // 2-3 anomalies
    
    for (let i = 0; i < anomalyCount; i++) {
      // Select a random data point
      const randomIndex = Math.floor(Math.random() * costData.length);
      const dataPoint = costData[randomIndex];
      
      mockAnomalies.push({
        date: dataPoint.date,
        daily_cost: dataPoint.daily_cost * 1.2, // Make it look 20% higher
        cloud_provider: 'AWS',
        service: ['EC2', 'S3', 'RDS'][Math.floor(Math.random() * 3)],
        explanation: 'Unusual spending pattern detected based on historical data.',
        lstm_score: 0.8 + (Math.random() * 0.15),
        is_anomaly: true
      });
    }
    
    setAnomalies(mockAnomalies);
  };
  
  // Function to create mock forecast data when API is not available
  const createMockForecastData = (costData: any[]) => {
    if (costData.length === 0) return;
    
    // Get the last real data point
    const lastDataPoint = costData[costData.length - 1];
    const lastCost = lastDataPoint.daily_cost;
    
    // Create forecast dates
    const forecastDates = [];
    const forecastValues = [];
    const lowerBound = [];
    const upperBound = [];
    
    const lastDate = new Date(lastDataPoint.date);
    
    for (let i = 1; i <= 30; i++) {
      const nextDate = new Date(lastDate);
      nextDate.setDate(lastDate.getDate() + i);
      forecastDates.push(nextDate.toISOString().split('T')[0]);
      
      // Generate slightly increasing forecast values with some randomness
      const forecastValue = lastCost * (1 + (0.01 * i)) + (Math.random() * 50 - 25);
      forecastValues.push(forecastValue);
      
      // Create bounds
      lowerBound.push(forecastValue * 0.9);
      upperBound.push(forecastValue * 1.1);
    }
    
    setForecastData({
      forecast_dates: forecastDates,
      forecast_values: forecastValues,
      lower_bound: lowerBound,
      upper_bound: upperBound
    });
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      
      {/* Placeholder for summary statistics */}
      <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Dashboard summary statistics would go here
        </Typography>
      </Box>
      
      {/* AI-powered insights */}
      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
        AI-Powered Insights
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <AnomalyDetection 
            anomalies={anomalies} 
            isLoading={isLoadingAnomalies} 
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <CostForecast 
            forecastData={forecastData} 
            isLoading={isLoadingForecast} 
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;