import { requireInput, integer, text } from './admin-domain.js';

export function kitItems(value) {
  requireInput(
    Array.isArray(value) && value.length > 0 && value.length <= 100,
    'Selecione de 1 a 100 equipamentos para o kit.',
  );
  const items = value.map((item) => ({
    equipment_id: text(item.equipment_id, 'o equipamento do kit', 150),
    quantity: integer(item.quantity, 'Quantidade no kit', 1),
  }));
  requireInput(
    new Set(items.map((item) => item.equipment_id)).size === items.length,
    'Selecione cada equipamento do kit apenas uma vez.',
  );
  return items;
}

export function kitAvailability(rows) {
  const physical = new Map(rows.filter((row) => !row.is_kit).map((row) => [row.id, row]));
  return rows.map((row) => {
    if (!row.is_kit) return row;
    const parts = row.kit_items || [];
    const stock = parts.length
      ? Math.min(
          ...parts.map((part) =>
            Math.floor((physical.get(part.equipment_id)?.stock || 0) / part.quantity),
          ),
        )
      : 0;
    const available = parts.length
      ? Math.min(
          ...parts.map((part) => {
            const item = physical.get(part.equipment_id);
            return Math.max(
              0,
              Math.floor(((item?.stock || 0) - (item?.reserved || 0)) / part.quantity),
            );
          }),
        )
      : 0;
    return { ...row, stock, reserved: stock - available };
  });
}

export function stockDemands(items, equipment) {
  const demands = new Map();
  for (const item of items) {
    const row = equipment.find((entry) => entry.id === item.id);
    requireInput(row, 'Equipamento não encontrado.');
    const parts = row.is_kit ? kitItems(row.kit_items) : [{ equipment_id: item.id, quantity: 1 }];
    for (const part of parts)
      demands.set(
        part.equipment_id,
        (demands.get(part.equipment_id) || 0) + part.quantity * item.quantity,
      );
  }
  return demands;
}
