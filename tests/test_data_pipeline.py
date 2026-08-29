import pytest
import pandas as pd
from unittest.mock import patch, MagicMock
from data_pipeline.chembl_fetcher import ChEMBLDataPipeline

@pytest.fixture
def pipeline():
    return ChEMBLDataPipeline(output_path="data/processed/test_ligands.csv")

@patch("data_pipeline.chembl_fetcher.new_client")
def test_get_egfr_target_id(mock_client, pipeline):
    mock_target_api = MagicMock()
    mock_client.target = mock_target_api
    pipeline.target_api = mock_target_api
    
    # Mock return values for target search
    mock_target_api.filter.return_value = [
        {"target_chembl_id": "CHEMBL_WRONG", "target_type": "PROTEIN FAMILY"},
        {"target_chembl_id": "CHEMBL203", "target_type": "SINGLE PROTEIN", "pref_name": "Epidermal growth factor receptor erbB1"}
    ]
    
    target_id = pipeline.get_egfr_target_id()
    assert target_id == "CHEMBL203"

@patch("data_pipeline.chembl_fetcher.new_client")
def test_fetch_activities(mock_client, pipeline):
    mock_activity_api = MagicMock()
    mock_client.activity = mock_activity_api
    pipeline.activity_api = mock_activity_api
    
    mock_filter_1 = MagicMock()
    mock_activity_api.filter.return_value = mock_filter_1
    
    # Mock results
    mock_filter_1.filter.return_value = [
        {
            "molecule_chembl_id": "MOL1",
            "canonical_smiles": "CCO",
            "standard_type": "IC50",
            "standard_value": "10.0",
            "standard_units": "nM",
            "pchembl_value": "8.0",
            "target_chembl_id": "CHEMBL203",
            "document_chembl_id": "DOC1"
        },
        {
            # Missing smiles
            "molecule_chembl_id": "MOL2",
            "standard_type": "IC50",
            "standard_value": "100.0",
            "pchembl_value": "7.0",
        }
    ]
    
    activities = pipeline.fetch_activities("CHEMBL203", limit=10)
    assert len(activities) == 1
    assert activities[0]["molecule_chembl_id"] == "MOL1"
    assert activities[0]["pchembl_value"] == 8.0

def test_clean_and_validate(pipeline):
    activities = [
        {
            "molecule_chembl_id": "MOL1",
            "smiles": "CCO", # ethanol
            "activity_type": "IC50",
            "activity_value": 10.0,
            "activity_units": "nM",
            "pchembl_value": 8.0,
            "target_chembl_id": "CHEMBL203",
            "document_chembl_id": "DOC1"
        },
        {
            "molecule_chembl_id": "MOL2",
            "smiles": "C(C)O", # ethanol duplicate
            "activity_type": "IC50",
            "activity_value": 10.0,
            "activity_units": "nM",
            "pchembl_value": 8.0,
            "target_chembl_id": "CHEMBL203",
            "document_chembl_id": "DOC1"
        },
        {
            "molecule_chembl_id": "MOL3",
            "smiles": "INVALID_SMILES", # invalid
            "activity_type": "IC50",
            "activity_value": 100.0,
            "activity_units": "nM",
            "pchembl_value": 7.0,
            "target_chembl_id": "CHEMBL203",
            "document_chembl_id": "DOC2"
        }
    ]
    
    df = pipeline.clean_and_validate(activities)
    
    # Should only retain the first valid unique molecule
    assert len(df) == 1
    assert df.iloc[0]["molecule_chembl_id"] == "MOL1"
    assert "canonical_smiles" in df.columns
