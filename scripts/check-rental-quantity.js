import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser = await chromium.launch();
try {
    const page = await browser.newPage();
    await page.route('**/api/**', async route => {
        const url = new URL(route.request().url());
        let json = [];
        if (url.pathname.endsWith('/session')) json = { user: { username: 'admin' } };
        if (url.pathname.endsWith('/dashboard')) json = { today: '2026-10-17', month: '2026-10', months: [{ month: '2026-10', closed: false, completedValue: 0, plannedValue: 0, completedCount: 0, plannedCount: 0 }], rentals: [] };
        if (url.pathname.endsWith('/inventory')) {
            const available = url.searchParams.get('rentalDate') === '2026-10-18' ? 2 : 5;
            json = { week: '2026-10-12', occupiedFrom: '2026-10-17', occupiedUntil: '2026-10-21', items: [{ id: 'globo', nome: 'Globo de luz', available, stock: 5, preco: 40 }, { id: 'empty', nome: 'Sem estoque', available: 0, stock: 0, preco: 20 }], totals: { quantity: 5, potential: 200, available } };
        }
        await route.fulfill({ json });
    });
    await page.goto(process.env.TEST_BASE_URL || 'http://localhost:5173/admin');
    await page.getByRole('button', { name: 'Cadastrar locação', exact: true }).click();
    const equipment = page.getByLabel('Equipamento 1', { exact: true });
    await equipment.selectOption('globo');
    const quantity = page.getByLabel('Quantidade 1', { exact: true });
    await quantity.fill('99'); assert.equal(await quantity.inputValue(), '5');
    await quantity.fill('3'); assert.equal(await quantity.inputValue(), '3');
    assert.equal(await equipment.locator('option[value="empty"]').evaluate(option => option.disabled), true);
    await page.getByLabel('Data da locação', { exact: true }).fill('18/10/2026');
    await page.waitForFunction(() => document.querySelector('input[aria-label="Quantidade 1"]').max === '2');
    assert.equal(await page.getByRole('button', { name: 'Salvar locação', exact: true }).isDisabled(), true);
    await quantity.fill('8'); assert.equal(await quantity.inputValue(), '2');
    assert.equal(await page.getByRole('button', { name: 'Salvar locação', exact: true }).isEnabled(), true);
    console.log('PASS: quantidade limitada a 5; equipamento sem estoque indisponível; mudança de data bloqueia excesso; novo limite de 2 respeitado (APIs simuladas).');
} finally { await browser.close(); }
