import requests
import os
import string

BASE_URL = "http://127.0.0.1:5000/predict-debug"
backend_dir = os.path.dirname(os.path.abspath(__file__))

results = []
for letter in string.ascii_uppercase:
    filepath = os.path.join(backend_dir, f"{letter}.jpg")
    if not os.path.exists(filepath):
        continue
    with open(filepath, "rb") as f:
        files = {"frame": f}
        r = requests.post(BASE_URL, files=files)
    data = r.json()
    predicted = data.get("letter", "")
    correct = predicted.upper() == letter
    results.append((letter, predicted, data.get("hand_detected"), data.get("confidence"), correct))

print(f"{'expected':<10}{'predicted':<12}{'hand_detected':<16}{'confidence':<12}{'correct'}")
correct_count = 0
for letter, predicted, hand_detected, confidence, correct in results:
    conf_str = f"{confidence:.3f}" if confidence is not None else "N/A"
    print(f"{letter:<10}{predicted:<12}{str(hand_detected):<16}{conf_str:<12}{correct}")
    if correct:
        correct_count += 1

print(f"\nAccuracy: {correct_count}/{len(results)} = {correct_count/len(results)*100:.1f}%" if results else "No images found")