import test from 'node:test';
import assert from 'node:assert/strict';
import { imageLink, projectVideo } from '../server/equipment-media.js';

test('imagens aceitam somente links HTTP(S), sem arquivos ou binários no banco', () => {
    assert.equal(imageLink('https://example.com/foto.jpg'), 'https://example.com/foto.jpg');
    assert.equal(imageLink(''), '');
    for (const value of ['data:image/png;base64,AAAA', 'javascript:alert(1)', '/tmp/foto.jpg', 'https://user:password@example.com/image.jpg', 'x'.repeat(2049)]) assert.throws(() => imageLink(value));
});

test('vídeo precisa existir na pasta do projeto; sem vídeo é permitido', async () => {
    assert.equal(await projectVideo(''), '');
    assert.equal(await projectVideo('smokemachine.mp4'), 'smokemachine.mp4');
    await assert.rejects(projectVideo('https://example.com/video.mp4'));
    await assert.rejects(projectVideo('../../private/N4119U2.odt'));
    await assert.rejects(projectVideo('nao-existe.mp4'));
});
