from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List, Dict, Any

from backend.models.schemas import CandidateResponse, QuantumResultResponse, PipelineStatus
from backend.services.pipeline_service import pipeline_service
from backend.services.explanation_service import explanation_service

router = APIRouter()

@router.get("/health", response_model=Dict[str, str])
def health_check():
    return {"status": "ok", "service": "ai-quantum-drug-discovery-api"}

@router.get("/pipeline/status", response_model=PipelineStatus)
def get_pipeline_status():
    return pipeline_service.get_pipeline_status()

@router.get("/candidates", response_model=List[CandidateResponse])
def get_candidates():
    candidates = pipeline_service.get_all_candidates()
    return candidates

@router.get("/candidates/{candidate_id}", response_model=CandidateResponse)
def get_candidate(candidate_id: str):
    candidate = pipeline_service.get_candidate(candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Generate scientific explanation
    candidate["explanation"] = explanation_service.generate_explanation(candidate)
    
    return candidate

@router.post("/pipeline/run", response_model=PipelineStatus)
def run_pipeline(background_tasks: BackgroundTasks):
    """
    In a real environment, this would trigger the 10-minute scientific pipeline.
    For this hackathon demo, we reload the precomputed/cached pipeline results.
    """
    pipeline_service.load_data()
    status = pipeline_service.get_pipeline_status()
    if status["status"] == "READY":
        status["message"] = "Pipeline triggered and loaded successfully from cache."
    return status

@router.get("/quantum/result", response_model=QuantumResultResponse)
def get_quantum_results():
    res = pipeline_service.get_quantum_results()
    if not res:
        raise HTTPException(status_code=404, detail="Quantum results not found. Run pipeline first.")
    return res

@router.get("/report/{candidate_id}")
def get_report(candidate_id: str):
    """
    Returns an aggregated markdown-ready report block for a specific candidate,
    useful for feeding into an explanation agent.
    """
    c = pipeline_service.get_candidate(candidate_id)
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    md = f"# Candidate Report: {c['candidate_id']}\n\n"
    md += f"**SMILES**: `{c['smiles']}`\n\n"
    md += "### Physicochemical Properties\n"
    for k, v in c["properties"].items():
        md += f"- **{k}**: {v}\n"
        
    if c["binding_evidence"]:
        md += "\n### Binding Evidence\n"
        for k, v in c["binding_evidence"].items():
            md += f"- **{k}**: {v}\n"
            
    md += f"\n**Classical Multi-Objective Score**: {c['classical_score']:.4f}\n"
    md += f"**Quantum Selected**: {'Yes' if c['quantum_selection_status'] else 'No'}\n"
    
    return {"markdown_report": md}
