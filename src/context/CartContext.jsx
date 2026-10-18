import { createContext, useContext, useEffect, useState } from 'react';
import { equipmentVideoUrl } from '../data/equipmentVideos.js';
import { equipmentMedia } from '../data/equipamentos.js';
import { useLocalStorage } from '../hooks/useLocalStorage.js';
import logo from '../assets/logo-euro-l.svg';
import { emptyCart, sanitizeCart } from '../utils/cart.js';

const CartContext = createContext(null);

export function CartProvider({ children }) {
    const [equipamentos, setEquipamentos] = useState([]);
    const [catalogStatus, setCatalogStatus] = useState('loading');

    useEffect(() => {
        const controller = new AbortController();
        async function loadCatalog() {
            try {
                const response = await fetch('/api/equipamentos', { signal: controller.signal });
                if (!response.ok) throw new Error('Catálogo indisponível');
                const data = await response.json();
                setEquipamentos(data.map((item) => ({ ...item, imagem: item.image_url || equipmentMedia[item.id]?.imagem || logo, video: equipmentVideoUrl(item.video_file, item.id) })));
                setCatalogStatus('ready');
            } catch (error) {
                if (error.name !== 'AbortError') setCatalogStatus('error');
            }
        }
        loadCatalog();
        return () => controller.abort();
    }, []);

    const [cart, setCart] = useLocalStorage('eurolight-cart-v1', emptyCart, sanitizeCart);
    const items = cart.items.filter((item) => equipamentos.some((equipment) => equipment.id === item.id)).map((item) => ({
        ...item,
        equipment: equipamentos.find((equipment) => equipment.id === item.id),
    }));

    function changeQuantity(id, difference) {
        setCart((current) => {
            const exists = current.items.some((item) => item.id === id);
            const nextItems = exists
                ? current.items.map((item) => (
                    item.id === id ? { ...item, quantity: item.quantity + difference } : item
                ))
                : [...current.items, { id, quantity: difference }];

            return sanitizeCart({ ...current, items: nextItems });
        });
    }

    function removeItem(id) {
        setCart((current) => ({
            ...current,
            items: current.items.filter((item) => item.id !== id),
        }));
    }

    function setService(name, checked) {
        setCart((current) => {
            const services = { ...current.services, [name]: checked };

            if (name === 'installation' && checked) services.delivery = true;
            if (name === 'delivery' && !checked) services.installation = false;

            return { ...current, services };
        });
    }

    const value = {
        equipamentos,
        catalogStatus,
        items,
        services: cart.services,
        count: items.reduce((sum, item) => sum + item.quantity, 0),
        total: items.reduce((sum, item) => sum + item.equipment.preco * item.quantity, 0),
        changeQuantity,
        removeItem,
        setService,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    return useContext(CartContext);
}
