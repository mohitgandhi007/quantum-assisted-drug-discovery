import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Pipeline Settings
    DATA_DIR: str = os.getenv("DATA_DIR", "data")
    RAW_DATA_DIR: str = os.getenv("RAW_DATA_DIR", "data/raw")
    PROCESSED_DATA_DIR: str = os.getenv("PROCESSED_DATA_DIR", "data/processed")
    DOCKING_OUTPUT_DIR: str = os.getenv("DOCKING_OUTPUT_DIR", "data/docking_outputs")
    
    # Target Settings
    TARGET_CHEMBL_ID: str = os.getenv("TARGET_CHEMBL_ID", "CHEMBL203") # EGFR
    
    # Generator Settings
    GENERATOR_SEED: int = int(os.getenv("GENERATOR_SEED", "42"))
    GENERATOR_LIMIT: int = int(os.getenv("GENERATOR_LIMIT", "100"))
    
    # Diversity Filtering Settings
    DIVERSITY_SIMILARITY_THRESHOLD: float = float(os.getenv("DIVERSITY_SIMILARITY_THRESHOLD", "0.85"))
    
    # Docking Settings
    VINA_PATH: str = os.getenv("VINA_PATH", "docking/bin/vina")
    RECEPTOR_PDBQT: str = os.getenv("RECEPTOR_PDBQT", "data/processed/receptor.pdbqt")
    DOCKING_CENTER_X: float = float(os.getenv("DOCKING_CENTER_X", "22.013689655172417"))
    DOCKING_CENTER_Y: float = float(os.getenv("DOCKING_CENTER_Y", "0.2528275862068965"))
    DOCKING_CENTER_Z: float = float(os.getenv("DOCKING_CENTER_Z", "52.79403448275863"))
    DOCKING_SIZE_X: float = float(os.getenv("DOCKING_SIZE_X", "20.0"))
    DOCKING_SIZE_Y: float = float(os.getenv("DOCKING_SIZE_Y", "20.0"))
    DOCKING_SIZE_Z: float = float(os.getenv("DOCKING_SIZE_Z", "20.0"))
    
    # Reference Ligand Settings
    # Example reference: The AQ4 crystallographic ligand from 1M17
    REFERENCE_SMILES: str = os.getenv("REFERENCE_SMILES", "Cc1cc(C)c(/C=C2\C(=O)Nc3ncnc(Nc4ccc(F)c(Cl)c4)c32)[nH]1")
    
    # Classical Ranking Weights
    WEIGHT_QED: float = float(os.getenv("WEIGHT_QED", "1.0"))
    WEIGHT_ESOL: float = float(os.getenv("WEIGHT_ESOL", "0.5"))
    WEIGHT_BINDING: float = float(os.getenv("WEIGHT_BINDING", "2.0"))
    PAINS_PENALTY: float = float(os.getenv("PAINS_PENALTY", "10.0"))
    
    # Quantum Settings
    QAOA_K: int = int(os.getenv("QAOA_K", "5"))
    QUBO_ALPHA: float = float(os.getenv("QUBO_ALPHA", "1.0"))
    QUBO_BETA: float = float(os.getenv("QUBO_BETA", "1.5"))
    QUBO_GAMMA: float = float(os.getenv("QUBO_GAMMA", "20.0"))
    QAOA_REPS: int = int(os.getenv("QAOA_REPS", "1"))
    QAOA_MAXITER: int = int(os.getenv("QAOA_MAXITER", "150"))
    QAOA_SEED: int = int(os.getenv("QAOA_SEED", "42"))
    
    class Config:
        env_file = ".env"

config = Settings()
