import { GlowingNode } from "./GlowingNode";

export function NeuralNetwork() {
  return (
    <div
      className="neural-network relative aspect-[1.7] w-full overflow-hidden rounded-2xl"
      aria-hidden="true"
    >
      <svg className="absolute inset-0 size-full" viewBox="0 0 600 350" preserveAspectRatio="none">
        <g className="neural-lines">
          {[
            [60, 70, 240, 150],
            [60, 270, 240, 150],
            [240, 150, 390, 70],
            [240, 150, 390, 260],
            [390, 70, 540, 170],
            [390, 260, 540, 170],
          ].map(([x1, y1, x2, y2], index) => (
            <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} />
          ))}
        </g>
      </svg>
      <GlowingNode x={10} y={20} delay={0.2} />
      <GlowingNode x={10} y={77} delay={0.6} />
      <GlowingNode x={40} y={43} color="accent" />
      <GlowingNode x={65} y={20} delay={0.9} />
      <GlowingNode x={65} y={74} color="accent" delay={0.4} />
      <GlowingNode x={90} y={48} />
    </div>
  );
}
