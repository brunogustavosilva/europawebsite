import { useCallback, useEffect, useState } from 'react';
import logo from '../../assets/logo-euro-l.svg';
import { money } from '../../utils/format.js';
import { Modal } from '../Modal.jsx';
import { Button } from '../Button.jsx';
import { Reveal } from '../Reveal.jsx';
import { RentalSuccess } from './RentalSuccess.jsx';
import { RentalForm } from './RentalForm.jsx';
import { EquipmentForm } from './EquipmentForm.jsx';
import { RentalContact } from './RentalContact.jsx';
import { DeleteRentalForm } from './DeleteRentalForm.jsx';
import { ContractForm } from './ContractForm.jsx';
import { adminApi, formatCpf, formatDate, formatMonth, shiftDay, statusLabels, tagLabels } from './helpers.js';

function Metric({ label, value, note, accent }) {
    return <Reveal as="article" className={`metric-card${accent ? ' metric-accent' : ''}`}><span>{label}</span><strong>{value}</strong><small>{note}</small></Reveal>;
}

export function AdminDashboard({ user, onLogout, loggingOut, logoutError, onExpired }) {
    const [tab, setTab] = useState('general');
    const [month, setMonth] = useState('');
    const [week, setWeek] = useState('');
    const [data, setData] = useState(null);
    const [inventory, setInventory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [version, setVersion] = useState(0);
    const [modal, setModal] = useState(null);
    const [tag, setTag] = useState('');
    const [sort, setSort] = useState('name');
    const [query, setQuery] = useState('');
    const [notice, setNotice] = useState('');
    const [receiving, setReceiving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const dismissSuccess = useCallback(() => setShowSuccess(false), []);
    const [receiveError, setReceiveError] = useState('');

    useEffect(() => { setReceiveError(''); }, [modal]);
    async function receiveRental(rental) {
        setReceiving(true); setReceiveError('');
        try {
            await adminApi(`/rentals/${rental.id}/receive`, { method: 'POST' });
            setModal(null);
            setShowSuccess(true);
            setVersion((value) => value + 1);
            setNotice('Locação recebida e concluída com sucesso.');
        } catch (error) {
            if (error.status === 401) onExpired(); else setReceiveError(error.message);
        } finally { setReceiving(false); }
    }

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true); setError('');
        Promise.all([
            adminApi(`/dashboard${month ? `?month=${month}` : ''}`, { signal: controller.signal }),
            adminApi(`/inventory${week ? `?week=${week}` : ''}`, { signal: controller.signal }),
        ]).then(([dashboard, stock]) => { setData(dashboard); setInventory(stock); }).catch((error) => {
            if (error.name === 'AbortError') return;
            if (error.status === 401) onExpired();
            else setError(error.message);
        }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [month, week, version, onExpired]);

    useEffect(() => {
        if (!data?.today) return;
        const timer = window.setInterval(() => {
            const current = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
            if (current !== data.today) { setMonth(''); setVersion((value) => value + 1); }
        }, 60000);
        return () => window.clearInterval(timer);
    }, [data?.today]);

    const savedRental = useCallback(async (savedMonth) => {
        setModal(null); setMonth(savedMonth); setTab('general'); setVersion((value) => value + 1); setNotice('Locação salva com sucesso.');
    }, []);
    const savedEquipment = useCallback(async () => {
        setModal(null); setVersion((value) => value + 1); setNotice('Equipamento salvo com sucesso.');
    }, []);
    const summary = data?.months.find((item) => item.month === data.month);
    const equipment = (inventory?.items || []).filter((item) => (!tag || item.tag === tag) && item.nome.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')))
        .sort((a, b) => sort === 'price-desc' ? b.preco - a.preco : sort === 'price-asc' ? a.preco - b.preco : a.nome.localeCompare(b.nome, 'pt-BR'));
    const maxValue = Math.max(1, ...(data?.months || []).map((item) => item.completedValue + item.plannedValue));
    const detail = modal?.type === 'detail' ? modal.rental : null;
    const closedDetail = detail && detail.rental_date.slice(0, 7) < data.today.slice(0, 7);
    const modalTitle = modal?.type === 'contact' ? 'WhatsApp do cliente' : modal?.type === 'delete' ? 'Tem certeza?' : modal?.type === 'rental' ? (modal.rental ? 'Editar locação' : 'Nova locação') : modal?.type === 'equipment' ? (modal.equipment ? 'Editar equipamento' : 'Novo equipamento') : modal?.type === 'contract' ? 'Realizar contrato' : 'Detalhes da locação';

    return (
        <div className="management-shell">
            <aside className="management-sidebar">
                <a className="management-brand" href="/admin"><img src={logo} alt="Euro Light" width="48" height="48" /><span>EURO LIGHT<small>Administração</small></span></a>
                <p className="sidebar-caption">ESPAÇO DE TRABALHO</p>
                <nav aria-label="Administração">
                    <button className={tab === 'general' ? 'is-active' : ''} aria-current={tab === 'general' ? 'page' : undefined} onClick={() => { setTab('general'); setNotice(''); }}><span aria-hidden="true">▦</span> Geral</button>
                    <button className={tab === 'equipment' ? 'is-active' : ''} aria-current={tab === 'equipment' ? 'page' : undefined} onClick={() => { setTab('equipment'); setNotice(''); }}><span aria-hidden="true">▤</span> Equipamentos</button>
                </nav>
                <div className="sidebar-bottom"><a href="/">↗ Ver loja</a><div><span className="account-avatar" aria-hidden="true">E</span><span>{user.username}<small>Administrador</small></span></div><button onClick={onLogout} disabled={loggingOut}>{loggingOut ? 'Saindo…' : 'Sair'}</button></div>
            </aside>
            <main id="main-content" className="management-main">
                <header className="management-header"><div><p className="eyebrow">PAINEL DA LOJA</p><h1>{tab === 'general' ? 'Visão geral' : 'Equipamentos'}</h1><p className="muted">{tab === 'general' ? 'Acompanhe suas locações, mês a mês.' : 'Estoque e disponibilidade para cada fim de semana.'}</p></div><span className="workspace-badge"><span /> Euro Light</span></header>
                {(error || logoutError) && <div role="alert" className="management-alert danger">{error || logoutError} {error && <button className="text-button" onClick={() => setVersion((value) => value + 1)}>Tentar novamente</button>}</div>}
                {notice && <p className="management-success" role="status">✓ {notice}</p>}
                <div className="management-loading" role="status">{loading ? 'Atualizando painel…' : ''}</div>
                {data && tab === 'general' && (<div className="month-switcher" aria-label="Selecionar mês">{data.months.map((item) => <button key={item.month} aria-pressed={(month || data.month) === item.month} className={(month || data.month) === item.month ? 'is-active' : ''} onClick={() => { setMonth(item.month); setNotice(''); }}><span>{new Date(`${item.month}-01T12:00:00`).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span><small>{item.month.slice(0, 4)}{item.closed ? ' · fechado' : ''}</small></button>)}</div>)}
                {data && inventory && <div className="management-content" data-loading={loading} aria-busy={loading} inert={loading}>
                <div className="management-view" key={`${tab}-${data.month}-${inventory.week}`}>
                {tab === 'general' ? <>
                    <section className="dashboard-month-heading"><h2>{formatMonth(data.month)}</h2><span className={`status-pill ${summary.closed ? 'status-closed' : 'status-prevista'}`}>{summary.closed ? 'Mês encerrado' : 'Mês aberto'}</span></section>
                    <div className="metrics-grid">
                        <Metric label="Locações feitas" value={money(summary.completedValue)} note="Valor das locações concluídas" accent />
                        <Metric label="Valor previsto" value={summary.closed ? '—' : money(summary.plannedValue)} note="Locações ainda não concluídas" />
                        <Metric label="Locações previstas" value={summary.closed ? '—' : summary.plannedCount} note="Agendamentos do mês" />
                        <Metric label="Locações concluídas" value={summary.completedCount} note="Atendimentos finalizados" />
                    </div>
                    {summary.closed && <p className="management-hint closed-note">Este mês é somente leitura. Locações previstas não concluídas foram retiradas dos indicadores e da tabela, mantendo o histórico preservado.</p>}
                    <Reveal as="section" className="management-card revenue-overview"><div className="card-heading"><h2>Evolução das locações</h2><div className="chart-legend"><span><i className="completed-dot" />Concluídas</span><span><i className="planned-dot" />Previstas</span></div></div><div className="revenue-chart">{data.months.map((item) => <button key={item.month} aria-label={`${formatMonth(item.month)}: ${money(item.completedValue)} concluídas, ${money(item.plannedValue)} previstas`} onClick={() => setMonth(item.month)} className={item.month === data.month ? 'is-active' : ''}><span className="chart-bars"><span className="completed-bar" style={{ height: `${item.completedValue / maxValue * 100}%` }} /><span className="planned-bar" style={{ height: `${item.plannedValue / maxValue * 100}%` }} /></span><span>{new Date(`${item.month}-01T12:00:00`).toLocaleDateString('pt-BR', { month: 'short' })}</span></button>)}</div></Reveal>
                    <Reveal as="section" className="management-card"><div className="card-heading"><div><h2>Locações do mês</h2><p className="muted">Selecione um cliente para ver os detalhes.</p></div><span className="count-pill">{data.rentals.length} registros</span></div><div className="table-scroll"><table className="management-table"><thead><tr><th>Cliente</th><th>Data</th><th>Itens</th><th>Entrega</th><th>Valor</th><th className="rental-status-heading"><span>Status</span></th></tr></thead><tbody>{data.rentals.map((rental) => <tr key={rental.id} onClick={() => setModal({ type: 'detail', rental })}><td><button className="table-name" onClick={() => setModal({ type: 'detail', rental })}>{rental.customer_name}</button><small>{rental.phone}</small></td><td>{formatDate(rental.rental_date)}</td><td>{rental.items.reduce((sum, item) => sum + item.quantity, 0)}</td><td>{rental.delivery ? 'Sim' : 'Não'}</td><td>{money(rental.total)}</td><td><div className="rental-status-actions"><span className={`status-pill status-${rental.status}`}>{statusLabels[rental.status]}</span><button type="button" className="rental-whatsapp-button" aria-label={`WhatsApp de ${rental.customer_name}`} title="WhatsApp do cliente" onClick={(event) => { event.stopPropagation(); setModal({ type: 'contact', rental }); }}><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3 21l1.5-5.1A8.5 8.5 0 1 1 20.5 11.5Z" /><path d="m8.4 7.4 1.5 2.5-1 1.2c.8 1.7 2 2.8 3.7 3.5l1.2-1.1 2.7 1.3c-.3 1.6-1.4 2.1-2.7 1.8-3.9-.9-7-4-7.2-7-.1-1 .6-1.9 1.8-2.2Z" /></svg></button>{!summary.closed && <button type="button" className="rental-delete-button" aria-label={`Excluir reserva de ${rental.customer_name}`} title="Excluir reserva" onClick={(event) => { event.stopPropagation(); setModal({ type: 'delete', rental }); }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6M14 10v6" /></svg></button>}</div></td></tr>)}</tbody></table></div>{!data.rentals.length && <div className="management-empty"><span aria-hidden="true">▦</span><h3>Nenhuma locação neste mês</h3><p>{summary.closed ? 'Não há locações concluídas neste período.' : 'Use o botão + para cadastrar a primeira locação.'}</p></div>}</Reveal>
                    <p className="management-hint">O sinal não é somado aos valores. A receita é reconhecida pelo valor total quando a locação é concluída.</p>
                </> : <>
                    <div className="inventory-period"><div><label className="form-field">Semana de referência<input type="date" aria-label="Semana de referência" value={week || inventory.week} onChange={(event) => { if (event.target.value) setWeek(event.target.value); }} /></label><p className="management-hint">Ocupação: {formatDate(inventory.occupiedFrom)} a {formatDate(inventory.occupiedUntil)} · segunda a domingo</p></div><div className="week-arrows"><button className="icon-button" aria-label="Semana anterior" onClick={() => setWeek(shiftDay(inventory.week, -7))}>←</button><button className="icon-button" aria-label="Próxima semana" onClick={() => setWeek(shiftDay(inventory.week, 7))}>→</button></div></div>
                    <div className="metrics-grid inventory-metrics"><Metric label="Total de equipamentos" value={inventory.totals.quantity} note={`${inventory.items.length} tipos cadastrados`} /><Metric label="Potencial por fim de semana" value={money(inventory.totals.potential)} note="Locação unitária × estoque total" accent /><Metric label="Disponíveis nesta semana" value={inventory.totals.available} note="Menor disponibilidade no período" /></div>
                    <Reveal as="section" className="management-card"><div className="card-heading"><h2>Estoque de equipamentos</h2><span className="count-pill">{equipment.length} tipos</span></div><div className="inventory-filters"><label><span className="sr-only">Buscar equipamento</span><input placeholder="Buscar equipamento…" value={query} onChange={(event) => setQuery(event.target.value)} /></label><label><span className="sr-only">Filtrar por tag</span><select aria-label="Filtrar por tag" value={tag} onChange={(event) => setTag(event.target.value)}><option value="">Todas as tags</option>{Object.entries(tagLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label><span className="sr-only">Ordenar equipamentos</span><select aria-label="Ordenar equipamentos" value={sort} onChange={(event) => setSort(event.target.value)}><option value="name">Nome A–Z</option><option value="price-desc">Mais caro primeiro</option><option value="price-asc">Mais barato primeiro</option></select></label></div><div className="table-scroll"><table className="management-table"><thead><tr><th>Equipamento</th><th>Tag</th><th>Voltagem</th><th>Estoque</th><th>Reservados</th><th>Disponíveis</th><th>Locação / fim de semana</th><th>Compra / unidade</th></tr></thead><tbody>{equipment.map((item) => <tr key={item.id} onClick={() => setModal({ type: 'equipment', equipment: item })}><td><button className="table-name" onClick={() => setModal({ type: 'equipment', equipment: item })}>{item.nome}</button></td><td><span className="tag-pill">{tagLabels[item.tag]}</span></td><td>{item.voltage === 'bivolt' ? 'Bivolt' : `${item.voltage} V`}</td><td>{item.stock}</td><td>{item.reserved}</td><td><strong className={item.available === 0 ? 'muted' : 'stock-available'}>{item.available}</strong></td><td>{money(item.preco)}</td><td>{money(item.unit_cost)}</td></tr>)}</tbody></table></div>{!equipment.length && <div className="management-empty"><h3>Nenhum equipamento encontrado</h3><p>Altere os filtros ou cadastre um novo item no botão +.</p></div>}</Reveal><p className="management-hint">O preço de compra é apenas informativo e não entra na dashboard. Altere o estoque de cada equipamento para informar suas unidades reais.</p>
                </>}
                </div>
                </div>}
                <button type="button" className="management-add" disabled={!data || loading || !!error} aria-label={tab === 'general' ? 'Cadastrar locação' : 'Cadastrar equipamento'} onClick={() => setModal({ type: tab === 'general' ? 'rental' : 'equipment' })}><span aria-hidden="true">+</span></button>
            </main>
            <Modal open={!!modal} onClose={() => setModal(null)} title={modalTitle} className="management-modal">
                {modal?.type === 'contact' && <RentalContact rental={modal.rental} />}
                {modal?.type === 'delete' && <DeleteRentalForm key={modal.rental.id} rental={modal.rental} onExpired={onExpired} onCancel={() => setModal(null)} onDeleted={() => { setModal(null); setVersion((value) => value + 1); setNotice('Reserva excluída com sucesso.'); }} />}
                {modal?.type === 'rental' && <RentalForm key={modal.rental?.id || 'new-rental'} rental={modal.rental} today={data.today} onSaved={savedRental} onExpired={onExpired} />}
                {modal?.type === 'equipment' && <EquipmentForm key={modal.equipment?.id || 'new-equipment'} equipment={modal.equipment} onSaved={savedEquipment} onExpired={onExpired} />}
                {modal?.type === 'contract' && <ContractForm key={modal.rental.id} rentalId={modal.rental.id} onExpired={onExpired} />}
                {detail && <div className="rental-detail"><span className={`status-pill status-${detail.status}`}>{statusLabels[detail.status]}</span><h3>{detail.customer_name}</h3><dl><div><dt>Telefone</dt><dd>{detail.phone}</dd></div><div><dt>CPF</dt><dd>{detail.cpf ? formatCpf(detail.cpf) : 'Não informado'}</dd></div><div><dt>Data da locação</dt><dd>{formatDate(detail.rental_date)}</dd></div><div><dt>Endereço</dt><dd>{detail.address || 'Não informado'}</dd></div><div><dt>Entrega</dt><dd>{detail.delivery ? `Com entrega${detail.delivery_time ? ` · prevista para ${detail.delivery_time}` : ''}` : 'Retirada pelo cliente'}</dd></div><div><dt>Ocupação dos itens</dt><dd>{formatDate(detail.occupied_from)} a {formatDate(detail.occupied_until)}</dd></div></dl><h4>Equipamentos alugados</h4><ul className="detail-items">{detail.items.map((item) => <li key={item.equipment_id}><span>{item.quantity}× {item.name}<small>{money(item.unit_price)} por unidade</small></span><strong>{money(item.quantity * item.unit_price)}</strong></li>)}</ul><dl className="detail-totals"><div><dt>Valor da locação</dt><dd>{money(detail.total)}</dd></div><div><dt>Sinal recebido</dt><dd>{money(detail.deposit)}</dd></div><div><dt>Saldo a receber</dt><dd>{money(Math.max(0, detail.total - detail.deposit))}</dd></div></dl>{detail.notes && <p className="detail-notes">{detail.notes}</p>}{closedDetail && <p className="management-hint">Mês encerrado. Este registro não aceita alterações.</p>}{receiveError && <p role="alert" className="danger">{receiveError}</p>}<div className="contract-actions">{!closedDetail && detail.status === 'prevista' && <Button disabled={receiving} onClick={() => receiveRental(detail)}>{receiving ? 'Recebendo…' : 'Receber locação'}</Button>}{!closedDetail && <Button onClick={() => setModal({ type: 'rental', rental: detail })}>Editar locação</Button>}{!closedDetail && <Button className="button--contract" onClick={() => setModal({ type: 'contract', rental: detail })}>Realizar contrato</Button>}</div></div>}
            </Modal>
            {showSuccess && <RentalSuccess onDone={dismissSuccess} />}
        </div>
    );
}
