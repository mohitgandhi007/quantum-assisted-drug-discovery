import requests

try:
    candidates = requests.get("http://localhost:8000/candidates").json()
    if candidates:
        cid = candidates[0]["candidate_id"]
        print(f"Fetching {cid}...")
        resp = requests.get(f"http://localhost:8000/candidates/{cid}")
        print("Status:", resp.status_code)
        print("Body:", resp.text)
except Exception as e:
    print(e)
