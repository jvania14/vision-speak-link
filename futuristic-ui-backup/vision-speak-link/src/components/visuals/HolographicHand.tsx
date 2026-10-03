import { motion } from "motion/react";
import { EnergyWaves } from "./EnergyWaves";
import { GlowingNode } from "./GlowingNode";
import { OrbitalRings } from "./OrbitalRings";
import { ParticleField } from "./ParticleField";
import { TechHUD } from "./TechHUD";

export function HolographicHand({ className = "" }: { className?: string }) {
  return (
    <div className={`holographic-hand relative aspect-square ${className}`}>
      <ParticleField dense />
      <OrbitalRings />
      <svg
        className="hand-svg absolute inset-[15%] size-[70%] overflow-visible"
        viewBox="0 0 300 360"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <filter id="hand-glow">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="hand-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#16e0d0" />
            <stop offset=".55" stopColor="#00d9ff" />
            <stop offset="1" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <g className="hand-trace" filter="url(#hand-glow)">
          <path
            d="M108 316c-25-9-42-31-45-58l-13-111c-2-17 25-21 29-4l12 58V53c0-18 29-18 29 0v126V33c0-19 30-19 30 0v146V48c0-19 30-19 30 0v137l8-93c2-18 31-16 29 3l-8 121c-3 44-29 82-62 101-15 8-25 8-39-1z"
            stroke="url(#hand-gradient)"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M91 201l30 11 28-11 30 11 31-12M68 245c45 19 95 19 139-2"
            stroke="#8cfaff"
            strokeWidth="1"
            strokeDasharray="5 7"
            opacity=".8"
          />
        </g>
        <g className="hand-landmarks" fill="#d8ffff">
          {[
            [107, 54],
            [137, 34],
            [167, 48],
            [197, 94],
            [83, 202],
            [121, 212],
            [149, 201],
            [179, 212],
            [210, 200],
            [107, 276],
            [145, 290],
            [183, 273],
          ].map(([cx, cy], index) => (
            <circle key={index} cx={cx} cy={cy} r="3" />
          ))}
        </g>
      </svg>
      <div className="ai-core absolute left-1/2 top-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-primary/70 bg-primary/20 font-mono text-[.55rem] text-primary shadow-glow">
        AI
        <br />
        CORE
      </div>
      <GlowingNode x={19} y={30} delay={0.2} />
      <GlowingNode x={79} y={28} color="accent" delay={0.7} />
      <GlowingNode x={24} y={76} delay={1.1} />
      <TechHUD label="AI RECOGNITION" value="REAL TIME" className="absolute left-0 top-[18%]" />
      <TechHUD label="ASL MODEL" value="ACTIVE" className="absolute right-0 top-[24%]" />
      <TechHUD label="VOICE OUTPUT" value="READY" className="absolute bottom-[10%] left-[8%]" />
      <EnergyWaves className="-bottom-8 left-1/2 w-[150%] -translate-x-1/2" />
    </div>
  );
}
