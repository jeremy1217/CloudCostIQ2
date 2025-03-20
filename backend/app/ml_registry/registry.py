import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any

class ModelRegistry:
    def __init__(self, registry_dir: str = "ml_models"):
        self.registry_dir = Path(registry_dir)
        self.registry_dir.mkdir(exist_ok=True, parents=True)
        self.registry_file = self.registry_dir / "model_registry.json"
        self._initialize_registry()
    
    def _initialize_registry(self):
        if not self.registry_file.exists():
            self.registry_file.write_text(json.dumps({}))
    
    def get_registry(self) -> Dict:
        """Get the current model registry"""
        return json.loads(self.registry_file.read_text())
    
    def save_registry(self, registry: Dict):
        """Save the updated registry"""
        self.registry_file.write_text(json.dumps(registry, indent=2))
    
    def register_model(
        self, 
        org_id: str, 
        model_type: str, 
        model_path: str, 
        metadata: Dict[str, Any]
    ) -> str:
        """Register a new model in the registry"""
        registry = self.get_registry()
        
        # Initialize org entry if needed
        if org_id not in registry:
            registry[org_id] = {}
            
        # Initialize model type entry if needed
        if model_type not in registry[org_id]:
            registry[org_id][model_type] = []
        
        # Set previous models as inactive
        for existing_model in registry[org_id][model_type]:
            existing_model["is_active"] = False
        
        # Create model entry
        model_id = f"{model_type}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        model_entry = {
            "id": model_id,
            "path": model_path,
            "version": metadata.get("version", "1.0.0"),
            "created_at": datetime.now().isoformat(),
            "metadata": metadata,
            "is_active": True
        }
        
        # Add to registry
        registry[org_id][model_type].append(model_entry)
        self.save_registry(registry)
        
        return model_id
        
    def get_active_model(self, org_id: str, model_type: str) -> Optional[Dict]:
        """Get the currently active model for an organization"""
        registry = self.get_registry()
        
        if org_id in registry and model_type in registry[org_id]:
            active_models = [m for m in registry[org_id][model_type] if m.get("is_active")]
            if active_models:
                return active_models[0]
        
        return None