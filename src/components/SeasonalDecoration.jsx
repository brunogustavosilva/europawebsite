import { useEffect, useState } from 'react';
import { holidaySeason } from '../utils/season.js';

export function SeasonalDecoration() {
  const [season, setSeason] = useState(() => holidaySeason());
  useEffect(() => {
    const timer = window.setInterval(() => setSeason(holidaySeason()), 60000);
    return () => window.clearInterval(timer);
  }, []);
  if (!season) return null;
  const christmas = season === 'christmas';
  return (
    <aside
      className={`seasonal-banner seasonal-banner--${season}`}
      aria-label={christmas ? 'Mensagem de Natal' : 'Mensagem de Ano Novo'}
    >
      <span className="seasonal-emojis" aria-hidden="true">
        {christmas ? '🎅 🎄' : '🎉 🥂'}
      </span>
      <div>
        <strong>{christmas ? 'Um Natal cheio de luz!' : 'Feliz Ano Novo!'}</strong>
        <p>
          {christmas
            ? 'Que sua festa brilhe com momentos especiais.'
            : 'Que venham novos motivos para celebrar.'}
        </p>
      </div>
      <span className="seasonal-emojis" aria-hidden="true">
        {christmas ? '⭐' : '🎆'}
      </span>
      {!christmas && (
        <div className="seasonal-fireworks" aria-hidden="true">
          {[0, 1, 2].map((burst) => (
            <span className="seasonal-burst" key={burst} style={{ '--burst': burst }}>
              {Array.from({ length: 8 }, (_, ray) => (
                <i key={ray} style={{ '--ray': ray }} />
              ))}
            </span>
          ))}
        </div>
      )}
    </aside>
  );
}
