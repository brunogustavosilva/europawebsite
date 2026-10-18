import { equipamentos } from '../data/equipamentos.js';

export const emptyCart = {
    items: [],
    services: { installation: false, delivery: false },
};

export function sanitizeCart(saved) {
    const quantities = new Map();

    for (const item of Array.isArray(saved?.items) ? saved.items : []) {
        const exists = equipamentos.some((equipment) => equipment.id === item?.id) || (typeof item?.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id));
        const quantity = Math.floor(item?.quantity);

        if (exists && Number.isFinite(item.quantity) && quantity > 0) {
            quantities.set(item.id, (quantities.get(item.id) || 0) + quantity);
        }
    }

    const installation = Boolean(saved?.services?.installation);

    return {
        items: [...quantities].map(([id, quantity]) => ({ id, quantity })),
        services: {
            installation,
            delivery: installation || Boolean(saved?.services?.delivery),
        },
    };
}
