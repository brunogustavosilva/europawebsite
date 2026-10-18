import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.TEST_BASE_URL || 'http://localhost:5173';
const browser = await chromium.launch({
    ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
});
try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${base}/equipamentos`);
    const cards = page.locator('.equipment-card');
    await cards.first().waitFor();
    assert.equal(await cards.count(), 3);
    await page.getByRole('button', { name: 'Alugar Máquina de fumaça', exact: true }).click();
    await page.getByRole('button', { name: 'Abrir sacola, 1 itens' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor();
    assert.match(await dialog.innerText(), /Máquina de fumaça/);
    assert.match(await dialog.locator('.total-row').innerText(), /50,00/);
    await page.getByRole('link', { name: 'Continuar locação ↗' }).click();
    await page.locator('main .cart-item h3').waitFor();
    assert.match(await page.locator('main .total-row').innerText(), /50,00/);
    assert.equal(await page.getByRole('button', { name: 'Solicitar pelo WhatsApp ↗' }).isEnabled(), true);
    assert.deepEqual(errors, []);
    console.log('PASS navegador: catálogo Neon → adicionar equipamento → sacola R$ 50,00 → locação após navegação');

    await page.route('**/api/equipamentos', (route) => route.fulfill({ status: 503, json: { error: 'Unavailable' } }));
    await page.goto(`${base}/equipamentos`);
    await page.getByText('Não foi possível carregar o catálogo. Recarregue a página para tentar novamente.').waitFor();
    assert.equal(await page.locator('.equipment-card').count(), 0);
    console.log('PASS navegador: indisponibilidade da API apresenta erro sem catálogo fictício');
} finally {
    await browser.close();
}
