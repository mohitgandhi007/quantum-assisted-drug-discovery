from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from typing import List, Dict, Any
import io
import urllib.parse
from rdkit import Chem
from rdkit.Chem import Draw

from backend.models import schemas
from backend.services.pipeline_service import pipeline_service
from backend.services.explanation_service import explanation_service

router = APIRouter()

@router.get("/health", response_model=Dict[str, str])
def health_check():
    return {"status": "ok", "service": "ai-quantum-drug-discovery-api"}

@router.get("/molecule/image")
def get_molecule_image(smiles: str):
    try:
        decoded_smiles = urllib.parse.unquote(smiles)
        mol = Chem.MolFromSmiles(decoded_smiles)
        if mol is None:
            raise HTTPException(status_code=400, detail="Invalid SMILES string")
        
        img = Draw.MolToImage(mol, size=(300, 300))
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)
        
        return StreamingResponse(img_byte_arr, media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/pipeline/run", response_model=schemas.DetailedPipelineResponse)
async def run_pipeline():
    """Triggers the discovery pipeline and returns the full detailed results."""
    # Since we are using demo/cached data, we just return the full detailed state
    pipeline_service.load_data()
    return pipeline_service.get_detailed_pipeline_response()

@router.get("/pipeline/status", response_model=schemas.PipelineStatus)
def get_pipeline_status():
    return pipeline_service.get_pipeline_status()

@router.get("/candidates", response_model=List[schemas.CandidateResponse])
def get_candidates():
    candidates = pipeline_service.get_all_candidates()
    return candidates

@router.get("/candidates/{candidate_id}", response_model=schemas.CandidateResponse)
def get_candidate(candidate_id: str):
    candidate = pipeline_service.get_candidate(candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Generate scientific explanation
    candidate["explanation"] = explanation_service.generate_explanation(candidate)
    
    return candidate

@router.get("/quantum/result", response_model=schemas.QuantumResultResponse)
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
