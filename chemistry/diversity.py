import logging
import pandas as pd
from typing import List, Dict, Any
from rdkit import Chem
from rdkit.Chem import AllChem
from rdkit import DataStructs
from rdkit.SimDivFilters.rdSimDivPickers import MaxMinPicker
import os
import json
import numpy as np

from config import config

logger = logging.getLogger(__name__)

class DiversitySelector:
    def __init__(self, limit: int = None):
        self.limit = limit if limit is not None else config.DIVERSITY_LIMIT
        
    def select_diverse_subset(self, df: pd.DataFrame) -> pd.DataFrame:
        logger.info(f"Starting diversity selection from {len(df)} scored candidates.")
        
        # 1. Filter out MW outliers
        initial_count = len(df)
        df_filtered = df[(df["molecular_weight"] >= config.MW_MIN) & 
                         (df["molecular_weight"] <= config.MW_MAX)].copy()
                         
        property_passed_count = len(df_filtered)
        logger.info(f"Passed property filters (MW & PAINS): {property_passed_count} / {initial_count}")
        
        if property_passed_count == 0:
            logger.warning("No candidates passed the property filters!")
            return pd.DataFrame()
            
        if property_passed_count <= self.limit:
            logger.info(f"Candidates ({property_passed_count}) <= limit ({self.limit}). Returning all passed candidates.")
            return df_filtered
            
        # 2. Calculate Morgan fingerprints for the filtered set
        smiles_list = df_filtered["smiles"].tolist()
        fps = []
        valid_indices = []
        
        for i, smiles in enumerate(smiles_list):
            mol = Chem.MolFromSmiles(smiles)
            if mol:
                fp = AllChem.GetMorganFingerprintAsBitVect(mol, radius=2, nBits=1024)
                fps.append(fp)
                valid_indices.append(i)
                
        logger.info(f"Calculated {len(fps)} fingerprints.")
        
        if not fps:
            return pd.DataFrame()
            
        # 3. Use RDKit MaxMinPicker
        picker = MaxMinPicker()
        def distij(i, j, fps=fps):
            return 1.0 - DataStructs.TanimotoSimilarity(fps[i], fps[j])
            
        # Or faster: LazyBitVectorPick
        logger.info(f"Picking {self.limit} diverse molecules using MaxMinPicker...")
        picked_indices = picker.LazyBitVectorPick(fps, len(fps), self.limit)
        
        # Map picked indices back to original dataframe indices
        actual_indices = [valid_indices[i] for i in picked_indices]
        df_diverse = df_filtered.iloc[actual_indices].copy()
        
        diverse_count = len(df_diverse)
        logger.info(f"Diversity selection complete. Final count: {diverse_count}")
        
        # Save metadata
        metadata = {
            "initial_scored_count": initial_count,
            "property_passed_count": property_passed_count,
            "diversity_filtered_count": property_passed_count - diverse_count, # how many were removed by diversity
            "diverse_count": diverse_count
        }
        metadata_path = os.path.join(config.PROCESSED_DATA_DIR, "diversity_metadata.json")
        os.makedirs(os.path.dirname(metadata_path), exist_ok=True)
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=4)
            
        return df_diverse

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    input_path = os.path.join(config.PROCESSED_DATA_DIR, "scored_candidates.csv")
    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found.")
        exit(1)
        
    df_in = pd.read_csv(input_path)
    
    selector = DiversitySelector()
    
    # Import inside method was missing DataStructs so I will import here for the class
    from rdkit import DataStructs
    # Quick monkey patch for the class
    DiversitySelector.DataStructs = DataStructs
    
    df_out = selector.select_diverse_subset(df_in)
    
    output_path = os.path.join(config.PROCESSED_DATA_DIR, "diverse_candidates.csv")
    df_out.to_csv(output_path, index=False)
    
    print("\n--- Diversity Selection Results ---")
    print(f"Property passed candidates: {len(df_in[(df_in['molecular_weight'] >= config.MW_MIN) & (df_in['molecular_weight'] <= config.MW_MAX)])}")
    print(f"Final diverse candidates: {len(df_out)}")
