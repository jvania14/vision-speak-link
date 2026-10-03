# Vision Speak recognition update

The live patient camera now uses the working Silent Talk approach directly in the browser:

`Webcam -> MediaPipe Hand Landmarker -> 21 landmarks -> normalized ASL rule classifier -> stability filter -> letter/text`

The recognized letter is shown in a large panel at the **bottom of the live camera viewport**.

## Why this was changed

The legacy `backend/model.p` was not a reliable runtime dependency. The bundled dataset has only four static samples and all four are labeled `A`, and the pickle was created with an older scikit-learn tree format. Loading that pickle can fail on newer scikit-learn versions.

The frontend therefore does not send every video frame to Flask for recognition anymore. MediaPipe and the ASL classifier run locally in the browser, which also reduces latency.

## Accuracy behavior

- 8 consistent frames are required before a letter is committed.
- A 900 ms hold-off prevents the same held gesture from being appended repeatedly.
- One hand is tracked at a time.
- J and Z are not reliable static-shape letters and require motion-aware temporal recognition.
- The current classifier is the working static-letter classifier from the Silent Talk prototype; it is a rules-based prototype, not a medically validated ASL model.

## Runtime

No Python model file is required for the browser recognition path. MediaPipe's browser assets are loaded from the official Google model storage and jsDelivr when the camera is started.
