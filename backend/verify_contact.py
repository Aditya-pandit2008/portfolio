import json
import urllib.request

url = 'http://127.0.0.1:5000/api/contact'
data = json.dumps({
    'name': 'Test User',
    'email': 'test@example.com',
    'message': 'Hello from backend test'
}).encode('utf-8')
request = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(request, timeout=10) as response:
    print(response.status)
    print(response.read().decode())
