'c5.large': 4, 'c5.xlarge': 8, 'c5.2xlarge': 16,
            'r5.large': 16, 'r5.xlarge': 32, 'r5.2xlarge': 64,
            'e2-standard-2': 8, 'e2-standard-4': 16, 'e2-standard-8': 32,
            'n1-standard-2': 7.5, 'n1-standard-4': 15, 'n1-standard-8': 30
        }
        
        return memory_map.get(instance_type.lower(), 4.0)
    
    def _get_price(self, provider: str, instance_type: str, price_type: str) -> Optional[float]:
        """Get the price for an instance.
        
        Args:
            provider: Cloud provider.
            instance_type: Instance type.
            price_type: Price type (on_demand, reserved_1yr, etc.).
            
        Returns:
            Price value or None if not found.
        """
        if provider in self.pricing_data and instance_type in self.pricing_data[provider]:
            return self.pricing_data[provider][instance_type].get(price_type)
        
        return None
    
    def compare_reservation_vs_savings_plan(self, usage_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Compare reservation-based vs. savings plan approaches.
        
        Args:
            usage_data: List of dictionaries with instance usage data.
            
        Returns:
            Dictionary with comparative analysis.
        """
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
        """Initialize the resource optimization manager.
        
        Args:
            instance_catalog_path: Path to instance catalog data.
            pricing_path: Path to pricing data.
        """
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
        """Perform comprehensive resource optimization analysis.
        
        Args:
            utilization_data: List of dictionaries with resource utilization metrics.
            usage_data: List of dictionaries with instance usage data for reservation analysis.
            
        Returns:
            Dictionary with comprehensive optimization recommendations.
        """
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
        """Calculate an overall optimization score based on findings.
        
        Args:
            results: Complete analysis results.
            
        Returns:
            Optimization score from 0-100.
        """
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
                    if profile["size"] > 10:
                        cluster_conf += 0.2
                    
                    # Adjust based on variance
                    if "cpu_std" in profile["metrics"]:
                        if profile["metrics"]["cpu_std"]["mean"] < 10:
                            cluster_conf += 0.1
                    
                    avg_confidence += cluster_conf * profile["percentage"] / 100
                
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
        """Simulate the impact of implementing optimization recommendations.
        
        Args:
            current_state: Current infrastructure state.
            recommendations: Optimization recommendations from analyze_infrastructure.
            
        Returns:
            Dictionary with projected impact metrics.
        """
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
        """Generate a step-by-step implementation plan for the recommendations.
        
        Args:
            recommendations: Optimization recommendations from analyze_infrastructure.
            
        Returns:
            List of implementation steps.
        """
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
        """Set the instance catalog data.
        
        Args:
            instance_catalog: Dictionary with instance specifications.
        """
        self.instance_catalog = instance_catalog
        self.instance_selector.set_instance_catalog(instance_catalog)
    
    def set_pricing_data(self, pricing_data: Dict[str, Any]) -> None:
        """Set the pricing data.
        
        Args:
            pricing_data: Dictionary with instance pricing information.
        """
        self.pricing_data = pricing_data
        self.instance_selector.set_pricing_data(pricing_data)
        self.reservation_optimizer.set_pricing_data(pricing_data)

# Example usage
if __name__ == "__main__":
    # Generate synthetic utilization data
    np.random.seed(42)
    
    # Create 30 days of utilization data for 10 resources
    utilization_data = []
    
    resource_ids = [f"i-{i:05d}" for i in range(10)]
    start_date = datetime.now() - timedelta(days=30)
    
    for resource_id in resource_ids:
        # Assign random instance type
        instance_types = ["m5.xlarge", "c5.xlarge", "r5.xlarge", "t3.large"]
        instance_type = np.random.choice(instance_types)
        
        # Assign random workload pattern
        pattern_type = np.random.choice(["stable", "variable", "spiky", "periodic"])
        
        base_cpu = 40 if pattern_type == "stable" else 30
        base_memory = 50 if pattern_type == "stable" else 40
        
        for i in range(30 * 24):  # 1 month of hourly data
            timestamp = start_date + timedelta(hours=i)
            hour = timestamp.hour
            day_of_week = timestamp.weekday()
            
            # Generate CPU utilization based on pattern
            if pattern_type == "stable":
                cpu = base_cpu + np.random.normal(0, 5)
            elif pattern_type == "variable":
                cpu = base_cpu + np.random.normal(0, 15)
            elif pattern_type == "spiky":
                if np.random.random() < 0.05:  # 5% chance of spike
                    cpu = base_cpu + np.random.normal(40, 10)
                else:
                    cpu = base_cpu + np.random.normal(0, 8)
            else:  # periodic
                # Higher during business hours
                if 9 <= hour < 17 and day_of_week < 5:
                    cpu = base_cpu + 20 + np.random.normal(0, 8)
                else:
                    cpu = base_cpu - 10 + np.random.normal(0, 5)
            
            # Generate memory utilization (usually more stable than CPU)
            memory = base_memory + (cpu - base_cpu) * 0.3 + np.random.normal(0, 5)
            
            # Generate network activity
            network = 50 + (cpu / 100) * 200 + np.random.normal(0, 20)
            
            # Ensure values are within reasonable ranges
            cpu = max(0.1, min(99, cpu))
            memory = max(0.1, min(99, memory))
            network = max(0.1, network)
            
            # Create utilization data point
            utilization_point = {
                "resource_id": resource_id,
                "instance_type": instance_type,
                "timestamp": timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                "cpu_percent": cpu,
                "memory_percent": memory,
                "network_mbps": network,
                "disk_iops": 100 + network * 0.5 + np.random.normal(0, 50)
            }
            
            utilization_data.append(utilization_point)
    
    # Generate usage data for reservation analysis
    usage_data = []
    providers = ["AWS", "Azure", "GCP"]
    
    for provider in providers:
        instance_counts = {
            f"{provider}_m5.xlarge": 5,
            f"{provider}_c5.xlarge": 3,
            f"{provider}_r5.xlarge": 2,
            f"{provider}_t3.large": 8
        }
        
        for i in range(30 * 24):  # 1 month of hourly data
            timestamp = start_date + timedelta(hours=i)
            hour = timestamp.hour
            day_of_week = timestamp.weekday()
            
            for instance_type, base_count in instance_counts.items():
                # Variation based on time
                if 9 <= hour < 17 and day_of_week < 5:
                    count_variation = np.random.normal(0, 0.5)
                    count = base_count + max(-1, min(2, round(count_variation)))
                else:
                    count_variation = np.random.normal(-1, 0.5)
                    count = base_count + max(-2, min(1, round(count_variation)))
                
                # Ensure count is at least 1
                count = max(1, count)
                
                # Create usage data point
                usage_point = {
                    "provider": provider,
                    "instance_type": instance_type.split('_')[1],
                    "instance_count": count,
                    "timestamp": timestamp.strftime('%Y-%m-%d %H:%M:%S')
                }
                
                usage_data.append(usage_point)
    
    # Create a simple instance catalog
    instance_catalog = {
        "AWS": {
            "m5.xlarge": {
                "vcpu": 4,
                "memory_gb": 16,
                "price_per_hour": 0.192,
                "family": "m5"
            },
            "c5.xlarge": {
                "vcpu": 4,
                "memory_gb": 8,
                "price_per_hour": 0.17,
                "family": "c5"
            },
            "r5.xlarge": {
                "vcpu": 4,
                "memory_gb": 32,
                "price_per_hour": 0.252,
                "family": "r5"
            },
            "t3.large": {
                "vcpu": 2,
                "memory_gb": 8,
                "price_per_hour": 0.0832,
                "family": "t3"
            }
        },
        "Azure": {
            "Standard_D4s_v3": {
                "vcpu": 4,
                "memory_gb": 16,
                "price_per_hour": 0.192,
                "family": "D-series"
            },
            "Standard_F4s_v2": {
                "vcpu": 4,
                "memory_gb": 8,
                "price_per_hour": 0.169,
                "family": "F-series"
            }
        },
        "GCP": {
            "n2-standard-4": {
                "vcpu": 4,
                "memory_gb": 16,
                "price_per_hour": 0.19,
                "family": "n2"
            },
            "c2-standard-4": {
                "vcpu": 4,
                "memory_gb": 16,
                "price_per_hour": 0.21,
                "family": "c2"
            }
        }
    }
    
    # Create pricing data
    pricing_data = {
        "AWS": {
            "m5.xlarge": {
                "on_demand": 0.192,
                "reserved_1yr_no_upfront": 0.119,
                "reserved_3yr_no_upfront": 0.082,
                "reserved_1yr_partial_upfront": 0.112,
                "reserved_3yr_partial_upfront": 0.075,
                "reserved_1yr_all_upfront": 0.102,
                "reserved_3yr_all_upfront": 0.068
            },
            "c5.xlarge": {
                "on_demand": 0.17,
                "reserved_1yr_no_upfront": 0.106,
                "reserved_3yr_no_upfront": 0.073,
                "savings_plan": 0.101
            },
            "r5.xlarge": {
                "on_demand": 0.252,
                "reserved_1yr_no_upfront": 0.157,
                "reserved_3yr_no_upfront": 0.108,
                "savings_plan": 0.149
            },
            "t3.large": {
                "on_demand": 0.0832,
                "reserved_1yr_no_upfront": 0.052,
                "reserved_3yr_no_upfront": 0.036,
                "savings_plan": 0.049
            }
        },
        "Azure": {
            "Standard_D4s_v3": {
                "on_demand": 0.192,
                "reserved_1yr_no_upfront": 0.115,
                "reserved_3yr_no_upfront": 0.086
            },
            "Standard_F4s_v2": {
                "on_demand": 0.169,
                "reserved_1yr_no_upfront": 0.101,
                "reserved_3yr_no_upfront": 0.076
            }
        },
        "GCP": {
            "n2-standard-4": {
                "on_demand": 0.19,
                "committed_use_1yr": 0.133,
                "committed_use_3yr": 0.095
            },
            "c2-standard-4": {
                "on_demand": 0.21,
                "committed_use_1yr": 0.147,
                "committed_use_3yr": 0.105
            }
        }
    }
    
    # Initialize optimization manager
    optimizer = ResourceOptimizationManager()
    optimizer.set_instance_catalog(instance_catalog)
    optimizer.set_pricing_data(pricing_data)
    
    # Run analysis
    print("Running resource optimization analysis...")
    results = optimizer.analyze_infrastructure(utilization_data, usage_data)
    
    # Print summary
    print(f"Analysis complete. Overall optimization score: {results['optimization_score']:.1f}/100")
    print(f"Estimated monthly savings: ${results['estimated_monthly_savings']:.2f}")
    
    # Create current state for simulation
    current_state = {
        "monthly_cost": 10000,
        "resources": resource_ids,
        "resource_efficiency": {
            "cpu_utilization": 35,
            "memory_utilization": 45,
            "cost_per_request": 0.001
        },
        "kwh_per_month": 5000,
        "carbon_per_kwh": 0.5,
        "autoscaling": {
            "min_instances": 2,
            "max_instances": 20
        }
    }
    
    # Simulate impact
    impact = optimizer.simulate_optimization_impact(current_state, results)
    
    # Print impact
    print("\nProjected Impact:")
    print(f"Current monthly cost: ${impact['financial_impact']['current_monthly_cost']:.2f}")
    print(f"Projected monthly cost: ${impact['financial_impact']['projected_monthly_cost']:.2f}")
    print(f"Total monthly savings: ${impact['financial_impact']['total_monthly_savings']:.2f} ({impact['financial_impact']['savings_percentage']:.1f}%)")
    
    # Generate optimization plan
    plan = optimizer.generate_optimization_plan(results)
    
    # Print plan
    print("\nOptimization Implementation Plan:")
    for i, step in enumerate(plan):
        print(f"{i+1}. {step['name']} (Phase {step['phase']})")
        print(f"   Description: {step['description']}")
        print(f"   Estimated savings: {step['estimated_savings']}")
        print(f"   Effort: {step['effort']}, Risk: {step['risk']}")
        if step['dependencies']:
            print(f"   Dependencies: {', '.join(step['dependencies'])}")
        print()