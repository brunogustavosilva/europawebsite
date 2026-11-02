import test from 'node:test';
import assert from 'node:assert/strict';
import { brazilianPhone } from '../src/utils/phone.js';
import { safeRollback } from '../server/rollback.js';

test('telefone exige DDD e formato brasileiro compatível com WhatsApp', () => {
  assert.equal(brazilianPhone('(41) 9 9999-9999'), '41999999999');
  assert.equal(brazilianPhone('+55 41 3333-4444'), '4133334444');
  for (const value of ['99999999', '00999999999', '41199999999', '123', ''])
    assert.equal(brazilianPhone(value), null);
});
test('rollback preserva o fluxo mesmo se conexão cair', async () => {
  await assert.doesNotReject(() =>
    safeRollback({
      query: async () => {
        throw new Error('offline');
      },
    }),
  );
});
