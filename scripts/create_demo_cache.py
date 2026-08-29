import json
import os
from datetime import datetime, timezone
import logging

from backend.services.pipeline_service import pipeline_service
from backend.services.explanation_service import explanation_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_demo_cache(output_path: str = "data/processed/demo_cache_v1.json"):
    logger.info("Initializing PipelineService to load all processed pipeline datasets...")
    pipeline_service.load_data()
    
    candidates = pipeline_service.get_all_candidates()
    if not candidates:
        logger.error("No candidates found! Ensure the pipeline CSVs are generated first.")
        return
        
    quantum_results = pipeline_service.get_quantum_results()
    if not quantum_results:
        logger.error("No quantum results found. Using empty/default quantum baseline.")
        quantum_results = {}
        
    logger.info(f"Generating explanations for {len(candidates)} candidates using ExplanationService...")
    # Generate explanations
    for c in candidates:
        logger.info(f"Explaining candidate {c['candidate_id']}...")
        c["explanation"] = explanation_service.generate_explanation(c)
        
    # Build demo artifact
    demo_artifact = {
        "metadata": {
            "pipeline_version": "1.0.0",
            "timestamp_utc": datetime.now(timezone.utc).isoformat(),
            "is_precomputed_demo": True,
            "demo_warning": "These displayed results are a precomputed computational run for demonstration purposes. They represent computational hypotheses and require experimental validation.",
            "configurations": {
                "dataset_source": "ChEMBL EGFR (Target ID: CHEMBL203)",
                "molecular_generation": "RDKit BRICS (Deterministic seed: 42)",
                "scoring_metrics": ["QED", "ESOL", "PAINS alerts", "MW", "LogP"],
                "docking_configuration": {
                    "method": "AutoDock Vina (or Tanimoto similarity fallback)",
                    "receptor": "1M17",
                    "search_space_center": [22.61, 4.41, 52.83],
                    "search_space_size": [20, 20, 20]
                },
                "quantum_configuration": {
                    "formulation": "QUBO",
                    "solver": "QAOA",
                    "optimizer": "COBYLA",
                    "p": 1,
                    "seed": 42,
                    "backend": "Qiskit StatevectorSampler (Local Simulator)"
                }
            }
        },
        "quantum_results": quantum_results,
        "candidates": candidates
    }
    
    with open(output_path, "w") as f:
        json.dump(demo_artifact, f, indent=2)
        
    logger.info(f"Demo cache successfully saved to {output_path}")

if __name__ == "__main__":
    create_demo_cache()
