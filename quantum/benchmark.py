import time
import os
import pandas as pd
import numpy as np
import logging
from rdkit import Chem
from rdkit.Chem import AllChem
from rdkit import DataStructs

from qiskit_algorithms.optimizers import COBYLA
from quantum.qubo import CandidateQUBO
from quantum.qaoa import QAOARunner, compute_similarity_matrix

logger = logging.getLogger(__name__)

def run_benchmark():
    ranked_path = "data/processed/ranked_candidates.csv"
    if not os.path.exists(ranked_path):
        print("Ranked candidates not found. Run classical pipeline first.")
        return
        
    df = pd.read_csv(ranked_path)
    top20 = df.head(20).copy()
    candidate_ids = top20["candidate_id"].tolist()
    quality_scores = np.maximum(top20["final_classical_score"].values, 0)
    
    # Need SMILES for similarity
    df_scored = pd.read_csv("data/processed/scored_candidates.csv")
    top20 = pd.merge(top20, df_scored[["candidate_id", "smiles"]], on="candidate_id", how="left")
    smiles_list = top20["smiles"].tolist()
    
    sim_matrix = compute_similarity_matrix(smiles_list)
    
    qubo = CandidateQUBO(
        candidate_ids=candidate_ids, 
        quality_scores=quality_scores, 
        similarity_matrix=sim_matrix, 
        k=5, 
        alpha=1.0, 
        beta=1.5, 
        gamma=20.0
    )
    
    print("\n--- Running Classical Brute Force (Exact) ---")
    start_c = time.time()
    exact_selected, exact_obj = qubo.classical_brute_force_solver()
    time_c = time.time() - start_c
    
    # We enforce exact k
    exact_feasible = (len(exact_selected) == 5)
    print(f"Classical complete in {time_c:.4f}s")
    
    print("\n--- Running QAOA Simulator ---")
    # Limiting iterations strictly to get faster benchmark returns
    runner = QAOARunner(qubo, reps=1, optimizer=COBYLA(maxiter=50), seed=42)
    qaoa_res = runner.solve()
    time_q = qaoa_res["runtime_seconds"]
    
    q_selected = qaoa_res["selected_ids"]
    q_obj = qaoa_res["objective_value"]
    q_feasible = (len(q_selected) == 5)
    
    prob_optimal = 0.0
    top_samples = qaoa_res.get("top_samples", [])
    if top_samples:
        for s in top_samples:
            # Check if this sample matches the exact objective
            if abs(s["obj_value"] - exact_obj) < 1e-4:
                prob_optimal += s["probability"]
                
    # Format table for output
    markdown_table = f"""
| Metric | Classical (Exact) | QAOA (Simulated) |
|---|---|---|
| **Objective Value** | {exact_obj:.4f} | {q_obj:.4f} |
| **Selected Candidates** | {', '.join(exact_selected)} | {', '.join(q_selected)} |
| **Constraint Satisfied (k=5)** | {exact_feasible} | {q_feasible} |
| **Runtime (s)** | {time_c:.4f} | {time_q:.4f} |
| **Optimal State Probability** | 100.0% | {prob_optimal:.4%} |
| **Difference to Optimal** | 0.0 | {(q_obj - exact_obj):.4f} |
"""

    print("\n--- Benchmark Results ---")
    print(markdown_table)
    
    with open("data/processed/qaoa_benchmark.md", "w") as f:
        f.write("# QAOA vs Classical Exact Solver Benchmark\n")
        f.write(markdown_table)
        
    print("Benchmark saved to data/processed/qaoa_benchmark.md")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    run_benchmark()
