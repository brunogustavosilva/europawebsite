import assert from 'node:assert/strict';
import { managementRouter } from '../server/management.js';
const id = '12345678-1234-4234-8234-123456789012';
let rental = { rental_date: '2026-10-17' };
let failParent = false;
let calls = [];
const client = {
    async query(sql) {
        calls.push(sql);
        if (sql.startsWith('SELECT rental_date')) return { rows: rental ? [rental] : [] };
        if (sql.includes('AS today')) return { rows: [{ today: '2026-10-17' }] };
        if (sql.startsWith('DELETE FROM eurolight_rentals') && failParent) throw new Error('database error');
        return { rows: [] };
    }, release() {},
};
const router = managementRouter({ connect: async () => client });
const handler = router.stack.find(layer => layer.route?.methods.delete).route.stack[0].handle;
async function remove(value = id) {
    calls = [];
    let error, result;
    await handler({ params: { id: value } }, { json: data => { result = data; } }, caught => { error = caught; });
    return { error, result };
}
assert.equal((await remove()).result.id, id);
assert.deepEqual(calls.filter(sql => sql.startsWith('DELETE')), [
    'DELETE FROM eurolight_rental_items WHERE rental_id=$1',
    'DELETE FROM eurolight_rentals WHERE id=$1',
]);
assert.equal(calls.at(-1), 'COMMIT');
rental = { rental_date: '2026-09-30' };
assert.equal((await remove()).error.status, 409);
assert.ok(!calls.some(sql => sql.startsWith('DELETE')));
rental = null;
assert.equal((await remove()).error.status, 404);
assert.equal((await remove('invalid')).error.status, 400);
rental = { rental_date: '2026-10-17' }; failParent = true;
assert.ok((await remove()).error);
assert.equal(calls.at(-1), 'ROLLBACK');
assert.ok(!calls.includes('COMMIT'));
