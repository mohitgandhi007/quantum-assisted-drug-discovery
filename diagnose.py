import sys
import os
import subprocess
import json

print("=== 1. RDKit VERIFICATION ===")
try:
    from rdkit import Chem
    from rdkit.Chem import Draw
    mol = Chem.MolFromSmiles("CCO")
    if mol:
        print("RDKit: PASS (Molecule parsed successfully)")
    else:
        print("RDKit: FAIL (Failed to parse CCO)")
except Exception as e:
    print(f"RDKit: FAIL (Exception: {e})")

print("\n=== 2. OPEN BABEL VERIFICATION ===")
try:
    result = subprocess.run(["obabel", "-V"], capture_output=True, text=True)
    if result.returncode == 0:
        print(f"Open Babel: PASS ({result.stdout.strip()})")
    else:
        print(f"Open Babel: FAIL (return code {result.returncode}, stderr: {result.stderr})")
except Exception as e:
    print(f"Open Babel: FAIL (Exception: {e})")

print("\n=== 3. AUTODOCK VINA VERIFICATION ===")
try:
    result = subprocess.run(["vina", "--version"], capture_output=True, text=True)
    if result.returncode == 0:
        print(f"AutoDock Vina: PASS ({result.stdout.strip()})")
    else:
        print(f"AutoDock Vina: FAIL (return code {result.returncode}, stderr: {result.stderr})")
except Exception as e:
    print(f"AutoDock Vina: FAIL (Exception: {e})")

print("\n=== 4. QISKIT VERIFICATION ===")
try:
    import qiskit
    from qiskit_aer import AerSimulator
    from qiskit import QuantumCircuit
    
    sim = AerSimulator()
    qc = QuantumCircuit(2, 2)
    qc.h(0)
    qc.cx(0, 1)
    qc.measure([0, 1], [0, 1])
    
    job = sim.run(qc, shots=10)
    result = job.result()
    counts = result.get_counts()
    print(f"Qiskit: PASS (Counts: {counts})")
except Exception as e:
    print(f"Qiskit: FAIL (Exception: {e})")

