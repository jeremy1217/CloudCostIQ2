// Plan configurations and feature limits
const planFeatures = {
    starter: {
        name: 'Starter',
        price: 99,
        limits: {
            cloudAccounts: 3,
            users: 5,
            reportingHistory: 30, // days
            customReports: 5,
            apiCalls: 1000 // per day
        },
        features: {
            costAnalysis: true,
            budgetAlerts: true,
            resourceOptimization: true,
            customDashboards: false,
            roleBasedAccess: false,
            apiAccess: false,
            multiCloudSupport: false,
            aiRecommendations: false
        }
    },
    professional: {
        name: 'Professional',
        price: 299,
        limits: {
            cloudAccounts: 10,
            users: 20,
            reportingHistory: 90,
            customReports: 20,
            apiCalls: 5000
        },
        features: {
            costAnalysis: true,
            budgetAlerts: true,
            resourceOptimization: true,
            customDashboards: true,
            roleBasedAccess: true,
            apiAccess: true,
            multiCloudSupport: true,
            aiRecommendations: false
        }
    },
    enterprise: {
        name: 'Enterprise',
        price: 'Custom',
        limits: {
            cloudAccounts: 'Unlimited',
            users: 'Unlimited',
            reportingHistory: 365,
            customReports: 'Unlimited',
            apiCalls: 'Unlimited'
        },
        features: {
            costAnalysis: true,
            budgetAlerts: true,
            resourceOptimization: true,
            customDashboards: true,
            roleBasedAccess: true,
            apiAccess: true,
            multiCloudSupport: true,
            aiRecommendations: true
        }
    }
};

// Feature descriptions
const featureDescriptions = {
    costAnalysis: 'Detailed analysis of cloud spending across all services',
    budgetAlerts: 'Real-time alerts for budget overruns and anomalies',
    resourceOptimization: 'Recommendations for optimizing resource usage',
    customDashboards: 'Create and customize monitoring dashboards',
    roleBasedAccess: 'Granular access control and user permissions',
    apiAccess: 'Programmatic access through REST API',
    multiCloudSupport: 'Support for AWS, Azure, and Google Cloud',
    aiRecommendations: 'AI-powered cost optimization recommendations'
};

// Function to check if a feature is available for a plan
function isFeatureAvailable(plan, feature) {
    return planFeatures[plan]?.features[feature] || false;
}

// Function to get the limit for a specific aspect of a plan
function getPlanLimit(plan, limitType) {
    return planFeatures[plan]?.limits[limitType];
}

// Export the configurations and helper functions
export {
    planFeatures,
    featureDescriptions,
    isFeatureAvailable,
    getPlanLimit
}; 