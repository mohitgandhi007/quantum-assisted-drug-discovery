import unittest
import pandas as pd
from rdkit import Chem
from chemistry.generator import BRICSGenerator

class TestBRICSGenerator(unittest.TestCase):
    def setUp(self):
        # Create a tiny synthetic dataset of valid molecules
        self.input_data = pd.DataFrame([
            {"molecule_chembl_id": "MOL1", "canonical_smiles": "CC(=O)Nc1ccc(O)cc1"}, # Paracetamol
            {"molecule_chembl_id": "MOL2", "canonical_smiles": "CC(C)(C)NCC(O)c1ccc(O)c(CO)c1"}, # Salbutamol
            {"molecule_chembl_id": "MOL3", "canonical_smiles": "c1ccccc1"} # Benzene (no BRICS bonds, should not crash)
        ])
        self.generator = BRICSGenerator(random_seed=42)

    def test_generator_schema(self):
        df_out = self.generator.generate(self.input_data, limit=5)
        
        # Verify schema
        expected_cols = {"candidate_id", "smiles", "parent_ids", "generation_method", "validity_status"}
        self.assertTrue(expected_cols.issubset(df_out.columns))
        
        if len(df_out) > 0:
            row = df_out.iloc[0]
            self.assertTrue(row["candidate_id"].startswith("GEN_"))
            self.assertEqual(row["generation_method"], "BRICS")
            self.assertEqual(row["validity_status"], "VALID")
            
            # Verify RDKit can read the generated SMILES
            mol = Chem.MolFromSmiles(row["smiles"])
            self.assertIsNotNone(mol)
            
    def test_generator_limit(self):
        df_out = self.generator.generate(self.input_data, limit=2)
        self.assertLessEqual(len(df_out), 2)
        
    def test_duplicate_removal(self):
        # Ensure that no duplicate SMILES are present in the output
        df_out = self.generator.generate(self.input_data, limit=50)
        num_smiles = len(df_out["smiles"])
        num_unique = len(df_out["smiles"].unique())
        self.assertEqual(num_smiles, num_unique)

if __name__ == "__main__":
    unittest.main()
