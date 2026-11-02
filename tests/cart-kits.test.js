import test from 'node:test';
import assert from 'node:assert/strict';
import { expandCartKits } from '../src/utils/cart-kits.js';

const catalog = [
  { id: 'light', preco: 50 },
  { id: 'smoke', preco: 60 },
  {
    id: 'kit',
    is_kit: true,
    preco: 100,
    kit_items: [
      { equipment_id: 'light', quantity: 1 },
      { equipment_id: 'smoke', quantity: 1 },
    ],
  },
];

test('adicionar kit expande suas peças e soma itens avulsos existentes', () => {
  assert.deepEqual(
    expandCartKits(
      [
        { id: 'light', quantity: 2 },
        { id: 'kit', quantity: 2 },
      ],
      catalog,
    ),
    [
      { id: 'light', quantity: 4 },
      { id: 'smoke', quantity: 2 },
    ],
  );
});

test('normalizar sacola antiga com kits é idempotente e mantém peças editáveis', () => {
  const expanded = expandCartKits([{ id: 'kit', quantity: 1 }], catalog);
  assert.deepEqual(expandCartKits(expanded, catalog), expanded);
  assert.deepEqual(
    expandCartKits(
      expanded.filter((item) => item.id !== 'light'),
      catalog,
    ),
    [{ id: 'smoke', quantity: 1 }],
  );
});

import { priceCartKits } from '../src/utils/cart-kits.js';

test('kit de 110 por 100 e montagem manual têm o mesmo desconto', () => {
  for (const items of [
    [{ id: 'kit', quantity: 1 }],
    [
      { id: 'light', quantity: 1 },
      { id: 'smoke', quantity: 1 },
    ],
  ]) {
    const result = priceCartKits(items, catalog);
    assert.equal(result.total, 100);
    assert.equal(result.subtotal, 110);
    assert.equal(result.discount, 10);
    assert.equal(result.items.length, 2);
    assert.equal(result.appliedKits.length, 1);
  }
});

test('repetir kit mantém percentual e extras incompletos não ganham desconto', () => {
  const repeated = priceCartKits([{ id: 'kit', quantity: 2 }], catalog);
  assert.equal(repeated.total, 200);
  assert.equal(repeated.discount, 20);
  assert.equal(repeated.discountRate, 10 / 110);
  const extra = priceCartKits(
    [
      { id: 'kit', quantity: 1 },
      { id: 'light', quantity: 1 },
    ],
    catalog,
  );
  assert.equal(extra.total, 150);
  assert.equal(extra.discount, 10);
  assert.equal(extra.items.find((item) => item.id === 'light').eligibleQuantity, 1);
  assert.equal(priceCartKits([{ id: 'light', quantity: 1 }], catalog).discount, 0);
});

const combinedCatalog = [
  { id: 'a', preco: 50 },
  { id: 'b', preco: 50 },
  { id: 'c', preco: 40 },
  { id: 'd', preco: 60 },
  { id: 'extra', preco: 20 },
  {
    id: 'kit10',
    nome: 'Kit 10%',
    is_kit: true,
    preco: 90,
    kit_items: [
      { equipment_id: 'a', quantity: 1 },
      { equipment_id: 'b', quantity: 1 },
    ],
  },
  {
    id: 'kit5',
    nome: 'Kit 5%',
    is_kit: true,
    preco: 95,
    kit_items: [
      { equipment_id: 'c', quantity: 1 },
      { equipment_id: 'd', quantity: 1 },
    ],
  },
];

test('kits de 10% e 5% aplicam 12,5% apenas às peças correspondentes', () => {
  const result = priceCartKits(
    [
      { id: 'kit10', quantity: 1 },
      { id: 'kit5', quantity: 1 },
      { id: 'extra', quantity: 1 },
    ],
    combinedCatalog,
  );
  assert.equal(result.discountRate, 0.125);
  assert.equal(result.discount, 25);
  assert.equal(result.subtotal, 220);
  assert.equal(result.total, 195);
  assert.equal(result.items.find((item) => item.id === 'extra').lineDiscount, 0);
  assert.equal(
    result.items.reduce((sum, item) => sum + Math.round(item.lineTotal * 100), 0),
    19500,
  );
});

test('remover uma peça desfaz somente a elegibilidade que dependia dela', () => {
  const result = priceCartKits(
    [
      { id: 'a', quantity: 1 },
      { id: 'c', quantity: 1 },
      { id: 'd', quantity: 1 },
    ],
    combinedCatalog,
  );
  assert.equal(result.discountRate, 0.05);
  assert.equal(result.total, 145);
});

test('kits sobrepostos não contam a mesma peça duas vezes', () => {
  const result = priceCartKits(
    [{ id: 'kit', quantity: 1 }],
    [...catalog, { ...catalog[2], id: 'kit2', preco: 105 }],
  );
  assert.equal(result.appliedKits.length, 1);
  assert.equal(result.total, 100);
});

test('sem preço promocional não há desconto e os centavos sempre fecham', () => {
  assert.equal(
    priceCartKits(
      [{ id: 'kit', quantity: 1 }],
      catalog.map((row) => (row.id === 'kit' ? { ...row, preco: 110 } : row)),
    ).discount,
    0,
  );
  for (const preco of [0, 99.99, 100.01, 109.99]) {
    const result = priceCartKits(
      [{ id: 'kit', quantity: 3 }],
      catalog.map((row) => (row.id === 'kit' ? { ...row, preco } : row)),
    );
    assert.equal(Math.round(result.total * 100), Math.round(preco * 100) * 3);
    assert.equal(
      result.items.reduce((sum, item) => sum + Math.round(item.lineTotal * 100), 0),
      Math.round(result.total * 100),
    );
  }
});

test('kits compartilham uma máquina de fumaça sem perder os descontos', () => {
  const catalog = [
    { id: 'smoke', nome: 'Máquina de fumaça', preco: 50 },
    { id: 'a', nome: 'Luz', preco: 50 },
    { id: 'b', nome: 'Som', preco: 50 },
    {
      id: 'kit-a',
      is_kit: true,
      preco: 90,
      kit_items: [
        { equipment_id: 'smoke', quantity: 1 },
        { equipment_id: 'a', quantity: 1 },
      ],
    },
    {
      id: 'kit-b',
      is_kit: true,
      preco: 95,
      kit_items: [
        { equipment_id: 'smoke', quantity: 1 },
        { equipment_id: 'b', quantity: 1 },
      ],
    },
  ];
  const first = expandCartKits([{ id: 'kit-a', quantity: 1 }], catalog);
  const expanded = expandCartKits([...first, { id: 'kit-b', quantity: 1 }], catalog);
  assert.equal(expanded.find((item) => item.id === 'smoke').quantity, 1);
  const result = priceCartKits(expanded, catalog);
  assert.equal(result.appliedKits.length, 2);
  assert.equal(result.discountRate, 0.125);
  assert.equal(result.subtotal, 150);
  assert.equal(result.total, 131.25);
  assert.equal(result.items.find((item) => item.id === 'smoke').eligibleQuantity, 1);
  assert.equal(
    priceCartKits(
      expanded.filter((item) => item.id !== 'smoke'),
      catalog,
    ).discount,
    0,
  );
  const manual = expandCartKits([...expanded, { id: 'smoke', quantity: 1 }], catalog);
  assert.equal(manual.find((item) => item.id === 'smoke').quantity, 2);
  const again = expandCartKits([...manual, { id: 'kit-b', quantity: 1 }], catalog);
  assert.equal(again.find((item) => item.id === 'smoke').quantity, 2);
});

import { suggestCartKit } from '../src/utils/cart-kits.js';

test('sugestão prioriza um item faltante e depois o kit mais barato', () => {
  const physical = [
    { id: 'a', preco: 50 },
    { id: 'b', preco: 50 },
    { id: 'c', preco: 50 },
  ];
  const kit = (id, preco, parts) => ({
    id,
    nome: id,
    is_kit: true,
    preco,
    kit_items: parts.map((equipment_id) => ({ equipment_id, quantity: 1 })),
  });
  const catalog = [
    ...physical,
    kit('cheap-two', 60, ['a', 'b', 'c']),
    kit('expensive-one', 90, ['a', 'b']),
    kit('cheaper-one', 80, ['a', 'c']),
  ];
  const result = suggestCartKit([{ id: 'a', quantity: 1 }], catalog);
  assert.equal(result.kitId, 'cheaper-one');
  assert.equal(result.missingCount, 1);
  assert.equal(result.missing[0].id, 'c');
  assert.equal(result.discountRate, 0.2);
});

test('sugestão ignora sacola vazia, kit completo e três itens faltantes', () => {
  assert.equal(suggestCartKit([], catalog), null);
  assert.equal(suggestCartKit([{ id: 'kit', quantity: 1 }], catalog), null);
  const largeKit = {
    ...catalog[2],
    id: 'large',
    kit_items: [
      { equipment_id: 'light', quantity: 1 },
      { equipment_id: 'smoke', quantity: 3 },
    ],
  };
  assert.equal(
    suggestCartKit([{ id: 'light', quantity: 1 }], [...catalog.slice(0, 2), largeKit]),
    null,
  );
});

test('dois itens faltantes são retornados com nomes e quantidades para alternância', () => {
  const kit = {
    ...catalog[2],
    kit_items: [
      { equipment_id: 'light', quantity: 2 },
      { equipment_id: 'smoke', quantity: 1 },
    ],
  };
  const result = suggestCartKit([{ id: 'light', quantity: 1 }], [...catalog.slice(0, 2), kit]);
  assert.equal(result.missingCount, 2);
  assert.deepEqual(
    result.missing.map(({ id, quantity }) => ({ id, quantity })),
    [
      { id: 'light', quantity: 1 },
      { id: 'smoke', quantity: 1 },
    ],
  );
});
