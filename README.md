# Silent Talk Flow

Build a premium, futuristic, production-quality React frontend for a project called:

SILENT TALK

Tagline:

"Communication without barriers."

Silent Talk is an AI-powered accessibility platform that recognizes American Sign Language (ASL) hand gestures through a camera and converts them into readable text and speech.

IMPORTANT:

This is a real hackathon prototype. The frontend must be designed so that it can later connect to an existing Python Flask backend that performs the actual ASL recognition.

DO NOT create fake AI recognition logic.

DO NOT invent a new ML model.

DO NOT replace the backend.

Create clean API integration points/placeholders for the existing backend.

==================================================

CORE PRODUCT FLOW

==================================================

The product workflow is:

CAMERA

   ↓

HAND DETECTION

   ↓

ASL CLASSIFICATION

   ↓

TEXT

   ↓

SPEECH

The frontend should visually communicate this pipeline.

The actual backend will eventually provide:

- live camera/video stream

- recognized ASL character

- recognized text

- reset functionality

The existing Flask API currently exposes:

GET /video_feed

GET /get_text

POST /reset_text

Keep these API endpoints configurable through an environment variable such as:

VITE_API_BASE_URL

Default development value:

http://127.0.0.1:5000

Do not hard-code the backend throughout the application.

==================================================

DESIGN DIRECTION

==================================================

Create a visually impressive futuristic accessibility/healthcare interface.

Style:

- premium

- futuristic

- minimal but visually rich

- dark mode as the primary experience

- glassmorphism

- subtle gradients

- soft glowing borders

- elegant animations

- rounded cards

- large readable typography

- excellent spacing

- professional healthcare feel

- NOT a generic hospital website

- NOT a generic AI dashboard

The interface should feel like a product that could be demonstrated on a large screen during a hackathon.

Use:

- React

- Tailwind CSS

- Framer Motion

- Lucide icons or another clean icon library

Use subtle motion rather than excessive animation.

Avoid:

- excessive neon

- clutter

- random gradients

- cartoonish elements

- excessive emojis

- stock images

- unnecessary charts

- fake statistics

The UI must remain accessible and readable.

==================================================

BRAND

==================================================

Product name:

SILENT TALK

Logo concept:

A minimal communication symbol combining:

- speech bubble

- hand/sign gesture

- subtle sound-wave element

Create the logo using CSS/SVG/iconography rather than requiring an external image.

Primary navigation:

SILENT TALK

Home

Patient Mode

Doctor Mode

How It Works

Accessibility

Top-right:

SYSTEM ONLINE indicator

==================================================

PAGE 1 — LANDING PAGE

==================================================

Create a beautiful landing page.

Hero section:

SILENT TALK

"Communication without barriers."

Supporting text:

"AI-powered sign language recognition that transforms hand gestures into readable text and speech."

Primary CTA:

"Start Communication"

Secondary CTA:

"See How It Works"

Hero visual:

Create an abstract animated hand/communication visualization using CSS/SVG/UI elements.

Show a floating recognition card:

LIVE RECOGNITION

Detected:

A

Confidence:

96%

Do NOT imply this is real recognition on the landing page.

Clearly treat it as a visual demonstration/mockup.

Below the hero show three feature cards:

REAL-TIME RECOGNITION

Recognize ASL gestures through a camera.

TEXT + SPEECH

Convert recognized signs into readable text and audio.

ACCESSIBILITY FIRST

Designed to reduce communication barriers.

==================================================

PAGE 2 — PATIENT MODE

==================================================

This is the MAIN application screen.

Make this the most polished page.

Layout:

LEFT:

Large live camera panel.

RIGHT:

AI recognition panel.

Camera panel:

Header:

LIVE CAMERA

Status:

● CAMERA ACTIVE

Large video area.

For now create a component called:

<CameraFeed />

It should support a backend video stream URL.

Use:

${API_BASE_URL}/video_feed

Make the implementation easy to replace/update later.

Do not implement fake hand recognition.

Overlay UI elements:

HAND DETECTION

STATUS: Waiting for backend

ASL CLASSIFICATION

STATUS: Waiting for backend

Show a subtle scanning/processing animation.

RIGHT PANEL:

LIVE RECOGNITION

Large detected character:

"A"

But make this dynamic from backend state.

Below:

Confidence

96%

Create a reusable:

<RecognitionCard />

Component.

It should accept:

recognizedCharacter

confidence

status

Do not hard-code these values into the final data flow.

==================================================

RECOGNITION PIPELINE

==================================================

Under the camera/recognition section create a beautiful horizontal pipeline:

CAPTURE

↓

DETECT

↓

CLASSIFY

↓

DISPLAY

↓

SPEAK

Each stage should have:

- icon

- label

- status

- subtle animation

Example:

● CAPTURE

Camera

● DETECT

MediaPipe

● CLASSIFY

ML Model

● DISPLAY

Text

● SPEAK

Audio

Initially show them as UI states that can later be controlled by backend state.

==================================================

RECOGNIZED MESSAGE

==================================================

Create a large card:

YOUR MESSAGE

"I NEED HELP"

This must eventually receive text from:

GET /get_text

Create a service layer such as:

src/services/api.js

with functions:

getRecognizedText()

resetText()

Do not put fetch/Axios calls directly into every component.

Buttons:

🔊 SPEAK

✏ EDIT

↻ CLEAR

SPEAK:

Use browser Web Speech API for text-to-speech.

CLEAR:

Call:

POST /reset_text

EDIT:

Allow the user to edit the generated message before speaking.

==================================================

HEALTHCARE QUICK ACTIONS

==================================================

Create a prominent section:

QUICK HEALTHCARE NEEDS

Buttons/cards:

PAIN

WATER

MEDICINE

FOOD

HELP

EMERGENCY

Each should have a clean icon.

Clicking a quick action should add/select the phrase in the message composer.

Example:

PAIN

→ "I AM EXPERIENCING PAIN"

WATER

→ "I NEED WATER"

MEDICINE

→ "I NEED MY MEDICINE"

HELP

→ "I NEED HELP"

EMERGENCY

→ "I NEED IMMEDIATE HELP"

Keep these as frontend quick communication options.

Do not claim these phrases are produced by the ML model.

==================================================

EMERGENCY MODE

==================================================

Create a highly visible emergency button.

Label:

EMERGENCY

When clicked, open a confirmation/modal interface:

EMERGENCY COMMUNICATION

"I NEED IMMEDIATE HELP"

Buttons:

SPEAK MESSAGE

CANCEL

Make this visually distinct but not alarmingly flashy.

This is a prototype UI.

Do NOT claim that it actually contacts hospital emergency services.

==================================================

MESSAGE HISTORY

==================================================

Create a communication history panel.

Title:

RECENT COMMUNICATION

Example UI:

10:42

"I HAVE PAIN"

10:44

"I NEED WATER"

10:47

"I NEED HELP"

Initially use local frontend state.

Structure it so it can later be replaced with backend/database data.

==================================================

DOCTOR MODE

==================================================

Create a separate Doctor Mode page.

Purpose:

Allow healthcare staff to see communication from the patient.

Design:

DOCTOR MODE

Patient Communication

Current Message:

"I HAVE PAIN"

Large SPEAK button.

Below:

Communication History

Use the same message data structure as Patient Mode.

Create a clear toggle/navigation between:

PATIENT MODE

DOCTOR MODE

Do not implement authentication unless necessary.

==================================================

HOW IT WORKS PAGE

==================================================

Create an impressive visual explanation.

Title:

HOW SILENT TALK WORKS

Show:

1. CAPTURE

Camera captures the user's hand gesture.

↓

2. DETECT

MediaPipe identifies hand landmarks.

↓

3. CLASSIFY

A trained machine-learning model recognizes the ASL alphabet.

↓

4. DISPLAY

The recognized character appears as text.

↓

5. SPEAK

Recognized text can be converted into audio.

Create animated cards for each step.

Include a technology section:

React

Python

MediaPipe

Scikit-Learn

OpenCV

Do not invent additional technologies.

==================================================

ACCESSIBILITY PAGE / PANEL

==================================================

Create accessibility controls:

Text size:

A-

A

A+

High contrast toggle

Reduced motion toggle

Speech toggle

Volume control

Dark mode / light mode

Large interaction buttons.

Store simple preferences in localStorage.

==================================================

NAVIGATION

==================================================

Navigation should be smooth.

Desktop:

Logo

Home

Patient Mode

Doctor Mode

How It Works

Accessibility

CTA:

Start Communication

Mobile:

Hamburger menu.

Use React Router if appropriate.

==================================================

RESPONSIVE DESIGN

==================================================

The application must work on:

Desktop

Laptop

Tablet

Mobile

The Patient Mode camera layout should automatically switch:

Desktop:

camera + recognition side-by-side

Mobile:

camera

↓

recognition

↓

message

↓

quick actions

==================================================

ANIMATIONS

==================================================

Use Framer Motion.

Animations should include:

- page transitions

- card entrance

- hover states

- recognition pulse

- pipeline progress

- modal transitions

- button feedback

- subtle camera scanning effect

Keep animations professional.

Respect the reduced-motion accessibility setting.

==================================================

COMPONENT ARCHITECTURE

==================================================

Organize the project cleanly.

Suggested structure:

src/

  components/

    Navbar

    CameraFeed

    RecognitionCard

    RecognitionPipeline

    MessageComposer

    HealthcareQuickActions

    EmergencyModal

    CommunicationHistory

    AccessibilityControls

    StatusIndicator

  pages/

    Home

    PatientMode

    DoctorMode

    HowItWorks

    Accessibility

  services/

    api.js

  hooks/

    useRecognition.js

  context/

    AccessibilityContext.jsx

  App.jsx

  main.jsx

Keep components reusable.

==================================================

BACKEND INTEGRATION PREPARATION

==================================================

Create:

src/services/api.js

Use:

const API_BASE_URL =

  import.meta.env.VITE_API_BASE_URL ||

  "http://127.0.0.1:5000";

Functions:

getVideoFeedUrl()

getRecognizedText()

resetRecognizedText()

Backend endpoints:

GET /video_feed

GET /get_text

POST /reset_text

The frontend should gracefully handle:

backend unavailable

camera unavailable

recognition unavailable

network errors

Display:

"Backend disconnected"

instead of crashing.

==================================================

IMPORTANT IMPLEMENTATION RULES

==================================================

1. Do NOT build a fake ML model.

2. Do NOT create fake backend endpoints.

3. Do NOT claim the frontend itself performs ASL recognition.

4. Keep backend integration isolated in services/api.js.

5. Use environment variables for backend URL.

6. Make the camera component easy to connect to the Flask video stream.

7. Keep the UI functional even when the backend is offline.

8. Use mock data ONLY for visual development and clearly structure it so it can be replaced by real API data.

9. Do not remove or rewrite the backend.

10. Do not add unnecessary authentication, payments, databases, or dashboards.

11. Focus on the Silent Talk core experience.

==================================================

FINAL EXPERIENCE

==================================================

When a user opens Silent Talk:

1. They see the premium landing page.

2. They click:

START COMMUNICATION

3. They enter:

PATIENT MODE

4. They see:

LIVE CAMERA

+

AI RECOGNITION

+

CONFIDENCE

+

PROCESSING PIPELINE

5. Recognized characters build the message.

6. The message appears in:

YOUR MESSAGE

7. User can:

EDIT

CLEAR

SPEAK

8. Healthcare quick actions are available.

9. Emergency mode is easily accessible.

10. Doctor Mode allows staff to see the communication.

The final result should feel like a real accessibility product rather than a simple student ML demo.

Prioritize:

POLISHED UI

REALISTIC USER FLOW

ACCESSIBILITY

CLEAR AI PIPELINE

HEALTHCARE USE CASE

REAL BACKEND INTEGRATION READINESS

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://vision-speak-link.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/037d484d-cabe-4f45-affc-50ac520d576c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
