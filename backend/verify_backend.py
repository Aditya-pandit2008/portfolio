import json
import subprocess
import time
import urllib.request

PYTHON = r"c:/Users/Aditya/OneDrive/Documents/Desktop/New folder/.venv/Scripts/python.exe"
server = subprocess.Popen([PYTHON, 'app.py'])
try:
    time.sleep(3)
    url = 'http://127.0.0.1:5000/api/contact'
    data = json.dumps({
        'name': 'Test User',
        'email': 'test@example.com',
        'message': 'Hello from backend test'
    }).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=10) as response:
        print(response.status)
        print(response.read().decode())
finally:
    server.terminate()
    server.wait(timeout=5)
