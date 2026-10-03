import { motion } from "motion/react";

export function OrbitalRings({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`orbital-rings absolute inset-0 ${compact ? "scale-75" : ""}`}
      aria-hidden="true"
    >
      <motion.span
        className="orbit orbit-a"
        animate={{ rotate: 360 }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
      />
      <motion.span
        className="orbit orbit-b"
        animate={{ rotate: -360 }}
        transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
      />
      <motion.span
        className="orbit orbit-c"
        animate={{ rotate: 360 }}
        transition={{ duration: 44, repeat: Infinity, ease: "linear" }}
      />
      <span className="orbit-core" />
    </div>
  );
}
