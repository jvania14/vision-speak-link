import { createFileRoute } from "@tanstack/react-router";
import { Contrast, Moon, Move, Type, Volume2 } from "lucide-react";
import { PageIntro } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useApp, type TextSize } from "@/context/AppContext";

export const Route = createFileRoute("/accessibility")({
  head: () => ({
    meta: [
      { title: "Accessibility Settings — Silent Talk" },
      {
        name: "description",
        content: "Personalize Silent Talk text, contrast, motion, speech, volume, and appearance.",
      },
      { property: "og:title", content: "Accessibility Settings — Silent Talk" },
      {
        property: "og:description",
        content: "Large, clear controls for a personalized communication experience.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Accessibility,
});
const toggles = [
  {
    key: "highContrast",
    title: "High contrast",
    desc: "Increase separation between text and surfaces.",
    icon: Contrast,
  },
  {
    key: "reducedMotion",
    title: "Reduced motion",
    desc: "Minimize transitions and animated effects.",
    icon: Move,
  },
  {
    key: "speechEnabled",
    title: "Speech output",
    desc: "Allow messages to be spoken aloud.",
    icon: Volume2,
  },
  {
    key: "lightMode",
    title: "Light appearance",
    desc: "Use a brighter interface for daytime viewing.",
    icon: Moon,
  },
] as const;
function Accessibility() {
  const { preferences, updatePreferences } = useApp();
  return (
    <div className="page-wrap">
      <PageIntro
        eyebrow="Personalize your experience / control center"
        title="Accessibility controls"
        description="Choose the presentation and speech settings that make communication clearest for you."
      />
      <div className="mt-12 grid gap-5 lg:grid-cols-2">
        <section className="holo-card p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
              <Type />
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold">Text size</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Adjust the interface reading scale.
              </p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {(
              [
                ["small", "A−"],
                ["default", "A"],
                ["large", "A+"],
              ] as [TextSize, string][]
            ).map(([size, label]) => (
              <Button
                key={size}
                variant={preferences.textSize === size ? "default" : "outline"}
                className={`h-16 text-lg ${preferences.textSize === size ? "neon-button" : ""}`}
                onClick={() => updatePreferences({ textSize: size })}
              >
                {label}
              </Button>
            ))}
          </div>
        </section>
        <section className="holo-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold">Speech volume</h2>
              <p className="mt-2 font-mono text-xs text-primary">
                {Math.round(preferences.volume * 100)} PERCENT
              </p>
            </div>
            <span className="grid size-12 place-items-center rounded-2xl border border-accent/30 bg-accent/10 text-accent">
              <Volume2 />
            </span>
          </div>
          <Slider
            className="mt-9"
            value={[preferences.volume * 100]}
            max={100}
            step={5}
            aria-label="Speech volume"
            onValueChange={(value) => updatePreferences({ volume: (value[0] ?? 85) / 100 })}
          />
        </section>
        {toggles.map(({ key, title, desc, icon: Icon }) => (
          <section key={key} className="holo-card flex items-center justify-between gap-5 p-6">
            <div className="flex gap-4">
              <span className="grid size-12 place-items-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
                <Icon />
              </span>
              <div>
                <h2 className="font-display text-lg font-semibold">{title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </div>
            </div>
            <Switch
              checked={preferences[key]}
              onCheckedChange={(checked) => updatePreferences({ [key]: checked })}
              aria-label={title}
            />
          </section>
        ))}
      </div>
    </div>
  );
}
