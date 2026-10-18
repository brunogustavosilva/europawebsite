import { useEffect, useRef } from 'react';

export function Modal({ open, onClose, title, children, className = '' }) {
    const dialogRef = useRef(null);
    const sessionRef = useRef(null);

    function restorePage() {
        const session = sessionRef.current;
        if (!session) return;

        document.body.style.overflow = session.overflow;
        session.focus?.focus();
        sessionRef.current = null;
    }

    useEffect(() => {
        const dialog = dialogRef.current;
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let animation;
        let cancelled = false;

        if (open) {
            if (!dialog.open) {
                sessionRef.current = {
                    focus: document.activeElement,
                    overflow: document.body.style.overflow,
                };
                dialog.showModal();
                document.body.style.overflow = 'hidden';
            }

            dialog.dataset.phase = 'entering';
            animation = dialog.animate(
                [{ transform: 'translateX(100%)' }, { transform: 'translateX(0)' }],
                { duration: reducedMotion ? 0 : 360, easing: 'ease-out' },
            );
        } else if (dialog.open) {
            dialog.dataset.phase = 'exiting';
            animation = dialog.animate(
                [{ transform: 'translateX(0)' }, { transform: 'translateX(100%)' }],
                { duration: reducedMotion ? 0 : 240, easing: 'ease-in', fill: 'forwards' },
            );

            animation.finished.then(() => {
                if (cancelled) return;
                dialog.close();
                animation.cancel();
                restorePage();
            }).catch(() => {});
        }

        return () => {
            cancelled = true;
            animation?.cancel();
        };
    }, [open]);

    useEffect(() => () => {
        dialogRef.current?.close();
        restorePage();
    }, []);

    return (
        <dialog
            ref={dialogRef}
            className={`drawer ${className}`}
            aria-label={title}
            onCancel={(event) => {
                event.preventDefault();
                onClose();
            }}
            onClick={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div className="drawer-inner">
                <header className="drawer-header">
                    <h2>{title}</h2>
                    <button className="icon-button" onClick={onClose} aria-label={`Fechar ${title}`}>
                        ×
                    </button>
                </header>
                {children}
            </div>
        </dialog>
    );
}
