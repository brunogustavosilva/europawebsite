import test from 'node:test';
import assert from 'node:assert/strict';
import { kitItems, kitAvailability, stockDemands } from '../server/kits.js';

const pieces = [
  { equipment_id: 'light', quantity: 2 },
  { equipment_id: 'smoke', quantity: 1 },
];
const inventory = [
  { id: 'light', stock: 8, reserved: 3 },
  { id: 'smoke', stock: 3, reserved: 1 },
  { id: 'kit', is_kit: true, kit_items: pieces },
  { id: 'kit2', is_kit: true, kit_items: [{ equipment_id: 'light', quantity: 1 }] },
];

test('kit tem estoque limitado pela peça mais escassa e considera locações avulsas', () => {
  const kit = kitAvailability(inventory).find((row) => row.id === 'kit');
  assert.equal(kit.stock, 3);
  assert.equal(kit.stock - kit.reserved, 2);
  assert.equal(
    kitAvailability([
      { id: 'kit', is_kit: true, kit_items: [{ equipment_id: 'missing', quantity: 1 }] },
    ])[0].stock,
    0,
  );
});

test('demanda soma peças de kits diferentes e equipamentos avulsos', () => {
  assert.deepEqual(
    [
      ...stockDemands(
        [
          { id: 'kit', quantity: 2 },
          { id: 'kit2', quantity: 1 },
          { id: 'light', quantity: 3 },
        ],
        inventory,
      ),
    ],
    [
      ['light', 8],
      ['smoke', 2],
    ],
  );
  assert.throws(() => stockDemands([{ id: 'missing', quantity: 1 }], inventory));
});

test('composição recusa kit vazio, duplicatas e quantidades inválidas', () => {
  assert.deepEqual(kitItems([{ equipment_id: 'light', quantity: '2' }]), [
    { equipment_id: 'light', quantity: 2 },
  ]);
  for (const input of [
    [],
    null,
    [{ equipment_id: 'light', quantity: 0 }],
    [{ equipment_id: 'light', quantity: 1.5 }],
    [
      { equipment_id: 'light', quantity: 1 },
      { equipment_id: 'light', quantity: 2 },
    ],
  ])
    assert.throws(() => kitItems(input));
});
