import logging
import pandas as pd
import os
import subprocess
import time
from typing import List, Dict, Any, Optional
from rdkit import Chem
from rdkit.Chem import AllChem
from rdkit import DataStructs

from config import config

logger = logging.getLogger(__name__)

class HTVS:
    def __init__(
        self, 
        receptor_pdbqt: str = None, 
        center: List[float] = None, 
        size: List[float] = None, 
        vina_path: str = None,
        reference_smiles: Optional[List[str]] = None
    ):
        self.receptor_pdbqt = receptor_pdbqt if receptor_pdbqt else config.RECEPTOR_PDBQT
        self.center = center if center else [config.DOCKING_CENTER_X, config.DOCKING_CENTER_Y, config.DOCKING_CENTER_Z]
        self.size = size if size else [config.DOCKING_SIZE_X, config.DOCKING_SIZE_Y, config.DOCKING_SIZE_Z]
        self.vina_path = vina_path if vina_path else config.VINA_PATH
        self.reference_smiles = reference_smiles if reference_smiles else [config.REFERENCE_SMILES]
        
        # Pre-compute fingerprints for references for fast fallback calculation
        self.reference_fps = []
        for smi in self.reference_smiles:
            mol = Chem.MolFromSmiles(smi)
            if mol:
                fp = AllChem.GetMorganFingerprintAsBitVect(mol, radius=2, nBits=2048)
                self.reference_fps.append((smi, fp))
                
        self.output_dir = config.DOCKING_OUTPUT_DIR
        os.makedirs(self.output_dir, exist_ok=True)

    def pre_rank_candidates(self, df: pd.DataFrame, limit: int = 20) -> pd.DataFrame:
        """
        Pre-ranks scored candidates deterministically.
        Criteria:
        1. Must not have PAINS alerts.
        2. Sorted by QED descending (druglikeness).
        3. Sorted by ESOL descending (solubility).
        """
        logger.info(f"Pre-ranking candidates from {len(df)} total scored molecules...")
        
        # Filter PAINS
        if "pains_flag" in df.columns:
            df_filtered = df[df["pains_flag"] == False].copy()
            logger.info(f"Retained {len(df_filtered)} non-PAINS candidates.")
            
            # Sort non-PAINS
            df_sorted = df_filtered.sort_values(by=["qed", "esol"], ascending=[False, False])
            
            # If we don't have enough non-PAINS, pad with PAINS candidates
            if len(df_sorted) < limit:
                logger.warning(f"Not enough non-PAINS candidates to reach limit {limit}. Padding with PAINS candidates.")
                df_pains = df[df["pains_flag"] == True].copy()
                df_pains_sorted = df_pains.sort_values(by=["qed", "esol"], ascending=[False, False])
                df_sorted = pd.concat([df_sorted, df_pains_sorted])
        else:
            df_filtered = df.copy()
            df_sorted = df_filtered.sort_values(by=["qed", "esol"], ascending=[False, False])
        
        top_n = df_sorted.head(limit)
        logger.info(f"Selected top {len(top_n)} candidates for docking.")
        return top_n

    def prepare_ligand(self, candidate_id: str, smiles: str) -> str:
        """
        Converts SMILES to 3D SDF using RDKit, then to PDBQT using meeko.
        Returns the path to the PDBQT file.
        """
        sdf_path = os.path.join(self.output_dir, f"{candidate_id}.sdf")
        pdbqt_path = os.path.join(self.output_dir, f"{candidate_id}.pdbqt")
        
        # 1. SMILES -> 3D SDF
        mol = Chem.MolFromSmiles(smiles)
        if not mol:
            raise ValueError(f"Invalid SMILES for {candidate_id}")
            
        mol = Chem.AddHs(mol)
        
        # Generate 3D coordinates
        res = AllChem.EmbedMolecule(mol, randomSeed=42)
        if res != 0:
            raise ValueError(f"Failed to embed 3D coordinates for {candidate_id}")
            
        AllChem.MMFFOptimizeMolecule(mol)
        
        writer = Chem.SDWriter(sdf_path)
        writer.write(mol)
        writer.close()
        
        # 2. SDF -> PDBQT using meeko
        cmd = ["venv/bin/mk_prepare_ligand.py", "-i", sdf_path, "-o", pdbqt_path]
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0 or not os.path.exists(pdbqt_path):
            raise RuntimeError(f"Meeko failed to prepare ligand: {result.stderr}")
            
        return pdbqt_path

    def dock_ligand(self, pdbqt_path: str, candidate_id: str) -> Dict[str, Any]:
        """
        Runs Vina on a single prepared ligand.
        """
        output_pdbqt = os.path.join(self.output_dir, f"{candidate_id}_docked.pdbqt")
        log_file = os.path.join(self.output_dir, f"{candidate_id}_vina.log")
        
        cmd = [
            self.vina_path,
            "--receptor", self.receptor_pdbqt,
            "--ligand", pdbqt_path,
            "--center_x", str(self.center[0]),
            "--center_y", str(self.center[1]),
            "--center_z", str(self.center[2]),
            "--size_x", str(self.size[0]),
            "--size_y", str(self.size[1]),
            "--size_z", str(self.size[2]),
            "--out", output_pdbqt
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        with open(log_file, "w") as f:
            f.write(result.stdout)
            
        if result.returncode != 0:
            raise RuntimeError(f"Vina failed: {result.stderr}")
            
        # Extract score
        scores = []
        for line in result.stdout.splitlines():
            if line.strip().startswith("1"):
                parts = line.split()
                if len(parts) >= 2:
                    try:
                        scores.append(float(parts[1]))
                    except ValueError:
                        pass
                        
        if not scores:
            raise RuntimeError("Could not parse Vina score from output.")
            
        return {
            "score": scores[0],
            "output_path": output_pdbqt
        }

    def compute_fallback_score(self, smiles: str) -> Dict[str, Any]:
        """
        Computes a Tanimoto similarity to the known references if Vina fails.
        """
        if not self.reference_fps:
            raise RuntimeError("Fallback requested, but no reference SMILES provided.")
            
        mol = Chem.MolFromSmiles(smiles)
        if not mol:
            raise RuntimeError("Invalid SMILES for fallback similarity computation.")
            
        fp = AllChem.GetMorganFingerprintAsBitVect(mol, radius=2, nBits=2048)
        
        best_sim = -1.0
        best_ref = None
        
        for ref_smi, ref_fp in self.reference_fps:
            sim = DataStructs.TanimotoSimilarity(fp, ref_fp)
            if sim > best_sim:
                best_sim = sim
                best_ref = ref_smi
                
        return {
            "score": round(best_sim, 3),
            "reference": best_ref
        }

    def run_docking_batch(self, df: pd.DataFrame, limit: int = 20) -> pd.DataFrame:
        """
        Runs the full docking pipeline on the top candidates, using the unified binding-evidence schema.
        """
        top_candidates = self.pre_rank_candidates(df, limit=limit)
        results = []
        
        start_time = time.time()
        
        success_vina_count = 0
        success_fallback_count = 0
        failed_count = 0
        
        for _, row in top_candidates.iterrows():
            cid = row["candidate_id"]
            smiles = row["smiles"]
            
            logger.info(f"Evaluating candidate {cid}...")
            
            # Unified schema
            result_record = {
                "candidate_id": cid,
                "smiles": smiles,
                "method": None,
                "score": None,
                "score_direction": None,
                "reference": None,
                "status": "FAILED",
                "limitations": None,
                "error_message": None,
                "docking_output_path": None
            }
            
            try:
                # 1. Try Vina Docking
                pdbqt_path = self.prepare_ligand(cid, smiles)
                dock_res = self.dock_ligand(pdbqt_path, cid)
                
                result_record["method"] = "vina"
                result_record["score"] = dock_res["score"]
                result_record["score_direction"] = "negative_is_better"
                result_record["reference"] = self.receptor_pdbqt
                result_record["status"] = "SUCCESS_VINA"
                result_record["limitations"] = "AutoDock Vina score; empirical scoring function; relies on static receptor conformation."
                result_record["docking_output_path"] = dock_res["output_path"]
                success_vina_count += 1
                logger.info(f"  Vina Success: {dock_res['score']} kcal/mol")
                
            except Exception as e:
                # 2. Fallback to Tanimoto Similarity Proxy
                logger.warning(f"  Vina Failed ({e}). Attempting Fallback...")
                try:
                    fallback_res = self.compute_fallback_score(smiles)
                    result_record["method"] = "tanimoto_proxy"
                    result_record["score"] = fallback_res["score"]
                    result_record["score_direction"] = "positive_is_better"
                    result_record["reference"] = fallback_res["reference"]
                    result_record["status"] = "SUCCESS_FALLBACK"
                    result_record["limitations"] = "Tanimoto similarity proxy. NOT a physical docking score or binding energy. Relies purely on 2D structural similarity to a known active reference."
                    result_record["error_message"] = f"Vina error: {e}" # Log why Vina failed
                    success_fallback_count += 1
                    logger.info(f"  Fallback Success: {fallback_res['score']} (Tanimoto)")
                except Exception as fb_e:
                    result_record["status"] = "FAILED_BOTH"
                    result_record["error_message"] = f"Vina error: {e} | Fallback error: {fb_e}"
                    failed_count += 1
                    logger.error(f"  Fallback Failed: {fb_e}")
                
            results.append(result_record)
            
        end_time = time.time()
        
        logger.info("\n--- Batch Evaluation Summary ---")
        logger.info(f"Vina Success: {success_vina_count}")
        logger.info(f"Fallback Success: {success_fallback_count}")
        logger.info(f"Total Failed: {failed_count}")
        logger.info(f"Runtime: {end_time - start_time:.2f} seconds")
        
        return pd.DataFrame(results)

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    
    input_path = os.path.join(config.PROCESSED_DATA_DIR, "scored_candidates.csv")
    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found.")
        exit(1)
        
    df_scored = pd.read_csv(input_path)
    
    htvs = HTVS()
    
    df_results = htvs.run_docking_batch(df_scored, limit=20)
    
    output_path = os.path.join(config.PROCESSED_DATA_DIR, "binding_evidence.csv")
    df_results.to_csv(output_path, index=False)
    
    print("\n--- Evaluation Output Schema Sample ---")
    if not df_results.empty:
        display_cols = ["candidate_id", "method", "score", "score_direction", "status"]
        print(df_results[display_cols].head(5).to_string(index=False))
