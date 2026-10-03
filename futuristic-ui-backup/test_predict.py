import requests
with open("test_frame.jpg", "rb") as f:
    files = {"frame": f}
    r = requests.post("http://127.0.0.1:5000/predict", files=files)
print("STATUS:", r.status_code)
print(r.json())
