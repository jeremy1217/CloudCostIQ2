// src/services/mockData.ts - Comprehensive mock data generator for CloudCostIQ

import { v4 as uuidv4 } from 'uuid';

// Types for the mock data
export interface CloudResource {
  id: string;
  name: string;
  type: string;
  provider: string;
  region: string;
  status: string;
  size: string;
  tags: Record<string, string>;
  monthly_cost: number;
  creation_date: string;
  last_modified: string;
}

export interface CostEntry {
  date: string;
  daily_cost: number;
  service: string;
  cloud_provider: string;
  region?: string;
  account?: string;
  tags?: Record<string, string>;
}

export interface UtilizationData {
  resource_id: string;
  timestamp: string;
  cpu_percent: number;
  memory_percent: number;
  network_mbps?: number;
  disk_iops?: number;
  instance_type?: string;
  provider?: string;
}

export interface Anomaly {
  id: string;
  date: string;
  daily_cost: number;
  service: string;
  cloud_provider: string;
  expected_cost?: number;
  percentage_increase?: number;
  severity?: 'low' | 'medium' | 'high';
  explanation?: string;
  is_anomaly: boolean;
  anomaly_score?: number;
}

export interface Budget {
  id: string;
  name: string;
  amount: number;
  period: 'monthly' | 'quarterly' | 'annual';
  resource?: string;
  resourceType?: 'service' | 'region' | 'tag' | 'account';
  threshold: number;
  currentSpend: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  lastUpdated?: string;
  createdBy?: string;
  status?: 'active' | 'inactive' | 'archived';
  notes?: string;
  alertChannels?: string[];
  history?: { date: string; spend: number }[];
  forecast?: number;
  favorite?: boolean;
  tags?: string[];
}

export interface ForecastData {
  forecast_dates: string[];
  forecast_values: number[];
  lower_bound: number[];
  upper_bound: number[];
  confidence_level: number;
}

export interface OptimizationData {
  optimization_score: number;
  estimated_monthly_savings: number;
  optimizations: {
    workload_classification?: {
      workload_profiles: Array<{
        cluster_id: number;
        workload_type: string;
        size: number;
        percentage: number;
        metrics: Record<string, any>;
      }>;
    };
    instance_recommendations?: Record<string, {
      recommendations: Array<{
        instance_type: string;
        monthly_savings: number;
        current_instance?: string;
      }>;
    }>;
    autoscaling?: {
      scaling_type: string;
      configuration: {
        min_instances: number;
        max_instances: number;
      };
    };
    reservations?: {
      comparison: {
        recommendation: 'Savings Plan' | 'Reserved Instances';
        reserved_instances?: {
          monthly_savings: number;
          monthly_commitment: number;
        };
        savings_plan?: {
          monthly_savings: number;
          monthly_commitment: number;
        };
      };
    };
  };
}

// Utility to generate dates in ISO format
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Get a date N days ago/ahead
const getRelativeDate = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

// Generate consistent random number based on seed
const seededRandom = (seed: number): () => number => {
  return () => {
    // Simple LCG random number generator
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
};

// Constants for mock data
const CLOUD_PROVIDERS = ['AWS', 'Azure', 'GCP'];
const AWS_REGIONS = ['us-east-1', 'us-west-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'];
const AZURE_REGIONS = ['eastus', 'westus', 'westeurope', 'southeastasia', 'centralus'];
const GCP_REGIONS = ['us-central1', 'us-east1', 'us-west1', 'europe-west1', 'asia-east1'];

const AWS_SERVICES = ['EC2', 'S3', 'RDS', 'Lambda', 'ECS', 'DynamoDB', 'ELB', 'CloudFront'];
const AZURE_SERVICES = ['Virtual Machines', 'Storage', 'SQL Database', 'Functions', 'App Service', 'Cosmos DB', 'Load Balancer', 'CDN'];
const GCP_SERVICES = ['Compute Engine', 'Cloud Storage', 'Cloud SQL', 'Cloud Functions', 'GKE', 'Bigtable', 'Load Balancing', 'CDN'];

const RESOURCE_TYPES = {
  AWS: {
    'EC2': ['t3.micro', 't3.small', 't3.medium', 't3.large', 'm5.large', 'm5.xlarge', 'c5.large', 'c5.xlarge', 'r5.large', 'r5.xlarge'],
    'S3': ['Standard', 'Intelligent-Tiering', 'Standard-IA', 'One Zone-IA', 'Glacier', 'Glacier Deep Archive'],
    'RDS': ['db.t3.micro', 'db.t3.small', 'db.m5.large', 'db.m5.xlarge', 'db.r5.large', 'db.r5.xlarge'],
  },
  Azure: {
    'Virtual Machines': ['B1s', 'B2s', 'D2s_v3', 'D4s_v3', 'E2s_v3', 'E4s_v3', 'F2s_v2', 'F4s_v2'],
    'Storage': ['LRS', 'ZRS', 'GRS', 'RA-GRS', 'GZRS', 'RA-GZRS'],
    'SQL Database': ['Basic', 'Standard', 'Premium', 'General Purpose', 'Business Critical', 'Hyperscale'],
  },
  GCP: {
    'Compute Engine': ['e2-micro', 'e2-small', 'e2-medium', 'n1-standard-1', 'n1-standard-2', 'n1-standard-4', 'c2-standard-4', 'c2-standard-8'],
    'Cloud Storage': ['Standard', 'Nearline', 'Coldline', 'Archive'],
    'Cloud SQL': ['db-f1-micro', 'db-g1-small', 'db-custom-2-4096', 'db-custom-4-8192'],
  }
};

// Resource statuses
const STATUSES = ['running', 'stopped', 'terminated', 'pending'];

// Tags for resources
const TAG_KEYS = ['Environment', 'Project', 'Department', 'Owner', 'CostCenter'];
const TAG_VALUES = {
  Environment: ['Production', 'Development', 'Staging', 'Testing', 'QA'],
  Project: ['E-commerce', 'CRM', 'DataWarehouse', 'API', 'Mobile', 'Web'],
  Department: ['Engineering', 'Marketing', 'Finance', 'Sales', 'HR', 'Operations'],
  Owner: ['john.doe', 'jane.smith', 'dev.team', 'ops.team', 'admin'],
  CostCenter: ['CC-1001', 'CC-1002', 'CC-2001', 'CC-3001', 'CC-4001'],
};

/**
 * Mock Data Service for CloudCostIQ
 */
class MockDataService {
  private resources: CloudResource[] = [];
  private costData: CostEntry[] = [];
  private utilizationData: UtilizationData[] = [];
  private anomalyData: Anomaly[] = [];
  private budgets: Budget[] = [];
  private optimizationData: OptimizationData | null = null;

  constructor() {
    this.initializeData();
  }

  /**
   * Initialize all mock data
   */
  private initializeData(): void {
    this.generateResources();
    this.generateCostData();
    this.generateUtilizationData();
    this.generateAnomalies();
    this.generateBudgets();
    this.generateOptimizationData();
  }

  /**
   * Generate mock cloud resources
   */
  private generateResources(count: number = 50): void {
    this.resources = [];
    const randomSeed = Date.now();
    const random = seededRandom(randomSeed);
  
    for (let i = 0; i < count; i++) {
      // Distribute resources across providers
      const providerIndex = Math.floor(random() * CLOUD_PROVIDERS.length);
      const provider = CLOUD_PROVIDERS[providerIndex];
      
      let region, service, resourceType;
      
      // Select appropriate region and service based on provider
      if (provider === 'AWS') {
        region = AWS_REGIONS[Math.floor(random() * AWS_REGIONS.length)];
        service = AWS_SERVICES[Math.floor(random() * AWS_SERVICES.length)];
        
        // Select resource type based on service, default to first type if service not found
        const serviceTypes = (RESOURCE_TYPES.AWS as any)[service] || RESOURCE_TYPES.AWS['EC2'];
        resourceType = serviceTypes[Math.floor(random() * serviceTypes.length)];
      } else if (provider === 'Azure') {
        region = AZURE_REGIONS[Math.floor(random() * AZURE_REGIONS.length)];
        service = AZURE_SERVICES[Math.floor(random() * AZURE_SERVICES.length)];
        
        const serviceTypes = (RESOURCE_TYPES.Azure as any)[service] || RESOURCE_TYPES.Azure['Virtual Machines'];
        resourceType = serviceTypes[Math.floor(random() * serviceTypes.length)];
      } else {
        region = GCP_REGIONS[Math.floor(random() * GCP_REGIONS.length)];
        service = GCP_SERVICES[Math.floor(random() * GCP_SERVICES.length)];
        
        const serviceTypes = (RESOURCE_TYPES.GCP as any)[service] || RESOURCE_TYPES.GCP['Compute Engine'];
        resourceType = serviceTypes[Math.floor(random() * serviceTypes.length)];
      }
      
      // Generate resource ID with provider-specific format
      let resourceId;
      if (provider === 'AWS') {
        resourceId = service === 'EC2' ? `i-${Math.random().toString(36).substring(2, 10)}` :
                     service === 'S3' ? `bucket-${Math.random().toString(36).substring(2, 10)}` :
                     `res-${Math.random().toString(36).substring(2, 10)}`;
      } else if (provider === 'Azure') {
        resourceId = `/subscriptions/sub-${Math.random().toString(36).substring(2, 8)}/resourceGroups/rg-${Math.random().toString(36).substring(2, 6)}/providers/Microsoft.${service.replace(' ', '')}/res-${Math.random().toString(36).substring(2, 6)}`;
      } else {
        resourceId = `${service.toLowerCase().replace(' ', '-')}-${Math.random().toString(36).substring(2, 10)}`;
      }
      
      // Generate creation date (between 1 and 365 days ago)
      const creationDaysAgo = Math.floor(random() * 365) + 1;
      const creationDate = getRelativeDate(-creationDaysAgo);
      
      // Generate last modified date (between creation date and now)
      const daysAfterCreation = Math.floor(random() * creationDaysAgo);
      const lastModifiedDate = getRelativeDate(-creationDaysAgo + daysAfterCreation);
      
      // Generate monthly cost based on service and resource type
      let monthlyCost;
      if (service.includes('EC2') || service.includes('Virtual Machines') || service.includes('Compute Engine')) {
        // Size-based pricing for compute
        monthlyCost = resourceType.includes('micro') || resourceType.includes('t3.') || resourceType.includes('small') ?
          10 + (random() * 50) : // Small instances
          resourceType.includes('medium') || resourceType.includes('large') ?
          50 + (random() * 150) : // Medium instances
          200 + (random() * 800); // Large instances
      } else if (service.includes('S3') || service.includes('Storage') || service.includes('Cloud Storage')) {
        // Storage costs less but varies by tier
        monthlyCost = resourceType.includes('Standard') ?
          30 + (random() * 100) : // Standard storage
          resourceType.includes('IA') || resourceType.includes('Nearline') ?
          15 + (random() * 50) : // Infrequent access
          5 + (random() * 20); // Archive storage
      } else if (service.includes('RDS') || service.includes('SQL') || service.includes('Database')) {
        // Databases cost more
        monthlyCost = 100 + (random() * 500);
      } else {
        // Generic cost for other services
        monthlyCost = 20 + (random() * 200);
      }
      
      // Generate random tags
      const numTags = Math.floor(random() * 3) + 1; // 1-3 tags
      const tags: Record<string, string> = {};
      
      for (let j = 0; j < numTags; j++) {
        const tagKey = TAG_KEYS[Math.floor(random() * TAG_KEYS.length)];
        const possibleValues = TAG_VALUES[tagKey as keyof typeof TAG_VALUES];
        tags[tagKey] = possibleValues[Math.floor(random() * possibleValues.length)];
      }
      
      // Create resource
      const resource: CloudResource = {
        id: resourceId,
        name: `${service.toLowerCase().replace(' ', '-')}-${Math.random().toString(36).substring(2, 6)}`,
        type: service,
        provider,
        region,
        status: STATUSES[Math.floor(random() * STATUSES.length)],
        size: resourceType,
        tags,
        monthly_cost: parseFloat(monthlyCost.toFixed(2)),
        creation_date: formatDate(creationDate),
        last_modified: formatDate(lastModifiedDate),
      };
      
      this.resources.push(resource);
    }
  }

  /**
   * Generate historical cost data
   */
  private generateCostData(days: number = 90): void {
    this.costData = [];
    const endDate = new Date();
    
    // Create base cost trends
    // For each cloud provider and service
    CLOUD_PROVIDERS.forEach(provider => {
      const services = provider === 'AWS' ? AWS_SERVICES :
                       provider === 'Azure' ? AZURE_SERVICES :
                       GCP_SERVICES;
      
      // Generate cost for each service
      services.forEach(service => {
        // Generate base monthly cost for this service
        const baseCost = provider === 'AWS' ? 1000 + Math.random() * 2000 :
                         provider === 'Azure' ? 800 + Math.random() * 1500 :
                         500 + Math.random() * 1000;
        
        // Create daily entries
        for (let i = 0; i < days; i++) {
          const date = new Date(endDate);
          date.setDate(date.getDate() - days + i + 1);
          const dateStr = formatDate(date);
          
          // Apply various cost patterns
          // 1. Day of week pattern (weekends lower)
          const dayOfWeek = date.getDay(); // 0 is Sunday, 6 is Saturday
          const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.7 : 1.0;
          
          // 2. Monthly pattern (higher at month end)
          const dayOfMonth = date.getDate();
          const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
          const monthEndFactor = dayOfMonth > daysInMonth - 5 ? 1.2 : 1.0;
          
          // 3. General upward trend (5% growth per month)
          const monthIndex = date.getMonth() + (date.getFullYear() - endDate.getFullYear()) * 12;
          const trendFactor = 1.0 + (monthIndex * 0.05);
          
          // 4. Random daily fluctuation
          const randomFactor = 0.9 + (Math.random() * 0.2); // 0.9 to 1.1
          
          // 5. Create occasional spikes
          const spikeProbability = 0.02; // 2% chance of a spike
          const spikeFactor = Math.random() < spikeProbability ? 2.0 + Math.random() * 3.0 : 1.0;
          
          // Calculate daily cost
          let dailyCost = (baseCost / 30) * weekendFactor * monthEndFactor * trendFactor * randomFactor * spikeFactor;
          
          // Ensure cost is positive and reasonable
          dailyCost = Math.max(dailyCost, 10);
          
          this.costData.push({
            date: dateStr,
            daily_cost: parseFloat(dailyCost.toFixed(2)),
            service,
            cloud_provider: provider
          });
        }
      });
    });
  }

  /**
   * Generate resource utilization data
   */
  private generateUtilizationData(days: number = 30): void {
    this.utilizationData = [];
    const endDate = new Date();
    
    // Generate data for each resource
    this.resources.forEach(resource => {
      // Only generate utilization for active resources
      if (resource.status === 'running') {
        // Define base utilization based on resource type
        let baseCpuUtil = 0;
        let baseMemoryUtil = 0;
        
        // Compute resources tend to have varying utilization
        if (resource.type.includes('EC2') || 
            resource.type.includes('Virtual Machines') || 
            resource.type.includes('Compute Engine')) {
          
          // Small instances often have higher utilization
          if (resource.size.includes('micro') || resource.size.includes('small')) {
            baseCpuUtil = 50 + Math.random() * 30; // 50-80%
            baseMemoryUtil = 60 + Math.random() * 25; // 60-85%
          } else if (resource.size.includes('medium') || resource.size.includes('large')) {
            baseCpuUtil = 30 + Math.random() * 40; // 30-70%
            baseMemoryUtil = 40 + Math.random() * 30; // 40-70%
          } else {
            // Larger instances often have lower utilization (overprovisioned)
            baseCpuUtil = 10 + Math.random() * 30; // 10-40%
            baseMemoryUtil = 20 + Math.random() * 40; // 20-60%
          }
        } 
        // Database instances often have higher memory utilization
        else if (resource.type.includes('RDS') || 
                 resource.type.includes('SQL') || 
                 resource.type.includes('Database')) {
          baseCpuUtil = 30 + Math.random() * 20; // 30-50%
          baseMemoryUtil = 60 + Math.random() * 30; // 60-90%
        }
        // Storage has low CPU utilization
        else if (resource.type.includes('S3') || 
                 resource.type.includes('Storage')) {
          baseCpuUtil = 5 + Math.random() * 10; // 5-15%
          baseMemoryUtil = 10 + Math.random() * 20; // 10-30%
        }
        // Default for other resources
        else {
          baseCpuUtil = 20 + Math.random() * 30; // 20-50%
          baseMemoryUtil = 30 + Math.random() * 40; // 30-70%
        }
        
        // Generate hourly data for the specified days
        for (let i = 0; i < days; i++) {
          const date = new Date(endDate);
          date.setDate(date.getDate() - days + i + 1);
          
          // Generate 4 data points per day (every 6 hours)
          for (let hour = 0; hour < 24; hour += 6) {
            date.setHours(hour);
            
            // Time-based patterns
            const hourFactor = (hour >= 8 && hour <= 18) ? 1.2 : 0.8; // Higher during business hours
            const dayOfWeek = date.getDay();
            const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.6 : 1.0; // Lower on weekends
            
            // Random fluctuation
            const randomFactor = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2
            
            // Calculate utilization
            let cpuPercent = baseCpuUtil * hourFactor * weekendFactor * randomFactor;
            let memoryPercent = baseMemoryUtil * hourFactor * weekendFactor * (0.9 + Math.random() * 0.2);
            
            // Cap values
            cpuPercent = Math.min(Math.max(cpuPercent, 1), 99);
            memoryPercent = Math.min(Math.max(memoryPercent, 5), 99);
            
            // Add some network and disk metrics based on CPU/memory usage
            const networkMbps = cpuPercent * (1 + Math.random());
            const diskIops = memoryPercent * (0.5 + Math.random() * 2);
            
            this.utilizationData.push({
              resource_id: resource.id,
              timestamp: date.toISOString(),
              cpu_percent: parseFloat(cpuPercent.toFixed(1)),
              memory_percent: parseFloat(memoryPercent.toFixed(1)),
              network_mbps: parseFloat(networkMbps.toFixed(1)),
              disk_iops: parseFloat(diskIops.toFixed(1)),
              instance_type: resource.size,
              provider: resource.provider
            });
          }
        }
      }
    });
  }

  /**
   * Generate cost anomalies
   */
  private generateAnomalies(count: number = 5): void {
    // Look at cost data and find the highest increases
    const anomalies: Anomaly[] = [];
    const sortedData = [...this.costData].sort((a, b) => b.daily_cost - a.daily_cost);
    
    // Take the top N highest costs as potential anomalies
    for (let i = 0; i < count * 2 && i < sortedData.length; i++) {
      const costEntry = sortedData[i];
      
      // Find the previous day's cost for this service/provider
      const dateObj = new Date(costEntry.date);
      dateObj.setDate(dateObj.getDate() - 1);
      const prevDate = formatDate(dateObj);
      
      const prevDayCost = this.costData.find(
        entry => entry.date === prevDate && 
                entry.service === costEntry.service && 
                entry.cloud_provider === costEntry.cloud_provider
      );
      
      if (prevDayCost) {
        const percentageIncrease = (costEntry.daily_cost / prevDayCost.daily_cost - 1) * 100;
        
        // Only add if increase is significant
        if (percentageIncrease > 25) {
          anomalies.push({
            id: `anomaly-${uuidv4().substring(0, 8)}`,
            date: costEntry.date,
            daily_cost: costEntry.daily_cost,
            service: costEntry.service,
            cloud_provider: costEntry.cloud_provider,
            expected_cost: prevDayCost.daily_cost,
            percentage_increase: parseFloat(percentageIncrease.toFixed(1)),
            severity: percentageIncrease > 100 ? 'high' : percentageIncrease > 50 ? 'medium' : 'low',
            explanation: `Unusual increase in ${costEntry.service} spending. Expected around $${prevDayCost.daily_cost.toFixed(2)} based on historical patterns.`,
            is_anomaly: true,
            anomaly_score: 0.8 + (Math.random() * 0.2)
          });
        }
      }
    }
    
    // Only keep the requested number of anomalies
    this.anomalyData = anomalies.slice(0, count);
  }

  /**
   * Generate budgets based on cost data
   */
  private generateBudgets(count: number = 5): void {
    this.budgets = [];
    
    // Group cost data by provider and service
    const costByProviderService: Record<string, Record<string, number>> = {};
    
    CLOUD_PROVIDERS.forEach(provider => {
      costByProviderService[provider] = {};
      
      const services = provider === 'AWS' ? AWS_SERVICES :
                      provider === 'Azure' ? AZURE_SERVICES :
                      GCP_SERVICES;
      
      services.forEach(service => {
        const entries = this.costData.filter(entry => 
          entry.cloud_provider === provider && entry.service === service
        );
        
        if (entries.length > 0) {
          const totalCost = entries.reduce((sum, entry) => sum + entry.daily_cost, 0);
          costByProviderService[provider][service] = totalCost;
        }
      });
    });
    
    // Create budgets based on historical cost
    let budgetId = 1;
    
    // Create a budget for each provider
    CLOUD_PROVIDERS.forEach(provider => {
      const serviceEntries = Object.entries(costByProviderService[provider]).sort((a, b) => b[1] - a[1]);
      
      // Take top services by cost
      for (let i = 0; i < 2 && i < serviceEntries.length; i++) {
        const [service, totalCost] = serviceEntries[i];
        const monthlyCost = totalCost / 3; // Assuming 90 days of data = 3 months
        
        // Create a monthly budget
        const monthlyCeil = Math.ceil(monthlyCost / 1000) * 1000; // Round up to nearest thousand
        const budgetAmount = monthlyCeil * (1 + Math.random() * 0.2); // Add 0-20% buffer
        
        // Start and end dates for the month
        const startDate = new Date();
        startDate.setDate(1); // First day of month
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0); // Last day of month
        
        // Budget history - 5 entries spanning the month
        const history = [];
        const daysInMonth = endDate.getDate();
        const currentDay = new Date().getDate();
        const currentProgress = currentDay / daysInMonth;
        
        // Generate budget history based on current progress through the month
        for (let j = 1; j <= 5; j++) {
          const progress = Math.min(j / 5, currentProgress);
          const historyDate = new Date(startDate);
          historyDate.setDate(Math.ceil(progress * daysInMonth));
          
          // Spend progresses through the month, with some random variation
          const spend = budgetAmount * progress * (0.9 + Math.random() * 0.2);
          
          if (historyDate <= new Date()) {
            history.push({
              date: formatDate(historyDate),
              spend: parseFloat(spend.toFixed(2))
            });
          }
        }
        
        // Current spend based on day of month
        const currentSpend = budgetAmount * currentProgress * (0.9 + Math.random() * 0.2);
        
        // Forecast based on current spending rate
        const forecastRatio = currentSpend / (budgetAmount * currentProgress);
        const forecast = budgetAmount * forecastRatio;
        
        this.budgets.push({
          id: budgetId.toString(),
          name: `${service} Monthly Budget`,
          amount: parseFloat(budgetAmount.toFixed(2)),
          period: 'monthly',
          resource: service,
          resourceType: 'service',
          threshold: 80,
          currentSpend: parseFloat(currentSpend.toFixed(2)),
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
          createdAt: formatDate(new Date(startDate.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000)),
          lastUpdated: formatDate(new Date()),
          createdBy: ['John Doe', 'Jane Smith', 'Admin User'][Math.floor(Math.random() * 3)],
          status: 'active',
          alertChannels: ['email'],
          history,
          forecast: parseFloat(forecast.toFixed(2)),
          favorite: Math.random() > 0.7, // 30% chance of being a favorite
          tags: ['budget', provider.toLowerCase(), service.toLowerCase().replace(' ', '-')]
        });
        
        budgetId++;
      }
    });
    
    // Create a few account or region budgets
    const regions = [...AWS_REGIONS, ...AZURE_REGIONS, ...GCP_REGIONS];
    for (let i = 0; i < 2; i++) {
      const provider = CLOUD_PROVIDERS[Math.floor(Math.random() * CLOUD_PROVIDERS.length)];
      const totalProviderCost = Object.values(costByProviderService[provider]).reduce((sum, cost) => sum + cost, 0);
      const monthlyCost = totalProviderCost / 3; // Assuming 90 days = 3 months
      
      // Either region or account budget
      const isRegionBudget = Math.random() > 0.5;
      
      // Budget amount with buffer
      const monthlyCeil = Math.ceil(monthlyCost / 5000) * 5000; // Round up to nearest 5000
      const budgetAmount = monthlyCeil * (1 + Math.random() * 0.3); // Add 0-30% buffer
      
      // Start and end dates for the quarter
      const startDate = new Date();
      startDate.setDate(1); // First day of month
      startDate.setMonth(Math.floor(startDate.getMonth() / 3) * 3); // First month of quarter
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 3); // 3 months later
      endDate.setDate(0); // Last day of the month
      
      // Current spend
      const daysPassed = Math.min(
        (new Date().getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000),
        (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)
      );
      const totalDays = (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000);
      const progress = daysPassed / totalDays;
      
      const currentSpend = budgetAmount * progress * (0.8 + Math.random() * 0.4);
      
      // Budget history - 5 entries spanning the quarter
      const history = [];
      
      for (let j = 1; j <= 5; j++) {
        const entryProgress = Math.min(j / 5, progress);
        const historyDate = new Date(startDate);
        historyDate.setDate(startDate.getDate() + Math.ceil(entryProgress * totalDays));
        
        if (historyDate <= new Date()) {
          const spend = budgetAmount * entryProgress * (0.9 + Math.random() * 0.2);
          
          history.push({
            date: formatDate(historyDate),
            spend: parseFloat(spend.toFixed(2))
          });
        }
      }
      
      // Forecast
      const forecastRatio = progress > 0.1 ? currentSpend / (budgetAmount * progress) : 1;
      const forecast = budgetAmount * forecastRatio;
      
      const resourceValue = isRegionBudget ? 
                          regions[Math.floor(Math.random() * regions.length)] :
                          ["Development", "Production", "Testing", "Staging"][Math.floor(Math.random() * 4)];
      
      this.budgets.push({
        id: budgetId.toString(),
        name: isRegionBudget ? `${resourceValue} Region Budget` : `${resourceValue} Account Budget`,
        amount: parseFloat(budgetAmount.toFixed(2)),
        period: 'quarterly',
        resource: resourceValue,
        resourceType: isRegionBudget ? 'region' : 'account',
        threshold: 80,
        currentSpend: parseFloat(currentSpend.toFixed(2)),
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        createdAt: formatDate(new Date(startDate.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000)),
        lastUpdated: formatDate(new Date()),
        createdBy: ['John Doe', 'Jane Smith', 'Admin User'][Math.floor(Math.random() * 3)],
        status: 'active',
        alertChannels: ['email'],
        history,
        forecast: parseFloat(forecast.toFixed(2)),
        favorite: Math.random() > 0.7,
        tags: ['budget', provider.toLowerCase(), isRegionBudget ? 'region' : 'account']
      });
      
      budgetId++;
    }
  }

  /**
   * Generate optimization data based on resources and utilization
   */
  private generateOptimizationData(): void {
    // Group resources by instance type to find optimization opportunities
    const instancesByType: Record<string, CloudResource[]> = {};
    
    this.resources.forEach(resource => {
      if (resource.type.includes('EC2') || 
          resource.type.includes('Virtual Machines') || 
          resource.type.includes('Compute Engine')) {
        
        if (!instancesByType[resource.size]) {
          instancesByType[resource.size] = [];
        }
        
        instancesByType[resource.size].push(resource);
      }
    });
    
    // Find underutilized instances
    const underutilizedInstances: Record<string, CloudResource[]> = {};
    
    Object.entries(instancesByType).forEach(([instanceType, resources]) => {
      underutilizedInstances[instanceType] = [];
      
      resources.forEach(resource => {
        // Check utilization data for this resource
        const utilData = this.utilizationData.filter(u => u.resource_id === resource.id);
        
        if (utilData.length > 0) {
          // Calculate average CPU and memory utilization
          const avgCpu = utilData.reduce((sum, u) => sum + u.cpu_percent, 0) / utilData.length;
          const avgMemory = utilData.reduce((sum, u) => sum + u.memory_percent, 0) / utilData.length;
          
          // Consider underutilized if both CPU and memory are below thresholds
          if (avgCpu < 30 && avgMemory < 40) {
            underutilizedInstances[instanceType].push(resource);
          }
        }
      });
    });
    
    // Create workload profiles
    const workloadProfiles = [
      {
        cluster_id: 1,
        workload_type: "web",
        size: Math.floor(Math.random() * 10) + 5,
        percentage: 35,
        metrics: {
          cpu_mean: { mean: 25 + Math.random() * 15 },
          memory_mean: { mean: 30 + Math.random() * 20 },
          cpu_std: { mean: 5 + Math.random() * 5 }
        }
      },
      {
        cluster_id: 2,
        workload_type: "batch",
        size: Math.floor(Math.random() * 8) + 3,
        percentage: 25,
        metrics: {
          cpu_mean: { mean: 45 + Math.random() * 25 },
          memory_mean: { mean: 35 + Math.random() * 20 },
          cpu_std: { mean: 15 + Math.random() * 10 }
        }
      },
      {
        cluster_id: 3,
        workload_type: "database",
        size: Math.floor(Math.random() * 5) + 2,
        percentage: 20,
        metrics: {
          cpu_mean: { mean: 20 + Math.random() * 15 },
          memory_mean: { mean: 65 + Math.random() * 20 },
          cpu_std: { mean: 10 + Math.random() * 5 }
        }
      },
      {
        cluster_id: 4,
        workload_type: "api",
        size: Math.floor(Math.random() * 7) + 3,
        percentage: 20,
        metrics: {
          cpu_mean: { mean: 35 + Math.random() * 20 },
          memory_mean: { mean: 45 + Math.random() * 15 },
          cpu_std: { mean: 12 + Math.random() * 8 }
        }
      }
    ];
    
    // Create instance recommendations
    const instanceRecommendations: Record<string, {
      recommendations: Array<{
        instance_type: string;
        monthly_savings: number;
        current_instance?: string;
      }>;
    }> = {};
    
    // Add recommendations for each cluster
    workloadProfiles.forEach(profile => {
      const clusterKey = `cluster_${profile.cluster_id}`;
      instanceRecommendations[clusterKey] = {
        recommendations: []
      };
      
      // Compute instances
      if (profile.workload_type === "web" || profile.workload_type === "api") {
        instanceRecommendations[clusterKey].recommendations.push({
          instance_type: profile.workload_type === "web" ? "t3.medium" : "t3.large",
          monthly_savings: 500 + Math.random() * 1000,
          current_instance: profile.workload_type === "web" ? "m5.xlarge" : "m5.2xlarge"
        });
      } 
      // Database instances
      else if (profile.workload_type === "database") {
        instanceRecommendations[clusterKey].recommendations.push({
          instance_type: "r5.large",
          monthly_savings: 300 + Math.random() * 800,
          current_instance: "r5.xlarge"
        });
      }
      // Batch processing
      else if (profile.workload_type === "batch") {
        instanceRecommendations[clusterKey].recommendations.push({
          instance_type: "c5.xlarge",
          monthly_savings: 400 + Math.random() * 600,
          current_instance: "c5.2xlarge"
        });
      }
    });
    
    // Calculate estimated savings
    const totalResourcesSavings = Object.values(instanceRecommendations)
      .flatMap(r => r.recommendations)
      .reduce((sum, rec) => sum + rec.monthly_savings, 0);
    
    // Create reservations comparison
    const reservationSavings = 1000 + Math.random() * 2000;
    const reservationCommitment = 4000 + Math.random() * 3000;
    
    const savingsPlanSavings = reservationSavings * (1 + 0.1 + Math.random() * 0.2);
    const savingsPlanCommitment = reservationCommitment * (1 - 0.05 - Math.random() * 0.1);
    
    const estimatedMonthlySavings = totalResourcesSavings + Math.max(reservationSavings, savingsPlanSavings);
    
    // Create optimization data
    this.optimizationData = {
      optimization_score: 65 + Math.random() * 20,
      estimated_monthly_savings: parseFloat(estimatedMonthlySavings.toFixed(2)),
      optimizations: {
        workload_classification: {
          workload_profiles: workloadProfiles
        },
        instance_recommendations: instanceRecommendations,
        autoscaling: {
          scaling_type: Math.random() > 0.5 ? "target_tracking" : "predictive",
          configuration: {
            min_instances: 2 + Math.floor(Math.random() * 3),
            max_instances: 8 + Math.floor(Math.random() * 8)
          }
        },
        reservations: {
          comparison: {
            recommendation: savingsPlanSavings > reservationSavings ? "Savings Plan" : "Reserved Instances",
            reserved_instances: {
              monthly_savings: parseFloat(reservationSavings.toFixed(2)),
              monthly_commitment: parseFloat(reservationCommitment.toFixed(2))
            },
            savings_plan: {
              monthly_savings: parseFloat(savingsPlanSavings.toFixed(2)),
              monthly_commitment: parseFloat(savingsPlanCommitment.toFixed(2))
            }
          }
        }
      }
    };
  }

  /**
   * Generate forecast data
   */
  public generateForecastData(
    costData: CostEntry[] = this.costData,
    days: number = 30
  ): ForecastData {
    if (costData.length === 0) {
      throw new Error("No cost data available for forecasting");
    }
    
    // Get the last data point
    const sortedData = [...costData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastEntry = sortedData[0];
    const lastDate = new Date(lastEntry.date);
    const lastCost = lastEntry.daily_cost;
    
    // Create forecast dates, values, and confidence intervals
    const forecastDates: string[] = [];
    const forecastValues: number[] = [];
    const lowerBound: number[] = [];
    const upperBound: number[] = [];
    
    // Calculate a simple trend factor from historical data
    const recentData = sortedData.slice(0, 30); // Last 30 days
    const oldestRecentDate = new Date(recentData[recentData.length - 1].date);
    const daysDifference = (lastDate.getTime() - oldestRecentDate.getTime()) / (24 * 60 * 60 * 1000);
    
    const oldestRecentCost = recentData[recentData.length - 1].daily_cost;
    const trendFactor = lastCost / oldestRecentCost;
    const dailyTrend = Math.pow(trendFactor, 1 / daysDifference);
    
    // Generate forecast with increasing uncertainty
    for (let i = 1; i <= days; i++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(lastDate.getDate() + i);
      forecastDates.push(formatDate(forecastDate));
      
      // Apply trend factor with some randomness
      const trendValue = lastCost * Math.pow(dailyTrend, i);
      const randomFactor = 0.95 + (Math.random() * 0.1); // 0.95 to 1.05
      const forecastValue = trendValue * randomFactor;
      
      forecastValues.push(parseFloat(forecastValue.toFixed(2)));
      
      // Create wider confidence intervals for later dates
      const uncertainty = 0.05 + (i / days) * 0.15; // 5-20% uncertainty
      lowerBound.push(parseFloat((forecastValue * (1 - uncertainty)).toFixed(2)));
      upperBound.push(parseFloat((forecastValue * (1 + uncertainty)).toFixed(2)));
    }
    
    return {
      forecast_dates: forecastDates,
      forecast_values: forecastValues,
      lower_bound: lowerBound,
      upper_bound: upperBound,
      confidence_level: 0.9
    };
  }

  /**
   * Public methods to access mock data
   */
  public getResources(): CloudResource[] {
    return this.resources;
  }

  public getCostData(): CostEntry[] {
    return this.costData;
  }

  public getUtilizationData(): UtilizationData[] {
    return this.utilizationData;
  }

  public getAnomalies(): Anomaly[] {
    return this.anomalyData;
  }

  public getBudgets(): Budget[] {
    return this.budgets;
  }
  
  public getOptimizationData(): OptimizationData | null {
    return this.optimizationData;
  }
  
  /**
   * Get cost data aggregated by different dimensions
   */
  public getCostByProvider(): Record<string, number> {
    const result: Record<string, number> = {};
    
    CLOUD_PROVIDERS.forEach(provider => {
      const providerCosts = this.costData.filter(entry => entry.cloud_provider === provider);
      result[provider] = providerCosts.reduce((sum, entry) => sum + entry.daily_cost, 0);
    });
    
    return result;
  }
  
  public getCostByService(): Record<string, number> {
    const result: Record<string, number> = {};
    
    // Get all unique services
    const services = new Set<string>();
    this.costData.forEach(entry => services.add(entry.service));
    
    // Calculate cost for each service
    Array.from(services).forEach(service => {
      const serviceCosts = this.costData.filter(entry => entry.service === service);
      result[service] = serviceCosts.reduce((sum, entry) => sum + entry.daily_cost, 0);
    });
    
    return result;
  }
  
  public getCostTimeSeries(days: number = 30, groupBy: 'provider' | 'service' | 'daily' = 'provider'): any {
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);
    
    // Filter data for the requested time period
    const filteredData = this.costData.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate && entryDate <= endDate;
    });
    
    // Get all dates in the range
    const dateStrings: string[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dateStrings.push(formatDate(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Group by provider
    if (groupBy === 'provider') {
      const result = {
        timestamps: dateStrings,
        series: CLOUD_PROVIDERS.map(provider => {
          return {
            name: provider,
            data: dateStrings.map(date => {
              const dateEntries = filteredData.filter(
                entry => entry.date === date && entry.cloud_provider === provider
              );
              
              return parseFloat(dateEntries.reduce((sum, entry) => sum + entry.daily_cost, 0).toFixed(2));
            })
          };
        })
      };
      
      return result;
    }
    
    // Group by service
    else if (groupBy === 'service') {
      // Get all services
      const services = new Set<string>();
      filteredData.forEach(entry => services.add(entry.service));
      
      const result = {
        timestamps: dateStrings,
        series: Array.from(services).map(service => {
          return {
            name: service,
            data: dateStrings.map(date => {
              const dateEntries = filteredData.filter(
                entry => entry.date === date && entry.service === service
              );
              
              return parseFloat(dateEntries.reduce((sum, entry) => sum + entry.daily_cost, 0).toFixed(2));
            })
          };
        })
      };
      
      return result;
    }
    
    // Daily total
    else {
      const result = {
        timestamps: dateStrings,
        series: [{
          name: 'Total Cost',
          data: dateStrings.map(date => {
            const dateEntries = filteredData.filter(entry => entry.date === date);
            return parseFloat(dateEntries.reduce((sum, entry) => sum + entry.daily_cost, 0).toFixed(2));
          })
        }]
      };
      
      return result;
    }
  }
}

// Export singleton instance
const mockDataService = new MockDataService();
export default mockDataService;