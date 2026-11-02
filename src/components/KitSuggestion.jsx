import { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext.jsx';
import { suggestCartKit } from '../utils/cart-kits.js';

function Suggestion({ suggestion }) {
  const [index, setIndex] = useState(0);
  const { changeQuantity } = useCart();
  useEffect(() => {
    if (suggestion.missing.length < 2) return;
    const timer = window.setInterval(
      () => setIndex((value) => (value + 1) % suggestion.missing.length),
      5000,
    );
    return () => window.clearInterval(timer);
  }, [suggestion.missing.length]);
  const percent = (suggestion.discountRate * 100).toLocaleString('pt-BR', {
    maximumFractionDigits: 2,
  });
  return (
    <aside className="kit-suggestion" aria-label="Sugestão de kit">
      <small>
        Falta{suggestion.missingCount > 1 ? 'm' : ''} {suggestion.missingCount}{' '}
        {suggestion.missingCount > 1 ? 'itens' : 'item'} para completar {suggestion.name}
      </small>
      <div className="kit-suggestion-messages">
        {suggestion.missing.map((item, position) => (
          <div
            key={item.id}
            className={`kit-suggestion-item ${position === index ? 'is-active' : ''}`}
            aria-hidden={position !== index ? true : undefined}
            inert={position !== index ? true : undefined}
          >
            <p>
              Adicione{' '}
              <strong>
                {item.quantity}× {item.equipment.nome}
              </strong>{' '}
              para desconto de <strong>{percent}%</strong> nos itens dos kits.
            </p>
            <button
              type="button"
              className="text-link"
              onClick={() => changeQuantity(item.id, item.quantity)}
            >
              Adicionar
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}

export function KitSuggestion() {
  const { items, equipamentos } = useCart();
  const suggestion = suggestCartKit(items, equipamentos);
  if (!suggestion) return null;
  const key = JSON.stringify([
    suggestion.kitId,
    suggestion.missing.map(({ id, quantity }) => [id, quantity]),
  ]);
  return <Suggestion key={key} suggestion={suggestion} />;
}
