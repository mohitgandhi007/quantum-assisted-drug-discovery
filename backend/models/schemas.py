from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class PropertiesSchema(BaseModel):
    qed: float
    esol: float
    molecular_weight: float
    logp: float
    h_bond_donors: int
    h_bond_acceptors: int
    rotatable_bonds: int
    pains_alert_count: int
    pains_flag: bool

class BindingEvidenceSchema(BaseModel):
    method: str
    score: float
    score_direction: str
    reference: str
    status: str
    limitations: str
    error_message: Optional[str] = None

class CandidateResponse(BaseModel):
    candidate_id: str
    smiles: str
    properties: PropertiesSchema
    binding_evidence: Optional[BindingEvidenceSchema] = None
    classical_score: Optional[float] = None
    ranking: Optional[int] = None
    quantum_selection_status: bool = False
    explanation: Optional[str] = None

class QAOAParameters(BaseModel):
    p: int
    optimizer: str
    seed: int

class QuantumResultResponse(BaseModel):
    selected_candidates: List[str]
    bitstring: str
    objective_value: float
    classical_baseline: float
    qaoa_parameters: Optional[QAOAParameters] = None
    backend: str
    runtime_seconds: float
    limitations: str = "Simulated on local classical hardware; no true quantum advantage."

class PipelineStatus(BaseModel):
    status: str
    message: str
    is_cached: bool
    total_candidates_available: int

class TargetSchema(BaseModel):
    name: str
    pdb: str
    source: str
    mode: str

class PipelineStageSchema(BaseModel):
    name: str
    status: str
    message: str
    details: Optional[Dict[str, Any]] = None

class PipelineSummarySchema(BaseModel):
    input_ligands: int
    generated: int
    valid: int
    diverse: int
    property_passed: int
    docked: int
    failed_docking: int
    classical_top: int
    quantum_selected: int

class DetailedPipelineResponse(BaseModel):
    run_id: str
    status: str
    target: TargetSchema
    stages: List[PipelineStageSchema]
    summary: PipelineSummarySchema
    candidates: List[CandidateResponse]
    quantum: Optional[QuantumResultResponse] = None
    errors: List[str]
