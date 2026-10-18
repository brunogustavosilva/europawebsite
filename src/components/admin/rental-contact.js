import { money } from '../../utils/format.js';
import { formatDate } from './helpers.js';

export function customerWhatsapp(phone, message = '') {
    let digits = String(phone || '').replace(/\D/g, '');
    if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
    if (!/^55\d{10,11}$/.test(digits)) return null;
    return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
}

export function rentalConfirmation(rental) {
    const items = rental.items.map(item => `• ${item.quantity}× ${item.name}`).join('\n');
    return `Olá ${rental.customer_name}, essa mensagem está sendo enviada para confirmar sua locação para a data ${formatDate(rental.rental_date)} com os seguintes itens:\n\n${items}\n\nNo total de ${money(Number(rental.total))}.${rental.delivery ? `\n\nCom entrega no seguinte endereço: ${rental.address}.${rental.delivery_time ? ` Entrega prevista para: ${rental.delivery_time}.` : ''}` : ''}`;
}
