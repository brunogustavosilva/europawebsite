import { useEffect, useRef, useState } from 'react';

// O mesmo componente funciona em seções, cards ou blocos de conteúdo.
export function Reveal({ as: Element = 'div', className = '', delay = 0, children, ...props }) {
    const elementRef = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!('IntersectionObserver' in window)) {
            setVisible(true);
            return;
        }

        const observer = new IntersectionObserver(([entry]) => {
            // Entra com 8% visível e só sai ao deixar a tela por completo.
            setVisible((current) => entry.isIntersecting && (current || entry.intersectionRatio >= 0.08));
        }, { threshold: [0, 0.08] });

        observer.observe(elementRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <Element
            ref={elementRef}
            className={`reveal ${className}`}
            data-visible={visible}
            style={{ '--reveal-delay': `${delay}ms` }}
            {...props}
        >
            {children}
        </Element>
    );
}
