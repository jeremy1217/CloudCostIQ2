// Update the CostForecast.tsx component to fix chart configuration

import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  SelectChangeEvent,
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

// Register required Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface CostForecastProps {
  forecastData: any;
  isLoading?: boolean;
}

const CostForecast: React.FC<CostForecastProps> = ({ forecastData, isLoading = false }) => {
  const [forecastPeriod, setForecastPeriod] = React.useState('30');

  const handlePeriodChange = (event: SelectChangeEvent) => {
    setForecastPeriod(event.target.value);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6">Cost Forecast</Typography>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Typography>Loading forecast...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!forecastData || !forecastData.forecast_values) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6">Cost Forecast</Typography>
          <Box sx={{ mt: 2 }}>
            <Typography>No forecast data available.</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data with correct configuration for Chart.js
  const chartData = {
    labels: forecastData.forecast_dates || [],
    datasets: [
      {
        label: 'Forecast',
        data: forecastData.forecast_values || [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.2,
      }
    ]
  };

  // Add confidence intervals if available
  if (forecastData.lower_bound && forecastData.upper_bound) {
    chartData.datasets.push({
      label: 'Upper Bound',
      data: forecastData.upper_bound,
      borderColor: 'rgba(75, 192, 192, 0.3)',
      backgroundColor: 'rgba(75, 192, 192, 0.1)',
      tension: 0.2,
      fill: '+1',
      // Use the entire object type assertion to include borderDash
    } as any);
    
    // And similarly for the lower bound dataset:
    chartData.datasets.push({
      label: 'Lower Bound',
      data: forecastData.lower_bound,
      borderColor: 'rgba(75, 192, 192, 0.3)',
      backgroundColor: 'rgba(75, 192, 192, 0.1)',
      tension: 0.2,
      fill: false,
      // Use the entire object type assertion
    } as any);
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `$${context.raw.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: function(value: any) {
            return `$${value}`;
          }
        }
      }
    }
  };

  return (
    <Card>
      <CardHeader 
        title="Cost Forecast"
        action={
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Forecast Period</InputLabel>
            <Select
              value={forecastPeriod}
              label="Forecast Period"
              onChange={handlePeriodChange}
            >
              <MenuItem value="7">7 Days</MenuItem>
              <MenuItem value="30">30 Days</MenuItem>
              <MenuItem value="90">90 Days</MenuItem>
            </Select>
          </FormControl>
        }
      />
      <CardContent>
        <Box sx={{ height: 300 }}>
          <Line options={chartOptions} data={chartData} />
        </Box>
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2">AI-Powered Forecast</Typography>
          <Typography variant="body2" color="text.secondary">
            Forecast based on historical cost patterns and seasonal trends.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CostForecast;