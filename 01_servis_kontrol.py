# import requests
# URL = "http://localhost:11434/api/tags"
# response=requests.get(URL,timeout=5)
# response.raise_for_status()
# models=response.json()["models"]
# print([m["name"] for m in models])


import requests
URL = "http://localhost:11434/api/chat"
payload = {"model": "qwen3:4b",
           "messages": [{"role": "user", "content": "Merhaba"}],
           "stream": False}
response = requests.post(URL, json=payload, timeout=60)
response.raise_for_status()
print(response.json()["message"]["content"])           

