import numpy as np
import pandas as pd
from typing import Dict, List, Tuple
import itertools
import math

class CandidateQUBO:
    """
    Constructs a Quadratic Unconstrained Binary Optimization (QUBO) problem
    for selecting a subset of chemical candidates that maximizes quality while
    minimizing pairwise similarity (maximizing diversity).
    
    Mathematical Formulation:
    -------------------------
    We want to select exactly k candidates from a pool of N.
    Let x_i \in {0, 1} be the decision variable for selecting candidate i.
    Let Q_i be the quality score of candidate i.
    Let S_{ij} be the similarity between candidates i and j.
    
    Objective Function to Minimize:
    E(x) = -\alpha \sum_i Q_i x_i + \beta \sum_{i < j} S_{ij} x_i x_j + \gamma (\sum_i x_i - k)^2
    
    Where:
    1. Candidate Quality Reward: -\alpha \sum_i Q_i x_i
    2. Similarity Penalty (Redundancy): \beta \sum_{i < j} S_{ij} x_i x_j
    3. Selection Constraint Penalty: \gamma (\sum_i x_i - k)^2
    
    Expanding the constraint penalty:
    (\sum_i x_i - k)^2 = (\sum_i x_i)^2 - 2k \sum_i x_i + k^2
                       = \sum_i x_i^2 + 2 \sum_{i < j} x_i x_j - 2k \sum_i x_i + k^2
                       
    Since x_i is binary, x_i^2 = x_i. So:
                       = \sum_i (1 - 2k) x_i + 2 \sum_{i < j} x_i x_j + k^2
                       
    Dropping the constant \gamma k^2 (since it doesn't affect the argmin), the total QUBO is:
    
    Linear terms (diagonal elements of QUBO matrix):
    Q_{ii} = -\alpha Q_i + \gamma (1 - 2k)
    
    Quadratic terms (off-diagonal elements):
    Q_{ij} = \beta S_{ij} + 2\gamma
    """
    
    def __init__(
        self, 
        candidate_ids: List[str], 
        quality_scores: np.ndarray, 
        similarity_matrix: np.ndarray,
        k: int = 5,
        alpha: float = 1.0,
        beta: float = 2.0,
        gamma: float = 10.0
    ):
        """
        Initializes the QUBO constructor.
        
        Args:
            candidate_ids: List of N candidate IDs.
            quality_scores: 1D array of length N containing normalized quality scores.
            similarity_matrix: NxN symmetric array of pairwise similarities.
            k: Number of candidates to select.
            alpha: Weight for quality reward.
            beta: Weight for similarity penalty.
            gamma: Weight for the exactly-k constraint penalty.
        """
        self.candidate_ids = candidate_ids
        self.quality_scores = quality_scores
        self.similarity_matrix = similarity_matrix
        self.k = k
        self.alpha = alpha
        self.beta = beta
        self.gamma = gamma
        self.n = len(candidate_ids)
        
        self._validate_inputs()
        
    def _validate_inputs(self):
        """Validates dimensions and matches."""
        if len(self.quality_scores) != self.n:
            raise ValueError(f"Length of quality_scores ({len(self.quality_scores)}) must match candidate_ids ({self.n})")
        if self.similarity_matrix.shape != (self.n, self.n):
            raise ValueError(f"Shape of similarity_matrix {self.similarity_matrix.shape} must be ({self.n}, {self.n})")
        
        # Verify symmetry of similarity matrix
        if not np.allclose(self.similarity_matrix, self.similarity_matrix.T):
            raise ValueError("Similarity matrix must be symmetric.")
            
    def build_qubo_matrix(self) -> np.ndarray:
        """
        Constructs and returns the NxN QUBO matrix Q such that the objective is x^T Q x.
        Since it's typically represented as an upper triangular matrix:
        - Diagonal entries correspond to linear terms.
        - Upper off-diagonal entries correspond to quadratic terms.
        """
        Q = np.zeros((self.n, self.n))
        
        # Linear terms (diagonal)
        for i in range(self.n):
            Q[i, i] = -self.alpha * self.quality_scores[i] + self.gamma * (1 - 2 * self.k)
            
        # Quadratic terms (upper triangular)
        for i in range(self.n):
            for j in range(i + 1, self.n):
                Q[i, j] = self.beta * self.similarity_matrix[i, j] + 2 * self.gamma
                
        return Q

    def classical_brute_force_solver(self) -> Tuple[List[str], float]:
        """
        Classical brute-force solver for small instances.
        Enumerates all exactly-k combinations to find the exact optimum.
        Useful for verifying the QUBO formulation before running QAOA.
        
        Returns:
            Tuple of (List of selected candidate IDs, exact objective value)
        """
        if self.n > 25:
            raise ValueError("Brute force is too slow for N > 25. Use a heuristic or QAOA.")
            
        best_obj = float('inf')
        best_selection = []
        
        Q = self.build_qubo_matrix()
        
        # We only need to check combinations of size k because we know \gamma enforces exactly k.
        # But to properly validate the QUBO, we should evaluate the QUBO objective function
        # across ALL 2^N states to ensure the global minimum of the QUBO indeed has exactly k ones.
        
        # For N <= 15, we can check all 2^N combinations
        check_all_states = (self.n <= 15)
        
        if check_all_states:
            # Generate all 2^N combinations
            for i in range(1 << self.n):
                # Binary representation of state
                x = np.array([(i >> j) & 1 for j in range(self.n)])
                
                # Compute QUBO objective: x^T Q x
                obj = x.T @ Q @ x
                
                if obj < best_obj:
                    best_obj = obj
                    best_selection = x
        else:
            # If slightly larger (e.g. 15-25), just check the valid combinations to save time
            for indices in itertools.combinations(range(self.n), self.k):
                x = np.zeros(self.n)
                x[list(indices)] = 1
                obj = x.T @ Q @ x
                if obj < best_obj:
                    best_obj = obj
                    best_selection = x
                    
        selected_ids = [self.candidate_ids[i] for i in range(self.n) if best_selection[i] == 1]
        
        # Return objective with the constant offset added back, 
        # so it matches the mathematical E(x)
        true_obj = best_obj + self.gamma * (self.k ** 2)
        
        return selected_ids, true_obj

if __name__ == "__main__":
    # --- Toy Example for Validation ---
    print("--- QUBO Formulation Validation (Toy Example) ---")
    
    # 6 candidates, we want to select 3
    toy_k = 3
    toy_ids = [f"C{i}" for i in range(1, 7)]
    
    # Random quality scores
    np.random.seed(42)
    toy_qualities = np.random.uniform(0.5, 1.0, 6)
    
    # Create a random symmetric similarity matrix [0, 1]
    toy_sims = np.random.uniform(0.0, 0.5, (6, 6))
    toy_sims = (toy_sims + toy_sims.T) / 2
    np.fill_diagonal(toy_sims, 1.0)
    
    # To test the objective, we deliberately make C1 and C2 highly similar
    toy_sims[0, 1] = toy_sims[1, 0] = 0.95
    
    qubo = CandidateQUBO(
        candidate_ids=toy_ids,
        quality_scores=toy_qualities,
        similarity_matrix=toy_sims,
        k=toy_k,
        alpha=2.0,
        beta=1.5,
        gamma=15.0 # High penalty for constraint violation
    )
    
    print(f"Total candidates: {len(toy_ids)}, Target selection (k): {toy_k}")
    
    # Run brute force over all 2^6 = 64 states
    selected, obj = qubo.classical_brute_force_solver()
    
    print(f"Optimal Selection: {selected}")
    print(f"Exact Minimum QUBO Objective Value: {obj:.4f}")
    
    # Verify selection size matches k
    if len(selected) == toy_k:
        print("Validation: SUCCESS - The global minimum satisfies the exactly-k constraint.")
    else:
        print(f"Validation: FAILED - Selected {len(selected)} candidates instead of {toy_k}.")
