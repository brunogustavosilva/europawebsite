import { equipamentos } from '../data/equipamentos.js';

const cartStorageKey = 'eurolight-cart-v1';
const detailsStorageKey = 'eurolight-rental-details-v1';
const itemList = document.querySelector('#rental-items');
const emptyState = document.querySelector('#rental-empty');
const totalOutput = document.querySelector('#rental-total');
const dateInput = document.querySelector('#rental-date');
const addressInput = document.querySelector('#delivery-address');
const addressWrap = document.querySelector('#delivery-field-wrap');
const addressHelp = document.querySelector('#delivery-help');
const installationInput = document.querySelector('#installation-option');
const deliveryInput = document.querySelector('#delivery-option');
const form = document.querySelector('#rental-form');
const equipmentById = new Map(equipamentos.map((equipment) => [equipment.id, equipment]));

function readCart() {
    try {
        const saved = JSON.parse(window.localStorage.getItem(cartStorageKey) || '{}');
        return {
            items: Array.isArray(saved.items) ? saved.items
                .filter((item) => equipmentById.has(item.id) && Number.isFinite(item.quantity) && item.quantity > 0)
                .map((item) => ({ id: item.id, quantity: Math.floor(item.quantity) })) : [],
            services: {
                installation: Boolean(saved.services?.installation),
                delivery: Boolean(saved.services?.delivery)
            }
        };
    } catch {
        return { items: [], services: { installation: false, delivery: false } };
    }
}

function readDetails() {
    try {
        const saved = JSON.parse(window.localStorage.getItem(detailsStorageKey) || '{}');
        return {
            date: typeof saved.date === 'string' ? saved.date : '',
            dateEntry: typeof saved.dateEntry === 'string' ? saved.dateEntry : '',
            address: typeof saved.address === 'string' ? saved.address : ''
        };
    } catch {
        return { date: '', dateEntry: '', address: '' };
    }
}

let cart = readCart();
const details = readDetails();
let renderedCartState = null;

function saveCart() {
    try {
        window.localStorage.setItem(cartStorageKey, JSON.stringify(cart));
    } catch {
        // Keep the current page usable if browser storage is unavailable.
    }
}

function saveDetails() {
    details.date = parseRentalDate(dateInput.value) || '';
    details.dateEntry = dateInput.value;
    details.address = addressInput.value;
    try {
        window.localStorage.setItem(detailsStorageKey, JSON.stringify(details));
    } catch {
        // Keep the current page usable if browser storage is unavailable.
    }
}

function money(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function animateNumber(element, nextValue, previousValue) {
    element.classList.remove('number-increased', 'number-decreased');
    if (previousValue === null || previousValue === undefined || nextValue === previousValue) return;

    void element.offsetWidth;
    element.classList.add(nextValue > previousValue ? 'number-increased' : 'number-decreased');
}

function createItem(item, previousItem) {
    const equipment = equipmentById.get(item.id);
    const row = document.createElement('article');
    row.className = 'rental-item';
    row.dataset.id = item.id;

    const image = document.createElement('img');
    image.className = 'rental-item-image';
    image.src = equipment.imagem;
    image.alt = '';

    const info = document.createElement('div');
    info.className = 'rental-item-info';
    const name = document.createElement('h2');
    name.textContent = equipment.nome;
    const unitPrice = document.createElement('p');
    unitPrice.className = 'rental-item-unit-price';
    unitPrice.textContent = money(equipment.preco);
    info.append(name, unitPrice);

    const quantity = document.createElement('div');
    quantity.className = 'rental-quantity';
    const decrease = document.createElement('button');
    decrease.type = 'button';
    decrease.dataset.action = 'decrease';
    decrease.setAttribute('aria-label', `Diminuir quantidade de ${equipment.nome}`);
    decrease.textContent = '−';
    const value = document.createElement('output');
    value.textContent = String(item.quantity);
    animateNumber(value, item.quantity, previousItem?.quantity);
    const increase = document.createElement('button');
    increase.type = 'button';
    increase.dataset.action = 'increase';
    increase.setAttribute('aria-label', `Aumentar quantidade de ${equipment.nome}`);
    increase.textContent = '+';
    quantity.append(decrease, value, increase);

    const lineTotal = document.createElement('p');
    lineTotal.className = 'rental-item-total';
    const currentLineTotal = equipment.preco * item.quantity;
    lineTotal.textContent = money(currentLineTotal);
    animateNumber(lineTotal, currentLineTotal, previousItem ? equipment.preco * previousItem.quantity : undefined);

    const remove = document.createElement('button');
    remove.className = 'rental-remove';
    remove.type = 'button';
    remove.dataset.action = 'remove';
    remove.setAttribute('aria-label', `Remover ${equipment.nome} da locação`);
    const trash = document.createElement('img');
    trash.src = '/src/assets/trash-blank-alt-svgrepo-com.svg';
    trash.alt = '';
    remove.append(trash);

    row.append(image, info, quantity, lineTotal, remove);
    return row;
}

function updateAddressAvailability() {
    const addressEnabled = installationInput.checked || deliveryInput.checked;
    addressInput.disabled = !addressEnabled;
    addressWrap.classList.toggle('is-disabled', !addressEnabled);
    addressInput.required = addressEnabled;
    addressInput.setAttribute('aria-required', String(addressEnabled));
    validateAddress();
}

function validateAddress() {
    addressWrap.classList.remove('is-invalid');
    if (addressInput.disabled) {
        addressInput.setCustomValidity('');
        addressHelp.textContent = 'Marque entrega ou instalação para informar o endereço.';
        addressHelp.hidden = false;
        return;
    }

    if (addressInput.value.trim().length <= 5) {
        addressInput.setCustomValidity('Endereço inválido. Informe pelo menos 6 caracteres.');
        addressWrap.classList.add('is-invalid');
        addressHelp.textContent = 'Endereço inválido. Informe pelo menos 6 caracteres.';
        addressHelp.hidden = false;
        return;
    }

    addressInput.setCustomValidity('');
    addressHelp.hidden = true;
}

function render() {
    const total = cart.items.reduce((sum, item) => {
        return sum + equipmentById.get(item.id).preco * item.quantity;
    }, 0);
    itemList.replaceChildren(...cart.items.map((item) => {
        const previousItem = renderedCartState?.items.find((previous) => previous.id === item.id);
        return createItem(item, previousItem);
    }));
    emptyState.hidden = cart.items.length > 0;
    totalOutput.textContent = money(total);
    animateNumber(totalOutput, total, renderedCartState?.total);
    renderedCartState = { total, items: cart.items.map((item) => ({ ...item })) };
    installationInput.checked = cart.services.installation;
    if (installationInput.checked && !cart.services.delivery) {
        cart.services.delivery = true;
        saveCart();
    }
    deliveryInput.checked = cart.services.delivery;
    updateAddressAvailability();
}

function persistServiceOptions() {
    if (installationInput.checked) deliveryInput.checked = true;
    cart.services.installation = installationInput.checked;
    cart.services.delivery = deliveryInput.checked;
    saveCart();
    updateAddressAvailability();
}

function updateItem(event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const row = button.closest('.rental-item');
    const item = cart.items.find((entry) => entry.id === row?.dataset.id);
    if (!item) return;

    if (button.dataset.action === 'remove' || (button.dataset.action === 'decrease' && item.quantity <= 1)) {
        cart.items = cart.items.filter((entry) => entry.id !== item.id);
    } else if (button.dataset.action === 'increase') {
        item.quantity += 1;
    } else if (button.dataset.action === 'decrease') {
        item.quantity -= 1;
    }
    saveCart();
    render();
}

function localDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatStoredDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    return match ? `${match[3]}/${match[2]}/${match[1]}` : '';
}

function parseRentalDate(value) {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
    if (!match) return '';
    const [, dayText, monthText, yearText] = match;
    const day = Number(dayText);
    const month = Number(monthText);
    const year = Number(yearText);
    const candidate = new Date(year, month - 1, day);
    if (candidate.getFullYear() !== year || candidate.getMonth() !== month - 1 || candidate.getDate() !== day) return '';
    const isoDate = `${yearText}-${monthText}-${dayText}`;
    return isoDate >= localDateString(new Date()) ? isoDate : '';
}

function validateRentalDate() {
    const rawValue = dateInput.value.trim();
    if (!rawValue) {
        dateInput.setCustomValidity('');
        return;
    }
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(rawValue)) {
        dateInput.setCustomValidity('Use o formato DD/MM/AAAA.');
    } else if (!parseRentalDate(rawValue)) {
        dateInput.setCustomValidity('Informe uma data válida a partir de hoje.');
    } else {
        dateInput.setCustomValidity('');
    }
}

dateInput.value = details.dateEntry || formatStoredDate(details.date);
addressInput.value = details.address;
validateRentalDate();
itemList.addEventListener('click', updateItem);
installationInput.addEventListener('change', persistServiceOptions);
deliveryInput.addEventListener('change', persistServiceOptions);
dateInput.addEventListener('keydown', (event) => {
    const caret = dateInput.selectionStart;
    if (event.key === 'Backspace' && caret === dateInput.selectionEnd && dateInput.value[caret - 1] === '/') {
        dateInput.setSelectionRange(caret - 1, caret - 1);
    }
});
dateInput.addEventListener('input', () => {
    const currentValue = dateInput.value;
    const digitCountBeforeCaret = currentValue
        .slice(0, dateInput.selectionStart ?? currentValue.length)
        .replace(/\D/g, '').length;
    const digits = currentValue.replace(/\D/g, '').slice(0, 8);
    let formatted = digits.slice(0, 2);
    if (digits.length > 2) formatted += `/${digits.slice(2, 4)}`;
    if (digits.length > 4) formatted += `/${digits.slice(4)}`;
    if (digits.length === 2) formatted += '/';
    if (digits.length === 4) formatted += '/';
    dateInput.value = formatted;

    let caret = 0;
    let digitCount = 0;
    while (caret < formatted.length && digitCount < digitCountBeforeCaret) {
        if (/\d/.test(formatted[caret])) digitCount += 1;
        caret += 1;
    }
    if (digitCountBeforeCaret === 2 && formatted[caret] === '/') caret += 1;
    if (digitCountBeforeCaret === 4 && formatted[caret] === '/') caret += 1;
    dateInput.setSelectionRange(caret, caret);
    validateRentalDate();
    saveDetails();
});
addressInput.addEventListener('input', () => {
    validateAddress();
    saveDetails();
});
form.addEventListener('submit', (event) => {
    event.preventDefault();
    validateRentalDate();
    validateAddress();
    saveDetails();
    if (!form.reportValidity() || cart.items.length === 0) return;

    const [year, month, day] = details.date.split('-').map(Number);
    const rentalDate = new Date(year, month - 1, day, 12);
    const longDate = new Intl.DateTimeFormat('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(rentalDate);
    const total = cart.items.reduce((sum, item) => {
        return sum + equipmentById.get(item.id).preco * item.quantity;
    }, 0);
    const itemLines = cart.items.map((item) => {
        const equipment = equipmentById.get(item.id);
        const lineTotal = equipment.preco * item.quantity;
        return `• ${equipment.nome} — ${item.quantity}x ${money(equipment.preco)} = ${money(lineTotal)}`;
    });
    const serviceLines = [
        `• Entrega: ${cart.services.delivery ? 'Solicitada' : 'Não solicitada'}`,
        `• Instalação: ${cart.services.installation ? 'Solicitada' : 'Não solicitada'}`
    ];
    if (cart.services.delivery) serviceLines.push(`• Endereço de entrega: ${addressInput.value.trim()}`);
    else if (cart.services.installation) serviceLines.push(`• Endereço para instalação: ${addressInput.value.trim()}`);

    const message = [
        '*SOLICITAÇÃO DE LOCAÇÃO — EURO LIGHT*',
        '_Pedido sujeito à disponibilidade e confirmação da loja. Esta mensagem não confirma a locação._',
        '',
        `*Data desejada:* ${longDate}`,
        '',
        '*Equipamentos:*',
        ...itemLines,
        '',
        '*Serviços:*',
        ...serviceLines,
        '',
        `*Total dos equipamentos:* ${money(total)}`,
        '_Eventuais custos de entrega ou instalação serão confirmados pela loja._'
    ].join('\n');
    const whatsappNumber = '5541998626862';
    window.location.assign(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`);
});
window.addEventListener('storage', (event) => {
    if (event.key === cartStorageKey) {
        cart = readCart();
        render();
    }
});

render();
