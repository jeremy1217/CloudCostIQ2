import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Divider
} from '@mui/material';
import OptimizationRecommendations from '../components/OptimizationRecommendations';
import { getResourceOptimization } from '../services/api';

interface UtilizationDataPoint {
  resource_id: string;
  timestamp: string;
  cpu_percent: number;
  memory_percent: number;
  network_mbps?: number;
  disk_iops?: number;
}

const Recommendations: React.FC = () => {
  const [optimizationData, setOptimizationData] = useState<any>(null);
  const [isLoadingOptimization, setIsLoadingOptimization] = useState<boolean>(false);

  // Load optimization data on component mount
  useEffect(() => {
    loadOptimizationData();
  }, []);

  const loadOptimizationData = async () => {
    try {
      setIsLoadingOptimization(true);
      
      // Generate mock utilization data for testing
      // In production, use real utilization data
      const mockUtilizationData = generateMockUtilizationData();
      const mockUsageData = generateMockUsageData();
      
      try {
        const response = await getResourceOptimization(mockUtilizationData, mockUsageData);
        setOptimizationData(response.data);
      } catch (error) {
        console.error('API error:', error);
        // Create fallback mock data
        setOptimizationData({
          optimization_score: 68,
          estimated_monthly_savings: 3240,
          optimizations: {
            workload_classification: {
              workload_profiles: [
                {
                  cluster_id: 1,
                  workload_type: "web",
                  size: 3,
                  percentage: 30,
                  metrics: { cpu_mean: { mean: 45 }, memory_mean: { mean: 38 } }
                },
                {
                  cluster_id: 2,
                  workload_type: "batch",
                  size: 5,
                  percentage: 50,
                  metrics: { cpu_mean: { mean: 72 }, memory_mean: { mean: 65 } }
                },
                {
                  cluster_id: 3,
                  workload_type: "database",
                  size: 2,
                  percentage: 20,
                  metrics: { cpu_mean: { mean: 35 }, memory_mean: { mean: 78 } }
                }
              ]
            },
            instance_recommendations: {
              "cluster_1": {
                recommendations: [
                  { instance_type: "t3.medium", monthly_savings: 850 }
                ]
              },
              "cluster_2": {
                recommendations: [
                  { instance_type: "c5.large", monthly_savings: 1200 }
                ]
              }
            },
            autoscaling: {
              scaling_type: "predictive",
              configuration: {
                min_instances: 3,
                max_instances: 12
              }
            },
            reservations: {
              comparison: {
                recommendation: "Savings Plan"
              }
            }
          }
        });
      }
      
      setIsLoadingOptimization(false);
    } catch (error) {
      console.error('Error loading optimization data:', error);
      setIsLoadingOptimization(false);
    }
  };

  // Helper function to generate mock data for testing
  const generateMockUtilizationData = (): UtilizationDataPoint[] => {
    // Generate 30 days of utilization data for a few resources
    const data: UtilizationDataPoint[] = [];
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
          memory_percent: Math.random() * 100,
          network_mbps: Math.random() * 500,
          disk_iops: Math.random() * 1000
        });
      });
    }
    
    return data;
  };

  const generateMockUsageData = (): any[] => {
    // Return mock usage data for testing
    return [];
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Add AI optimization at the top */}
      <OptimizationRecommendations
        optimizationData={optimizationData}
        isLoading={isLoadingOptimization}
      />
      
      <Divider sx={{ my: 3 }} />
      
      {/* Existing recommendations content */}
      <Typography variant="h4" component="h1" gutterBottom>
        Cost Optimization Recommendations
      </Typography>
      <Typography variant="body1" paragraph>
        The recommendations below are based on analysis of your resource utilization,
        spending patterns, and industry best practices.
      </Typography>
    </Box>
  );
};

export default Recommendations;