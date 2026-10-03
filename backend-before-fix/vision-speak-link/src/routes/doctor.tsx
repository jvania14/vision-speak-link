import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, AlertTriangle, Stethoscope, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommunicationHistory, SectionLabel } from "@/components/ProductComponents";
import { useApp } from "@/context/AppContext";

export const Route = createFileRoute("/doctor")({
  head: () => ({
    meta: [
      { title: "Doctor Mode — Silent Talk" },
      {
        name: "description",
        content: "A clear healthcare staff view of the patient's current communication.",
      },
      { property: "og:title", content: "Doctor Mode — Silent Talk" },
      {
        property: "og:description",
        content: "Review and speak the patient's current message and communication history.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DoctorMode,
});
function DoctorMode() {
  const { message, history, speak } = useApp();
  return (
    <div className="page-wrap">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <SectionLabel>Healthcare staff view</SectionLabel>
          <h1 className="mt-3 font-display text-4xl font-semibold uppercase sm:text-5xl">
            Patient communication
          </h1>
          <p className="mt-3 text-muted-foreground">
            Patient communication, presented clearly for faster understanding.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/patient">Switch to Patient Mode</Link>
        </Button>
      </div>
      <div className="mt-8 grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
        <section className="holo-card corner-frame p-6 sm:p-10">
          <div className="flex items-center gap-3 text-primary">
            <Stethoscope />
            <SectionLabel>Patient communication</SectionLabel>
          </div>
          <div className="mt-8 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Current message</p>
            <span className="font-mono text-[.6rem] uppercase tracking-[.14em] text-success">
              <span className="mr-2 inline-block size-2 rounded-full bg-success shadow-status" />
              Live workspace
            </span>
          </div>
          <p className="mt-4 min-h-32 font-display text-4xl font-semibold leading-tight sm:text-6xl">
            “{message || "WAITING FOR PATIENT MESSAGE"}”
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Button
              size="lg"
              className="neon-button"
              disabled={!message}
              onClick={() => speak(message)}
            >
              <Volume2 /> Speak message
            </Button>
            <div className="flex items-end gap-1" aria-hidden="true">
              {[12, 24, 17, 32, 20, 28, 14].map((height, index) => (
                <span
                  key={index}
                  style={{ height }}
                  className="w-1 rounded-full bg-gradient-to-t from-primary to-accent"
                />
              ))}
            </div>
          </div>
        </section>
        <aside className="space-y-5">
          <section className="panel p-6">
            <div className="flex items-center gap-3 text-primary">
              <Activity />
              <SectionLabel>System status</SectionLabel>
            </div>
            <p className="mt-6 font-display text-2xl font-semibold">Communication link active</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              The current patient message is synchronized with the shared workspace.
            </p>
            <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-4/5 bg-gradient-to-r from-primary to-accent" />
            </div>
          </section>
          <section className="emergency-glass rounded-2xl border p-6">
            <AlertTriangle className="text-destructive" />
            <p className="mt-5 font-mono text-[.65rem] tracking-[.15em] text-destructive">
              EMERGENCY STATUS
            </p>
            <p className="mt-2 font-display text-xl font-semibold">Standby</p>
            <p className="mt-2 text-sm text-muted-foreground">
              No emergency message has been triggered.
            </p>
          </section>
        </aside>
      </div>
      <div className="mt-6">
        <CommunicationHistory entries={history} />
      </div>
    </div>
  );
}
