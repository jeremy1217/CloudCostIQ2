import React from 'react';
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
} from '@mui/material';
import {
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckCircleIcon,
  Storage as StorageIcon,
  Memory as MemoryIcon,
  CloudQueue as CloudQueueIcon,
  Lightbulb as LightbulbIcon,
} from '@mui/icons-material';

interface OptimizationRecommendationsProps {
  optimizationData: any;
  isLoading?: boolean;
}

const OptimizationRecommendations: React.FC<OptimizationRecommendationsProps> = ({ 
  optimizationData, 
  isLoading = false 
}) => {
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
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
              <Typography variant="h5" color="success.dark" gutterBottom>
                ${totalSavings.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="success.dark">
                Estimated Monthly Savings
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h5" gutterBottom>
                ${(totalSavings * 12).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Annualized Savings
              </Typography>
            </Paper>
          </Grid>
        </Grid>
        
        <Divider sx={{ mb: 2 }} />
        
        <Typography variant="subtitle1" gutterBottom>Top Recommendations:</Typography>
        
        <List>
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
        </List>
      </CardContent>
    </Card>
  );
};

export default OptimizationRecommendations;