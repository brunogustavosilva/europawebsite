export function brazilianPhone(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 12 || digits.length === 13) {
    if (!digits.startsWith('55')) return null;
    digits = digits.slice(2);
  }
  return /^[1-9]\d(?:[2-5]\d{7}|9\d{8})$/.test(digits) ? digits : null;
}
