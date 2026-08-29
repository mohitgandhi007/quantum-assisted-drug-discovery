
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
