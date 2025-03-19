import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Avatar,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  MoreVert as MoreVertIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Lightbulb as LightbulbIcon,
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import axios from 'axios';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // In a real app, fetch data from the API
    // For this demo, we'll use mock data
    const fetchData = async () => {
      try {
        setLoading(true);
        // In a real application, this would be an API call:
        // const response = await axios.get(`/api/cost-analysis/dashboard-summary?timeRange=${timeRange}`);
        // setDashboardData(response.data);
        
        // For now, using mock data
        setTimeout(() => {
          setDashboardData(mockDashboardData);
          setLoading(false);
        }, 800);
      } catch (err) {
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  const handleTimeRangeChange = (event: SelectChangeEvent) => {
    setTimeRange(event.target.value as string);
  };

  if (loading) {
    return <Box p={3}>Loading dashboard data...</Box>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const costTrendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  const costByServiceOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
  };

  const costByProviderOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: false,
      },
    },
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Cost Dashboard
        </Typography>
        <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="time-range-select-label">Time Range</InputLabel>
          <Select
            labelId="time-range-select-label"
            id="time-range-select"
            value={timeRange}
            onChange={handleTimeRangeChange}
            label="Time Range"
          >
            <MenuItem value="7d">Last 7 Days</MenuItem>
            <MenuItem value="30d">Last 30 Days</MenuItem>
            <MenuItem value="90d">Last 90 Days</MenuItem>
            <MenuItem value="ytd">Year to Date</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Summary cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Cost
              </Typography>
              <Typography variant="h4" component="div">
                ${dashboardData.totalCost.toLocaleString()}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {dashboardData.costChange > 0 ? (
                  <ArrowUpwardIcon fontSize="small" color="error" />
                ) : (
                  <ArrowDownwardIcon fontSize="small" color="success" />
                )}
                <Typography 
                  variant="body2" 
                  color={dashboardData.costChange > 0 ? "error" : "success"}
                >
                  {Math.abs(dashboardData.costChange)}% vs previous period
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Forecasted Cost
              </Typography>
              <Typography variant="h4" component="div">
                ${dashboardData.forecastedCost.toLocaleString()}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {dashboardData.forecastChange > 0 ? (
                  <ArrowUpwardIcon fontSize="small" color="error" />
                ) : (
                  <ArrowDownwardIcon fontSize="small" color="success" />
                )}
                <Typography 
                  variant="body2" 
                  color={dashboardData.forecastChange > 0 ? "error" : "success"}
                >
                  {Math.abs(dashboardData.forecastChange)}% vs current
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Optimization Opportunities
              </Typography>
              <Typography variant="h4" component="div">
                ${dashboardData.optimizationSavings.toLocaleString()}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  {dashboardData.optimizationCount} recommendations
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Anomalies Detected
              </Typography>
              <Typography variant="h4" component="div">
                {dashboardData.anomalyCount}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography 
                  variant="body2" 
                  color={dashboardData.anomalyCount > 0 ? "error" : "success"}
                >
                  {dashboardData.anomalyCount > 0 
                    ? `$${dashboardData.anomalyImpact.toLocaleString()} potential impact` 
                    : "No anomalies detected"}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardHeader 
              title="Cost Trend" 
              subheader="Daily cost across all cloud providers"
              action={
                <IconButton aria-label="settings">
                  <MoreVertIcon />
                </IconButton>
              }
            />
            <Divider />
            <CardContent sx={{ height: 300 }}>
              <Line 
                options={costTrendOptions} 
                data={{
                  labels: dashboardData.costTrend.labels,
                  datasets: dashboardData.costTrend.datasets,
                }} 
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardHeader 
              title="Cost By Provider" 
              action={
                <IconButton aria-label="settings">
                  <MoreVertIcon />
                </IconButton>
              }
            />
            <Divider />
            <CardContent sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
              <Doughnut 
                options={costByProviderOptions} 
                data={{
                  labels: dashboardData.costByProvider.labels,
                  datasets: [{
                    data: dashboardData.costByProvider.data,
                    backgroundColor: dashboardData.costByProvider.colors,
                  }],
                }} 
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bottom row */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Top Services by Cost" 
              action={
                <IconButton aria-label="settings">
                  <MoreVertIcon />
                </IconButton>
              }
            />
            <Divider />
            <CardContent sx={{ height: 300 }}>
              <Bar 
                options={costByServiceOptions} 
                data={{
                  labels: dashboardData.costByService.labels,
                  datasets: [{
                    label: 'Cost ($)',
                    data: dashboardData.costByService.data,
                    backgroundColor: '#4791db',
                  }],
                }} 
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Top Recommendations" 
              action={
                <Button size="small" color="primary">
                  View All
                </Button>
              }
            />
            <Divider />
            <CardContent sx={{ p: 0, maxHeight: 300, overflow: 'auto' }}>
              <List>
                {dashboardData.recommendations.map((recommendation: any, index: number) => (
                  <React.Fragment key={index}>
                    <ListItem alignItems="flex-start">
                      <ListItemIcon>
                        <LightbulbIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={recommendation.title}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="textPrimary">
                              ${recommendation.savingsAmount.toLocaleString()} potential savings
                            </Typography>
                            {" — "}{recommendation.description}
                          </>
                        }
                      />
                    </ListItem>
                    {index < dashboardData.recommendations.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

// Mock data for the dashboard
const mockDashboardData = {
  totalCost: 12345.67,
  costChange: 7.5,
  forecastedCost: 13250.50,
  forecastChange: 7.3,
  optimizationSavings: 2456.78,
  optimizationCount: 8,
  anomalyCount: 3,
  anomalyImpact: 578.90,
  costTrend: {
    labels: ['Jan 1', 'Jan 2', 'Jan 3', 'Jan 4', 'Jan 5', 'Jan 6', 'Jan 7', 'Jan 8', 'Jan 9', 'Jan 10', 'Jan 11', 'Jan 12', 'Jan 13', 'Jan 14'],
    datasets: [
      {
        label: 'AWS',
        data: [450, 470, 460, 520, 540, 520, 510, 490, 520, 550, 530, 500, 520, 510],
        borderColor: 'rgb(255, 153, 0)',
        backgroundColor: 'rgba(255, 153, 0, 0.5)',
        tension: 0.2,
      },
      {
        label: 'Azure',
        data: [320, 330, 310, 350, 370, 360, 380, 360, 340, 370, 380, 370, 360, 350],
        borderColor: 'rgb(0, 122, 204)',
        backgroundColor: 'rgba(0, 122, 204, 0.5)',
        tension: 0.2,
      },
      {
        label: 'GCP',
        data: [180, 190, 200, 210, 220, 210, 190, 200, 220, 230, 200, 190, 210, 220],
        borderColor: 'rgb(52, 168, 83)',
        backgroundColor: 'rgba(52, 168, 83, 0.5)',
        tension: 0.2,
      }
    ]
  },
  costByProvider: {
    labels: ['AWS', 'Azure', 'GCP'],
    data: [6532.10, 4210.32, 1603.25],
    colors: ['rgb(255, 153, 0)', 'rgb(0, 122, 204)', 'rgb(52, 168, 83)']
  },
  costByService: {
    labels: ['EC2', 'S3', 'RDS', 'Lambda', 'EBS', 'Virtual Machines', 'Storage Accounts', 'SQL Database'],
    data: [3245.67, 1258.90, 978.45, 567.23, 482.85, 2154.32, 1023.45, 1032.55]
  },
  recommendations: [
    {
      title: 'Rightsize EC2 Instances',
      description: '5 instances are underutilized and can be downsized',
      savingsAmount: 876.54
    },
    {
      title: 'Purchase Reserved Instances',
      description: '12 instances have stable usage patterns and are candidates for reservations',
      savingsAmount: 934.21
    },
    {
      title: 'Delete Unused Storage',
      description: '15 unattached volumes found across regions',
      savingsAmount: 321.87
    },
    {
      title: 'Azure SQL Databases Optimization',
      description: '3 databases can be moved to elastic pools',
      savingsAmount: 289.76
    }
  ]
};

export default Dashboard; 