import { motion } from "motion/react";

const particles = Array.from({ length: 28 }, (_, index) => ({
  left: (index * 37) % 96,
  top: (index * 61) % 92,
  delay: (index % 9) * 0.25,
  size: index % 5 === 0 ? 3 : 2,
}));

export function ParticleField({ dense = false }: { dense?: boolean }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${dense ? "opacity-90" : "opacity-60"}`}
      aria-hidden="true"
    >
      {particles.map((particle, index) => (
        <motion.span
          key={index}
          className="absolute rounded-full bg-primary"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{ y: [0, -16, 0], x: [0, index % 2 ? 8 : -8, 0], opacity: [0.15, 0.9, 0.15] }}
          transition={{ duration: 4 + (index % 4), repeat: Infinity, delay: particle.delay }}
        />
      ))}
    </div>
  );
}
