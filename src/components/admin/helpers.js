export const tagLabels = { visual: 'Visual', imagem: 'Imagem', som: 'Som', audio: 'Áudio', estrutural: 'Estrutural' };
export const statusLabels = { prevista: 'Prevista', concluida: 'Concluída', cancelada: 'Cancelada' };
export function formatPhone(value = '') {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (!digits) return '';
    if (digits.length <= 2) return `(${digits}`;
    const area = `(${digits.slice(0, 2)}) `;
    const number = digits.slice(2);
    if (number.length > 8) return `${area}${number[0]} ${number.slice(1, 5)}-${number.slice(5)}`;
    return `${area}${number.slice(0, 4)}${number.length > 4 ? `-${number.slice(4)}` : ''}`;
}
export function formatCpf(value = '') {
    const digits = String(value || '').replace(/\D/g, '').slice(0, 11);
    return digits.replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
}
export function formatDateInput(value) {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    return digits.replace(/^(\d{2})(\d)/, '$1/$2').replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');
}
export function parseDateInput(value) {
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return '';
    const [day, month, year] = value.split('/');
    const iso = `${year}-${month}-${day}`;
    const date = new Date(`${iso}T12:00:00Z`);
    return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === iso ? iso : '';
}
export const formatDate = (value) => new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR');
export const formatMonth = (value) => new Date(`${value}-01T12:00:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
export const shiftDay = (value, days) => {
    const date = new Date(`${value}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
};
export async function adminApi(path, options = {}) {
    const response = await fetch(`/api/admin${path}`, {
        ...options,
        ...(options.body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(options.body) } : {}),
    });
    const data = await response.json();
    if (!response.ok) {
        const error = new Error(data.error || 'Não foi possível concluir a operação.');
        error.status = response.status;
        throw error;
    }
    return data;
}
