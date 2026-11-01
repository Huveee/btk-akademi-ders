import requests
URL = "http://localhost:11434/api/tags"
response=requests.get(URL,timeout=5)
response.raise_for_status()
models=response.json()["models"]
print([m["name"] for m in models])
