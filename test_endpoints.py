import requests

try:
    print("Testing /pipeline/run")
    resp = requests.post("http://localhost:8000/pipeline/run")
    print("Pipeline run status:", resp.status_code)
    
    if resp.status_code == 200:
        data = resp.json()
        candidates = data.get("candidates", [])
        if candidates:
            cid = candidates[0]["candidate_id"]
            print(f"Testing /candidates/{cid}")
            resp_c = requests.get(f"http://localhost:8000/candidates/{cid}")
            print("Candidate status:", resp_c.status_code)
            print("Candidate JSON:", resp_c.json())
except Exception as e:
    print(e)
