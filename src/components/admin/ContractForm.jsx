import { useEffect, useRef, useState } from 'react';
import { Button } from '../Button.jsx';
import { adminApi, formatDate, formatDateInput, parseDateInput, formatPhone } from './helpers.js';
import { money } from '../../utils/format.js';

function documentMask(value) {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    if (digits.length > 11) return digits.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/(\d{3})(\d{4})/, '$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    return digits.replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function ContractDate({ label, value, onChange }) {
    const [display, setDisplay] = useState(formatDate(value));
    return <label className="form-field">{label}<input type="text" inputMode="numeric" required maxLength={10} placeholder="DD/MM/AAAA" value={display} onChange={(event) => {
        const masked = formatDateInput(event.target.value);
        const iso = parseDateInput(masked);
        setDisplay(masked); onChange(iso);
        event.target.setCustomValidity(masked && !iso ? 'Informe uma data válida no formato DD/MM/AAAA.' : '');
    }} /></label>;
}

export function ContractForm({ rentalId, onExpired }) {
    const [draft, setDraft] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [preview, setPreview] = useState('');
    const [printReady, setPrintReady] = useState(false);
    const iframe = useRef(null);
    const urls = useRef([]);
    useEffect(() => {
        const controller = new AbortController();
        adminApi(`/rentals/${rentalId}/contract`, { signal: controller.signal }).then(({ draft }) => setDraft({ ...draft, phone: draft.phone.replace(/\D/g, '').length <= 11 ? formatPhone(draft.phone) : draft.phone })).catch((error) => {
            if (error.name === 'AbortError') return;
            if (error.status === 401) onExpired(); else setError(error.message);
        });
        return () => controller.abort();
    }, [rentalId, onExpired]);
    useEffect(() => () => { urls.current.forEach((url) => URL.revokeObjectURL(url)); }, []);
    const set = (key, value) => { setDraft((current) => ({ ...current, [key]: value })); setNotice(''); };
    const setItem = (index, key, value) => setDraft((current) => ({ ...current, items: current.items.map((item, position) => position === index ? { ...item, [key]: value } : item) }));

    async function generate(event) {
        event.preventDefault(); setError(''); setNotice(''); setBusy(true);
        const format = event.nativeEvent.submitter?.value || 'odt';
        try {
            const response = await fetch(`/api/admin/rentals/${rentalId}/contract?format=${format}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft),
            });
            if (response.status === 401) { onExpired(); return; }
            if (!response.ok) { const data = await response.json(); throw new Error(data.error || 'Não foi possível gerar o contrato.'); }
            if (format === 'html') { setPrintReady(false); setPreview(await response.text()); }
            else {
                const url = URL.createObjectURL(await response.blob()); urls.current.push(url);
                const anchor = document.createElement('a'); anchor.href = url; anchor.download = `contrato-${rentalId}.odt`;
                document.body.appendChild(anchor); anchor.click(); anchor.remove();
                setNotice('Contrato ODT gerado.');
            }
        } catch (error) { setError(error.message); }
        finally { setBusy(false); }
    }
    if (!draft) return <p role={error ? 'alert' : 'status'} className={error ? 'danger' : 'muted'}>{error || 'Preparando os dados do contrato…'}</p>;
    if (preview) return <div className="contract-preview"><p className="management-hint">Confira o contrato antes de imprimir. Na janela de impressão, selecione “Salvar como PDF” para baixar uma cópia.</p><iframe ref={iframe} title="Prévia do contrato" srcDoc={preview} sandbox="allow-same-origin allow-modals" onLoad={() => setPrintReady(true)} /><div className="contract-actions"><Button onClick={() => setPreview('')}>Voltar aos dados</Button><Button disabled={!printReady} onClick={() => { iframe.current.contentWindow.focus(); iframe.current.contentWindow.print(); }}>Imprimir / Salvar PDF</Button></div></div>;
    const itemTotal = draft.items.reduce((sum, item) => sum + Math.round(Number(item.unit_price || 0) * 100) * Number(item.quantity || 0), 0) / 100;
    return <form className="management-form contract-form" onSubmit={generate}>
        <p className="contract-draft-note">Alterações nesta janela valem apenas para este contrato. A locação cadastrada permanece igual.</p>
        <label className="form-field">Nome do cliente<input required maxLength={150} value={draft.customer_name} onChange={(event) => set('customer_name', event.target.value)} /></label>
        <div className="form-columns"><label className="form-field">CPF/CNPJ<input required inputMode="numeric" maxLength={18} placeholder="CPF ou CNPJ" value={draft.cpf} onChange={(event) => set('cpf', documentMask(event.target.value))} /></label><label className="form-field">Telefone<input required type="tel" maxLength={16} value={draft.phone} onChange={(event) => set('phone', formatPhone(event.target.value))} /></label></div>
        <label className="form-field">Endereço do cliente<input required maxLength={500} value={draft.address} onChange={(event) => set('address', event.target.value)} /></label>
        <div className="form-columns"><ContractDate label="Data de retirada/entrega" value={draft.pickup_date} onChange={(value) => set('pickup_date', value)} /><label className="form-field">Horário de retirada/entrega<input type="time" required value={draft.pickup_time} onChange={(event) => set('pickup_time', event.target.value)} /></label></div>
        <div className="form-columns"><ContractDate label="Data de devolução" value={draft.return_date} onChange={(value) => set('return_date', value)} /><label className="form-field">Horário de devolução<input type="time" required value={draft.return_time} onChange={(event) => set('return_time', event.target.value)} /></label></div>
        <fieldset className="contract-items"><legend>Relação de equipamentos</legend>{draft.items.map((item, index) => <div className="contract-item-editor" key={index}>
            <div className="contract-item-heading"><strong>Item {index + 1}</strong><button type="button" className="text-button danger" disabled={draft.items.length === 1} onClick={() => set('items', draft.items.filter((_, position) => position !== index))}>Remover</button></div>
            <label className="form-field">Nome do equipamento {index + 1}<input required maxLength={150} value={item.name} onChange={(event) => setItem(index,'name',event.target.value)} /></label>
            <div className="form-columns"><label className="form-field">Quantidade {index + 1}<input type="number" min="1" max="100000" step="1" required value={item.quantity} onChange={(event) => setItem(index,'quantity',event.target.value)} /></label><label className="form-field">Locação unitária {index + 1} (R$)<input type="number" min="0" step="0.01" required value={item.unit_price} onChange={(event) => setItem(index,'unit_price',event.target.value)} /></label></div>
            <label className="form-field">Valor real unitário {index + 1} (R$)<input type="number" min="0" step="0.01" required value={item.unit_cost} onChange={(event) => setItem(index,'unit_cost',event.target.value)} /></label>
            <p className="management-hint">Total deste item: {money(Math.round(Number(item.unit_price || 0) * 100) * Number(item.quantity || 0) / 100)}</p>
        </div>)}<button type="button" className="text-button" disabled={draft.items.length >= 100} onClick={() => set('items',[...draft.items,{name:'',quantity:1,unit_price:'0',unit_cost:'0'}])}>+ Adicionar item ao contrato</button></fieldset>
        <div className="suggested-total"><span>Soma dos itens: {money(itemTotal)}</span><button type="button" className="text-button" onClick={() => set('total',itemTotal.toFixed(2))}>Usar este valor</button></div>
        <div className="form-columns"><label className="form-field">Valor total do contrato (R$)<input type="number" min="0" step="0.01" required value={draft.total} onChange={(event) => set('total',event.target.value)} /></label><label className="form-field">Sinal (R$)<input type="number" min="0" max={draft.total || undefined} step="0.01" required value={draft.deposit} onChange={(event) => set('deposit',event.target.value)} /></label></div>
        {error && <p role="alert" className="danger">{error}</p>}{notice && <p role="status" className="management-success">{notice}</p>}
        <div className="contract-actions"><Button type="submit" value="odt" disabled={busy}>{busy ? 'Gerando…' : 'Baixar contrato ODT'}</Button><Button type="submit" value="html" disabled={busy}>Visualizar / Imprimir</Button></div>
    </form>;
}
