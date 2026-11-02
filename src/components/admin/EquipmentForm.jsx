import { MoneyInput } from '../MoneyInput.jsx';
import { money } from '../../utils/format.js';
import { useState } from 'react';
import { equipmentVideos, legacyVideoFiles } from '../../data/equipmentVideos.js';
import { Button } from '../Button.jsx';
import { adminApi, tagLabels } from './helpers.js';

export function EquipmentForm({ equipment, isKit = false, inventory = [], onSaved, onExpired }) {
  const kit = equipment?.is_kit ?? isKit;
  const availableEquipment = inventory.filter((item) => !item.is_kit);
  const [form, setForm] = useState({
    ...(equipment || {
      nome: '',
      stock: '',
      preco: '',
      unit_cost: '',
      voltage: 'bivolt',
      tag: 'visual',
    }),
    high_demand: equipment?.high_demand ?? false,
    is_kit: kit,
    kit_items: equipment?.kit_items || [],
    descricao: equipment?.descricao || '',
    ideal: equipment?.ideal || '',
    image_url: equipment?.image_url || '',
    video_file: equipment?.video_file ?? legacyVideoFiles[equipment?.id] ?? '',
  });
  const fullPrice =
    form.kit_items.reduce(
      (sum, part) =>
        sum +
        Math.round(
          Number(availableEquipment.find((item) => item.id === part.equipment_id)?.preco || 0) *
            100,
        ) *
          Number(part.quantity || 0),
      0,
    ) / 100;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await adminApi(equipment ? `/equipment/${equipment.id}` : '/equipment', {
        method: equipment ? 'PUT' : 'POST',
        body: form,
      });
      await onSaved();
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
        Nome {kit ? 'do kit' : 'do equipamento'}
        <input
          required
          maxLength={150}
          value={form.nome}
          onChange={(event) => set('nome', event.target.value)}
        />
      </label>
      <label className="check-field">
        <input
          type="checkbox"
          checked={form.high_demand}
          onChange={(event) => set('high_demand', event.target.checked)}
        />
        🔥 Alta demanda
      </label>
      {kit && (
        <fieldset className="kit-composition">
          <legend>Equipamentos do kit</legend>
          <p className="management-hint">
            Escolha os equipamentos e a quantidade de cada um. O estoque é compartilhado com os
            itens avulsos.
          </p>
          {form.kit_items.map((part, index) => (
            <div className="kit-component-row" key={index}>
              <label className="form-field">
                Equipamento
                <select
                  required
                  value={part.equipment_id}
                  onChange={(event) =>
                    set(
                      'kit_items',
                      form.kit_items.map((item, i) =>
                        i === index ? { ...item, equipment_id: event.target.value } : item,
                      ),
                    )
                  }
                >
                  <option value="">Selecione</option>
                  {availableEquipment.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                      disabled={form.kit_items.some(
                        (other, i) => i !== index && other.equipment_id === item.id,
                      )}
                    >
                      {item.nome}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                Quantidade
                <input
                  type="number"
                  required
                  min="1"
                  max="100000"
                  step="1"
                  value={part.quantity}
                  onChange={(event) =>
                    set(
                      'kit_items',
                      form.kit_items.map((item, i) =>
                        i === index ? { ...item, quantity: event.target.value } : item,
                      ),
                    )
                  }
                />
              </label>
              <Button
                variant="secondary"
                aria-label={`Remover equipamento ${index + 1} do kit`}
                onClick={() =>
                  set(
                    'kit_items',
                    form.kit_items.filter((_, i) => i !== index),
                  )
                }
              >
                Remover
              </Button>
            </div>
          ))}
          <Button
            variant="secondary"
            disabled={form.kit_items.length >= availableEquipment.length}
            onClick={() => set('kit_items', [...form.kit_items, { equipment_id: '', quantity: 1 }])}
          >
            + Adicionar equipamento
          </Button>
          {!availableEquipment.length && <p>Cadastre um equipamento antes de criar um kit.</p>}
        </fieldset>
      )}
      <label className="form-field">
        Descrição curta
        <textarea
          maxLength={120}
          rows={3}
          placeholder="Ex.: Iluminação colorida com efeitos para animar a pista."
          value={form.descricao}
          onChange={(event) => set('descricao', event.target.value)}
        />
        <small>{form.descricao.length}/120 caracteres. Aparece no catálogo.</small>
      </label>
      <label className="form-field">
        Indicado para
        <input
          maxLength={150}
          placeholder="Ex.: Festas, casamentos e pistas de dança"
          value={form.ideal}
          onChange={(event) => set('ideal', event.target.value)}
        />
      </label>
      <label className="form-field">
        Link da imagem (opcional)
        <input
          type="url"
          inputMode="url"
          maxLength={2048}
          pattern="https?://.*"
          placeholder="https://exemplo.com/equipamento.jpg"
          value={form.image_url}
          onChange={(event) => set('image_url', event.target.value)}
        />
        <small>Você pode adicionar o link de uma imagem depois.</small>
      </label>
      <label className="form-field">
        Vídeo {kit ? 'do kit' : 'do equipamento'} (opcional)
        <select value={form.video_file} onChange={(event) => set('video_file', event.target.value)}>
          <option value="">Sem vídeo</option>
          {equipmentVideos.map((video) => (
            <option key={video.file} value={video.file}>
              {video.label}
            </option>
          ))}
          {form.video_file && !equipmentVideos.some((video) => video.file === form.video_file) && (
            <option value={form.video_file} disabled>
              Arquivo indisponível: {form.video_file}
            </option>
          )}
        </select>
        <small>Vídeos disponíveis na pasta do projeto.</small>
      </label>
      <div className="form-columns">
        {!kit && (
          <label className="form-field">
            Quantidade em estoque
            <input
              type="number"
              min="0"
              max="100000"
              step="1"
              required
              value={form.stock}
              onChange={(event) => set('stock', event.target.value)}
            />
          </label>
        )}
        <label className="form-field">
          Locação por fim de semana (R$)
          <MoneyInput
            aria-label="Locação por fim de semana (R$)"
            required
            value={form.preco}
            onChange={(value) => set('preco', value)}
          />
          {kit && (
            <small>
              Valor cheio dos equipamentos: <strong>{money(fullPrice)}</strong> / fim de semana
            </small>
          )}
        </label>
      </div>
      {!kit && (
        <>
          <label className="form-field">
            Preço de compra por unidade (R$)
            <MoneyInput
              required
              value={form.unit_cost}
              onChange={(value) => set('unit_cost', value)}
            />
          </label>
          <small className="management-hint">
            Informativo. Não entra nos indicadores de locação.
          </small>
        </>
      )}
      <div className="form-columns">
        <label className="form-field">
          Voltagem
          <select value={form.voltage} onChange={(event) => set('voltage', event.target.value)}>
            <option value="110">110 V</option>
            <option value="220">220 V</option>
            <option value="bivolt">Bivolt</option>
          </select>
        </label>
        <label className="form-field">
          Tag
          <select value={form.tag} onChange={(event) => set('tag', event.target.value)}>
            {Object.entries(tagLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error && (
        <p role="alert" className="danger">
          {error}
        </p>
      )}
      <Button type="submit" disabled={busy || (kit && !form.kit_items.length)}>
        {busy ? 'Salvando…' : kit ? 'Salvar kit' : 'Salvar equipamento'}
      </Button>
    </form>
  );
}
