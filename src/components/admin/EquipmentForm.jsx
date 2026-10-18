import { useState } from 'react';
import { equipmentVideos, legacyVideoFiles } from '../../data/equipmentVideos.js';
import { Button } from '../Button.jsx';
import { adminApi, tagLabels } from './helpers.js';

export function EquipmentForm({ equipment, onSaved, onExpired }) {
    const [form, setForm] = useState({ ...(equipment || { nome: '', stock: '', preco: '', unit_cost: '', voltage: 'bivolt', tag: 'visual' }), image_url: equipment?.image_url || '', video_file: equipment?.video_file ?? legacyVideoFiles[equipment?.id] ?? '' });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
    async function submit(event) {
        event.preventDefault();
        setBusy(true); setError('');
        try {
            await adminApi(equipment ? `/equipment/${equipment.id}` : '/equipment', { method: equipment ? 'PUT' : 'POST', body: form });
            await onSaved();
        } catch (error) {
            if (error.status === 401) onExpired();
            else setError(error.message);
        } finally { setBusy(false); }
    }
    return (
        <form className="management-form" onSubmit={submit}>
            <label className="form-field">Nome do equipamento<input required maxLength={150} value={form.nome} onChange={(event) => set('nome', event.target.value)} /></label>
            <label className="form-field">Link da imagem<input type="url" inputMode="url" required={!equipment} maxLength={2048} pattern="https?://.*" placeholder="https://exemplo.com/equipamento.jpg" value={form.image_url} onChange={(event) => set('image_url', event.target.value)} /><small>Use o link direto de uma imagem.</small></label>
            <label className="form-field">Vídeo do equipamento<select value={form.video_file} onChange={(event) => set('video_file', event.target.value)}><option value="">Sem vídeo</option>{equipmentVideos.map((video) => <option key={video.file} value={video.file}>{video.label}</option>)}{form.video_file && !equipmentVideos.some((video) => video.file === form.video_file) && <option value={form.video_file} disabled>Arquivo indisponível: {form.video_file}</option>}</select><small>Vídeos disponíveis na pasta do projeto.</small></label>
            <div className="form-columns">
                <label className="form-field">Quantidade em estoque<input type="number" min="0" max="100000" step="1" required value={form.stock} onChange={(event) => set('stock', event.target.value)} /></label>
                <label className="form-field">Locação por fim de semana (R$)<input type="number" min="0" step="0.01" required value={form.preco} onChange={(event) => set('preco', event.target.value)} /></label>
            </div>
            <label className="form-field">Preço de compra por unidade (R$)<input type="number" min="0" step="0.01" required aria-describedby="unit-cost-hint" value={form.unit_cost} onChange={(event) => set('unit_cost', event.target.value)} /></label><small id="unit-cost-hint" className="management-hint">Informativo. Não entra nos indicadores de locação.</small>
            <div className="form-columns">
                <label className="form-field">Voltagem<select value={form.voltage} onChange={(event) => set('voltage', event.target.value)}><option value="110">110 V</option><option value="220">220 V</option><option value="bivolt">Bivolt</option></select></label>
                <label className="form-field">Tag<select value={form.tag} onChange={(event) => set('tag', event.target.value)}>{Object.entries(tagLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
            </div>
            {error && <p role="alert" className="danger">{error}</p>}
            <Button type="submit" disabled={busy}>{busy ? 'Salvando…' : 'Salvar equipamento'}</Button>
        </form>
    );
}
