import requests
URL = "http://localhost:11434/api/chat"

talep = "Finans raporu çok yavaş açılıyor ve gösterilen satış tutarları da yanlış."

prompt = f"""
Aşağıdaki teknik destek talebini analiz et.

Talep: {talep}

Kategori yalnızca şunlardan biri olabilir:
Erişim, Performans, Veri Kalitesi, Diğer

Öncelik yalnızca:
Düşük, Orta, Yüksek

Şu alanlarla JSON üret:
kategori, oncelik, gerekce, eksik_bilgiler

eksik_bilgiler bir liste olmalıdır.
Bilgi uydurma.
"""
payload = {"model": "gemma3:4b",
           "messages": [{"role": "user", "content": prompt}],
           "stream": False}
response = requests.post(URL, json=payload, timeout=180)
response.raise_for_status()
print(response.json()["message"]["content"]) 