from flask import Flask, jsonify, request, Response
import cv2
import mediapipe as mp
import numpy as np
import pickle
import threading
from datetime import datetime
from queue import Empty, Queue
from openai import OpenAI
import os
from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

model_dict = pickle.load(open('model.p', 'rb'))
model = model_dict['model']

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None


messages = [
    {
        "role": "system",
        "content": "\nStick strictly to theese guidelines:\n\nYou are an assistant for a live translator of fingerspelling sign language. Your task is to analyze the input of fingerspelled sequences and identify if there are words that are stuck together. If so, you should insert spaces to separate these words appropriately. Otherwise, return the input as it is.\n\nKey instructions:\n\n0. **Altering**: \n   - Do NOT add letters to the sequence, and do NOT delete any letters from the sequence. \n\n1. **Contextual Analysis**: \n   - Analyze the context of the fingerspelled sequence to determine if it forms a known word, phrase, or expression. \n\n2. **Maintaining Integrity**: \n   - If the input clearly forms a known word, phrase, or idiomatic expression, keep it intact. Your sole task is to insert spaces where necessary without altering the meaning.\n\n3. **Idiomatic and Informal Language**: \n   - Be aware of idiomatic and informal language, such as \"u\" for \"you,\" and recognize such contexts to maintain the intended meaning.\n\n4. **Common Phrases and Expressions**: \n   - Recognize and keep together common idiomatic expressions and phrases, especially well-known sayings.\n\n5. **Separation Guidelines**: \n   - Only separate fragments that clearly do not belong together based on their meaning or context. Ensure that fragments not corresponding to valid English words or common phrases are appropriately divided.\n\n6. **Single Words and Expressions**: \n   - Prioritize keeping single, easily recognizable words intact unless they form part of a larger multi-word expression.\n\n7. **Comprehensive Review**: \n   - Always review the entire sequence of fingerspelled letters to assess if they combine to form recognized words, phrases, idiomatic expressions, or well-known sayings in English.\n\n8. **Avoid Isolated Symbols**: \n   - Avoid leaving any single symbol or sequence of symbols with spaces before and after if they make no sense. Attempt to form meaningful words or prepositions using nearby symbols unless they have idiomatic meaning in context.\n\n**Examples**:\n\n- \"loveusomu ch\" should be recognized and corrected to \"love u so much.\"\n- \"lovey ou\" should be recognized and corrected to \"love you.\"\n\n**List of Common Idiomatic Expressions and Phrases**:\n- \"break a leg\"\n- \"hit the sack\"\n- \"let the cat out of the bag\"\n- \"piece of cake\"\n- \"once in a blue moon\"\n- \"cost an arm and a leg\"\n- \"a blessing in disguise\"\n- \"a dime a dozen\"\n- \"beat around the bush\"\n- \"bite the bullet\"\n- \"call it a day\"\n- \"cut somebody some slack\"\n- \"hang in there\"\n- \"it's not rocket science\"\n- \"make a long story short\"\n- \"miss the boat\"\n- \"no pain, no gain\"\n- \"pull someone's leg\"\n- \"speak of the devil\"\n- \"the best of both worlds\"\n- \"time flies\"\n- \"under the weather\"\n- \"your guess is as good as mine\"\n\nEnsure idiomatic expressions and common phrases are kept intact and only divide words or fragments that clearly do not belong together based on meaning or context.\n\nIMPORTANT: NEVER ADD or delete any letters; you can work only with spaces. NEVER ADD ANYTHING EXCEPT SPACES!!! If input can not form a recognized word, phrase, or expression, just return it back.",
    }
]

def send_message(message):
    if client is None:
        return message

    messages.append({"role": "user", "content": message})
    chat = client.chat.completions.create(model="gpt-4o-mini", messages=messages)
    reply = chat.choices[0].message.content
    print(f"Translation: {reply}")
    messages.append({"role": "assistant", "content": reply})
    return reply

def api_request_thread(queue):
    while True:
        final_text = queue.get()
        if final_text is None:
            break
        final_text = send_message(final_text)  
        print(f"Updated final_text: {final_text}")
        update_final_text(final_text);

mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

hands = mp_hands.Hands(static_image_mode=True, min_detection_confidence=0.3)

labels_dict = {i: chr(97 + i) for i in range(26)}

final_text = ""
current_letter = ""
current_confidence = None
hand_detected = False
last_prediction = ""
last_prediction_time = None
gesture_armed = True
stable_time_required = 1.5
fill_color_start_time = None
final_text_lock = threading.Lock()

def update_final_text(new_text):
    global final_text
    with final_text_lock:
        final_text = new_text

color_fill = (174, 90, 6, 200)  # #A8CB1A with 50% alpha
color_frame = (0, 0, 0)  # #3C424D with 50% alpha

def draw_transparent_rect(frame, x1, y1, x2, y2, color):
    overlay = frame.copy()
    cv2.rectangle(overlay, (x1, y1), (x2, y2), color[:3], -1)
    cv2.addWeighted(overlay, color[3] / 255.0, frame, 1 - color[3] / 255.0, 0, frame)


CAMERA_INDEX = 1


def open_camera():
    print(f"Opening camera index {CAMERA_INDEX}...")
    camera = cv2.VideoCapture(CAMERA_INDEX)
    print(f"Camera opened: {camera.isOpened()}")
    if not camera.isOpened():
        camera.release()
        return None
    return camera


def detect_asl(queue, cap):
    global final_text, current_letter, current_confidence, hand_detected, last_prediction, last_prediction_time, gesture_armed, stable_time_required, fill_color_start_time
    frame_queue = Queue(maxsize=1)
    stop_reader = threading.Event()

    def read_frames():
        while not stop_reader.is_set():
            ret, frame = cap.read()
            if not ret:
                try:
                    frame_queue.put_nowait(None)
                except:
                    pass
                return

    reader = threading.Thread(target=read_frames, daemon=True)
    reader.start()
    print("VIDEO FEED CLIENT CONNECTED")

    try:
        while True:
            try:
                frame = frame_queue.get(timeout=5)
            except Empty:
                print("FRAME READ TIMEOUT")
                break
            if frame is None:
                print("FRAME READ FAILED")
                break

            data_aux = []
            x_ = []
            y_ = []

            H, W, _ = frame.shape
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = hands.process(frame_rgb)

            if results.multi_hand_landmarks:
                hand_detected = True
                for hand_landmarks in results.multi_hand_landmarks:
                    mp_drawing.draw_landmarks(
                        frame,
                        hand_landmarks,
                        mp_hands.HAND_CONNECTIONS,
                        mp_drawing_styles.get_default_hand_landmarks_style(),
                        mp_drawing_styles.get_default_hand_connections_style()
                    )

                    x_ = []
                    y_ = []
                    for landmark in hand_landmarks.landmark:
                        x_.append(landmark.x)
                        y_.append(landmark.y)

                    data_aux = []
                    for i in range(len(hand_landmarks.landmark)):
                        x = hand_landmarks.landmark[i].x
                        y = hand_landmarks.landmark[i].y
                        data_aux.append(x - min(x_))
                        data_aux.append(y - min(y_))

                    prediction = model.predict([np.asarray(data_aux)])
                    probabilities = model.predict_proba([np.asarray(data_aux)])
                    print(f"feature_count: {len(data_aux)}")
                    print(f"raw_prediction: {prediction[0]}")
                    print(f"top_probability: {probabilities[0].max()}")
                    predicted_character = labels_dict[int(prediction[0])]
                    current_letter = predicted_character
                    current_confidence = float(probabilities[0].max())

                    if predicted_character == last_prediction:
                        if gesture_armed and (datetime.now() - last_prediction_time).total_seconds() >= stable_time_required:
                            with final_text_lock:
                                final_text += predicted_character
                            print(f"Letter '{predicted_character}' detected. You can show the next letter.")
                            queue.put(final_text)
                            gesture_armed = False
                            fill_color_start_time = datetime.now()
                    else:
                        last_prediction = predicted_character
                        last_prediction_time = datetime.now()
                    x1 = int(min(x_) * W) - 10
                    y1 = int(min(y_) * H) - 10
                    x2 = int(max(x_) * W) - 10
                    y2 = int(max(y_) * H) - 10

                    cv2.rectangle(frame, (x1, y1), (x2, y2), color_frame, 2)
                    cv2.putText(frame, predicted_character, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 1.3, color_frame, 3, cv2.LINE_AA)

            else:
                hand_detected = False
                current_letter = ""
                current_confidence = None
                last_prediction = ""
                last_prediction_time = None
                gesture_armed = True

            if hand_detected and fill_color_start_time and (datetime.now() - fill_color_start_time).total_seconds() <= 0.3:
                draw_transparent_rect(frame, x1, y1, x2, y2, color_fill)
            ret, buffer = cv2.imencode('.jpg', frame)
            if not ret:
                print("JPEG ENCODE FAILED")
                continue
            frame = buffer.tobytes()

            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
    finally:
        stop_reader.set()
        cap.release()

queue = Queue()
t = threading.Thread(target=api_request_thread, args=(queue,))
t.start()

@app.route('/video_feed')
def video_feed():
    camera = open_camera()
    if camera is None:
        return jsonify(error=f"Could not open camera index {CAMERA_INDEX}"), 503
    return Response(detect_asl(queue, camera), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/get_text')
def get_text():
    global final_text
    with final_text_lock:
        return jsonify(text=final_text, letter=current_letter, confidence=current_confidence, hand_detected=hand_detected)

@app.route('/reset_text', methods=['POST'])
def reset_text():
    global final_text, current_letter, current_confidence, hand_detected, last_prediction, last_prediction_time, gesture_armed
    final_text = ""
    current_letter = ""
    current_confidence = None
    hand_detected = False
    last_prediction = ""
    last_prediction_time = None
    gesture_armed = True
    update_final_text("");
    print("I am working")
    with final_text_lock:
        final_text = ""
    return jsonify(success=True)

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False, use_reloader=False)
