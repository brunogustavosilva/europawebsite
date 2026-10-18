import smokeImage from '../assets/equipamentos/maquina.jpg';
import movingHeadImage from '../assets/equipamentos/moving-head.jpeg';
import darklightImage from '../assets/equipamentos/darklight.jpg';

// Apenas os arquivos de mídia ficam no bundle; preços e textos vêm da API.
export const equipmentMedia = {
    'maquina-de-fumaca': { imagem: smokeImage },
    'mooving-head': { imagem: movingHeadImage },
    'barra-de-luz-negra': { imagem: darklightImage },
};

// IDs conhecidos permitem restaurar a sacola antes da resposta da API.
export const equipamentos = Object.keys(equipmentMedia).map((id) => ({ id }));
