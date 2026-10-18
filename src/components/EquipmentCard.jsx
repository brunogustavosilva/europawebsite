import { useRef, useState } from 'react';
import { money } from '../utils/format.js';
import { Button } from './Button.jsx';
import logo from '../assets/logo-euro-l.svg';

export function EquipmentCard({ equipment, onAdd }) {
    const videoRef = useRef(null);
    const [preview, setPreview] = useState(false);

    async function togglePreview() {
        const video = videoRef.current;
        if (!video) return;

        if (preview) {
            video.pause();
            setPreview(false);
        } else {
            try {
                await video.play();
                setPreview(true);
            } catch {
                setPreview(false);
            }
        }
    }

    return (
        <article className="equipment-card">
            <div className="equipment-media">
                <img src={equipment.imagem || logo} alt={equipment.nome} loading="lazy" onError={(event) => { if (!event.currentTarget.src.endsWith(logo)) event.currentTarget.src = logo; }} />
                {equipment.video && (
                    <>
                        <video ref={videoRef} src={equipment.video} muted loop playsInline preload="none" className="equipment-preview" data-visible={preview} />
                        <button className="preview-button" onClick={togglePreview} aria-pressed={preview} aria-label={`${preview ? 'Pausar' : 'Ver'} vídeo de ${equipment.nome}`}>
                            {preview ? 'Ⅱ Pausar' : '▷ Ver efeito'}
                        </button>
                    </>
                )}
            </div>
            <div className="equipment-details">
                <p className="eyebrow">{equipment.ideal}</p>
                <h2>{equipment.nome}</h2>
                <p className="muted">{equipment.descricao}</p>
                <div className="equipment-footer">
                    <p><strong>{money(equipment.preco)}</strong><small> / {equipment.periodo}</small></p>
                    <Button onClick={() => onAdd(equipment)} aria-label={`Alugar ${equipment.nome}`}>Alugar +</Button>
                </div>
            </div>
        </article>
    );
}
