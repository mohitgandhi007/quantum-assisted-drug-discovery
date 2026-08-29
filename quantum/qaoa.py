import time
import os
import logging
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple
from rdkit import Chem
from rdkit.Chem import AllChem
from rdkit import DataStructs

from qiskit_optimization import QuadraticProgram
from qiskit_optimization.algorithms import MinimumEigenOptimizer
from qiskit_algorithms import QAOA
from qiskit_algorithms.optimizers import COBYLA, Optimizer
from qiskit.primitives import StatevectorSampler

from quantum.qubo import CandidateQUBO

logger = logging.getLogger(__name__)

class QAOARunner:
    """
    Executes a QAOA circuit on a local simulator to solve the 
    candidate selection QUBO problem.
    """
    
    def __init__(
        self, 
        qubo: CandidateQUBO,
        reps: int = 2,
        optimizer: Optimizer = None,
        seed: int = 42
    ):
        self.qubo = qubo
        self.reps = reps
        self.optimizer = optimizer if optimizer else COBYLA(maxiter=100)
        self.seed = seed
        self.sampler = StatevectorSampler(default_shots=1024, seed=seed)
        
    def _create_quadratic_program(self) -> QuadraticProgram:
        """
        Converts the QUBO matrix into a Qiskit QuadraticProgram.
        """
        qp = QuadraticProgram("DrugCandidateSelection")
        Q_matrix = self.qubo.build_qubo_matrix()
        
        # Define binary variables x_i
        for i in range(self.qubo.n):
            qp.binary_var(name=f"x_{i}")
            
        # Add objective from matrix
        # Linear terms are on the diagonal, quadratic are off-diagonal
        linear_terms = {}
        quadratic_terms = {}
        
        for i in range(self.qubo.n):
            linear_terms[f"x_{i}"] = Q_matrix[i, i]
            for j in range(i + 1, self.qubo.n):
                quadratic_terms[(f"x_{i}", f"x_{j}")] = Q_matrix[i, j]
                
        qp.minimize(linear=linear_terms, quadratic=quadratic_terms)
        return qp

    def solve(self) -> Dict[str, Any]:
        """
        Runs QAOA and returns the optimization results.
        """
        logger.info(f"Formulating Quadratic Program for {self.qubo.n} variables...")
        qp = self._create_quadratic_program()
        
        logger.info(f"Configuring QAOA (p={self.reps}, optimizer={self.optimizer.__class__.__name__})")
        qaoa_algo = QAOA(
            sampler=self.sampler,
            optimizer=self.optimizer,
            reps=self.reps
        )
        
        optimizer = MinimumEigenOptimizer(qaoa_algo)
        
        logger.info("Executing QAOA on local simulator...")
        start_time = time.time()
        
        # Temporarily suppress scipy sparsity warnings from qiskit
        import warnings
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            result = optimizer.solve(qp)
            
        runtime = time.time() - start_time
        logger.info(f"QAOA execution completed in {runtime:.2f} seconds.")
        
        # Extract best bitstring
        best_x = result.x
        
        # Reconstruct exactly matching IDs
        selected_ids = [self.qubo.candidate_ids[i] for i in range(self.qubo.n) if best_x[i] == 1.0]
        
        # Extract samples / probabilities
        samples = []
        if hasattr(result, "samples"):
            for s in result.samples:
                # Add constant offset to match mathematical E(x)
                true_fval = s.fval + self.qubo.gamma * (self.qubo.k ** 2)
                samples.append({
                    "bitstring": "".join([str(int(bit)) for bit in s.x]),
                    "obj_value": true_fval,
                    "probability": s.probability
                })
        
        # Sort samples by probability descending
        samples = sorted(samples, key=lambda x: x["probability"], reverse=True)
        
        # Calculate true optimal fval using offset
        true_optimal_fval = result.fval + self.qubo.gamma * (self.qubo.k ** 2)
        
        return {
            "selected_ids": selected_ids,
            "bitstring": "".join([str(int(bit)) for bit in best_x]),
            "objective_value": true_optimal_fval,
            "qaoa_parameters": {
                "p": self.reps,
                "optimizer": self.optimizer.__class__.__name__,
                "seed": self.seed
            },
            "runtime_seconds": runtime,
            "backend": "StatevectorSampler (Local)",
            "top_samples": samples[:5]
        }

def compute_similarity_matrix(smiles_list: List[str]) -> np.ndarray:
    """Helper to compute Tanimoto similarity matrix for candidates."""
    n = len(smiles_list)
    sim_mat = np.zeros((n, n))
    fps = []
    
    for smi in smiles_list:
        mol = Chem.MolFromSmiles(smi)
        fp = AllChem.GetMorganFingerprintAsBitVect(mol, 2, nBits=1024) if mol else None
        fps.append(fp)
        
    for i in range(n):
        for j in range(i, n):
            if fps[i] and fps[j]:
                sim = DataStructs.TanimotoSimilarity(fps[i], fps[j])
                sim_mat[i, j] = sim
                sim_mat[j, i] = sim
            else:
                sim_mat[i, j] = sim_mat[j, i] = 0.0
                
    return sim_mat

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    
    # ---------------------------------------------------------
    # 1. Validation on Toy Problem (6 candidates)
    # ---------------------------------------------------------
    print("\n" + "="*50)
    print("TEST 1: 6-Candidate Toy Problem (QAOA vs Brute Force)")
    print("="*50)
    
    toy_ids = [f"C{i}" for i in range(1, 7)]
    toy_k = 3
    np.random.seed(42)
    toy_qualities = np.random.uniform(0.5, 1.0, 6)
    toy_sims = np.random.uniform(0.0, 0.5, (6, 6))
    toy_sims = (toy_sims + toy_sims.T) / 2
    np.fill_diagonal(toy_sims, 1.0)
    toy_sims[0, 1] = toy_sims[1, 0] = 0.95 # Force C1,C2 clash
    
    toy_qubo = CandidateQUBO(toy_ids, toy_qualities, toy_sims, k=toy_k, alpha=2.0, beta=1.5, gamma=15.0)
    
    # Run Brute Force for baseline
    opt_sel, opt_obj = toy_qubo.classical_brute_force_solver()
    print(f"[Classical Baseline] Optimal: {opt_sel}, Obj: {opt_obj:.4f}")
    
    # Run QAOA
    runner = QAOARunner(toy_qubo, reps=2, optimizer=COBYLA(maxiter=200))
    toy_result = runner.solve()
    print("\n[QAOA Output]")
    print(f"Selected IDs: {toy_result['selected_ids']}")
    print(f"Bitstring: {toy_result['bitstring']}")
    print(f"Objective Value: {toy_result['objective_value']:.4f}")
    print(f"Match classical?: {set(toy_result['selected_ids']) == set(opt_sel)}")
    
    # ---------------------------------------------------------
    # 2. Execution on Actual Top 20 Candidates
    # ---------------------------------------------------------
    ranked_path = "data/processed/ranked_candidates.csv"
    if not os.path.exists(ranked_path):
        print(f"\nSkipping Test 2: {ranked_path} not found.")
        exit(0)
        
    print("\n" + "="*50)
    print("TEST 2: 20-Candidate Real Problem Selection")
    print("="*50)
    
    df = pd.read_csv(ranked_path)
    
    # Take top 20 candidates
    top20 = df.head(20).copy()
    candidate_ids = top20["candidate_id"].tolist()
    quality_scores = top20["final_classical_score"].values
    
    # Ensure scores are non-negative for the QUBO formulation
    quality_scores = np.maximum(quality_scores, 0)
    
    # Re-fetch SMILES for the top20 (we can merge from scored_candidates if needed, 
    # but the ranked df usually lacks SMILES unless we kept it. Let's load scored_candidates).
    df_scored = pd.read_csv("data/processed/scored_candidates.csv")
    top20 = pd.merge(top20, df_scored[["candidate_id", "smiles"]], on="candidate_id", how="left")
    smiles_list = top20["smiles"].tolist()
    
    sim_matrix = compute_similarity_matrix(smiles_list)
    
    # Create QUBO (Select 5 out of 20)
    # Using high gamma to strictly enforce k=5
    qubo_20 = CandidateQUBO(
        candidate_ids=candidate_ids, 
        quality_scores=quality_scores, 
        similarity_matrix=sim_matrix, 
        k=5, 
        alpha=1.0, 
        beta=1.5, 
        gamma=20.0
    )
    
    # QAOA can be slow on 20 qubits in simulation, limit maxiter
    runner_20 = QAOARunner(qubo_20, reps=1, optimizer=COBYLA(maxiter=150))
    res_20 = runner_20.solve()
    
    print("\n[Final QAOA Selection Output]")
    print(f"Runtime: {res_20['runtime_seconds']:.2f}s")
    print(f"Backend: {res_20['backend']}")
    print(f"Parameters: {res_20['qaoa_parameters']}")
    print(f"Selected Candidates ({len(res_20['selected_ids'])}): {res_20['selected_ids']}")
    print(f"Objective Value: {res_20['objective_value']:.4f}")
    
    print("\nTop 3 Sampled Bitstrings by Probability:")
    for i, s in enumerate(res_20['top_samples'][:3]):
        print(f"  {i+1}. {s['bitstring']} | Obj: {s['obj_value']:.4f} | Prob: {s['probability']:.4%}")
