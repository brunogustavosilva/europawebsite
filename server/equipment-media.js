import { readdir, readFile } from 'node:fs/promises';
import { requireInput, text } from './admin-domain.js';

export function imageLink(value) {
    const link = text(value, 'o link da imagem', 2048, false);
    if (!link) return '';
    let parsed;
    try { parsed = new URL(link); } catch { requireInput(false, 'Informe um link válido para a imagem.'); }
    requireInput(['http:', 'https:'].includes(parsed.protocol), 'O link da imagem deve começar com http:// ou https://.');
    requireInput(!parsed.username && !parsed.password, 'Use um link de imagem sem usuário ou senha.');
    return link;
}
export async function projectVideo(value) {
    const file = text(value, 'o vídeo', 300, false);
    if (!file) return '';
    const names = process.env.VERCEL === '1' ? JSON.parse(await readFile(new URL('./video-manifest.json', import.meta.url), 'utf8')) : await readdir(new URL('../src/assets/equipamentos/data-videos/', import.meta.url), { recursive: true });
    requireInput(names.includes(file) && /\.(mp4|webm|ogg)$/i.test(file), 'Selecione um vídeo disponível na pasta do projeto.');
    return file;
}
