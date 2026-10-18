import { useEffect, useRef, useState } from 'react';
import { Button } from '../Button.jsx';
import { adminApi } from './helpers.js';

export function DeleteRentalForm({ rental, onDeleted, onCancel, onExpired }) {
    const started = useRef(performance.now());
    const [elapsed, setElapsed] = useState(0);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => {
        const timer = window.setInterval(() => setElapsed(performance.now() - started.current), 100);
        return () => window.clearInterval(timer);
    }, []);
    const remaining = Math.max(0, 10 - Math.floor(elapsed / 1000));
    async function remove() {
        if (busy || performance.now() - started.current < 11000) return;
        setBusy(true); setError('');
        try {
            await adminApi(`/rentals/${rental.id}`, { method: 'DELETE' });
            onDeleted();
        } catch (error) {
            if (error.status === 401) onExpired(); else setError(error.message);
            setBusy(false);
        }
    }
    return <div className="delete-rental-confirmation">
        <p>Tem certeza que deseja excluir a reserva de <strong>{rental.customer_name}</strong>? Todos os dados serão perdidos.</p>
        <p className="management-hint">Esta ação é permanente.</p>
        {error && <p role="alert" className="danger">{error}</p>}
        <div className="contract-actions">
            <Button variant="secondary" onClick={onCancel} disabled={busy}>Cancelar</Button>
            <Button className="button--delete" disabled={elapsed < 11000 || busy} onClick={remove}>{busy ? 'Deletando…' : remaining ? `Deletar (${remaining}s)` : 'Deletar'}</Button>
        </div>
    </div>;
}
