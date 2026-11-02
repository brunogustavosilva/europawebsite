import test from 'node:test';
import assert from 'node:assert/strict';
import { managementRouter } from '../server/management.js';

test('cadastro e edição salvam descrição e indicação com limites de tamanho', async () => {
  let writes = [];
  const client = {
    async query(sql, values) {
      if (sql.startsWith('SELECT id,version')) return { rowCount: 1, rows: [{ version: 1 }] };
      if (sql.includes('AS today')) return { rows: [{ today: '2026-11-01' }] };
      if (sql.includes('AS maximum')) return { rows: [{ maximum: 0 }] };
      if (sql.startsWith('INSERT') || sql.startsWith('UPDATE')) writes.push({ sql, values });
      return { rows: [] };
    },
    release() {},
  };
  const router = managementRouter({ connect: async () => client });
  async function save(edit, fields) {
    const route = router.stack.find(
      (layer) =>
        layer.route?.path === (edit ? '/equipment/:id' : '/equipment') &&
        layer.route.methods[edit ? 'put' : 'post'],
    );
    let error;
    await route.route.stack[0].handle(
      {
        params: edit ? { id: 'item' } : {},
        body: {
          nome: 'Luz',
          stock: 1,
          preco: 50,
          unit_cost: 100,
          tag: 'visual',
          voltage: 'bivolt',
          version: 1,
          ...fields,
        },
      },
      {
        status() {
          return this;
        },
        json() {},
      },
      (value) => {
        error = value;
      },
    );
    return error;
  }
  for (const edit of [false, true]) {
    assert.equal(await save(edit, { descricao: ' Luz colorida ', ideal: ' Festas ' }), undefined);
    assert.deepEqual(
      writes
        .filter((write) => write.values.length === 12)
        .at(-1)
        .values.slice(10),
      ['Luz colorida', 'Festas'],
    );
    assert.match(writes.filter((write) => write.values.length === 12).at(-1).sql, /\$11/);
    assert.match(writes.filter((write) => write.values.length === 12).at(-1).sql, /\$12/);
    assert.equal(await save(edit, { high_demand: true }), undefined);
    assert.equal(writes.at(-1).values[4], true);
    assert.equal(await save(edit, { high_demand: false }), undefined);
    assert.equal(writes.at(-1).values[4], false);
    assert.equal((await save(edit, { high_demand: 'true' })).status, 400);
    const count = writes.length;
    assert.equal((await save(edit, { descricao: 'x'.repeat(121) })).status, 400);
    assert.equal((await save(edit, { ideal: 'x'.repeat(151) })).status, 400);
    assert.equal(writes.length, count);
  }
});
