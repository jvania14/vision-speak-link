import { motion } from "motion/react";

export function GlowingNode({
  x = 50,
  y = 50,
  color = "primary",
  delay = 0,
}: {
  x?: number;
  y?: number;
  color?: "primary" | "accent" | "destructive";
  delay?: number;
}) {
  return (
    <motion.span
      className={`visual-node node-${color}`}
      style={{ left: `${x}%`, top: `${y}%` }}
      animate={{ scale: [1, 1.8, 1], opacity: [0.35, 1, 0.35] }}
      transition={{ duration: 2.6, repeat: Infinity, delay }}
    />
  );
}
