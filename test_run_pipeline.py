import requests
resp = requests.post("http://localhost:8000/pipeline/run")
print(resp.text)
