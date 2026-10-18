import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { InputError, requireInput, monthsFor, editableDate, weekStart, rentalPeriod, plusDays, amount, text, integer } from './admin-domain.js';

import { readAvailability } from './availability.js';
import { imageLink, projectVideo } from './equipment-media.js';
import { contractRouter } from './contracts.js';

const tags = ['visual', 'imagem', 'som', 'audio', 'estrutural'];
const categories = { visual: 'luzes', imagem: 'video-imagem', som: 'som', audio: 'audio', estrutural: 'estrutura' };
const uuid = (value) => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
async function today(db) {
    return (await db.query("SELECT (now() AT TIME ZONE 'America/Sao_Paulo')::date::text AS today")).rows[0].today;
}
const numericEquipment = (row) => ({ ...row, preco: Number(row.preco), unit_cost: Number(row.unit_cost), reserved: Number(row.reserved || 0), available: row.stock - Number(row.reserved || 0) });
const rentalColumns = `r.id, r.customer_name, r.phone, r.cpf, r.address, r.rental_date::text, r.occupied_from::text, r.occupied_until::text,
    r.total, r.deposit, r.delivery, to_char(r.delivery_time, 'HH24:MI') AS delivery_time, r.status, r.notes`;

export function managementRouter(pool) {
    const router = Router();
    router.get('/dashboard', async (request, response, next) => {
        try {
            const currentDate = await today(pool);
            const months = monthsFor(currentDate);
            const month = request.query.month || currentDate.slice(0, 7);
            requireInput(months.some((item) => item.month === month), 'Mês fora do período disponível.');
            const start = `${months[0].month}-01`;
            const end = plusDays(`${months[6].month}-01`, 32).slice(0, 7) + '-01';
            const { rows } = await pool.query(`
                SELECT to_char(rental_date, 'YYYY-MM') AS month,
                    COALESCE(SUM(total) FILTER (WHERE status = 'concluida'),0) AS completed_value,
                    COUNT(*) FILTER (WHERE status = 'concluida') AS completed_count,
                    COALESCE(SUM(total) FILTER (WHERE status = 'prevista' AND rental_date >= $3::date),0) AS planned_value,
                    COUNT(*) FILTER (WHERE status = 'prevista' AND rental_date >= $3::date) AS planned_count
                FROM eurolight_rentals WHERE rental_date >= $1::date AND rental_date < $2::date
                GROUP BY to_char(rental_date, 'YYYY-MM')
            `, [start, end, `${currentDate.slice(0, 7)}-01`]);
            const summaries = months.map((item) => {
                const row = rows.find((row) => row.month === item.month);
                return { ...item, completedValue: Number(row?.completed_value || 0), completedCount: Number(row?.completed_count || 0), plannedValue: Number(row?.planned_value || 0), plannedCount: Number(row?.planned_count || 0) };
            });
            const rentals = await pool.query(`
                SELECT ${rentalColumns}, COALESCE(json_agg(json_build_object(
                    'equipment_id', i.equipment_id, 'name', i.name, 'quantity', i.quantity, 'unit_price', i.unit_price
                ) ORDER BY i.name) FILTER (WHERE i.equipment_id IS NOT NULL),'[]'::json) AS items
                FROM eurolight_rentals r LEFT JOIN eurolight_rental_items i ON i.rental_id = r.id
                WHERE to_char(r.rental_date, 'YYYY-MM') = $1
                  AND (r.rental_date >= $2::date OR r.status = 'concluida')
                GROUP BY r.id ORDER BY r.rental_date, r.customer_name
            `, [month, `${currentDate.slice(0, 7)}-01`]);
            response.json({ today: currentDate, month, months: summaries, rentals: rentals.rows.map((row) => ({ ...row, total: Number(row.total), deposit: Number(row.deposit), items: row.items.map((item) => ({ ...item, unit_price: Number(item.unit_price) })) })) });
        } catch (error) { next(error); }
    });

    router.get('/inventory', async (request, response, next) => {
        try {
            const currentDate = await today(pool);
            const week = weekStart(request.query.week || currentDate);
            let period = request.query.rentalDate ? rentalPeriod(request.query.rentalDate) : { from: week, until: plusDays(week, 6) };
            const exclude = request.query.exclude || null;
            requireInput(exclude === null || uuid(exclude), 'Locação inválida.');
            if (exclude && request.query.rentalDate) {
                const existing = await pool.query('SELECT rental_date::text,occupied_from::text,occupied_until::text FROM eurolight_rentals WHERE id=$1', [exclude]);
                if (existing.rows[0]?.rental_date === request.query.rentalDate) period = { from: existing.rows[0].occupied_from, until: existing.rows[0].occupied_until };
            }
            const rows = await readAvailability(pool, { ...period, exclude, currentDate });
            const items = rows.map(numericEquipment);
            response.json({ today: currentDate, week, occupiedFrom: period.from, occupiedUntil: period.until, items,
                totals: { quantity: items.reduce((sum, item) => sum + item.stock, 0), available: items.reduce((sum, item) => sum + item.available, 0), potential: items.reduce((sum, item) => sum + Math.round(item.preco * 100) * item.stock, 0) / 100 } });
        } catch (error) { next(error); }
    });

    async function saveEquipment(request, response, next) {
        const client = await pool.connect();
        try {
            const body = request.body || {};
            const nome = text(body.nome, 'o nome do equipamento', 150);
            const stock = integer(body.stock, 'Estoque');
            const price = amount(body.preco, 'Valor da locação');
            const cost = amount(body.unit_cost, 'Preço unitário de compra');
            const image = body.image_url === undefined ? null : imageLink(body.image_url);
            const video = body.video_file === undefined ? null : await projectVideo(body.video_file);
            requireInput(tags.includes(body.tag), 'Selecione uma tag válida.');
            requireInput(['110','220','bivolt'].includes(body.voltage), 'Selecione a voltagem.');
            const id = request.params.id || randomUUID();
            await client.query('BEGIN');
            if (request.params.id) {
                const existing = await client.query('SELECT id FROM eurolight_equipment WHERE id = $1 FOR UPDATE', [id]);
                requireInput(existing.rowCount, 'Equipamento não encontrado.', 404);
                const { rows } = await client.query(`
                    SELECT COALESCE(MAX(used),0)::integer AS maximum FROM (
                        SELECT d.day::date, SUM(i.quantity) AS used FROM eurolight_rental_items i
                        JOIN eurolight_rentals r ON r.id = i.rental_id
                        CROSS JOIN LATERAL generate_series(GREATEST(r.occupied_from,$2::date)::timestamp,r.occupied_until::timestamp,interval '1 day') AS d(day)
                        WHERE i.equipment_id=$1 AND r.status <> 'cancelada' AND r.occupied_until >= $2::date
                          AND (r.status='concluida' OR r.rental_date >= date_trunc('month',$2::date)::date)
                        GROUP BY d.day::date
                    ) a
                `, [id, await today(client)]);
                requireInput(stock >= rows[0].maximum, `Existem ${rows[0].maximum} unidades comprometidas em um mesmo dia. O estoque não pode ser menor.`, 409);
                await client.query('UPDATE eurolight_equipment SET nome=$2, stock=$3, preco=$4, unit_cost=$5, voltage=$6, tag=$7, categorias=$8, image_url=COALESCE($9,image_url), video_file=COALESCE($10,video_file) WHERE id=$1', [id, nome, stock, price, cost, body.voltage, body.tag, [categories[body.tag]], image, video]);
            } else {
                await client.query(`INSERT INTO eurolight_equipment (id,nome,stock,preco,unit_cost,voltage,tag,categorias,descricao,ideal,periodo,popularidade,image_url,video_file)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Equipamento para locação.','Eventos','fim de semana',0,$9,$10)`, [id,nome,stock,price,cost,body.voltage,body.tag,[categories[body.tag]],image || '',video || '']);
            }
            await client.query('COMMIT');
            response.status(request.params.id ? 200 : 201).json({ id });
        } catch (error) {
            await client.query('ROLLBACK');
            next(error);
        } finally { client.release(); }
    }
    router.post('/equipment', saveEquipment);
    router.put('/equipment/:id', saveEquipment);

    async function saveRental(request, response, next) {
        const client = await pool.connect();
        try {
            const body = request.body || {};
            const currentDate = await today(client);
            editableDate(body.rental_date, currentDate);
            let period = rentalPeriod(body.rental_date);
            const name = text(body.customer_name, 'o nome do cliente', 150);
            const phone = text(body.phone, 'o telefone', 30);
            const cpfInput = text(body.cpf ?? '', 'o CPF', 14, false);
            const cpf = cpfInput.replace(/[.\-\s]/g, '') || null;
            requireInput(cpf === null || /^\d{11}$/.test(cpf), 'Informe o CPF com 11 dígitos ou deixe o campo em branco.');
            requireInput(phone.replace(/\D/g,'').length >= 8, 'Informe um telefone válido.');
            requireInput(typeof body.delivery === 'boolean', 'Informe se haverá entrega.');
            const deliveryTime = body.delivery ? body.delivery_time : null;
            requireInput(!body.delivery || (typeof deliveryTime === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(deliveryTime)), 'Informe o horário previsto para entrega.');
            const address = text(body.address || '', 'o endereço', 500, body.delivery);
            const notes = text(body.notes || '', 'as observações', 2000, false);
            const total = amount(body.total, 'Valor da locação');
            const deposit = amount(body.deposit ?? 0, 'Sinal');
            requireInput(Number(deposit) <= Number(total), 'O sinal não pode ultrapassar o valor da locação.');
            requireInput(['prevista','concluida','cancelada'].includes(body.status), 'Status inválido.');
            requireInput(Array.isArray(body.items) && body.items.length > 0 && body.items.length <= 100, 'Adicione de 1 a 100 equipamentos.');
            const items = body.items.map((item) => ({ id: text(item.equipment_id, 'o equipamento', 150), quantity: integer(item.quantity, 'Quantidade', 1) }));
            requireInput(new Set(items.map((item) => item.id)).size === items.length, 'Selecione cada equipamento apenas uma vez.');
            const id = request.params.id || randomUUID();
            requireInput(uuid(id), 'Locação inválida.');
            await client.query('BEGIN');
            let previousItems = [];
            let previousSnapshots = [];
            if (request.params.id) {
                const existing = await client.query('SELECT rental_date::text,occupied_from::text,occupied_until::text FROM eurolight_rentals WHERE id=$1 FOR UPDATE', [id]);
                requireInput(existing.rowCount, 'Locação não encontrada.', 404);
                editableDate(existing.rows[0].rental_date, currentDate);
                if (existing.rows[0].rental_date === body.rental_date) period = { from: existing.rows[0].occupied_from, until: existing.rows[0].occupied_until };
                previousSnapshots = (await client.query('SELECT equipment_id,name,unit_price FROM eurolight_rental_items WHERE rental_id=$1', [id])).rows;
                previousItems = previousSnapshots.map((item) => item.equipment_id);
            }
            // Todas as reservas do mesmo equipamento são serializadas, inclusive entre clientes simultâneos.
            const ids = [...new Set([...items.map((item) => item.id), ...previousItems])].sort();
            const equipment = await client.query('SELECT id,nome,stock,preco FROM eurolight_equipment WHERE id = ANY($1::text[]) ORDER BY id FOR UPDATE', [ids]);
            const availability = await readAvailability(client, { ...period, exclude: id, currentDate, ids: items.map((item) => item.id) });
            const snapshots = [];
            for (const item of items) {
                const row = equipment.rows.find((row) => row.id === item.id);
                requireInput(row, 'Equipamento não encontrado.');
                if (body.status !== 'cancelada') {
                    const reserved = availability.find((entry) => entry.id === item.id)?.reserved || 0;
                    const available = row.stock - reserved;
                    requireInput(item.quantity <= available, `${row.nome}: apenas ${available} unidade(s) disponível(is) no período selecionado.`, 409);
                }
                const previous = previousSnapshots.find((entry) => entry.equipment_id === item.id);
                snapshots.push({ ...item, name: previous?.name || row.nome, price: previous?.unit_price ?? row.preco });
            }
            const values = [id,name,phone,address,body.rental_date,total,deposit,body.delivery,body.status,notes,cpf,deliveryTime];
            if (request.params.id) {
                await client.query(`UPDATE eurolight_rentals SET customer_name=$2,phone=$3,address=$4,rental_date=$5,total=$6,deposit=$7,delivery=$8,status=$9,notes=$10,cpf=$11,delivery_time=$12 WHERE id=$1`, values);
                await client.query('DELETE FROM eurolight_rental_items WHERE rental_id=$1', [id]);
            } else {
                await client.query(`INSERT INTO eurolight_rentals (id,customer_name,phone,address,rental_date,total,deposit,delivery,status,notes,cpf,delivery_time) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`, values);
            }
            for (const item of snapshots) {
                await client.query('INSERT INTO eurolight_rental_items (rental_id,equipment_id,name,unit_price,quantity) VALUES ($1,$2,$3,$4,$5)', [id,item.id,item.name,item.price,item.quantity]);
            }
            await client.query('COMMIT');
            response.status(request.params.id ? 200 : 201).json({ id });
        } catch (error) {
            await client.query('ROLLBACK');
            next(error);
        } finally { client.release(); }
    }
    router.post('/rentals', saveRental);
    router.put('/rentals/:id', saveRental);
    router.delete('/rentals/:id', async (request, response, next) => {
        const client = await pool.connect();
        try {
            requireInput(uuid(request.params.id), 'Locação inválida.');
            await client.query('BEGIN');
            const { rows } = await client.query('SELECT rental_date::text FROM eurolight_rentals WHERE id=$1 FOR UPDATE', [request.params.id]);
            requireInput(rows.length, 'Locação não encontrada.', 404);
            editableDate(rows[0].rental_date, await today(client));
            await client.query('DELETE FROM eurolight_rental_items WHERE rental_id=$1', [request.params.id]);
            await client.query('DELETE FROM eurolight_rentals WHERE id=$1', [request.params.id]);
            await client.query('COMMIT');
            response.json({ id: request.params.id });
        } catch (error) {
            await client.query('ROLLBACK');
            next(error);
        } finally { client.release(); }
    });
    router.post('/rentals/:id/receive', async (request, response, next) => {
        const client = await pool.connect();
        try {
            requireInput(uuid(request.params.id), 'Locação inválida.');
            await client.query('BEGIN');
            const { rows } = await client.query('SELECT rental_date::text,status FROM eurolight_rentals WHERE id=$1 FOR UPDATE', [request.params.id]);
            requireInput(rows.length, 'Locação não encontrada.', 404);
            editableDate(rows[0].rental_date, await today(client));
            requireInput(rows[0].status !== 'cancelada', 'Edite a locação cancelada para reativá-la antes de receber.', 409);
            await client.query("UPDATE eurolight_rentals SET status='concluida' WHERE id=$1", [request.params.id]);
            await client.query('COMMIT');
            response.json({ id: request.params.id, status: 'concluida' });
        } catch (error) {
            await client.query('ROLLBACK');
            next(error);
        } finally { client.release(); }
    });
    router.use(contractRouter(pool));
    router.use((error, _request, response, _next) => {
        if (error instanceof InputError) return response.status(error.status).json({ error: error.message });
        console.error('Falha na administração:', error.code || error.name);
        response.status(503).json({ error: 'Não foi possível salvar ou carregar os dados. Tente novamente.' });
    });
    return router;
}
