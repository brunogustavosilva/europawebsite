import { Router } from 'express';
import { readFile } from 'node:fs/promises';
import { unzipSync, zipSync, strFromU8, strToU8 } from 'fflate';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { requireInput, dateValue, amount, text, integer } from './admin-domain.js';

const NS = {
    text: 'urn:oasis:names:tc:opendocument:xmlns:text:1.0',
    office: 'urn:oasis:names:tc:opendocument:xmlns:office:1.0',
    table: 'urn:oasis:names:tc:opendocument:xmlns:table:1.0',
    style: 'urn:oasis:names:tc:opendocument:xmlns:style:1.0',
    fo: 'urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0',
    xlink: 'http://www.w3.org/1999/xlink',
};
const templateUrl = new URL('../private/N4119U2.odt', import.meta.url);
const parseXml = (xml) => new DOMParser().parseFromString(xml, 'application/xml');
const elements = (node, namespace, tag) => Array.from(node.getElementsByTagNameNS(NS[namespace], tag));
const number = (value) => Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const longDate = (value) => new Date(`${value}T12:00:00Z`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

export function validateContract(body = {}) {
    const cpf = text(body.cpf || '', 'o CPF/CNPJ', 18).replace(/[.\-\/\s]/g, '');
    requireInput(/^(\d{11}|\d{14})$/.test(cpf), 'Informe um CPF/CNPJ completo.');
    const pickup_date = dateValue(body.pickup_date);
    const return_date = dateValue(body.return_date);
    requireInput(return_date >= pickup_date, 'A devolução não pode ser anterior à retirada.');
    for (const time of [body.pickup_time, body.return_time]) requireInput(typeof time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(time), 'Informe os horários no formato HH:MM.');
    requireInput(return_date !== pickup_date || body.return_time >= body.pickup_time, 'O horário de devolução não pode ser anterior ao da retirada.');
    const total = amount(body.total, 'Valor total');
    const deposit = amount(body.deposit, 'Sinal');
    requireInput(Number(deposit) <= Number(total), 'O sinal não pode ultrapassar o valor total.');
    requireInput(Array.isArray(body.items) && body.items.length > 0 && body.items.length <= 100, 'Inclua de 1 a 100 equipamentos no contrato.');
    return {
        customer_name: text(body.customer_name, 'o nome do cliente', 150),
        cpf,
        phone: text(body.phone || '', 'o telefone', 30),
        address: text(body.address || '', 'o endereço', 500),
        pickup_date, return_date, pickup_time: body.pickup_time, return_time: body.return_time, total, deposit,
        items: body.items.map((item) => ({
            name: text(item.name, 'o nome do equipamento', 150),
            quantity: integer(item.quantity, 'Quantidade', 1),
            unit_price: amount(item.unit_price, 'Locação unitária'),
            unit_cost: amount(item.unit_cost, 'Valor real unitário'),
        })),
    };
}

function formattedDocument(value) {
    if (value.length === 11) return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    if (value.length === 14) return value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    return '';
}

export async function fillContract(draft) {
    const files = unzipSync(new Uint8Array(await readFile(templateUrl)));
    const content = parseXml(strFromU8(files['content.xml']));
    const values = {
        nome_cliente: draft.customer_name, cpf_cliente: formattedDocument(draft.cpf),
        telefone_cliente: draft.phone, adress_cliente: draft.address,
        full_rental_value: number(draft.total), signal_value: number(draft.deposit),
        rental_date: longDate(draft.pickup_date), actual_time_clock: draft.pickup_time,
        rental_back_date: longDate(draft.return_date),
    };
    const table = elements(content, 'table', 'table').find((node) => node.getAttributeNS(NS.table, 'name') === 'equipament_rental_table');
    requireInput(table, 'A tabela de equipamentos não foi encontrada no modelo.', 503);
    const rows = Array.from(table.childNodes).filter((node) => node.localName === 'table-row');
    const original = rows[1];
    requireInput(original, 'A linha de equipamentos não foi encontrada no modelo.', 503);
    const declarations = elements(content, 'text', 'user-field-decls')[0];
    const baseDeclarations = new Map(elements(content, 'text', 'user-field-decl').map((node) => [node.getAttributeNS(NS.text, 'name'), node]));
    for (const [index, item] of draft.items.entries()) {
        const row = original.cloneNode(true);
        const itemValues = {
            equipament_name: item.name, quantity_equipament: String(item.quantity),
            equipament_rental_value: number(item.unit_price),
            quantity_equipament_total_value: number(Math.round(Number(item.unit_price) * 100) * item.quantity / 100),
            full_equipament_value: number(item.unit_cost),
        };
        for (const field of elements(row, 'text', 'user-field-get')) {
            const base = field.getAttributeNS(NS.text, 'name');
            const name = index === 0 ? base : `${base}_${index + 1}`;
            field.setAttributeNS(NS.text, 'text:name', name);
            values[name] = itemValues[base];
            if (index > 0) {
                const declaration = baseDeclarations.get(base).cloneNode(true);
                declaration.setAttributeNS(NS.text, 'text:name', name);
                declarations.appendChild(declaration);
            }
        }
        table.insertBefore(row, original);
    }
    table.removeChild(original);
    // Repete o cabeçalho quando a relação de itens ocupar mais de uma página.
    const header = content.createElementNS(NS.table, 'table:table-header-rows');
    table.insertBefore(header, rows[0]);
    header.appendChild(rows[0]);
    for (const declaration of elements(content, 'text', 'user-field-decl')) {
        const name = declaration.getAttributeNS(NS.text, 'name');
        requireInput(Object.hasOwn(values, name), `Campo não mapeado no contrato: ${name}`, 503);
        declaration.setAttributeNS(NS.office, 'office:string-value', values[name]);
    }
    for (const field of elements(content, 'text', 'user-field-get')) {
        const name = field.getAttributeNS(NS.text, 'name');
        requireInput(Object.hasOwn(values, name), `Campo não mapeado no contrato: ${name}`, 503);
        field.textContent = values[name];
    }
    // O horário da devolução é texto fixo no original, e não um campo do Writer.
    for (const span of elements(content, 'text', 'span')) {
        if (span.textContent.trim() === '20:00 PM') span.textContent = ` ${draft.return_time}`;
    }
    files['content.xml'] = strToU8(new XMLSerializer().serializeToString(content));
    // Não carrega na cópia a miniatura com os dados demonstrativos do modelo.
    delete files['Thumbnails/thumbnail.png'];
    const manifest = parseXml(strFromU8(files['META-INF/manifest.xml']));
    for (const node of Array.from(manifest.getElementsByTagName('manifest:file-entry'))) {
        if (node.getAttribute('manifest:full-path') === 'Thumbnails/thumbnail.png') node.parentNode.removeChild(node);
    }
    files['META-INF/manifest.xml'] = strToU8(new XMLSerializer().serializeToString(manifest));
    const output = { mimetype: [files.mimetype, { level: 0 }] };
    for (const [path, bytes] of Object.entries(files)) if (path !== 'mimetype') output[path] = bytes;
    return { bytes: Buffer.from(zipSync(output)), html: renderContractHtml(content, files) };
}

// A prévia usa o texto do próprio ODT preenchido, inclusive suas cláusulas.
function renderContractHtml(content, files) {
    const styles = parseXml(strFromU8(files['styles.xml']));
    const styleMap = new Map([...elements(styles, 'style', 'style'), ...elements(content, 'style', 'style')].map((node) => [node.getAttributeNS(NS.style, 'name'), node]));
    function style(node) {
        const name = node.getAttributeNS(NS.text, 'style-name');
        const definition = styleMap.get(name);
        if (!definition) return '';
        const properties = [];
        for (const prop of Array.from(definition.childNodes)) {
            if (!['paragraph-properties', 'text-properties'].includes(prop.localName)) continue;
            for (const key of ['text-align','font-size','font-weight','font-style','margin-top','margin-bottom','line-height','color']) {
                const value = prop.getAttributeNS(NS.fo, key);
                if (value && /^[\w#.% -]+$/.test(value)) properties.push(`${key}:${value}`);
            }
            if (prop.getAttributeNS(NS.style,'text-underline-style') === 'solid') properties.push('text-decoration:underline');
        }
        return properties.join(';');
    }
    function render(node) {
        if (node.nodeType === 3) return escape(node.nodeValue);
        if (node.nodeType !== 1) return '';
        const inside = () => Array.from(node.childNodes).map(render).join('');
        const tag = node.localName;
        if (tag === 'user-field-decls') return '';
        if (tag === 'p' || tag === 'h') return `<p style="${style(node)}">${inside() || '&nbsp;'}</p>`;
        if (tag === 'span') return `<span style="${style(node)}">${inside()}</span>`;
        if (tag === 's') return '&nbsp;'.repeat(Math.min(100, Number(node.getAttributeNS(NS.text,'c') || 1)));
        if (tag === 'line-break') return '<br>';
        if (tag === 'tab') return '&emsp;';
        if (tag === 'table') return `<table>${inside()}</table>`;
        if (tag === 'table-header-rows') return `<thead>${inside()}</thead>`;
        if (tag === 'table-row') return `<tr>${inside()}</tr>`;
        if (tag === 'table-cell') return `<td>${inside()}</td>`;
        if (tag === 'table-column') return '';
        if (tag === 'image') {
            const path = node.getAttributeNS(NS.xlink,'href');
            return files[path] ? `<img alt="Euro Light" src="data:image/png;base64,${Buffer.from(files[path]).toString('base64')}">` : '';
        }
        return inside();
    }
    const firstPage = elements(styles,'style','master-page').find((node) => node.getAttributeNS(NS.style,'name') === 'First_20_Page');
    const header = firstPage ? elements(firstPage,'style','header')[0] : null;
    const body = elements(content,'office','text')[0];
    const bodyNodes = Array.from(body.childNodes);
    const signatureAt = bodyNodes.findIndex((node) => node.localName === 'p' && node.textContent.startsWith('Curitiba/PR,'));
    const bodyHtml = signatureAt < 0 ? render(body) : bodyNodes.slice(0, signatureAt).map(render).join('') + `<div class="signature">${bodyNodes.slice(signatureAt).map(render).join('')}</div>`;
    return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Contrato de locação</title><style>
        @page{size:A4;margin:15mm 25.4mm 20mm}*{box-sizing:border-box}body{margin:0;color:#000;background:#fff;font-family:'Times New Roman',serif;font-size:10pt;line-height:1.15}header{text-align:center;margin-bottom:22pt}header img{width:31pt;height:31pt;object-fit:contain}header p{margin:0 0 5pt}p{margin:0 0 7pt;overflow-wrap:anywhere}table{border-collapse:collapse;width:100%;margin:8pt 0 12pt;table-layout:fixed}td{border-top:1px solid #444;border-bottom:1px solid #444;padding:3pt;text-align:center;vertical-align:top;font-size:9pt}td:first-child{width:40%;text-align:left}td:nth-child(2){width:9%}td p{margin:0!important}thead{display:table-header-group}tr{break-inside:avoid}img{max-width:100%}main>p{break-inside:avoid}.signature{break-inside:avoid}@media screen{body{padding:20px}}
        </style></head><body><header>${header ? render(header) : ''}</header><main>${bodyHtml}</main></body></html>`;
}

export function contractRouter(pool) {
    const router = Router();
    async function findRental(id) {
        requireInput(typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id), 'Locação inválida.');
        const result = await pool.query("SELECT rental_date::text,(now() AT TIME ZONE 'America/Sao_Paulo')::date::text AS today,to_char(delivery_time, 'HH24:MI') AS delivery_time,customer_name,cpf,phone,address,occupied_from::text,occupied_until::text,total,deposit FROM eurolight_rentals WHERE id=$1", [id]);
        requireInput(result.rowCount, 'Locação não encontrada.', 404);
        requireInput(result.rows[0].rental_date.slice(0, 7) >= result.rows[0].today.slice(0, 7), 'Este mês está encerrado e não aceita novos contratos.', 409);
        return result.rows[0];
    }
    router.get('/rentals/:id/contract', async (request, response, next) => {
        try {
            const rental = await findRental(request.params.id);
            const items = await pool.query(`SELECT i.name,i.quantity,i.unit_price,e.unit_cost FROM eurolight_rental_items i JOIN eurolight_equipment e ON e.id=i.equipment_id WHERE i.rental_id=$1 ORDER BY i.name`, [request.params.id]);
            response.json({ draft: {
                customer_name: rental.customer_name, cpf: formattedDocument(rental.cpf || ''), phone: rental.phone, address: rental.address,
                pickup_date: rental.occupied_from, return_date: rental.occupied_until,
                pickup_time: rental.delivery_time || new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour:'2-digit', minute:'2-digit', hourCycle:'h23' }).format(new Date()),
                return_time: '20:00', total: Number(rental.total), deposit: Number(rental.deposit),
                items: items.rows.map((item) => ({ ...item, unit_price: Number(item.unit_price), unit_cost: Number(item.unit_cost) })),
            } });
        } catch (error) { next(error); }
    });
    router.post('/rentals/:id/contract', async (request, response, next) => {
        try {
            await findRental(request.params.id);
            const draft = validateContract(request.body);
            requireInput(!request.query.format || ['odt','html'].includes(request.query.format), 'Formato de contrato inválido.');
            const result = await fillContract(draft);
            if (request.query.format === 'html') return response.type('html').send(result.html);
            response.type('application/vnd.oasis.opendocument.text');
            response.attachment(`contrato-${request.params.id}.odt`).send(result.bytes);
        } catch (error) { next(error); }
    });
    return router;
}
