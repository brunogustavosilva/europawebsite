import { Button } from '../Button.jsx';
import { customerWhatsapp, rentalConfirmation } from './rental-contact.js';

export function RentalContact({ rental }) {
    const contact = customerWhatsapp(rental.phone);
    return <div className="rental-contact">
        <p>Entre em contato com <strong>{rental.customer_name}</strong> pelo WhatsApp.</p>
        <p className="muted">{rental.phone}</p>
        {contact ? <>
            <div className="contract-actions">
                <Button href={contact} target="_blank" rel="noopener noreferrer" variant="secondary">Entrar em contato</Button>
                <Button href={customerWhatsapp(rental.phone, rentalConfirmation(rental))} target="_blank" rel="noopener noreferrer" className="button--whatsapp">Confirmar locação com cliente</Button>
            </div>
            <p className="management-hint">A mensagem será aberta no WhatsApp para você enviar.</p>
        </> : <p role="alert" className="danger">O telefone precisa conter DDD e número válidos para abrir o WhatsApp.</p>}
    </div>;
}
