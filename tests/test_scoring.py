import unittest
import pandas as pd
from rdkit import Chem
from chemistry.scoring import CandidateScorer

class TestCandidateScorer(unittest.TestCase):
    def setUp(self):
        self.scorer = CandidateScorer()
        
    def test_score_valid_molecule(self):
        # Aspirin
        smiles = "CC(=O)Oc1ccccc1C(=O)O"
        result = self.scorer.score_molecule("MOL1", smiles)
        
        self.assertEqual(result["candidate_id"], "MOL1")
        self.assertEqual(result["smiles"], smiles)
        self.assertIn("qed", result)
        self.assertIn("esol", result)
        self.assertIn("pains_alert_count", result)
        self.assertIn("pains_flag", result)
        
        # Check descriptors are somewhat reasonable for aspirin
        self.assertGreater(result["molecular_weight"], 150)
        self.assertLess(result["molecular_weight"], 200)
        self.assertEqual(result["h_bond_donors"], 1)
        
    def test_pains_filter(self):
        # Known PAINS alert (Catechol) or similar, let's use a generic quinone or known PAINS structure
        # Toxoflavin derivative (known PAINS usually) or just 1,2-benzoquinone
        # Simple catechol is sometimes flagged, but let's use a thiophene or a hydrazine
        # "O=C1C=CC(=O)C=C1" (benzoquinone) is a classic PAINS alert
        pains_smiles = "O=C1C=CC(=O)C=C1" 
        result = self.scorer.score_molecule("PAINS1", pains_smiles)
        self.assertTrue(result["pains_flag"])
        self.assertGreater(result["pains_alert_count"], 0)
        
    def test_score_dataframe(self):
        df = pd.DataFrame([
            {"candidate_id": "C1", "smiles": "CCO"},
            {"candidate_id": "C2", "smiles": "c1ccccc1"}
        ])
        
        df_scored = self.scorer.score_dataframe(df)
        self.assertEqual(len(df_scored), 2)
        self.assertIn("qed", df_scored.columns)
        self.assertIn("esol", df_scored.columns)
        self.assertIn("pains_flag", df_scored.columns)

if __name__ == "__main__":
    unittest.main()
