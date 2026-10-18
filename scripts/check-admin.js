import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import '../server/env.js';

const base = process.env.TEST_BASE_URL || 'http://localhost:5173';
const password = process.env.ADMIN_TEST_PASSWORD;
assert.ok(password, 'Defina ADMIN_TEST_PASSWORD no ambiente para testar o login.');
const browser = await chromium.launch();
try {
    const context = await browser.newContext();
    const page = await context.newPage();
    assert.equal((await context.request.get(`${base}/api/admin/session`)).status(), 401);
    const csrf = await context.request.post(`${base}/api/admin/login`, {
        headers: { origin: 'https://outro-site.example' },
        data: { username: process.env.ADMIN_USERNAME, password },
    });
    assert.equal(csrf.status(), 403);
    console.log('PASS admin: acesso sem sessão negado e origem externa bloqueada');
    await page.goto(`${base}/admin`);
    await page.getByRole('button', { name: 'Entrar', exact: true }).waitFor();
    await page.getByLabel('Usuário', { exact: true }).fill(process.env.ADMIN_USERNAME);
    await page.getByLabel('Senha', { exact: true }).fill('senha-incorreta');
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Usuário ou senha inválidos.' }).waitFor();
    await page.getByLabel('Senha', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await page.getByRole('heading', { name: 'Visão geral', exact: true }).waitFor();
    const cookie = (await context.cookies()).find((cookie) => cookie.name === 'eurolight.admin');
    assert.ok(cookie?.httpOnly);
    assert.equal(cookie.sameSite, 'Strict');
    const oldCookie = `${cookie.name}=${cookie.value}`;
    await page.reload();
    await page.getByRole('heading', { name: 'Visão geral', exact: true }).waitFor();
    console.log('PASS admin: senha incorreta rejeitada, login válido e sessão mantida após recarregar');
    await page.getByRole('button', { name: 'Sair', exact: true }).click();
    await page.getByRole('button', { name: 'Entrar', exact: true }).waitFor();
    assert.equal((await context.request.get(`${base}/api/admin/session`)).status(), 401);
    assert.equal((await fetch(`${base}/api/admin/session`, { headers: { cookie: oldCookie } })).status, 401);
    console.log('PASS admin: logout revoga sessão no servidor e cookie antigo não dá acesso');
    for (let attempt = 0; attempt < 5; attempt++) {
        const response = await context.request.post(`${base}/api/admin/login`, { data: { username: 'invalido', password: 'invalida' } });
        assert.equal(response.status(), attempt < 4 ? 401 : 429);
        if (attempt === 4) assert.equal(response.headers()['retry-after'], '90');
    }
    const blocked = await context.request.post(`${base}/api/admin/login`, { data: { username: process.env.ADMIN_USERNAME, password } });
    assert.equal(blocked.status(), 429);
    console.log('PASS admin: cinco erros bloqueiam novas tentativas por 90 segundos, inclusive senha correta');
} finally {
    await browser.close();
}
