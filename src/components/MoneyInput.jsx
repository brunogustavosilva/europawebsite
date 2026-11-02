import { money } from '../utils/format.js';

export function MoneyInput({ value, onChange, max, ...props }) {
  return (
    <input
      {...props}
      type="text"
      inputMode="numeric"
      placeholder="R$ ---,--"
      value={value === '' || value == null ? '' : money(Number(value))}
      onChange={(event) => {
        const digits = event.target.value
          .replace(/\D/g, '')
          .replace(/^0+(?=\d)/, '')
          .slice(0, 12);
        const next = digits ? (Number(digits) / 100).toFixed(2) : '';
        event.target.setCustomValidity(
          max !== undefined && next !== '' && Number(next) > Number(max)
            ? 'O valor não pode ultrapassar o total.'
            : '',
        );
        onChange(next);
      }}
    />
  );
}
