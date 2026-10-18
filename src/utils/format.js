import { site } from '../data/site.js';

export function money(value) {
    return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
}

export function normalize(value) {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export function whatsappLink(message = site.contactMessage) {
    return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}

export function localDate(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}
