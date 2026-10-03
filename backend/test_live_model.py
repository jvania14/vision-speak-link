import cv2
import pickle
import numpy as np
import mediapipe as mp

with open("model.p", "rb") as f:
    bundle = pickle.load(f)

model = bundle["model"]

print("MODEL LOADED")
print("Features:", model.n_features_in_)
print("Classes:", model.classes_)

mp_hands = mp.solutions.hands
mp_draw = mp.solutions.drawing_utils

cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("ERROR: Camera could not be opened")
    raise SystemExit

with mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    min_detection_confidence=0.3,
    min_tracking_confidence=0.3,
) as hands:

    print("\nShow ASL A.")
    print("Hold it steadily.")
    print("Press Q to quit.\n")

    while True:
        ok, frame = cap.read()

        if not ok:
            break

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands.process(rgb)

        if results.multi_hand_landmarks:

            hand = results.multi_hand_landmarks[0]

            x_values = [lm.x for lm in hand.landmark]
            y_values = [lm.y for lm in hand.landmark]

            min_x = min(x_values)
            min_y = min(y_values)

            features = []

            for lm in hand.landmark:
                features.append(lm.x - min_x)
                features.append(lm.y - min_y)

            X = np.asarray(features, dtype=float).reshape(1, -1)

            prediction = model.predict(X)[0]

            print(
                "HAND=21",
                "FEATURES=42",
                "PREDICTED_CLASS=",
                prediction,
            )

            if hasattr(model, "predict_proba"):
                probabilities = model.predict_proba(X)[0]
                best_index = int(np.argmax(probabilities))
                confidence = float(probabilities[best_index])
                print("CONFIDENCE=", confidence)

            mp_draw.draw_landmarks(
                frame,
                hand,
                mp_hands.HAND_CONNECTIONS
            )

            cv2.putText(
                frame,
                f"MODEL CLASS: {prediction}",
                (30, 50),
                cv2.FONT_HERSHEY_SIMPLEX,
                1.0,
                (0, 255, 255),
                2,
            )

        else:

            cv2.putText(
                frame,
                "NO HAND",
                (30, 50),
                cv2.FONT_HERSHEY_SIMPLEX,
                1.0,
                (0, 0, 255),
                2,
            )

        cv2.imshow("Silent Talk - Live Model Test", frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

cap.release()
cv2.destroyAllWindows()