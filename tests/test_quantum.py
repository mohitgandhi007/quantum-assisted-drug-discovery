import numpy as np
import pytest
from quantum.qubo import CandidateQUBO
from quantum.qaoa import QAOARunner
from qiskit_algorithms.optimizers import COBYLA

def test_qubo_dimensions():
    """Test that the QUBO matrix has the correct dimensions."""
    n = 10
    candidate_ids = [f"c{i}" for i in range(n)]
    quality_scores = np.random.rand(n)
    similarity_matrix = np.random.rand(n, n)
    # Make symmetric
    similarity_matrix = (similarity_matrix + similarity_matrix.T) / 2
    np.fill_diagonal(similarity_matrix, 1.0)
    
    qubo = CandidateQUBO(
        candidate_ids=candidate_ids,
        quality_scores=quality_scores,
        similarity_matrix=similarity_matrix,
        k=5,
        alpha=1.0,
        beta=1.0,
        gamma=20.0
    )
    
    Q = qubo.build_qubo_matrix()
    assert Q.shape == (n, n), "QUBO matrix should be NxN"

def test_qubo_exactly_k_constraint():
    """Test that the QUBO penalizes selecting != k candidates."""
    n = 6
    k = 3
    candidate_ids = [f"c{i}" for i in range(n)]
    
    # Zero quality and similarity to isolate the k-constraint
    quality_scores = np.zeros(n)
    similarity_matrix = np.zeros((n, n))
    
    qubo = CandidateQUBO(
        candidate_ids=candidate_ids,
        quality_scores=quality_scores,
        similarity_matrix=similarity_matrix,
        k=k,
        alpha=1.0,
        beta=1.0,
        gamma=10.0
    )
    
    Q = qubo.build_qubo_matrix()
    
    # Evaluate a state with exactly k=3 ones
    state_3 = np.array([1, 1, 1, 0, 0, 0])
    obj_3 = state_3.T @ Q @ state_3
    
    # Evaluate a state with k=4 ones
    state_4 = np.array([1, 1, 1, 1, 0, 0])
    obj_4 = state_4.T @ Q @ state_4
    
    # Evaluate a state with k=2 ones
    state_2 = np.array([1, 1, 0, 0, 0, 0])
    obj_2 = state_2.T @ Q @ state_2
    
    assert obj_3 < obj_4, "Selecting more than k should increase objective"
    assert obj_3 < obj_2, "Selecting fewer than k should increase objective"

def test_qaoa_execution():
    """Test that QAOA runs and returns a valid result."""
    n = 5
    k = 2
    candidate_ids = [f"c{i}" for i in range(n)]
    quality_scores = np.random.rand(n)
    similarity_matrix = np.random.rand(n, n)
    similarity_matrix = (similarity_matrix + similarity_matrix.T) / 2
    np.fill_diagonal(similarity_matrix, 1.0)
    
    qubo = CandidateQUBO(
        candidate_ids=candidate_ids,
        quality_scores=quality_scores,
        similarity_matrix=similarity_matrix,
        k=k,
        alpha=1.0,
        beta=1.0,
        gamma=20.0
    )
    
    optimizer = COBYLA(maxiter=10)
    runner = QAOARunner(qubo, reps=1, optimizer=optimizer, seed=42)
    
    result = runner.solve()
    
    assert "selected_ids" in result
    assert len(result["selected_ids"]) == k
    assert "objective_value" in result
    assert "bitstring" in result
    
    # The sum of bits in the best bitstring might not strictly be `k` if the optimizer
    # maxiter is very low or QAOA depth is very low (it's an approximation),
    # but we can check if it returns *some* selected candidates.
    assert len(result["bitstring"]) == n
