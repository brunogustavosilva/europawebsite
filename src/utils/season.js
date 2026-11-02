export function holidaySeason(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date);
  const month = Number(parts.find((part) => part.type === 'month').value);
  const day = Number(parts.find((part) => part.type === 'day').value);
  if (month === 12 && day >= 19 && day <= 25) return 'christmas';
  if ((month === 12 && day >= 26) || (month === 1 && day === 1)) return 'new-year';
  return null;
}

export function festiveEffectsActive(date = new Date()) {
  const month = Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      month: 'numeric',
    }).format(date),
  );
  return month === 11 || month === 12 || month === 1;
}

export function rentalHolidayLabel(isoDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate || '')) return '';
  const date = new Date(`${isoDate}T12:00:00-03:00`);
  if (Number.isNaN(date.valueOf())) return '';
  const season = holidaySeason(date);
  return season === 'christmas'
    ? '🎅 🎄 ⭐ Natal'
    : season === 'new-year'
      ? '🎉 🎆 🥂 Ano Novo'
      : '';
}
