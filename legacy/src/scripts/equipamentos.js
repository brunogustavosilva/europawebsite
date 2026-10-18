import { equipamentos } from '../data/equipamentos.js';

const grid = document.querySelector('#equipment-grid');
const searchInput = document.querySelector('#equipment-search');
const sortSelect = document.querySelector('#equipment-sort');
const filterToggle = document.querySelector('#filter-toggle');
const filterMenu = document.querySelector('#category-filters');
const categoryFilters = [...filterMenu.querySelectorAll('input[type="checkbox"]')];
const cardVisibilityObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            entry.target.classList.toggle('is-in-view', entry.isIntersecting);
        });
    }, { threshold: 0.12 })
    : null;
const emptyState = document.querySelector('#empty-state');
const count = document.querySelector('#catalog-count');
const openCartButton = document.querySelector('#open-cart');
const closeCartButton = document.querySelector('#close-cart');
const cartDrawer = document.querySelector('#cart-drawer');
const cartBackdrop = document.querySelector('#cart-backdrop');
const cartItems = document.querySelector('#cart-items');
const cartEmpty = document.querySelector('#cart-empty');
const cartBadge = document.querySelector('#cart-badge');
const cartHeadingCount = document.querySelector('#cart-heading-count');
const cartTotal = document.querySelector('#cart-total');
const cartContinue = document.querySelector('#cart-continue');
const cartAnnouncement = document.querySelector('#cart-announcement');
const openMenuButton = document.querySelector('#open-menu');
const closeMenuButton = document.querySelector('#close-menu');
const mobileMenu = document.querySelector('#mobile-menu');
const menuBackdrop = document.querySelector('#menu-backdrop');
const storageKey = 'eurolight-cart-v1';
const equipmentById = new Map(equipamentos.map((equipment) => [equipment.id, equipment]));

function loadCart() {
    try {
        const saved = JSON.parse(window.localStorage.getItem(storageKey) || '{}');
        const items = Array.isArray(saved.items) ? saved.items : [];
        return {
            items: items
                .filter((item) => equipmentById.has(item.id) && Number.isFinite(item.quantity) && item.quantity > 0)
                .map((item) => ({ id: item.id, quantity: Math.floor(item.quantity) })),
            services: {
                installation: Boolean(saved.services?.installation),
                delivery: Boolean(saved.services?.delivery)
            }
        };
    } catch {
        return { items: [], services: { installation: false, delivery: false } };
    }
}

let cart = loadCart();
let closeTimer;
let finishCloseHandler;
let returnFocusTo = openCartButton;
let menuCloseTimer;
let finishMenuCloseHandler;
let returnFocusToMenu = openMenuButton;
let renderedCartState = null;

function saveCart() {
    try {
        window.localStorage.setItem(storageKey, JSON.stringify(cart));
    } catch {
        cartAnnouncement.textContent = 'Não foi possível salvar a sacola neste navegador.';
    }
}

function formatMoney(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function itemCount() {
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}

function setCount(element, total) {
    element.textContent = total >= 9 ? '9+' : String(total);
}

function createTrashIcon() {
    const namespace = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(namespace, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '19');
    svg.setAttribute('height', '19');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    const paths = [
        'M3 6h18',
        'M8 6V4h8v2',
        'M19 6l-1 14H6L5 6',
        'M10 11v5',
        'M14 11v5'
    ];
    paths.forEach((pathData) => {
        const path = document.createElementNS(namespace, 'path');
        path.setAttribute('d', pathData);
        svg.append(path);
    });
    return svg;
}

function animateNumber(element, nextValue, previousValue) {
    element.classList.remove('number-increased', 'number-decreased');
    if (previousValue === null || previousValue === undefined || nextValue === previousValue) return;

    void element.offsetWidth;
    element.classList.add(nextValue > previousValue ? 'number-increased' : 'number-decreased');
}

function createCartItem(item, previousItem) {
    const equipment = equipmentById.get(item.id);
    const row = document.createElement('article');
    row.className = 'cart-item';
    row.dataset.id = item.id;

    const image = document.createElement('img');
    image.className = 'cart-item-image';
    image.src = equipment.imagem;
    image.alt = '';
    image.loading = 'lazy';

    const info = document.createElement('div');
    info.className = 'cart-item-info';
    const title = document.createElement('h3');
    title.textContent = equipment.nome;
    const unitPrice = document.createElement('p');
    unitPrice.className = 'cart-unit-price';
    unitPrice.textContent = formatMoney(equipment.preco);
    info.append(title, unitPrice);

    const remove = document.createElement('button');
    remove.className = 'cart-remove';
    remove.type = 'button';
    remove.dataset.action = 'remove';
    remove.setAttribute('aria-label', `Remover ${equipment.nome} da sacola`);
    remove.append(createTrashIcon());

    const bottom = document.createElement('div');
    bottom.className = 'cart-item-bottom';
    const controls = document.createElement('div');
    controls.className = 'cart-quantity';
    const decrease = document.createElement('button');
    decrease.type = 'button';
    decrease.dataset.action = 'decrease';
    decrease.setAttribute('aria-label', `Diminuir quantidade de ${equipment.nome}`);
    decrease.textContent = '−';
    const quantity = document.createElement('output');
    quantity.textContent = String(item.quantity);
    animateNumber(quantity, item.quantity, previousItem?.quantity);
    const increase = document.createElement('button');
    increase.type = 'button';
    increase.dataset.action = 'increase';
    increase.setAttribute('aria-label', `Aumentar quantidade de ${equipment.nome}`);
    increase.textContent = '+';
    controls.append(decrease, quantity, increase);

    const lineTotal = document.createElement('p');
    lineTotal.className = 'cart-line-total';
    const currentLineTotal = equipment.preco * item.quantity;
    lineTotal.textContent = formatMoney(currentLineTotal);
    animateNumber(lineTotal, currentLineTotal, previousItem ? equipment.preco * previousItem.quantity : undefined);
    bottom.append(controls, lineTotal);
    row.append(image, info, remove, bottom);
    return row;
}

function renderCart() {
    const totalItems = itemCount();
    const totalValue = cart.items.reduce((sum, item) => {
        return sum + equipmentById.get(item.id).preco * item.quantity;
    }, 0);
    const badgeText = totalItems >= 9 ? '9+' : String(totalItems);
    cartBadge.textContent = badgeText;
    cartBadge.hidden = totalItems === 0;
    setCount(cartHeadingCount, totalItems);
    animateNumber(cartBadge, totalItems, renderedCartState?.totalItems);
    animateNumber(cartHeadingCount, totalItems, renderedCartState?.totalItems);
    cartItems.replaceChildren(...cart.items.map((item) => {
        const previousItem = renderedCartState?.items.find((previous) => previous.id === item.id);
        return createCartItem(item, previousItem);
    }));
    cartEmpty.hidden = cart.items.length > 0;
    cartTotal.textContent = formatMoney(totalValue);
    animateNumber(cartTotal, totalValue, renderedCartState?.totalValue);
    renderedCartState = {
        totalItems,
        totalValue,
        items: cart.items.map((item) => ({ ...item }))
    };
    const isEmpty = totalItems === 0;
    cartContinue.setAttribute('aria-disabled', String(isEmpty));
    cartContinue.tabIndex = isEmpty ? -1 : 0;
    cartContinue.classList.toggle('is-disabled', isEmpty);
}

function addItem(id) {
    const existing = cart.items.find((item) => item.id === id);
    if (existing) existing.quantity += 1;
    else cart.items.push({ id, quantity: 1 });
    saveCart();
    renderCart();
    openCartButton.classList.remove('is-shaking');
    void openCartButton.offsetWidth;
    openCartButton.classList.add('is-shaking');
    const equipment = equipmentById.get(id);
    cartAnnouncement.textContent = `${equipment.nome} adicionado à sacola. ${itemCount()} ${itemCount() === 1 ? 'item' : 'itens'} na sacola.`;
}

function openCart() {
    window.clearTimeout(closeTimer);
    if (finishCloseHandler) {
        cartDrawer.removeEventListener('transitionend', finishCloseHandler);
        finishCloseHandler = undefined;
    }
    returnFocusTo = document.activeElement instanceof HTMLElement ? document.activeElement : openCartButton;
    cartDrawer.hidden = false;
    cartBackdrop.hidden = false;
    cartDrawer.inert = false;
    cartDrawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('cart-is-open');
    window.requestAnimationFrame(() => {
        cartBackdrop.classList.add('is-open');
        cartDrawer.classList.add('is-open');
    });
    closeCartButton.focus();
}

function closeCart() {
    if (cartDrawer.hidden) return;
    cartBackdrop.classList.remove('is-open');
    cartDrawer.classList.remove('is-open');
    cartDrawer.inert = true;
    cartDrawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('cart-is-open');

    const finishClose = (event) => {
        if (event && (event.target !== cartDrawer || event.propertyName !== 'transform')) return;
        if (cartDrawer.classList.contains('is-open')) return;
        window.clearTimeout(closeTimer);
        cartDrawer.hidden = true;
        cartBackdrop.hidden = true;
        returnFocusTo?.focus();
        cartDrawer.removeEventListener('transitionend', finishClose);
        finishCloseHandler = undefined;
    };
    finishCloseHandler = finishClose;
    cartDrawer.addEventListener('transitionend', finishClose);
    closeTimer = window.setTimeout(() => {
        finishClose();
    }, 800);
}

function openMenu() {
    window.clearTimeout(menuCloseTimer);
    if (finishMenuCloseHandler) {
        mobileMenu.removeEventListener('transitionend', finishMenuCloseHandler);
        finishMenuCloseHandler = undefined;
    }
    returnFocusToMenu = document.activeElement instanceof HTMLElement ? document.activeElement : openMenuButton;
    mobileMenu.hidden = false;
    menuBackdrop.hidden = false;
    mobileMenu.inert = false;
    mobileMenu.setAttribute('aria-hidden', 'false');
    openMenuButton.setAttribute('aria-expanded', 'true');
    document.body.classList.add('mobile-menu-is-open');
    window.requestAnimationFrame(() => {
        menuBackdrop.classList.add('is-open');
        mobileMenu.classList.add('is-open');
    });
    closeMenuButton.focus();
}

function closeMenu() {
    if (mobileMenu.hidden) return;
    menuBackdrop.classList.remove('is-open');
    mobileMenu.classList.remove('is-open');
    mobileMenu.inert = true;
    mobileMenu.setAttribute('aria-hidden', 'true');
    openMenuButton.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('mobile-menu-is-open');

    const finishClose = (event) => {
        if (event && (event.target !== mobileMenu || event.propertyName !== 'transform')) return;
        if (mobileMenu.classList.contains('is-open')) return;
        window.clearTimeout(menuCloseTimer);
        mobileMenu.hidden = true;
        menuBackdrop.hidden = true;
        returnFocusToMenu?.focus();
        mobileMenu.removeEventListener('transitionend', finishClose);
        finishMenuCloseHandler = undefined;
    };
    finishMenuCloseHandler = finishClose;
    mobileMenu.addEventListener('transitionend', finishClose);
    menuCloseTimer = window.setTimeout(() => finishClose(), 800);
}

const normalize = (value) => value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim();

function scoreMatch(equipment, query) {
    const name = normalize(equipment.nome);
    const ideal = normalize(equipment.ideal);
    const description = normalize(equipment.descricao);
    if (name.includes(query)) return 3;
    if (ideal.includes(query)) return 2;
    if (description.includes(query)) return 1;
    return 0;
}

function createCard(equipment) {
    const card = document.createElement('article');
    card.className = `equipment-card${equipment.video ? ' has-video' : ''}`;
    if (cardVisibilityObserver) {
        card.classList.add('is-observed');
        cardVisibilityObserver.observe(card);
    }
    card.dataset.id = equipment.id;

    const media = document.createElement('div');
    media.className = 'equipment-media';

    const image = document.createElement('img');
    image.src = equipment.imagem;
    image.alt = `${equipment.nome} em funcionamento`;
    image.loading = 'lazy';
    media.append(image);

    if (equipment.video) {
        const video = document.createElement('video');
        video.src = equipment.video;
        video.preload = 'metadata';
        video.muted = true;
        video.defaultMuted = true;
        video.volume = 0;
        video.loop = true;
        video.playsInline = true;

        let previewRequested = false;
        let stopTimer;
        const startPreview = () => {
            previewRequested = true;
            window.clearTimeout(stopTimer);
            video.play().catch(() => {});
        };
        const stopPreview = () => {
            previewRequested = false;
            card.classList.remove('is-previewing');
            window.clearTimeout(stopTimer);
            stopTimer = window.setTimeout(() => {
                if (previewRequested) return;
                video.pause();
                video.currentTime = 0;
            }, 500);
        };

        video.addEventListener('playing', () => {
            if (previewRequested) card.classList.add('is-previewing');
        });
        card.addEventListener('pointerenter', startPreview);
        card.addEventListener('pointerleave', stopPreview);
        card.addEventListener('pointercancel', stopPreview);
        card.addEventListener('pointerup', (event) => {
            if (event.pointerType === 'touch') stopPreview();
        });
        card.addEventListener('focusin', startPreview);
        card.addEventListener('focusout', (event) => {
            if (!card.contains(event.relatedTarget)) stopPreview();
        });
        media.append(video);
    } else {
        const hint = document.createElement('span');
        hint.className = 'media-hint';
        hint.textContent = 'Vídeo do equipamento em breve';
        const playIcon = document.createElement('img');
        playIcon.src = '/src/assets/play-pause.svg';
        playIcon.alt = '';
        hint.append(playIcon);
        media.append(hint);
    }

    const details = document.createElement('div');
    details.className = 'equipment-details';
    const title = document.createElement('h2');
    title.textContent = equipment.nome;
    const description = document.createElement('p');
    description.className = 'equipment-description';
    description.textContent = equipment.descricao;
    const ideal = document.createElement('p');
    ideal.className = 'equipment-ideal';
    const shine = document.createElement('img');
    shine.src = '/src/assets/shine.svg';
    shine.alt = '';
    ideal.append(shine, document.createTextNode(`ideal para: ${equipment.ideal}`));
    details.append(title, description, ideal);

    const footer = document.createElement('div');
    footer.className = 'equipment-footer';
    const price = document.createElement('p');
    price.className = 'equipment-price';
    price.textContent = `${equipment.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/${equipment.periodo}.`;
    const rent = document.createElement('button');
    rent.className = 'rent-button';
    rent.type = 'button';
    rent.textContent = 'Alugar';
    rent.dataset.cartAdd = equipment.id;
    rent.setAttribute('aria-label', `Alugar ${equipment.nome}`);
    footer.append(price, rent);

    card.append(media, details, footer);
    return card;
}

function render() {
    const query = normalize(searchInput.value);
    const selectedCategories = categoryFilters.filter((input) => input.checked).map((input) => input.value);
    const matches = equipamentos
        .map((equipment) => ({ equipment, score: query ? scoreMatch(equipment, query) : 1 }))
        .filter(({ equipment, score }) => {
            const matchesCategory = selectedCategories.length === 0 ||
                selectedCategories.some((category) => equipment.categorias?.includes(category));
            return score > 0 && matchesCategory;
        });

    const sort = sortSelect.value;
    matches.sort((a, b) => {
        if (query && b.score !== a.score) return b.score - a.score;
        if (sort === 'price-asc') return a.equipment.preco - b.equipment.preco;
        if (sort === 'price-desc') return b.equipment.preco - a.equipment.preco;
        return b.equipment.popularidade - a.equipment.popularidade;
    });

    if (cardVisibilityObserver) {
        grid.querySelectorAll('.equipment-card').forEach((card) => cardVisibilityObserver.unobserve(card));
    }
    grid.replaceChildren(...matches.map(({ equipment }) => createCard(equipment)));
    emptyState.hidden = matches.length > 0;
    count.textContent = `${matches.length} ${matches.length === 1 ? 'equipamento' : 'equipamentos'}`;
}

searchInput.addEventListener('input', render);
sortSelect.addEventListener('change', render);
filterToggle.addEventListener('click', () => {
    const isExpanded = filterToggle.getAttribute('aria-expanded') === 'true';
    filterToggle.setAttribute('aria-expanded', String(!isExpanded));
    filterMenu.hidden = isExpanded;
});
categoryFilters.forEach((input) => input.addEventListener('change', render));
document.addEventListener('click', (event) => {
    if (!event.target.closest('.filter-control')) {
        filterMenu.hidden = true;
        filterToggle.setAttribute('aria-expanded', 'false');
    }
});
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !filterMenu.hidden) {
        filterMenu.hidden = true;
        filterToggle.setAttribute('aria-expanded', 'false');
        filterToggle.focus();
    }
});
grid.addEventListener('click', (event) => {
    const button = event.target.closest('[data-cart-add]');
    if (button) addItem(button.dataset.cartAdd);
});

cartItems.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const row = button.closest('.cart-item');
    const item = cart.items.find((entry) => entry.id === row?.dataset.id);
    if (!item) return;

    if (button.dataset.action === 'remove' || (button.dataset.action === 'decrease' && item.quantity === 1)) {
        cart.items = cart.items.filter((entry) => entry.id !== item.id);
    } else if (button.dataset.action === 'increase') {
        item.quantity += 1;
    } else if (button.dataset.action === 'decrease') {
        item.quantity -= 1;
    }
    saveCart();
    renderCart();
    cartAnnouncement.textContent = 'Sacola atualizada.';
});

openCartButton.addEventListener('click', openCart);
closeCartButton.addEventListener('click', closeCart);
cartBackdrop.addEventListener('click', closeCart);
cartContinue.addEventListener('click', (event) => {
    if (itemCount() === 0) event.preventDefault();
});
openMenuButton.addEventListener('click', openMenu);
closeMenuButton.addEventListener('click', closeMenu);
menuBackdrop.addEventListener('click', closeMenu);
mobileMenu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

cartDrawer.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        event.preventDefault();
        closeCart();
        return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [...cartDrawer.querySelectorAll('button:not([disabled]), input:not([disabled])')];
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
});

mobileMenu.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
        return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [...mobileMenu.querySelectorAll('button:not([disabled]), a[href]')];
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
});

window.addEventListener('storage', (event) => {
    if (event.key === storageKey) {
        cart = loadCart();
        renderCart();
    }
});

renderCart();
render();
