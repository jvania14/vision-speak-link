<a name="readme-top"></a>

<div align="center">
  <h3 align="center">Silent Talk</h3>

  <p align="center">
    AI-powered ASL fingerspelling recognition for healthcare communication
  </p>

  <p align="center">
    <a href="https://youtu.be/MuX_m5dPpj4?si=ENCBESx-YJvemE78">
      <img src="https://img.shields.io/badge/▶_Watch_Demo_Video-FF0000?style=for-the-badge&logo=youtube&logoColor=white" alt="Watch Demo Video" />
    </a>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/Award-Samsung_Solve_for_Tomorrow_Top_30-blue?style=for-the-badge&logo=samsung&logoColor=white" alt="Samsung Award" />
    <br />
    <a href="LICENSE">
      <img src="https://img.shields.io/github/license/jvania14/vision-speak-link?style=for-the-badge" alt="License" />
    </a>
  </p>
</div>

## Table of Contents

- [About The Project](#about-the-project)
- [Which app is this?](#which-app-is-this)
- [Architecture](#architecture)
- [ASL Recognition Pipeline](#asl-recognition-pipeline)
- [Tech Stack](#tech-stack)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Known Limitations](#known-limitations)
- [License](#license)

## About The Project

**Silent Talk** helps Deaf and speech-impaired patients communicate with healthcare
providers by recognizing ASL fingerspelling from a live browser webcam feed and turning
it into text (and speech) in real time. It recognizes individual fingerspelled letters
from single hand poses; it does not translate continuous/fluent sign language.

This project was originally built as a **Top 30 Semifinalist** (out of 300+ teams) entry
in the **Samsung Solve for Tomorrow 2024** competition, and has since been rebuilt into a
Patient Mode / Doctor Mode / Accessibility healthcare communication workspace.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Which app is this?

This repository contains **three** frontend efforts from its history. Only one is live:

| Path | Status | What it is |
|---|---|---|
| `src/` (this repo's root) | ✅ **Canonical, actively developed** | TanStack Start app — Home, Patient Mode, Doctor Mode, How It Works, Accessibility. This is the app the deployment configuration below targets. |
| `frontend/` | ⚠️ Legacy, unused | An earlier, unrelated Vite/React "smart home" hackathon prototype (NextUI + react-router). Not imported by anything live, not part of any deploy. Kept for reference only — **do not point a deployment at this directory.** |
| `backend/vision-speak-link/` | ❌ Removed | Was a broken/dangling git submodule reference with no `.gitmodules` entry (pointed at an empty, unresolvable commit). Untracked as part of repo cleanup. |

The Flask backend (`backend/`) is shared by all of the above, but only `src/` actually
talks to it correctly (see below).

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Architecture

```
Browser (src/ — TanStack Start)          Flask backend (backend/app.py)
┌─────────────────────────────┐          ┌───────────────────────────────┐
│ useRecognition hook          │  frame   │ POST /predict                 │
│  - getUserMedia(video)       │ ───────► │  - decode image (cv2)         │
│  - <canvas> grabs a frame    │  every   │  - MediaPipe Hands (21 pts)   │
│    every ~300ms, JPEG/base64 │  ~300ms  │  - 42-feature vector          │
│  - session_id (per tab)      │          │  - model.p (RandomForest)     │
│                               │ ◄─────── │  - per-session stable-letter  │
│  - hand_detected / letter /   │  JSON    │    buffering + cooldown       │
│    confidence / text          │          └───────────────────────────────┘
└─────────────────────────────┘
```

Each browser tab generates its own `session_id` (`crypto.randomUUID()`), so multiple
patients/devices can use the same backend deployment concurrently without mixing up
recognized text.

The backend also exposes legacy endpoints (`/video_feed`, `/get_text`, `/reset_text`)
that stream from a **physical camera attached to the server itself**. These only work for
local development on a machine with a webcam plugged into it, and intentionally return
`503` in any real deployment (no server has a webcam) — real recognition always goes
through the browser-webcam-based `/predict` flow described above.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## ASL Recognition Pipeline

1. **Capture** — `useRecognition` (`src/hooks/useRecognition.ts`) requests
   `getUserMedia`, binds the stream to a `<video>` element, and grabs a frame onto a
   hidden `<canvas>` every ~300ms as a JPEG data URL.
2. **Predict** — the frame + `session_id` are POSTed to `/predict`
   (`src/services/api.ts` → `backend/app.py`).
3. **Detect** — the backend decodes the image, converts BGR→RGB, and runs
   MediaPipe Hands (`static_image_mode=True, max_num_hands=1,
   min_detection_confidence=0.3`) to get 21 hand landmarks.
4. **Classify** — landmarks are turned into the same 42-value feature vector used at
   training time (`extract_42_features` in `app.py`, matching `train_model.py`), which is
   fed into the existing `model.p` (`RandomForestClassifier`) to get a letter + confidence.
5. **Stabilize** — a letter is only appended to the session's text buffer once it has
   repeated for `RECOGNITION_STABLE_FRAMES` consecutive frames above
   `RECOGNITION_CONFIDENCE_THRESHOLD`, with a `RECOGNITION_LETTER_COOLDOWN_SECONDS` cooldown
   before the same letter can commit twice in a row (prevents one held pose from spamming
   the same letter).
6. **Display / speak** — the frontend renders `hand_detected`, the live predicted letter +
   confidence, and the accumulated text, and can speak the composed message aloud.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Tech Stack

**Frontend** (`src/`): React 19, TanStack Start/Router, Vite, Tailwind CSS 4, deployed via
the Nitro `cloudflare-module` preset (Cloudflare Workers/Pages).

**Backend** (`backend/`): Flask 3, Flask-CORS, MediaPipe, OpenCV, scikit-learn
(RandomForestClassifier), gunicorn, optional OpenAI (`gpt-4o-mini`) for word-spacing
cleanup of fingerspelled sequences.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Environment Variables

**Frontend** — copy `.env.example` to `.env`:

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `http://127.0.0.1:5000` | Base URL of the Flask backend. |

**Backend** — copy `backend/.env.example` to `backend/.env`:

| Variable | Default | Purpose |
|---|---|---|
| `FRONTEND_ORIGIN` | `*` (see `backend/.env.example`) | Comma-separated allowed CORS origin(s). Use a real origin in production. |
| `OPENAI_API_KEY` | unset | Optional. Recognition works without it; only word-spacing cleanup is skipped. |
| `MAX_FRAME_BYTES` | `3145728` (3MB) | Max accepted request body size. |
| `RECOGNITION_CONFIDENCE_THRESHOLD` | `0.30` | Minimum model confidence to accept a predicted letter. |
| `RECOGNITION_STABLE_FRAMES` | `3` | Consecutive matching frames required before committing a letter. |
| `RECOGNITION_LETTER_COOLDOWN_SECONDS` | `0.8` | Cooldown before the same letter can commit again. |
| `DEBUG_RECOGNITION` | `0` | Set to `1` to log per-frame detection/prediction to the server console. |

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Local Development

### Prerequisites

* Python 3.9+
* Node.js & npm (or bun)

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate       # venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env           # edit as needed
python3 app.py                 # serves on http://127.0.0.1:5000
```

### Frontend

```bash
cp .env.example .env           # edit VITE_API_BASE_URL if the backend runs elsewhere
npm install
npm run dev                    # serves on http://127.0.0.1:8080
```

Open `http://127.0.0.1:8080/patient` and grant camera permission when prompted.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Testing

Backend (from `backend/`, with the venv above active):

```bash
python3 test_all_letters.py      # exercises /predict-debug against sample frames
python3 debug_recognition.py     # verbose single-frame debug helper
curl http://127.0.0.1:5000/health
```

Frontend:

```bash
npx tsc --noEmit   # typecheck
npm run build      # production build
```

Browser-dependent behavior (camera permission prompts, live webcam frame quality, and
end-to-end recognition accuracy against a real hand) requires manual verification in an
actual browser with a webcam — it cannot be exercised in a headless/CI environment.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Deployment

Camera access via `getUserMedia` requires a **secure context** — HTTPS in production, or
`localhost` for local development. A plain-HTTP production deploy will silently fail to
request the camera.

**Frontend** (`src/`): builds via `@lovable.dev/vite-tanstack-config`'s Nitro
`cloudflare-module` preset (`npm run build` → `.output/`), i.e. it's set up to deploy as a
Cloudflare Worker/Pages site by default. Set `VITE_API_BASE_URL` to your deployed backend's
URL at build time.

**Backend** (`backend/`): ships with both a `Procfile` (`gunicorn -b :$PORT app:app`, e.g.
for Heroku-style platforms) and an `app.yaml` (Google App Engine, `runtime: python39`).
Before deploying:
- Set `FRONTEND_ORIGIN` in your hosting environment to your real deployed frontend origin
  (do not leave it as `*` in production).
- Set `OPENAI_API_KEY` if you want fingerspelling word-spacing cleanup.
- `model.p` ships in the repo and is loaded at startup — no extra model download step
  needed.

`frontend/` has its own `vercel.json`; it is **not** part of the deployed app and should
not be targeted by any deployment.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Troubleshooting

* **"Camera unavailable" / permission prompt never appears** — check you're on
  `localhost` or HTTPS; browsers block `getUserMedia` on plain HTTP origins other than
  localhost.
* **Camera works but stuck on "Searching for hand"** — check `VITE_API_BASE_URL` actually
  points at a reachable backend, and check the backend logs (`DEBUG_RECOGNITION=1`) to
  confirm frames are arriving and MediaPipe is running.
* **CORS errors in the browser console** — set `FRONTEND_ORIGIN` on the backend to match
  the frontend's actual origin exactly (scheme + host + port).
* **`pip install -r requirements.txt` fails to find a mediapipe wheel** — you're likely on
  an unsupported Python/platform combination for the pinned `mediapipe` version; check
  [PyPI's mediapipe file list](https://pypi.org/project/mediapipe/#files) for wheels
  matching your platform.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Known Limitations

* **Model accuracy is imperfect.** Direct verification against the repo's own sample
  images (`backend/A.jpg`–`D.jpg`) showed correct predictions for 2 of 4 letters, with
  confidence scores in the 0.43–0.56 range across all four. Hand detection itself works
  correctly on all four; the classifier (`model.p`, a `RandomForestClassifier`) sometimes
  confuses visually similar hand shapes. Improving this requires more/better training data
  (`backend/collect_dataset.py`, `backend/train_model.py`), not a pipeline fix.
* **No continuous/fluent sign language support** — only discrete fingerspelled letters.
* **Legacy server-camera endpoints** (`/video_feed`, `/get_text`, `/reset_text` without a
  session) only work when a webcam is physically attached to the machine running Flask;
  they are not used by the live frontend and exist only as a local fallback.
* **`frontend/` is unmaintained legacy code** from an earlier, unrelated prototype — see
  [Which app is this?](#which-app-is-this).

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>
