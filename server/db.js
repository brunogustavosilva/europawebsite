import './env.js';
import pg from 'pg';

export function createPool(connectionString = process.env.DATABASE_URL) {
    if (!connectionString) throw new Error('Configure DATABASE_URL em .env.local ou no ambiente.');
    const url = new URL(connectionString);
    if (url.searchParams.get('sslmode') === 'require') url.searchParams.set('sslmode', 'verify-full');
    const pool = new pg.Pool({
        connectionString: url.toString(),
        max: 5,
        connectionTimeoutMillis: 15000,
        idleTimeoutMillis: 30000,
        statement_timeout: 10000,
    });
    pool.on('error', (error) => console.error('Erro na conexão ociosa com PostgreSQL:', error.code));
    return pool;
}
