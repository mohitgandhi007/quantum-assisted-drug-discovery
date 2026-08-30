import unittest
import pandas as pd
from rdkit import Chem
from chemistry.generator import BRICSGenerator
import hashlib

class TestBRICSGenerator(unittest.TestCase):
    def setUp(self):
        # Create a tiny synthetic dataset of valid molecules
        self.input_data = pd.DataFrame([
            {"molecule_chembl_id": "MOL1", "canonical_smiles": "CC(=O)Nc1ccc(O)cc1"}, # Paracetamol
            {"molecule_chembl_id": "MOL2", "canonical_smiles": "CC(C)(C)NCC(O)c1ccc(O)c(CO)c1"}, # Salbutamol
            {"molecule_chembl_id": "MOL3", "canonical_smiles": "c1ccccc1"} # Benzene
        ])
        self.generator = BRICSGenerator(random_seed=42)

    def test_generator_schema_and_id(self):
        df_out = self.generator.generate(self.input_data)
        
        # Verify schema
        expected_cols = {"candidate_id", "smiles", "source_ligand_ids", "generation_method", "validity_status"}
        self.assertTrue(expected_cols.issubset(df_out.columns))
        
        if len(df_out) > 0:
            row = df_out.iloc[0]
            self.assertTrue(row["candidate_id"].startswith("GEN_"))
            self.assertEqual(row["generation_method"], "BRICS")
            self.assertTrue(row["validity_status"] in ["VALID", True])
            
            # Verify deterministic ID
            expected_hash = hashlib.sha256(row["smiles"].encode()).hexdigest()[:8].upper()
            self.assertEqual(row["candidate_id"], f"GEN_{expected_hash}")
            
    def test_generator_limit(self):
        self.generator.limit = 2
        df_out = self.generator.generate(self.input_data)
        self.assertLessEqual(len(df_out), 2)
        
    def test_duplicate_and_known_removal(self):
        df_out = self.generator.generate(self.input_data)
        num_smiles = len(df_out["smiles"])
        num_unique = len(df_out["smiles"].unique())
        self.assertEqual(num_smiles, num_unique)
        
        # Verify no known molecules are retained
        known = set(self.input_data["canonical_smiles"])
        for s in df_out["smiles"]:
            self.assertNotIn(s, known)

if __name__ == "__main__":
    unittest.main()
