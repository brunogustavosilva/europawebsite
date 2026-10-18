import test from 'node:test';
import assert from 'node:assert/strict';
import { createLoginAttempts } from '../server/login-attempts.js';

test('bloqueia no quinto erro por 90 segundos a partir desse erro', () => {
    let time = 0;
    const attempts = createLoginAttempts({ now: () => time });
    for (let count = 0; count < 4; count++) {
        assert.equal(attempts.fail('ip-a'), 0);
        time += 60_000;
    }
    assert.equal(attempts.fail('ip-a'), 90);
    time += 89_000;
    assert.equal(attempts.retryAfter('ip-a'), 1);
    assert.equal(attempts.fail('ip-a'), 1); // Não prolonga o bloqueio.
    assert.equal(attempts.retryAfter('ip-b'), 0);
    time += 1000;
    assert.equal(attempts.retryAfter('ip-a'), 0);
    for (let count = 0; count < 4; count++) assert.equal(attempts.fail('ip-a'), 0);
    assert.equal(attempts.fail('ip-a'), 90);
});

test('login correto zera a contagem de erros', () => {
    const attempts = createLoginAttempts();
    for (let count = 0; count < 4; count++) attempts.fail('ip');
    attempts.reset('ip');
    assert.equal(attempts.fail('ip'), 0);
});
