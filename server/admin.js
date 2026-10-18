import { Router, json } from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { ipKeyGenerator } from 'express-rate-limit';
import { createLoginAttempts } from './login-attempts.js';
import { managementRouter } from './management.js';
import { scrypt as deriveKey, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(deriveKey);
const cookieName = 'eurolight.admin';

export function adminRouter(pool) {
    const router = Router();
    const configured = process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD_HASH && process.env.SESSION_SECRET;
    router.use((_request, response, next) => {
        response.set('Cache-Control', 'no-store');
        if (!configured) return response.status(503).json({ error: 'Acesso administrativo não configurado.' });
        next();
    });
    router.use(json({ limit: '32kb' }));
    // Recusa requisições de escrita iniciadas por outros sites.
    router.use((request, response, next) => {
        if (request.method !== 'GET') {
            const origin = request.get('origin');
            if (request.get('sec-fetch-site') === 'cross-site' || (origin && origin !== `${request.protocol}://${request.get('host')}`)) {
                return response.status(403).json({ error: 'Origem não permitida.' });
            }
        }
        next();
    });
    const Store = connectPgSimple(session);
    router.use(session({
        name: cookieName,
        secret: process.env.SESSION_SECRET,
        store: new Store({ pool, tableName: 'eurolight_admin_sessions', pruneSessionInterval: 900 }),
        resave: false,
        saveUninitialized: false,
        cookie: { httpOnly: true, sameSite: 'strict', secure: 'auto', maxAge: 8 * 60 * 60 * 1000 },
    }));
    const attempts = createLoginAttempts();
    function locked(response, seconds) {
        response.set('Retry-After', String(seconds));
        return response.status(429).json({
            error: `Limite de 5 tentativas atingido. Tente novamente em ${seconds} segundos.`,
            retryAfter: seconds,
        });
    }
    router.post('/login', async (request, response, next) => {
        const key = ipKeyGenerator(request.ip);
        const remaining = attempts.retryAfter(key);
        if (remaining) return locked(response, remaining);
        function invalidCredentials() {
            const seconds = attempts.fail(key);
            if (seconds) return locked(response, seconds);
            return response.status(401).json({ error: 'Usuário ou senha inválidos.' });
        }
        try {
            const { username, password } = request.body || {};
            if (typeof username !== 'string' || typeof password !== 'string' || username.length > 100 || password.length > 256) {
                return invalidCredentials();
            }
            const [salt, hash] = process.env.ADMIN_PASSWORD_HASH.split(':');
            const expected = Buffer.from(hash, 'hex');
            const actual = await scrypt(password, salt, 64);
            const blockedWhileChecking = attempts.retryAfter(key);
            if (blockedWhileChecking) return locked(response, blockedWhileChecking);
            const validPassword = expected.length === actual.length && timingSafeEqual(expected, actual);
            if (username !== process.env.ADMIN_USERNAME || !validPassword) {
                return invalidCredentials();
            }
            request.session.regenerate((error) => {
                if (error) return next(error);
                request.session.admin = { username: process.env.ADMIN_USERNAME };
                request.session.save((saveError) => {
                    if (saveError) return next(saveError);
                    attempts.reset(key);
                    response.json({ user: request.session.admin });
                });
            });
        } catch (error) { next(error); }
    });
    router.get('/session', (request, response) => {
        if (!request.session.admin) return response.status(401).json({ error: 'Faça login para continuar.' });
        response.json({ user: request.session.admin });
    });
    router.post('/logout', (request, response, next) => {
        request.session.destroy((error) => {
            if (error) return next(error);
            response.clearCookie(cookieName, { path: '/', httpOnly: true, sameSite: 'strict', secure: request.secure });
            response.sendStatus(204);
        });
    });
    router.use((request, response, next) => {
        if (!request.session.admin) return response.status(401).json({ error: 'Faça login para continuar.' });
        next();
    });
    router.use(managementRouter(pool));
    router.use((error, _request, response, _next) => {
        console.error('Falha na autenticação administrativa:', error.code || error.name);
        response.status(error.status === 400 ? 400 : 503).json({ error: 'Não foi possível concluir o acesso. Tente novamente.' });
    });
    return router;
}
