import { useEffect, useRef, useState } from "react";
import { getRecognizedText, resetRecognizedText } from "@/services/api";

export type ConnectionStatus = "connecting" | "online" | "offline";

export function useRecognition() {
  const [recognizedText, setRecognizedText] = useState("");
  const [recognizedCharacter, setRecognizedCharacter] = useState("");
  const [confidence, setConfidence] = useState<number | undefined>();
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const active = useRef(true);

  useEffect(() => {
    active.current = true;
    const controller = new AbortController();
    const refresh = async () => {
      try {
        const result = await getRecognizedText(controller.signal);
        if (!active.current) return;
        setRecognizedText(result.text);
        setRecognizedCharacter(result.character ?? result.text.trim().slice(-1));
        setConfidence(result.confidence);
        setStatus("online");
      } catch {
        if (active.current) setStatus("offline");
      }
    };
    void refresh();
    const timer = window.setInterval(refresh, 1200);
    return () => {
      active.current = false;
      controller.abort();
      window.clearInterval(timer);
    };
  }, []);

  const reset = async () => {
    try {
      await resetRecognizedText();
      setRecognizedText("");
      setRecognizedCharacter("");
      setConfidence(undefined);
      setStatus("online");
    } catch {
      setStatus("offline");
      throw new Error("Backend disconnected");
    }
  };

  return { recognizedText, recognizedCharacter, confidence, status, reset };
}