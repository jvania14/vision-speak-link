export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

export type RecognitionResponse = {
  text: string;
  character?: string;
  confidence?: number;
};

export function getVideoFeedUrl() {
  return `${API_BASE_URL}/video_feed`;
}

export async function getRecognizedText(signal?: AbortSignal): Promise<RecognitionResponse> {
  const response = await fetch(`${API_BASE_URL}/get_text`, { signal });
  if (!response.ok) throw new Error(`Recognition service returned ${response.status}`);
  const payload: unknown = await response.json();
  if (typeof payload === "string") return { text: payload };
  if (payload && typeof payload === "object") {
    const value = payload as Record<string, unknown>;
    return {
      text: typeof value.text === "string" ? value.text : "",
      character:
        typeof value.character === "string"
          ? value.character
          : typeof value.detected_character === "string"
            ? value.detected_character
            : undefined,
      confidence: typeof value.confidence === "number" ? value.confidence : undefined,
    };
  }
  return { text: "" };
}

export async function resetRecognizedText(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/reset_text`, { method: "POST" });
  if (!response.ok) throw new Error(`Reset service returned ${response.status}`);
}