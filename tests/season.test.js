import test from 'node:test';
import assert from 'node:assert/strict';
import { holidaySeason } from '../src/utils/season.js';

test('decorações seguem as semanas festivas no fuso de São Paulo', () => {
  for (const [date, season] of [
    ['2026-12-18T12:00:00-03:00', null],
    ['2026-12-19T00:00:00-03:00', 'christmas'],
    ['2026-12-26T02:59:59Z', 'christmas'],
    ['2026-12-26T03:00:00Z', 'new-year'],
    ['2027-01-01T23:59:59-03:00', 'new-year'],
    ['2027-01-02T00:00:00-03:00', null],
    ['2027-06-20T12:00:00-03:00', null],
    ['2027-12-25T12:00:00-03:00', 'christmas'],
  ])
    assert.equal(holidaySeason(new Date(date)), season, date);
});

test('efeitos ativos somente de novembro até janeiro, incluindo limites no fuso local', async () => {
  const { festiveEffectsActive } = await import('../src/utils/season.js');
  for (const [date, active] of [
    ['2026-11-01T02:59:59Z', false],
    ['2026-11-01T03:00:00Z', true],
    ['2026-12-15T12:00:00Z', true],
    ['2027-02-01T02:59:59Z', true],
    ['2027-02-01T03:00:00Z', false],
    ['2027-07-01T12:00:00Z', false],
  ])
    assert.equal(festiveEffectsActive(new Date(date)), active, date);
});

test('emojis da locação usam a data escolhida, incluindo a próxima virada', async () => {
  const { rentalHolidayLabel } = await import('../src/utils/season.js');
  assert.equal(rentalHolidayLabel('2026-12-25'), '🎅 🎄 ⭐ Natal');
  assert.equal(rentalHolidayLabel('2027-12-19'), '🎅 🎄 ⭐ Natal');
  assert.equal(rentalHolidayLabel('2026-12-31'), '🎉 🎆 🥂 Ano Novo');
  assert.equal(rentalHolidayLabel('2027-01-01'), '🎉 🎆 🥂 Ano Novo');
  assert.equal(rentalHolidayLabel('2027-01-02'), '');
  assert.equal(rentalHolidayLabel('2026-11-01'), '');
  assert.equal(rentalHolidayLabel(''), '');
});
