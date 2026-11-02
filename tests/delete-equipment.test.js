import test from 'node:test';
import assert from 'node:assert/strict';
import { managementRouter } from '../server/management.js';

test('exclusão de equipamento trata sucesso, ausência e vínculo com locações', async () => {
  let failure;
  let rowCount = 1;
  let linked = false;
  const client = {
    release() {},
    async query(sql, params) {
      if (['BEGIN', 'COMMIT', 'ROLLBACK'].includes(sql) || sql.startsWith('SELECT id FROM'))
        return { rows: [] };
      if (sql.startsWith('SELECT 1 FROM')) return { rowCount: linked ? 1 : 0 };
      assert.equal(sql, 'DELETE FROM eurolight_equipment WHERE id=$1 RETURNING id');
      assert.deepEqual(params, ['equipment-id']);
      if (failure) throw failure;
      return { rowCount };
    },
  };
  const router = managementRouter({ connect: async () => client });
  const handler = router.stack.find(
    (layer) => layer.route?.path === '/equipment/:id' && layer.route.methods.delete,
  ).route.stack[0].handle;
  async function remove() {
    let result, error;
    await handler(
      { params: { id: 'equipment-id' } },
      {
        json(value) {
          result = value;
        },
      },
      (value) => {
        error = value;
      },
    );
    return { result, error };
  }
  assert.deepEqual((await remove()).result, { id: 'equipment-id' });
  linked = true;
  assert.equal((await remove()).error.status, 409);
  linked = false;
  rowCount = 0;
  assert.equal((await remove()).error.status, 404);
  failure = { code: '23503' };
  assert.equal((await remove()).error.status, 409);
  failure = new Error('unavailable');
  assert.equal((await remove()).error, failure);
});
