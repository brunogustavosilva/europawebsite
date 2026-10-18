// Browser verification with simulated APIs; no real rentals are changed.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser = await chromium.launch();
try {
    const page = await browser.newPage();
    const rental = { id: '12345678-1234-4234-8234-123456789012', customer_name: 'Cliente da confirmação', phone: '41999999999', rental_date: '2026-10-17', status: 'prevista', total: 100, deposit: 0, delivery: false, occupied_from: '2026-10-17', occupied_until: '2026-10-21', items: [] };
    let deleted = false;
    await page.route('**/api/**', async route => {
        const path = new URL(route.request().url()).pathname;
        let data = [];
        if (path.endsWith('/session')) data = { user: { username: 'admin' } };
        if (path.endsWith('/dashboard')) data = { today: '2026-10-17', month: '2026-10', months: [{ month: '2026-10', closed: false, completedValue: 0, plannedValue: deleted ? 0 : 100, completedCount: 0, plannedCount: deleted ? 0 : 1 }], rentals: deleted ? [] : [rental] };
        if (path.endsWith('/inventory')) data = { week: '2026-10-12', items: [], totals: { quantity: 0, potential: 0, available: 0 } };
        if (path.endsWith('/receive')) { rental.status = 'concluida'; data = { id: rental.id, status: 'concluida' }; }
        await route.fulfill({ json: data });
    });
    await page.clock.install();
    await page.goto(process.env.TEST_BASE_URL || 'http://localhost:5173/admin');
    await page.getByRole('button', { name: rental.customer_name, exact: true }).click();
    await page.getByRole('button', { name: 'Receber locação', exact: true }).click();
    const success = page.getByRole('dialog', { name: 'Locação concluída', exact: true });
    await success.waitFor();
    assert.equal(await success.evaluate(el => el.matches(':modal')), true);
    assert.match(await success.evaluate(el => getComputedStyle(el, '::backdrop').backdropFilter), /blur/);
    await page.clock.runFor(500);
    await page.waitForFunction(() => !document.querySelector('dialog[aria-label="Detalhes da locação"]').open);
    assert.equal(rental.status, 'concluida');
    await page.clock.runFor(2200);
    await success.waitFor({ state: 'detached' });
    await page.getByRole('button', { name: rental.customer_name, exact: true }).click();
    await page.getByRole('button', { name: 'Editar locação', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Realizar contrato', exact: true }).waitFor();
    console.log('PASS: recebimento fecha detalhes, exibe check com blur, desaparece automaticamente e mantém edição e contrato (APIs simuladas).');
} finally { await browser.close(); }
