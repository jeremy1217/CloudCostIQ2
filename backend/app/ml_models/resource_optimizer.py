import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
import json

@dataclass
class InstanceType:
    """Class representing cloud instance type information."""
    name: str
    vcpus: int
    memory_gb: float
    price_per_hour: float
    provider: str
    family: str
    generation: int
    
    def get_sizing_ratio(self) -> float:
        """Get the ratio of price to resources."""
        return self.price_per_hour / (self.vcpus * self.memory_gb)

class ResourceOptimizer:
    """Class for optimizing resource sizing across cloud providers."""
    
    def __init__(self, instance_types: Optional[List[InstanceType]] = None):
        """Initialize the resource optimizer.
        
        Args:
            instance_types: List of available instance types with their specifications.
        """
        self.instance_types = instance_types or []
    
    def load_instance_catalog(self, catalog_path: str) -> None:
        """Load instance type catalog from a JSON file.
        
        Args:
            catalog_path: Path to the instance catalog JSON file.
        """
        with open(catalog_path, 'r') as f:
            catalog = json.load(f)
            
        self.instance_types = []
        for provider, families in catalog.items():
            for family, instances in families.items():
                for instance in instances:
                    self.instance_types.append(InstanceType(
                        name=instance['name'],
                        vcpus=instance['vcpus'],
                        memory_gb=instance['memory_gb'],
                        price_per_hour=instance['price_per_hour'],
                        provider=provider,
                        family=family,
                        generation=instance.get('generation', 1)
                    ))
    
    def _filter_instance_types(self, provider: str, family: Optional[str] = None) -> List[InstanceType]:
        """Filter instance types by provider and family.
        
        Args:
            provider: Cloud provider name.
            family: Optional instance family to filter by.
            
        Returns:
            Filtered list of instance types.
        """
        filtered = [i for i in self.instance_types if i.provider.lower() == provider.lower()]
        
        if family:
            filtered = [i for i in filtered if i.family.lower() == family.lower()]
            
        return filtered
    
    def _get_instance_details(self, instance_name: str, provider: str) -> Optional[InstanceType]:
        """Get details for a specific instance type.
        
        Args:
            instance_name: Name of the instance type.
            provider: Cloud provider name.
            
        Returns:
            Instance type details if found, None otherwise.
        """
        for instance in self.instance_types:
            if instance.name.lower() == instance_name.lower() and instance.provider.lower() == provider.lower():
                return instance
                
        return None
    
    def _analyze_utilization(self, utilization_data: List[Dict[str, Any]]) -> Dict[str, float]:
        """Analyze resource utilization data.
        
        Args:
            utilization_data: List of utilization data points.
            
        Returns:
            Dictionary with utilization statistics.
        """
        # Convert to DataFrame
        df = pd.DataFrame(utilization_data)
        
        # Calculate statistics
        stats = {
            'cpu_avg': df['cpu_percent'].mean() if 'cpu_percent' in df.columns else None,
            'cpu_p95': np.percentile(df['cpu_percent'], 95) if 'cpu_percent' in df.columns else None,
            'cpu_max': df['cpu_percent'].max() if 'cpu_percent' in df.columns else None,
            'memory_avg': df['memory_percent'].mean() if 'memory_percent' in df.columns else None,
            'memory_p95': np.percentile(df['memory_percent'], 95) if 'memory_percent' in df.columns else None,
            'memory_max': df['memory_percent'].max() if 'memory_percent' in df.columns else None,
            'network_avg': df['network_mbps'].mean() if 'network_mbps' in df.columns else None,
            'network_p95': np.percentile(df['network_mbps'], 95) if 'network_mbps' in df.columns else None,
            'network_max': df['network_mbps'].max() if 'network_mbps' in df.columns else None
        }
        
        return stats
    
    def generate_rightsizing_recommendation(
        self,
        current_instance: str, 
        provider: str,
        utilization_data: List[Dict[str, Any]],
        target_cpu_threshold: float = 70.0,
        target_memory_threshold: float = 70.0
    ) -> Dict[str, Any]:
        """Generate rightsizing recommendations based on utilization data.
        
        Args:
            current_instance: Current instance type name.
            provider: Cloud provider name.
            utilization_data: List of utilization data points.
            target_cpu_threshold: Target CPU utilization threshold (%).
            target_memory_threshold: Target memory utilization threshold (%).
            
        Returns:
            Dictionary with rightsizing recommendation details.
        """
        # Get current instance details
        instance = self._get_instance_details(current_instance, provider)
        if not instance:
            return {
                "error": f"Instance {current_instance} not found for provider {provider}"
            }
            
        # Analyze utilization
        utilization_stats = self._analyze_utilization(utilization_data)
        
        # Calculate required resources
        required_vcpus = 0
        required_memory = 0
        
        if 'cpu_p95' in utilization_stats and utilization_stats['cpu_p95'] is not None:
            current_cpu_percent = utilization_stats['cpu_p95']
            required_vcpus = int(np.ceil(instance.vcpus * current_cpu_percent / target_cpu_threshold))
        
        if 'memory_p95' in utilization_stats and utilization_stats['memory_p95'] is not None:
            current_memory_percent = utilization_stats['memory_p95']
            required_memory = instance.memory_gb * current_memory_percent / target_memory_threshold
            
        # Filter instances of the same family
        same_family_instances = self._filter_instance_types(provider, instance.family)
        
        # Find the best fit instance
        best_fit = None
        best_fit_score = float('inf')
        
        for candidate in same_family_instances:
            # Calculate fit score (lower is better)
            # Penalize for being under-resourced, reward for being right-sized
            if candidate.vcpus < required_vcpus or candidate.memory_gb < required_memory:
                # Skip under-resourced instances
                continue
                
            # Score is how well the instance fits the required resources (lower is better)
            cpu_ratio = candidate.vcpus / required_vcpus if required_vcpus > 0 else float('inf')
            memory_ratio = candidate.memory_gb / required_memory if required_memory > 0 else float('inf')
            
            # Ideal ratio would be 1.0 (perfect fit), higher means over-provisioned
            fit_score = (cpu_ratio + memory_ratio) * candidate.price_per_hour
            
            if fit_score < best_fit_score:
                best_fit = candidate
                best_fit_score = fit_score
                
        # If no better fit, keep current instance
        if not best_fit or best_fit.name == instance.name:
            return {
                "recommendation": "keep_current",
                "current_instance": instance.name,
                "current_vcpus": instance.vcpus,
                "current_memory_gb": instance.memory_gb,
                "current_hourly_cost": instance.price_per_hour,
                "cpu_utilization": utilization_stats.get('cpu_p95'),
                "memory_utilization": utilization_stats.get('memory_p95'),
                "justification": "Current instance size is appropriate for the workload"
            }
            
        # Calculate savings
        monthly_hours = 730  # Average hours in a month
        current_monthly_cost = instance.price_per_hour * monthly_hours
        recommended_monthly_cost = best_fit.price_per_hour * monthly_hours
        monthly_savings = current_monthly_cost - recommended_monthly_cost
        savings_percentage = (monthly_savings / current_monthly_cost) * 100 if current_monthly_cost > 0 else 0
            
        return {
            "recommendation": "resize",
            "current_instance": instance.name,
            "current_vcpus": instance.vcpus,
            "current_memory_gb": instance.memory_gb,
            "current_hourly_cost": instance.price_per_hour,
            "recommended_instance": best_fit.name,
            "recommended_vcpus": best_fit.vcpus,
            "recommended_memory_gb": best_fit.memory_gb,
            "recommended_hourly_cost": best_fit.price_per_hour,
            "cpu_utilization": utilization_stats.get('cpu_p95'),
            "memory_utilization": utilization_stats.get('memory_p95'),
            "monthly_savings": monthly_savings,
            "savings_percentage": savings_percentage,
            "confidence_score": self._calculate_confidence_score(utilization_data),
            "justification": f"Based on the observed utilization patterns, the workload can be efficiently run on {best_fit.name}"
        }
    
    def _calculate_confidence_score(self, utilization_data: List[Dict[str, Any]]) -> float:
        """Calculate a confidence score for the recommendation.
        
        Args:
            utilization_data: List of utilization data points.
            
        Returns:
            Confidence score between 0 and 1.
        """
        # More data points means higher confidence
        data_points_factor = min(1.0, len(utilization_data) / 300)  # 300+ data points = full confidence
        
        # Consistency of data affects confidence
        if 'cpu_percent' in utilization_data[0]:
            cpu_values = [point['cpu_percent'] for point in utilization_data]
            cpu_std = np.std(cpu_values)
            cpu_mean = np.mean(cpu_values)
            cpu_variance_factor = 1.0 - min(1.0, cpu_std / (cpu_mean * 2) if cpu_mean > 0 else 0)
        else:
            cpu_variance_factor = 0.5  # Neutral if no CPU data
            
        # Calculate overall confidence
        confidence = 0.7 * data_points_factor + 0.3 * cpu_variance_factor
        
        return min(0.99, confidence)  # Cap at 0.99 to avoid absolute certainty

def generate_mock_utilization_data(
    days: int = 30,
    readings_per_day: int = 24,
    base_cpu_util: float = 30.0,
    base_memory_util: float = 45.0,
    seed: int = 42
) -> List[Dict[str, Any]]:
    """Generate mock utilization data for testing.
    
    Args:
        days: Number of days of data.
        readings_per_day: Number of readings per day.
        base_cpu_util: Base CPU utilization percentage.
        base_memory_util: Base memory utilization percentage.
        seed: Random seed for reproducibility.
        
    Returns:
        List of utilization data points.
    """
    np.random.seed(seed)
    
    end_time = datetime.now()
    start_time = end_time - timedelta(days=days)
    
    # Generate timestamps
    total_readings = days * readings_per_day
    timestamps = []
    for i in range(total_readings):
        fraction = i / total_readings
        timestamp = start_time + timedelta(days=days * fraction)
        timestamps.append(timestamp)
    
    # Generate utilization data
    utilization_data = []
    
    for i, timestamp in enumerate(timestamps):
        # Time of day effect (higher during business hours)
        hour = timestamp.hour
        time_factor = 1.2 if 9 <= hour < 18 else 0.8
        
        # Day of week effect (lower on weekends)
        day_of_week = timestamp.weekday()
        day_factor = 1.0 if day_of_week < 5 else 0.6
        
        # Random variation
        cpu_random = np.random.normal(0, 10)
        memory_random = np.random.normal(0, 7)
        
        # Calculate utilization
        cpu_percent = min(100, max(1, base_cpu_util * time_factor * day_factor + cpu_random))
        memory_percent = min(100, max(1, base_memory_util * time_factor * day_factor + memory_random))
        network_mbps = cpu_percent * 0.5 + np.random.normal(0, 10)
        
        data_point = {
            'timestamp': timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            'cpu_percent': cpu_percent,
            'memory_percent': memory_percent,
            'network_mbps': network_mbps
        }
        
        utilization_data.append(data_point)
    
    return utilization_data

def generate_mock_instance_catalog() -> List[InstanceType]:
    """Generate a mock catalog of instance types for testing."""
    mock_instances = [
        # AWS general purpose instances
        InstanceType("t3.micro", 2, 1, 0.0104, "aws", "t3", 3),
        InstanceType("t3.small", 2, 2, 0.0208, "aws", "t3", 3),
        InstanceType("t3.medium", 2, 4, 0.0416, "aws", "t3", 3),
        InstanceType("t3.large", 2, 8, 0.0832, "aws", "t3", 3),
        InstanceType("t3.xlarge", 4, 16, 0.1664, "aws", "t3", 3),
        InstanceType("t3.2xlarge", 8, 32, 0.3328, "aws", "t3", 3),
        
        InstanceType("m5.large", 2, 8, 0.096, "aws", "m5", 5),
        InstanceType("m5.xlarge", 4, 16, 0.192, "aws", "m5", 5),
        InstanceType("m5.2xlarge", 8, 32, 0.384, "aws", "m5", 5),
        InstanceType("m5.4xlarge", 16, 64, 0.768, "aws", "m5", 5),
        InstanceType("m5.8xlarge", 32, 128, 1.536, "aws", "m5", 5),
        
        # Azure general purpose instances
        InstanceType("Standard_B2s", 2, 4, 0.0208, "azure", "b", 2),
        InstanceType("Standard_B2ms", 2, 8, 0.0416, "azure", "b", 2),
        InstanceType("Standard_B4ms", 4, 16, 0.0832, "azure", "b", 4),
        InstanceType("Standard_B8ms", 8, 32, 0.1664, "azure", "b", 8),
        
        InstanceType("Standard_D2s_v3", 2, 8, 0.096, "azure", "d", 2),
        InstanceType("Standard_D4s_v3", 4, 16, 0.192, "azure", "d", 4),
        InstanceType("Standard_D8s_v3", 8, 32, 0.384, "azure", "d", 8),
        InstanceType("Standard_D16s_v3", 16, 64, 0.768, "azure", "d", 16),
        
        # GCP general purpose instances
        InstanceType("e2-micro", 2, 1, 0.0076, "gcp", "e2", 2),
        InstanceType("e2-small", 2, 2, 0.0152, "gcp", "e2", 2),
        InstanceType("e2-medium", 2, 4, 0.0304, "gcp", "e2", 2),
        InstanceType("e2-standard-2", 2, 8, 0.0608, "gcp", "e2", 2),
        InstanceType("e2-standard-4", 4, 16, 0.1216, "gcp", "e2", 4),
        InstanceType("e2-standard-8", 8, 32, 0.2432, "gcp", "e2", 8),
        InstanceType("e2-standard-16", 16, 64, 0.4864, "gcp", "e2", 16),
    ]
    
    return mock_instances

def run_optimizer_test():
    """Run a test of the resource optimizer with mock data."""
    # Create optimizer with mock instance catalog
    optimizer = ResourceOptimizer(generate_mock_instance_catalog())
    
    # Generate test utilization data
    # Scenario 1: Overprovisioned instance with low utilization
    low_util_data = generate_mock_utilization_data(
        days=30,
        base_cpu_util=15.0,
        base_memory_util=20.0
    )
    
    # Scenario 2: Appropriately sized instance
    appropriate_util_data = generate_mock_utilization_data(
        days=30,
        base_cpu_util=45.0,
        base_memory_util=60.0
    )
    
    # Scenario 3: Underprovisioned instance with high utilization
    high_util_data = generate_mock_utilization_data(
        days=30,
        base_cpu_util=85.0,
        base_memory_util=90.0
    )
    
    # Generate recommendations
    print("Scenario 1: Overprovisioned instance")
    recommendation1 = optimizer.generate_rightsizing_recommendation(
        "m5.4xlarge", "aws", low_util_data
    )
    print(f"Current: {recommendation1['current_instance']}, Recommended: {recommendation1.get('recommended_instance', 'keep current')}")
    print(f"CPU: {recommendation1['cpu_utilization']:.2f}%, Memory: {recommendation1['memory_utilization']:.2f}%")
    if 'monthly_savings' in recommendation1:
        print(f"Monthly savings: ${recommendation1['monthly_savings']:.2f} ({recommendation1['savings_percentage']:.2f}%)")
    print(f"Confidence: {recommendation1.get('confidence_score', 0):.2f}")
    print(f"Justification: {recommendation1.get('justification', '')}")
    
    print("\nScenario 2: Appropriately sized instance")
    recommendation2 = optimizer.generate_rightsizing_recommendation(
        "m5.xlarge", "aws", appropriate_util_data
    )
    print(f"Current: {recommendation2['current_instance']}, Recommended: {recommendation2.get('recommended_instance', 'keep current')}")
    print(f"CPU: {recommendation2['cpu_utilization']:.2f}%, Memory: {recommendation2['memory_utilization']:.2f}%")
    if 'monthly_savings' in recommendation2:
        print(f"Monthly savings: ${recommendation2['monthly_savings']:.2f} ({recommendation2['savings_percentage']:.2f}%)")
    print(f"Confidence: {recommendation2.get('confidence_score', 0):.2f}")
    print(f"Justification: {recommendation2.get('justification', '')}")
    
    print("\nScenario 3: Underprovisioned instance")
    recommendation3 = optimizer.generate_rightsizing_recommendation(
        "t3.small", "aws", high_util_data
    )
    print(f"Current: {recommendation3['current_instance']}, Recommended: {recommendation3.get('recommended_instance', 'keep current')}")
    print(f"CPU: {recommendation3['cpu_utilization']:.2f}%, Memory: {recommendation3['memory_utilization']:.2f}%")
    if 'monthly_savings' in recommendation3:
        print(f"Monthly savings: ${recommendation3['monthly_savings']:.2f} ({recommendation3['savings_percentage']:.2f}%)")
    print(f"Confidence: {recommendation3.get('confidence_score', 0):.2f}")
    print(f"Justification: {recommendation3.get('justification', '')}")
    
if __name__ == "__main__":
    run_optimizer_test() 