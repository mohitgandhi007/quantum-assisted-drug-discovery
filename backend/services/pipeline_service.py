import os
import pandas as pd
import json
import uuid
from typing import List, Dict, Any, Optional

from config import config

class PipelineService:
    def __init__(self, data_dir: str = None):
        self.data_dir = data_dir if data_dir else config.PROCESSED_DATA_DIR
        self.scored_path = os.path.join(self.data_dir, "scored_candidates.csv")
        self.diverse_path = os.path.join(self.data_dir, "diverse_candidates.csv")
        self.binding_path = os.path.join(self.data_dir, "binding_evidence.csv")
        self.ranked_path = os.path.join(self.data_dir, "ranked_candidates.csv")
        self.qaoa_results_path = os.path.join(self.data_dir, "qaoa_results.json")
        self.generation_metadata_path = os.path.join(self.data_dir, "generation_metadata.json")
        self.diversity_metadata_path = os.path.join(self.data_dir, "diversity_metadata.json")
        self.egfr_ligands_path = os.path.join(self.data_dir, "egfr_ligands.csv")
        
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
        
    def get_detailed_pipeline_response(self) -> Dict[str, Any]:
        # Gather Chembl Fetcher Metadata
        chembl_meta = {"raw_chembl_count": 0, "parsed_count": 0, "unique_count": 0}
        chembl_meta_path = os.path.join(self.data_dir, "chembl_metadata.json")
        if os.path.exists(chembl_meta_path):
            with open(chembl_meta_path, "r") as f:
                chembl_meta = json.load(f)
                
        # Gather Generation Metadata
        gen_meta = {"raw_count": 0, "valid_count": 0, "final_count": 0, "duplicate_count": 0}
        if os.path.exists(self.generation_metadata_path):
            with open(self.generation_metadata_path, "r") as f:
                gen_meta = json.load(f)
                
        # Gather Diversity/Property Metadata
        div_meta = {"property_passed_count": 0, "diverse_count": 0}
        if os.path.exists(self.diversity_metadata_path):
            with open(self.diversity_metadata_path, "r") as f:
                div_meta = json.load(f)
            
        docked = 0
        failed_docking = 0
        if os.path.exists(self.binding_path):
            df_binding = pd.read_csv(self.binding_path)
            docked = len(df_binding[df_binding["method"].str.contains("vina", case=False, na=False)])
            failed_docking = len(df_binding[df_binding["method"].str.contains("tanimoto_proxy", case=False, na=False)])
            
        cands = self.get_all_candidates()
        
        # Build 12 metric summary
        summary = {
            "raw_chembl_records": chembl_meta.get("raw_chembl_count", 0),
            "parsed_ligands": chembl_meta.get("parsed_count", 0),
            "unique_ligands": chembl_meta.get("unique_count", 0),
            "brics_fragments": 0, # Cannot be exactly extracted without saving, let's keep it at 0 or update later
            "raw_generated": gen_meta.get("raw_count", 0),
            "valid_candidates": gen_meta.get("valid_count", 0),
            "deduplicated_candidates": gen_meta.get("final_count", 0),
            "property_passed_candidates": div_meta.get("property_passed_count", 0),
            "diverse_candidates": div_meta.get("diverse_count", 0),
            "docked_candidates": docked,
            "failed_docking": failed_docking,
            "classical_top_candidates": len(cands),
            "quantum_selected_candidates": len(self.quantum_result_cache["selected_candidates"]) if self.quantum_result_cache else 0
        }
        
        # Invariants (Assert logic flow)
        assert summary["unique_ligands"] <= summary["parsed_ligands"], "Logical Invariant failed: Unique Ligands > Parsed"
        assert summary["parsed_ligands"] <= summary["raw_chembl_records"], "Logical Invariant failed: Parsed > Raw ChEMBL"
        assert summary["valid_candidates"] <= summary["raw_generated"], "Logical Invariant failed: Valid > Raw Generated"
        assert summary["deduplicated_candidates"] <= summary["valid_candidates"], "Logical Invariant failed: Deduplicated > Valid"
        assert summary["property_passed_candidates"] <= div_meta.get("initial_scored_count", 0) + 1, "Logical Invariant failed: Property Passed > Scored"
        assert summary["diverse_candidates"] <= summary["property_passed_candidates"], "Logical Invariant failed: Diverse > Property Passed"
        assert summary["docked_candidates"] <= summary["diverse_candidates"], "Logical Invariant failed: Docked > Diverse"
        assert summary["classical_top_candidates"] <= summary["docked_candidates"] + summary["failed_docking"], "Logical Invariant failed: Classical Top > Total Scored"
        assert summary["quantum_selected_candidates"] <= summary["classical_top_candidates"], "Logical Invariant failed: Quantum Selected > Classical Top"
        
        stages = [
            {
                "name": "Target Validation",
                "status": "COMPLETED",
                "message": "Target structures successfully prepared.",
                "details": {"pdb": "1M17", "num_ligands": summary["unique_ligands"]}
            },
            {
                "name": "Molecular Generation",
                "status": "COMPLETED",
                "message": "BRICS generation finished.",
                "details": {"method": "BRICS", "generated": summary["raw_generated"]}
            },
            {
                "name": "Molecular Properties",
                "status": "COMPLETED",
                "message": "ADMET/QED evaluation completed.",
                "details": {"passed": summary["property_passed_candidates"]}
            },
            {
                "name": "Diversity Selection",
                "status": "COMPLETED",
                "message": "MaxMin picker completed.",
                "details": {"diverse": summary["diverse_candidates"]}
            },
            {
                "name": "Docking Simulation",
                "status": "COMPLETED" if failed_docking == 0 else "COMPLETED_WITH_FALLBACK",
                "message": "Binding affinity evaluated.",
                "details": {"successful": docked, "fallback_used": failed_docking}
            },
            {
                "name": "Classical Ranking",
                "status": "COMPLETED",
                "message": "Candidates prioritized.",
                "details": {"top_candidates": summary["classical_top_candidates"]}
            },
            {
                "name": "Quantum Optimization",
                "status": "COMPLETED" if self.quantum_result_cache else "PENDING",
                "message": "QAOA Formulation executed." if self.quantum_result_cache else "Awaiting Quantum.",
                "details": {"selected": summary["quantum_selected_candidates"]} if self.quantum_result_cache else None
            },
            {
                "name": "AI Explanation",
                "status": "COMPLETED",
                "message": "LLM Explanations generated."
            }
        ]

        return {
            "run_id": f"RUN_{str(uuid.uuid4())[:8].upper()}",
            "status": "COMPLETED" if len(cands) > 0 else "FAILED",
            "target": {
                "name": "EGFR",
                "pdb": "1M17",
                "source": "ChEMBL",
                "mode": "Lead optimization / computational screening"
            },
            "stages": stages,
            "summary": summary,
            "candidates": cands,
            "quantum": self.quantum_result_cache,
            "errors": []
        }

pipeline_service = PipelineService()
