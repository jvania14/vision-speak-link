import math
import os
import pickle
import threading
import uuid
from datetime import datetime, timedelta
import cv2
import mediapipe as mp
import numpy as np
from dotenv import load_dotenv
from flask import Flask, Response, jsonify, request
from flask_cors import CORS
from openai import OpenAI

load_dotenv()

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = int(os.getenv("MAX_FRAME_BYTES", str(3 * 1024 * 1024)))

# Dynamic CORS configuration for deployment and local development
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "*")
if FRONTEND_ORIGIN == "*":
    CORS(app)
else:
    origins = [o.strip() for o in FRONTEND_ORIGIN.split(",") if o.strip()]
    CORS(app, origins=origins, supports_credentials=True)

# Load existing trained model (DO NOT MODIFY MODEL.P)
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.p") if os.path.dirname(__file__) else "model.p"
model_dict = pickle.load(open(MODEL_PATH, "rb"))
model = model_dict["model"]

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

SYSTEM_MESSAGE = {
    "role": "system",
    "content": (
        "\nStick strictly to theese guidelines:\n\nYou are an assistant for a live translator of "
        "fingerspelling sign language. Your task is to analyze the input of fingerspelled sequences "
        "and identify if there are words that are stuck together. If so, you should insert spaces to "
        "separate these words appropriately. Otherwise, return the input as it is.\n\n"
        "Key instructions:\n0. Altering: Do NOT add letters, do NOT delete letters.\n"
        "1. Insert spaces where necessary without altering meaning.\n"
    ),
}


def send_message(message: str) -> str:
    if client is None:
        return message
    try:
        chat = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[SYSTEM_MESSAGE, {"role": "user", "content": message}],
        )
        reply = chat.choices[0].message.content or message
        return reply
    except Exception as err:
        print(f"OpenAI error: {err}")
        return message

# MediaPipe Hands: static frames from /predict (same min_detection_confidence as original).
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

# Independent JPEG frames from each visitor: static_image_mode matches the
# original still-frame pipeline. Do not change landmark feature extraction.
hands = mp_hands.Hands(
    static_image_mode=True,
    max_num_hands=1,
    min_detection_confidence=0.3,
)
hands_lock = threading.Lock()

# Existing model.p classes are string labels "0".."25" (see model.classes_).
# Legacy Silent Talk code maps those integers onto A-Z in alphabetic order.
labels_dict = {i: chr(65 + i) for i in range(26)}

# Multi-user session storage: thread-safe, isolated per client
sessions_lock = threading.Lock()
sessions: dict[str, dict] = {}
CONFIDENCE_THRESHOLD = float(os.getenv("RECOGNITION_CONFIDENCE_THRESHOLD", "0.30"))
STABLE_FRAME_COUNT = max(1, int(os.getenv("RECOGNITION_STABLE_FRAMES", "3")))
LETTER_COOLDOWN_SECONDS = float(os.getenv("RECOGNITION_LETTER_COOLDOWN_SECONDS", "0.8"))
DEBUG_RECOGNITION = os.getenv("DEBUG_RECOGNITION", "0") == "1"


def extract_42_features(hand_landmarks) -> list[float]:
    """Original pipeline: 21 landmarks, (x-min_x, y-min_y) pairs, length 42."""
    x_ = [landmark.x for landmark in hand_landmarks.landmark]
    y_ = [landmark.y for landmark in hand_landmarks.landmark]
    min_x = min(x_)
    min_y = min(y_)
    data_aux: list[float] = []
    for landmark in hand_landmarks.landmark:
        data_aux.append(landmark.x - min_x)
        data_aux.append(landmark.y - min_y)
    return data_aux


def map_model_class(raw_prediction) -> tuple[str, str]:
    """Return (predicted_class, letter). Never swallow an unknown class as ''."""
    if hasattr(raw_prediction, "item"):
        raw_prediction = raw_prediction.item()
    predicted_class = str(raw_prediction)
    try:
        class_index = int(raw_prediction)
    except (TypeError, ValueError):
        return predicted_class, f"UNMAPPED:{predicted_class}"
    if class_index not in labels_dict:
        return predicted_class, f"UNMAPPED:{predicted_class}"
    return predicted_class, labels_dict[class_index]


def infer_from_bgr_frame(frame):
    """Run MediaPipe + existing model.p. Does not mutate model.p."""
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    with hands_lock:
        results = hands.process(frame_rgb)

    payload = {
        "hand_detected": False,
        "landmark_count": 0,
        "feature_count": 0,
        "predicted_class": None,
        "letter": "",
        "confidence": None,
        "landmarks": [],
    }

    if not results.multi_hand_landmarks:
        if DEBUG_RECOGNITION:
            print("DEBUG_RECOGNITION hand_detected=False", flush=True)
        return payload

    hand_landmarks = results.multi_hand_landmarks[0]
    landmarks_list = [{"x": float(lm.x), "y": float(lm.y)} for lm in hand_landmarks.landmark]
    data_aux = extract_42_features(hand_landmarks)

    prediction = model.predict([np.asarray(data_aux)])
    predicted_class, letter = map_model_class(prediction[0])
    confidence = None
    if hasattr(model, "predict_proba"):
        try:
            probabilities = model.predict_proba([np.asarray(data_aux)])
            confidence = float(np.max(probabilities[0]))
        except Exception as err:
            print(f"DEBUG_RECOGNITION predict_proba failed: {err}")
            confidence = None

    payload.update(
        {
            "hand_detected": True,
            "landmark_count": len(hand_landmarks.landmark),
            "feature_count": len(data_aux),
            "predicted_class": predicted_class,
            "letter": letter,
            "confidence": confidence,
            "landmarks": landmarks_list,
        }
    )
    if DEBUG_RECOGNITION:
        print(
            "DEBUG_RECOGNITION",
            f"hand_detected={payload['hand_detected']}",
            f"landmark_count={payload['landmark_count']}",
            f"feature_count={payload['feature_count']}",
            f"predicted_class={predicted_class}",
            f"predicted_letter={letter}",
            f"confidence={confidence}",
            flush=True,
        )
    return payload


def read_request_frame_bytes():
    if "frame" in request.files:
        return request.files["frame"].read()
    if request.is_json and request.json and "image" in request.json:
        import base64
        img_str = request.json["image"]
        if "," in img_str:
            img_str = img_str.split(",", 1)[1]
        return base64.b64decode(img_str)
    if request.data:
        return request.data
    return None


def get_or_create_session(session_id: str | None = None) -> tuple[str, dict]:
    global sessions
    with sessions_lock:
        now = datetime.now()
        # Clean up stale sessions older than 2 hours to avoid memory leaks
        stale_threshold = now - timedelta(hours=2)
        stale_keys = [sid for sid, s in sessions.items() if s.get("last_seen", now) < stale_threshold]
        for sid in stale_keys:
            del sessions[sid]

        if not session_id or session_id not in sessions:
            new_id = session_id if session_id else uuid.uuid4().hex
            sessions[new_id] = {
                "final_text": "",
                "current_letter": "",
                "current_confidence": None,
                "hand_detected": False,
                "last_prediction": "",
                "last_prediction_time": None,
                "stable_prediction": "",
                "stable_count": 0,
                "last_committed_letter": "",
                "last_committed_time": None,
                "gesture_armed": True,
                "landmarks": [],
                "last_seen": now,
            }
            return new_id, sessions[new_id]

        sessions[session_id]["last_seen"] = now
        return session_id, sessions[session_id]


# ---------------------------------------------------------------------------
# PUBLIC MULTI-USER ENDPOINT: /predict
# Receives a compressed frame from any user's browser webcam.
# Runs MediaPipe, extracts the SAME 42 features, runs existing model.p,
# and returns isolated prediction + 21 hand landmarks for HUD overlay.
# ---------------------------------------------------------------------------
@app.route("/health", methods=["GET"])
def health():
    return jsonify(
        status="ok",
        model_loaded=True,
        model_type=type(model).__name__,
        n_features_in=getattr(model, "n_features_in_", None),
        classes=[str(value) for value in getattr(model, "classes_", [])],
        static_gesture_support="A-Z single-frame labels inherited from existing model.p",
    )


@app.route("/predict", methods=["POST"])
def predict():
    session_id = (
        request.form.get("session_id")
        or request.headers.get("X-Session-Id")
        or (request.json.get("session_id") if request.is_json else None)
    )
    sid, session = get_or_create_session(session_id)

    frame_bytes = read_request_frame_bytes()
    if not frame_bytes:
        return jsonify(error="No frame data received"), 400

    np_buf = np.frombuffer(frame_bytes, np.uint8)
    frame = cv2.imdecode(np_buf, cv2.IMREAD_COLOR)
    if frame is None:
        return jsonify(error="Could not decode image"), 400

    result = infer_from_bgr_frame(frame)
    hand_detected = result["hand_detected"]
    predicted_character = result["letter"]
    confidence = result["confidence"]

    with sessions_lock:
        session["hand_detected"] = hand_detected
        session["landmarks"] = result["landmarks"]
        session["current_letter"] = predicted_character
        session["current_confidence"] = confidence
        confidence_ok = confidence is None or (
            isinstance(confidence, (int, float))
            and math.isfinite(confidence)
            and confidence >= CONFIDENCE_THRESHOLD
        )
        valid_letter = (
            hand_detected
            and confidence_ok
            and predicted_character
            and not str(predicted_character).startswith("UNMAPPED")
        )
        if valid_letter:
            now = datetime.now()
            if predicted_character == session["stable_prediction"]:
                session["stable_count"] += 1
            else:
                session["stable_prediction"] = predicted_character
                session["stable_count"] = 1
                session["last_prediction_time"] = now

            cooldown_elapsed = (
                session["last_committed_time"] is None
                or (now - session["last_committed_time"]).total_seconds() >= LETTER_COOLDOWN_SECONDS
            )
            duplicate_rearmed = (
                predicted_character != session["last_committed_letter"] or session["gesture_armed"]
            )
            if session["stable_count"] >= STABLE_FRAME_COUNT and cooldown_elapsed and duplicate_rearmed:
                session["final_text"] += predicted_character
                session["last_prediction"] = predicted_character
                session["last_committed_letter"] = predicted_character
                session["last_committed_time"] = now
                session["gesture_armed"] = False
        else:
            session["last_prediction"] = ""
            session["last_prediction_time"] = None
            session["stable_prediction"] = ""
            session["stable_count"] = 0
            session["gesture_armed"] = True

        return jsonify({
            "text": session["final_text"],
            "letter": session["current_letter"],
            "confidence": session["current_confidence"],
            "hand_detected": session["hand_detected"],
            "landmarks": session["landmarks"],
            "session_id": sid,
            "predicted_class": result["predicted_class"],
            "landmark_count": result["landmark_count"],
            "feature_count": result["feature_count"],
        })


@app.route("/predict-debug", methods=["POST"])
def predict_debug():
    frame_bytes = read_request_frame_bytes()
    if not frame_bytes:
        return jsonify(error="No frame data received"), 400
    np_buf = np.frombuffer(frame_bytes, np.uint8)
    frame = cv2.imdecode(np_buf, cv2.IMREAD_COLOR)
    if frame is None:
        return jsonify(error="Could not decode image"), 400
    result = infer_from_bgr_frame(frame)
    return jsonify(
        {
            "hand_detected": result["hand_detected"],
            "landmark_count": result["landmark_count"],
            "feature_count": result["feature_count"],
            "predicted_class": result["predicted_class"],
            "letter": result["letter"],
            "confidence": result["confidence"],
        }
    )


# ---------------------------------------------------------------------------
# SESSION-ISOLATED TEXT & BUFFER CONTROL
# ---------------------------------------------------------------------------
@app.route("/get_text", methods=["GET"])
def get_text():
    session_id = request.args.get("session_id") or request.headers.get("X-Session-Id")
    with sessions_lock:
        if session_id and session_id in sessions:
            s = sessions[session_id]
            return jsonify(
                text=s["final_text"],
                letter=s["current_letter"],
                confidence=s["current_confidence"],
                hand_detected=s["hand_detected"],
                landmarks=s["landmarks"],
                session_id=session_id,
            )
        return jsonify(
            text="",
            letter="",
            confidence=None,
            hand_detected=False,
            landmarks=[],
            session_id=session_id or "",
        )


@app.route("/reset_text", methods=["POST"])
def reset_text():
    session_id = (
        request.form.get("session_id")
        or request.headers.get("X-Session-Id")
        or (request.json.get("session_id") if request.is_json else None)
        or request.args.get("session_id")
    )
    with sessions_lock:
        if session_id and session_id in sessions:
            session = sessions[session_id]
            session["final_text"] = ""
            session["current_letter"] = ""
            session["current_confidence"] = None
            session["hand_detected"] = False
            session["last_prediction"] = ""
            session["last_prediction_time"] = None
            session["stable_prediction"] = ""
            session["stable_count"] = 0
            session["last_committed_letter"] = ""
            session["last_committed_time"] = None
            session["gesture_armed"] = True
            session["landmarks"] = []
    return jsonify(success=True, session_id=session_id or "")


# ---------------------------------------------------------------------------
# LEGACY SERVER-CAMERA STREAM (LOCAL FALLBACK)
# ---------------------------------------------------------------------------
CAMERA_INDEX = 1
FALLBACK_CAMERA_INDICES = (0, 2, 3)


def open_camera():
    indices = [CAMERA_INDEX] + [i for i in FALLBACK_CAMERA_INDICES if i != CAMERA_INDEX]
    for index in indices:
        try:
            camera = cv2.VideoCapture(index)
            if camera.isOpened():
                return camera, index
            camera.release()
        except Exception:
            continue
    return None, None


def detect_asl(cap):
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = None
            with hands_lock:
                results = hands.process(frame_rgb)
            if results.multi_hand_landmarks:
                for hand_landmarks in results.multi_hand_landmarks:
                    mp_drawing.draw_landmarks(
                        frame,
                        hand_landmarks,
                        mp_hands.HAND_CONNECTIONS,
                        mp_drawing_styles.get_default_hand_landmarks_style(),
                        mp_drawing_styles.get_default_hand_connections_style()
                    )
            ret, buffer = cv2.imencode(".jpg", frame)
            if not ret:
                continue
            frame_bytes = buffer.tobytes()
            yield (b"--frame\r\n"
                   b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n")
    finally:
        cap.release()


@app.route("/video_feed")
def video_feed():
    camera, _camera_index = open_camera()
    if camera is None:
        return jsonify(error="Server camera unavailable. Use browser webcam via /predict."), 503
    return Response(detect_asl(camera), mimetype="multipart/x-mixed-replace; boundary=frame")


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False, use_reloader=False)
