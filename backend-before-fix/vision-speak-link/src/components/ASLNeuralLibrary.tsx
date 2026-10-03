import { motion } from "motion/react";
import { ArrowUpRight, BrainCircuit, Hand, ScanLine, X } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SectionLabel } from "@/components/ProductComponents";

type Gesture = { letter: string; type: "static" | "dynamic"; image: string };

type Filter = "all" | "static" | "dynamic" | "reference";

const ASL_GESTURES: Gesture[] = Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ", (letter) => ({
  letter,
  type: letter === "J" || letter === "Z" ? "dynamic" : "static",
  image: `/asl/${letter}.webp`,
}));

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "A - Z" },
  { id: "static", label: "STATIC GESTURES" },
  { id: "dynamic", label: "DYNAMIC GESTURES" },
  { id: "reference", label: "AI REFERENCE" },
];

function GestureVisual({ gesture }: { gesture: Gesture }) {
  const [assetAvailable, setAssetAvailable] = useState(true);
  return (
    <div className="relative flex aspect-[1.15] items-center justify-center overflow-hidden rounded-xl border border-primary/10 bg-[#020914]/80">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,217,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(0,217,255,.06)_1px,transparent_1px)] bg-[size:22px_22px]" />
      {assetAvailable ? (
        <img
          src={gesture.image}
          alt={`Verified ASL ${gesture.letter} hand reference`}
          className="relative z-10 h-full w-full object-contain p-3 opacity-90 transition duration-300 group-hover:scale-105 group-hover:opacity-100"
          onError={() => setAssetAvailable(false)}
        />
      ) : (
        <div className="relative z-10 flex flex-col items-center gap-3 px-4 text-center">
          <Hand
            className={gesture.type === "dynamic" ? "size-12 text-accent" : "size-12 text-primary"}
            strokeWidth={1}
          />
          <span className="font-mono text-[.55rem] tracking-[.14em] text-muted-foreground">
            VERIFIED VISUAL ASSET PENDING
          </span>
        </div>
      )}
      <span
        className={`scan-sheen absolute inset-y-0 left-0 w-1/3 ${gesture.type === "dynamic" ? "bg-accent/10" : "bg-primary/10"}`}
      />
      {gesture.type === "dynamic" && (
        <span className="absolute right-3 top-3 flex items-center gap-1 font-mono text-[.55rem] text-accent">
          <ArrowUpRight className="size-3" /> MOTION
        </span>
      )}
    </div>
  );
}

export function ASLNeuralLibrary() {
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Gesture | null>(null);
  const visibleGestures = ASL_GESTURES.filter(
    (gesture) => filter === "all" || filter === "reference" || gesture.type === filter,
  );

  return (
    <section className="relative overflow-hidden border-y border-primary/15 bg-[#030914]/70 py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(0,217,255,.11),transparent_28%),radial-gradient(circle_at_90%_70%,rgba(124,77,255,.13),transparent_30%)]" />
      <div className="relative mx-auto max-w-[1440px] px-5 lg:px-10">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <SectionLabel>05 / Computer vision reference system</SectionLabel>
            <h2 className="mt-4 font-display text-4xl font-semibold uppercase sm:text-6xl">
              ASL Neural Library
            </h2>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              Explore the hand-language patterns recognized by Silent Talk.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:w-[34rem]">
            <div className="holo-card rounded-xl p-4">
              <BrainCircuit className="size-5 text-primary" />
              <p className="mt-4 font-mono text-[.58rem] tracking-[.14em] text-primary">
                AI VISION MODEL
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Recognizes 26 ASL handshapes</p>
            </div>
            <div className="holo-card rounded-xl p-4">
              <ScanLine className="size-5 text-accent" />
              <p className="mt-4 font-mono text-[.58rem] tracking-[.14em] text-accent">
                REAL HAND PATTERNS
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Visual reference for ASL alphabet gestures
              </p>
            </div>
          </div>
        </div>
        <div className="mt-10 flex flex-wrap gap-2" role="group" aria-label="ASL library filters">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-full border px-4 py-2 font-mono text-[.6rem] tracking-[.14em] transition ${filter === item.id ? "border-primary/60 bg-primary/15 text-primary shadow-glow" : "border-border/70 bg-surface/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <motion.div
          layout
          className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 xl:grid-cols-8"
        >
          {visibleGestures.map((gesture, index) => (
            <motion.button
              type="button"
              layout
              key={gesture.letter}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.025 }}
              onClick={() => setSelected(gesture)}
              className={`group relative overflow-hidden rounded-2xl border bg-[#071321]/80 p-3 text-left transition duration-300 hover:-translate-y-1 hover:shadow-[0_0_28px_rgba(0,217,255,.2)] ${gesture.type === "dynamic" ? "border-accent/30 hover:border-accent/70" : "border-primary/20 hover:border-primary/60"}`}
            >
              <div className="absolute right-3 top-3 font-mono text-[.55rem] text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </div>
              <GestureVisual gesture={gesture} />
              <div className="mt-3 flex items-end justify-between">
                <span
                  className={`font-display text-3xl font-semibold ${gesture.type === "dynamic" ? "text-accent" : "text-primary"}`}
                >
                  {gesture.letter}
                </span>
                <span className="font-mono text-[.5rem] tracking-[.12em] text-muted-foreground">
                  {gesture.type === "dynamic" ? "DYNAMIC" : "STATIC"}
                </span>
              </div>
              <p className="mt-1 font-mono text-[.52rem] tracking-[.14em] text-muted-foreground">
                ASL ALPHABET
              </p>
              <span className="mt-3 block font-mono text-[.5rem] text-primary opacity-0 transition group-hover:opacity-100">
                VISION PATTERN / OPEN
              </span>
            </motion.button>
          ))}
        </motion.div>
        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-primary/15 bg-primary/10 sm:grid-cols-3">
          <div className="bg-[#061323]/80 p-5">
            <p className="font-display text-3xl text-primary">26</p>
            <p className="mt-2 font-mono text-[.58rem] tracking-[.14em] text-muted-foreground">
              ASL HANDSHAPES
            </p>
          </div>
          <div className="bg-[#061323]/80 p-5">
            <p className="font-display text-3xl text-accent">AI-POWERED</p>
            <p className="mt-2 font-mono text-[.58rem] tracking-[.14em] text-muted-foreground">
              VISION REFERENCE
            </p>
          </div>
          <div className="bg-[#061323]/80 p-5">
            <p className="font-display text-3xl text-primary">BRIGHTER</p>
            <p className="mt-2 font-mono text-[.58rem] tracking-[.14em] text-muted-foreground">
              CONVERSATIONS
            </p>
          </div>
        </div>
      </div>
      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-3xl border-primary/30 bg-[#030914]/95 p-5 shadow-[0_0_60px_rgba(0,217,255,.2)]">
          <DialogTitle className="font-display text-4xl text-primary">
            LETTER: {selected?.letter}
          </DialogTitle>
          {selected && (
            <>
              <GestureVisual gesture={selected} />
              <div className="grid grid-cols-2 gap-3 font-mono text-[.62rem] tracking-[.12em] text-muted-foreground">
                <div>
                  <p className="text-primary">GESTURE TYPE</p>
                  <p className="mt-1 text-foreground">
                    {selected.type === "dynamic" ? "DYNAMIC GESTURE" : "STATIC GESTURE"}
                  </p>
                </div>
                <div>
                  <p className="text-primary">SYSTEM</p>
                  <p className="mt-1 text-foreground">ASL ALPHABET</p>
                </div>
              </div>
              <p className="font-mono text-[.6rem] tracking-[.14em] text-muted-foreground">
                VISUAL REFERENCE / VERIFIED ASSET PENDING
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
