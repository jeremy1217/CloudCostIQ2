import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Stack,
  Divider,
  Paper,
  SelectChangeEvent
} from '@mui/material';
import CostForecast from '../components/CostForecast';
import OptimizationRecommendations from '../components/OptimizationRecommendations';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { getCostAnalysis, getForecast } from '../services/api';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface TimeSeriesData {
  timestamps: string[];
  series: Array<{
    name: string;
    data: number[];
  }>;
}

interface CostSummary {
  total_cost: number;
  cost_by_provider: Record<string, number>;
  cost_by_service: Record<string, number>;
  time_series: TimeSeriesData;
}

const CostAnalysis = () => {
  // State variables
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData | null>(null);
  const [timeRange, setTimeRange] = useState<string>('30d');
  const [provider, setProvider] = useState<string>('all');
  const [service, setService] = useState<string>('all');
  const [groupBy, setGroupBy] = useState<string>('provider');
  const [forecastData, setForecastData] = useState<any>(null);
  const [isLoadingForecast, setIsLoadingForecast] = useState<boolean>(false);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [costSummary, setCostSummary] = useState<CostSummary | null>(null);
  const [optimizationData, setOptimizationData] = useState<any>(null);
  const [isLoadingOptimization, setIsLoadingOptimization] = useState<boolean>(false);

  // Fetch cost data when filters change
  useEffect(() => {
    fetchCostData();
  }, [timeRange, provider, service, groupBy]);

  // Fetch forecast when time range or provider changes
  useEffect(() => {
    if (timeSeriesData?.series) {
      loadForecastData();
      // Load optimization data when time series data is available
      loadOptimizationData();
    }
  }, [timeRange, provider, timeSeriesData]);

  const fetchCostData = async () => {
    try {
      setIsLoadingData(true);
      
      const queryParams = {
        time_range: timeRange,
        provider: provider,
        service: service,
        group_by: groupBy
      };
      
      const response = await getCostAnalysis(queryParams);
      setCostSummary(response.data);
      setTimeSeriesData(response.data.time_series);
      
      setIsLoadingData(false);
    } catch (error) {
      console.error('Error fetching cost data:', error);
      setIsLoadingData(false);
      
      // Set fallback data if API fails
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
    }
  };

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
          service: service === 'all' ? 'All' : service,
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

  const loadOptimizationData = async () => {
    try {
      setIsLoadingOptimization(true);
      
      // Mock optimization data for now
      // In a real implementation, this would call an API
      setTimeout(() => {
        setOptimizationData({
          estimated_monthly_savings: 12500,
          optimization_score: 68,
          optimizations: {
            idle_resources: [
              {
                resource_id: 'i-0a1b2c3d4e5f6g7h8',
                resource_type: 'EC2 Instance',
                region: 'us-east-1',
                account_id: 'main-account',
                idle_days: 45,
                monthly_cost: 320,
                cpu_utilization: 2,
                memory_utilization: 5,
                network_utilization: 1
              },
              {
                resource_id: 'vol-0a1b2c3d4e5f6g7h8',
                resource_type: 'EBS Volume',
                region: 'us-east-1',
                account_id: 'main-account',
                idle_days: 60,
                monthly_cost: 85,
                cpu_utilization: 0,
                memory_utilization: 0,
                network_utilization: 0
              }
            ],
            underutilized_resources: [
              {
                resource_id: 'i-1a2b3c4d5e6f7g8h9',
                resource_type: 'EC2 Instance',
                region: 'us-west-2',
                account_id: 'dev-account',
                current_size: 'm5.2xlarge',
                recommended_size: 'm5.large',
                potential_savings: 210,
                cpu_utilization: 15,
                memory_utilization: 22,
                network_utilization: 8
              },
              {
                resource_id: 'rds-1a2b3c4d5e6f',
                resource_type: 'RDS Instance',
                region: 'eu-west-1',
                account_id: 'prod-account',
                current_size: 'db.r5.xlarge',
                recommended_size: 'db.r5.large',
                potential_savings: 180,
                cpu_utilization: 18,
                memory_utilization: 25,
                network_utilization: 12
              }
            ],
            workload_classification: {
              workload_profiles: [
                { id: 'wp1', name: 'Batch Processing', count: 12 },
                { id: 'wp2', name: 'Web Application', count: 8 }
              ]
            },
            instance_recommendations: {
              count: 15,
              total_savings: 2800
            },
            reservations: {
              comparison: {
                recommendation: 'Convert 65% of on-demand to Reserved Instances',
                savings: 4200
              }
            },
            autoscaling: {
              scaling_type: 'Predictive Auto-scaling',
              savings: 1850
            }
          }
        });
        setIsLoadingOptimization(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error loading optimization data:', error);
      setIsLoadingOptimization(false);
    }
  };
  
  const handleApplyRecommendation = (id: string) => {
    console.log(`Applying recommendation: ${id}`);
    // In a real app, this would call an API to apply the recommendation
    // For now, we'll just show an alert
    alert(`Recommendation ${id} applied successfully!`);
  };

  // UI filter handlers
  const handleTimeRangeChange = (newRange: string) => {
    setTimeRange(newRange);
  };
  
  const handleProviderChange = (event: SelectChangeEvent) => {
    setProvider(event.target.value);
  };
  
  const handleServiceChange = (event: SelectChangeEvent) => {
    setService(event.target.value);
  };
  
  const handleGroupByChange = (
    _event: React.MouseEvent<HTMLElement>,
    newGroupBy: string | null
  ) => {
    if (newGroupBy !== null) {
      setGroupBy(newGroupBy);
    }
  };

  // Prepare chart data from timeSeriesData
  const timeSeriesChartData = {
    labels: timeSeriesData?.timestamps || [],
    datasets: timeSeriesData?.series.map((series, index) => {
      // Different colors for different providers/services
      const colors = [
        { stroke: 'rgb(75, 192, 192)', fill: 'rgba(75, 192, 192, 0.2)' },
        { stroke: 'rgb(54, 162, 235)', fill: 'rgba(54, 162, 235, 0.2)' },
        { stroke: 'rgb(255, 99, 132)', fill: 'rgba(255, 99, 132, 0.2)' },
        { stroke: 'rgb(255, 159, 64)', fill: 'rgba(255, 159, 64, 0.2)' },
        { stroke: 'rgb(153, 102, 255)', fill: 'rgba(153, 102, 255, 0.2)' }
      ];
      
      const colorSet = colors[index % colors.length];
      
      return {
        label: series.name,
        data: series.data,
        borderColor: colorSet.stroke,
        backgroundColor: colorSet.fill,
        tension: 0.2,
        fill: true
      };
    }) || []
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: $${context.raw.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return `$${value}`;
          }
        },
        title: {
          display: true,
          text: 'Cost ($)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    }
  };

  // Generate summary cards data
  const generateSummaryCards = () => {
    if (!costSummary) return null;
    
    const totalCost = costSummary.total_cost;
    
    // Find provider with highest cost
    let highestProvider = '';
    let highestProviderCost = 0;
    Object.entries(costSummary.cost_by_provider).forEach(([provider, cost]) => {
      if (cost > highestProviderCost) {
        highestProvider = provider;
        highestProviderCost = cost;
      }
    });
    
    // Find service with highest cost
    let highestService = '';
    let highestServiceCost = 0;
    Object.entries(costSummary.cost_by_service).forEach(([service, cost]) => {
      if (cost > highestServiceCost) {
        highestService = service;
        highestServiceCost = cost;
      }
    });
    
    return (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div">
                Total Cost
              </Typography>
              <Typography variant="h4" component="div" color="primary" sx={{ mt: 2 }}>
                ${totalCost.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {timeRange === '7d' ? 'Last 7 days' : timeRange === '30d' ? 'Last 30 days' : 'Last 90 days'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div">
                Highest Cost Provider
              </Typography>
              <Typography variant="h4" component="div" color="primary" sx={{ mt: 2 }}>
                {highestProvider}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ${highestProviderCost.toLocaleString()} ({Math.round(highestProviderCost / totalCost * 100)}% of total)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div">
                Highest Cost Service
              </Typography>
              <Typography variant="h4" component="div" color="primary" sx={{ mt: 2 }}>
                {highestService}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ${highestServiceCost.toLocaleString()} ({Math.round(highestServiceCost / totalCost * 100)}% of total)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Cost Analysis
      </Typography>
      
      {/* Filters section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ minWidth: '80px' }}>Time Range:</Typography>
          <ToggleButtonGroup
            value={timeRange}
            exclusive
            onChange={(_e, value) => value && handleTimeRangeChange(value)}
            aria-label="time range"
            size="small"
          >
            <ToggleButton value="7d" aria-label="7 days">
              7d
            </ToggleButton>
            <ToggleButton value="30d" aria-label="30 days">
              30d
            </ToggleButton>
            <ToggleButton value="90d" aria-label="90 days">
              90d
            </ToggleButton>
          </ToggleButtonGroup>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
          
          <FormControl variant="outlined" size="small" sx={{ m: 1, minWidth: 120 }}>
            <InputLabel id="provider-label">Provider</InputLabel>
            <Select
              labelId="provider-label"
              id="provider-select"
              value={provider}
              onChange={handleProviderChange}
              label="Provider"
            >
              <MenuItem value="all">All Providers</MenuItem>
              <MenuItem value="aws">AWS</MenuItem>
              <MenuItem value="azure">Azure</MenuItem>
              <MenuItem value="gcp">GCP</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl variant="outlined" size="small" sx={{ m: 1, minWidth: 120 }}>
            <InputLabel id="service-label">Service</InputLabel>
            <Select
              labelId="service-label"
              id="service-select"
              value={service}
              onChange={handleServiceChange}
              label="Service"
            >
              <MenuItem value="all">All Services</MenuItem>
              <MenuItem value="compute">Compute</MenuItem>
              <MenuItem value="storage">Storage</MenuItem>
              <MenuItem value="database">Database</MenuItem>
              <MenuItem value="network">Network</MenuItem>
            </Select>
          </FormControl>
        </Stack>
        
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <Typography variant="subtitle1" sx={{ minWidth: '80px' }}>Group By:</Typography>
          <ToggleButtonGroup
            value={groupBy}
            exclusive
            onChange={handleGroupByChange}
            aria-label="group by"
            size="small"
          >
            <ToggleButton value="provider" aria-label="provider">
              Provider
            </ToggleButton>
            <ToggleButton value="service" aria-label="service">
              Service
            </ToggleButton>
            <ToggleButton value="account" aria-label="account">
              Account
            </ToggleButton>
            <ToggleButton value="region" aria-label="region">
              Region
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Paper>
      
      {/* Summary Cards */}
      {generateSummaryCards()}
      
      {/* Time Series Chart */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Cost Trend</Typography>
          <Box sx={{ height: 400 }}>
            {isLoadingData ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography>Loading data...</Typography>
              </Box>
            ) : timeSeriesData ? (
              <Line options={chartOptions} data={timeSeriesChartData} />
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography>No data available</Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
      
      {/* AI forecast and optimization recommendations */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={6}>
          <CostForecast 
            forecastData={forecastData}
            isLoading={isLoadingForecast}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <OptimizationRecommendations
            optimizationData={optimizationData}
            isLoading={isLoadingOptimization}
            onApplyRecommendation={handleApplyRecommendation}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default CostAnalysis;