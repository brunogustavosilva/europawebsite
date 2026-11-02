import { rentalKitDiscount, selectRentalKit } from '../../utils/rental-kit-discount.js';
import { MoneyInput } from '../MoneyInput.jsx';
import { DateInput } from '../DateInput.jsx';
import { useEffect, useState } from 'react';
import { brazilianPhone } from '../../utils/phone.js';
import { Button } from '../Button.jsx';
import { money } from '../../utils/format.js';
import { adminApi, formatCpf, formatPhone, formatDate } from './helpers.js';

export function RentalForm({ rental, today, onSaved, onExpired }) {
  const [form, setForm] = useState(
    rental
      ? {
          ...rental,
          delivery_time: rental.delivery_time || '',
          cpf: formatCpf(rental.cpf),
          phone: formatPhone(rental.phone),
          items: rental.items.map((item) => ({
            equipment_id: item.equipment_id,
            quantity: item.quantity,
          })),
        }
      : {
          customer_name: '',
          cpf: '',
          phone: '',
          address: '',
          rental_date: today,
          total: '',
          deposit: '0',
          delivery: false,
          delivery_time: '',
          status: 'prevista',
          notes: '',
          items: [{ equipment_id: '', quantity: 1 }],
        },
  );
  const [appliedKitKey, setAppliedKitKey] = useState('');
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [availabilityError, setAvailabilityError] = useState('');
  const set = (key, value) => {
    if (key === 'total') setAppliedKitKey('');
    setForm((current) => ({ ...current, [key]: value }));
  };
  const kitOffer = rentalKitDiscount(form.items, inventory?.items || []);
  const offerKey = kitOffer
    ? JSON.stringify([
        kitOffer.id,
        kitOffer.price,
        form.items.map((item) => [item.equipment_id, Number(item.quantity)]).sort(),
      ])
    : '';
  const kitApplied = Boolean(offerKey && appliedKitKey === offerKey);
  const effectiveTotal = kitApplied ? kitOffer.price.toFixed(2) : form.total;
  useEffect(() => {
    setAppliedKitKey('');
  }, [offerKey]);
  useEffect(() => {
    const controller = new AbortController();
    setInventory(null);
    setAvailabilityError('');
    if (!form.rental_date) {
      setLoading(false);
      return;
    }
    setLoading(true);
    adminApi(`/inventory?rentalDate=${form.rental_date}${rental ? `&exclude=${rental.id}` : ''}`, {
      signal: controller.signal,
    })
      .then(setInventory)
      .catch((error) => {
        if (error.name === 'AbortError') return;
        if (error.status === 401) onExpired();
        else setAvailabilityError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [form.rental_date, rental, onExpired]);
  function setItem(index, key, value) {
    const selectedKit =
      key === 'equipment_id' && inventory?.items.find((item) => item.id === value && item.is_kit);
    if (selectedKit) {
      const expanded = selectRentalKit(form.items, index, value, inventory.items);
      if (expanded.length > 100) {
        setError('Este kit ultrapassa o limite de 100 equipamentos diferentes na locação.');
        return;
      }
      setError('');
      set('items', expanded);
      return;
    }
    setForm((current) => ({
      ...current,
      items: current.items.map((item, position) => {
        if (position !== index) return item;
        const updated = { ...item, [key]: value };
        const selected = inventory?.items.find(
          (equipment) => equipment.id === updated.equipment_id,
        );
        const limit =
          current.status === 'cancelada' ? 100000 : Math.max(0, selected?.available || 0);
        if (updated.quantity !== '' && selected) {
          updated.quantity = Math.min(
            limit,
            Math.max(1, Math.floor(Number(updated.quantity) || 1)),
          );
        }
        return updated;
      }),
    }));
  }
  const invalidStock =
    form.status !== 'cancelada' &&
    form.items.some((item) => {
      const selected = inventory?.items.find((equipment) => equipment.id === item.equipment_id);
      return (
        !selected ||
        !Number.isInteger(Number(item.quantity)) ||
        Number(item.quantity) < 1 ||
        Number(item.quantity) > selected.available
      );
    });
  const suggested =
    form.items.reduce(
      (sum, item) =>
        sum +
        Math.round(
          (rental?.items.find((entry) => entry.equipment_id === item.equipment_id)?.unit_price ??
            inventory?.items.find((equipment) => equipment.id === item.equipment_id)?.preco ??
            0) * 100,
        ) *
          Number(item.quantity || 0),
      0,
    ) / 100;
  async function submit(event) {
    event.preventDefault();
    setError('');
    if (!brazilianPhone(form.phone)) {
      setError('Informe um telefone brasileiro válido com DDD.');
      return;
    }
    if (!inventory || loading || invalidStock) {
      setError(
        'Revise as quantidades: não é possível reservar mais unidades do que as disponíveis no período.',
      );
      return;
    }
    setBusy(true);
    try {
      await adminApi(rental ? `/rentals/${rental.id}` : '/rentals', {
        method: rental ? 'PUT' : 'POST',
        body: { ...form, total: effectiveTotal, apply_kit_discount: kitApplied },
      });
      await onSaved(form.rental_date.slice(0, 7));
    } catch (error) {
      if (error.status === 401) onExpired();
      else setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="management-form" onSubmit={submit}>
      <label className="form-field">
        Nome do cliente
        <input
          required
          maxLength={150}
          value={form.customer_name}
          onChange={(event) => set('customer_name', event.target.value)}
        />
      </label>
      <label className="form-field">
        CPF do cliente (opcional)
        <input
          type="text"
          inputMode="numeric"
          maxLength={14}
          pattern="[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}"
          title="Informe os 11 dígitos do CPF ou deixe em branco."
          placeholder="000.000.000-00"
          value={form.cpf}
          onChange={(event) => set('cpf', formatCpf(event.target.value))}
        />
      </label>
      <div className="form-columns">
        <label className="form-field">
          Telefone
          <input
            type="tel"
            inputMode="tel"
            required
            maxLength={16}
            placeholder="(41) 9 9999-9999"
            autoComplete="tel-national"
            value={form.phone}
            onChange={(event) => set('phone', formatPhone(event.target.value))}
          />
        </label>
        <label className="form-field">
          Data da locação
          <DateInput
            required
            value={form.rental_date}
            onChange={(value) => set('rental_date', value)}
          />
        </label>
      </div>
      <p className="management-hint">
        {inventory
          ? `Ocupação dos equipamentos: ${formatDate(inventory.occupiedFrom)} a ${formatDate(inventory.occupiedUntil)}, incluindo a data final.`
          : 'O equipamento fica ocupado do dia anterior ao evento até dois dias depois, incluindo o dia da devolução (4 dias).'}
      </p>
      <label className="check-field">
        <input
          type="checkbox"
          checked={form.delivery}
          onChange={(event) => set('delivery', event.target.checked)}
        />{' '}
        Com entrega
      </label>
      {form.delivery && (
        <label className="form-field">
          Entrega prevista para:
          <input
            type="time"
            required
            value={form.delivery_time}
            onChange={(event) => set('delivery_time', event.target.value)}
          />
        </label>
      )}
      <label className="form-field">
        Endereço {form.delivery ? 'de entrega' : '(opcional)'}
        <input
          required={form.delivery}
          maxLength={500}
          autoComplete="street-address"
          value={form.address}
          onChange={(event) => set('address', event.target.value)}
        />
      </label>
      <fieldset className="rental-equipment-fields">
        <legend>Equipamentos</legend>
        {loading && (
          <p role="status" className="muted">
            Consultando disponibilidade…
          </p>
        )}
        {availabilityError && (
          <p role="alert" className="danger">
            {availabilityError}
          </p>
        )}
        {form.items.map((item, index) => {
          const selected = inventory?.items.find((equipment) => equipment.id === item.equipment_id);
          return (
            <div className="rental-equipment-row" key={index}>
              <label className="form-field">
                <span className="sr-only">Equipamento {index + 1}</span>
                <select
                  required
                  aria-label={`Equipamento ${index + 1}`}
                  disabled={!inventory}
                  value={item.equipment_id}
                  onChange={(event) => setItem(index, 'equipment_id', event.target.value)}
                >
                  <option value="">Selecione um equipamento</option>
                  {inventory?.items.map((equipment) => (
                    <option
                      key={equipment.id}
                      value={equipment.id}
                      disabled={
                        (form.status !== 'cancelada' &&
                          equipment.available < 1 &&
                          equipment.id !== item.equipment_id) ||
                        form.items.some(
                          (other, position) =>
                            position !== index && other.equipment_id === equipment.id,
                        )
                      }
                    >
                      {equipment.nome} · {equipment.available} livre(s) · {money(equipment.preco)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span className="sr-only">Quantidade {index + 1}</span>
                <input
                  aria-label={`Quantidade ${index + 1}`}
                  type="number"
                  required
                  min="1"
                  disabled={!selected || loading}
                  max={form.status === 'cancelada' ? 100000 : Math.max(0, selected?.available || 0)}
                  step="1"
                  value={item.quantity}
                  onChange={(event) => setItem(index, 'quantity', event.target.value)}
                />
              </label>
              <button
                className="remove-line"
                type="button"
                disabled={form.items.length === 1}
                aria-label={`Remover equipamento ${index + 1}`}
                onClick={() =>
                  set(
                    'items',
                    form.items.filter((_, position) => position !== index),
                  )
                }
              >
                ×
              </button>
            </div>
          );
        })}
        {inventory && invalidStock && form.items.some((item) => item.equipment_id) && (
          <p role="alert" className="danger">
            Revise os itens: a quantidade deve ficar entre 1 e o total disponível no período.
          </p>
        )}
        <button
          type="button"
          className="text-button"
          disabled={form.items.length >= 100}
          onClick={() => set('items', [...form.items, { equipment_id: '', quantity: 1 }])}
        >
          + Adicionar equipamento
        </button>
        <div className="suggested-total">
          <span>Valor pelos itens: {money(suggested)}</span>
          <button
            type="button"
            className="text-button"
            disabled={!inventory}
            onClick={() => set('total', suggested.toFixed(2))}
          >
            Usar este valor
          </button>
        </div>
      </fieldset>
      <div className="rental-kit-discount">
        <label className="check-field">
          <input
            type="checkbox"
            checked={kitApplied}
            disabled={!kitOffer || loading || invalidStock}
            onChange={(event) => setAppliedKitKey(event.target.checked ? offerKey : '')}
          />
          Aplicar desconto kit
          {kitOffer &&
            ` · ${(kitOffer.rate * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`}
        </label>
        {kitOffer ? (
          <p>
            {kitOffer.name}: <del>{money(kitOffer.fullPrice)}</del> →{' '}
            <strong>{money(kitOffer.price)}</strong>
            {invalidStock && ' · Revise a disponibilidade dos equipamentos para aplicar.'}
          </p>
        ) : (
          <p className="management-hint">
            {loading
              ? 'Conferindo os kits disponíveis…'
              : form.items.some((item) =>
                    inventory?.items.some(
                      (equipment) => equipment.id === item.equipment_id && equipment.is_kit,
                    ),
                  )
                ? 'O kit selecionado já utiliza seu preço promocional. Selecione os kits para expandir suas peças e combinar os descontos.'
                : 'Complete os equipamentos de um ou mais kits para liberar o desconto. A máquina de fumaça pode ser compartilhada; itens extras ficam sem desconto.'}
          </p>
        )}
      </div>
      <div className="form-columns">
        <label className="form-field">
          Valor da locação (R$)
          <MoneyInput required value={effectiveTotal} onChange={(value) => set('total', value)} />
        </label>
        <label className="form-field">
          Sinal recebido (R$)
          <MoneyInput
            max={effectiveTotal || undefined}
            required
            value={form.deposit}
            onChange={(value) => set('deposit', value)}
          />
        </label>
      </div>
      <p className="management-hint">
        O sinal é parte do pagamento e não é somado como receita nos indicadores.
      </p>
      <label className="form-field">
        Status
        <select value={form.status} onChange={(event) => set('status', event.target.value)}>
          <option value="prevista">Prevista</option>
          <option value="concluida">Concluída</option>
          <option value="cancelada">Cancelada</option>
        </select>
      </label>
      <label className="form-field">
        Observações
        <textarea
          maxLength={2000}
          rows="3"
          value={form.notes}
          onChange={(event) => set('notes', event.target.value)}
        />
      </label>
      {error && (
        <p role="alert" className="danger">
          {error}
        </p>
      )}
      <Button type="submit" disabled={busy || loading || !inventory || invalidStock}>
        {busy ? 'Salvando…' : 'Salvar locação'}
      </Button>
    </form>
  );
}
