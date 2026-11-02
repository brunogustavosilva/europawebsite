import { expandCartKits, priceCartKits } from '../utils/cart-kits.js';
import { createContext, useContext, useEffect, useState } from 'react';
import { equipmentVideoUrl } from '../data/equipmentVideos.js';
import { equipmentMedia } from '../data/equipamentos.js';
import { useLocalStorage } from '../hooks/useLocalStorage.js';
import logo from '../assets/logo-euro-l.svg';
import { emptyCart, sanitizeCart } from '../utils/cart.js';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [equipamentos, setEquipamentos] = useState([]);
  const [addition, setAddition] = useState(0);
  const [discountFeedback, setDiscountFeedback] = useState(false);
  const [unseenAddition, setUnseenAddition] = useState(false);
  const [catalogStatus, setCatalogStatus] = useState('loading');

  useEffect(() => {
    const controller = new AbortController();
    async function loadCatalog() {
      try {
        const response = await fetch('/api/equipamentos', { signal: controller.signal });
        if (!response.ok) throw new Error('Catálogo indisponível');
        const data = await response.json();
        setEquipamentos(
          data.map((item) => ({
            ...item,
            imagem: item.image_url || equipmentMedia[item.id]?.imagem || logo,
            video: equipmentVideoUrl(item.video_file, item.id),
          })),
        );
        setCatalogStatus('ready');
      } catch (error) {
        if (error.name !== 'AbortError') setCatalogStatus('error');
      }
    }
    loadCatalog();
    return () => controller.abort();
  }, []);

  const [cart, setCart] = useLocalStorage('eurolight-cart-v1', emptyCart, sanitizeCart);
  const pricing = priceCartKits(cart.items, equipamentos);
  const items = pricing.items;
  const hasKitDiscount = pricing.discount > 0;
  useEffect(() => {
    if (!addition || !hasKitDiscount) {
      setDiscountFeedback(false);
      return;
    }
    setDiscountFeedback(true);
    const timer = window.setTimeout(() => setDiscountFeedback(false), 3500);
    return () => window.clearTimeout(timer);
  }, [addition, hasKitDiscount]);

  function changeQuantity(id, difference) {
    if (difference > 0) {
      setAddition((value) => value + 1);
      setUnseenAddition(true);
    }
    setCart((current) => {
      const normalized = expandCartKits(current.items, equipamentos);
      const exists = normalized.some((item) => item.id === id);
      const nextItems = exists
        ? normalized.map((item) =>
            item.id === id ? { ...item, quantity: item.quantity + difference } : item,
          )
        : [...normalized, { id, quantity: difference }];

      return sanitizeCart({ ...current, items: expandCartKits(nextItems, equipamentos) });
    });
  }

  function removeItem(id) {
    setCart((current) => ({
      ...current,
      items: expandCartKits(current.items, equipamentos).filter((item) => item.id !== id),
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
    addition,
    discountFeedback,
    unseenAddition,
    acknowledgeAddition: () => setUnseenAddition(false),
    catalogStatus,
    items,
    services: cart.services,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    total: pricing.total,
    subtotal: pricing.subtotal,
    discount: pricing.discount,
    discountRate: pricing.discountRate,
    appliedKits: pricing.appliedKits,
    changeQuantity,
    removeItem,
    setService,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
