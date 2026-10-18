import { useCart } from '../context/CartContext.jsx';
import { money } from '../utils/format.js';
import { Modal } from './Modal.jsx';
import { CartItems } from './CartItems.jsx';
import { Button } from './Button.jsx';

export function CartDrawer({ open, onClose }) {
    const { count, total } = useCart();

    return (
        <Modal open={open} onClose={onClose} title="Sua sacola">
            <CartItems />
            <footer className="cart-summary">
                <div className="total-row"><span>Total dos equipamentos</span><strong>{money(total)}</strong></div>
                {count > 0 && <Button href="/locacao">Continuar locação ↗</Button>}
                <p className="muted">Disponibilidade e serviços confirmados pela equipe.</p>
            </footer>
        </Modal>
    );
}
