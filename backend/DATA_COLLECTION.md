# Silent Talk Dataset Collection

## Start

From `D:\vs\hackathon\silent-talk\backend` with the project virtual environment active:

```powershell
python collect_dataset.py
```

Use `--camera 1` if the webcam is on another OpenCV camera index.

The collector writes continuously to:

- `dataset.csv` for ordinary one-frame samples
- `temporal_sequences.csv` for J and Z movement sequences

Existing files are appended to. The collector does not generate synthetic samples.

## Class selection

- Press `A` through `Z` to select an alphabet class.
- Press `0` through `9` to select a number class.
- Press `[` to select `SPACE`.
- Press `]` to select `DELETE`.
- Press `C` to capture.

A capture is saved only if MediaPipe detects exactly one valid hand with 21 landmarks. Each static row contains exactly 42 features using the same preprocessing as `app.py`.

## Gesture definitions

Use one consistent hand and camera setup for the entire dataset:

- `A-Z`: hold the intended ASL fingerspelling pose. `J` and `Z` are different: press `C`, then perform the complete movement while the collector records 24 valid consecutive landmark frames.
- `0-9`: use the project team's chosen number gesture definitions consistently. The collector does not infer or invent number meanings; the person collecting must define the pose reference before recording.
- `SPACE`: use a clearly documented neutral/open-hand gesture that is not assigned to any letter or number. Hold it still and press `C` for one static sample.
- `DELETE`: use a clearly documented distinct gesture that is not assigned to any letter, number, or SPACE. Hold it still and press `C` for one static sample.

Do not collect SPACE or DELETE until the team has agreed on the exact poses and used the same poses for every sample.

## J and Z

A single 42-feature frame cannot represent movement. J and Z are therefore stored as 24-frame sequences in `temporal_sequences.csv`, with columns:

```text
sequence_id,label,frame_index,feature_0,...,feature_41
```

The current `train_model.py` intentionally refuses to train a single-frame 38-class model when J/Z exist only as temporal data. A separate sequence classifier must be implemented before claiming reliable J/Z recognition.

## Collection target and stopping

Collect approximately 500 valid samples or sequences per class initially:

```text
38 classes x 500 = 19,000 labeled samples/sequences
```

For J/Z, one sequence is one labeled example and contains 24 valid frames. Move naturally during the sequence; missing-hand frames are not written and do not advance the sequence.

Press `Q` or `Esc` to stop. Every saved row is flushed immediately, so previous progress remains on disk.
