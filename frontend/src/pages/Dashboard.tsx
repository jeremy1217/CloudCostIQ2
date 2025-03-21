import React, { useState, useEffect } from 'react';
// Existing imports...
import AnomalyDetection from '../components/AnomalyDetection';
import CostForecast from '../components/CostForecast';
import { detectAnomalies, getForecast } from '../services/api';

const Dashboard: React.FC = () => {
  // Existing state variables...
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [forecastData, setForecastData] = useState<any>(null);
  const [isLoadingAnomalies, setIsLoadingAnomalies] = useState<boolean>(false);
  const [isLoadingForecast, setIsLoadingForecast] = useState<boolean>(false);

  // Existing useEffect...

  // New useEffect for AI data
  useEffect(() => {
    // Load AI-powered insights when dashboard data is loaded
    if (dashboardData) {
      loadAIInsights();
    }
  }, [dashboardData]);

  const loadAIInsights = async () => {
    try {
      // Convert dashboardData.costTrend to format expected by API
      const costData = dashboardData?.costTrend?.datasets?.[0]?.data.map((cost, index) => ({
        date: dashboardData.costTrend.labels[index],
        daily_cost: cost,
        service: 'All',
        cloud_provider: 'All'
      })) || [];

      // Load anomalies
      setIsLoadingAnomalies(true);
      const anomalyResponse = await detectAnomalies(costData);
      setAnomalies(anomalyResponse.data.anomalies || []);
      setIsLoadingAnomalies(false);

      // Load forecast
      setIsLoadingForecast(true);
      const forecastResponse = await getForecast(costData, 30);
      setForecastData(forecastResponse.data.forecast || null);
      setIsLoadingForecast(false);
    } catch (error) {
      console.error('Error loading AI insights:', error);
      setIsLoadingAnomalies(false);
      setIsLoadingForecast(false);
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Existing code */}
      
      {/* Add AI-powered insights */}
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
      
      {/* Remaining existing code */}
    </Box>
  );
};

export default Dashboard;