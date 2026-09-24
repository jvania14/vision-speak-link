"""Collect real webcam MediaPipe landmark samples for Silent Talk.

Static samples are written to dataset.csv with 42 features:
feature_0=x0, feature_1=y0, ..., feature_40=x20, feature_41=y20.

J and Z are collected as temporal sequences in temporal_sequences.csv. Each
sequence contains 24 valid consecutive hand frames, each with the same 42
features. A single frame cannot represent their movement reliably.

Controls:
  A-Z / 0-9  Select a static class. J and Z select temporal mode.
  [          Select SPACE.
  ]          Select DELETE.
    C          Start/pause controlled auto-capture for the selected class.
  Q / ESC    Save and quit.
"""

from __future__ import annotations

import argparse
import csv
import math
import os
import time
import uuid
from collections import Counter
from pathlib import Path

import cv2
import mediapipe as mp

STATIC_CLASSES = list("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") + ["SPACE", "DELETE"]
ALL_CLASSES = STATIC_CLASSES
TEMPORAL_CLASSES = {"J", "Z"}
FEATURE_COUNT = 42
SEQUENCE_LENGTH = 24
TARGET_SAMPLES = 500
CAPTURE_INTERVAL_SECONDS = 0.2
STATIC_HEADER = ["label"] + [f"feature_{index}" for index in range(FEATURE_COUNT)]
TEMPORAL_HEADER = ["sequence_id", "label", "frame_index"] + [
    f"feature_{index}" for index in range(FEATURE_COUNT)
]


def extract_features(hand_landmarks) -> list[float] | None:
    """Match backend/app.py exactly: 21 landmarks, translated x/y pairs."""
    landmarks = hand_landmarks.landmark
    if len(landmarks) != 21:
        return None

    x_values = [landmark.x for landmark in landmarks]
    y_values = [landmark.y for landmark in landmarks]
    min_x = min(x_values)
    min_y = min(y_values)
    features: list[float] = []
    for landmark in landmarks:
        features.append(landmark.x - min_x)
        features.append(landmark.y - min_y)

    if len(features) != FEATURE_COUNT or not all(math.isfinite(value) for value in features):
        return None
    return features


def ensure_csv(path: Path, header: list[str]) -> None:
    if not path.exists() or path.stat().st_size == 0:
        with path.open("w", newline="", encoding="utf-8") as handle:
            csv.writer(handle).writerow(header)


def counts(path: Path, label_index: int) -> Counter[str]:
    result: Counter[str] = Counter()
    if not path.exists():
        return result
    with path.open("r", newline="", encoding="utf-8") as handle:
        for row in csv.reader(handle):
            if row and row[0] != "label" and len(row) > label_index:
                result[row[label_index]] += 1
    return result


def draw_overlay(
    frame,
    label: str,
    static_counts: Counter[str],
    temporal_counts: Counter[str],
    status: str,
    autofocus_status: str,
    hand_detected: bool,
) -> None:
    cv2.rectangle(frame, (0, 0), (frame.shape[1], 142), (8, 14, 25), -1)
    mode = "TEMPORAL / 24 FRAMES" if label in TEMPORAL_CLASSES else "STATIC / 1 FRAME"
    current_count = temporal_counts[label] if label in TEMPORAL_CLASSES else static_counts[label]
    resolution = f"{frame.shape[1]}x{frame.shape[0]}"
    lines = [
        f"CLASS: {label}    MODE: {mode}",
        f"SAMPLES: {current_count}/{TARGET_SAMPLES}",
        f"CAMERA: {resolution}    AUTOFOCUS: {autofocus_status}",
        f"HAND: {'DETECTED' if hand_detected else 'NO HAND'}    STATUS: {status}",
        "C = start/pause auto-capture   [ = SPACE   ] = DELETE   Q/ESC = quit",
    ]
    for index, text in enumerate(lines):
        color = (120, 255, 150) if index == 3 and hand_detected else (210, 245, 255)
        cv2.putText(frame, text, (18, 26 + index * 24), cv2.FONT_HERSHEY_SIMPLEX, 0.58, color, 1, cv2.LINE_AA)


def find_available_cameras() -> list[int]:
    available: list[int] = []
    print("Scanning camera indexes 0, 1, 2, 3, 4...")
    for index in range(5):
        probe = cv2.VideoCapture(index)
        opened = probe.isOpened()
        readable = False
        if opened:
            readable, _ = probe.read()
        probe.release()
        if opened and readable:
            available.append(index)
            print(f"  Camera {index}: available")
        else:
            print(f"  Camera {index}: unavailable")
    return available


def choose_camera_index(available: list[int], requested: int | None) -> int:
    if not available:
        raise RuntimeError("No readable cameras found at indexes 0-4")

    default_index = requested if requested in available else available[0]
    while True:
        choice = input(f"Choose camera index from {available} [default {default_index}]: ").strip()
        if not choice:
            return default_index
        try:
            selected = int(choice)
        except ValueError:
            print("Enter one of the available numeric camera indexes.")
            continue
        if selected in available:
            return selected
        print(f"Camera {selected} is not available. Choose one of {available}.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Collect real webcam landmark data for Silent Talk.")
    parser.add_argument("--camera", type=int, default=None, help="Preselect an available OpenCV camera index")
    parser.add_argument("--output-dir", type=Path, default=Path(__file__).resolve().parent)
    args = parser.parse_args()

    available_cameras = find_available_cameras()
    camera_index = choose_camera_index(available_cameras, args.camera)
    print(f"Selected camera index: {camera_index}")

    output_dir = args.output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    static_path = output_dir / "dataset.csv"
    temporal_path = output_dir / "temporal_sequences.csv"
    ensure_csv(static_path, STATIC_HEADER)
    ensure_csv(temporal_path, TEMPORAL_HEADER)

    static_counts = counts(static_path, 0)
    temporal_counts = Counter({label: count // SEQUENCE_LENGTH for label, count in counts(temporal_path, 1).items()})
    selected_label = "A"
    pending_sequence = False
    sequence_id = ""
    sequence_frames: list[list[float]] = []
    status = "READY"
    capture_active = False
    last_capture_time = 0.0

    mp_hands = mp.solutions.hands
    mp_drawing = mp.solutions.drawing_utils
    mp_drawing_styles = mp.solutions.drawing_styles
    hands = mp_hands.Hands(static_image_mode=True, min_detection_confidence=0.3)
    camera = cv2.VideoCapture(camera_index)
    if not camera.isOpened():
        raise RuntimeError(f"Could not open selected camera index {camera_index}")
    camera.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    autofocus_requested = camera.set(cv2.CAP_PROP_AUTOFOCUS, 1)
    autofocus_value = camera.get(cv2.CAP_PROP_AUTOFOCUS)
    autofocus_status = "ON" if autofocus_requested and autofocus_value > 0.5 else "UNAVAILABLE"

    try:
        with static_path.open("a", newline="", encoding="utf-8") as static_handle, temporal_path.open("a", newline="", encoding="utf-8") as temporal_handle:
            static_writer = csv.writer(static_handle)
            temporal_writer = csv.writer(temporal_handle)
            while True:
                ok, frame = camera.read()
                if not ok:
                    status = "CAMERA READ FAILED"
                    break

                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                results = hands.process(frame_rgb)
                features = None
                if results.multi_hand_landmarks:
                    hand_landmarks = results.multi_hand_landmarks[0]
                    features = extract_features(hand_landmarks)
                    mp_drawing.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS, mp_drawing_styles.get_default_hand_landmarks_style(), mp_drawing_styles.get_default_hand_connections_style())

                now = time.monotonic()
                if capture_active and selected_label in TEMPORAL_CLASSES and not pending_sequence:
                    if temporal_counts[selected_label] >= TARGET_SAMPLES:
                        capture_active = False
                        status = f"{selected_label} REACHED {TARGET_SAMPLES}/{TARGET_SAMPLES}"
                        print(f"Class {selected_label} reached {TARGET_SAMPLES} samples.")
                    else:
                        sequence_id = f"{selected_label}_{int(time.time())}_{uuid.uuid4().hex[:8]}"
                        sequence_frames = []
                        pending_sequence = True
                        status = "AUTO CAPTURE: MOVE HAND"

                if capture_active and pending_sequence and features is not None and now - last_capture_time >= CAPTURE_INTERVAL_SECONDS:
                    temporal_writer.writerow([sequence_id, selected_label, len(sequence_frames), *features])
                    temporal_handle.flush()
                    sequence_frames.append(features)
                    last_capture_time = now
                    status = f"CAPTURING {len(sequence_frames)}/{SEQUENCE_LENGTH}"
                    if len(sequence_frames) == SEQUENCE_LENGTH:
                        temporal_counts[selected_label] += 1
                        pending_sequence = False
                        sequence_frames = []
                        status = f"AUTO CAPTURE: {temporal_counts[selected_label]}/{TARGET_SAMPLES}"
                        if temporal_counts[selected_label] >= TARGET_SAMPLES:
                            capture_active = False
                            status = f"{selected_label} REACHED {TARGET_SAMPLES}/{TARGET_SAMPLES}"
                            print(f"Class {selected_label} reached {TARGET_SAMPLES} samples.")

                if capture_active and selected_label not in TEMPORAL_CLASSES and features is not None and now - last_capture_time >= CAPTURE_INTERVAL_SECONDS:
                    if static_counts[selected_label] < TARGET_SAMPLES:
                        static_writer.writerow([selected_label, *features])
                        static_handle.flush()
                        static_counts[selected_label] += 1
                        last_capture_time = now
                        status = f"AUTO CAPTURE: {static_counts[selected_label]}/{TARGET_SAMPLES}"
                        if static_counts[selected_label] >= TARGET_SAMPLES:
                            capture_active = False
                            status = f"{selected_label} REACHED {TARGET_SAMPLES}/{TARGET_SAMPLES}"
                            print(f"Class {selected_label} reached {TARGET_SAMPLES} samples.")

                hand_detected = features is not None
                visible_status = status if hand_detected or pending_sequence else "NO VALID HAND"
                draw_overlay(frame, selected_label, static_counts, temporal_counts, visible_status, autofocus_status, hand_detected)
                cv2.imshow("Silent Talk Dataset Collector", frame)
                key = cv2.waitKey(1) & 0xFF
                if key in (ord("q"), ord("Q"), 27):
                    break
                if key == ord("c") or key == ord("C"):
                    if capture_active:
                        capture_active = False
                        pending_sequence = False
                        sequence_frames = []
                        status = "AUTO CAPTURE PAUSED"
                    else:
                        current_count = temporal_counts[selected_label] if selected_label in TEMPORAL_CLASSES else static_counts[selected_label]
                        if current_count >= TARGET_SAMPLES:
                            status = f"{selected_label} REACHED {TARGET_SAMPLES}/{TARGET_SAMPLES}"
                            print(f"Class {selected_label} reached {TARGET_SAMPLES} samples.")
                        else:
                            capture_active = True
                            status = f"AUTO CAPTURE STARTED: 0.2s interval ({current_count}/{TARGET_SAMPLES})"
                elif ord("A") <= key <= ord("Z"):
                    if not capture_active and not pending_sequence:
                        selected_label = chr(key)
                        status = "CLASS SELECTED"
                elif ord("0") <= key <= ord("9"):
                    if not capture_active and not pending_sequence:
                        selected_label = chr(key)
                        status = "CLASS SELECTED"
                elif key == ord("[") and not capture_active and not pending_sequence:
                    selected_label = "SPACE"
                    status = "SPACE SELECTED"
                elif key == ord("]") and not capture_active and not pending_sequence:
                    selected_label = "DELETE"
                    status = "DELETE SELECTED"
    finally:
        camera.release()
        hands.close()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
