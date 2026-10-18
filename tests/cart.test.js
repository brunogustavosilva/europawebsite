import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true } });

try {
    const { sanitizeCart, emptyCart } = await server.ssrLoadModule('/src/utils/cart.js');

    assert.deepEqual(sanitizeCart(null), emptyCart);
    assert.deepEqual(sanitizeCart({ items: [null, {}, { id: 'inexistente', quantity: 2 }] }), emptyCart);

    const result = sanitizeCart({
        items: [
            { id: 'maquina-de-fumaca', quantity: 2 },
            { id: 'maquina-de-fumaca', quantity: 1 },
            { id: 'mooving-head', quantity: 0.5 },
            { id: 'barra-de-luz-negra', quantity: -1 },
        ],
    });

    assert.deepEqual(result.items, [{ id: 'maquina-de-fumaca', quantity: 3 }]);
    assert.deepEqual(sanitizeCart({ services: { installation: true } }).services, {
        installation: true,
        delivery: true,
    });

    const React = await import('react');
    const { renderToString } = await import('react-dom/server');
    const { CartProvider } = await server.ssrLoadModule('/src/context/CartContext.jsx');
    const pages = [
        ['Home', 'Uma experiência'],
        ['Catalog', 'ideal para sua festa'],
        ['Rental', 'Itens da locação'],
    ];

    for (const [name, expectedText] of pages) {
        const module = await server.ssrLoadModule(`/src/pages/${name}.jsx`);
        const html = renderToString(
            React.createElement(CartProvider, null, React.createElement(module[name])),
        );

        assert.ok(html.includes(expectedText), `A página ${name} deve renderizar o conteúdo principal`);
    }
} finally {
    await server.close();
}
