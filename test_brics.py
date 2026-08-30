import json
from molecular_generation.brics_generator import BRICSGenerator

generator = BRICSGenerator(input_file="data/raw/chembl_egfr.csv")
generator.generate(num_candidates=200, output_file="test_candidates.json")

print("---")
with open("test_candidates.json") as f:
    candidates = json.load(f)
    print("Example SMILES:")
    for c in candidates[:10]:
        print(f" - {c['smiles']}")
