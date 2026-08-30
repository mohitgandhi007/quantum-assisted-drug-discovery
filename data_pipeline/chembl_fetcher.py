import logging
import os
import pandas as pd
from typing import List, Dict, Optional
from chembl_webresource_client.new_client import new_client
from rdkit import Chem

from config import config

logger = logging.getLogger(__name__)

class ChEMBLDataPipeline:
    def __init__(self, output_path: str = None):
        self.target_api = new_client.target
        self.activity_api = new_client.activity
        self.output_path = output_path or os.path.join(config.PROCESSED_DATA_DIR, "egfr_ligands.csv")
        
        # Ensure directories exist
        os.makedirs(os.path.dirname(self.output_path), exist_ok=True)

    def get_egfr_target_id(self) -> str:
        """
        Robust lookup for the human EGFR target in ChEMBL.
        """
        logger.info("Looking up EGFR target in ChEMBL...")
        # Search for EGFR in humans
        targets = self.target_api.filter(target_synonym__icontains="EGFR", organism="Homo sapiens")
        
        for target in targets:
            # Look for the single protein target
            if target.get("target_type") == "SINGLE PROTEIN":
                logger.info(f"Found EGFR target: {target['target_chembl_id']} - {target['pref_name']}")
                return target["target_chembl_id"]
        
        raise ValueError("Could not find a valid SINGLE PROTEIN target for human EGFR.")

    def fetch_activities(self, target_chembl_id: str, limit: Optional[int] = None) -> List[Dict]:
        """
        Fetch IC50 activities for the given target, ensuring valid pChEMBL values.
        """
        logger.info(f"Fetching activities for target {target_chembl_id}...")
        
        # We only want standard IC50 measures that have a pChEMBL value
        query = self.activity_api.filter(
            target_chembl_id=target_chembl_id,
            standard_type="IC50",
            standard_relation="="
        ).filter(pchembl_value__isnull=False)

        activities = []
        count = 0
        for act in query:
            if limit and count >= limit:
                break
                
            smiles = act.get("canonical_smiles")
            if not smiles:
                continue

            activities.append({
                "molecule_chembl_id": act.get("molecule_chembl_id"),
                "smiles": smiles,
                "activity_type": act.get("standard_type"),
                "activity_value": float(act.get("standard_value")) if act.get("standard_value") else None,
                "activity_units": act.get("standard_units"),
                "pchembl_value": float(act.get("pchembl_value")),
                "target_chembl_id": act.get("target_chembl_id"),
                "document_chembl_id": act.get("document_chembl_id")
            })
            count += 1
            
        logger.info(f"Fetched {len(activities)} raw activity records.")
        return activities

    def clean_and_validate(self, activities: List[Dict]) -> pd.DataFrame:
        """
        Validates molecules with RDKit and removes duplicates.
        """
        logger.info("Validating molecules and removing duplicates...")
        valid_records = []
        seen_smiles = set()

        for act in activities:
            smiles = act["smiles"]
            
            # Use RDKit to validate and canonicalize
            mol = Chem.MolFromSmiles(smiles)
            if mol is None:
                continue
                
            canonical_smiles = Chem.MolToSmiles(mol)
            
            if canonical_smiles in seen_smiles:
                continue
                
            seen_smiles.add(canonical_smiles)
            
            act["canonical_smiles"] = canonical_smiles
            valid_records.append(act)
            
        df = pd.DataFrame(valid_records)
        logger.info(f"Retained {len(df)} valid, unique molecules.")
        return df

    def run_pipeline(self, limit: int = 100) -> pd.DataFrame:
        """
        Runs the full ingestion pipeline.
        """
        target_id = self.get_egfr_target_id()
        raw_activities = self.fetch_activities(target_id, limit=limit)
        df = self.clean_and_validate(raw_activities)
        
        # Save dataset
        df.to_csv(self.output_path, index=False)
        logger.info(f"Dataset saved to {self.output_path}")
        return df

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    pipeline = ChEMBLDataPipeline()
    # Limit to 50 for rapid testing
    df = pipeline.run_pipeline(limit=50)
    print("\nSample of final dataset:")
    print(df[["molecule_chembl_id", "canonical_smiles", "pchembl_value", "activity_value", "activity_units"]].head())
