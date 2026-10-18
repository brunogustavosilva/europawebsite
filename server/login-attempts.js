// Cada IP tem cinco erros consecutivos; o bloqueio começa no quinto erro.
export function createLoginAttempts({ now = Date.now } = {}) {
    const attempts = new Map();
    const lockDuration = 90_000;

    function retryAfter(key) {
        const entry = attempts.get(key);
        if (!entry?.blockedUntil) return 0;
        const remaining = entry.blockedUntil - now();
        if (remaining <= 0) {
            attempts.delete(key);
            return 0;
        }
        return Math.ceil(remaining / 1000);
    }

    return {
        retryAfter,
        fail(key) {
            const blocked = retryAfter(key);
            if (blocked) return blocked;
            const entry = attempts.get(key) || { failures: 0 };
            entry.failures += 1;
            if (entry.failures >= 5) entry.blockedUntil = now() + lockDuration;
            attempts.set(key, entry);
            return retryAfter(key);
        },
        reset(key) { attempts.delete(key); },
    };
}
