export const API_BASE_URL = import.meta.env["VITE_API_BASE_URL"] || "http://127.0.0.1:5000";
const PREDICT_TIMEOUT_MS = 8000;

function withTimeout(signal?: AbortSignal, timeoutMs = PREDICT_TIMEOUT_MS): AbortSignal {
  const timeout = AbortSignal.timeout(timeoutMs);
  if (!signal) {
    return timeout;
  }
  if (typeof AbortSignal.any === "function") {
    return AbortSignal.any([signal, timeout]);
  }
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal.aborted || timeout.aborted) {
    abort();
    return controller.signal;
  }
  signal.addEventListener("abort", abort, { once: true });
  timeout.addEventListener("abort", abort, { once: true });
  return controller.signal;
}

export type LandmarkPoint = {
  x: number;
  y: number;
};

export type RecognitionResponse = {
  text: string;
  letter?: string;
  confidence?: number;
  hand_detected: boolean;
  landmarks?: LandmarkPoint[];
  session_id?: string;
  predicted_class?: string | null;
  landmark_count?: number;
  feature_count?: number;
};

const SESSION_STORAGE_KEY = "silent-talk-session-id";

export function getSessionId(): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  return window.localStorage.getItem(SESSION_STORAGE_KEY) || undefined;
}

export function saveSessionId(sessionId?: string) {
  if (typeof window !== "undefined" && sessionId) {
    window.localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }
}

/**
 * Send one browser camera frame blob to Flask /predict.
 * Multi-user safe: includes session_id.
 */
export async function sendCameraFrame(
  blob: Blob,
  signal?: AbortSignal,
): Promise<RecognitionResponse> {
  const sessionId = getSessionId();
  const formData = new FormData();
  formData.append("frame", blob, "camera.jpg");

  if (sessionId) {
    formData.append("session_id", sessionId);
  }

  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    body: formData,
    signal: withTimeout(signal),
  });

  if (!response.ok) {
    throw new Error(`Prediction service returned ${response.status}`);
  }

  const payload = (await response.json()) as RecognitionResponse;
  saveSessionId(payload.session_id);

  return {
    text: typeof payload.text === "string" ? payload.text : "",
    letter: typeof payload.letter === "string" ? payload.letter : undefined,
    confidence: typeof payload.confidence === "number" ? payload.confidence : undefined,
    hand_detected: payload.hand_detected === true,
    landmarks: Array.isArray(payload.landmarks) ? payload.landmarks : [],
    session_id: payload.session_id,
    predicted_class: payload.predicted_class,
    landmark_count: typeof payload.landmark_count === "number" ? payload.landmark_count : undefined,
    feature_count: typeof payload.feature_count === "number" ? payload.feature_count : undefined,
  };
}

/**
 * Get current recognized text for this session.
 */
export async function getRecognizedText(signal?: AbortSignal): Promise<RecognitionResponse> {
  const sessionId = getSessionId();
  const url = new URL(`${API_BASE_URL}/get_text`);

  if (sessionId) {
    url.searchParams.set("session_id", sessionId);
  }

  const response = await fetch(url.toString(), signal ? { signal } : {});

  if (!response.ok) {
    throw new Error(`Recognition service returned ${response.status}`);
  }

  const payload = (await response.json()) as RecognitionResponse;
  saveSessionId(payload.session_id);

  return {
    text: typeof payload.text === "string" ? payload.text : "",
    letter: typeof payload.letter === "string" ? payload.letter : undefined,
    confidence: typeof payload.confidence === "number" ? payload.confidence : undefined,
    hand_detected: payload.hand_detected === true,
    landmarks: Array.isArray(payload.landmarks) ? payload.landmarks : [],
    session_id: payload.session_id,
  };
}

/**
 * Reset recognized text buffer for this session.
 */
export async function resetRecognizedText(): Promise<void> {
  const sessionId = getSessionId();

  const response = await fetch(`${API_BASE_URL}/reset_text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session_id: sessionId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Reset service returned ${response.status}`);
  }
}

export function getVideoFeedUrl(): string {
  return `${API_BASE_URL}/video_feed`;
}
