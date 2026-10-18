import { useEffect, useRef, useState } from 'react';

export function RentalSuccess({ onDone }) {
    const dialog = useRef(null);
    const [leaving, setLeaving] = useState(false);
    useEffect(() => {
        const element = dialog.current;
        element.showModal();
        const fade = window.setTimeout(() => setLeaving(true), 2100);
        const close = window.setTimeout(onDone, 2450);
        return () => {
            window.clearTimeout(fade);
            window.clearTimeout(close);
            element.close();
        };
    }, [onDone]);
    return <dialog ref={dialog} className="rental-success" data-leaving={leaving} aria-label="Locação concluída" onCancel={(event) => { event.preventDefault(); onDone(); }}>
        <div className="rental-success-content" role="status">
            <div className="rental-success-symbol" aria-hidden="true">
                <svg viewBox="0 0 100 100" fill="none"><circle className="rental-success-ring" cx="50" cy="50" r="44" /><path className="rental-success-check" d="m29 51 14 14 29-31" /></svg>
            </div>
            <h2>Locação concluída!</h2>
            <p>Recebida com sucesso.</p>
        </div>
    </dialog>;
}
