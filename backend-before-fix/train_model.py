"""Validate and train a future Silent Talk landmark model.

This script is intentionally not run as part of dataset collection. It trains
only from real rows in dataset.csv. The saved artifact is model_new.p and the
existing model.p is never overwritten.

J and Z are temporal ASL gestures. The collector stores them in
 temporal_sequences.csv, but this RandomForest path is single-frame (42
features). Therefore this script refuses to train when J/Z are available only
as temporal sequences. A separate sequence model must consume those sequences
before claiming complete 38-class support.
"""

from __future__ import annotations

import argparse
import csv
import math
import pickle
from collections import Counter
from pathlib import Path

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split

CLASS_NAMES = list("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") + ["SPACE", "DELETE"]
CLASS_TO_ID = {label: index for index, label in enumerate(CLASS_NAMES)}
FEATURE_COUNT = 42
STATIC_HEADER = ["label"] + [f"feature_{index}" for index in range(FEATURE_COUNT)]


def parse_static_dataset(path: Path) -> tuple[np.ndarray, np.ndarray, Counter[str]]:
    if not path.exists():
        raise SystemExit(f"Missing dataset file: {path}")

    features: list[list[float]] = []
    labels: list[str] = []
    counts: Counter[str] = Counter()
    with path.open("r", newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames != STATIC_HEADER:
            raise SystemExit(f"Invalid header in {path}. Expected: {','.join(STATIC_HEADER)}")
        for line_number, row in enumerate(reader, start=2):
            label = (row.get("label") or "").strip()
            if label not in CLASS_TO_ID:
                raise SystemExit(f"Invalid label {label!r} at {path}:{line_number}")
            try:
                vector = [float(row[f"feature_{index}"]) for index in range(FEATURE_COUNT)]
            except (KeyError, TypeError, ValueError) as error:
                raise SystemExit(f"Malformed feature row at {path}:{line_number}: {error}") from error
            if len(vector) != FEATURE_COUNT or not all(math.isfinite(value) for value in vector):
                raise SystemExit(f"Non-finite or incorrect feature count at {path}:{line_number}")
            features.append(vector)
            labels.append(label)
            counts[label] += 1

    if not features:
        raise SystemExit(f"No valid samples found in {path}")
    return np.asarray(features, dtype=np.float32), np.asarray(labels), counts


def temporal_sequence_counts(path: Path) -> Counter[str]:
    counts: Counter[str] = Counter()
    if not path.exists():
        return counts
    sequences: dict[tuple[str, str], set[int]] = {}
    with path.open("r", newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        required = {"sequence_id", "label", "frame_index"} | {f"feature_{i}" for i in range(FEATURE_COUNT)}
        if not reader.fieldnames or not required.issubset(reader.fieldnames):
            raise SystemExit(f"Invalid temporal dataset header in {path}")
        for line_number, row in enumerate(reader, start=2):
            label = (row.get("label") or "").strip()
            if label not in {"J", "Z"}:
                raise SystemExit(f"Temporal dataset may only contain J/Z; found {label!r} at line {line_number}")
            try:
                frame_index = int(row["frame_index"])
                values = [float(row[f"feature_{i}"]) for i in range(FEATURE_COUNT)]
            except (KeyError, TypeError, ValueError) as error:
                raise SystemExit(f"Malformed temporal row at {path}:{line_number}: {error}") from error
            if frame_index < 0 or not all(math.isfinite(value) for value in values):
                raise SystemExit(f"Malformed temporal row at {path}:{line_number}")
            sequences.setdefault((label, row["sequence_id"]), set()).add(frame_index)
    for (label, _sequence_id), frames in sequences.items():
        if len(frames) == 24:
            counts[label] += 1
    return counts


def print_counts(static_counts: Counter[str], temporal_counts: Counter[str]) -> None:
    print("Samples per class:")
    for label in CLASS_NAMES:
        print(f"  {label}: static={static_counts[label]} temporal_sequences={temporal_counts[label]}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate and train the Silent Talk 42-feature classifier.")
    parser.add_argument("--dataset", type=Path, default=Path(__file__).resolve().parent / "dataset.csv")
    parser.add_argument("--temporal-dataset", type=Path, default=Path(__file__).resolve().parent / "temporal_sequences.csv")
    parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parent / "model_new.p")
    args = parser.parse_args()

    x, string_labels, static_counts = parse_static_dataset(args.dataset)
    temporal_counts = temporal_sequence_counts(args.temporal_dataset)
    print_counts(static_counts, temporal_counts)

    combined_counts = static_counts + temporal_counts
    missing = [label for label in CLASS_NAMES if combined_counts[label] == 0]
    if missing:
        raise SystemExit("Training rejected. Missing real samples/sequences for: " + ", ".join(missing))

    dynamic_only = [label for label in ("J", "Z") if static_counts[label] == 0 and temporal_counts[label] > 0]
    if dynamic_only:
        raise SystemExit(
            "Training rejected: " + ", ".join(dynamic_only) +
            " only have temporal sequences. The current 42-feature single-frame classifier "
            "cannot learn their movement; implement a sequence model before claiming 38-class support."
        )

    if any(static_counts[label] == 0 for label in CLASS_NAMES):
        raise SystemExit("Training rejected: dataset.csv must contain at least one real static row for every class.")

    if len(x) < len(CLASS_NAMES) * 2:
        raise SystemExit("Training rejected: too few static samples for a stratified train/test split.")

    y = np.asarray([CLASS_TO_ID[label] for label in string_labels], dtype=np.int64)
    x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.2, random_state=42, stratify=y)
    classifier = RandomForestClassifier(n_estimators=300, class_weight="balanced", random_state=42, n_jobs=-1)
    classifier.fit(x_train, y_train)
    predicted = classifier.predict(x_test)
    labels = list(range(len(CLASS_NAMES)))

    print(f"Total samples: {len(x)}")
    print(f"Training samples: {len(x_train)}")
    print(f"Test samples: {len(x_test)}")
    print(f"Number of classes: {len(CLASS_NAMES)}")
    print(f"Accuracy: {accuracy_score(y_test, predicted):.4f}")
    print("Classification report:")
    print(classification_report(y_test, predicted, labels=labels, target_names=CLASS_NAMES, zero_division=0))
    print("Confusion matrix (rows=true, columns=predicted; class order shown above):")
    print(confusion_matrix(y_test, predicted, labels=labels))

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("wb") as handle:
        pickle.dump({"model": classifier, "label_mapping": CLASS_TO_ID, "id_to_label": dict(enumerate(CLASS_NAMES)), "feature_count": FEATURE_COUNT, "preprocessing": "21 MediaPipe landmarks; interleaved translated x/y coordinates"}, handle)
    print(f"Saved new model: {args.output}")


if __name__ == "__main__":
    main()
