import requests

try:
    resp = requests.options("http://localhost:8000/candidates/GEN_A52E1BC0", headers={
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "GET"
    })
    print("Status:", resp.status_code)
    print("Headers:", resp.headers)
except Exception as e:
    print(e)
