import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { motion } from "motion/react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Brain,
  Camera,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Cpu,
  Database,
  Droplets,
  Eye,
  Hand,
  HeartPulse,
  LifeBuoy,
  MessageSquare,
  MessageSquareText,
  Pill,
  Radio,
  RefreshCw,
  RotateCcw,
  Scan,
  ScanLine,
  ShieldAlert,
  Sparkles,
  Terminal,
  Utensils,
  Video,
  VideoOff,
  Volume2,
  Waves,
  Workflow,
  Zap,
} from "lucide-react";
import { getVideoFeedUrl, type LandmarkPoint } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CommunicationEntry } from "@/context/AppContext";

/* ==========================================================================
   1. SECTION LABEL / SYSTEM HEADER
   ========================================================================== */
export function SectionLabel({ children, badge }: { children: React.ReactNode; badge?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="size-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
      <p className="eyebrow">{children}</p>
      {badge && (
        <span className="ml-1 rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-mono text-[0.58rem] font-semibold tracking-wider text-primary">
          {badge}
        </span>
      )}
    </div>
  );
}

/* ==========================================================================
   2. LIVE COMMUNICATION AREA / CAMERA FEED
   Supports browser webcam (getUserMedia) with live MediaPipe landmark overlay!
   ========================================================================== */
export type CameraFeedProps = {
  online: boolean;
  active?: boolean;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  cameraState?:
    "idle" | "initializing" | "active" | "permission_denied" | "unavailable" | "stopped";
  cameraError?: string | null;
  landmarks?: LandmarkPoint[];
  streamKey?: number;
  recognizedCharacter?: string;
  confidence?: number;
  handDetected?: boolean;
  onToggle?: () => void;
  onRetry?: () => void;
  onStreamError?: () => void;
};

// MediaPipe standard 21-node skeletal hand connections
const HAND_CONNECTIONS: [number, number][] = [
  // Thumb
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  // Index
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  // Middle
  [0, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  // Ring
  [0, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  // Pinky
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  // Palm transverse
  [5, 9],
  [9, 13],
  [13, 17],
];

function objectContainBox(
  containerWidth: number,
  containerHeight: number,
  mediaWidth: number,
  mediaHeight: number,
) {
  const scale = Math.min(containerWidth / mediaWidth, containerHeight / mediaHeight);
  const width = mediaWidth * scale;
  const height = mediaHeight * scale;
  return {
    width,
    height,
    left: (containerWidth - width) / 2,
    top: (containerHeight - height) / 2,
  };
}

function HandLandmarkOverlay({
  videoRef,
  landmarks,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  landmarks: LandmarkPoint[];
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0, left: 0, top: 0 });

  const syncBox = useCallback(() => {
    const host = hostRef.current;
    const video = videoRef.current;
    if (!host || !video) {
      return;
    }
    const mediaWidth = video.videoWidth;
    const mediaHeight = video.videoHeight;
    if (!mediaWidth || !mediaHeight) {
      return;
    }
    setBox(objectContainBox(host.clientWidth, host.clientHeight, mediaWidth, mediaHeight));
  }, [videoRef]);

  useEffect(() => {
    syncBox();
    const host = hostRef.current;
    const video = videoRef.current;
    if (!host) {
      return;
    }
    const observer = new ResizeObserver(syncBox);
    observer.observe(host);
    if (video) {
      observer.observe(video);
      video.addEventListener("loadedmetadata", syncBox);
      video.addEventListener("resize", syncBox);
    }
    window.addEventListener("resize", syncBox);
    return () => {
      observer.disconnect();
      video?.removeEventListener("loadedmetadata", syncBox);
      video?.removeEventListener("resize", syncBox);
      window.removeEventListener("resize", syncBox);
    };
  }, [syncBox, videoRef]);

  return (
    <div ref={hostRef} className="pointer-events-none absolute inset-0">
      {landmarks.length === 21 && box.width > 0 && box.height > 0 && (
        <svg
          className="absolute"
          style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
          viewBox={`0 0 ${box.width} ${box.height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {HAND_CONNECTIONS.map(([i1, i2], idx) => {
            const p1 = landmarks[i1];
            const p2 = landmarks[i2];
            if (!p1 || !p2) return null;
            return (
              <line
                key={`bone-${idx}`}
                x1={p1.x * box.width}
                y1={p1.y * box.height}
                x2={p2.x * box.width}
                y2={p2.y * box.height}
                stroke="#00d9ff"
                strokeWidth="0.8"
                strokeOpacity="0.75"
                strokeDasharray="2 1"
                filter="drop-shadow(0 0 2px #00d9ff)"
              />
            );
          })}
          {landmarks.map((lm, idx) => (
            <g key={`node-${idx}`}>
              <circle
                cx={lm.x * box.width}
                cy={lm.y * box.height}
                r="1.2"
                fill="#16e0d0"
                stroke="#ffffff"
                strokeWidth="0.4"
                filter="drop-shadow(0 0 4px #00d9ff)"
              />
              {idx === 0 && (
                <circle
                  cx={lm.x * box.width}
                  cy={lm.y * box.height}
                  r="2.2"
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="0.5"
                  strokeDasharray="1.5 1.5"
                />
              )}
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}

export function CameraFeed({
  online,
  active = true,
  videoRef,
  cameraState = "active",
  cameraError,
  landmarks = [],
  streamKey = 0,
  handDetected = false,
  recognizedCharacter,
  confidence,
  onToggle,
  onRetry,
  onStreamError,
}: CameraFeedProps) {
  const isWebcamActive = cameraState === "active";
  const isInitializing = cameraState === "initializing";
  const isDenied = cameraState === "permission_denied";
  const isUnavailable = cameraState === "unavailable";
  const isStopped = cameraState === "stopped";

  return (
    <section
      className="panel relative overflow-hidden border border-primary/25 shadow-hero"
      aria-label="Live computer vision camera scanner"
    >
      {/* Top HUD Telemetry Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 bg-surface/80 px-5 py-3.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="relative flex size-2.5">
            {isWebcamActive && (
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
            )}
            <span
              className={`relative inline-flex size-2.5 rounded-full ${
                isWebcamActive
                  ? "bg-primary shadow-status"
                  : isInitializing
                    ? "bg-warning animate-pulse"
                    : isDenied
                      ? "bg-destructive"
                      : "bg-muted-foreground"
              }`}
            />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.16em] text-foreground">
                BROWSER OPTICAL SCANNER HUD
              </span>
              <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[0.58rem] font-semibold text-primary">
                {isWebcamActive ? "CLIENT WEBCAM / ACTIVE" : "WEBCAM STANDBY"}
              </span>
            </div>
            <p className="mt-0.5 font-mono text-[0.62rem] text-muted-foreground">
              CAPTURE: navigator.mediaDevices.getUserMedia • INFERENCE: /predict (42-D)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[0.62rem] font-semibold tracking-wider ${
              isWebcamActive
                ? "border-success/40 bg-success/10 text-success"
                : isInitializing
                  ? "border-warning/40 bg-warning/10 text-warning"
                  : isDenied
                    ? "border-destructive/40 bg-destructive/10 text-destructive"
                    : "border-border bg-surface text-muted-foreground"
            }`}
          >
            <span
              className={`size-1.5 rounded-full ${
                isWebcamActive
                  ? "bg-success"
                  : isInitializing
                    ? "bg-warning animate-pulse"
                    : isDenied
                      ? "bg-destructive"
                      : "bg-muted-foreground"
              }`}
            />
            {isWebcamActive
              ? "CAMERA ACTIVE"
              : isInitializing
                ? "INITIALIZING..."
                : isDenied
                  ? "PERMISSION DENIED"
                  : isUnavailable
                    ? "UNAVAILABLE"
                    : "STOPPED"}
          </span>

          {onToggle && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onToggle}
              className="h-7 border-border/80 bg-surface px-2.5 font-mono text-[0.62rem] tracking-wider text-muted-foreground hover:text-foreground"
            >
              {isWebcamActive ? "PAUSE CAMERA" : "START CAMERA"}
            </Button>
          )}
        </div>
      </div>

      {/* Main Viewport Container */}
      <div className="relative aspect-video min-h-[22rem] w-full overflow-hidden bg-camera">
        {/* Sci-Fi HUD Corner Brackets */}
        <div className="hud-corner hud-corner-tl" />
        <div className="hud-corner hud-corner-tr" />
        <div className="hud-corner hud-corner-bl" />
        <div className="hud-corner hud-corner-br" />

        {/* Reticle Guides in Corners */}
        <div className="pointer-events-none absolute left-6 top-6 text-primary/40">
          <Scan className="size-5" />
        </div>
        <div className="pointer-events-none absolute right-6 top-6 text-primary/40">
          <Scan className="size-5" />
        </div>

        {/* 1. Live Browser Webcam Video Viewport */}
        {videoRef ? (
          <div className="absolute inset-0">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 size-full select-none object-contain ${
                isWebcamActive ? "block" : "hidden"
              }`}
            />
            {isWebcamActive && <HandLandmarkOverlay videoRef={videoRef} landmarks={landmarks} />}
          </div>
        ) : isWebcamActive ? (
          <img
            key={streamKey}
            src={getVideoFeedUrl()}
            alt="Live camera stream used for ASL gesture recognition"
            onError={onStreamError}
            className="size-full select-none object-contain"
          />
        ) : null}

        {/* 3. Subtle Non-Obstructive Scanning Beam */}
        {isWebcamActive && <div className="futuristic-scan-line" />}

        {/* 4. Diagnostic Fallback Screens */}
        {isInitializing && (
          <div className="absolute inset-0 grid place-items-center bg-background/90 p-6 text-center">
            <div className="max-w-sm">
              <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl border border-primary/30 bg-primary/10 text-primary shadow-glow">
                <RefreshCw className="size-8 animate-spin text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold uppercase tracking-wider text-foreground">
                Initializing Browser Webcam
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Requesting local camera stream via{" "}
                <code className="text-primary font-mono">getUserMedia</code>. Please allow camera
                permissions when prompted.
              </p>
            </div>
          </div>
        )}

        {isDenied && (
          <div className="absolute inset-0 grid place-items-center bg-background/95 p-6 text-center">
            <div className="max-w-md">
              <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl border border-destructive/40 bg-destructive/15 text-destructive shadow-[0_0_25px_oklch(0.64_0.24_15_/_40%)]">
                <VideoOff className="size-8" />
              </div>
              <h3 className="font-display text-lg font-bold uppercase tracking-wider text-destructive">
                Camera Access Denied
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Your browser or system blocked camera permissions. To use Silent Talk, click the
                camera / lock icon in your browser address bar and select{" "}
                <strong>"Always Allow"</strong>, then retry.
              </p>
              {onRetry && (
                <Button
                  onClick={onRetry}
                  size="sm"
                  className="mt-5 border border-primary/40 bg-primary/20 font-mono text-xs font-bold text-primary hover:bg-primary/30"
                >
                  <RefreshCw className="mr-2 size-3.5" /> Retry Camera Access
                </Button>
              )}
            </div>
          </div>
        )}

        {isUnavailable && (
          <div className="absolute inset-0 grid place-items-center bg-background/95 p-6 text-center">
            <div className="max-w-md">
              <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl border border-warning/40 bg-warning/15 text-warning shadow-[0_0_25px_oklch(0.82_0.14_83_/_30%)]">
                <Camera className="size-8" />
              </div>
              <h3 className="font-display text-lg font-bold uppercase tracking-wider text-warning">
                Camera Unavailable
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {cameraError ||
                  "No optical video input detected. Please connect an external webcam or verify that your camera is not open in another application."}
              </p>
              {onRetry && (
                <Button
                  onClick={onRetry}
                  size="sm"
                  variant="outline"
                  className="mt-5 font-mono text-xs"
                >
                  <RefreshCw className="mr-2 size-3.5" /> Reconnect Camera
                </Button>
              )}
            </div>
          </div>
        )}

        {isStopped && (
          <div className="absolute inset-0 grid place-items-center bg-background/90 p-6 text-center">
            <div className="max-w-sm">
              <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl border border-border bg-surface text-muted-foreground">
                <Video className="size-7" />
              </div>
              <h3 className="font-display text-base font-semibold uppercase tracking-wider text-foreground">
                Optical Scanner Paused
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Webcam stream is suspended to conserve resources.
              </p>
              {onToggle && (
                <Button
                  onClick={onToggle}
                  size="sm"
                  className="neon-button mt-4 font-mono text-xs font-bold"
                >
                  Resume Camera
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Top-Left Telemetry Chips */}
        <div className="pointer-events-none absolute left-4 top-4 space-y-2 select-none">
          <div className="overlay-chip border-primary/30 bg-background/85 shadow-md">
            <Hand className={handDetected ? "text-success" : "text-primary"} />
            HAND TRACKING:
            <span
              className={`font-semibold ${
                handDetected
                  ? "text-success"
                  : isWebcamActive
                    ? "text-primary"
                    : "text-muted-foreground"
              }`}
            >
              {handDetected ? "LOCKED (21 NODES)" : isWebcamActive ? "SCANNING FOV" : "STANDBY"}
            </span>
          </div>

          <div className="overlay-chip border-primary/30 bg-background/85 shadow-md">
            <CircleDot className="text-accent" />
            LETTER:
            <span className="font-semibold text-foreground">
              {handDetected && recognizedCharacter ? recognizedCharacter.toUpperCase() : "—"}
            </span>
            {typeof confidence === "number" && !Number.isNaN(confidence) ? (
              <span className="text-muted-foreground">
                CONFIDENCE: {Math.round(confidence <= 1 ? confidence * 100 : confidence)}%
              </span>
            ) : null}
          </div>

          <div className="overlay-chip border-primary/30 bg-background/85 shadow-md">
            <CircleDot className="text-accent" />
            ASL CLASSIFIER:
            <span className="font-semibold text-foreground">
              {online ? "MODEL.P INFERENCE ACTIVE" : "AWAITING BACKEND"}
            </span>
          </div>
        </div>

        {/* Top-Right Telemetry Badge */}
        <div className="pointer-events-none absolute right-4 top-4 hidden select-none rounded-md border border-border/70 bg-background/80 px-2.5 py-1.5 font-mono text-[0.6rem] text-muted-foreground backdrop-blur-md sm:block">
          <span className="text-primary">CAPTURE:</span> CLIENT WEBCAM •{" "}
          <span className="text-accent">FORMAT:</span> NATIVE JPEG → /predict
        </div>

        {/* Bottom-Left Feature Dimension Readout */}
        <div className="pointer-events-none absolute bottom-4 left-4 select-none">
          <div className="rounded-md border border-border/70 bg-background/85 px-3 py-1.5 font-mono text-[0.62rem] text-muted-foreground backdrop-blur-md">
            <span className="text-primary font-bold">PIPELINE:</span> USERMEDIA → CANVAS → /predict
            → MODEL.P (42-D)
          </div>
        </div>

        {/* Bottom-Right System Processing Indicator */}
        <div className="pointer-events-none absolute bottom-4 right-4 select-none">
          <div className="flex items-center gap-2 rounded-md border border-border/70 bg-background/85 px-3 py-1.5 font-mono text-[0.62rem] text-muted-foreground backdrop-blur-md">
            <span
              className={`size-1.5 rounded-full ${
                isWebcamActive && online ? "bg-primary animate-ping" : "bg-muted-foreground"
              }`}
            />
            STATUS:{" "}
            <span className="font-bold text-foreground">
              {isWebcamActive && online ? "REAL-TIME INFERENCE" : "STANDBY"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   3. RECOGNITION CARD / AI INFERENCE MONITOR
   ========================================================================== */
export function RecognitionCard({
  recognizedCharacter,
  confidence,
  status,
  handDetected,
}: {
  recognizedCharacter: string;
  confidence: number | undefined;
  status: string;
  handDetected?: boolean;
}) {
  const hasConfidence = typeof confidence === "number" && !Number.isNaN(confidence);
  const confidencePercent = hasConfidence
    ? Math.round(confidence <= 1 ? confidence * 100 : confidence)
    : undefined;

  return (
    <section
      className="panel relative flex h-full flex-col justify-between overflow-hidden border border-primary/25 p-6 shadow-panel"
      aria-label="AI Gesture Recognition Monitor"
    >
      <div className="hud-corner hud-corner-tl" />
      <div className="hud-corner hud-corner-tr" />

      {/* Header */}
      <div>
        <div className="flex items-center justify-between border-b border-border/70 pb-3.5">
          <div>
            <SectionLabel badge="REALTIME">AI INFERENCE</SectionLabel>
            <p className="mt-1 font-mono text-[0.62rem] tracking-wider text-muted-foreground uppercase">
              Current Signal Classification
            </p>
          </div>
          <div className="grid size-8 place-items-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
            <Brain className="size-4 animate-pulse" />
          </div>
        </div>

        {/* Central Character Inference Orb */}
        <div className="my-6 grid place-items-center text-center">
          <div className="relative">
            <div className="absolute -inset-4 rounded-full border border-dashed border-primary/25 animate-spin-slow" />
            <div className="absolute -inset-1 rounded-full border border-primary/40" />

            <motion.div
              key={recognizedCharacter || "empty"}
              initial={{ scale: 0.92, opacity: 0.8 }}
              animate={{ scale: [0.95, 1.03, 1], opacity: 1 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="relative grid size-36 place-items-center rounded-full border-2 border-primary/40 bg-gradient-to-b from-primary/15 via-primary/5 to-surface shadow-[0_0_35px_oklch(from_var(--primary)_l_c_h_/_30%)]"
            >
              <span className="font-display text-7xl font-bold tracking-tight text-primary drop-shadow-[0_0_20px_oklch(from_var(--primary)_l_c_h_/_60%)]">
                {recognizedCharacter ? recognizedCharacter.toUpperCase() : "—"}
              </span>

              <span className="absolute bottom-2 font-mono text-[0.55rem] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                {recognizedCharacter ? `LETTER: ${recognizedCharacter.toUpperCase()}` : "IDLE FOV"}
              </span>
            </motion.div>
          </div>

          <div className="mt-5 flex items-center justify-center gap-2">
            <span
              className={`size-2 rounded-full ${
                handDetected ? "bg-success shadow-status animate-pulse" : "bg-muted-foreground"
              }`}
            />
            <span className="font-mono text-xs font-semibold tracking-wider text-foreground">
              {handDetected ? "TARGET LOCKED (HAND PRESENT)" : "SEARCHING FOR HAND IN VIEW"}
            </span>
          </div>
          <p className="mt-1 font-mono text-[0.65rem] text-muted-foreground">{status}</p>
        </div>
      </div>

      {/* Confidence & Telemetry Footer */}
      <div className="border-t border-border/70 pt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono text-[0.65rem] font-medium tracking-wider text-muted-foreground uppercase">
            CONFIDENCE
          </span>
          <span className="font-mono text-xs font-bold text-foreground">
            {hasConfidence ? String(confidencePercent) + "%" : "n/a (not provided)"}
          </span>
        </div>

        <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-muted/60">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-accent"
            animate={{
              width: hasConfidence ? `${confidencePercent}%` : "100%",
              opacity: hasConfidence ? 1 : 0.25,
            }}
            transition={{ duration: 0.4 }}
          />
        </div>

        <p className="mt-2 font-mono text-[0.58rem] text-muted-foreground">
          {hasConfidence
            ? "Trained multi-class Random Forest probability"
            : "Classification active via 42 normalized hand coordinates"}
        </p>
      </div>
    </section>
  );
}

/* ==========================================================================
   4. MESSAGE COMPOSER / TERMINAL BUFFER
   ========================================================================== */
export function MessageComposer({
  value,
  setValue,
  onClear,
  onSpeak,
  clearing,
  title = "Translated text",
}: {
  value: string;
  setValue: (v: string) => void;
  onClear: () => void;
  onSpeak: () => void;
  clearing?: boolean;
  title?: string;
}) {
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;

  return (
    <section
      className="panel relative overflow-hidden border border-primary/25 p-5 shadow-panel sm:p-6"
      aria-label="Message synthesis console"
    >
      <div className="hud-corner hud-corner-tl" />
      <div className="hud-corner hud-corner-tr" />

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
        <div>
          <SectionLabel badge="SYNTHESIS">TERMINAL BUFFER</SectionLabel>
          <p className="mt-1 text-xs text-muted-foreground">
            {title} • Editable before speech broadcast
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[0.62rem] text-muted-foreground">
          <span className="rounded bg-surface px-2 py-1 border border-border">
            CHARS: {charCount}
          </span>
          <span className="rounded bg-surface px-2 py-1 border border-border">
            WORDS: {wordCount}
          </span>
        </div>
      </div>

      <div className="relative mt-4">
        <Textarea
          value={value}
          onChange={(event) => setValue(event.target.value.toUpperCase())}
          placeholder="ACCUMULATED RECOGNITION BUFFER WILL APPEAR HERE..."
          aria-label="Your translated message"
          className="min-h-36 resize-none border-0 bg-transparent p-0 font-display text-2xl font-bold uppercase leading-relaxed tracking-wide text-foreground placeholder:text-muted-foreground/35 shadow-none focus-visible:ring-0 sm:text-3xl"
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border/70 pt-4">
        <Button
          size="lg"
          onClick={onSpeak}
          disabled={!value.trim()}
          className="neon-button inline-flex h-11 items-center gap-2 px-6 font-display text-xs font-bold uppercase tracking-wider"
        >
          <Volume2 className="size-4" />
          Broadcast Speech
        </Button>

        <Button
          size="lg"
          variant="secondary"
          onClick={() =>
            document
              .querySelector<HTMLTextAreaElement>('textarea[aria-label="Your translated message"]')
              ?.focus()
          }
          className="inline-flex h-11 items-center gap-2 border border-border bg-surface px-4 font-display text-xs font-semibold uppercase tracking-wider text-foreground hover:bg-muted"
        >
          <MessageSquareText className="size-4 text-primary" />
          Direct Edit
        </Button>

        <Button
          size="lg"
          variant="outline"
          onClick={onClear}
          disabled={clearing || !value}
          className="inline-flex h-11 items-center gap-2 border-border/80 bg-surface px-4 font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className={`size-3.5 ${clearing ? "animate-spin" : ""}`} />
          {clearing ? "Flushing Buffer..." : "Flush Buffer"}
        </Button>
      </div>
    </section>
  );
}

/* ==========================================================================
   5. AI ASSISTANCE MATRIX (QUICK HEALTHCARE NEEDS)
   ========================================================================== */
export type MatrixItem = {
  id: string;
  code: string;
  label: string;
  title: string;
  description: string;
  phrase: string;
  icon: typeof HeartPulse;
  isEmergency?: boolean;
};

const MATRIX_MODULES: MatrixItem[] = [
  {
    id: "PAIN",
    code: "MOD-01",
    label: "PAIN",
    title: "Pain Assistance",
    description: "Signal severe pain or acute discomfort",
    phrase: "I AM EXPERIENCING PAIN",
    icon: HeartPulse,
  },
  {
    id: "WATER",
    code: "MOD-02",
    label: "WATER",
    title: "Hydration Request",
    description: "Request clean drinking water or fluids",
    phrase: "I NEED WATER",
    icon: Droplets,
  },
  {
    id: "MEDICINE",
    code: "MOD-03",
    label: "MEDICINE",
    title: "Medication Request",
    description: "Request scheduled prescription medicine",
    phrase: "I NEED MY MEDICINE",
    icon: Pill,
  },
  {
    id: "FOOD",
    code: "MOD-04",
    label: "FOOD",
    title: "Nutritional Need",
    description: "Request meal, nourishment, or food",
    phrase: "I NEED FOOD",
    icon: Utensils,
  },
  {
    id: "HELP",
    code: "MOD-05",
    label: "HELP",
    title: "Caregiver Assistance",
    description: "Summon bedside medical caregiver",
    phrase: "I NEED HELP",
    icon: LifeBuoy,
  },
  {
    id: "EMERGENCY",
    code: "MOD-06",
    label: "EMERGENCY",
    title: "Priority Escalation",
    description: "Broadcast critical emergency medical alarm",
    phrase: "I NEED IMMEDIATE HELP",
    icon: AlertTriangle,
    isEmergency: true,
  },
];

export function HealthcareQuickActions({
  onSelect,
  onEmergency,
}: {
  onSelect: (phrase: string) => void;
  onEmergency: () => void;
}) {
  return (
    <section aria-label="AI Assistance Matrix">
      <div className="flex items-center justify-between">
        <div>
          <SectionLabel badge="PRESETS">AI ASSISTANCE MATRIX</SectionLabel>
          <p className="mt-1 text-xs text-muted-foreground">
            Active neural clinical modules • Instant speech dispatch
          </p>
        </div>
        <span className="hidden font-mono text-[0.62rem] text-muted-foreground sm:inline-block">
          6 ACTIVE PROTOCOLS
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {MATRIX_MODULES.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => (item.isEmergency ? onEmergency() : onSelect(item.phrase))}
              className={`group flex flex-col justify-between p-4 text-left transition-all ${
                item.isEmergency ? "matrix-module-card-emergency" : "matrix-module-card"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[0.62rem] font-bold tracking-wider text-muted-foreground">
                  {item.code}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[0.55rem] font-bold tracking-wider ${
                    item.isEmergency
                      ? "bg-destructive/20 text-destructive"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  <span
                    className={`size-1 rounded-full ${
                      item.isEmergency ? "bg-destructive animate-pulse" : "bg-primary"
                    }`}
                  />
                  {item.isEmergency ? "CRITICAL" : "SIGNAL READY"}
                </span>
              </div>

              <div className="my-3 flex items-start gap-3.5">
                <div
                  className={`grid size-11 shrink-0 place-items-center rounded-xl border transition-transform duration-200 group-hover:scale-110 ${
                    item.isEmergency
                      ? "border-destructive/40 bg-destructive/15 text-destructive shadow-[0_0_15px_oklch(0.64_0.24_15_/_30%)]"
                      : "border-primary/30 bg-primary/10 text-primary shadow-[0_0_15px_oklch(from_var(--primary)_l_c_h_/_20%)]"
                  }`}
                >
                  <Icon className="size-5" />
                </div>
                <div>
                  <h4 className="font-display text-sm font-bold tracking-wide text-foreground">
                    {item.title}
                  </h4>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border/50 pt-2.5 font-mono text-[0.6rem] text-muted-foreground group-hover:text-foreground">
                <span className="truncate pr-2 font-mono text-[0.58rem] text-muted-foreground">
                  “{item.phrase}”
                </span>
                <span
                  className={`inline-flex shrink-0 items-center gap-1 font-bold ${
                    item.isEmergency ? "text-destructive" : "text-primary"
                  }`}
                >
                  DISPATCH{" "}
                  <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ==========================================================================
   6. COMMUNICATION MEMORY (AI EVENT TIMELINE)
   ========================================================================== */
export function CommunicationHistory({ entries }: { entries: CommunicationEntry[] }) {
  return (
    <section
      className="panel relative overflow-hidden p-5 shadow-panel"
      aria-label="Communication Memory Timeline"
    >
      <div className="hud-corner hud-corner-tl" />
      <div className="hud-corner hud-corner-tr" />

      <div className="flex items-center justify-between border-b border-border/70 pb-3">
        <div>
          <SectionLabel badge="AUDIT LOG">COMMUNICATION MEMORY</SectionLabel>
          <p className="mt-1 text-xs text-muted-foreground">
            AI event timeline • Historical speech events
          </p>
        </div>
        <span className="font-mono text-[0.62rem] text-muted-foreground">
          {entries.length} {entries.length === 1 ? "EVENT" : "EVENTS"}
        </span>
      </div>

      <div className="relative mt-4 min-h-48">
        {entries.length > 0 ? (
          <div className="relative pl-8">
            <div className="timeline-track" />

            <div className="space-y-4">
              {entries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.04 }}
                  className="relative rounded-xl border border-border/70 bg-surface/70 p-3.5 backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-surface"
                >
                  <div className="absolute -left-[27px] top-4">
                    <div className="timeline-pulse-node" />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[0.65rem] font-semibold text-primary">
                      {entry.time}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[0.55rem] font-bold tracking-wider text-primary">
                      <Volume2 className="size-2.5" /> SPOKEN OUT LOUD
                    </span>
                  </div>

                  <p className="mt-2 font-display text-sm font-semibold tracking-wide text-foreground">
                    “{entry.message}”
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid place-items-center py-10 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-xl border border-border/80 bg-surface text-muted-foreground">
              <MessageSquare className="size-5 text-muted-foreground/60" />
            </div>
            <p className="mt-3 font-mono text-xs font-semibold text-muted-foreground">
              TIMELINE BUFFER IDLE
            </p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground/80">
              Spoken communications and AI assistance signals will appear here in chronological
              order.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

/* ==========================================================================
   7. EMERGENCY PROTOCOL & MODAL
   ========================================================================== */
export function EmergencyModal({
  open,
  onOpenChange,
  onSpeak,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSpeak: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-destructive/60 bg-card/95 backdrop-blur-2xl shadow-[0_0_80px_oklch(0.64_0.24_15_/_35%)] sm:max-w-md">
        <DialogHeader>
          <div className="mb-3 grid size-14 place-items-center rounded-2xl border border-destructive/50 bg-destructive/15 text-destructive shadow-[0_0_25px_oklch(0.64_0.24_15_/_40%)]">
            <ShieldAlert className="size-7 animate-pulse" />
          </div>
          <DialogTitle className="font-display text-2xl font-bold uppercase tracking-wide text-destructive">
            Emergency Medical Protocol
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            This triggers an immediate high-volume synthesized audio broadcast to medical personnel
            and caregivers in proximity.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 rounded-2xl border border-destructive/40 bg-destructive/10 p-5 text-center">
          <span className="font-mono text-[0.62rem] font-bold tracking-widest text-destructive uppercase">
            BROADCAST PAYLOAD
          </span>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">
            “I NEED IMMEDIATE HELP”
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-border bg-surface font-display text-xs uppercase"
          >
            Cancel Protocol
          </Button>
          <Button
            variant="destructive"
            onClick={onSpeak}
            className="gap-2 bg-destructive font-display text-xs font-bold uppercase shadow-[0_0_25px_oklch(0.64_0.24_15_/_50%)] hover:bg-destructive/90"
          >
            <Volume2 className="size-4" /> Broadcast Alarm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ==========================================================================
   8. NEURAL TECHNOLOGY STACK
   ========================================================================== */
export type TechStep = {
  id: string;
  stepNum: string;
  name: string;
  subtitle: string;
  role: string;
  specs: string;
  icon: typeof Camera;
  color: string;
};

const TECH_PIPELINE: TechStep[] = [
  {
    id: "webcam",
    stepNum: "01",
    name: "Browser Camera",
    subtitle: "CLIENT WEBCAM",
    role: "Local Video Ingestion & Canvas Scaling",
    specs: "getUserMedia → 480×360 JPEG (~7 FPS)",
    icon: Video,
    color: "#20e8ff",
  },
  {
    id: "mediapipe",
    stepNum: "02",
    name: "MediaPipe",
    subtitle: "LANDMARK EXTRACTION",
    role: "Hand Keypoint Detection",
    specs: "21 3D Coordinate Nodes (x,y,z)",
    icon: Hand,
    color: "#a855f7",
  },
  {
    id: "normalization",
    stepNum: "03",
    name: "Feature Vector",
    subtitle: "PREPROCESSING",
    role: "Coordinate Relative Normalization",
    specs: "42 Normalized Features (dx, dy)",
    icon: Cpu,
    color: "#00d9ff",
  },
  {
    id: "scikit",
    stepNum: "04",
    name: "Scikit-Learn",
    subtitle: "CLASSIFICATION",
    role: "Gesture Inference Model",
    specs: "Random Forest Ensemble (model.p)",
    icon: Brain,
    color: "#7c4dff",
  },
  {
    id: "flask",
    stepNum: "05",
    name: "Flask API",
    subtitle: "TELEMETRY GATEWAY",
    role: "Multi-User /predict Endpoint",
    specs: "Isolated session buffers (session_id)",
    icon: Database,
    color: "#ffd166",
  },
  {
    id: "interface",
    stepNum: "06",
    name: "Silent Talk UI",
    subtitle: "NEURAL INTERFACE",
    role: "Accessible Speech & Matrix Console",
    specs: "Web Speech API & React Console",
    icon: Activity,
    color: "#16e0d0",
  },
];

export function TechnologyStack() {
  return (
    <section
      className="panel relative overflow-hidden border border-primary/25 p-6 shadow-hero"
      aria-label="Neural Technology Stack"
    >
      <div className="hud-corner hud-corner-tl" />
      <div className="hud-corner hud-corner-tr" />
      <div className="hud-corner hud-corner-bl" />
      <div className="hud-corner hud-corner-br" />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-4">
        <div>
          <SectionLabel badge="ARCHITECTURE">NEURAL TECHNOLOGY STACK</SectionLabel>
          <h3 className="mt-1 font-display text-xl font-bold uppercase tracking-wider text-foreground sm:text-2xl">
            Real-Time Vision & Inference Pipeline
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            End-to-end multi-user architecture connecting browser webcam capture to synthetic voice
            speech
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[0.62rem] text-muted-foreground">
          <span className="rounded bg-primary/10 px-2 py-1 text-primary border border-primary/20">
            6 PIPELINE STAGES
          </span>
          <span className="rounded bg-accent/10 px-2 py-1 text-accent border border-accent/20">
            42-D FEATURE SPACE
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {TECH_PIPELINE.map((tech, index) => {
          const Icon = tech.icon;
          return (
            <div
              key={tech.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-surface/80 p-4 backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_0_25px_oklch(from_var(--primary)_l_c_h_/_15%)]"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[0.65rem] font-bold tracking-widest text-primary">
                  [{tech.stepNum}]
                </span>
                <span className="font-mono text-[0.55rem] font-semibold tracking-wider text-muted-foreground uppercase">
                  {tech.subtitle}
                </span>
              </div>

              <div className="my-3">
                <div
                  className="mb-3 grid size-10 place-items-center rounded-xl border border-border bg-background text-primary shadow-sm transition-transform duration-200 group-hover:scale-105"
                  style={{ borderColor: `${tech.color}40`, color: tech.color }}
                >
                  <Icon className="size-5" />
                </div>
                <h4 className="font-display text-base font-bold text-foreground">{tech.name}</h4>
                <p className="mt-1 text-xs font-medium text-foreground/80 leading-snug">
                  {tech.role}
                </p>
              </div>

              <div className="border-t border-border/60 pt-2.5 font-mono text-[0.58rem] text-muted-foreground">
                {tech.specs}
              </div>

              {index < TECH_PIPELINE.length - 1 && (
                <div className="pointer-events-none absolute -right-3 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-border bg-background p-0.5 text-primary xl:block">
                  <ChevronRight className="size-3.5" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-xl border border-border/70 bg-surface/50 p-4 font-mono text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[0.68rem] text-muted-foreground">
          <span className="font-bold text-primary">DATA FLOW PATH:</span>
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[0.62rem]">
            <span className="text-foreground">USER WEBCAM</span>
            <span className="text-primary">→</span>
            <span className="text-foreground">CANVAS BLOB</span>
            <span className="text-primary">→</span>
            <span className="text-foreground">POST /predict (SESSION ISOLATED)</span>
            <span className="text-primary">→</span>
            <span className="text-foreground">MEDIAPIPE (21 LANDMARKS)</span>
            <span className="text-primary">→</span>
            <span className="text-foreground">42 FEATURES</span>
            <span className="text-primary">→</span>
            <span className="text-foreground">MODEL.P</span>
            <span className="text-primary">→</span>
            <span className="text-foreground">HUD OVERLAY + SPEECH</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   9. RECOGNITION PIPELINE COMPACT STEPPER
   ========================================================================== */
const PIPELINE_STAGES = [
  [Video, "CAPTURE", "Browser Webcam"],
  [Hand, "DETECT", "MediaPipe 21 Kps"],
  [Cpu, "EXTRACT", "42 Rel Features"],
  [ScanLine, "CLASSIFY", "model.p RF"],
  [MessageSquareText, "SYNTHESIZE", "Terminal Buffer"],
  [Volume2, "BROADCAST", "Speech Synthesis"],
] as const;

export function RecognitionPipeline({ active }: { active: boolean }) {
  return (
    <section className="panel p-4 sm:p-5" aria-label="Recognition pipeline status">
      <div className="flex items-center justify-between">
        <SectionLabel badge="PIPELINE">REAL-TIME EXECUTION PIPELINE</SectionLabel>
        <span
          className={`font-mono text-[0.62rem] font-semibold ${
            active ? "text-success" : "text-muted-foreground"
          }`}
        >
          {active ? "ALL PIPELINE NODES OPERATIONAL" : "PIPELINE STANDBY"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {PIPELINE_STAGES.map(([Icon, label, detail], index) => (
          <div
            key={label}
            className="relative flex items-center gap-3 rounded-xl border border-border/80 bg-surface/80 p-3 sm:flex-col sm:text-center"
          >
            <span
              className={`grid size-9 shrink-0 place-items-center rounded-lg border ${
                active
                  ? "border-primary/40 bg-primary/10 text-primary shadow-[0_0_12px_oklch(from_var(--primary)_l_c_h_/_20%)]"
                  : "border-border bg-muted text-muted-foreground"
              }`}
            >
              <Icon className="size-4" />
            </span>
            <div>
              <p className="font-mono text-[0.65rem] font-bold tracking-wider text-foreground">
                {label}
              </p>
              <p className="mt-0.5 text-[0.62rem] text-muted-foreground">{detail}</p>
            </div>
            {index < PIPELINE_STAGES.length - 1 && (
              <span className="pointer-events-none absolute -right-2 top-1/2 z-10 hidden -translate-y-1/2 text-muted-foreground/60 lg:block">
                ›
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
