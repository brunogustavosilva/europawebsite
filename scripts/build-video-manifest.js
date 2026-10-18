import { readdir, writeFile } from 'node:fs/promises';
const names = await readdir(new URL('../src/assets/equipamentos/data-videos/', import.meta.url), { recursive: true });
await writeFile(new URL('../server/video-manifest.json', import.meta.url), JSON.stringify(names.filter(name => /\.(mp4|webm|ogg)$/i.test(name)).sort(), null, 2) + '\n');
