import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.pipeline_service import pipeline_service

client = TestClient(app)

@pytest.fixture(autouse=True)
def load_test_data():
    # Ensure the cache is loaded before running tests
    pipeline_service.load_data()

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "ai-quantum-drug-discovery-api"}

def test_pipeline_status():
    response = client.get("/pipeline/status")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "is_cached" in data

def test_get_candidates():
    response = client.get("/candidates")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    
    if len(data) > 0:
        candidate = data[0]
        assert "candidate_id" in candidate
        assert "smiles" in candidate
        assert "properties" in candidate
        assert "quantum_selection_status" in candidate

def test_get_candidate_by_id():
    # Get all first to find a valid ID
    cands = client.get("/candidates").json()
    if len(cands) > 0:
        valid_id = cands[0]["candidate_id"]
        response = client.get(f"/candidates/{valid_id}")
        assert response.status_code == 200
        assert response.json()["candidate_id"] == valid_id
        
        # Test 404
        response_404 = client.get("/candidates/NON_EXISTENT_ID_9999")
        assert response_404.status_code == 404

def test_pipeline_run():
    response = client.post("/pipeline/run")
    assert response.status_code == 200
    assert response.json()["status"] == "READY"

def test_quantum_result():
    response = client.get("/quantum/result")
    if response.status_code == 200:
        data = response.json()
        assert "selected_candidates" in data
        assert "objective_value" in data
        assert "backend" in data
    else:
        assert response.status_code == 404

def test_report_generation():
    cands = client.get("/candidates").json()
    if len(cands) > 0:
        valid_id = cands[0]["candidate_id"]
        response = client.get(f"/report/{valid_id}")
        assert response.status_code == 200
        assert "markdown_report" in response.json()
        assert valid_id in response.json()["markdown_report"]
