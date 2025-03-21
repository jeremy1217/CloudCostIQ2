import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography
} from '@mui/material';
import CostForecast from '../components/CostForecast';
import { getForecast } from '../services/api';

interface TimeSeriesData {
  timestamps: string[];
  series: Array<{
    name: string;
    data: number[];
  }>;
}

const CostAnalysis: React.FC = () => {
  // Define required state variables that were causing errors
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData | null>(null);
  const [timeRange, setTimeRange] = useState<string>('30d');
  const [provider, setProvider] = useState<string>('all');
  const [forecastData, setForecastData] = useState<any>(null);
  const [isLoadingForecast, setIsLoadingForecast] = useState<boolean>(false);

  // Sample data to simulate API response
  useEffect(() => {
    // This would be replaced with an API call in production
    // For now we'll simulate loading some time series data
    setTimeout(() => {
      setTimeSeriesData({
        timestamps: [
          '2024-02-20', '2024-02-21', '2024-02-22', '2024-02-23', '2024-02-24',
          '2024-02-25', '2024-02-26', '2024-02-27', '2024-02-28', '2024-02-29',
          '2024-03-01', '2024-03-02', '2024-03-03', '2024-03-04', '2024-03-05',
          '2024-03-06', '2024-03-07', '2024-03-08', '2024-03-09', '2024-03-10'
        ],
        series: [
          {
            name: 'AWS',
            data: [1200, 1250, 1300, 1350, 1380, 1400, 1420, 1450, 1470, 1500, 
                   1520, 1550, 1570, 1600, 1650, 1680, 1700, 1720, 1750, 1780]
          },
          {
            name: 'Azure',
            data: [980, 990, 1010, 1030, 1050, 1080, 1100, 1120, 1130, 1150,
                   1170, 1190, 1210, 1230, 1240, 1260, 1280, 1300, 1320, 1340]
          },
          {
            name: 'GCP',
            data: [520, 530, 540, 550, 560, 580, 590, 600, 610, 620,
                   630, 640, 650, 660, 670, 680, 690, 700, 710, 720]
          }
        ]
      });
    }, 1000);
  }, []);

  // Fetch forecast when time range or provider changes
  useEffect(() => {
    if (timeSeriesData?.series) {
      loadForecastData();
    }
  }, [timeRange, provider, timeSeriesData]);

  const loadForecastData = async () => {
    try {
      setIsLoadingForecast(true);
      
      if (!timeSeriesData) return;
      
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
      
      try {
        const response = await getForecast(costData, forecastDays);
        setForecastData(response.data.forecast);
      } catch (error) {
        console.error('API error:', error);
        // Fallback: Create mock forecast data if API fails
        createMockForecastData(costData, forecastDays);
      }
      
      setIsLoadingForecast(false);
    } catch (error) {
      console.error('Error loading forecast data:', error);
      setIsLoadingForecast(false);
    }
  };
  
  // Function to create mock forecast data when API is not available
  const createMockForecastData = (costData: any[], days: number) => {
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
    
    for (let i = 1; i <= days; i++) {
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

  // UI filter handlers
  const handleTimeRangeChange = (newRange: string) => {
    setTimeRange(newRange);
  };
  
  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Cost Analysis
      </Typography>
      
      {/* Placeholder for filters and time series chart */}
      <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Time series data visualization would go here
        </Typography>
      </Box>
      
      {/* AI forecast after time series chart */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12}>
          <CostForecast 
            forecastData={forecastData}
            isLoading={isLoadingForecast}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default CostAnalysis;