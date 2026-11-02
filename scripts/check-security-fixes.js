import assert from 'node:assert/strict';
import express from 'express';
import { createPool } from '../server/db.js';
import { managementRouter } from '../server/management.js';
import { createApp } from '../server/app.js';
import { createSharedLoginAttempts } from '../server/shared-login-attempts.js';
assert.ok(process.env.NEON_BRANCH?.startsWith('dev-'));
const pool = createPool();
const app = express();
app.use('/manage', express.json({ limit: '256kb' }), managementRouter(pool));
app.use(createApp(pool));
const server = app.listen(0, '127.0.0.1');
await new Promise((resolve) => server.once('listening', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
async function call(path, body, method = 'POST') {
  const response = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}
try {
  const first = createSharedLoginAttempts(pool, 'isolated-test-secret');
  const second = createSharedLoginAttempts(pool, 'isolated-test-secret');
  const key = `fixture-${Date.now()}`;
  const failures = await Promise.all(
    Array.from({ length: 5 }, (_, i) => (i % 2 ? first : second).fail(key)),
  );
  assert.equal(failures.filter((seconds) => seconds > 0).length, 1);
  assert.ok((await second.retryAfter(key)) > 0);
  await pool.query("UPDATE eurolight_login_attempts SET blocked_until=now()-interval '1 second'");
  assert.equal(await first.retryAfter(key), 0);
  assert.equal(await second.fail(key), 0);
  await first.reset(key);
  assert.equal(await second.retryAfter(key), 0);
  const item = {
    nome: 'Fixture concorrência',
    stock: 5,
    preco: 50,
    unit_cost: 100,
    voltage: 'bivolt',
    tag: 'som',
  };
  const created = await call('/manage/equipment', item);
  assert.equal(created.status, 201);
  const inventory = await (await fetch(base + '/manage/inventory')).json();
  const equipment = inventory.items.find((row) => row.id === created.body.id);
  const edits = await Promise.all([
    call(`/manage/equipment/${equipment.id}`, { ...equipment, nome: 'Edição A' }, 'PUT'),
    call(`/manage/equipment/${equipment.id}`, { ...equipment, nome: 'Edição B' }, 'PUT'),
  ]);
  assert.deepEqual(edits.map((edit) => edit.status).sort(), [200, 409]);
  const today = (await (await fetch(base + '/manage/dashboard')).json()).today;
  const rental = {
    customer_name: 'Fixture',
    phone: '(41) 9 9999-9999',
    rental_date: today,
    total: 50,
    deposit: 0,
    delivery: false,
    status: 'prevista',
    items: [{ equipment_id: equipment.id, quantity: 1 }],
  };
  assert.equal((await call('/manage/rentals', { ...rental, phone: '99999999' })).status, 400);
  const saved = await call('/manage/rentals', rental);
  assert.equal(saved.status, 201);
  const editsRental = await Promise.all([
    call(`/manage/rentals/${saved.body.id}`, { ...rental, version: 1, customer_name: 'A' }, 'PUT'),
    call(`/manage/rentals/${saved.body.id}`, { ...rental, version: 1, customer_name: 'B' }, 'PUT'),
  ]);
  assert.deepEqual(editsRental.map((edit) => edit.status).sort(), [200, 409]);
  const oversized = await call('/api/admin/login', { password: 'a'.repeat(270000) });
  assert.equal(oversized.status, 413);
  assert.match(oversized.body.error, /256 KB/);
  const largeValid = await call('/api/admin/login', { password: 'a'.repeat(40000) });
  assert.equal(largeValid.status, 401);
  console.log(
    'PASS: bloqueio compartilhado e concorrente, expiração/reset, conflitos de equipamentos e locações, telefone, payload acima de 32KB aceito e excesso retorna 413.',
  );
} finally {
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
}
