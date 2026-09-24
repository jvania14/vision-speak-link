import { ParticleField } from "./ParticleField";

export function TechHUD({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`tech-hud holo-card relative rounded-xl px-4 py-3 ${className}`}>
      <ParticleField />
      <p className="relative font-mono text-[.56rem] tracking-[.16em] text-primary">{label}</p>
      <p className="relative mt-1 flex items-center gap-2 text-xs font-semibold">
        <span className="size-1.5 animate-pulse rounded-full bg-primary shadow-scan" />
        {value}
      </p>
    </div>
  );
}
