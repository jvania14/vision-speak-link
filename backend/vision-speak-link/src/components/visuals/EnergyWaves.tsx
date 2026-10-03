export function EnergyWaves({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`energy-waves pointer-events-none absolute ${className}`}
      viewBox="0 0 800 240"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="wave-cyan" x1="0" x2="1">
          <stop stopColor="#16e0d0" stopOpacity="0" />
          <stop offset=".48" stopColor="#00d9ff" />
          <stop offset="1" stopColor="#7c4dff" stopOpacity="0" />
        </linearGradient>
        <filter id="wave-glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {[0, 1, 2, 3].map((index) => (
        <path
          key={index}
          className="energy-wave-path"
          style={{ animationDelay: `${index * -0.7}s` }}
          d={`M-20 ${80 + index * 28} C 130 ${10 + index * 28}, 230 ${150 + index * 20}, 390 ${90 + index * 22} S 650 ${40 + index * 30}, 820 ${120 + index * 18}`}
          stroke="url(#wave-cyan)"
          strokeWidth={index === 1 ? 2 : 1}
          filter="url(#wave-glow)"
        />
      ))}
    </svg>
  );
}
