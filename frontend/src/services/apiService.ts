export const API_BASE_URL =
  import.meta.env["VITE_API_BASE_URL"] || "http://127.0.0.1:5000";

export type PredictResponse = {
  text: string;
  letter: string;
  confidence: number | null;
  handDetected: boolean;
  sessionId: string;
};

function parsePredictPayload(
  payload: unknown,
  fallbackSessionId: string,
): PredictResponse {
  if (!payload || typeof payload !== "object") {
    return {
      text: "",
      letter: "",
      confidence: null,
      handDetected: false,
      sessionId: fallbackSessionId,
    };
  }

  const value = payload as Record<string, unknown>;

  return {
    text: typeof value["text"] === "string" ? value["text"] : "",
    letter: typeof value["letter"] === "string" ? value["letter"] : "",
    confidence:
      typeof value["confidence"] === "number"
        ? value["confidence"]
        : null,
    handDetected: value["hand_detected"] === true,
    sessionId:
      typeof value["session_id"] === "string" && value["session_id"]
        ? value["session_id"]
        : fallbackSessionId,
  };
}

/**
 * Send a camera frame to the Flask recognition backend.
 *
 * The backend expects:
 *   multipart/form-data
 *   frame       -> image file
 *   session_id  -> recognition session
 */
export async function predictFrame(
  imageDataUrl: string,
  sessionId: string,
  signal?: AbortSignal,
): Promise<PredictResponse> {
  // Convert the captured data URL into a Blob.
  const imageResponse = await fetch(imageDataUrl);

  if (!imageResponse.ok) {
    throw new Error(
      `Could not prepare camera frame: ${imageResponse.status}`,
    );
  }

  const imageBlob = await imageResponse.blob();

  // Flask /predict expects multipart/form-data.
  const formData = new FormData();

  formData.append("frame", imageBlob, "frame.jpg");
  formData.append("session_id", sessionId);

  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    body: formData,
    ...(signal ? { signal } : {}),
  });

  if (!response.ok) {
    let errorMessage = `Recognition service returned ${response.status}`;

    try {
      const errorPayload: unknown = await response.json();

      if (
        errorPayload &&
        typeof errorPayload === "object" &&
        "error" in errorPayload
      ) {
        const error = (errorPayload as Record<string, unknown>)["error"];

        if (typeof error === "string" && error) {
          errorMessage += `: ${error}`;
        }
      }
    } catch {
      // Backend may return a non-JSON error response.
    }

    throw new Error(errorMessage);
  }

  const payload: unknown = await response.json();

  return parsePredictPayload(payload, sessionId);
}

/**
 * Reset the recognized text for the current session.
 */
export async function resetRecognizedText(
  sessionId: string,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/reset_text`, {
    method: "POST",
    headers: {
      "X-Session-Id": sessionId,
    },
  });

  if (!response.ok) {
    let errorMessage = `Reset service returned ${response.status}`;

    try {
      const errorPayload: unknown = await response.json();

      if (
        errorPayload &&
        typeof errorPayload === "object" &&
        "error" in errorPayload
      ) {
        const error = (errorPayload as Record<string, unknown>)["error"];

        if (typeof error === "string" && error) {
          errorMessage += `: ${error}`;
        }
      }
    } catch {
      // Backend may return a non-JSON error response.
    }

    throw new Error(errorMessage);
  }
}