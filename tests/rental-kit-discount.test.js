import test from 'node:test';
import assert from 'node:assert/strict';
import { exactRentalKit } from '../src/utils/rental-kit-discount.js';
import { expandContractItems } from '../server/contract-kit-items.js';
const catalog = [
  { id: 'a', preco: 50 },
  { id: 'b', preco: 60 },
  {
    id: 'kit',
    nome: 'Kit festa',
    is_kit: true,
    preco: 100,
    kit_items: [
      { equipment_id: 'a', quantity: 2 },
      { equipment_id: 'b', quantity: 1 },
    ],
  },
];
const items = [
  { equipment_id: 'a', quantity: 2 },
  { equipment_id: 'b', quantity: 1 },
];

test('desconto exige os mesmos equipamentos e quantidades exatas', () => {
  const offer = exactRentalKit(items, catalog);
  assert.equal(offer.price, 100);
  assert.equal(offer.fullPrice, 160);
  assert.equal(offer.rate, 0.375);
  assert.equal(exactRentalKit([{ equipment_id: 'a', quantity: 1 }, items[1]], catalog), null);
  assert.equal(exactRentalKit([...items, { equipment_id: 'extra', quantity: 1 }], catalog), null);
  assert.equal(exactRentalKit([{ equipment_id: 'kit', quantity: 1 }], catalog), null);
  assert.equal(
    exactRentalKit(
      [
        { equipment_id: 'a', quantity: 1 },
        { equipment_id: 'a', quantity: 1 },
      ],
      catalog,
    ),
    null,
  );
  assert.equal(exactRentalKit([], catalog), null);
});

test('kits equivalentes oferecem o preço mais baixo e distribuem centavos exatos', () => {
  const cheap = { ...catalog[2], id: 'cheap', preco: 99.99 };
  const offer = exactRentalKit(items, [...catalog, cheap]);
  assert.equal(offer.id, 'cheap');
  assert.equal(
    Object.values(offer.lineTotals).reduce((sum, value) => sum + Math.round(value * 100), 0),
    9999,
  );
  const contract = expandContractItems(
    items.map((item) => ({
      name: item.equipment_id,
      quantity: item.quantity,
      unit_price: catalog.find((row) => row.id === item.equipment_id).preco,
      unit_cost: 500,
      stock_items: [{ contract_line_total: offer.lineTotals[item.equipment_id] }],
    })),
    [],
  );
  assert.equal(
    contract.reduce((sum, item) => sum + Math.round(item.unit_price * 100) * item.quantity, 0),
    9999,
  );
  assert.ok(contract.every((item) => item.unit_cost === 500));
});

import { selectRentalKit } from '../src/utils/rental-kit-discount.js';

test('selecionar kit troca a linha por peças e suas quantidades', () => {
  const expanded = selectRentalKit([{ equipment_id: '', quantity: 1 }], 0, 'kit', catalog);
  assert.deepEqual(expanded, [
    { equipment_id: 'a', quantity: 2 },
    { equipment_id: 'b', quantity: 1 },
  ]);
  assert.equal(exactRentalKit(expanded, catalog).price, 100);
});

test('kit soma peças existentes sem duplicar linhas e respeita quantidade selecionada', () => {
  const expanded = selectRentalKit(
    [
      { equipment_id: 'a', quantity: 1 },
      { equipment_id: '', quantity: 2 },
    ],
    1,
    'kit',
    catalog,
  );
  assert.deepEqual(expanded, [
    { equipment_id: 'a', quantity: 5 },
    { equipment_id: 'b', quantity: 2 },
  ]);
});

test('seleção no cadastro compartilha máquina de fumaça como na sacola', () => {
  const smokeCatalog = [
    { id: 'smoke', nome: 'Máquina de fumaça', preco: 50 },
    { id: 'light', nome: 'Luz', preco: 50 },
    {
      id: 'kit',
      is_kit: true,
      kit_items: [
        { equipment_id: 'smoke', quantity: 1 },
        { equipment_id: 'light', quantity: 2 },
      ],
    },
  ];
  assert.deepEqual(
    selectRentalKit(
      [
        { equipment_id: 'smoke', quantity: 1 },
        { equipment_id: '', quantity: 1 },
      ],
      1,
      'kit',
      smokeCatalog,
    ),
    [
      { equipment_id: 'smoke', quantity: 1 },
      { equipment_id: 'light', quantity: 2 },
    ],
  );
});

import { rentalKitDiscount } from '../src/utils/rental-kit-discount.js';

test('cadastro usa os mesmos descontos da sacola com máquina de fumaça compartilhada', () => {
  const rows = [
    { id: 'smoke', nome: 'Máquina de fumaça', preco: 50 },
    { id: 'a', nome: 'Luz A', preco: 50 },
    { id: 'b', nome: 'Luz B', preco: 50 },
    { id: 'extra', nome: 'Extra', preco: 20 },
    {
      id: 'kit-a',
      nome: 'Kit A',
      is_kit: true,
      preco: 90,
      kit_items: [
        { equipment_id: 'smoke', quantity: 1 },
        { equipment_id: 'a', quantity: 1 },
      ],
    },
    {
      id: 'kit-b',
      nome: 'Kit B',
      is_kit: true,
      preco: 95,
      kit_items: [
        { equipment_id: 'smoke', quantity: 1 },
        { equipment_id: 'b', quantity: 1 },
      ],
    },
  ];
  const items = [
    { equipment_id: 'smoke', quantity: 1 },
    { equipment_id: 'a', quantity: 1 },
    { equipment_id: 'b', quantity: 1 },
    { equipment_id: 'extra', quantity: 1 },
  ];
  const result = rentalKitDiscount(items, rows);
  assert.equal(result.rate, 0.125);
  assert.equal(result.price, 151.25);
  assert.equal(result.fullPrice, 170);
  assert.equal(result.appliedKits.length, 2);
  assert.equal(result.lineTotals.extra, 20);
  assert.equal(
    Object.values(result.lineTotals).reduce((sum, value) => sum + Math.round(value * 100), 0),
    15125,
  );
  assert.equal(
    rentalKitDiscount(
      items.filter((item) => item.equipment_id !== 'smoke'),
      rows,
    ),
    null,
  );
  const repeated = rentalKitDiscount(
    [
      { equipment_id: 'smoke', quantity: 1 },
      { equipment_id: 'a', quantity: 2 },
    ],
    rows,
  );
  assert.equal(repeated.rate, 0.1);
  assert.equal(repeated.price, 135);
  assert.equal(repeated.appliedKits[0].quantity, 2);
});
