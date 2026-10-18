import { useEffect, useState } from 'react';

// Falhas no armazenamento não impedem o uso do site nesta sessão.
export function useLocalStorage(key, initialValue, sanitize = (value) => value) {
    const read = () => {
        try {
            const saved = localStorage.getItem(key);
            return saved === null ? initialValue : sanitize(JSON.parse(saved));
        } catch {
            return initialValue;
        }
    };

    const [value, setValue] = useState(read);

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch {
            // O estado em memória continua disponível.
        }
    }, [key, value]);

    useEffect(() => {
        const sync = (event) => {
            if (event.key === key || event.key === null) setValue(read());
        };

        window.addEventListener('storage', sync);
        return () => window.removeEventListener('storage', sync);
    }, [key]);

    return [value, setValue];
}
