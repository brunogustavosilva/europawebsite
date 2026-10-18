import { useState } from 'react';
import logo from '../assets/logo-euro-l.svg';
import { navigation, site } from '../data/site.js';
import { whatsappLink } from '../utils/format.js';
import { Button } from './Button.jsx';
import { Modal } from './Modal.jsx';

export function Header({ theme, onThemeChange, page }) {
    const [menuOpen, setMenuOpen] = useState(false);

    const links = navigation.map((link) => (
        <a
            key={link.href}
            href={link.href}
            aria-current={link.href === page ? 'page' : undefined}
            onClick={() => setMenuOpen(false)}
        >
            {link.label}
        </a>
    ));

    return (
        <header className="site-header">
            <a className="brand" href="/" aria-label={`${site.name}, início`}>
                <img src={logo} alt={site.name} width="60" height="60" />
            </a>
            <nav className="desktop-nav" aria-label="Navegação principal">{links}</nav>
            <div className="header-actions">
                <button
                    className="icon-button theme-toggle"
                    onClick={onThemeChange}
                    aria-label={`Ativar tema ${theme === 'light' ? 'escuro' : 'claro'}`}
                >
                    {theme === 'light' ? '☾' : '☀'}
                </button>
                <Button className="header-contact" href={whatsappLink()} target="_blank" rel="noopener noreferrer">
                    Fale com a gente ↗
                </Button>
                <button
                    className="icon-button menu-toggle"
                    aria-label="Abrir menu"
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen(true)}
                >
                    ☰
                </button>
            </div>
            <Modal open={menuOpen} onClose={() => setMenuOpen(false)} title="Navegação">
                <nav className="mobile-nav" aria-label="Navegação móvel">{links}</nav>
                <Button href={whatsappLink()} target="_blank" rel="noopener noreferrer">Entrar em contato ↗</Button>
            </Modal>
        </header>
    );
}
