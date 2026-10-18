// Teste de fechamento com fixtures históricas: exclusivamente em branch dev isolada.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { request } from 'playwright';
import { createPool } from '../server/db.js';
import { plusDays } from '../server/admin-domain.js';
assert.equal(process.env.ALLOW_ADMIN_FIXTURES, '1');
assert.ok(process.env.NEON_BRANCH?.startsWith('dev-'), 'Fixtures históricas são permitidas apenas em branches dev-.');
assert.ok(process.env.ADMIN_TEST_PASSWORD);
const base = process.env.TEST_BASE_URL || 'http://localhost:5182';
const pool = createPool();
const http = await request.newContext();
try {
    assert.equal((await http.post(`${base}/api/admin/login`, { data: { username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_TEST_PASSWORD } })).status(), 200);
    const dashboard = await (await http.get(`${base}/api/admin/dashboard`)).json();
    const oldMonth = dashboard.months[1].month;
    const before = dashboard.months[1].completedValue;
    let date = `${oldMonth}-01`;
    while (new Date(`${date}T12:00:00Z`).getUTCDay() !== 5) date = plusDays(date, 1);
    const equipment = await http.post(`${base}/api/admin/equipment`, { data: { nome: `Teste fechamento ${Date.now()}`, stock: 2, preco: '50', unit_cost: '1000', voltage: 'bivolt', tag: 'visual' } });
    assert.equal(equipment.status(), 201);
    const equipmentId = (await equipment.json()).id;
    const ids = [randomUUID(), randomUUID()];
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // Simula registros criados antes da virada do mês sem mudar o relógio da aplicação.
        await client.query('LOCK TABLE eurolight_rentals, eurolight_rental_items IN ACCESS EXCLUSIVE MODE');
        await client.query('ALTER TABLE eurolight_rentals DISABLE TRIGGER eurolight_rentals_closed_guard');
        await client.query('ALTER TABLE eurolight_rental_items DISABLE TRIGGER eurolight_rental_items_closed_guard');
        for (let index = 0; index < 2; index++) {
            await client.query(`INSERT INTO eurolight_rentals (id,customer_name,phone,rental_date,total,deposit,status)
                VALUES ($1,$2,'41999999999',$3,450,50,$4)`, [ids[index],`Histórico de teste ${index}`,date,index ? 'concluida' : 'prevista']);
            await client.query('INSERT INTO eurolight_rental_items (rental_id,equipment_id,name,unit_price,quantity) VALUES ($1,$2,$3,50,1)', [ids[index],equipmentId,'Item histórico de teste']);
        }
        await client.query('ALTER TABLE eurolight_rentals ENABLE TRIGGER eurolight_rentals_closed_guard');
        await client.query('ALTER TABLE eurolight_rental_items ENABLE TRIGGER eurolight_rental_items_closed_guard');
        await client.query('COMMIT');
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
    const closed = await (await http.get(`${base}/api/admin/dashboard?month=${oldMonth}`)).json();
    const summary = closed.months.find((item) => item.month === oldMonth);
    assert.equal(summary.completedValue, before + 450);
    assert.equal(summary.plannedValue, 0);
    assert.equal(summary.plannedCount, 0);
    assert.ok(!closed.rentals.some((item) => item.id === ids[0]));
    assert.ok(closed.rentals.some((item) => item.id === ids[1]));
    const inventory = await (await http.get(`${base}/api/admin/inventory?rentalDate=${date}`)).json();
    assert.equal(inventory.items.find((item) => item.id === equipmentId).reserved, 1);
    await assert.rejects(pool.query('UPDATE eurolight_rentals SET customer_name=$2 WHERE id=$1', [ids[1],'Alteração indevida']), (error) => error.code === '23514');
    await assert.rejects(pool.query('UPDATE eurolight_rental_items SET quantity=2 WHERE rental_id=$1', [ids[1]]), (error) => error.code === '23514');
    console.log('PASS fechamento: previstas vencidas saem dos valores, contagem, tabela e estoque; concluídas permanecem');
    console.log('PASS banco: alterações de locações e itens de mês encerrado bloqueadas pelos triggers');
} finally { await http.dispose(); await pool.end(); }
