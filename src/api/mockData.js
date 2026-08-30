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
    overall_score: 91.4,
    mol_weight: 446.9,
    logp: 3.2,
    lipinski_violations: 0
  },
  {
    id: "erlotinib",
    smiles: "COCCOc1cc2ncnc(Nc3cccc(C#C)c3)c2cc1OCCOC", // Erlotinib structure (known active validation reference)
    qed: 0.76,
    esol: -3.8,
    tox_flags: [],
    docking_score: -9.2,
    quantum_selected: false,
    rank: 2,
    overall_score: 88.0,
    is_reference: true,
    mol_weight: 393.4,
    logp: 2.7,
    lipinski_violations: 0
  },
  {
    id: "c2",
    smiles: "CS(=O)(=O)CCNCC1OCCC1c2ccc(Oc3ccc4ncnc(Nc5ccc(Cl)c(Cl)c5)c4c3)o2", // Lapatinib-like structure
    qed: 0.65,
    esol: -4.1,
    tox_flags: ["High MW"],
    docking_score: -8.9,
    quantum_selected: false,
    rank: 3,
    overall_score: 85.2,
    mol_weight: 581.0,
    logp: 4.8,
    lipinski_violations: 1
  },
  {
    id: "c3",
    smiles: "CN(C)CC=CC(=O)Nc1cc2c(cc1Oc3ccc(F)c(Cl)c3)ncnc2N4CCOCC4", // Afatinib-like structure
    qed: 0.72,
    esol: -3.5,
    tox_flags: [],
    docking_score: -8.5,
    quantum_selected: false,
    rank: 4,
    overall_score: 78.9,
    mol_weight: 485.9,
    logp: 2.9,
    lipinski_violations: 0
  },
  {
    id: "c4",
    smiles: "COc1cc(N2CCN(C)CC2)c(NC(=O)C=C)cc1Nc3nccc(n3)c4cn(C)c5ccccc45", // Osimertinib-like structure
    qed: 0.61,
    esol: -4.8,
    tox_flags: ["Hepatotoxicity risk", "quinone_A(370)"],
    docking_score: -8.1,
    quantum_selected: false,
    rank: 5,
    overall_score: 72.6,
    mol_weight: 499.6,
    logp: 3.1,
    lipinski_violations: 0
  },
  {
    id: "c5",
    smiles: "CC(C)Oc1cc2ncnc(Nc3ccc(Br)cc3F)c2cc1OCCCN4CCOCC4", // Erlotinib derivative
    qed: 0.81,
    esol: -2.9,
    tox_flags: ["Mutagenic potential"],
    docking_score: -7.8,
    quantum_selected: false,
    rank: 6,
    overall_score: 68.1,
    mol_weight: 429.3,
    logp: 3.0,
    lipinski_violations: 0
  }
];

export const mockPipelineStages = [
  { id: "research", label: "Research", description: "Target receptor characterization and literature embedding alignment." },
  { id: "generation", label: "Generation", description: "Deep generative RNN creating target-specific candidates." },
  { id: "properties", label: "Properties", description: "Evaluating drug-likeness (QED), solubility (ESOL), and ADMET flags." },
  { id: "docking", label: "Docking", description: "Autodock Vina protein-ligand binding affinity simulations (EGFR)." },
  { id: "quantum", label: "Quantum", description: "Qiskit-optimized screening of final candidate configurations." },
  { id: "explanation", label: "Explanation", description: "Natural language synthesis of properties, safety, and binding actions." }
];
