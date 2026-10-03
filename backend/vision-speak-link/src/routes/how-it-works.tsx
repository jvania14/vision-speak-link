import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Camera, Hand, ScanLine, MessageSquareText, Volume2 } from "lucide-react";
import { PageIntro } from "@/components/AppShell";
import { SectionLabel, TechnologyStack } from "@/components/ProductComponents";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How Silent Talk Works" },
      {
        name: "description",
        content:
          "Learn how camera capture, MediaPipe detection, classification, text, and speech work together.",
      },
      { property: "og:title", content: "How Silent Talk Works" },
      {
        property: "og:description",
        content: "A transparent five-stage ASL recognition and communication pipeline.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HowItWorks,
});
const steps = [
  [Camera, "Capture", "Camera captures the user's hand gesture."],
  [Hand, "Detect", "MediaPipe identifies hand landmarks."],
  [ScanLine, "Classify", "A trained machine-learning model recognizes the ASL alphabet."],
  [MessageSquareText, "Display", "The recognized character appears as text."],
  [Volume2, "Speak", "Recognized text can be converted into audio."],
] as const;
function HowItWorks() {
  return (
    <div className="page-wrap">
      <div className="grid gap-10 lg:grid-cols-[.7fr_1.3fr] lg:items-end">
        <PageIntro
          eyebrow="Transparent by design"
          title="From gestures to understanding"
          description="A focused path from visible gesture to clear communication, with each stage prepared for the existing recognition backend."
        />
        <div className="holo-card corner-frame relative hidden min-h-52 overflow-hidden p-6 lg:block">
          <span className="data-dot left-10 top-12" />
          <span className="data-dot right-14 top-20" />
          <div className="flex h-full items-center justify-center gap-3">
            <span className="grid size-14 place-items-center rounded-full border border-primary/40 text-primary">
              <Camera />
            </span>
            <span className="energy-line h-px w-16" />
            <span className="grid size-14 place-items-center rounded-full border border-accent/40 text-accent">
              <Hand />
            </span>
            <span className="energy-line h-px w-16" />
            <span className="grid size-14 place-items-center rounded-full border border-primary/40 text-primary">
              <Volume2 />
            </span>
          </div>
        </div>
      </div>
      <section className="mt-14">
        <div className="flex items-end justify-between">
          <div>
            <SectionLabel>01 / Neural processing path</SectionLabel>
            <h2 className="mt-3 font-display text-3xl font-semibold">Every stage stays visible.</h2>
          </div>
          <span className="hidden font-mono text-xs text-muted-foreground sm:block">
            CAMERA / LANDMARKS / MODEL / VOICE
          </span>
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-5">
          {steps.map(([Icon, title, text], i) => (
            <motion.article
              key={title}
              initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: i * 0.08 }}
              viewport={{ once: true }}
              className="holo-card relative p-6"
            >
              <span className="font-mono text-xs text-primary">0{i + 1}</span>
              <div className="mt-7 grid size-16 place-items-center rounded-2xl border border-primary/30 bg-primary/10 text-primary shadow-glow">
                <Icon className="size-8" />
              </div>
              <h2 className="mt-6 font-display text-xl font-semibold uppercase">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p>
              {i < 4 && (
                <span className="energy-line absolute -right-5 top-1/2 z-10 hidden h-px w-6 lg:block" />
              )}
            </motion.article>
          ))}
        </div>
      </section>
      <section className="mt-20">
        <SectionLabel>02 / Technology stack</SectionLabel>
        <h2 className="mt-3 max-w-2xl font-display text-4xl font-semibold">
          The technology behind Silent Talk.
        </h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          A computer-vision pipeline designed for real-time assistive communication.
        </p>
        <div className="mt-8">
          <TechnologyStack />
        </div>
      </section>
      <section className="mt-20 border-t border-border/60 pt-12">
        <SectionLabel>03 / Signal diagram</SectionLabel>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-primary/15 bg-surface/30 p-8 font-mono text-xs tracking-[.12em] text-muted-foreground">
          {["CAMERA", "MEDIAPIPE", "LANDMARKS", "ML MODEL", "TEXT", "SPEECH"].map((item, i) => (
            <div key={item} className="flex items-center gap-3">
              <span className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-primary">
                {item}
              </span>
              {i < 5 && <span className="text-accent">→</span>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
