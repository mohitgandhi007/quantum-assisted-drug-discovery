export const mockCandidates = [
  {
    id: "c1",
    smiles: "CCOc1cc2ncnc(Nc3ccc(F)c(Cl)c3)c2cc1OCCCN1CCOCC1", // Gefitinib structure (active EGFR inhibitor)
    qed: 0.78,
    esol: -3.2,
    tox_flags: [],
    docking_score: -9.4,
    quantum_selected: true,
    rank: 1,
    overall_score: 91.4
  },
  {
    id: "c2",
    smiles: "CS(=O)(=O)CCNCC1OCCC1c2ccc(Oc3ccc4ncnc(Nc5ccc(Cl)c(Cl)c5)c4c3)o2", // Lapatinib-like structure
    qed: 0.65,
    esol: -4.1,
    tox_flags: ["High MW"],
    docking_score: -8.9,
    quantum_selected: false,
    rank: 2,
    overall_score: 85.2
  },
  {
    id: "c3",
    smiles: "CN(C)CC=CC(=O)Nc1cc2c(cc1Oc3ccc(F)c(Cl)c3)ncnc2N4CCOCC4", // Afatinib-like structure
    qed: 0.72,
    esol: -3.5,
    tox_flags: [],
    docking_score: -8.5,
    quantum_selected: false,
    rank: 3,
    overall_score: 78.9
  },
  {
    id: "c4",
    smiles: "COc1cc(N2CCN(C)CC2)c(NC(=O)C=C)cc1Nc3nccc(n3)c4cn(C)c5ccccc45", // Osimertinib-like structure
    qed: 0.61,
    esol: -4.8,
    tox_flags: ["Hepatotoxicity risk"],
    docking_score: -8.1,
    quantum_selected: false,
    rank: 4,
    overall_score: 72.6
  },
  {
    id: "c5",
    smiles: "CC(C)Oc1cc2ncnc(Nc3ccc(Br)cc3F)c2cc1OCCCN4CCOCC4", // Erlotinib derivative
    qed: 0.81,
    esol: -2.9,
    tox_flags: ["Mutagenic potential"],
    docking_score: -7.8,
    quantum_selected: false,
    rank: 5,
    overall_score: 68.1
  }
];

export const mockPipelineStages = [
  { id: "target", label: "Target", description: "EGFR receptor • PDB 1M17" },
  { id: "generation", label: "Molecular Generation", description: "BRICS fragment-based generation" },
  { id: "properties", label: "Molecular Properties", description: "QED • ESOL • PAINS" },
  { id: "docking", label: "Docking", description: "AutoDock Vina / Tanimoto similarity proxy" },
  { id: "ranking", label: "Classical Ranking", description: "Multi-objective prioritization" },
  { id: "quantum", label: "Quantum Optimization", description: "QUBO + QAOA" },
  { id: "explanation", label: "AI Explanation", description: "Candidate analysis" }
];
