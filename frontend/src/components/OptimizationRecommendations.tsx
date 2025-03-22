import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Button,
  Grid,
  Paper,
  CircularProgress,
  Collapse,
  IconButton,
  Stack,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckCircleIcon,
  Storage as StorageIcon,
  Memory as MemoryIcon,
  CloudQueue as CloudQueueIcon,
  Lightbulb as LightbulbIcon,
  ExpandMore as ExpandMoreIcon,
  MonetizationOn as MonetizationOnIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

interface OptimizationRecommendationsProps {
  optimizationData: any;
  isLoading?: boolean;
  onApplyRecommendation?: (id: string) => void;
}

// Interface for expanded recommendation details
interface ExpandedState {
  [key: string]: boolean;
}

const OptimizationRecommendations: React.FC<OptimizationRecommendationsProps> = ({ 
  optimizationData, 
  isLoading = false,
  onApplyRecommendation
}) => {
  // State to track which recommendations are expanded
  const [expanded, setExpanded] = useState<ExpandedState>({});

  // Toggle expanded state
  const toggleExpand = (id: string) => {
    setExpanded(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6">Resource Optimization</Typography>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={24} sx={{ mr: 1 }} />
            <Typography>Analyzing resources...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!optimizationData || !optimizationData.optimizations) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6">Resource Optimization</Typography>
          <Box sx={{ mt: 2 }}>
            <Typography>No optimization data available.</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const totalSavings = optimizationData.estimated_monthly_savings || 0;
  const score = optimizationData.optimization_score || 0;
  
  // Extract idle and underutilized resources if available
  const idleResources = optimizationData.optimizations.idle_resources || [];
  const underutilizedResources = optimizationData.optimizations.underutilized_resources || [];
  
  // Create cost-specific optimization recommendations
  const costOptimizations = [
    // Idle resources
    ...idleResources.map((resource: any, index: number) => ({
      id: `idle-${index}`,
      title: `Idle ${resource.resource_type || 'Resource'} Detected`,
      description: `${resource.resource_id || 'Unknown resource'} has been idle for ${resource.idle_days || 30}+ days`,
      icon: <DeleteIcon color="error" />,
      savings: resource.monthly_cost || 0,
      priority: 'high',
      details: {
        resourceId: resource.resource_id,
        resourceType: resource.resource_type,
        region: resource.region,
        account: resource.account_id,
        status: 'Idle',
        utilizationMetrics: {
          cpu: resource.cpu_utilization || 0,
          memory: resource.memory_utilization || 0,
          network: resource.network_utilization || 0
        },
        recommendation: 'Delete this resource as it has been detected as idle',
        savingsDetails: {
          monthly: resource.monthly_cost || 0,
          annual: (resource.monthly_cost || 0) * 12
        }
      }
    })),
    
    // Underutilized resources
    ...underutilizedResources.map((resource: any, index: number) => ({
      id: `underutilized-${index}`,
      title: `Underutilized ${resource.resource_type || 'Resource'}`,
      description: `${resource.resource_id || 'Unknown resource'} is consistently underutilized`,
      icon: <WarningIcon color="warning" />,
      savings: resource.potential_savings || 0,
      priority: 'medium',
      details: {
        resourceId: resource.resource_id,
        resourceType: resource.resource_type,
        region: resource.region,
        account: resource.account_id,
        status: 'Underutilized',
        currentSize: resource.current_size,
        recommendedSize: resource.recommended_size,
        utilizationMetrics: {
          cpu: resource.cpu_utilization || 0,
          memory: resource.memory_utilization || 0,
          network: resource.network_utilization || 0
        },
        recommendation: `Downsize from ${resource.current_size} to ${resource.recommended_size}`,
        savingsDetails: {
          monthly: resource.potential_savings || 0,
          annual: (resource.potential_savings || 0) * 12
        }
      }
    }))
  ];

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">AI Optimization Recommendations</Typography>
          <Chip 
            label={`Score: ${score.toFixed(1)}/100`} 
            color={score > 75 ? "success" : score > 50 ? "warning" : "error"}
          />
        </Box>
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
              <Typography variant="h5" color="success.dark" gutterBottom>
                ${totalSavings.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="success.dark">
                Estimated Monthly Savings
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h5" gutterBottom>
                ${(totalSavings * 12).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Annualized Savings
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light' }}>
              <Typography variant="h5" color="warning.dark" gutterBottom>
                {costOptimizations.length}
              </Typography>
              <Typography variant="body2" color="warning.dark">
                Resource Optimizations
              </Typography>
            </Paper>
          </Grid>
        </Grid>
        
        <Divider sx={{ mb: 2 }} />
        
        <Typography variant="subtitle1" gutterBottom>Cost Optimization Opportunities:</Typography>
        
        <List>
          {/* Display cost-specific optimizations */}
          {costOptimizations.length > 0 ? (
            costOptimizations.map((optimization) => (
              <React.Fragment key={optimization.id}>
                <ListItem
                  secondaryAction={
                    <IconButton 
                      edge="end" 
                      aria-label="expand" 
                      onClick={() => toggleExpand(optimization.id)}
                      sx={{ 
                        transform: expanded[optimization.id] ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: '0.3s'
                      }}
                    >
                      <ExpandMoreIcon />
                    </IconButton>
                  }
                >
                  <ListItemIcon>
                    {optimization.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {optimization.title}
                        <Chip 
                          size="small" 
                          label={`$${optimization.savings.toLocaleString()}/mo`}
                          color="success"
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    }
                    secondary={optimization.description}
                  />
                </ListItem>
                
                <Collapse in={expanded[optimization.id]} timeout="auto" unmountOnExit>
                  <Box sx={{ pl: 4, pr: 4, pt: 1, pb: 2, bgcolor: 'background.default' }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2">Resource Details</Typography>
                        <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                          <Typography variant="body2">
                            <strong>ID:</strong> {optimization.details.resourceId}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Type:</strong> {optimization.details.resourceType}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Region:</strong> {optimization.details.region}
                          </Typography>
                        </Stack>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2">Utilization</Typography>
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2">CPU</Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={optimization.details.utilizationMetrics.cpu} 
                            color={optimization.details.utilizationMetrics.cpu < 20 ? "error" : "primary"}
                            sx={{ mb: 1 }}
                          />
                          
                          <Typography variant="body2">Memory</Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={optimization.details.utilizationMetrics.memory} 
                            color={optimization.details.utilizationMetrics.memory < 20 ? "error" : "primary"}
                            sx={{ mb: 1 }}
                          />
                          
                          <Typography variant="body2">Network</Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={optimization.details.utilizationMetrics.network} 
                            color={optimization.details.utilizationMetrics.network < 20 ? "error" : "primary"}
                          />
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2">Recommendation</Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {optimization.details.recommendation}
                        </Typography>
                        
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2">Potential Savings</Typography>
                          <Typography variant="body1" color="success.main">
                            ${optimization.details.savingsDetails.monthly.toLocaleString()}/month
                          </Typography>
                          <Typography variant="body2" color="success.main">
                            ${optimization.details.savingsDetails.annual.toLocaleString()}/year
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} sx={{ mt: 1 }}>
                        <Button 
                          variant="contained" 
                          color="primary" 
                          size="small"
                          onClick={() => onApplyRecommendation && onApplyRecommendation(optimization.id)}
                        >
                          Apply Recommendation
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                </Collapse>
                <Divider />
              </React.Fragment>
            ))
          ) : (
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color="success" />
              </ListItemIcon>
              <ListItemText 
                primary="No immediate cost optimizations needed" 
                secondary="Your resource utilization is currently optimized"
              />
            </ListItem>
          )}

          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle1" gutterBottom>Strategic Recommendations:</Typography>
          
          {/* Display workload optimization if available */}
          {optimizationData.optimizations.workload_classification && (
            <ListItem>
              <ListItemIcon>
                <LightbulbIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Workload-Based Resource Optimization" 
                secondary={`${optimizationData.optimizations.workload_classification.workload_profiles?.length || 0} workload patterns identified`}
              />
              <Button size="small" variant="outlined">View Details</Button>
            </ListItem>
          )}
          
          {/* Display rightsizing recommendations if available */}
          {optimizationData.optimizations.instance_recommendations && (
            <ListItem>
              <ListItemIcon>
                <MemoryIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Instance Right-Sizing Opportunities" 
                secondary="Optimize instance types based on actual usage patterns"
              />
              <Button size="small" variant="outlined">View Details</Button>
            </ListItem>
          )}
          
          {/* Display reservation recommendations if available */}
          {optimizationData.optimizations.reservations && (
            <ListItem>
              <ListItemIcon>
                <CloudQueueIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Reservation & Savings Plan Recommendations" 
                secondary={optimizationData.optimizations.reservations.comparison?.recommendation || "Optimize commitments"}
              />
              <Button size="small" variant="outlined">View Details</Button>
            </ListItem>
          )}
          
          {/* Display auto-scaling recommendations if available */}
          {optimizationData.optimizations.autoscaling && (
            <ListItem>
              <ListItemIcon>
                <TrendingDownIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Auto-Scaling Optimization" 
                secondary={`Recommended scaling type: ${optimizationData.optimizations.autoscaling.scaling_type || "Target tracking"}`}
              />
              <Button size="small" variant="outlined">View Details</Button>
            </ListItem>
          )}
          
          {/* Add a Cost allocation recommendation */}
          <ListItem>
            <ListItemIcon>
              <MonetizationOnIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Cost Allocation & Tagging Strategy" 
              secondary="Improve cost visibility with our recommended tagging system"
            />
            <Button size="small" variant="outlined">View Details</Button>
          </ListItem>
        </List>
      </CardContent>
    </Card>
  );
};

export default OptimizationRecommendations;