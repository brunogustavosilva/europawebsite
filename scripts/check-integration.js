import assert from 'node:assert/strict';
import { createPool } from '../server/db.js';

const base = process.env.TEST_BASE_URL || 'http://localhost:5173';
const pool = createPool();
try {
    const health = await fetch(`${base}/api/health`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { status: 'ok', database: 'connected' });
    console.log('PASS GET /api/health: PostgreSQL conectado');

    const response = await fetch(`${base}/api/equipamentos`);
    assert.equal(response.status, 200);
    const catalog = await response.json();
    const { rows } = await pool.query('SELECT id, nome, preco FROM eurolight_equipment ORDER BY popularidade DESC, id');
    assert.ok(rows.length >= 3, 'Catálogo inicial deve existir no banco');
    assert.deepEqual(catalog.map(({ id, nome, preco }) => ({ id, nome, preco })),
        rows.map((row) => ({ ...row, preco: Number(row.preco) })));
    console.log(`PASS GET /api/equipamentos: ${catalog.length} equipamentos iguais ao banco, preços numéricos`);

    for (const path of ['/', '/equipamentos', '/locacao']) {
        const page = await fetch(`${base}${path}`);
        assert.equal(page.status, 200);
        assert.match(await page.text(), /id="root"/);
    }
    assert.equal((await fetch(`${base}/api/inexistente`)).status, 404);
    console.log('PASS rotas da SPA e 404 da API');
} finally {
    await pool.end();
}
