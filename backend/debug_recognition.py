"""Temporary diagnostic: existing model.p + MediaPipe pipeline. Does not write model.p."""
from __future__ import annotations

import csv
import os
import pickle
import sys
from pathlib import Path

import cv2
import mediapipe as mp
import numpy as np

BACKEND = Path(__file__).resolve().parent
MODEL_PATH = BACKEND / "model.p"
DATASET_PATH = BACKEND / "dataset.csv"
LABELS = {i: chr(97 + i) for i in range(26)}


def extract_features(hand_landmarks) -> list[float]:
    x_ = [lm.x for lm in hand_landmarks.landmark]
    y_ = [lm.y for lm in hand_landmarks.landmark]
    min_x = min(x_)
    min_y = min(y_)
    data_aux: list[float] = []
    for landmark in hand_landmarks.landmark:
        data_aux.append(landmark.x - min_x)
        data_aux.append(landmark.y - min_y)
    return data_aux


def load_model():
    model_dict = pickle.load(open(MODEL_PATH, "rb"))
    model = model_dict["model"]
    print("MODEL_PATH", MODEL_PATH)
    print("n_features_in_", getattr(model, "n_features_in_", None))
    print("classes_", list(getattr(model, "classes_", [])))
    print("n_features_ok", getattr(model, "n_features_in_", None) == 42)
    return model


def test_dataset_vector(model) -> None:
    if not DATASET_PATH.exists():
        print("NO dataset.csv")
        return
    with DATASET_PATH.open(newline="", encoding="utf-8") as handle:
        row = next(csv.DictReader(handle))
    vector = [float(row[f"feature_{i}"]) for i in range(42)]
    csv_label = row["label"]
    prediction = model.predict([np.asarray(vector)])
    raw = prediction[0]
    try:
        letter = LABELS[int(raw)]
    except (ValueError, KeyError, TypeError):
        letter = f"UNMAPPED:{raw!r}"
    confidence = None
    if hasattr(model, "predict_proba"):
        proba = model.predict_proba([np.asarray(vector)])
        confidence = float(np.max(proba[0]))
    print("DATASET_ROW_LABEL", csv_label)
    print("DATASET_FEATURE_COUNT", len(vector))
    print("DATASET_PREDICTED_CLASS", raw, type(raw).__name__)
    print("DATASET_MAPPED_LETTER", letter)
    print("DATASET_CONFIDENCE", confidence)


def run_image(model, image_path: Path, hands) -> None:
    print("IMAGE", image_path)
    frame = cv2.imread(str(image_path))
    if frame is None:
        print("DECODE_FAIL")
        return
    print("IMAGE_SHAPE", frame.shape)
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = hands.process(frame_rgb)
    if not results.multi_hand_landmarks:
        print("hand_detected", False)
        print("number_of_landmarks", 0)
        print("feature_count", 0)
        return
    hand_landmarks = results.multi_hand_landmarks[0]
    n = len(hand_landmarks.landmark)
    features = extract_features(hand_landmarks)
    xs = [lm.x for lm in hand_landmarks.landmark[:3]]
    ys = [lm.y for lm in hand_landmarks.landmark[:3]]
    prediction = model.predict([np.asarray(features)])
    raw = prediction[0]
    try:
        letter = LABELS[int(raw)]
    except (ValueError, KeyError, TypeError):
        letter = f"UNMAPPED:{raw!r}"
    confidence = None
    if hasattr(model, "predict_proba"):
        proba = model.predict_proba([np.asarray(features)])
        confidence = float(np.max(proba[0]))
    print("hand_detected", True)
    print("number_of_landmarks", n)
    print("first_xy", list(zip(xs, ys)))
    print("feature_count", len(features))
    print("predicted_class", raw)
    print("predicted_letter", letter)
    print("confidence", confidence)


def capture_webcam_frame(camera_index: int, out_path: Path) -> Path | None:
    camera = cv2.VideoCapture(camera_index)
    if not camera.isOpened():
        print("WEBCAM_OPEN_FAIL", camera_index)
        return None
    camera.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    frame = None
    for _ in range(30):
        ok, candidate = camera.read()
        if ok and candidate is not None:
            frame = candidate
    camera.release()
    if frame is None:
        print("WEBCAM_READ_FAIL", camera_index)
        return None
    cv2.imwrite(str(out_path), frame)
    print("SAVED_WEBCAM_FRAME", out_path, frame.shape)
    return out_path


def main() -> None:
    model = load_model()
    print("--- dataset vector ---")
    test_dataset_vector(model)
    hands = mp.solutions.hands.Hands(
        static_image_mode=True,
        max_num_hands=1,
        min_detection_confidence=0.3,
    )
    if "--camera" in sys.argv:
        indexes = [0]
        pos = sys.argv.index("--camera")
        if pos + 1 < len(sys.argv) and sys.argv[pos + 1].isdigit():
            indexes = [int(sys.argv[pos + 1])]
        else:
            indexes = [0, 1, 2, 3]
        for idx in indexes:
            captured = capture_webcam_frame(idx, BACKEND / f"_debug_webcam_{idx}.jpg")
            if captured is not None:
                print("==== webcam", idx, "====")
                run_image(model, captured, hands)
                break
    candidates = [BACKEND / "test_frame.jpg"]
    public_asl = BACKEND / "vision-speak-link" / "public" / "asl"
    if public_asl.exists():
        for letter in ("A", "B", "C", "L", "V", "Y"):
            for ext in (".webp", ".png", ".jpg", ".jpeg"):
                path = public_asl / f"{letter}{ext}"
                if path.exists():
                    candidates.append(path)
                    break
    print("--- images ---")
    for path in candidates:
        if path.exists():
            print("====")
            run_image(model, path, hands)
        else:
            print("MISSING", path)
    hands.close()


if __name__ == "__main__":
    os.chdir(BACKEND)
    main()
