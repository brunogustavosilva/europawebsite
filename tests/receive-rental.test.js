import assert from 'node:assert/strict';
import { contractRouter } from '../server/contracts.js';
import { managementRouter } from '../server/management.js';

// Exercise the actual handlers without opening a socket or touching production data.
const id = '12345678-1234-4234-8234-123456789012';
let rental = { rental_date: '2026-10-20', status: 'prevista' };
let updates = 0;
const client = {
    async query(sql) {
        if (sql.startsWith('SELECT rental_date::text,status')) return { rows: rental ? [{ ...rental }] : [] };
        if (sql.includes('AS today')) return { rows: [{ today: '2026-10-17' }] };
        if (sql.startsWith('UPDATE')) { rental.status = 'concluida'; updates++; }
        return { rows: [] };
    },
    release() {},
};
const router = managementRouter({ connect: async () => client });
const handler = router.stack.find(layer => layer.route?.path === '/rentals/:id/receive').route.stack[0].handle;
async function receive() {
    let result, error;
    await handler({ params: { id } }, { json: value => { result = value; } }, value => { error = value; });
    return { result, error };
}
assert.equal((await receive()).result.status, 'concluida');
assert.equal(rental.status, 'concluida');
assert.equal((await receive()).result.status, 'concluida'); // retry remains safe
rental = { rental_date: '2026-09-30', status: 'prevista' };
assert.equal((await receive()).error.status, 409);
rental = { rental_date: '2026-10-17', status: 'cancelada' };
assert.equal((await receive()).error.status, 409);
rental = null;
assert.equal((await receive()).error.status, 404);
assert.equal(updates, 2);

const contracts = contractRouter({ query: async () => ({ rowCount: 1, rows: [{ rental_date: '2026-09-30', today: '2026-10-17' }] }) });
for (const layer of contracts.stack.filter(layer => layer.route)) {
    let blocked;
    await layer.route.stack[0].handle({ params: { id } }, {}, error => { blocked = error; });
    assert.equal(blocked.status, 409); // both draft and generation reject closed months
}
