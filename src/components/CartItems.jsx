import { PresenceList } from './PresenceList.jsx';
import { useCart } from '../context/CartContext.jsx';
import { money } from '../utils/format.js';

export function CartItems() {
    const { items, changeQuantity, removeItem, catalogStatus } = useCart();

    return (
        <div className="cart-items">
            {catalogStatus !== 'ready' && (
                <p role="status">{catalogStatus === 'loading' ? 'Carregando sua sacola…' : 'Não foi possível carregar os equipamentos. Recarregue a página para tentar novamente.'}</p>
            )}
            {catalogStatus === 'ready' && !items.length && (
                <p className="empty-state">Sua sacola está vazia. Escolha seus equipamentos no catálogo.</p>
            )}
            <PresenceList
                items={items}
                getKey={(item) => item.id}
                as="article"
                className="cart-item"
            >
                {({ equipment, quantity }) => (
                    <>
                        <img src={equipment.imagem} alt={equipment.nome} />
                        <div className="cart-item-info">
                            <h3>{equipment.nome}</h3>
                            <p className="muted">{money(equipment.preco)} / {equipment.periodo}</p>
                            <div className="quantity" aria-label={`Quantidade de ${equipment.nome}`}>
                                <button onClick={() => changeQuantity(equipment.id, -1)} aria-label={`Diminuir ${equipment.nome}`}>−</button>
                                <output aria-live="polite">{quantity}</output>
                                <button onClick={() => changeQuantity(equipment.id, 1)} aria-label={`Aumentar ${equipment.nome}`}>+</button>
                            </div>
                        </div>
                        <div className="cart-item-end">
                            <button className="text-button danger" onClick={() => removeItem(equipment.id)} aria-label={`Remover ${equipment.nome}`}>
                                Remover
                            </button>
                            <strong>{money(equipment.preco * quantity)}</strong>
                        </div>
                    </>
                )}
            </PresenceList>
        </div>
    );
}
