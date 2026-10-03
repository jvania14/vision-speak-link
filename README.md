Silent Talk

AI-Powered ASL Communication Assistant for Healthcare

Silent Talk is a healthcare communication prototype designed to help
Deaf and speech-impaired patients communicate with doctors and
healthcare staff using American Sign Language (ASL) fingerspelling.

The system uses a device camera to detect hand gestures, recognizes
individual ASL fingerspelled letters, and converts them into text
through a real-time communication interface.

Current scope: Silent Talk recognizes individual fingerspelled
letters from single-hand poses. It is not a complete continuous ASL
translation system.

Problem

Communication between Deaf or speech-impaired patients and healthcare
professionals can become difficult when an interpreter is not
immediately available.

In a healthcare environment, patients may need to communicate symptoms,
requests, discomfort, or basic information quickly and clearly.

Silent Talk explores a technology-assisted way to support this
communication using a camera and AI-based hand gesture recognition.

Solution

Silent Talk combines:

Real-time browser camera input

AI-based hand landmark detection

Machine-learning based gesture classification

ASL fingerspelling recognition

Real-time text generation

Patient Mode

Doctor Mode

Accessibility-focused interface

ASL Neural Library

Futuristic healthcare AI interface

How It Works

                  SILENT TALK

              ┌─────────────────┐
              │ Browser Camera  │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────────┐
              │ MediaPipe Hand      │
              │ Landmarker          │
              │ Runs in Browser     │
              └──────────┬──────────┘
                         │
                    21 landmarks
                         │
                         ▼
              ┌─────────────────────┐
              │ Flask Backend       │
              │                     │
              │ Feature Extraction  │
              │ 21 → 42 features    │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │ Machine Learning    │
              │ Random Forest       │
              │ model.p             │
              └──────────┬──────────┘
                         │
                    Letter + Confidence
                         │
                         ▼
              ┌─────────────────────┐
              │ Silent Talk UI      │
              │ Letter → Text       │
              └─────────────────────┘

Recognition Pipeline

The browser requests camera access using getUserMedia().

MediaPipe Hand Landmarker detects the hand directly in the browser.

The system extracts 21 hand landmarks.

The 21 landmarks are converted into a 42-feature representation.

The 42 features are sent to the Flask /predict endpoint.

The trained model.p classifier predicts the corresponding letter.

Recognition stability logic prevents one held gesture from
repeatedly adding the same character.

The frontend displays the predicted letter, confidence, and
accumulated text.

Main Features

Patient Mode

Patient Mode provides the primary ASL communication interface.

The patient can use the camera to make fingerspelling gestures and see
the recognized letters in the interface.

Doctor Mode

Doctor Mode provides a healthcare-oriented interface for receiving and
understanding patient communication.

ASL Neural Library

The ASL Neural Library provides a visual reference for ASL
fingerspelling gestures supported by the prototype.

Accessibility

The project includes a dedicated accessibility-focused interface
intended to make the communication experience easier to use.

Futuristic AI Interface

The application uses a futuristic healthcare/AI visual design with:

Glassmorphism-style panels

Animated components

HUD-inspired elements

AI visualizations

Interactive cards

Holographic hand visuals

Real-time recognition feedback

Technology Stack

Frontend

React

TypeScript

TanStack Start

TanStack Router

Vite

Tailwind CSS

Framer Motion

MediaPipe Tasks Vision

Browser getUserMedia() API

Backend

Python

Flask

Flask-CORS

NumPy

scikit-learn

Machine Learning

Random Forest Classifier

MediaPipe Hand Landmarker

21 hand landmarks

42 normalized landmark features

ASL fingerspelling classification

Deployment

Frontend: Vercel

Backend: Render

Project Structure

silent-talk/
│
├── backend/
│   ├── app.py
│   ├── model.p
│   ├── requirements.txt
│   └── ...
│
├── src/
│   ├── components/
│   │   ├── ProductComponents.tsx
│   │   ├── ASLNeuralLibrary.tsx
│   │   └── ...
│   │
│   ├── hooks/
│   │   └── useRecognition.ts
│   │
│   ├── routes/
│   │   ├── patient.tsx
│   │   ├── doctor.tsx
│   │   ├── asl-library.tsx
│   │   ├── accessibility.tsx
│   │   └── how-it-works.tsx
│   │
│   └── services/
│       └── api.ts
│
├── public/
│   ├── asl/
│   └── videos/
│
├── package.json
└── README.md

Local Setup

Requirements

Python 3.9+

Node.js

npm

Modern browser

Webcam

1. Clone the repository

git clone <repository-url>
cd silent-talk

2. Install frontend dependencies

npm install

3. Setup the backend

Windows

cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

macOS / Linux

cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

4. Start the backend

python app.py

The backend uses the hosting platform's PORT environment variable when
available and defaults to port 10000 locally.

5. Start the frontend

Open another terminal in the project root:

npm run dev

Open the local application and allow camera access when prompted.

API

Health Check

GET /health

Example response:

{
  "status": "ok",
  "model_loaded": true,
  "model_type": "RandomForestClassifier",
  "n_features_in": 42,
  "recognition_mode": "browser-landmarks-to-model"
}

ASL Prediction

POST /predict
Content-Type: application/json

Example structure:

{
  "session_id": "example-session",
  "landmarks": [
    {"x": 0.20, "y": 0.20}
  ]
}

The real request contains all 21 landmarks.

The response contains information such as:

{
  "letter": "A",
  "confidence": 0.85,
  "hand_detected": true,
  "landmark_count": 21,
  "feature_count": 42,
  "predicted_class": "0",
  "session_id": "example-session",
  "text": ""
}

Environment Variables

Frontend

VITE_API_BASE_URL=http://127.0.0.1:10000

For production, set this to the deployed backend URL.

Backend

PORT=10000
FRONTEND_ORIGIN=*

For production, configure CORS for the actual frontend origin.

Testing

Backend health

curl.exe http://127.0.0.1:10000/health

Backend landmark prediction

The /predict endpoint expects 21 hand landmarks.

A successful request should return:

HTTP 200
hand_detected: true
landmark_count: 21
feature_count: 42
letter: <predicted letter>

Frontend production build

npm run build

Deployment

Backend

The backend can be deployed to Render or another Python hosting service.

Ensure that:

model.p is included

requirements.txt is installed

Flask uses the platform-provided PORT

CORS is configured for the frontend

The backend does not depend on a physical server webcam

Frontend

Set:

VITE_API_BASE_URL=<deployed-backend-url>

Then build and deploy the frontend.

Camera access requires HTTPS in production.

Troubleshooting

Camera does not start

Check:

Browser camera permission

HTTPS or localhost

Browser support for getUserMedia()

Whether another application is using the camera

Camera works but no letter appears

Check the browser Network tab for:

/predict

Verify that the request contains 21 landmarks.

Also check:

/health

and confirm that the model is loaded.

/predict returns 400

The current endpoint expects JSON landmarks rather than the old
multipart JPEG format.

Use:

{
  "session_id": "example",
  "landmarks": [
    {"x": 0.1, "y": 0.2}
  ]
}

with all 21 points.

Backend returns 502 after deployment

Check the hosting logs for:

Python startup errors

Missing model.p

Dependency installation errors

Incorrect port configuration

Application crashes

The current architecture performs hand landmark detection in the
browser, so the deployed backend does not need a server-side webcam.

Current Limitations

The current system recognizes individual fingerspelled letters
rather than continuous ASL sentences.

Recognition quality depends on the existing training data and
classifier.

Similar hand shapes may occasionally be classified incorrectly.

Lighting, camera quality, hand position, motion blur, and occlusion
can affect recognition.

Browser-side MediaPipe currently requires access to its required
runtime/model assets.

Future Development

Possible future improvements include:

Larger and more diverse ASL training dataset

Improved classification accuracy

Continuous sign-language recognition

Word and sentence-level recognition

Better robustness across lighting and camera conditions

More healthcare communication workflows

Stronger privacy and on-device processing

Multilingual communication support

License

This project is distributed under the MIT License.
