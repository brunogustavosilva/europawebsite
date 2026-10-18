import assert from 'node:assert/strict';
import { customerWhatsapp, rentalConfirmation } from '../src/components/admin/rental-contact.js';
assert.equal(customerWhatsapp('(41) 9 9999-9999'), 'https://wa.me/5541999999999');
assert.equal(customerWhatsapp('+55 (41) 99999-9999'), 'https://wa.me/5541999999999');
assert.equal(customerWhatsapp('123'), null);
const rental = { customer_name: 'João & Maria', rental_date: '2026-10-19', items: [{ name: 'Globo de luz', quantity: 2 }], total: 450, delivery: true, address: 'Rua A, 123' };
const message = rentalConfirmation(rental);
assert.match(message, /João & Maria/);
assert.match(message, /19\/10\/2026/);
assert.match(message, /2× Globo de luz/);
assert.match(message, /450,00/);
assert.match(message, /Com entrega no seguinte endereço: Rua A, 123/);
assert.equal(new URL(customerWhatsapp('41999999999', message)).searchParams.get('text'), message);
assert.ok(!rentalConfirmation({ ...rental, delivery: false }).includes('endereço'));

assert.match(rentalConfirmation({ ...rental, delivery_time: '14:30' }), /Entrega prevista para: 14:30/);
assert.ok(!rentalConfirmation({ ...rental, delivery: false, delivery_time: '14:30' }).includes('14:30'));
