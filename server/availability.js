// A quantidade comprometida é o pico de ocupação simultânea, nunca a soma
// de reservas que ocorrem em dias diferentes do período consultado.
export async function readAvailability(db, { from, until, exclude = null, currentDate, ids = null }) {
    const { rows } = await db.query(`
        WITH active AS (
            SELECT i.equipment_id, i.quantity, r.occupied_from, r.occupied_until
            FROM eurolight_rental_items i JOIN eurolight_rentals r ON r.id = i.rental_id
            WHERE r.status <> 'cancelada' AND r.occupied_from <= $2::date AND r.occupied_until >= $1::date
              AND ($3::uuid IS NULL OR r.id <> $3::uuid)
              AND (r.status = 'concluida' OR r.rental_date >= $4::date)
              AND ($5::text[] IS NULL OR i.equipment_id = ANY($5::text[]))
        ), daily AS (
            SELECT a.equipment_id, d.day::date, SUM(a.quantity) AS reserved
            FROM active a CROSS JOIN LATERAL generate_series(
                GREATEST(a.occupied_from, $1::date)::timestamp,
                LEAST(a.occupied_until, $2::date)::timestamp, interval '1 day'
            ) AS d(day)
            GROUP BY a.equipment_id, d.day::date
        )
        SELECT e.*, COALESCE((SELECT MAX(reserved) FROM daily WHERE equipment_id = e.id),0)::integer AS reserved
        FROM eurolight_equipment e WHERE $5::text[] IS NULL OR e.id = ANY($5::text[])
        ORDER BY e.nome
    `, [from, until, exclude, `${currentDate.slice(0, 7)}-01`, ids]);
    return rows;
}
