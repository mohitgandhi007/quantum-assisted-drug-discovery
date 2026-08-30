# Quantovia: Quantum-Assisted Drug Discovery

Quantovia is an end-to-end scientific pipeline that leverages classical cheminformatics and quantum computing (QAOA/QUBO) to generate, evaluate, and select top drug candidates. 

This project explores the intersection of computational biology, classical molecular docking, and quantum algorithms, simulating a future where quantum computers accelerate multi-objective drug candidate selection.

> **Disclaimer**: This is a purely computational, exploratory platform. Generated candidates and metrics are hypotheses and require rigorous experimental validation. No claims of clinical efficacy or biological activity are made.

---

## Architecture & Pipeline

1. **Target Data Ingestion (ChEMBL):** Fetches known active EGFR ligands.
2. **Molecular Generation (BRICS):** Uses fragmentation and recombination to generate novel candidates. Includes Tanimoto diversity filtering.
3. **Physicochemical Scoring:** Filters and scores molecules based on QED, ESOL, and PAINS alerts.
4. **Docking Evaluation (AutoDock Vina):** Pre-ranks top candidates and attempts physical docking against a provided receptor (e.g. 1M17). Automatically falls back to a structural similarity proxy if Vina fails.
5. **Classical Ranking:** Produces a multi-objective score weighting drug-likeness (QED), solubility (ESOL), and binding affinity.
6. **Quantum Optimization (QAOA/QUBO):** Formulates the candidate selection as a QUBO and uses Qiskit's QAOA simulated backend to select the optimal top $k$ candidates, balancing quality and diversity.
7. **Classical Benchmark:** Runs a classical exact brute-force solver on the QUBO to evaluate QAOA performance (approximation ratio, feasibility).
8. **Explanation Agent:** Uses an LLM agent to explain the prioritized candidates clearly, adhering to scientific safety constraints.
9. **FastAPI Backend:** Serves the precomputed results and explanations for a frontend dashboard.

---

## Quantum Optimization (QAOA/QUBO)

The candidate-selection problem is formulated as a Quadratic Unconstrained Binary Optimization (QUBO) problem to be solved using Qiskit.

### Objective
Select exactly $k$ candidates out of $N$ while maximizing candidate quality and minimizing chemical redundancy.

### Mathematical Formulation
Let $x_i \in \{0, 1\}$ be the decision variable for selecting candidate $i$.
Let $Q_i$ be the quality score of candidate $i$ (higher is better).
Let $S_{ij}$ be the similarity between candidates $i$ and $j$.

The objective function to minimize is:
$E(x) = -\alpha \sum_i Q_i x_i + \beta \sum_{i < j} S_{ij} x_i x_j + \gamma \left(\sum_i x_i - k\right)^2$

Where:
- $\alpha$: Weight for candidate quality reward.
- $\beta$: Weight for similarity penalty (redundancy).
- $\gamma$: Hard constraint penalty to enforce selecting exactly $k$ candidates.

Expanding the constraint penalty dropping the constant $\gamma k^2$:

Linear terms (diagonal):
$Q_{ii} = -\alpha Q_i + \gamma (1 - 2k)$

Quadratic terms (off-diagonal):
$Q_{ij} = \beta S_{ij} + 2\gamma$

**Proof of Exact-$k$ Selection:**
The penalty term $\gamma (\sum_i x_i - k)^2$ equals 0 if exactly $k$ items are selected, and is strictly $> 0$ otherwise. If $\gamma$ is chosen to be sufficiently large ($\gamma > \alpha \max(Q_i) + \beta \max(S_{ij})$), any solution violating the $k$-constraint incurs a penalty larger than any possible benefit. Therefore, the global minimum of the QUBO must satisfy $\sum_i x_i = k$.

---

## Configuration
All hardcoded parameters, thresholds, paths, and configurations are centrally managed in `config.py`. 
To customize, copy `.env.example` to `.env` and modify the values.

## Usage

### 1. Setup Environment
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Run End-to-End Validation
This script runs the entire pipeline module-by-module and generates a `validation_report.md` asserting all scientific rules and pipeline integrity:
```bash
PYTHONPATH=. python scripts/e2e_validation.py
```

### 3. Run FastAPI Server
Start the API to serve the results:
```bash
PYTHONPATH=. python backend/main.py
```
The API is available at `http://127.0.0.1:8000`.

## Testing
Run unit tests (tests QUBO formulation, constraints, API endpoints, etc.):
```bash
pytest tests/ -v
```
