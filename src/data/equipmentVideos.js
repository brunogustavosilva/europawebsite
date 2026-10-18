// O Vite inclui estes arquivos no deploy e resolve suas URLs de produção.
const files = import.meta.glob('../assets/equipamentos/data-videos/**/*.{mp4,webm,ogg,MP4,WEBM,OGG}', {
    eager: true, query: '?url', import: 'default',
});
const prefix = '../assets/equipamentos/data-videos/';
export const equipmentVideos = Object.entries(files).map(([path, url]) => ({
    file: path.slice(prefix.length), label: path.slice(prefix.length), url,
})).sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
export const legacyVideoFiles = {
    'maquina-de-fumaca': 'smokemachine.mp4',
    'mooving-head': 'lamboaventador.mp4',
    'barra-de-luz-negra': 'lamboaventador.mp4',
};
export function equipmentVideoUrl(file, id) {
    const key = file ?? legacyVideoFiles[id] ?? '';
    return equipmentVideos.find((video) => video.file === key)?.url;
}
