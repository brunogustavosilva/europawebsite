// Posições fixas evitam que os flocos mudem quando a página renderiza novamente.
const flakes = Array.from({ length: 36 }, (_, index) => ({
  left: `${(index * 37.7) % 100}%`,
  size: `${3 + (index % 5)}px`,
  duration: `${12 + (index % 9)}s`,
  delay: `${-(index * 1.7)}s`,
  drift: `${((index % 7) - 3) * 18}px`,
  opacity: 0.25 + (index % 5) * 0.12,
}));

export function Snowfall() {
  return (
    <div className="snowfall" aria-hidden="true">
      {flakes.map((flake, index) => (
        <span
          key={index}
          style={{
            left: flake.left,
            width: flake.size,
            height: flake.size,
            animationDuration: flake.duration,
            animationDelay: flake.delay,
            '--snow-drift': flake.drift,
            opacity: flake.opacity,
          }}
        />
      ))}
    </div>
  );
}
