import json
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple, Optional, Union
from dataclasses import dataclass
from datetime import datetime, timedelta

# Define ReservationOptimizationParams class
@dataclass
class ReservationOptimizationParams:
    """Parameters for reservation optimization."""
    commitment_term_months: int = 12
    upfront_option: str = "no_upfront"
    risk_tolerance: str = "medium"

# Define WorkloadClassifier class
class WorkloadClassifier:
    """Classifies workloads based on utilization patterns."""
    
    def __init__(self, n_clusters: int = 5):
        """Initialize the workload classifier."""
        self.n_clusters = n_clusters
    
    def fit(self, utilization_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Fit the classifier to utilization data."""
        # Sample implementation
        return {
            "workload_profiles": [
                {
                    "cluster_id": 1,
                    "workload_type": "web",
                    "metrics": {"cpu_mean": {"mean": 40}}
                }
            ]
        }

# Define OptimalInstanceSelector class
class OptimalInstanceSelector:
    """Selects optimal instances based on workload requirements."""
    
    def __init__(self):
        """Initialize the instance selector."""
        self.instance_catalog = {}
        self.pricing_data = {}
    
    def recommend_instances(self, workload_data: Dict[str, Any], top_n: int = 3) -> Dict[str, Any]:
        """Recommend instances for a workload."""
        # Sample implementation
        return {
            "recommendations": [
                {
                    "instance_type": "m5.large",
                    "monthly_savings": 50.0
                }
            ]
        }
    
    def set_instance_catalog(self, instance_catalog: Dict[str, Any]) -> None:
        """Set the instance catalog."""
        self.instance_catalog = instance_catalog
    
    def set_pricing_data(self, pricing_data: Dict[str, Any]) -> None:
        """Set the pricing data."""
        self.pricing_data = pricing_data

# Define AutoScalingOptimizer class
class AutoScalingOptimizer:
    """Optimizes auto-scaling configurations."""
    
    def __init__(self):
        """Initialize the auto-scaling optimizer."""
        pass
    
    def analyze_and_recommend(self, utilization_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze utilization data and recommend auto-scaling configurations."""
        # Sample implementation
        return {
            "scaling_type": "target_tracking",
            "configuration": {
                "min_instances": 2,
                "max_instances": 10
            }
        }

# Define ReservationOptimizer class
class ReservationOptimizer:
    """Optimizes resource reservations and savings plans."""
    
    def __init__(self):
        """Initialize the reservation optimizer."""
        self.pricing_data = {}
        self.params = ReservationOptimizationParams()
    
    def set_pricing_data(self, pricing_data: Dict[str, Any]) -> None:
        """Set pricing data."""
        self.pricing_data = pricing_data
    
    def set_params(self, params: ReservationOptimizationParams) -> None:
        """Set optimization parameters."""
        self.params = params
    
    def analyze_usage_patterns(self, usage_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze usage patterns to recommend reservations."""
        # Sample implementation
        return {
            "summary": {
                "total_monthly_savings": 1000.0,
                "total_monthly_reserved": 5000.0
            }
        }
    
    def recommend_savings_plans(self, usage_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Recommend savings plans based on usage patterns."""
        # Sample implementation
        return {
            "summary": {
                "total_monthly_savings": 1200.0,
                "total_monthly_commitment": 4800.0
            }
        }
    
    def _get_instance_memory(self, instance_type: str) -> float:
        """Get memory in GB for an instance type."""
        memory_map = {
            'c5.large': 4, 'c5.xlarge': 8, 'c5.2xlarge': 16,
            'r5.large': 16, 'r5.xlarge': 32, 'r5.2xlarge': 64,
            'e2-standard-2': 8, 'e2-standard-4': 16, 'e2-standard-8': 32,
            'n1-standard-2': 7.5, 'n1-standard-4': 15, 'n1-standard-8': 30
        }
        
        return memory_map.get(instance_type.lower(), 4.0)
    
    def _get_price(self, provider: str, instance_type: str, price_type: str) -> Optional[float]:
        """Get the price for an instance."""
        if provider in self.pricing_data and instance_type in self.pricing_data[provider]:
            return self.pricing_data[provider][instance_type].get(price_type)
        
        return None
    
    def compare_reservation_vs_savings_plan(self, usage_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Compare reservation-based vs. savings plan approaches."""
        # Generate both types of recommendations
        reservation_analysis = self.analyze_usage_patterns(usage_data)
        savings_plan_analysis = self.recommend_savings_plans(usage_data)
        
        # Extract key metrics
        res_monthly_savings = reservation_analysis["summary"]["total_monthly_savings"]
        sp_monthly_savings = savings_plan_analysis["summary"]["total_monthly_savings"]
        
        res_commitment = reservation_analysis["summary"]["total_monthly_reserved"]
        sp_commitment = savings_plan_analysis["summary"]["total_monthly_commitment"]
        
        # Determine recommendation
        if sp_monthly_savings > res_monthly_savings * 1.1:  # 10% better
            recommendation = "Savings Plan"
            reason = "Savings plans offer significantly higher savings while maintaining flexibility."
        elif res_monthly_savings > sp_monthly_savings * 1.1:  # 10% better
            recommendation = "Reserved Instances"
            reason = "Reserved Instances offer better savings for your specific usage patterns."
        else:
            # If they're close, prefer savings plans for flexibility
            recommendation = "Savings Plan"
            reason = "Savings plans offer similar savings with greater flexibility for changing workloads."
        
        # Generate comparison table
        comparison = {
            "reserved_instances": {
                "monthly_savings": float(res_monthly_savings),
                "monthly_commitment": float(res_commitment),
                "flexibility": "Low",
                "best_for": "Stable, predictable workloads",
                "risk": "Medium (instance type lock-in)"
            },
            "savings_plan": {
                "monthly_savings": float(sp_monthly_savings),
                "monthly_commitment": float(sp_commitment),
                "flexibility": "Medium to High",
                "best_for": "Variable workloads across instance types",
                "risk": "Low (spend commitment without instance lock-in)"
            },
            "recommendation": recommendation,
            "reasoning": reason
        }
        
        return comparison

class ResourceOptimizationManager:
    """Master class that manages all resource optimization components."""
    
    def __init__(self,
                instance_catalog_path: Optional[str] = None,
                pricing_path: Optional[str] = None):
        """Initialize the resource optimization manager."""
        # Load instance catalog and pricing data
        self.instance_catalog = {}
        self.pricing_data = {}
        
        if instance_catalog_path:
            with open(instance_catalog_path, 'r') as f:
                self.instance_catalog = json.load(f)
        
        if pricing_path:
            with open(pricing_path, 'r') as f:
                self.pricing_data = json.load(f)
        
        # Initialize component models
        self.workload_classifier = WorkloadClassifier()
        self.instance_selector = OptimalInstanceSelector()
        self.autoscaling_optimizer = AutoScalingOptimizer()
        self.reservation_optimizer = ReservationOptimizer()
        
        # Configure components with data
        self.instance_selector.set_instance_catalog(self.instance_catalog)
        self.instance_selector.set_pricing_data(self.pricing_data)
        self.reservation_optimizer.set_pricing_data(self.pricing_data)
    
    def analyze_infrastructure(self, 
                             utilization_data: List[Dict[str, Any]],
                             usage_data: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """Perform comprehensive resource optimization analysis."""
        results = {
            "analysis_date": datetime.now().isoformat(),
            "resources_analyzed": len(utilization_data),
            "optimizations": {}
        }
        
        # Run workload classification
        try:
            workload_analysis = self.workload_classifier.fit(utilization_data)
            results["optimizations"]["workload_classification"] = workload_analysis
        except Exception as e:
            results["optimizations"]["workload_classification"] = {"error": str(e)}
        
        # For each workload cluster, recommend instance types
        if "workload_profiles" in results["optimizations"].get("workload_classification", {}):
            instance_recommendations = {}
            
            for profile in results["optimizations"]["workload_classification"]["workload_profiles"]:
                try:
                    # Convert profile metrics to workload data format for instance selector
                    workload_data = {
                        "workload_type": profile["workload_type"],
                        "cpu_required": profile["metrics"].get("cpu_mean", {}).get("mean", 0),
                        "memory_required": profile["metrics"].get("memory_mean", {}).get("mean", 0)
                    }
                    
                    # Get instance recommendations
                    recommendations = self.instance_selector.recommend_instances(
                        workload_data, 
                        top_n=3
                    )
                    
                    instance_recommendations[f"cluster_{profile['cluster_id']}"] = recommendations
                except Exception as e:
                    instance_recommendations[f"cluster_{profile['cluster_id']}"] = {"error": str(e)}
            
            results["optimizations"]["instance_recommendations"] = instance_recommendations
        
        # Run auto-scaling optimization
        try:
            autoscaling_recommendations = self.autoscaling_optimizer.analyze_and_recommend(utilization_data)
            results["optimizations"]["autoscaling"] = autoscaling_recommendations
        except Exception as e:
            results["optimizations"]["autoscaling"] = {"error": str(e)}
        
        # Run reservation analysis if usage data provided
        if usage_data:
            try:
                # Set standard parameters
                params = ReservationOptimizationParams(
                    commitment_term_months=12,
                    upfront_option="no_upfront",
                    risk_tolerance="medium"
                )
                self.reservation_optimizer.set_params(params)
                
                # Run analysis
                reservation_analysis = self.reservation_optimizer.analyze_usage_patterns(usage_data)
                savings_plan_analysis = self.reservation_optimizer.recommend_savings_plans(usage_data)
                comparison = self.reservation_optimizer.compare_reservation_vs_savings_plan(usage_data)
                
                results["optimizations"]["reservations"] = {
                    "reserved_instances": reservation_analysis,
                    "savings_plans": savings_plan_analysis,
                    "comparison": comparison
                }
            except Exception as e:
                results["optimizations"]["reservations"] = {"error": str(e)}
        
        # Add estimated total savings
        total_savings = 0.0
        
        # Add instance right-sizing savings
        if "instance_recommendations" in results["optimizations"]:
            for cluster, recommendations in results["optimizations"]["instance_recommendations"].items():
                if "recommendations" in recommendations:
                    for rec in recommendations["recommendations"]:
                        if "savings_opportunities" in rec:
                            for saving_type, amount in rec["savings_opportunities"].items():
                                total_savings += amount
                        elif "monthly_savings" in rec:
                            total_savings += rec["monthly_savings"]
        
        # Add reservation/savings plan savings
        if "reservations" in results["optimizations"]:
            reservations = results["optimizations"]["reservations"]
            if "comparison" in reservations:
                if reservations["comparison"]["recommendation"] == "Savings Plan":
                    total_savings += reservations["comparison"]["savings_plan"]["monthly_savings"]
                else:
                    total_savings += reservations["comparison"]["reserved_instances"]["monthly_savings"]
        
        results["estimated_monthly_savings"] = float(total_savings)
        results["optimization_score"] = self._calculate_optimization_score(results)
        
        return results
    
    def _calculate_optimization_score(self, results: Dict[str, Any]) -> float:
        """Calculate an overall optimization score based on findings."""
        score = 50.0  # Start with neutral score
        
        # Factor 1: Workload classification confidence
        if "workload_classification" in results["optimizations"]:
            workload_class = results["optimizations"]["workload_classification"]
            
            if "workload_profiles" in workload_class:
                avg_confidence = 0.0
                for profile in workload_class["workload_profiles"]:
                    # Estimate confidence based on cluster size and metrics
                    cluster_conf = 0.6  # Base confidence
                    
                    # Adjust based on size
                    if profile.get("size", 0) > 10:
                        cluster_conf += 0.2
                    
                    # Adjust based on variance
                    if "cpu_std" in profile.get("metrics", {}):
                        if profile["metrics"]["cpu_std"].get("mean", 100) < 10:
                            cluster_conf += 0.1
                    
                    avg_confidence += cluster_conf * profile.get("percentage", 100) / 100
                
                # Adjust score based on classification confidence
                score += (avg_confidence - 0.5) * 20
        
        # Factor 2: Savings opportunities
        monthly_savings = results.get("estimated_monthly_savings", 0)
        
        # Assume a target of $1000 in monthly savings for max score
        savings_score = min(1.0, monthly_savings / 1000) * 25
        score += savings_score
        
        # Factor 3: Optimization coverage
        coverage_score = 0
        
        if "workload_classification" in results["optimizations"]:
            coverage_score += 1
        
        if "instance_recommendations" in results["optimizations"]:
            coverage_score += 1
        
        if "autoscaling" in results["optimizations"]:
            coverage_score += 1
        
        if "reservations" in results["optimizations"]:
            coverage_score += 1
        
        # Scale to 0-15 points
        coverage_score = (coverage_score / 4) * 15
        score += coverage_score
        
        # Cap score between 0-100
        return max(0, min(100, score))
    
    def simulate_optimization_impact(self, 
                                    current_state: Dict[str, Any],
                                    recommendations: Dict[str, Any]) -> Dict[str, Any]:
        """Simulate the impact of implementing optimization recommendations."""
        # Extract current costs and resources
        current_monthly_cost = current_state.get("monthly_cost", 0)
        current_resources = current_state.get("resources", [])
        
        # Calculate cost savings
        instance_savings = 0
        reservation_savings = 0
        scaling_savings = 0
        
        # Process instance recommendations
        if "instance_recommendations" in recommendations["optimizations"]:
            for cluster, data in recommendations["optimizations"]["instance_recommendations"].items():
                if "recommendations" in data:
                    for rec in data["recommendations"]:
                        if "savings_opportunities" in rec:
                            # Take the best savings option
                            best_savings = max([0] + list(rec["savings_opportunities"].values()))
                            instance_savings += best_savings
                        elif "monthly_savings" in rec:
                            instance_savings += rec["monthly_savings"]
        
        # Process reservation recommendations
        if "reservations" in recommendations["optimizations"]:
            res_data = recommendations["optimizations"]["reservations"]
            if "comparison" in res_data:
                if res_data["comparison"]["recommendation"] == "Savings Plan":
                    reservation_savings = res_data["comparison"]["savings_plan"]["monthly_savings"]
                else:
                    reservation_savings = res_data["comparison"]["reserved_instances"]["monthly_savings"]
        
        # Process scaling recommendations (estimate)
        if "autoscaling" in recommendations["optimizations"]:
            # Rough estimate of scaling savings:
            # Assume better auto-scaling reduces overprovisioning by 15%
            scaling_data = recommendations["optimizations"]["autoscaling"]
            
            # Extract instance counts if available to refine estimate
            if "configuration" in scaling_data:
                old_max = current_state.get("autoscaling", {}).get("max_instances", 10)
                new_max = scaling_data["configuration"].get("max_instances", old_max)
                
                if new_max < old_max:
                    # Calculate potential cost difference from lower max instances
                    reduction_ratio = 1 - (new_max / old_max)
                    estimated_peak_cost = current_monthly_cost * 0.3  # Assume 30% of cost from peak capacity
                    scaling_savings = estimated_peak_cost * reduction_ratio * 0.5  # Apply 50% efficiency factor
        
        # Total savings
        total_savings = instance_savings + reservation_savings + scaling_savings
        
        # Calculate resource efficiency metrics
        current_efficiency = current_state.get("resource_efficiency", {})
        projected_efficiency = {
            "cpu_utilization": current_efficiency.get("cpu_utilization", 35) + 15,  # Assume 15% improvement
            "memory_utilization": current_efficiency.get("memory_utilization", 40) + 10,  # Assume 10% improvement
            "cost_per_request": current_efficiency.get("cost_per_request", 0.001) * 0.8  # Assume 20% improvement
        }
        
        # Calculate carbon impact if relevant data available
        carbon_reduction = 0
        if "carbon_per_kwh" in current_state and "kwh_per_month" in current_state:
            # Estimate power reduction from more efficient resource usage
            power_reduction_ratio = total_savings / current_monthly_cost * 0.7  # Assume 70% of cost savings translate to power reduction
            kwh_saved = current_state["kwh_per_month"] * power_reduction_ratio
            carbon_reduction = kwh_saved * current_state["carbon_per_kwh"]
        
        # Compile impact summary
        impact = {
            "financial_impact": {
                "current_monthly_cost": float(current_monthly_cost),
                "projected_monthly_cost": float(current_monthly_cost - total_savings),
                "total_monthly_savings": float(total_savings),
                "savings_breakdown": {
                    "instance_rightsizing": float(instance_savings),
                    "reservations_and_savings_plans": float(reservation_savings),
                    "auto_scaling_optimization": float(scaling_savings)
                },
                "savings_percentage": float((total_savings / current_monthly_cost * 100) if current_monthly_cost > 0 else 0),
                "projected_annual_savings": float(total_savings * 12),
                "implementation_difficulty": "Medium",
                "time_to_value": "1-3 months"
            },
            "resource_impact": {
                "current_efficiency": current_efficiency,
                "projected_efficiency": projected_efficiency,
                "efficiency_improvement_percentage": {
                    "cpu": float(((projected_efficiency["cpu_utilization"] - current_efficiency.get("cpu_utilization", 0)) / 
                              max(current_efficiency.get("cpu_utilization", 1), 1)) * 100),
                    "memory": float(((projected_efficiency["memory_utilization"] - current_efficiency.get("memory_utilization", 0)) / 
                                 max(current_efficiency.get("memory_utilization", 1), 1)) * 100)
                }
            }
        }
        
        # Add carbon impact if calculated
        if carbon_reduction > 0:
            impact["environmental_impact"] = {
                "carbon_reduction_kg_per_month": float(carbon_reduction),
                "carbon_reduction_percentage": float((carbon_reduction / (current_state["kwh_per_month"] * current_state["carbon_per_kwh"])) * 100),
                "equivalent_trees_planted": float(carbon_reduction / 21)  # Rough estimate: 21kg CO2 per tree per month
            }
        
        return impact
    
    def generate_optimization_plan(self, recommendations: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate a step-by-step implementation plan for the recommendations."""
        plan = []
        
        # Phase 1: Quick wins - Instance right-sizing
        if "instance_recommendations" in recommendations["optimizations"]:
            instance_recs = recommendations["optimizations"]["instance_recommendations"]
            
            for cluster_id, cluster_data in instance_recs.items():
                if "recommendations" in cluster_data and cluster_data["recommendations"]:
                    # Find resources in this cluster
                    if "workload_classification" in recommendations["optimizations"]:
                        workload_class = recommendations["optimizations"]["workload_classification"]
                        
                        if "resource_clusters" in workload_class:
                            # Find resources in this cluster
                            resources = [res for res, cluster in workload_class["resource_clusters"].items() 
                                      if str(cluster) == cluster_id.split('_')[1]]
                            
                            if resources:
                                # Add step for right-sizing these resources
                                step = {
                                    "phase": 1,
                                    "name": f"Right-size {len(resources)} resources in cluster {cluster_id}",
                                    "description": f"Migrate resources to optimal instance types",
                                    "resources_affected": resources,
                                    "target_state": cluster_data["recommendations"][0]["instance_type"],
                                    "estimated_savings": sum(rec.get("monthly_savings", 0) for rec in cluster_data["recommendations"]),
                                    "effort": "Medium",
                                    "risk": "Low",
                                    "dependencies": []
                                }
                                
                                plan.append(step)
        
        # Phase 2: Auto-scaling optimization
        if "autoscaling" in recommendations["optimizations"]:
            autoscaling_data = recommendations["optimizations"]["autoscaling"]
            
            if "configuration" in autoscaling_data:
                step = {
                    "phase": 2,
                    "name": "Optimize auto-scaling configuration",
                    "description": f"Implement {autoscaling_data['scaling_type']} auto-scaling with optimized parameters",
                    "resources_affected": ["All auto-scaling groups"],
                    "target_state": f"Min: {autoscaling_data['configuration']['min_instances']}, Max: {autoscaling_data['configuration']['max_instances']}",
                    "estimated_savings": "15-20% of overprovisioning costs",
                    "effort": "Low",
                    "risk": "Low",
                    "dependencies": []
                }
                
                plan.append(step)
        
        # Phase 3: Reservation/Savings Plan implementation
        if "reservations" in recommendations["optimizations"]:
            res_data = recommendations["optimizations"]["reservations"]
            
            if "comparison" in res_data:
                plan_type = res_data["comparison"]["recommendation"]
                savings = 0
                
                if plan_type == "Savings Plan":
                    savings = res_data["comparison"]["savings_plan"]["monthly_savings"]
                    commitment = res_data["comparison"]["savings_plan"]["monthly_commitment"]
                    
                    step = {
                        "phase": 3,
                        "name": f"Implement {plan_type}",
                        "description": f"Purchase Savings Plans with ${commitment:.2f} monthly commitment",
                        "resources_affected": ["All eligible compute resources"],
                        "target_state": "Savings Plan coverage at optimal commitment level",
                        "estimated_savings": f"${savings:.2f} per month",
                        "effort": "Low",
                        "risk": "Medium",
                        "dependencies": [step["name"] for step in plan if step["phase"] < 3]
                    }
                else:
                    savings = res_data["comparison"]["reserved_instances"]["monthly_savings"]
                    
                    # Get top instance recommendations
                    if "reserved_instances" in res_data and "instance_analysis" in res_data["reserved_instances"]:
                        top_instances = res_data["reserved_instances"]["instance_analysis"][:3]
                        
                        for i, instance in enumerate(top_instances):
                            step = {
                                "phase": 3,
                                "name": f"Purchase Reserved Instances for {instance['instance_type']}",
                                "description": f"Purchase {instance['recommended_count']} {instance['commitment_term']} {instance['upfront_option']} RIs",
                                "resources_affected": [f"{instance['provider']} {instance['instance_type']}"],
                                "target_state": "Reserved Instance coverage",
                                "estimated_savings": f"${instance['monthly_savings']:.2f} per month",
                                "effort": "Low",
                                "risk": "Medium",
                                "dependencies": [step["name"] for step in plan if step["phase"] < 3]
                            }
                            
                            plan.append(step)
                
                # Skip if we've already added specific RI steps
                if plan_type == "Savings Plan" or "reserved_instances" not in res_data:
                    plan.append(step)
        
        # Phase 4: Long-term infrastructure improvements
        
        # Add step for implementing workload-based instance selection
        if "workload_classification" in recommendations["optimizations"]:
            workload_data = recommendations["optimizations"]["workload_classification"]
            
            if "workload_profiles" in workload_data and len(workload_data["workload_profiles"]) > 1:
                step = {
                    "phase": 4,
                    "name": "Implement workload-based resource placement",
                    "description": "Create infrastructure templates for each workload type to ensure optimal resource allocation",
                    "resources_affected": ["All compute resources"],
                    "target_state": "Automated workload-specific resource selection",
                    "estimated_savings": "10-15% improved resource efficiency",
                    "effort": "High",
                    "risk": "Low",
                    "dependencies": [step["name"] for step in plan if step["phase"] < 4]
                }
                
                plan.append(step)
        
        # Add continuous optimization step
        step = {
            "phase": 4,
            "name": "Implement continuous optimization monitoring",
            "description": "Set up regular review process and automated alerts for optimization opportunities",
            "resources_affected": ["All resources"],
            "target_state": "Proactive optimization lifecycle",
            "estimated_savings": "5-10% ongoing cost avoidance",
            "effort": "Medium",
            "risk": "Low",
            "dependencies": []
        }
        
        plan.append(step)
        
        # Sort plan by phase
        plan.sort(key=lambda x: x["phase"])
        
        return plan
    
    def set_instance_catalog(self, instance_catalog: Dict[str, Any]) -> None:
        """Set the instance catalog data."""
        self.instance_catalog = instance_catalog
        self.instance_selector.set_instance_catalog(instance_catalog)
    
    def set_pricing_data(self, pricing_data: Dict[str, Any]) -> None:
        """Set the pricing data."""
        self.pricing_data = pricing_data
        self.instance_selector.set_pricing_data(pricing_data)
        self.reservation_optimizer.set_pricing_data(pricing_data)