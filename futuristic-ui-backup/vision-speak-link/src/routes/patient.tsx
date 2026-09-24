import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  CameraFeed,
  CommunicationHistory,
  EmergencyModal,
  HealthcareQuickActions,
  MessageComposer,
  RecognitionCard,
  RecognitionPipeline,
  SectionLabel,
  TechnologyStack,
} from "@/components/ProductComponents";
import { useRecognition } from "@/hooks/useRecognition";
import { useApp } from "@/context/AppContext";
import { EnergyWaves, HolographicHand, ParticleField } from "@/components/visuals";
import { Activity, ShieldAlert, Sparkles, Volume2, Wifi } from "lucide-react";

export const Route = createFileRoute("/patient")({
  head: () => ({
    meta: [
      { title: "Patient Mode — Silent Talk AI Healthcare Console" },
      {
        name: "description",
        content:
          "Advanced AI-powered assistive communication console. Real-time browser webcam computer vision gesture recognition and clinical assistance matrix.",
      },
      { property: "og:title", content: "Patient Mode — Silent Talk AI Healthcare Console" },
      {
        property: "og:description",
        content:
          "Futuristic neural communication workspace bridging sign gestures with synthetic voice and instant healthcare dispatches.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PatientMode,
});

function PatientMode() {
  const [liveActive, setLiveActive] = useState(true);
  const recognition = useRecognition(liveActive);
  const { message, setMessage, history, commitMessage, speak } = useApp();
  const [emergency, setEmergency] = useState(false);
  const [clearing, setClearing] = useState(false);

  // Sync recognition text into message composer buffer
  useEffect(() => {
    if (recognition.recognizedText) setMessage(recognition.recognizedText);
  }, [recognition.recognizedText, setMessage]);

  const clear = async () => {
    setClearing(true);
    setMessage("");
    try {
      await recognition.reset();
    } catch {
      // Gracefully handle network hiccups
    } finally {
      setClearing(false);
    }
  };

  const select = (phrase: string) => {
    commitMessage(phrase);
  };

  const say = () => {
    commitMessage(message);
    speak(message);
  };

  return (
    <div className="page-wrap space-y-10">
      {/* ====================================================================
          PAGE HEADER / CONSOLE TELEMETRY STRIP
          ==================================================================== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-border/60 pb-6">
        <div>
          <SectionLabel badge="MULTI-USER READY">PATIENT MODE // NEURAL WORKSPACE</SectionLabel>
          <h1 className="mt-3 font-display text-4xl font-bold uppercase tracking-tight sm:text-5xl lg:text-6xl text-foreground">
            Communication <span className="text-primary">Console</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base max-w-xl">
            Real-time assistive communication powered by your browser webcam, MediaPipe 3D hand
            keypoints, and trained machine learning inference.
          </p>
        </div>

        {/* Live Backend Connection Chip */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-border/80 bg-surface/90 px-4 py-2 shadow-sm">
            <span className="relative flex size-2">
              {recognition.status === "online" && (
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
              )}
              <span
                className={`relative inline-flex size-2 rounded-full ${
                  recognition.status === "online"
                    ? "bg-success shadow-status"
                    : recognition.status === "offline"
                      ? "bg-warning"
                      : "bg-primary"
                }`}
              />
            </span>
            <span className="font-mono text-xs font-bold tracking-wider text-foreground uppercase">
              {recognition.status === "offline"
                ? "BACKEND DISCONNECTED"
                : recognition.status === "online"
                  ? "NEURAL BACKEND ONLINE"
                  : "CONNECTING TO ENGINE..."}
            </span>
          </div>
        </div>
      </div>

      {/* ====================================================================
          1. HERO / LIVE COMMUNICATION AREA
          ==================================================================== */}
      <section className="space-y-6" aria-label="Hero and Live Camera Area">
        {/* Holographic Command Deck Banner */}
        <div className="command-hero holo-card relative overflow-hidden rounded-3xl border border-primary/25 p-6 sm:p-10">
          <ParticleField dense />
          <EnergyWaves className="bottom-0 left-0 w-full opacity-40" />

          <div className="relative z-10 max-w-xl pt-2 sm:pt-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[0.65rem] font-bold tracking-widest text-primary uppercase">
              <Sparkles className="size-3" /> SILENT TALK AI ENGINE // ACTIVE
            </div>

            <h2 className="mt-4 font-display text-4xl font-bold uppercase leading-[0.98] sm:text-5xl lg:text-6xl text-foreground">
              Sign to <br />
              <span className="bg-gradient-to-r from-primary via-[#00d9ff] to-accent bg-clip-text text-transparent">
                Synthesized Voice.
              </span>
            </h2>

            <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-md">
              Allow browser camera access below. MediaPipe tracks 21 skeletal hand joints in real
              time, classifying American Sign Language into spoken clinical vocabulary.
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5 font-mono text-[0.62rem] tracking-wider text-muted-foreground">
              <span className="rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1.5 font-bold text-primary">
                CAPTURE: USER WEBCAM
              </span>
              <span className="rounded-md border border-accent/30 bg-accent/10 px-2.5 py-1.5 font-bold text-accent">
                MODEL: RANDOM FOREST (42-D)
              </span>
              <span className="rounded-md border border-border bg-surface px-2.5 py-1.5 text-foreground">
                ENDPOINT: /predict
              </span>
            </div>
          </div>

          <div className="pointer-events-none absolute -right-10 top-[-15%] w-[62%] min-w-[22rem] opacity-85 sm:right-[1%] sm:top-[-20%] sm:w-[50%]">
            <HolographicHand />
          </div>
        </div>

        {/* Live Browser Webcam Scanner HUD Component */}
        <CameraFeed
          online={recognition.status === "online"}
          active={liveActive}
          videoRef={recognition.videoRef}
          cameraState={recognition.cameraState}
          cameraError={recognition.cameraError}
          landmarks={recognition.landmarks}
          recognizedCharacter={recognition.recognizedCharacter}
          confidence={recognition.confidence}
          handDetected={recognition.handDetected}
          onToggle={() => {
            setLiveActive((current) => {
              if (current) {
                recognition.stopCamera();
                return false;
              } else {
                void recognition.startCamera();
                return true;
              }
            });
          }}
          onRetry={() => {
            setLiveActive(true);
            void recognition.startCamera();
          }}
        />
      </section>

      {/* ====================================================================
          2. RECOGNITION STATUS & TERMINAL BUFFER
          ==================================================================== */}
      <section className="space-y-4" aria-label="Recognition Status and Translation">
        <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
          <MessageComposer
            value={message}
            setValue={setMessage}
            onClear={clear}
            onSpeak={say}
            clearing={clearing}
            title="Accumulated Translation Buffer"
          />

          <RecognitionCard
            recognizedCharacter={recognition.recognizedCharacter}
            confidence={recognition.confidence}
            handDetected={recognition.handDetected}
            status={
              recognition.status === "online"
                ? "Live inference active via client webcam"
                : "Awaiting recognition backend connection"
            }
          />
        </div>

        {/* Compact Real-Time Pipeline Stages */}
        <RecognitionPipeline active={recognition.status === "online"} />
      </section>

      {/* ====================================================================
          3. AI ASSISTANCE MATRIX
          ==================================================================== */}
      <HealthcareQuickActions onSelect={select} onEmergency={() => setEmergency(true)} />

      {/* ====================================================================
          4. COMMUNICATION MEMORY
          ==================================================================== */}
      <CommunicationHistory entries={history} />

      {/* ====================================================================
          5. EMERGENCY PROTOCOL
          ==================================================================== */}
      <section
        className="emergency-protocol-panel rounded-3xl p-6 sm:p-8 transition-all"
        aria-label="Emergency Medical Protocol"
      >
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-start gap-4">
            <div className="emergency-beacon-glow grid size-14 shrink-0 place-items-center rounded-2xl border border-destructive/50 bg-destructive/20 text-destructive shadow-[0_0_25px_oklch(0.64_0.24_15_/_40%)]">
              <ShieldAlert className="size-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-destructive animate-ping" />
                <p className="font-mono text-[0.65rem] font-bold tracking-widest text-destructive uppercase">
                  CRITICAL PROTOCOL // PRIORITY LEVEL 1
                </p>
              </div>
              <h3 className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Emergency Medical Alert
              </h3>
              <p className="mt-1.5 text-xs text-muted-foreground max-w-lg leading-relaxed">
                Immediately broadcasts high-volume distress audio (“I NEED IMMEDIATE HELP”) to
                attending medical staff and logs urgent alert on the console.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setEmergency(true)}
            className="group relative inline-flex h-12 w-full sm:w-auto shrink-0 items-center justify-center gap-2 rounded-xl bg-destructive px-7 font-display text-xs font-bold uppercase tracking-wider text-destructive-foreground shadow-[0_0_35px_oklch(0.64_0.24_15_/_50%)] transition-all hover:scale-[1.03] hover:bg-destructive/90"
          >
            <ShieldAlert className="size-4 transition-transform group-hover:rotate-12" />
            ACTIVATE EMERGENCY PROTOCOL
          </button>
        </div>
      </section>

      {/* Emergency Modal Dialog */}
      <EmergencyModal
        open={emergency}
        onOpenChange={setEmergency}
        onSpeak={() => {
          commitMessage("I NEED IMMEDIATE HELP");
          speak("I NEED IMMEDIATE HELP");
          setEmergency(false);
        }}
      />

      {/* ====================================================================
          6. NEURAL TECHNOLOGY STACK
          ==================================================================== */}
      <TechnologyStack />
    </div>
  );
}
