import { useEffect, useState } from 'react';

export function Fireworks() {
  const [burst, setBurst] = useState(null);
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let cleanup;
    const timer = window.setInterval(() => {
      if (motion.matches || document.hidden) return;
      setBurst({ id: Date.now(), left: 20 + Math.random() * 60, top: 18 + Math.random() * 35 });
      window.clearTimeout(cleanup);
      cleanup = window.setTimeout(() => setBurst(null), 3000);
    }, 7000);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(cleanup);
    };
  }, []);
  return (
    <div className="fireworks-overlay" aria-hidden="true">
      {burst &&
        [0, 1, 2, 3, 4].map((index) => (
          <div
            key={`${burst.id}-${index}`}
            className="firework-bloom"
            style={{
              left: `${Math.max(10, Math.min(90, burst.left + (index - 2) * 16))}%`,
              top: `${burst.top + (index === 1 ? -8 : 6)}%`,
              '--firework-delay': `${index * 0.25}s`,
              '--firework-color': ['#ffc857', '#ef91ff', '#76ddff', '#9cffac', '#ff9393'][index],
            }}
          >
            {Array.from({ length: 16 }, (_, ray) => (
              <span
                key={ray}
                style={{
                  '--firework-angle': `${ray * 22.5}deg`,
                  '--firework-distance': `${ray % 2 ? 85 : 120}px`,
                }}
              />
            ))}
          </div>
        ))}
    </div>
  );
}
