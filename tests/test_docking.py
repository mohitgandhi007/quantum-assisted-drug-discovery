import unittest
import pandas as pd
from unittest.mock import patch, MagicMock
from docking.run_docking import HTVS

class TestHTVS(unittest.TestCase):
    def setUp(self):
        # We supply a reference SMILES (Benzene) for fallback testing
        self.htvs = HTVS(
            receptor_pdbqt="dummy.pdbqt",
            center=[0, 0, 0],
            size=[20, 20, 20],
            vina_path="dummy",
            reference_smiles=["c1ccccc1"]
        )
        
    def test_pre_ranking(self):
        df = pd.DataFrame([
            {"candidate_id": "C1", "qed": 0.5, "esol": -3.0, "pains_flag": False},
            {"candidate_id": "C2", "qed": 0.9, "esol": -2.0, "pains_flag": False}, # Best
            {"candidate_id": "C3", "qed": 0.9, "esol": -4.0, "pains_flag": True},  # PAINS, should be dropped
            {"candidate_id": "C4", "qed": 0.1, "esol": -5.0, "pains_flag": False}, # Worst
        ])
        
        top_n = self.htvs.pre_rank_candidates(df, limit=2)
        self.assertEqual(len(top_n), 2)
        
        # C3 should be dropped. C2 should be first, C1 second.
        self.assertEqual(top_n.iloc[0]["candidate_id"], "C2")
        self.assertEqual(top_n.iloc[1]["candidate_id"], "C1")

    def test_compute_fallback_score(self):
        # Test similarity to benzene
        # 1. Exact match (Benzene) -> sim 1.0
        res1 = self.htvs.compute_fallback_score("c1ccccc1")
        self.assertAlmostEqual(res1["score"], 1.0)
        self.assertEqual(res1["reference"], "c1ccccc1")
        
        # 2. Toluene -> sim should be > 0 but < 1.0
        res2 = self.htvs.compute_fallback_score("Cc1ccccc1")
        self.assertGreater(res2["score"], 0.0)
        self.assertLess(res2["score"], 1.0)
        
    @patch('docking.run_docking.HTVS.prepare_ligand')
    @patch('docking.run_docking.HTVS.dock_ligand')
    def test_run_docking_batch_vina_success(self, mock_dock, mock_prep):
        # Mock successful Vina run
        mock_prep.return_value = "dummy_ligand.pdbqt"
        mock_dock.return_value = {"score": -8.5, "output_path": "dummy_docked.pdbqt"}
        
        df = pd.DataFrame([{"candidate_id": "C1", "smiles": "c1ccccc1", "qed": 0.9, "esol": -2.0, "pains_flag": False}])
        
        results = self.htvs.run_docking_batch(df, limit=1)
        self.assertEqual(len(results), 1)
        row = results.iloc[0]
        
        self.assertEqual(row["status"], "SUCCESS_VINA")
        self.assertEqual(row["method"], "vina")
        self.assertEqual(row["score"], -8.5)
        self.assertEqual(row["score_direction"], "negative_is_better")
        self.assertEqual(row["reference"], "dummy.pdbqt")
        
    @patch('docking.run_docking.HTVS.prepare_ligand')
    def test_run_docking_batch_vina_fallback(self, mock_prep):
        # Mock Vina failure (e.g. preparation fails)
        mock_prep.side_effect = RuntimeError("Failed to prepare 3D structure")
        
        df = pd.DataFrame([{"candidate_id": "C1", "smiles": "c1ccccc1", "qed": 0.9, "esol": -2.0, "pains_flag": False}])
        
        results = self.htvs.run_docking_batch(df, limit=1)
        self.assertEqual(len(results), 1)
        row = results.iloc[0]
        
        self.assertEqual(row["status"], "SUCCESS_FALLBACK")
        self.assertEqual(row["method"], "tanimoto_proxy")
        self.assertEqual(row["score"], 1.0) # Exact match to reference
        self.assertEqual(row["score_direction"], "positive_is_better")
        self.assertEqual(row["reference"], "c1ccccc1")
        self.assertIn("Failed to prepare", row["error_message"])

if __name__ == "__main__":
    unittest.main()
