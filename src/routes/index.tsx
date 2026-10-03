import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  ArrowRight,
  BrainCircuit,
  Hand,
  HeartHandshake,
  MessageSquareText,
  Play,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SectionLabel, TechnologyStack } from "@/components/ProductComponents";
import { HolographicHand } from "@/components/visuals";
import { useRef, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Silent Talk — Communication Without Barriers" },
      {
        name: "description",
        content:
          "AI-powered ASL recognition that transforms hand gestures into readable text and speech.",
      },
      { property: "og:title", content: "Silent Talk — Communication Without Barriers" },
      {
        property: "og:description",
        content:
          "Accessible sign language communication powered by an existing recognition backend.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const features = [
  [
    ScanLine,
    "Real-time recognition",
    "Recognize ASL gestures through a connected camera and recognition backend.",
  ],
  [
    MessageSquareText,
    "Text + speech",
    "Convert recognized signs into readable text and clear spoken audio.",
  ],
  [
    HeartHandshake,
    "Accessibility first",
    "Designed to make essential communication faster and more comfortable.",
  ],
] as const;

function Home() {
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const demoVideoRef = useRef<HTMLVideoElement>(null);

  const closeDemo = () => {
    const video = demoVideoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
    setIsDemoOpen(false);
  };

  return (
    <div>
      <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-[1440px] items-center gap-12 px-5 py-16 lg:grid-cols-[1.05fr_.95fr] lg:px-10 lg:py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <SectionLabel>AI-powered assistive communication</SectionLabel>
          <h1 className="mt-6 font-display text-6xl font-semibold leading-[0.9] tracking-[-.04em] sm:text-7xl lg:text-[7rem]">
            SILENT
            <br />
            <span className="bg-gradient-to-r from-primary via-[#00d9ff] to-[#a855f7] bg-clip-text text-transparent">
              TALK
            </span>
          </h1>
          <p className="mt-7 font-display text-2xl text-foreground sm:text-3xl">
            Communication without barriers.
          </p>
          <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
            AI-powered sign language recognition that transforms hand gestures into readable text
            and speech.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild size="lg" className="neon-button">
              <Link to="/patient">
                Start Communicating <ArrowRight />
              </Link>
            </Button>
            <Button size="lg" variant="outline" onClick={() => setIsDemoOpen(true)}>
              <Play /> Watch Demo
            </Button>
          </div>
          <div className="mt-12 flex items-center gap-3 font-mono text-[.62rem] uppercase tracking-[.16em] text-muted-foreground">
            <span className="size-2 rounded-full bg-success shadow-status" /> Recognition system
            ready for connection
          </div>
        </motion.div>
        <HeroVisual />
      </section>
      <Dialog open={isDemoOpen} onOpenChange={(open) => (open ? setIsDemoOpen(true) : closeDemo())}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-6xl rounded-3xl border-primary/30 bg-[#030914]/95 p-3 shadow-[0_0_80px_rgba(0,217,255,.22)] backdrop-blur-2xl sm:p-5">
          <DialogTitle className="font-mono text-xs uppercase tracking-[.18em] text-primary">
            Silent Talk / Product Demo
          </DialogTitle>
          <video
            ref={demoVideoRef}
            src="/videos/silent-talk-demo.mp4"
            controls
            playsInline
            preload="metadata"
            className="max-h-[78vh] w-full aspect-video rounded-2xl bg-black object-contain"
          />
          <button type="button" onClick={closeDemo} className="sr-only">
            Close demo
          </button>
        </DialogContent>
      </Dialog>
      <section className="border-y border-border/60 bg-surface/35">
        <div className="mx-auto grid max-w-[1440px] gap-px px-5 py-16 sm:grid-cols-3 lg:px-10">
          {features.map(([Icon, title, text], i) => (
            <motion.article
              key={title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              viewport={{ once: true }}
              className="border-border p-6 sm:border-r last:border-0"
            >
              <Icon className="size-6 text-primary" />
              <h2 className="mt-5 font-display text-lg font-semibold uppercase">{title}</h2>
              <p className="mt-3 leading-7 text-muted-foreground">{text}</p>
            </motion.article>
          ))}
        </div>
      </section>
      <section className="page-wrap grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
        <div>
          <SectionLabel>01 / The mission</SectionLabel>
          <h2 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">
            A clearer way to be heard.
          </h2>
          <p className="mt-5 max-w-lg leading-8 text-muted-foreground">
            Silent Talk gives essential communication a direct path from gesture to language,
            designed around dignity, clarity, and the realities of healthcare.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <article className="panel p-6">
            <ShieldCheck className="text-primary" />
            <h3 className="mt-6 font-display text-xl font-semibold">Built for trust</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              A transparent interface keeps the current message and system state visible.
            </p>
          </article>
          <article className="panel p-6">
            <BrainCircuit className="text-accent" />
            <h3 className="mt-6 font-display text-xl font-semibold">Designed for focus</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              A calm workspace turns recognition into an understandable conversation.
            </p>
          </article>
        </div>
      </section>
      <section className="border-y border-border/60 bg-surface/30">
        <div className="page-wrap grid gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <div className="panel corner-frame p-8">
            <SectionLabel>02 / Recognition preview</SectionLabel>
            <div className="mt-10 flex items-center justify-center gap-5">
              <span className="grid size-16 place-items-center rounded-full border border-primary/40 bg-primary/10 text-primary">
                <Hand />
              </span>
              <span className="h-px w-14 bg-gradient-to-r from-primary to-accent" />
              <span className="grid size-16 place-items-center rounded-full border border-accent/40 bg-accent/10 text-accent">
                <MessageSquareText />
              </span>
              <span className="h-px w-14 bg-gradient-to-r from-accent to-primary" />
              <span className="grid size-16 place-items-center rounded-full border border-primary/40 bg-primary/10 text-primary">
                <Volume2 />
              </span>
            </div>
            <p className="mt-8 text-center font-mono text-xs uppercase tracking-[.16em] text-muted-foreground">
              Capture / interpret / communicate
            </p>
          </div>
          <div>
            <SectionLabel>03 / Made for care</SectionLabel>
            <h2 className="mt-4 font-display text-4xl font-semibold">
              Healthcare communication, with less friction.
            </h2>
            <p className="mt-5 leading-8 text-muted-foreground">
              Quick needs, history, speech output, and emergency communication live together in the
              patient workspace.
            </p>
          </div>
        </div>
      </section>
      <section className="page-wrap">
        <SectionLabel>03 / Communication without barriers</SectionLabel>
        <h2 className="mt-4 max-w-3xl font-display text-4xl font-semibold sm:text-5xl">
          Communication should have no barriers.
        </h2>
        <div className="relative mt-10 grid gap-4 md:grid-cols-3">
          {[
            [Hand, "SIGN", "Gesture captured with clarity."],
            [BrainCircuit, "TEXT", "Recognition becomes readable language."],
            [Volume2, "VOICE", "The message is ready to be heard."],
          ].map(([Icon, title, text], index) => (
            <motion.article
              key={title as string}
              initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="holo-card relative p-7"
            >
              <span className="font-mono text-xs text-primary">0{index + 1} / SIGNAL</span>
              <div className="mt-8 grid size-16 place-items-center rounded-2xl border border-primary/30 bg-primary/10 text-primary shadow-glow">
                <Icon className="size-8" />
              </div>
              <h3 className="mt-6 font-display text-2xl font-semibold">{title as string}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{text as string}</p>
              {index < 2 && (
                <span className="energy-line absolute -right-5 top-1/2 z-10 hidden h-px w-6 md:block" />
              )}
            </motion.article>
          ))}
        </div>
      </section>
      <section className="page-wrap">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <SectionLabel>04 / The system</SectionLabel>
            <h2 className="mt-4 font-display text-4xl font-semibold">
              The technology behind Silent Talk.
            </h2>
          </div>
          <Sparkles className="size-8 text-primary" />
        </div>
        <div className="mt-10">
          <TechnologyStack />
        </div>
      </section>
      <section className="border-t border-primary/15 bg-gradient-to-r from-primary/10 via-transparent to-accent/10">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-8 px-5 py-20 sm:flex-row sm:items-center lg:px-10">
          <div>
            <SectionLabel>05 / Begin a conversation</SectionLabel>
            <h2 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">
              Your hands already have a voice.
            </h2>
          </div>
          <Button asChild size="lg" className="neon-button">
            <Link to="/patient">
              Enter Patient Mode <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function HeroVisual() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="hero-visual relative mx-auto w-full max-w-[640px]"
    >
      <HolographicHand />
    </motion.div>
  );
}
