import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Button,
  IconButton,
  Paper,
  Chip,
  Tooltip
} from '@mui/material';
import {
  RefreshOutlined as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Equalizer as EqualizerIcon,
  CloudQueue as CloudIcon,
  Storage as StorageIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip as ChartTooltip, Legend, Filler } from 'chart.js';
import AnomalyDetection from '../components/AnomalyDetection';
import CostForecast from '../components/CostForecast';
import OptimizationRecommendations from '../components/OptimizationRecommendations';
import { detectAnomalies, getForecast, getResourceOptimization, getCostAnalysis } from '../services/api';

// Register required Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, ChartTooltip, Legend, Filler);

interface DashboardData {
  costTrend: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
    }>;
  };
  summaryMetrics?: {
    totalSpend: number;
    monthToDateSpend: number;
    forecastedSpend: number;
    changePercentage: number;
  };
  costByProvider?: Record<string, number>;
  costByService?: Record<string, number>;
}

const Dashboard: React.FC = () => {
  // Define proper state variables
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [forecastData, setForecastData] = useState<any>(null);
  const [optimizationData, setOptimizationData] = useState<any>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState<boolean>(false);
  const [isLoadingAnomalies, setIsLoadingAnomalies] = useState<boolean>(false);
  const [isLoadingForecast, setIsLoadingForecast] = useState<boolean>(false);
  const [isLoadingOptimization, setIsLoadingOptimization] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Load dashboard data on component mount and refresh
  useEffect(() => {
    loadDashboardData();
  }, [refreshTrigger]);

  // Load AI-powered insights when dashboard data is loaded
  useEffect(() => {
    if (dashboardData) {
      loadAIInsights();
    }
  }, [dashboardData]);

  const loadDashboardData = async () => {
    setIsLoadingDashboard(true);
    try {
      // In production this would be an API call
      const costAnalysisResponse = await getCostAnalysis({
        timeRange: '30d',
        granularity: 'day'
      });
      
      const costData = costAnalysisResponse.data;
      const timeSeries = costData.time_series || { timestamps: [], series: [] };
      
      // Calculate total month to date and change percentage
      const totalSpend = costData.total_cost || 0;
      const prevMonthSpend = totalSpend * 0.95; // Mocked previous month for comparison
      const changePercentage = totalSpend > 0 ? ((totalSpend - prevMonthSpend) / prevMonthSpend) * 100 : 0;
      
      // Convert API response to format needed by dashboard
      setDashboardData({
        costTrend: {
          labels: timeSeries.timestamps || [],
          datasets: timeSeries.series?.map((series: any) => ({
            label: series.name,
            data: series.data
          })) || []
        },
        summaryMetrics: {
          totalSpend: totalSpend,
          monthToDateSpend: totalSpend * 0.8, // Mocked month-to-date value (80% of total)
          forecastedSpend: totalSpend * 1.2, // Mocked forecasted value
          changePercentage: changePercentage
        },
        costByProvider: costData.cost_by_provider || {},
        costByService: costData.cost_by_service || {}
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Create mock data if API fails
      createMockDashboardData();
    }
    setIsLoadingDashboard(false);
  };

  // Create mock dashboard data as fallback
  const createMockDashboardData = () => {
    // Generate dates for the past 20 days
    const dates = Array.from({ length: 20 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (19 - i));
      return date.toISOString().split('T')[0];
    });
    
    const awsCosts = dates.map(() => Math.floor(1500 + Math.random() * 300));
    const azureCosts = dates.map(() => Math.floor(800 + Math.random() * 200));
    const gcpCosts = dates.map(() => Math.floor(400 + Math.random() * 100));
    
    const totalSpend = [...awsCosts, ...azureCosts, ...gcpCosts].reduce((sum, cost) => sum + cost, 0);
    const prevMonthSpend = totalSpend * 0.95;
    const changePercentage = ((totalSpend - prevMonthSpend) / prevMonthSpend) * 100;
    
    setDashboardData({
      costTrend: {
        labels: dates,
        datasets: [
          {
            label: 'AWS',
            data: awsCosts
          },
          {
            label: 'Azure',
            data: azureCosts
          },
          {
            label: 'GCP',
            data: gcpCosts
          }
        ]
      },
      summaryMetrics: {
        totalSpend: totalSpend,
        monthToDateSpend: totalSpend * 0.8,
        forecastedSpend: totalSpend * 1.2,
        changePercentage: changePercentage
      },
      costByProvider: {
        'AWS': awsCosts.reduce((sum, cost) => sum + cost, 0),
        'Azure': azureCosts.reduce((sum, cost) => sum + cost, 0),
        'GCP': gcpCosts.reduce((sum, cost) => sum + cost, 0)
      },
      costByService: {
        'Compute': totalSpend * 0.45,
        'Storage': totalSpend * 0.25,
        'Database': totalSpend * 0.15,
        'Network': totalSpend * 0.1,
        'Other': totalSpend * 0.05
      }
    });
  };

  const loadAIInsights = async () => {
    try {
      if (!dashboardData) return;
      
      // Convert dashboardData.costTrend to format expected by API
      const costData = [];
      if (dashboardData.costTrend.datasets.length > 0) {
        const mainDataset = dashboardData.costTrend.datasets[0];
        
        for (let i = 0; i < dashboardData.costTrend.labels.length; i++) {
          let dailyCost = 0;
          dashboardData.costTrend.datasets.forEach(dataset => {
            if (dataset.data[i]) {
              dailyCost += dataset.data[i];
            }
          });
          
          costData.push({
            date: dashboardData.costTrend.labels[i],
            daily_cost: dailyCost,
            service: 'All',
            cloud_provider: 'All'
          });
        }
      }

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
      
      // Load optimization recommendations
      setIsLoadingOptimization(true);
      try {
        // This would typically use real resource utilization data
        const mockUtilizationData = generateMockUtilizationData();
        const mockUsageData: Array<{[key: string]: any}> = [];
        
        const optimizationResponse = await getResourceOptimization(mockUtilizationData, mockUsageData);
        setOptimizationData(optimizationResponse.data.optimization_results || null);
      } catch (error) {
        console.error('Error getting optimization recommendations:', error);
        // Create mock optimization data
        createMockOptimizationData();
      }
      setIsLoadingOptimization(false);
    } catch (error) {
      console.error('Error loading AI insights:', error);
      setIsLoadingAnomalies(false);
      setIsLoadingForecast(false);
      setIsLoadingOptimization(false);
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
  
  // Function to create mock optimization data
  const createMockOptimizationData = () => {
    setOptimizationData({
      optimization_score: 72,
      estimated_monthly_savings: 2450,
      optimizations: {
        workload_classification: {
          workload_profiles: [
            {
              workload_type: "web",
              size: 3,
              percentage: 30
            },
            {
              workload_type: "batch",
              size: 5,
              percentage: 50
            }
          ]
        },
        instance_recommendations: {
          "cluster_1": {
            recommendations: [
              { instance_type: "t3.medium", monthly_savings: 850 }
            ]
          }
        },
        autoscaling: {
          scaling_type: "predictive"
        },
        reservations: {
          comparison: {
            recommendation: "Savings Plan"
          }
        }
      }
    });
  };
  
  // Generate mock utilization data for optimization
  const generateMockUtilizationData = () => {
    const data: Array<{
      resource_id: string;
      timestamp: string;
      cpu_percent: number;
      memory_percent: number;
    }> = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      ['i-001', 'i-002', 'i-003'].forEach(resourceId => {
        data.push({
          resource_id: resourceId,
          timestamp: date.toISOString(),
          cpu_percent: Math.random() * 100,
          memory_percent: Math.random() * 100
        });
      });
    }
    
    return data;
  };
  
  // Prepare cost trend chart configuration
  const costTrendChartData = {
    labels: dashboardData?.costTrend.labels || [],
    datasets: dashboardData?.costTrend.datasets.map(dataset => ({
      label: dataset.label,
      data: dataset.data,
      borderColor: dataset.label === 'AWS' ? 'rgb(255, 153, 0)' : 
                   dataset.label === 'Azure' ? 'rgb(0, 120, 212)' : 
                   dataset.label === 'GCP' ? 'rgb(52, 168, 83)' : 
                   'rgb(75, 192, 192)',
      backgroundColor: dataset.label === 'AWS' ? 'rgba(255, 153, 0, 0.1)' : 
                       dataset.label === 'Azure' ? 'rgba(0, 120, 212, 0.1)' : 
                       dataset.label === 'GCP' ? 'rgba(52, 168, 83, 0.1)' : 
                       'rgba(75, 192, 192, 0.1)',
      tension: 0.3,
      fill: false
    })) || []
  };
  
  const costTrendChartOptions = {
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
        beginAtZero: false,
        ticks: {
          callback: function(value: any) {
            return `$${value}`;
          }
        }
      }
    }
  };
  
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const isLoading = isLoadingDashboard || isLoadingAnomalies || isLoadingForecast || isLoadingOptimization;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
        <Tooltip title="Refresh data">
          <IconButton onClick={handleRefresh} disabled={isLoading}>
            {isLoading ? <CircularProgress size={24} /> : <RefreshIcon />}
          </IconButton>
        </Tooltip>
      </Box>
      
      {/* Summary metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Total Cost (30 Days)
              </Typography>
              <Typography variant="h4" component="div">
                ${dashboardData?.summaryMetrics?.totalSpend.toLocaleString() || '0'}
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                {dashboardData?.summaryMetrics?.changePercentage && dashboardData.summaryMetrics.changePercentage > 0 ? (
                  <Chip 
                    icon={<ArrowUpIcon fontSize="small" />} 
                    label={`+${dashboardData.summaryMetrics.changePercentage.toFixed(1)}%`} 
                    size="small" 
                    color="error"
                  />
                ) : (
                  <Chip 
                    icon={<ArrowDownIcon fontSize="small" />} 
                    label={`${dashboardData?.summaryMetrics?.changePercentage?.toFixed(1) || 0}%`} 
                    size="small" 
                    color="success"
                  />
                )}
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  vs previous period
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Month to Date
              </Typography>
              <Typography variant="h4" component="div">
                ${dashboardData?.summaryMetrics?.monthToDateSpend.toLocaleString() || '0'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Current billing cycle
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Forecasted Month End
              </Typography>
              <Typography variant="h4" component="div">
                ${dashboardData?.summaryMetrics?.forecastedSpend.toLocaleString() || '0'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Projected for full month
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Potential Savings
              </Typography>
              <Typography variant="h4" component="div">
                ${optimizationData?.estimated_monthly_savings?.toLocaleString() || '0'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Monthly optimization opportunity
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Cost trend chart */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Cost Trend by Cloud Provider
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ height: 300 }}>
            {dashboardData?.costTrend ? (
              <Line options={costTrendChartOptions} data={costTrendChartData} />
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
      
      {/* Provider and service distribution */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Cost Distribution by Provider
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {dashboardData?.costByProvider && Object.keys(dashboardData.costByProvider).length > 0 ? (
                <Box>
                  {Object.entries(dashboardData.costByProvider).map(([provider, cost]) => (
                    <Box key={provider} sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                      <CloudIcon sx={{ mr: 1, color: 
                        provider === 'AWS' ? 'rgb(255, 153, 0)' : 
                        provider === 'Azure' ? 'rgb(0, 120, 212)' : 
                        provider === 'GCP' ? 'rgb(52, 168, 83)' : 
                        'primary.main' 
                      }} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2">{provider}</Typography>
                        <Box 
                          sx={{ 
                            width: '100%', 
                            height: 6, 
                            bgcolor: 'background.default',
                            borderRadius: 1,
                            mt: 0.5
                          }}
                        >
                          <Box 
                            sx={{ 
                              width: `${(cost / dashboardData.summaryMetrics!.totalSpend) * 100}%`, 
                              height: 6, 
                              bgcolor: 
                                provider === 'AWS' ? 'rgb(255, 153, 0)' : 
                                provider === 'Azure' ? 'rgb(0, 120, 212)' : 
                                provider === 'GCP' ? 'rgb(52, 168, 83)' : 
                                'primary.main',
                              borderRadius: 1 
                            }}
                          />
                        </Box>
                      </Box>
                      <Typography variant="body2" sx={{ minWidth: 80, textAlign: 'right' }}>
                        ${cost.toLocaleString()}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <Typography color="text.secondary">No data available</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Cost Distribution by Service
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {dashboardData?.costByService && Object.keys(dashboardData.costByService).length > 0 ? (
                <Box>
                  {Object.entries(dashboardData.costByService).map(([service, cost]) => (
                    <Box key={service} sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                      <StorageIcon sx={{ mr: 1 }} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2">{service}</Typography>
                        <Box 
                          sx={{ 
                            width: '100%', 
                            height: 6, 
                            bgcolor: 'background.default',
                            borderRadius: 1,
                            mt: 0.5
                          }}
                        >
                          <Box 
                            sx={{ 
                              width: `${(cost / dashboardData.summaryMetrics!.totalSpend) * 100}%`, 
                              height: 6, 
                              bgcolor: 'secondary.main',
                              borderRadius: 1 
                            }}
                          />
                        </Box>
                      </Box>
                      <Typography variant="body2" sx={{ minWidth: 80, textAlign: 'right' }}>
                        ${cost.toLocaleString()}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <Typography color="text.secondary">No data available</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* AI-powered insights */}
      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
        AI-Powered Insights
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <OptimizationRecommendations 
            optimizationData={optimizationData}
            isLoading={isLoadingOptimization}
          />
        </Grid>
        
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