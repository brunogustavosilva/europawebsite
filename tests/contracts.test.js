import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { unzipSync, strFromU8 } from 'fflate';
import { DOMParser } from '@xmldom/xmldom';
import { validateContract, fillContract } from '../server/contracts.js';

const template = new URL('../private/N4119U2.odt', import.meta.url);
const draft = {
    customer_name: 'Cliente de teste & Filho <seguro>', cpf: '000.000.000-00', phone: '(41) 9 9999-9999', address: 'Rua de teste, 100',
    pickup_date: '2026-10-17', return_date: '2026-10-21', pickup_time: '10:30', return_time: '18:45', total: '260', deposit: '20',
    items: [{ name: 'Máquina de fumaça & acessórios', quantity: 1, unit_price: '50', unit_cost: '180' }, { name: 'Spotlight teste', quantity: 3, unit_price: '70', unit_cost: '600' }],
};

test('preenche todos os campos e múltiplas linhas sem alterar o arquivo original', async () => {
    const original = createHash('sha256').update(await readFile(template)).digest('hex');
    const { bytes, html } = await fillContract(validateContract(draft));
    const files = unzipSync(bytes);
    assert.equal(strFromU8(files.mimetype), 'application/vnd.oasis.opendocument.text');
    assert.equal(bytes.readUInt16LE(8), 0, 'Entrada mimetype deve ser descomprimida');
    const xml = strFromU8(files['content.xml']);
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    const textNS = 'urn:oasis:names:tc:opendocument:xmlns:text:1.0';
    const fields = new Map(Array.from(doc.getElementsByTagNameNS(textNS,'user-field-get')).map((node) => [node.getAttributeNS(textNS,'name'),node.textContent]));
    assert.equal(fields.get('nome_cliente'),draft.customer_name);
    assert.equal(fields.get('equipament_name_2'),'Spotlight teste');
    assert.equal(fields.get('quantity_equipament_total_value_2'),'210,00');
    assert.equal(fields.get('full_equipament_value_2'),'600,00');
    assert.equal(fields.get('full_rental_value'),'260,00');
    assert.match(xml,/18:45/);
    assert.ok(!xml.includes('Nome Provisório'));
    assert.ok(!xml.includes('111.222.333.444-55'));
    assert.ok(!files['Thumbnails/thumbnail.png']);
    assert.ok(html.includes('Cliente de teste &amp; Filho &lt;seguro&gt;'));
    assert.ok(html.replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ').includes('8.5. O LOCATÁRIO'));
    assert.equal(createHash('sha256').update(await readFile(template)).digest('hex'),original);
});

test('contrato valida datas, horários, valores e mantém o rascunho independente', () => {
    const before = structuredClone(draft);
    validateContract(draft);
    assert.deepEqual(draft,before);
    assert.throws(() => validateContract({ ...draft, return_date:'2026-10-16' }));
    assert.throws(() => validateContract({ ...draft, deposit:'9999' }));
    assert.throws(() => validateContract({ ...draft, pickup_time:'25:00' }));
    assert.throws(() => validateContract({ ...draft, items:[] }));
    for (const key of ['cpf', 'phone', 'address']) assert.throws(() => validateContract({ ...draft, [key]: '' }));
});
