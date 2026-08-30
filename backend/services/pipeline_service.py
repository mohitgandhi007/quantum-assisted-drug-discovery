import os
import pandas as pd
import json
from typing import List, Dict, Any, Optional

from config import config

class PipelineService:
    def __init__(self, data_dir: str = None):
        self.data_dir = data_dir if data_dir else config.PROCESSED_DATA_DIR
        self.scored_path = os.path.join(self.data_dir, "scored_candidates.csv")
        self.binding_path = os.path.join(self.data_dir, "binding_evidence.csv")
        self.ranked_path = os.path.join(self.data_dir, "ranked_candidates.csv")
        self.qaoa_results_path = os.path.join(self.data_dir, "qaoa_results.json")
        
        self.candidates_cache = {}
        self.quantum_result_cache = None
        
        self.load_data()
        
    def load_data(self):
        """Loads and joins data from the pipeline stages into memory."""
        demo_cache_path = os.path.join(self.data_dir, "demo_cache_v1.json")
        if os.path.exists(demo_cache_path):
            with open(demo_cache_path, "r") as f:
                demo_data = json.load(f)
            self.quantum_result_cache = demo_data.get("quantum_results")
            self.candidates_cache = {c["candidate_id"]: c for c in demo_data.get("candidates", [])}
            return
            
        if not os.path.exists(self.scored_path) or not os.path.exists(self.ranked_path):
            return
            
        df_scored = pd.read_csv(self.scored_path)
        df_binding = pd.read_csv(self.binding_path) if os.path.exists(self.binding_path) else pd.DataFrame()
        df_ranked = pd.read_csv(self.ranked_path)
        
        # Load quantum results
        if os.path.exists(self.qaoa_results_path):
            with open(self.qaoa_results_path, "r") as f:
                self.quantum_result_cache = json.load(f)
        
        selected_set = set(self.quantum_result_cache["selected_candidates"]) if self.quantum_result_cache else set()
        
        # Build candidate objects
        self.candidates_cache = {}
        
        for _, row in df_ranked.iterrows():
            cid = row["candidate_id"]
            
            # Get properties
            scored_row = df_scored[df_scored["candidate_id"] == cid]
            if scored_row.empty:
                continue
            scored_row = scored_row.iloc[0]
            
            properties = {
                "qed": float(scored_row.get("qed", 0.0)),
                "esol": float(scored_row.get("esol", 0.0)),
                "molecular_weight": float(scored_row.get("molecular_weight", 0.0)),
                "logp": float(scored_row.get("logp", 0.0)),
                "h_bond_donors": int(scored_row.get("h_bond_donors", 0)),
                "h_bond_acceptors": int(scored_row.get("h_bond_acceptors", 0)),
                "rotatable_bonds": int(scored_row.get("rotatable_bonds", 0)),
                "pains_alert_count": int(scored_row.get("pains_alert_count", 0)),
                "pains_flag": bool(scored_row.get("pains_flag", False))
            }
            
            # Get binding evidence
            binding_evidence = None
            if not df_binding.empty:
                bind_row = df_binding[df_binding["candidate_id"] == cid]
                if not bind_row.empty:
                    bind_row = bind_row.iloc[0]
                    binding_evidence = {
                        "method": str(bind_row.get("method", "")),
                        "score": float(bind_row.get("score", 0.0)),
                        "score_direction": str(bind_row.get("score_direction", "")),
                        "reference": str(bind_row.get("reference", "")),
                        "status": str(bind_row.get("status", "")),
                        "limitations": str(bind_row.get("limitations", "")),
                        "error_message": str(bind_row.get("error_message")) if pd.notna(bind_row.get("error_message")) else None
                    }
            
            candidate_obj = {
                "candidate_id": str(cid),
                "smiles": str(scored_row["smiles"]),
                "properties": properties,
                "binding_evidence": binding_evidence,
                "classical_score": float(row["final_classical_score"]),
                "ranking": int(row["ranking"]),
                "quantum_selection_status": cid in selected_set
            }
            
            self.candidates_cache[cid] = candidate_obj
            
    def get_all_candidates(self) -> List[Dict[str, Any]]:
        """Returns all top candidates sorted by ranking."""
        cands = list(self.candidates_cache.values())
        cands.sort(key=lambda x: x["ranking"] if x["ranking"] is not None else 9999)
        return cands
        
    def get_candidate(self, candidate_id: str) -> Optional[Dict[str, Any]]:
        return self.candidates_cache.get(candidate_id)
        
    def get_quantum_results(self) -> Optional[Dict[str, Any]]:
        return self.quantum_result_cache
        
    def get_pipeline_status(self) -> Dict[str, Any]:
        has_data = len(self.candidates_cache) > 0
        return {
            "status": "READY" if has_data else "NOT_INITIALIZED",
            "message": "Pipeline data loaded from cache." if has_data else "No data found.",
            "is_cached": True,
            "total_candidates_available": len(self.candidates_cache)
        }

pipeline_service = PipelineService()
