import logging
import pandas as pd
from typing import Dict, Any
from rdkit import Chem
from rdkit.Chem import Descriptors, QED, rdMolDescriptors
from rdkit.Chem.FilterCatalog import FilterCatalog, FilterCatalogParams

logger = logging.getLogger(__name__)

class CandidateScorer:
    def __init__(self):
        # Initialize PAINS filter catalog
        params = FilterCatalogParams()
        params.AddCatalog(FilterCatalogParams.FilterCatalogs.PAINS_A)
        params.AddCatalog(FilterCatalogParams.FilterCatalogs.PAINS_B)
        params.AddCatalog(FilterCatalogParams.FilterCatalogs.PAINS_C)
        self.pains_catalog = FilterCatalog(params)

    def calculate_esol(self, mol: Chem.Mol) -> float:
        """
        Calculates estimated aqueous solubility (ESOL) using the Delaney (2004) equation.
        Log(S) = 0.16 - 0.63 * clogP - 0.0062 * MW + 0.066 * RB - 0.74 * AP
        Where:
        clogP: Calculated logP
        MW: Molecular Weight
        RB: Number of Rotatable Bonds
        AP: Aromatic Proportion (number of aromatic heavy atoms / total heavy atoms)
        """
        clogp = Descriptors.MolLogP(mol)
        mw = Descriptors.MolWt(mol)
        rb = Descriptors.NumRotatableBonds(mol)
        
        heavy_atoms = mol.GetNumHeavyAtoms()
        aromatic_atoms = sum(1 for atom in mol.GetAtoms() if atom.GetIsAromatic())
        ap = aromatic_atoms / heavy_atoms if heavy_atoms > 0 else 0.0
        
        esol = 0.16 - (0.63 * clogp) - (0.0062 * mw) + (0.066 * rb) - (0.74 * ap)
        return round(esol, 3)

    def score_molecule(self, candidate_id: str, smiles: str) -> Dict[str, Any]:
        """
        Scores a single molecule and returns a structured dictionary of properties.
        """
        mol = Chem.MolFromSmiles(smiles)
        if mol is None:
            return {
                "candidate_id": candidate_id,
                "smiles": smiles,
                "validity_status": "INVALID_SMILES"
            }
            
        # 1. QED
        qed_score = round(QED.qed(mol), 3)
        
        # 2. ESOL
        esol_score = self.calculate_esol(mol)
        
        # 3. PAINS
        pains_matches = [entry for entry in self.pains_catalog.GetMatches(mol)]
        pains_alert_count = len(pains_matches)
        pains_flag = pains_alert_count > 0
        
        # Additional Descriptors
        mw = round(Descriptors.MolWt(mol), 2)
        logp = round(Descriptors.MolLogP(mol), 3)
        hbd = rdMolDescriptors.CalcNumHBD(mol)
        hba = rdMolDescriptors.CalcNumHBA(mol)
        rot_bonds = Descriptors.NumRotatableBonds(mol)

        return {
            "candidate_id": candidate_id,
            "smiles": smiles,
            "qed": qed_score,
            "esol": esol_score,
            "pains_alert_count": pains_alert_count,
            "pains_flag": pains_flag,
            "molecular_weight": mw,
            "logp": logp,
            "h_bond_donors": hbd,
            "h_bond_acceptors": hba,
            "rotatable_bonds": rot_bonds
        }

    def score_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Takes a dataframe with 'candidate_id' and 'smiles' and returns it with scoring columns added.
        """
        logger.info(f"Scoring {len(df)} candidates...")
        scored_records = []
        for _, row in df.iterrows():
            cid = row.get("candidate_id", "UNKNOWN")
            smiles = row.get("smiles", "")
            
            # Base record
            record = row.to_dict()
            
            # Score
            scores = self.score_molecule(cid, smiles)
            
            # Merge
            record.update(scores)
            scored_records.append(record)
            
        logger.info("Scoring complete.")
        return pd.DataFrame(scored_records)

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    import os
    from config import config
    
    input_path = os.path.join(config.PROCESSED_DATA_DIR, "generated_candidates.csv")
    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found.")
        exit(1)
    df_in = pd.read_csv(input_path)
    
    scorer = CandidateScorer()
    df_out = scorer.score_dataframe(df_in)
    
    output_path = os.path.join(config.PROCESSED_DATA_DIR, "scored_candidates.csv")
    df_out.to_csv(output_path, index=False)
    
    print("\n--- Scoring Results (Sample) ---")
    display_cols = ["candidate_id", "smiles", "qed", "esol", "pains_flag", "molecular_weight"]
    print(df_out[display_cols].head())
