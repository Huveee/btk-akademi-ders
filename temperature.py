import requests
URL = "http://localhost:11434/api/chat"

prompt = """
Dünyanın en gereksiz süper kahramanını tasarla.
Adını, süper gücünü, zayıflığını ve sloganını yaz.
Komik olsun.
"""

for sicaklik in (0.1, 0.7, 1.3):
    response = requests.post(
        URL,
        json={
            "model": "gemma3:4b",
            "messages": [{"role": "user", "content": prompt}],
            "options": {
                "temperature": sicaklik,
                "top_p": 0.9,
                "top_k": 40,
                "repeat_penalty": 1.1,
                "num_predict": 200,
                "seed": 42,
            },
            "stream": False,
        },
        timeout=120,
    )
    response.raise_for_status()

    print(f"[TEMPERATURE = {sicaklik}]")
    print(response.json()["message"]["content"])


#---------------Farklı sonuçların kontrolü(temperature değerleriyle değişim) için 3 deneme -----------------------------------------yapalım---------------------

# for sicaklik in (0.1, 0.7, 1.3):
#     print(f"\n===== TEMPERATURE = {sicaklik} =====")

#     for deneme in range(1, 4):
#         response = requests.post(
#             URL,
#             json={
#                 "model": "gemma3:4b",
#                 "messages": [{"role": "user", "content": prompt}],
#                 "options": {
#                     "temperature": sicaklik,
#                     "top_p": 0.9,
#                     "top_k": 40,
#                     "repeat_penalty": 1.1,
#                     "num_predict": 200,
#                     "seed": 42,
#                 },
#                 "stream": False,
#             },
#             timeout=120,
#         )
#         response.raise_for_status()

#         print(f"\n[TEMPERATURE = {sicaklik}]")
#         print(response.json()["message"]["content"])