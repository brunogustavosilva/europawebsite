// Browser verification with intercepted APIs: no real reservations are deleted.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser = await chromium.launch();
try {
    const page = await browser.newPage();
    const rental = { id: '12345678-1234-4234-8234-123456789012', customer_name: 'Cliente da confirmação', phone: '41999999999', rental_date: '2026-10-17', status: 'prevista', total: 100, deposit: 0, delivery: false, items: [] };
    let deleted = false;
    await page.route('**/api/**', async route => {
        const path = new URL(route.request().url()).pathname;
        let data = [];
        if (path.endsWith('/session')) data = { user: { username: 'admin' } };
        if (path.endsWith('/dashboard')) data = { today: '2026-10-17', month: '2026-10', months: [{ month: '2026-10', closed: false, completedValue: 0, plannedValue: deleted ? 0 : 100, completedCount: 0, plannedCount: deleted ? 0 : 1 }], rentals: deleted ? [] : [rental] };
        if (path.endsWith('/inventory')) data = { week: '2026-10-12', items: [], totals: { quantity: 0, potential: 0, available: 0 } };
        if (route.request().method() === 'DELETE') { deleted = true; data = { id: rental.id }; }
        await route.fulfill({ json: data });
    });
    await page.clock.install();
    await page.goto(process.env.TEST_BASE_URL || 'http://localhost:5173/admin');
    await page.getByRole('button', { name: `Excluir reserva de ${rental.customer_name}` }).click();
    const dialog = page.getByRole('dialog', { name: 'Tem certeza?' });
    await dialog.waitFor();
    assert.match(await dialog.textContent(), /Todos os dados serão perdidos/);
    const button = dialog.getByRole('button', { name: /^Deletar/ });
    assert.equal(await button.isDisabled(), true);
    await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
    await page.getByRole('button', { name: `Excluir reserva de ${rental.customer_name}` }).click();
    await page.clock.runFor(10000);
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some(button => button.textContent === 'Deletar'));
    assert.equal(await button.textContent(), 'Deletar');
    assert.equal(await button.isDisabled(), true);
    assert.equal(deleted, false);
    await page.clock.runFor(1100);
    assert.equal(await button.isEnabled(), true);
    await button.click();
    await page.getByText('Reserva excluída com sucesso.', { exact: false }).waitFor();
    assert.equal(deleted, true);
    await page.getByRole('heading', { name: 'Nenhuma locação neste mês' }).waitFor();
    console.log('PASS: confirmação, cancelamento, contagem visual de 10s, bloqueio por 11s e exclusão com atualização do painel (APIs simuladas).');
} finally { await browser.close(); }
