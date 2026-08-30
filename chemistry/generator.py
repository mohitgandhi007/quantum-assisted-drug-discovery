import logging
import pandas as pd
from typing import List, Dict, Set, Tuple
from rdkit import Chem
from rdkit.Chem import BRICS
import uuid
import hashlib
import json
import random
import os

from config import config

logger = logging.getLogger(__name__)

class BRICSGenerator:
    def __init__(self, random_seed: int = None, limit: int = None):
        self.random_seed = random_seed if random_seed is not None else config.GENERATOR_SEED
        self.limit = limit if limit is not None else config.GENERATOR_LIMIT
        random.seed(self.random_seed)
        
    def generate(self, input_df: pd.DataFrame) -> pd.DataFrame:
        """
        Takes a dataframe with 'molecule_chembl_id' and 'canonical_smiles'.
        Fragments the molecules using BRICS, recombines them, and outputs up to self.limit valid/unique candidates.
        """
        logger.info(f"Starting BRICS generation from {len(input_df)} source molecules.")
        
        # Step 1: Decompose into fragments and track provenance
        fragment_pool = set()
        frag_to_parents: Dict[str, Set[str]] = {}
        
        for _, row in input_df.iterrows():
            parent_id = row['molecule_chembl_id']
            smiles = row['canonical_smiles']
            
            mol = Chem.MolFromSmiles(smiles)
            if not mol:
                continue
                
            try:
                frags = BRICS.BRICSDecompose(mol)
                for f in frags:
                    fragment_pool.add(f)
                    if f not in frag_to_parents:
                        frag_to_parents[f] = set()
                    frag_to_parents[f].add(parent_id)
            except Exception as e:
                logger.warning(f"Could not fragment {parent_id}: {e}")
                
        logger.info(f"Extracted {len(fragment_pool)} unique BRICS fragments.")
        
        # Step 2: Recombine fragments
        frag_mols = [Chem.MolFromSmiles(f) for f in fragment_pool if Chem.MolFromSmiles(f) is not None]
        
        # BRICSBuild yields a generator of molecules
        builder = BRICS.BRICSBuild(frag_mols)
        
        # Step 3 & 4: Validity filtering, deduplication, and provenance tracking
        candidates = []
        seen_smiles = set()
        
        # Add original molecules to seen_smiles to filter knowns
        for _, row in input_df.iterrows():
            seen_smiles.add(row['canonical_smiles'])
            
        generated_count = 0
        valid_count = 0
        duplicate_count = 0
        
        # Add a safety limit for iteration, BRICSBuild can yield massive numbers
        max_iterations = self.limit * 50
        
        for i, gen_mol in enumerate(builder):
            if i >= max_iterations or len(candidates) >= self.limit:
                break
                
            generated_count += 1
            
            # Check validity
            try:
                # Sanitize to check chemical validity
                Chem.SanitizeMol(gen_mol)
                gen_smiles = Chem.MolToSmiles(gen_mol)
                valid_count += 1
            except Exception:
                # Invalid molecule
                continue
                
            # Deduplicate (including known molecules)
            if gen_smiles in seen_smiles:
                duplicate_count += 1
                continue
                
            seen_smiles.add(gen_smiles)
            
            # Re-decompose to find provenance
            gen_frags = BRICS.BRICSDecompose(gen_mol)
            parents = set()
            for f in gen_frags:
                if f in frag_to_parents:
                    parents.update(frag_to_parents[f])
                    
            parent_ids_str = ";".join(sorted(list(parents)))
            candidate_id = f"GEN_{hashlib.sha256(gen_smiles.encode()).hexdigest()[:8].upper()}"
            
            candidates.append({
                "candidate_id": candidate_id,
                "smiles": gen_smiles,
                "parent_ids": parent_ids_str,
                "generation_method": "BRICS",
                "validity_status": True
            })
            
            # Early stopping if we hit the limit after filtering
            if len(candidates) >= self.limit:
                break
            
        logger.info(f"Generation complete.")
        logger.info(f"Source molecules: {len(input_df)}")
        logger.info(f"Total generated (raw): {generated_count}")
        logger.info(f"Valid molecules: {valid_count}")
        logger.info(f"Duplicates/Known removed: {duplicate_count}")
        logger.info(f"Final candidates retained: {len(candidates)}")
        
        # Save metadata
        metadata = {
            "source": "ChEMBL EGFR ligands",
            "generation_method": "BRICS",
            "raw_count": generated_count,
            "valid_count": valid_count,
            "duplicate_count": duplicate_count,
            "final_count": len(candidates)
        }
        metadata_path = os.path.join(config.PROCESSED_DATA_DIR, "generation_metadata.json")
        os.makedirs(os.path.dirname(metadata_path), exist_ok=True)
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=4)
        
        df_out = pd.DataFrame(candidates)
        return df_out

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    input_path = os.path.join(config.PROCESSED_DATA_DIR, "egfr_ligands.csv")
    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found.")
        exit(1)
        
    df_in = pd.read_csv(input_path)
    
    generator = BRICSGenerator()
    df_out = generator.generate(df_in)
    
    output_path = os.path.join(config.PROCESSED_DATA_DIR, "generated_candidates.csv")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df_out.to_csv(output_path, index=False)
    
    print("\n--- Generation Results ---")
    print(f"Source molecules: {len(df_in)}")
    print(f"Final candidates retained: {len(df_out)}")
    print("\nSample generated candidates:")
    print(df_out.head())
