export const API_BASE_URL =
  import.meta.env["VITE_API_BASE_URL"] || "http://127.0.0.1:5000";

export type PredictResponse = {
  text: string;
  letter: string;
  confidence: number | null;
  handDetected: boolean;
  sessionId: string;
};

function parsePredictPayload(payload: unknown, fallbackSessionId: string): PredictResponse {
  if (!payload || typeof payload !== "object") {
    return { text: "", letter: "", confidence: null, handDetected: false, sessionId: fallbackSessionId };
  }
  const value = payload as Record<string, unknown>;
  return {
    text: typeof value["text"] === "string" ? value["text"] : "",
    letter: typeof value["letter"] === "string" ? value["letter"] : "",
    confidence: typeof value["confidence"] === "number" ? value["confidence"] : null,
    handDetected: value["hand_detected"] === true,
    sessionId: typeof value["session_id"] === "string" && value["session_id"] ? value["session_id"] : fallbackSessionId,
  };
}

// Captured frames are sent here for real MediaPipe hand detection + model.p prediction.
// See backend/app.py:243 (/predict) for the full pipeline.
export async function predictFrame(
  imageDataUrl: string,
  sessionId: string,
  signal?: AbortSignal,
): Promise<PredictResponse> {
  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: imageDataUrl, session_id: sessionId }),
    ...(signal ? { signal } : {}),
  });
  if (!response.ok) throw new Error(`Recognition service returned ${response.status}`);
  const payload: unknown = await response.json();
  return parsePredictPayload(payload, sessionId);
}

export async function resetRecognizedText(sessionId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/reset_text`, {
    method: "POST",
    headers: { "X-Session-Id": sessionId },
  });
  if (!response.ok) throw new Error(`Reset service returned ${response.status}`);
}
