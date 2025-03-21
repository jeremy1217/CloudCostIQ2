// src/components/MockDataDashboard.tsx
import React, { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Paper,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import useMockData from '../hooks/useMockData';
import AnomalyDetection from './AnomalyDetection';
import CostForecast from './CostForecast';
import OptimizationRecommendations from './OptimizationRecommendations';

// Component to display data sections with loading states
interface DataSectionProps {
  title: string;
  isLoading?: boolean;
  children: React.ReactNode;
}

const DataSection: React.FC<DataSectionProps> = ({ title, isLoading = false, children }) => (
  <Accordion defaultExpanded>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Typography variant="h6">{title}</Typography>
      {isLoading && <CircularProgress size={20} sx={{ ml: 2 }} />}
    </AccordionSummary>
    <AccordionDetails>
      {children}
    </AccordionDetails>
  </Accordion>
);

// Component to format JSON data for display
interface JsonViewerProps {
  data: any;
  maxHeight?: string | number;
}

const JsonViewer: React.FC<JsonViewerProps> = ({ data, maxHeight = 300 }) => (
  <Box
    component="pre"
    sx={{
      maxHeight,
      overflow: 'auto',
      bgcolor: 'background.paper',
      p: 2,
      borderRadius: 1,
      border: '1px solid',
      borderColor: 'divider',
      fontSize: '0.875rem',
    }}
  >
    {JSON.stringify(data, null, 2)}
  </Box>
);

const MockDataDashboard: React.FC = () => {
  // Configure what data to load
  const [loadResources, setLoadResources] = useState(false);
  const [loadCostData, setLoadCostData] = useState(true); // Load cost data by default
  const [loadUtilization, setLoadUtilization] = useState(false);
  const [loadBudgets, setLoadBudgets] = useState(false);
  const [loadAnomalies, setLoadAnomalies] = useState(true); // Load anomalies by default
  const [loadOptimization, setLoadOptimization] = useState(true); // Load optimization by default
  const [loadForecast, setLoadForecast] = useState(true); // Load forecast by default

  // Load mock data based on configuration
  const {
    resources,
    costData,
    utilization,
    anomalies,
    budgets,
    optimization,
    forecast,
    timeSeries,
    costByProvider,
    costByService,
    
    isLoadingResources,
    isLoadingCostData,
    isLoadingUtilization,
    isLoadingAnomalies,
    isLoadingBudgets,
    isLoadingOptimization,
    isLoadingForecast,
    isLoadingTimeSeries,
  } = useMockData({
    fetchResources: loadResources,
    fetchCostData: loadCostData,
    fetchUtilization: loadUtilization,
    fetchAnomalies: loadAnomalies,
    fetchBudgets: loadBudgets,
    fetchOptimization: loadOptimization,
    fetchForecast: loadForecast,
    simulateLoading: true, // Simulate loading states
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Mock Data Dashboard
      </Typography>
      <Typography variant="body1" paragraph>
        This dashboard demonstrates the available mock data for CloudCostIQ. Toggle the data types to load and view the generated mock data.
      </Typography>

      {/* Data type toggles */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Load Data Types
        </Typography>
        <Grid container spacing={2}>
          <Grid item>
            <Button 
              variant={loadCostData ? "contained" : "outlined"} 
              onClick={() => setLoadCostData(!loadCostData)}
              color={loadCostData ? "primary" : "inherit"}
            >
              Cost Data
            </Button>
          </Grid>
          <Grid item>
            <Button 
              variant={loadResources ? "contained" : "outlined"} 
              onClick={() => setLoadResources(!loadResources)}
              color={loadResources ? "primary" : "inherit"}
            >
              Resources
            </Button>
          </Grid>
          <Grid item>
            <Button 
              variant={loadUtilization ? "contained" : "outlined"} 
              onClick={() => setLoadUtilization(!loadUtilization)}
              color={loadUtilization ? "primary" : "inherit"}
            >
              Utilization
            </Button>
          </Grid>
          <Grid item>
            <Button 
              variant={loadAnomalies ? "contained" : "outlined"} 
              onClick={() => setLoadAnomalies(!loadAnomalies)}
              color={loadAnomalies ? "primary" : "inherit"}
            >
              Anomalies
            </Button>
          </Grid>
          <Grid item>
            <Button 
              variant={loadBudgets ? "contained" : "outlined"} 
              onClick={() => setLoadBudgets(!loadBudgets)}
              color={loadBudgets ? "primary" : "inherit"}
            >
              Budgets
            </Button>
          </Grid>
          <Grid item>
            <Button 
              variant={loadOptimization ? "contained" : "outlined"} 
              onClick={() => setLoadOptimization(!loadOptimization)}
              color={loadOptimization ? "primary" : "inherit"}
            >
              Optimization
            </Button>
          </Grid>
          <Grid item>
            <Button 
              variant={loadForecast ? "contained" : "outlined"} 
              onClick={() => setLoadForecast(!loadForecast)}
              color={loadForecast ? "primary" : "inherit"}
            >
              Forecast
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* AI Components Demo */}
      <Typography variant="h5" gutterBottom>
        AI Components with Mock Data
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {loadAnomalies && (
          <Grid item xs={12} md={6}>
            <AnomalyDetection 
              anomalies={anomalies} 
              isLoading={isLoadingAnomalies} 
            />
          </Grid>
        )}
        {loadForecast && (
          <Grid item xs={12} md={6}>
            <CostForecast 
              forecastData={forecast} 
              isLoading={isLoadingForecast} 
            />
          </Grid>
        )}
        {loadOptimization && (
          <Grid item xs={12}>
            <OptimizationRecommendations
              optimizationData={optimization}
              isLoading={isLoadingOptimization}
            />
          </Grid>
        )}
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Raw Data Sections */}
      <Typography variant="h5" gutterBottom>
        Raw Mock Data
      </Typography>

      {/* Cost Data */}
      {loadCostData && (
        <DataSection title="Cost Data" isLoading={isLoadingCostData || isLoadingTimeSeries}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Cost by Provider
              </Typography>
              <JsonViewer data={costByProvider} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Cost by Service
              </Typography>
              <JsonViewer data={costByService} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Time Series Data (First 5 points shown)
              </Typography>
              <JsonViewer 
                data={timeSeries?.timestamps?.length > 0 ? {
                  timestamps: timeSeries.timestamps.slice(0, 5),
                  series: timeSeries.series.map((s: any) => ({
                    name: s.name,
                    data: s.data.slice(0, 5)
                  }))
                } : null} 
              />
            </Grid>
          </Grid>
        </DataSection>
      )}

      {/* Resources */}
      {loadResources && (
        <DataSection title="Resources" isLoading={isLoadingResources}>
          <Typography variant="subtitle1" gutterBottom>
            Sample Resources (First 3 shown)
          </Typography>
          <JsonViewer data={resources.slice(0, 3)} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Total Resources: {resources.length}
          </Typography>
        </DataSection>
      )}

      {/* Utilization */}
      {loadUtilization && (
        <DataSection title="Utilization Data" isLoading={isLoadingUtilization}>
          <Typography variant="subtitle1" gutterBottom>
            Sample Utilization Data (First 3 shown)
          </Typography>
          <JsonViewer data={utilization.slice(0, 3)} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Total Utilization Data Points: {utilization.length}
          </Typography>
        </DataSection>
      )}

      {/* Anomalies */}
      {loadAnomalies && (
        <DataSection title="Anomaly Data" isLoading={isLoadingAnomalies}>
          <JsonViewer data={anomalies} />
        </DataSection>
      )}

      {/* Budgets */}
      {loadBudgets && (
        <DataSection title="Budget Data" isLoading={isLoadingBudgets}>
          <Typography variant="subtitle1" gutterBottom>
            Sample Budgets (First 2 shown)
          </Typography>
          <JsonViewer data={budgets.slice(0, 2)} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Total Budgets: {budgets.length}
          </Typography>
        </DataSection>
      )}

      {/* Optimization */}
      {loadOptimization && (
        <DataSection title="Optimization Data" isLoading={isLoadingOptimization}>
          <Typography variant="subtitle1" gutterBottom>
            Optimization Summary
          </Typography>
          <JsonViewer 
            data={optimization ? {
              optimization_score: optimization.optimization_score,
              estimated_monthly_savings: optimization.estimated_monthly_savings,
              optimizations: {
                workload_classification: {
                  profile_count: optimization.optimizations.workload_classification?.workload_profiles.length
                },
                instance_recommendations: Object.keys(optimization.optimizations.instance_recommendations || {}),
                autoscaling: optimization.optimizations.autoscaling,
                reservations: {
                  recommendation: optimization.optimizations.reservations?.comparison.recommendation
                }
              }
            } : null} 
          />
        </DataSection>
      )}

      {/* Forecast */}
      {loadForecast && (
        <DataSection title="Forecast Data" isLoading={isLoadingForecast}>
          <Typography variant="subtitle1" gutterBottom>
            Forecast Summary (First 5 days shown)
          </Typography>
          <JsonViewer 
            data={forecast ? {
              forecast_dates: forecast.forecast_dates.slice(0, 5),
              forecast_values: forecast.forecast_values.slice(0, 5),
              lower_bound: forecast.lower_bound.slice(0, 5),
              upper_bound: forecast.upper_bound.slice(0, 5),
              confidence_level: forecast.confidence_level
            } : null} 
          />
        </DataSection>
      )}
    </Box>
  );
};

export default MockDataDashboard;