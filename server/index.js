import { resolve } from 'node:path';
import express from 'express';
import { createPool } from './db.js';
import { createApp } from './app.js';

const development = process.argv.includes('--dev');
const pool = createPool();
const app = createApp(pool);
let vite;
if (development) {
    const { createServer } = await import('vite');
    vite = await createServer({ server: { middlewareMode: true } });
    app.use(vite.middlewares);
} else {
    app.use(express.static(resolve('dist')));
    app.get('/{*path}', (_request, response) => response.sendFile(resolve('dist/index.html')));
}

const port = Number(process.env.PORT || 5173);
const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Euro Light: http://localhost:${port} (${development ? 'desenvolvimento' : 'produção'})`);
    console.log(`Rede: http://<IP-do-computador>:${port}`);
});
server.on('error', async (error) => {
    console.error('Falha ao iniciar servidor:', error.code);
    await vite?.close();
    await pool.end();
    process.exitCode = 1;
});
async function shutdown() {
    server.close();
    await vite?.close();
    await pool.end();
    server.closeAllConnections();
}
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
