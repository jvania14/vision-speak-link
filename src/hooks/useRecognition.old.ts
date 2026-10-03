import { useEffect, useRef, useState } from "react";
import { predictFrame, resetRecognizedText } from "@/services/api";

export type CameraStatus = "requesting" | "available" | "unavailable";
export type BackendStatus = "connecting" | "connected" | "unreachable";

const CAPTURE_INTERVAL_MS = 300;

export function useRecognition() {
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("requesting");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("connecting");
  const [handDetected, setHandDetected] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const [recognizedCharacter, setRecognizedCharacter] = useState("");
  const [confidence, setConfidence] = useState<number | undefined>();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionIdRef = useRef<string>(crypto.randomUUID());
  const inFlightRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraStatus("unavailable");
        setCameraError("This browser does not support camera access.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCameraStatus("available");
        setCameraError(null);
      } catch (err) {
        if (cancelled) return;
        setCameraStatus("unavailable");
        setCameraError(err instanceof Error ? err.message : "Camera permission was denied.");
      }
    }

    void startCamera();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (cameraStatus !== "available") return;

    const controller = new AbortController();
    let cancelled = false;

    const captureAndPredict = async () => {
      if (inFlightRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

      const width = video.videoWidth;
      const height = video.videoHeight;
      if (!width || !height) return;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, width, height);
      const imageDataUrl = canvas.toDataURL("image/jpeg", 0.6);

      inFlightRef.current = true;
      try {
        const result = await predictFrame(imageDataUrl, sessionIdRef.current, controller.signal);
        if (cancelled) return;
        setBackendStatus("connected");
        setHandDetected(result.handDetected);
        setRecognizedText(result.text);
        setRecognizedCharacter(result.letter.startsWith("UNMAPPED") ? "" : result.letter);
        setConfidence(result.confidence ?? undefined);
      } catch {
        if (!cancelled) setBackendStatus("unreachable");
      } finally {
        inFlightRef.current = false;
      }
    };

    const timer = window.setInterval(captureAndPredict, CAPTURE_INTERVAL_MS);
    void captureAndPredict();
    return () => {
      cancelled = true;
      controller.abort();
      window.clearInterval(timer);
    };
  }, [cameraStatus]);

  const reset = async () => {
    try {
      await resetRecognizedText(sessionIdRef.current);
      setRecognizedText("");
      setRecognizedCharacter("");
      setConfidence(undefined);
      setBackendStatus("connected");
    } catch {
      setBackendStatus("unreachable");
      throw new Error("Backend disconnected");
    }
  };

  // The backend returns detection + prediction together in one response, so
  // "recognizing" is simply "a hand is in frame and the model is reading it."
  const recognizing = handDetected;

  return {
    videoRef,
    canvasRef,
    cameraStatus,
    cameraError,
    backendStatus,
    handDetected,
    recognizing,
    recognizedText,
    recognizedCharacter,
    confidence,
    reset,
  };
}
