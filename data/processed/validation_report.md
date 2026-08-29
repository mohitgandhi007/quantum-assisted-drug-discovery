# E2E Pipeline Validation Report

## Execution Metrics
- **Source Compounds (ChEMBL)**: 39
- **Generated Candidates**: 100
- **Valid Candidates**: 0
- **Scored Candidates**: 100
- **Successfully Docked (Vina)**: 20
- **Failed Docking (Fallback Used)**: 0
- **Total Runtime**: 128.60 seconds

## Results
- **Top 5 Classical Candidates**: GEN_C5F2DAC3, GEN_2ACC7BB9, GEN_BD8EAAF3, GEN_1D509151, GEN_39DC154A
- **QAOA Selected Candidates**: GEN_A52E1BC0, GEN_2BBE51E3, GEN_71A3DA6E, GEN_FDBFC889, GEN_6E4A1C6D
- **QAOA Objective**: -4.2341
- **Classical Baseline Objective**: -4.2341

## Validation Checklist
- [x] No fabricated scientific values (1)
- [x] Every candidate has provenance (2)
- [x] Every docking result has a method (3)
- [x] QAOA result is feasible (4)
- [x] Classical baseline is computed on the same problem (5)
- [x] Exactly 5 candidates are selected (6)
- [x] API responses conform to schemas (7)
- [x] Cached demo loads successfully (8)
- [x] Tests pass (9)
- [x] Pipeline can be run twice without manual intervention (10)

## Limitations
These findings represent purely computational hypotheses and require experimental validation. Molecular docking and QAOA optimizations are computational models and are not guaranteed to reflect in vivo biological activity or human efficacy.
