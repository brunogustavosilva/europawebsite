export class InputError extends Error {
    constructor(message, status = 400) { super(message); this.status = status; }
}
export function requireInput(condition, message, status = 400) {
    if (!condition) throw new InputError(message, status);
}
export function dateValue(value) {
    requireInput(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value), 'Informe uma data válida.');
    const date = new Date(`${value}T12:00:00Z`);
    requireInput(!Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value, 'Informe uma data válida.');
    return value;
}
export function addMonths(month, difference) {
    const [year, number] = month.split('-').map(Number);
    return new Date(Date.UTC(year, number - 1 + difference, 1)).toISOString().slice(0, 7);
}
export function monthsFor(today) {
    const current = today.slice(0, 7);
    return Array.from({ length: 7 }, (_, index) => {
        const month = addMonths(current, index - 2);
        return { month, closed: month < current };
    });
}
export function editableDate(value, today) {
    dateValue(value);
    const month = value.slice(0, 7);
    requireInput(month >= today.slice(0, 7), 'Este mês está encerrado e não aceita alterações.', 409);
    requireInput(month <= addMonths(today.slice(0, 7), 4), 'Escolha uma data no mês atual ou nos quatro meses seguintes.');
}
export function weekStart(value) {
    dateValue(value);
    const date = new Date(`${value}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
    return date.toISOString().slice(0, 10);
}
export function amount(value, label) {
    requireInput((typeof value === 'number' || typeof value === 'string') && /^\d+(\.\d{1,2})?$/.test(String(value)), `${label}: informe um valor com até duas casas decimais.`);
    const result = Number(value);
    requireInput(Number.isFinite(result) && result >= 0 && result <= 99999999.99, `${label}: valor inválido.`);
    return result.toFixed(2);
}
export function text(value, label, max = 200, required = true) {
    requireInput(typeof value === 'string' && (!required || value.trim().length > 0) && value.length <= max, `Preencha ${label} corretamente.`);
    return value.trim();
}
export function integer(value, label, minimum = 0) {
    requireInput((typeof value === 'number' || typeof value === 'string') && Number.isInteger(Number(value)) && String(value).trim() !== '' && Number(value) >= minimum && Number(value) <= 100000, `${label}: quantidade inválida.`);
    return Number(value);
}

export function plusDays(value, count) {
    const date = new Date(`${value}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + count);
    return date.toISOString().slice(0, 10);
}

export function rentalPeriod(value) {
    dateValue(value);
    return { from: value, until: plusDays(value, 4) };
}
