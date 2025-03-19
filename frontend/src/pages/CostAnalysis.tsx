import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  Paper,
  Tabs,
  Tab,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Button,
  IconButton,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Download as DownloadIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { Line, Bar } from 'react-chartjs-2';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const CostAnalysis: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [timeRange, setTimeRange] = useState('30d');
  const [groupBy, setGroupBy] = useState('service');
  const [provider, setProvider] = useState('all');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleTimeRangeChange = (event: SelectChangeEvent) => {
    setTimeRange(event.target.value as string);
  };

  const handleGroupByChange = (event: SelectChangeEvent) => {
    setGroupBy(event.target.value as string);
  };

  const handleProviderChange = (event: SelectChangeEvent) => {
    setProvider(event.target.value as string);
  };

  // Chart options
  const timeSeriesOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
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
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return `$${value}`;
          }
        }
      },
    },
  };

  // Mock time-series data
  const timeSeriesData = {
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
  };

  // Mock breakdown data
  const breakdownData = {
    labels: ['EC2', 'S3', 'RDS', 'Lambda', 'EBS', 'Virtual Machines', 'Storage Accounts', 'SQL Database'],
    datasets: [
      {
        label: 'Cost ($)',
        data: [3245.67, 1258.90, 978.45, 567.23, 482.85, 2154.32, 1023.45, 1032.55],
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(199, 199, 199, 0.6)',
          'rgba(83, 102, 255, 0.6)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(199, 199, 199, 1)',
          'rgba(83, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Cost Analysis
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<DownloadIcon />}>
            Export
          </Button>
          <Button variant="outlined" startIcon={<FilterListIcon />}>
            Filters
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="cost analysis tabs">
            <Tab label="Time Series Analysis" />
            <Tab label="Cost Breakdown" />
            <Tab label="Resource Groups" />
          </Tabs>
        </Box>
        
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="time-range-label">Time Range</InputLabel>
            <Select
              labelId="time-range-label"
              id="time-range"
              value={timeRange}
              label="Time Range"
              onChange={handleTimeRangeChange}
            >
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
              <MenuItem value="90d">Last 90 Days</MenuItem>
              <MenuItem value="ytd">Year to Date</MenuItem>
              <MenuItem value="custom">Custom Range</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="provider-label">Cloud Provider</InputLabel>
            <Select
              labelId="provider-label"
              id="provider"
              value={provider}
              label="Cloud Provider"
              onChange={handleProviderChange}
            >
              <MenuItem value="all">All Providers</MenuItem>
              <MenuItem value="aws">AWS</MenuItem>
              <MenuItem value="azure">Azure</MenuItem>
              <MenuItem value="gcp">GCP</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="group-by-label">Group By</InputLabel>
            <Select
              labelId="group-by-label"
              id="group-by"
              value={groupBy}
              label="Group By"
              onChange={handleGroupByChange}
            >
              <MenuItem value="service">Service</MenuItem>
              <MenuItem value="region">Region</MenuItem>
              <MenuItem value="account">Account</MenuItem>
              <MenuItem value="tag">Tag</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Card>
            <CardHeader
              title="Cost Over Time"
              subheader="Daily cost trend for the selected time period"
              action={
                <IconButton aria-label="settings">
                  <MoreVertIcon />
                </IconButton>
              }
            />
            <Divider />
            <CardContent sx={{ height: 400 }}>
              <Line options={timeSeriesOptions} data={timeSeriesData} />
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Card>
            <CardHeader
              title={`Cost Breakdown by ${groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}`}
              subheader="Top services by cost"
              action={
                <IconButton aria-label="settings">
                  <MoreVertIcon />
                </IconButton>
              }
            />
            <Divider />
            <CardContent sx={{ height: 400 }}>
              <Bar
                options={{
                  ...timeSeriesOptions,
                  indexAxis: 'y' as const,
                }}
                data={breakdownData}
              />
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" component="h2" gutterBottom>
            Resource Group Analysis (Coming Soon)
          </Typography>
          <Typography>
            This feature will allow you to analyze costs by resource groups, projects, or departments.
          </Typography>
        </TabPanel>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Cost Insights"
              subheader="AI-generated cost patterns and anomalies"
            />
            <Divider />
            <CardContent>
              <Typography variant="body1" paragraph>
                Based on your spending patterns, we've detected the following insights:
              </Typography>
              <Box sx={{ pl: 2, borderLeft: '4px solid #1976d2', my: 2 }}>
                <Typography variant="body1" fontWeight="medium">
                  Cost Spike Detection
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  There was a 23% increase in AWS EC2 costs on January 10th compared to the previous week's average.
                  This appears to be related to a scaling event in the production environment.
                </Typography>
              </Box>
              <Box sx={{ pl: 2, borderLeft: '4px solid #dc004e', my: 2 }}>
                <Typography variant="body1" fontWeight="medium">
                  Spend Pattern Change
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Azure storage costs have been steadily increasing by 5% week-over-week for the past month.
                  This trend differs from historical patterns and may require attention.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Cost Forecast"
              subheader="Projected spending based on current patterns"
            />
            <Divider />
            <CardContent>
              <Typography variant="body1" paragraph>
                Based on your current usage patterns and historical data, we project the following:
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Current Month Projection</Typography>
                  <Typography variant="h6">$14,580</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Next Month Forecast</Typography>
                  <Typography variant="h6">$15,320</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">90-Day Trend</Typography>
                  <Typography variant="h6" color="error.main">+5.1%</Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                The ML-based forecast indicates a continued upward trend in cloud costs, primarily driven by
                increased usage in compute services and database resources.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CostAnalysis; 