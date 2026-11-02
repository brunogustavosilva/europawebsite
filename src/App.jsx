import { festiveEffectsActive } from './utils/season.js';
import { NightSky } from './components/NightSky.jsx';
import { ChristmasLights } from './components/ChristmasLights.jsx';
import { useEffect, useRef, useState } from 'react';
import { Fireworks } from './components/Fireworks.jsx';
import { Snowfall } from './components/Snowfall.jsx';
import { SeasonalDecoration } from './components/SeasonalDecoration.jsx';
import { Header } from './components/Header.jsx';
import { CartDrawer } from './components/CartDrawer.jsx';
import { useCart } from './context/CartContext.jsx';
import { Home } from './pages/Home.jsx';
import { Catalog } from './pages/Catalog.jsx';
import { Rental } from './pages/Rental.jsx';
import { Admin } from './pages/Admin.jsx';

// Links antigos continuam funcionando durante a migração.
const routes = {
  '/admin': { Component: Admin, title: 'Administração', page: '/admin' },
  '/': { Component: Home, title: 'Iluminação para eventos', page: '/' },
  '/home.html': { Component: Home, title: 'Iluminação para eventos', page: '/' },
  '/equipamentos': { Component: Catalog, title: 'Equipamentos', page: '/equipamentos' },
  '/equipamentos.html': { Component: Catalog, title: 'Equipamentos', page: '/equipamentos' },
  '/locacao': { Component: Rental, title: 'Sua locação', page: '/locacao' },
  '/locacao.html': { Component: Rental, title: 'Sua locação', page: '/locacao' },
};

export function App() {
  const [theme, setTheme] = useState(document.documentElement.dataset.theme || 'dark');
  const [festive, setFestive] = useState(() => festiveEffectsActive());
  const [cartOpen, setCartOpen] = useState(false);
  const { count, addition, unseenAddition, acknowledgeAddition, discountFeedback } = useCart();
  const cartButton = useRef(null);
  useEffect(() => {
    if (!addition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const animation = cartButton.current?.animate(
      [
        { transform: 'rotate(0)' },
        { transform: 'rotate(-7deg)' },
        { transform: 'rotate(6deg)' },
        { transform: 'rotate(-3deg)' },
        { transform: 'rotate(0)' },
      ],
      { duration: 500, easing: 'ease-in-out' },
    );
    return () => animation?.cancel();
  }, [addition]);
  const path = window.location.pathname.replace(/^\/public/, '').replace(/\/$/, '') || '/';
  const route = routes[path];
  const Page = route?.Component;

  useEffect(() => {
    const timer = window.setInterval(() => setFestive(festiveEffectsActive()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.nightSky = String(
      theme === 'light' && route?.page !== '/admin',
    );
    return () => {
      delete document.documentElement.dataset.nightSky;
    };
  }, [theme, route]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('eurolight-theme', theme);
    } catch {
      // O tema ainda funciona sem armazenamento local.
    }
  }, [theme]);

  useEffect(() => {
    document.title = `${route?.title || 'Página não encontrada'} | Euro Light`;
  }, [route]);

  if (route?.page === '/admin') return <Admin />;

  return (
    <>
      <a className="skip-link" href="#main-content">
        Pular para o conteúdo
      </a>
      <Header
        theme={theme}
        onThemeChange={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        page={route?.page}
      />
      <NightSky />
      {festive && (
        <>
          <Snowfall />
          <Fireworks />
          <SeasonalDecoration />
          {(route?.page === '/' || route?.page === '/equipamentos') && <ChristmasLights />}
        </>
      )}
      {Page ? (
        <Page />
      ) : (
        <main className="section" id="main-content">
          <h1>Página não encontrada</h1>
          <a href="/">Voltar ao início</a>
        </main>
      )}
      <footer className="site-footer">
        <strong>
          EURO LIGHT<span>®</span>
        </strong>
        <p>Iluminação que transforma momentos.</p>
        <small>© {new Date().getFullYear()} Euro Light</small>
      </footer>
      {route?.page !== '/locacao' && route?.page !== '/admin' && (
        <button
          ref={cartButton}
          className="floating-cart"
          onClick={() => {
            setCartOpen(true);
            acknowledgeAddition();
          }}
          aria-haspopup="dialog"
          aria-label={`Abrir sacola, ${count} itens`}
        >
          {unseenAddition && count > 0 && <i className="cart-notification" aria-hidden="true" />}
          Sacola <span aria-live="polite">{count}</span>
        </button>
      )}
      {discountFeedback && (
        <div className="cart-kit-feedback" role="status">
          ✓ Desconto de kit aplicado
        </div>
      )}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
