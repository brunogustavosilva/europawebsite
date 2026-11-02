import { useEffect, useState } from 'react';
import { formatDateInput, parseDateInput } from './admin/helpers.js';
import { localDate } from '../utils/format.js';

const displayDate = (value) => (value ? value.split('-').reverse().join('/') : '');
export function DateInput({ value, onChange, min, ...props }) {
  const [display, setDisplay] = useState(() => displayDate(value));
  useEffect(() => {
    setDisplay(displayDate(value));
  }, [value]);
  return (
    <input
      {...props}
      type="text"
      inputMode="numeric"
      placeholder="--/--/----"
      maxLength={10}
      value={display}
      onChange={(event) => {
        const masked = formatDateInput(event.target.value);
        const iso = parseDateInput(masked);
        const year = Number(localDate().slice(0, 4));
        const selectedYear = Number(iso.slice(0, 4));
        const error = !masked
          ? ''
          : !iso
            ? 'Informe um dia e mês válidos no formato DD/MM/AAAA.'
            : selectedYear < year || selectedYear > year + 1
              ? `Escolha uma data de ${year} ou ${year + 1}.`
              : min && iso < min
                ? 'Escolha uma data a partir de hoje.'
                : '';
        setDisplay(masked);
        event.target.setCustomValidity(error);
        if (!error) onChange(iso);
      }}
    />
  );
}
