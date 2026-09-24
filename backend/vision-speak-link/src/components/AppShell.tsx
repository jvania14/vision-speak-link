import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Activity, Hand, Menu, MessageCircle, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/", label: "Home" },
  { to: "/patient", label: "Patient Mode" },
  { to: "/doctor", label: "Doctor Mode" },
  { to: "/asl-library", label: "ASL Library" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/accessibility", label: "Accessibility" },
] as const;

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="group flex items-center gap-3" aria-label="Silent Talk home">
      <span className="relative grid size-10 place-items-center rounded-xl border border-primary/35 bg-primary/10 text-primary shadow-glow">
        <MessageCircle className="size-5" />
        <Hand className="absolute -bottom-1 -right-1 size-4 rounded-full bg-background p-0.5 text-accent" />
      </span>
      {!compact && (
        <div className="flex flex-col leading-none">
          <span className="font-display text-sm font-bold tracking-[0.18em] text-foreground">
            SILENT TALK
          </span>
          <span className="mt-1 font-mono text-[0.55rem] font-bold tracking-[0.22em] text-primary">
            AI HEALTHCARE
          </span>
        </div>
      )}
    </Link>
  );
}

export function StatusIndicator({ online = false }: { online?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-[0.68rem] font-semibold tracking-[0.14em] text-muted-foreground">
      <span
        className={`size-2 rounded-full ${online ? "bg-success shadow-status" : "bg-warning"}`}
      />
      {online ? "SYSTEM ONLINE" : "SYSTEM STANDBY"}
    </span>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (state) => state.location.pathname });
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="ambient-grid fixed inset-0 pointer-events-none" />
      <header className="sticky top-0 z-40 border-b border-primary/10 bg-[#02070d]/75 px-3 pt-3 backdrop-blur-2xl lg:px-6">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between rounded-2xl border border-primary/15 bg-surface/80 px-4 shadow-panel lg:px-6">
          <BrandMark />
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="nav-link"
                activeProps={{ className: "nav-link nav-link-active" }}
                activeOptions={{ exact: link.to === "/" }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-3 sm:flex">
            <StatusIndicator online={path === "/patient"} />
            <Button asChild size="lg" className="neon-button">
              <Link to="/patient">Start Communication</Link>
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="min-h-11 min-w-11 lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
        <AnimatePresence>
          {open && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-border bg-background px-5 py-4 lg:hidden"
            >
              <div className="flex flex-col gap-2">
                {links.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className="nav-link min-h-11 justify-start"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>
      <main className="relative z-10">{children}</main>
      <footer className="relative z-10 border-t border-border py-8">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <BrandMark compact />
          <span>Communication without barriers.</span>
          <span className="inline-flex items-center gap-2">
            <Activity className="size-4 text-primary" /> Accessibility prototype
          </span>
        </div>
      </footer>
    </div>
  );
}

export function PageIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-4 font-display text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
        {title}
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">{description}</p>
    </div>
  );
}
