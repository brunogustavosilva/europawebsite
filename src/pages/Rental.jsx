import { useState } from 'react';
import { useCart } from '../context/CartContext.jsx';
import { useLocalStorage } from '../hooks/useLocalStorage.js';
import { localDate, money, whatsappLink } from '../utils/format.js';
import { CartItems } from '../components/CartItems.jsx';
import { Button } from '../components/Button.jsx';

function sanitizeDetails(saved) {
    return {
        date: typeof saved?.date === 'string' ? saved.date : '',
        address: typeof saved?.address === 'string' ? saved.address : '',
    };
}

export function Rental() {
    const { items, total, services, setService } = useCart();
    const [details, setDetails] = useLocalStorage(
        'eurolight-rental-details-v1',
        { date: '', address: '' },
        sanitizeDetails,
    );
    const [error, setError] = useState('');
    const addressRequired = services.delivery || services.installation;

    function updateDetail(name, value) {
        setDetails((current) => ({ ...current, [name]: value }));
        setError('');
    }

    function submit(event) {
        event.preventDefault();
        if (!items.length) return;

        if (details.date < localDate()) {
            setError('Escolha uma data a partir de hoje.');
            return;
        }

        if (addressRequired && details.address.trim().length < 6) {
            setError('Informe o endereço com rua, número e bairro.');
            return;
        }

        const formattedDate = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' })
            .format(new Date(`${details.date}T12:00:00`));
        const message = [
            '*SOLICITAÇÃO DE LOCAÇÃO — EURO LIGHT*',
            '_Pedido sujeito à disponibilidade e confirmação da loja._',
            '',
            `*Data desejada:* ${formattedDate}`,
            '',
            '*Equipamentos:*',
            ...items.map(({ equipment, quantity }) => (
                `• ${equipment.nome} — ${quantity}x ${money(equipment.preco)} = ${money(equipment.preco * quantity)}`
            )),
            '',
            `• Entrega: ${services.delivery ? 'Solicitada' : 'Não solicitada'}`,
            `• Instalação: ${services.installation ? 'Solicitada' : 'Não solicitada'}`,
            ...(addressRequired ? [`• Endereço: ${details.address.trim()}`] : []),
            '',
            `*Total dos equipamentos:* ${money(total)}`,
            '_Custos de entrega e instalação serão confirmados pela loja._',
        ].join('\n');

        window.location.assign(whatsappLink(message));
    }

    return (
        <main className="section rental-main" id="main-content">
            <a className="text-link" href="/equipamentos">← Voltar ao catálogo</a>
            <p className="eyebrow">FALTA POUCO PARA SUA FESTA</p>
            <h1>Itens da locação</h1>
            <div className="rental-layout">
                <section className="panel" aria-label="Equipamentos selecionados">
                    <CartItems />
                    <div className="total-row"><span>Total dos equipamentos</span><strong>{money(total)}</strong></div>
                </section>
                <form className="panel rental-form" onSubmit={submit}>
                    <h2>Detalhes do evento</h2>
                    <fieldset className="service-options">
                        <legend>Serviços desejados</legend>
                        <label><input type="checkbox" checked={services.installation} onChange={(event) => setService('installation', event.target.checked)} /> Instalação</label>
                        <label><input type="checkbox" checked={services.delivery} onChange={(event) => setService('delivery', event.target.checked)} /> Entrega</label>
                    </fieldset>
                    <p className="muted"><small>A instalação inclui entrega. Valores dos serviços sob consulta.</small></p>
                    <label className="form-field">
                        Data do evento
                        <input type="date" required min={localDate()} value={details.date} onChange={(event) => updateDetail('date', event.target.value)} />
                    </label>
                    <label className="form-field">
                        Endereço de entrega
                        <input type="text" autoComplete="street-address" placeholder="Rua, número e bairro" disabled={!addressRequired} required={addressRequired} minLength={6} value={details.address} onChange={(event) => updateDetail('address', event.target.value)} />
                        {!addressRequired && <small className="muted">Selecione entrega ou instalação para informar o endereço.</small>}
                    </label>
                    {error && <p className="danger" role="alert">{error}</p>}
                    <Button type="submit" variant="contact" disabled={!items.length}>Solicitar pelo WhatsApp ↗</Button>
                    <p className="muted"><small>A solicitação será enviada para confirmação de disponibilidade.</small></p>
                </form>
            </div>
            <p className="document-notice">No dia da locação fazemos um contrato. Tenha em mãos seu documento de identidade e comprovante de residência em seu nome.</p>
        </main>
    );
}
