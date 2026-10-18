import express from 'express';
import { adminRouter } from './admin.js';

export function createApp(pool) {
    const app = express();
    app.disable('x-powered-by');
    if (process.env.TRUST_PROXY === '1' || process.env.VERCEL === '1') app.set('trust proxy', 1);
    app.use('/api/admin', adminRouter(pool));
    app.get('/api/health', async (_request, response) => {
        try {
            await pool.query('SELECT 1');
            response.json({ status: 'ok', database: 'connected' });
        } catch {
            response.status(503).json({ status: 'error', database: 'unavailable' });
        }
    });
    app.get('/api/equipamentos', async (_request, response) => {
        try {
            const { rows } = await pool.query(`
                SELECT id, nome, descricao, ideal, preco, periodo, popularidade, categorias, image_url, video_file
                FROM eurolight_equipment ORDER BY popularidade DESC, id
            `);
            response.set('Cache-Control', 'no-store');
            response.json(rows.map((row) => ({ ...row, preco: Number(row.preco) })));
        } catch (error) {
            console.error('Falha ao carregar equipamentos:', error.code || error.name);
            response.status(503).json({ error: 'Não foi possível carregar os equipamentos. Tente novamente.' });
        }
    });
    app.use('/api', (_request, response) => response.status(404).json({ error: 'Rota não encontrada.' }));
    return app;
}
