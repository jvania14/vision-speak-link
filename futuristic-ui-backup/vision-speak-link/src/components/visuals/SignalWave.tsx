export function SignalWave({ className = "" }: { className?: string }) {
  const heights = [18, 34, 24, 48, 28, 58, 36, 24, 44, 62, 32, 20, 50, 30, 42, 22, 54, 28, 18, 38];
  return (
    <div
      className={`signal-wave flex items-center justify-center gap-1 ${className}`}
      aria-hidden="true"
    >
      {heights.map((height, index) => (
        <span key={index} style={{ height, animationDelay: `${index * -0.12}s` }} />
      ))}
    </div>
  );
}
