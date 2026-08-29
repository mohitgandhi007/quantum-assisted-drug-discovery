import pytest
from backend.services.explanation_service import ExplanationService

def test_fallback_explanation():
    service = ExplanationService()
    # Force fallback by unsetting client
    service.client = None 
    
    mock_candidate = {
        "candidate_id": "GEN_TEST1",
        "smiles": "CCO",
        "properties": {
            "qed": 0.543,
            "esol": -3.21
        },
        "binding_evidence": {
            "method": "Vina",
            "score": -8.4,
            "score_direction": "lower_is_better"
        },
        "classical_score": 0.88,
        "quantum_selection_status": True
    }
    
    explanation = service.generate_explanation(mock_candidate)
    
    # Assert specific scientific guardrails
    assert "cures cancer" not in explanation.lower()
    assert "guaranteed" not in explanation.lower()
    
    # Assert required safe language
    assert "prioritized" in explanation.lower()
    assert "experimental validation" in explanation.lower()
    
    # Assert numbers are present
    assert "0.543" in explanation
    assert "-3.21" in explanation
    assert "-8.4" in explanation
    assert "0.88" in explanation

def test_verify_numbers():
    service = ExplanationService()
    
    data = {
        "score": -4.2,
        "qed": 0.85
    }
    
    # Valid - exact numbers present in JSON
    assert service._verify_numbers("The score is -4.2 and qed is 0.85", data) == True
    
    # Invalid - hallucinates a number not in JSON
    assert service._verify_numbers("The score is -4.2 and qed is 0.99", data) == False
    
    # Invalid - hallucinates an integer
    assert service._verify_numbers("There are 42 molecules with score -4.2", data) == False
    
    # Valid - strings without numbers are technically fine
    assert service._verify_numbers("This is a great molecule.", data) == True
