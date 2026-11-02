import test from 'node:test';
import assert from 'node:assert/strict';
import { expandContractItems } from '../server/contract-kit-items.js';

test('contrato expande peças com desconto e valores de reposição individuais', () => {
  const parts = [
    { equipment_id: 'light', quantity: 2, name: 'Luz original', unit_price: 50, unit_cost: 300 },
    { equipment_id: 'smoke', quantity: 1, name: 'Fumaça', unit_price: 100, unit_cost: 800 },
  ];
  const items = expandContractItems(
    [{ is_kit: true, quantity: 2, unit_price: 150, stock_items: parts }],
    [{ id: 'light', nome: 'Nome alterado', preco: 999, unit_cost: 999 }],
  );
  assert.deepEqual(items, [
    { name: 'Luz original', quantity: 4, unit_price: 37.5, unit_cost: 300 },
    { name: 'Fumaça', quantity: 2, unit_price: 75, unit_cost: 800 },
  ]);
});

test('rateio mantém total exato mesmo quando o preço não divide pela quantidade', () => {
  for (const price of [0, 1, 10.01, 100]) {
    const items = expandContractItems(
      [
        {
          is_kit: true,
          quantity: 1,
          unit_price: price,
          stock_items: [
            { equipment_id: 'a', quantity: 3 },
            { equipment_id: 'b', quantity: 7 },
          ],
        },
      ],
      [
        { id: 'a', nome: 'A', preco: 0, unit_cost: 1 },
        { id: 'b', nome: 'B', preco: 0, unit_cost: 2 },
      ],
    );
    assert.equal(
      items.reduce((sum, item) => sum + Math.round(item.unit_price * 100) * item.quantity, 0),
      Math.round(price * 100),
    );
    assert.equal(
      items.reduce((sum, item) => sum + item.quantity, 0),
      10,
    );
  }
});

test('locações avulsas continuam com seu valor próprio', () => {
  assert.deepEqual(
    expandContractItems([{ name: 'Luz', quantity: 2, unit_price: '50', unit_cost: '300' }], []),
    [{ name: 'Luz', quantity: 2, unit_price: 50, unit_cost: 300 }],
  );
});
