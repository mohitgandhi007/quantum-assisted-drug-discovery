import sys

def verify_imports():
    success = True
    packages = {
        "FastAPI": "fastapi",
        "RDKit": "rdkit",
        "ChEMBL Client": "chembl_webresource_client",
        "Pandas": "pandas",
        "Requests": "requests",
        "Qiskit": "qiskit",
        "QAOA/QUBO (Optimization)": "qiskit_optimization",
        "NumPy": "numpy",
        "Open Babel": "openbabel",
        "AutoDock Vina (Python wrapper)": "vina"
    }

    for name, module in packages.items():
        try:
            __import__(module)
            print(f"[OK] {name} ({module}) imported successfully.")
        except ImportError as e:
            print(f"[FAIL] {name} ({module}) failed to import. Error: {e}")
            success = False

    if success:
        print("\nAll scientific packages imported successfully.")
        sys.exit(0)
    else:
        print("\nSome packages failed to import.")
        sys.exit(1)

if __name__ == "__main__":
    verify_imports()
