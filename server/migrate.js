import { readFile } from 'node:fs/promises';
import { createPool } from './db.js';

const pool = createPool(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL);
const client = await pool.connect();
try {
    await client.query('BEGIN');
    await client.query(await readFile(new URL('./migrations/001_equipment.sql', import.meta.url), 'utf8'));
    await client.query(await readFile(new URL('./migrations/002_admin_sessions.sql', import.meta.url), 'utf8'));
    await client.query(await readFile(new URL('./migrations/003_admin_management.sql', import.meta.url), 'utf8'));
    await client.query(await readFile(new URL('./migrations/004_flexible_rental_dates.sql', import.meta.url), 'utf8'));
    await client.query(await readFile(new URL('./migrations/005_rental_cpf.sql', import.meta.url), 'utf8'));
    await client.query(await readFile(new URL('./migrations/006_equipment_media.sql', import.meta.url), 'utf8'));
    await client.query(await readFile(new URL('./migrations/007_delivery_time.sql', import.meta.url), 'utf8'));
    const seed = JSON.parse(await readFile(new URL('./equipment-seed.json', import.meta.url), 'utf8'));
    for (const item of seed) {
        await client.query(`
            INSERT INTO eurolight_equipment
                (id, nome, descricao, ideal, preco, periodo, popularidade, categorias)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (id) DO NOTHING
        `, [item.id, item.nome, item.descricao, item.ideal, item.preco, item.periodo, item.popularidade, item.categorias]);
    }
    await client.query('COMMIT');
    console.log('Migrações 001 a 007 aplicadas; catálogo, sessões, estoque e locações disponíveis.');
} catch (error) {
    await client.query('ROLLBACK');
    console.error('Falha na migração:', error.code || error.name);
    process.exitCode = 1;
} finally {
    client.release();
    await pool.end();
}
