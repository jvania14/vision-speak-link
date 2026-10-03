import { useCallback, useEffect, useRef, useState } from "react";
import { resetRecognizedText, type LandmarkPoint } from "@/services/api";
import { classify, type Landmark, type Prediction } from "@/lib/asl-classifier";

export type ConnectionStatus = "connecting" | "online" | "offline" | "stopped";
export type CameraState =
  | "idle"
  | "initializing"
  | "active"
  | "permission_denied"
  | "unavailable"
  | "stopped";

const STABLE_FRAMES = 8;
const HOLD_AFTER_COMMIT_MS = 900;

type HandLandmarkerInstance = {
  detectForVideo: (video: HTMLVideoElement, timestamp: number) => {
    landmarks?: Landmark[][];
  };
  close?: () => void;
};

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
  const handLandmarkerRef = useRef<HandLandmarkerInstance | null>(null);
  const animationRef = useRef<number>(0);
  const activeRef = useRef(true);
  const lastVideoTimeRef = useRef(-1);
  const stableRef = useRef<{ letter: string; count: number }>({ letter: "", count: 0 });
  const cooldownRef = useRef(0);

  const stopTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animationRef.current);
    stopTracks();
    handLandmarkerRef.current?.close?.();
    handLandmarkerRef.current = null;
    setCameraState("stopped");
    setStatus("stopped");
    setHandDetected(false);
    setLandmarks([]);
    setRecognizedCharacter("");
    setConfidence(undefined);
    stableRef.current = { letter: "", count: 0 };
  }, [stopTracks]);

  const loadHandLandmarker = useCallback(async () => {
    // Load MediaPipe directly in the browser so recognition is not dependent on
    // the old/incompatible backend model.p artifact.
    const vision = await import(
      /* @vite-ignore */
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm"
    );
    const { HandLandmarker, FilesetResolver } = vision as any;
    const fileset = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm",
    );
    return (await HandLandmarker.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numHands: 1,
      minHandDetectionConfidence: 0.45,
      minHandPresenceConfidence: 0.45,
      minTrackingConfidence: 0.45,
    })) as unknown as HandLandmarkerInstance;
  }, []);

  const startCamera = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraState("unavailable");
      setCameraError("Camera capture is not supported on this browser or device.");
      return;
    }

    setCameraState("initializing");
    setCameraError(null);
    cancelAnimationFrame(animationRef.current);
    stopTracks();

    try {
      setStatus("connecting");
      handLandmarkerRef.current?.close?.();
      handLandmarkerRef.current = await loadHandLandmarker();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: false,
      });

      if (!activeRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      lastVideoTimeRef.current = -1;
      stableRef.current = { letter: "", count: 0 };
      cooldownRef.current = 0;
      setCameraState("active");
      setStatus("online");

      const onFrame = () => {
        if (!activeRef.current) return;
        const video = videoRef.current;
        const detector = handLandmarkerRef.current;
        if (!video || !detector || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
          animationRef.current = requestAnimationFrame(onFrame);
          return;
        }

        const now = performance.now();
        if (video.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = video.currentTime;
          try {
            const result = detector.detectForVideo(video, now);
            const hands = result.landmarks ?? [];

            if (hands.length > 0) {
              const lm = hands[0];
              setHandDetected(true);
              setLandmarks(lm.map((point) => ({ x: point.x, y: point.y })));

              const prediction: Prediction = classify(lm);
              setRecognizedCharacter(prediction?.letter ?? "");
              setConfidence(prediction?.confidence);

              if (prediction) {
                const stable = stableRef.current;
                if (stable.letter === prediction.letter) stable.count += 1;
                else stableRef.current = { letter: prediction.letter, count: 1 };

                if (
                  stableRef.current.count >= STABLE_FRAMES &&
                  now - cooldownRef.current > HOLD_AFTER_COMMIT_MS
                ) {
                  setRecognizedText((text) => text + prediction.letter);
                  cooldownRef.current = now;
                  stableRef.current = { letter: "", count: 0 };
                }
              }
            } else {
              setHandDetected(false);
              setRecognizedCharacter("");
              setConfidence(undefined);
              setLandmarks([]);
              stableRef.current = { letter: "", count: 0 };
            }
          } catch (error) {
            console.debug("[Silent Talk] MediaPipe frame skipped", error);
          }
        }
        animationRef.current = requestAnimationFrame(onFrame);
      };

      animationRef.current = requestAnimationFrame(onFrame);
    } catch (err: unknown) {
      if (!activeRef.current) return;
      const error = err as { name?: string; message?: string };
      console.error("Camera / MediaPipe initialization error:", err);
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setCameraState("permission_denied");
        setCameraError("Camera access was denied. Please allow camera access in your browser address bar.");
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        setCameraState("unavailable");
        setCameraError("No webcam was found on your computer or device.");
      } else {
        setCameraState("unavailable");
        setCameraError(error.message || "Failed to start the camera or MediaPipe hand model.");
      }
      setStatus("offline");
    }
  }, [loadHandLandmarker, stopTracks]);

  useEffect(() => {
    activeRef.current = true;
    if (!enabled) {
      stopCamera();
      return;
    }
    void startCamera();
    return () => {
      activeRef.current = false;
      cancelAnimationFrame(animationRef.current);
      stopTracks();
      handLandmarkerRef.current?.close?.();
      handLandmarkerRef.current = null;
    };
  }, [enabled, startCamera, stopCamera, stopTracks]);

  const reset = async () => {
    setRecognizedText("");
    setRecognizedCharacter("");
    setConfidence(undefined);
    stableRef.current = { letter: "", count: 0 };
    cooldownRef.current = 0;
    try {
      await resetRecognizedText();
    } catch {
      // Local recognition remains usable even if the optional backend is offline.
    }
    setStatus(cameraState === "active" ? "online" : status);
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
