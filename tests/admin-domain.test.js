import test from 'node:test';
import assert from 'node:assert/strict';
import {
  monthsFor,
  editableDate,
  weekStart,
  rentalPeriod,
  amount,
} from '../server/admin-domain.js';

test('janela de sete meses atravessa anos e fecha apenas os dois anteriores', () => {
  const months = monthsFor('2026-01-17');
  assert.deepEqual(
    months.map((item) => item.month),
    ['2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05'],
  );
  assert.deepEqual(
    months.map((item) => item.closed),
    [true, true, false, false, false, false, false],
  );
  assert.throws(() => editableDate('2025-12-31', '2026-01-01'), /encerrado/);
  assert.throws(() => editableDate('2028-01-01', '2026-01-17'), /próximo ano/);
  assert.doesNotThrow(() => editableDate('2026-05-31', '2026-01-17'));
});

test('ocupação inclui véspera, evento, dia seguinte e devolução', () => {
  assert.deepEqual(rentalPeriod('2026-10-15'), { from: '2026-10-14', until: '2026-10-17' });
  assert.deepEqual(rentalPeriod('2026-10-28'), { from: '2026-10-27', until: '2026-10-30' });
  assert.deepEqual(rentalPeriod('2026-12-30'), { from: '2026-12-29', until: '2027-01-01' });
  assert.deepEqual(rentalPeriod('2027-01-01'), { from: '2026-12-31', until: '2027-01-03' });
  assert.equal(weekStart('2026-11-01'), '2026-10-26');
  for (let day = 19; day <= 25; day++) assert.doesNotThrow(() => rentalPeriod(`2026-10-${day}`));
});

test('valores são validados sem arredondar frações extras ou aceitar negativos', () => {
  assert.equal(amount('450.00', 'Total'), '450.00');
  assert.equal(amount(0, 'Total'), '0.00');
  for (const value of [-1, '', '10.001', 'NaN', null]) assert.throws(() => amount(value, 'Total'));
});
