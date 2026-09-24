import { useEffect, useRef, useState, useCallback } from "react";
import { sendCameraFrame, resetRecognizedText, type LandmarkPoint } from "@/services/api";

export type ConnectionStatus = "connecting" | "online" | "offline" | "stopped";

export type CameraState =
  "idle" | "initializing" | "active" | "permission_denied" | "unavailable" | "stopped";

export function useRecognition(enabled = true) {
  const [recognizedText, setRecognizedText] = useState("");
  const [recognizedCharacter, setRecognizedCharacter] = useState("");
  const [confidence, setConfidence] = useState<number | undefined>();
  const [handDetected, setHandDetected] = useState(false);
  const [landmarks, setLandmarks] = useState<LandmarkPoint[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isProcessingRef = useRef(false);
  const activeRef = useRef(true);

  // Stop camera tracks cleanly
  const stopTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    stopTracks();
    setCameraState("stopped");
    setStatus("stopped");
  }, [stopTracks]);

  // Request browser camera stream
  const startCamera = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraState("unavailable");
      setCameraError("Camera capture is not supported on this browser or device.");
      return;
    }

    setCameraState("initializing");
    setCameraError(null);

    try {
      stopTracks();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      if (!activeRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch {
          // Auto-play was intercepted or already playing
        }
      }

      setCameraState("active");
      setStatus("online");
    } catch (err: unknown) {
      if (!activeRef.current) return;

      const error = err as { name?: string; message?: string };
      console.error("Camera acquisition error:", err);

      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setCameraState("permission_denied");
        setCameraError(
          "Camera access was denied. Please allow camera access in your browser address bar.",
        );
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        setCameraState("unavailable");
        setCameraError("No webcam was found on your computer or device.");
      } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
        setCameraState("unavailable");
        setCameraError("Webcam is already in use by another application.");
      } else {
        setCameraState("unavailable");
        setCameraError(error.message || "Failed to start camera.");
      }
      setStatus("offline");
    }
  }, [stopTracks]);

  // Handle enabled toggle
  useEffect(() => {
    activeRef.current = true;

    if (!enabled) {
      stopCamera();
      return;
    }

    void startCamera();

    return () => {
      activeRef.current = false;
      stopTracks();
    };
  }, [enabled, startCamera, stopCamera, stopTracks]);

  // Periodic frame capture loop (~6.6 FPS / 150ms interval)
  useEffect(() => {
    if (!enabled || cameraState !== "active") {
      return;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const controller = new AbortController();

    const captureAndPredict = async () => {
      const video = videoRef.current;
      if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        return;
      }

      if (video.videoWidth === 0 || video.videoHeight === 0) {
        return;
      }

      // Guard: skip tick if previous request is still in flight
      if (isProcessingRef.current) {
        return;
      }

      isProcessingRef.current = true;

      try {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, "image/jpeg", 0.92);
        });

        if (!blob || !activeRef.current) {
          isProcessingRef.current = false;
          return;
        }

        const result = await sendCameraFrame(blob, controller.signal);

        if (!activeRef.current) {
          isProcessingRef.current = false;
          return;
        }

        setRecognizedText(result.text);
        setRecognizedCharacter(result.letter ?? "");
        setConfidence(result.confidence);
        setHandDetected(result.hand_detected);
        setLandmarks(result.landmarks ?? []);
        setStatus("online");
        if (result.hand_detected) {
          console.debug("[Silent Talk recognition]", {
            hand_detected: result.hand_detected,
            landmark_count: result.landmarks?.length ?? 0,
            feature_count: result.feature_count,
            predicted_class: result.predicted_class,
            letter: result.letter,
            confidence: result.confidence,
          });
        }
      } catch (err: unknown) {
        if (!activeRef.current) return;
        if ((err as { name?: string }).name !== "AbortError") {
          setStatus("offline");
        }
      } finally {
        isProcessingRef.current = false;
      }
    };

    const intervalId = window.setInterval(captureAndPredict, 150);

    return () => {
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, [cameraState, enabled]);

  // Buffer reset
  const reset = async () => {
    try {
      await resetRecognizedText();
      setRecognizedText("");
      setRecognizedCharacter("");
      setConfidence(undefined);
      setHandDetected(false);
      setLandmarks([]);
      setStatus("online");
    } catch {
      setStatus("offline");
      throw new Error("Backend disconnected");
    }
  };

  return {
    recognizedText,
    recognizedCharacter,
    confidence,
    handDetected,
    landmarks,
    status,
    cameraState,
    cameraError,
    videoRef,
    startCamera,
    stopCamera,
    reset,
  };
}
