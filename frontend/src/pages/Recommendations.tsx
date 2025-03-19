import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Paper,
  Tab,
  Tabs,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Badge,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  TrendingDown as TrendingDownIcon,
  ArrowRight as ArrowRightIcon,
  Schedule as ScheduleIcon,
  Delete as DeleteIcon,
  Storage as StorageIcon,
  CloudQueue as CloudQueueIcon,
  Memory as MemoryIcon,
  Lightbulb as LightbulbIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Save as SaveIcon,
} from '@mui/icons-material';

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
      id={`recommendations-tabpanel-${index}`}
      aria-labelledby={`recommendations-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

// Mock recommendation data
const mockRecommendations = {
  rightsizing: [
    {
      id: 'rs-1',
      title: 'Rightsize EC2 Instances',
      resource: 'i-0abc123def456789',
      resourceType: 'EC2 Instance',
      currentConfig: 'm5.xlarge',
      recommendedConfig: 'm5.large',
      monthlySavings: 87.60,
      savingsPercentage: 50,
      confidence: 0.92,
      provider: 'AWS',
      region: 'us-east-1',
      utilizationMetrics: {
        cpu: '22%',
        memory: '35%',
      },
    },
    {
      id: 'rs-2',
      title: 'Rightsize Azure VM',
      resource: 'vm-eastus-web01',
      resourceType: 'Virtual Machine',
      currentConfig: 'Standard_D4s_v3',
      recommendedConfig: 'Standard_D2s_v3',
      monthlySavings: 124.80,
      savingsPercentage: 50,
      confidence: 0.89,
      provider: 'Azure',
      region: 'East US',
      utilizationMetrics: {
        cpu: '18%',
        memory: '30%',
      },
    },
    {
      id: 'rs-3',
      title: 'Rightsize GCP Instance',
      resource: 'instance-1',
      resourceType: 'Compute Engine',
      currentConfig: 'e2-standard-4',
      recommendedConfig: 'e2-standard-2',
      monthlySavings: 43.80,
      savingsPercentage: 50,
      confidence: 0.87,
      provider: 'GCP',
      region: 'us-central1',
      utilizationMetrics: {
        cpu: '25%',
        memory: '32%',
      },
    },
  ],
  unused: [
    {
      id: 'un-1',
      title: 'Delete Unused EBS Volumes',
      resource: 'vol-0abc123def456789',
      resourceType: 'EBS Volume',
      currentConfig: '500 GB gp2',
      monthlySavings: 50.00,
      daysInactive: 65,
      provider: 'AWS',
      region: 'us-east-1',
    },
    {
      id: 'un-2',
      title: 'Delete Unattached Public IP',
      resource: 'eipalloc-0abc123def456789',
      resourceType: 'Elastic IP',
      monthlySavings: 3.60,
      daysInactive: 45,
      provider: 'AWS',
      region: 'eu-west-1',
    },
    {
      id: 'un-3',
      title: 'Delete Unused Network Security Group',
      resource: 'nsg-eastus-unused',
      resourceType: 'Network Security Group',
      monthlySavings: 0,
      daysInactive: 120,
      provider: 'Azure',
      region: 'East US',
    },
  ],
  reservations: [
    {
      id: 'res-1',
      title: 'Purchase Savings Plan',
      resourceType: 'EC2 - General Purpose',
      currentConfig: 'On-Demand',
      recommendedConfig: 'Compute Savings Plan - 1 Year No Upfront',
      monthlySavings: 450.25,
      savingsPercentage: 32,
      confidence: 0.95,
      provider: 'AWS',
      region: 'us-east-1',
    },
    {
      id: 'res-2',
      title: 'Purchase Reserved Instances',
      resourceType: 'RDS - MySQL',
      currentConfig: 'On-Demand',
      recommendedConfig: 'Reserved Instance - 1 Year Partial Upfront',
      monthlySavings: 215.40,
      savingsPercentage: 40,
      confidence: 0.91,
      provider: 'AWS',
      region: 'us-west-2',
    },
    {
      id: 'res-3',
      title: 'Purchase Azure Reserved Instances',
      resourceType: 'Virtual Machines',
      currentConfig: 'Pay as you go',
      recommendedConfig: 'Reserved - 1 Year',
      monthlySavings: 380.50,
      savingsPercentage: 45,
      confidence: 0.89,
      provider: 'Azure',
      region: 'East US',
    },
  ],
};

const Recommendations: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [provider, setProvider] = useState('all');
  const [minSavings, setMinSavings] = useState('');
  const [showImplemented, setShowImplemented] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleProviderChange = (event: SelectChangeEvent) => {
    setProvider(event.target.value);
  };

  const handleMinSavingsChange = (event: SelectChangeEvent) => {
    setMinSavings(event.target.value);
  };

  const handleShowImplementedChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowImplemented(event.target.checked);
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'EC2 Instance':
      case 'Virtual Machine':
      case 'Compute Engine':
        return <MemoryIcon />;
      case 'EBS Volume':
      case 'Storage Account':
        return <StorageIcon />;
      case 'Elastic IP':
      case 'Network Security Group':
        return <CloudQueueIcon />;
      default:
        return <LightbulbIcon />;
    }
  };

  // Calculate total potential savings
  const calculateTotalSavings = (recommendations: any[]) => {
    return recommendations.reduce((total, rec) => total + rec.monthlySavings, 0);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Cost Optimization Recommendations
        </Typography>
        <Button variant="contained" startIcon={<SaveIcon />} color="primary">
          Apply Selected
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="recommendation tabs">
            <Tab
              label={
                <Badge badgeContent={mockRecommendations.rightsizing.length} color="primary">
                  Rightsizing
                </Badge>
              }
            />
            <Tab
              label={
                <Badge badgeContent={mockRecommendations.unused.length} color="primary">
                  Unused Resources
                </Badge>
              }
            />
            <Tab
              label={
                <Badge badgeContent={mockRecommendations.reservations.length} color="primary">
                  Reservation Opportunities
                </Badge>
              }
            />
          </Tabs>
        </Box>

        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
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
              <InputLabel id="min-savings-label">Min. Savings</InputLabel>
              <Select
                labelId="min-savings-label"
                id="min-savings"
                value={minSavings}
                label="Min. Savings"
                onChange={handleMinSavingsChange}
              >
                <MenuItem value="">Any Amount</MenuItem>
                <MenuItem value="10">$10/month</MenuItem>
                <MenuItem value="50">$50/month</MenuItem>
                <MenuItem value="100">$100/month</MenuItem>
                <MenuItem value="500">$500/month</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={showImplemented}
                onChange={handleShowImplementedChange}
                color="primary"
              />
            }
            label="Show Implemented"
          />
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Total Potential Savings: ${calculateTotalSavings(mockRecommendations.rightsizing).toLocaleString()} per month
            </Typography>
            <Typography variant="body2" color="text.secondary">
              These recommendations help you optimize resource sizes based on actual usage patterns.
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            {mockRecommendations.rightsizing.map((rec) => (
              <Grid item xs={12} md={6} lg={4} key={rec.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="h6" component="div" gutterBottom>
                        {rec.title}
                      </Typography>
                      <Chip
                        label={rec.provider}
                        size="small"
                        sx={{
                          bgcolor: 
                            rec.provider === 'AWS' ? 'rgba(255, 153, 0, 0.2)' : 
                            rec.provider === 'Azure' ? 'rgba(0, 122, 204, 0.2)' :
                            'rgba(52, 168, 83, 0.2)',
                          color: 
                            rec.provider === 'AWS' ? 'rgb(191, 115, 0)' : 
                            rec.provider === 'Azure' ? 'rgb(0, 91, 153)' :
                            'rgb(39, 126, 62)',
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {getRecommendationIcon(rec.resourceType)}
                      </ListItemIcon>
                      <Typography variant="body2" color="text.secondary">
                        {rec.resourceType} • {rec.region}
                      </Typography>
                    </Box>
                    
                    <Divider sx={{ my: 1.5 }} />
                    
                    <Box sx={{ mb: 1.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        Resource: {rec.resource}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body2" fontWeight="medium">
                            Current: {rec.currentConfig}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            CPU: {rec.utilizationMetrics.cpu} • Memory: {rec.utilizationMetrics.memory}
                          </Typography>
                        </Box>
                        <ArrowRightIcon color="action" />
                        <Box sx={{ flexGrow: 1, ml: 1 }}>
                          <Typography variant="body2" fontWeight="medium" color="primary">
                            Recommended: {rec.recommendedConfig}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    
                    <Box sx={{ bgcolor: 'success.light', p: 1.5, borderRadius: 1, mt: 2 }}>
                      <Typography variant="body2" color="success.dark" fontWeight="medium">
                        Est. Monthly Savings: ${rec.monthlySavings.toLocaleString()}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="caption" color="success.dark">
                          {rec.savingsPercentage}% reduction
                        </Typography>
                        <Typography variant="caption" color="success.dark">
                          {(rec.confidence * 100).toFixed(0)}% confidence
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button size="small" color="primary">Apply</Button>
                    <Button size="small">View Details</Button>
                    <Button size="small" color="inherit">Dismiss</Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Total Potential Savings: ${calculateTotalSavings(mockRecommendations.unused).toLocaleString()} per month
            </Typography>
            <Typography variant="body2" color="text.secondary">
              These resources have been inactive for an extended period and can be safely removed.
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            {mockRecommendations.unused.map((rec) => (
              <Grid item xs={12} md={6} lg={4} key={rec.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="h6" component="div" gutterBottom>
                        {rec.title}
                      </Typography>
                      <Chip
                        label={rec.provider}
                        size="small"
                        sx={{
                          bgcolor: 
                            rec.provider === 'AWS' ? 'rgba(255, 153, 0, 0.2)' : 
                            rec.provider === 'Azure' ? 'rgba(0, 122, 204, 0.2)' :
                            'rgba(52, 168, 83, 0.2)',
                          color: 
                            rec.provider === 'AWS' ? 'rgb(191, 115, 0)' : 
                            rec.provider === 'Azure' ? 'rgb(0, 91, 153)' :
                            'rgb(39, 126, 62)',
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {getRecommendationIcon(rec.resourceType)}
                      </ListItemIcon>
                      <Typography variant="body2" color="text.secondary">
                        {rec.resourceType} • {rec.region}
                      </Typography>
                    </Box>
                    
                    <Divider sx={{ my: 1.5 }} />
                    
                    <Box sx={{ mb: 1.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        Resource: {rec.resource}
                      </Typography>
                      {rec.currentConfig && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          Configuration: {rec.currentConfig}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <ScheduleIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                        <Typography variant="body2" color="error.main">
                          Inactive for {rec.daysInactive} days
                        </Typography>
                      </Box>
                    </Box>
                    
                    {rec.monthlySavings > 0 && (
                      <Box sx={{ bgcolor: 'success.light', p: 1.5, borderRadius: 1, mt: 2 }}>
                        <Typography variant="body2" color="success.dark" fontWeight="medium">
                          Est. Monthly Savings: ${rec.monthlySavings.toLocaleString()}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button size="small" color="primary" startIcon={<DeleteIcon />}>Delete Resource</Button>
                    <Button size="small">View Details</Button>
                    <Button size="small" color="inherit">Dismiss</Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Total Potential Savings: ${calculateTotalSavings(mockRecommendations.reservations).toLocaleString()} per month
            </Typography>
            <Typography variant="body2" color="text.secondary">
              These recommendations identify opportunities to purchase reserved instances or savings plans based on stable usage patterns.
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            {mockRecommendations.reservations.map((rec) => (
              <Grid item xs={12} md={6} lg={4} key={rec.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="h6" component="div" gutterBottom>
                        {rec.title}
                      </Typography>
                      <Chip
                        label={rec.provider}
                        size="small"
                        sx={{
                          bgcolor: 
                            rec.provider === 'AWS' ? 'rgba(255, 153, 0, 0.2)' : 
                            rec.provider === 'Azure' ? 'rgba(0, 122, 204, 0.2)' :
                            'rgba(52, 168, 83, 0.2)',
                          color: 
                            rec.provider === 'AWS' ? 'rgb(191, 115, 0)' : 
                            rec.provider === 'Azure' ? 'rgb(0, 91, 153)' :
                            'rgb(39, 126, 62)',
                        }}
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {rec.resourceType} • {rec.region}
                    </Typography>
                    
                    <Divider sx={{ my: 1.5 }} />
                    
                    <Box sx={{ mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body2" fontWeight="medium">
                            Current: {rec.currentConfig}
                          </Typography>
                        </Box>
                        <ArrowRightIcon color="action" />
                        <Box sx={{ flexGrow: 1, ml: 1 }}>
                          <Typography variant="body2" fontWeight="medium" color="primary">
                            Recommended: {rec.recommendedConfig}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    
                    <Box sx={{ bgcolor: 'success.light', p: 1.5, borderRadius: 1, mt: 2 }}>
                      <Typography variant="body2" color="success.dark" fontWeight="medium">
                        Est. Monthly Savings: ${rec.monthlySavings.toLocaleString()}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="caption" color="success.dark">
                          {rec.savingsPercentage}% reduction
                        </Typography>
                        <Typography variant="caption" color="success.dark">
                          {(rec.confidence * 100).toFixed(0)}% confidence
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button size="small" color="primary">Purchase</Button>
                    <Button size="small">View Details</Button>
                    <Button size="small" color="inherit">Dismiss</Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Recommendations; 