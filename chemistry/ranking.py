import pandas as pd
import numpy as np
from typing import Dict, Any

class ClassicalRanker:
    def __init__(self, weights: Dict[str, float] = None, pains_penalty: float = 10.0):
        """
        Initializes the ranker with configurable weights for the multi-objective scoring.
        """
        # Default weights
        self.weights = weights if weights is not None else {
            "qed": 1.0,
            "esol": 0.5,
            "binding": 2.0
        }
        self.pains_penalty = pains_penalty

    def _normalize_series(self, series: pd.Series, direction: str) -> pd.Series:
        """
        Min-max normalizes a pandas Series to [0, 1].
        If direction is 'positive_is_better', higher values -> 1.
        If direction is 'negative_is_better', lower values -> 1.
        """
        min_val = series.min()
        max_val = series.max()
        
        # Avoid division by zero if all values are identical
        if min_val == max_val:
            return pd.Series(0.5, index=series.index)
            
        if direction == "positive_is_better":
            return (series - min_val) / (max_val - min_val)
        elif direction == "negative_is_better":
            return (max_val - series) / (max_val - min_val)
        else:
            raise ValueError(f"Unknown direction: {direction}")

    def rank_candidates(self, df_scored: pd.DataFrame, df_binding: pd.DataFrame) -> pd.DataFrame:
        """
        Merges scored properties and binding evidence, normalizes them, applies weights,
        and computes a final classical candidate score.
        """
        # Merge datasets
        df = pd.merge(df_scored, df_binding, on="candidate_id", how="inner")
        
        if df.empty:
            return pd.DataFrame()
            
        # 1. Normalize QED (already 0-1 mostly, but min-max to be consistent)
        df["norm_qed"] = self._normalize_series(df["qed"], "positive_is_better")
        
        # 2. Normalize ESOL (logS, higher is more soluble)
        df["norm_esol"] = self._normalize_series(df["esol"], "positive_is_better")
        
        # 3. Normalize Binding Score. 
        # We have a mix of methods (Vina vs Tanimoto). We must normalize them within their own groups
        # to get a comparable 0-1 score, since they have totally different scales and directions.
        df["norm_binding"] = 0.0
        
        for method in df["method"].unique():
            if pd.isna(method):
                continue
            mask = df["method"] == method
            direction = df.loc[mask, "score_direction"].iloc[0]
            
            # Normalize just this group
            normalized_group = self._normalize_series(df.loc[mask, "score"], direction)
            df.loc[mask, "norm_binding"] = normalized_group
            
        # Handle cases where method/score is missing
        df["norm_binding"] = df["norm_binding"].fillna(0.0)
        
        # 4. PAINS Penalty
        # pains_flag is True if PAINS alerts exist.
        pains_multiplier = np.where(df["pains_flag"] == True, -self.pains_penalty, 0.0)
        
        # 5. Final Score Calculation
        total_weight = sum(self.weights.values())
        
        df["final_classical_score"] = (
            (df["norm_qed"] * self.weights["qed"]) +
            (df["norm_esol"] * self.weights["esol"]) +
            (df["norm_binding"] * self.weights["binding"])
        ) / total_weight
        
        # Apply penalty
        df["final_classical_score"] += pains_multiplier
        
        # Rank descending
        df = df.sort_values(by="final_classical_score", ascending=False).reset_index(drop=True)
        df["ranking"] = df.index + 1
        
        return df

if __name__ == "__main__":
    # Example usage reading from files
    import os
    
    scored_path = "data/processed/scored_candidates.csv"
    binding_path = "data/processed/binding_evidence.csv"
    
    if os.path.exists(scored_path) and os.path.exists(binding_path):
        df_s = pd.read_csv(scored_path)
        df_b = pd.read_csv(binding_path)
        
        ranker = ClassicalRanker()
        df_ranked = ranker.rank_candidates(df_s, df_b)
        
        output_path = "data/processed/ranked_candidates.csv"
        df_ranked.to_csv(output_path, index=False)
        
        print("\n--- Top 10 Ranked Candidates ---")
        cols = ["ranking", "candidate_id", "final_classical_score", "norm_binding", "norm_qed", "norm_esol", "method"]
        print(df_ranked[cols].head(10).to_string(index=False))
