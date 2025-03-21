import React, { useState, useEffect } from 'react';
// Existing imports...
import CostForecast from '../components/CostForecast';
import { getForecast } from '../services/api';

const CostAnalysis: React.FC = () => {
  // Existing state variables...
  const [forecastData, setForecastData] = useState<any>(null);
  const [isLoadingForecast, setIsLoadingForecast] = useState<boolean>(false);

  // Existing useEffect and functions...

  // Fetch forecast when time range or provider changes
  useEffect(() => {
    if (timeSeriesData?.series) {
      loadForecastData();
    }
  }, [timeRange, provider]);

  const loadForecastData = async () => {
    try {
      setIsLoadingForecast(true);
      
      // Convert time series data to format expected by API
      const costData = timeSeriesData.timestamps.map((timestamp, index) => {
        // Sum values across all series for the total cost
        const totalCost = timeSeriesData.series.reduce(
          (sum, series) => sum + series.data[index], 0
        );
        
        return {
          date: timestamp,
          daily_cost: totalCost,
          service: 'All',
          cloud_provider: provider === 'all' ? 'All' : provider
        };
      });
      
      const forecastDays = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const response = await getForecast(costData, forecastDays);
      setForecastData(response.data.forecast);
      setIsLoadingForecast(false);
    } catch (error) {
      console.error('Error loading forecast data:', error);
      setIsLoadingForecast(false);
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Existing code */}
      
      {/* Add AI forecast after time series chart */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12}>
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

export default CostAnalysis;