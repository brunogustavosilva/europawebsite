import { useEffect, useState } from 'react';
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
    const [cartOpen, setCartOpen] = useState(false);
    const { count } = useCart();
    const path = window.location.pathname.replace(/^\/public/, '').replace(/\/$/, '') || '/';
    const route = routes[path];
    const Page = route?.Component;

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
            <a className="skip-link" href="#main-content">Pular para o conteúdo</a>
            <Header theme={theme} onThemeChange={() => setTheme(theme === 'light' ? 'dark' : 'light')} page={route?.page} />
            {Page ? <Page /> : (
                <main className="section" id="main-content">
                    <h1>Página não encontrada</h1>
                    <a href="/">Voltar ao início</a>
                </main>
            )}
            <footer className="site-footer">
                <strong>EURO LIGHT<span>®</span></strong>
                <p>Iluminação que transforma momentos.</p>
                <small>© {new Date().getFullYear()} Euro Light</small>
            </footer>
            {route?.page !== '/locacao' && route?.page !== '/admin' && (
                <button className="floating-cart" onClick={() => setCartOpen(true)} aria-haspopup="dialog" aria-label={`Abrir sacola, ${count} itens`}>
                    Sacola <span aria-live="polite">{count}</span>
                </button>
            )}
            <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
        </>
    );
}
