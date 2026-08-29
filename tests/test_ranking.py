import unittest
import pandas as pd
from chemistry.ranking import ClassicalRanker

class TestClassicalRanker(unittest.TestCase):
    def setUp(self):
        # weights: QED 1.0, ESOL 0.5, BINDING 2.0 (Total = 3.5)
        self.ranker = ClassicalRanker(weights={"qed": 1.0, "esol": 0.5, "binding": 2.0}, pains_penalty=10.0)

    def test_normalization_directions(self):
        series = pd.Series([10.0, 5.0, 0.0])
        
        # Positive is better: 10->1, 5->0.5, 0->0
        norm_pos = self.ranker._normalize_series(series, "positive_is_better")
        self.assertEqual(norm_pos.iloc[0], 1.0)
        self.assertEqual(norm_pos.iloc[2], 0.0)
        
        # Negative is better: 10->0, 5->0.5, 0->1
        norm_neg = self.ranker._normalize_series(series, "negative_is_better")
        self.assertEqual(norm_neg.iloc[0], 0.0)
        self.assertEqual(norm_neg.iloc[2], 1.0)

    def test_ranking_logic(self):
        # Create synthetic data
        df_scored = pd.DataFrame([
            {"candidate_id": "C1", "smiles": "A", "qed": 0.9, "esol": -2.0, "pains_flag": False}, # Best QED/ESOL
            {"candidate_id": "C2", "smiles": "B", "qed": 0.5, "esol": -4.0, "pains_flag": False}, # Avg QED/ESOL
            {"candidate_id": "C3", "smiles": "C", "qed": 0.1, "esol": -6.0, "pains_flag": False}, # Worst QED/ESOL
            {"candidate_id": "C4", "smiles": "D", "qed": 0.9, "esol": -2.0, "pains_flag": True},  # Best QED/ESOL but PAINS
        ])
        
        # Binding scores
        df_binding = pd.DataFrame([
            # C1 has terrible docking score
            {"candidate_id": "C1", "method": "Vina", "score": -4.0, "score_direction": "negative_is_better", "status": "SUCCESS"},
            # C2 has best docking score
            {"candidate_id": "C2", "method": "Vina", "score": -9.0, "score_direction": "negative_is_better", "status": "SUCCESS"},
            # C3 has avg docking score
            {"candidate_id": "C3", "method": "Vina", "score": -6.5, "score_direction": "negative_is_better", "status": "SUCCESS"},
            # C4 has best docking score but has PAINS
            {"candidate_id": "C4", "method": "Vina", "score": -9.0, "score_direction": "negative_is_better", "status": "SUCCESS"},
        ])
        
        df_ranked = self.ranker.rank_candidates(df_scored, df_binding)
        
        self.assertEqual(len(df_ranked), 4)
        
        # C2 should win because binding has weight 2.0 (highest).
        # C2 norm_binding = 1.0. C2 norm_qed = 0.5, norm_esol = 0.5.
        # Score C2 = (0.5*1 + 0.5*0.5 + 1.0*2) / 3.5 = (0.5 + 0.25 + 2) / 3.5 = 2.75 / 3.5 = 0.785
        
        # C1 norm_binding = 0.0 (worst score). norm_qed = 1.0, norm_esol = 1.0.
        # Score C1 = (1.0*1 + 1.0*0.5 + 0*2) / 3.5 = 1.5 / 3.5 = 0.428
        
        # C4 should be last because of PAINS penalty (-10.0)
        
        ranked_ids = df_ranked["candidate_id"].tolist()
        self.assertEqual(ranked_ids[0], "C2") # Highest score
        self.assertEqual(ranked_ids[-1], "C4") # Last place due to PAINS

    def test_mixed_methods(self):
        # Test how it handles Vina vs Fallback mixed together
        df_scored = pd.DataFrame([
            {"candidate_id": "C1", "qed": 0.5, "esol": -3.0, "pains_flag": False},
            {"candidate_id": "C2", "qed": 0.5, "esol": -3.0, "pains_flag": False},
            {"candidate_id": "C3", "qed": 0.5, "esol": -3.0, "pains_flag": False},
        ])
        
        df_binding = pd.DataFrame([
            # C1, C2 are Vina
            {"candidate_id": "C1", "method": "Vina", "score": -8.0, "score_direction": "negative_is_better"},
            {"candidate_id": "C2", "method": "Vina", "score": -4.0, "score_direction": "negative_is_better"},
            # C3 is Fallback
            {"candidate_id": "C3", "method": "Fallback", "score": 0.9, "score_direction": "positive_is_better"},
        ])
        
        df_ranked = self.ranker.rank_candidates(df_scored, df_binding)
        
        # C1 should have norm_binding 1.0 (best of Vina)
        # C2 should have norm_binding 0.0 (worst of Vina)
        # C3 should have norm_binding 0.5 (only one in Fallback, max==min triggers 0.5 fallback in _normalize_series)
        
        c1_idx = df_ranked[df_ranked["candidate_id"] == "C1"].index[0]
        c2_idx = df_ranked[df_ranked["candidate_id"] == "C2"].index[0]
        c3_idx = df_ranked[df_ranked["candidate_id"] == "C3"].index[0]
        
        self.assertEqual(df_ranked.loc[c1_idx, "norm_binding"], 1.0)
        self.assertEqual(df_ranked.loc[c2_idx, "norm_binding"], 0.0)
        self.assertEqual(df_ranked.loc[c3_idx, "norm_binding"], 0.5)

if __name__ == "__main__":
    unittest.main()
