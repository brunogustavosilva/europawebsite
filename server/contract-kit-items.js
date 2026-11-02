// Distribui o preço do kit em centavos, preservando o total mesmo com quantidades ímpares.
export function expandContractItems(items, equipment) {
  const catalog = new Map(equipment.map((row) => [row.id, row]));
  return items.flatMap((item) => {
    const discountedLine = item.stock_items?.[0]?.contract_line_total;
    if (!item.is_kit && discountedLine != null)
      return expandContractItems(
        [
          {
            is_kit: true,
            quantity: 1,
            unit_price: discountedLine,
            stock_items: [
              {
                name: item.name,
                quantity: item.quantity,
                unit_price: item.unit_price,
                unit_cost: item.unit_cost,
              },
            ],
          },
        ],
        [],
      );
    if (!item.is_kit)
      return [
        {
          name: item.name,
          quantity: item.quantity,
          unit_price: Number(item.unit_price),
          unit_cost: Number(item.unit_cost),
        },
      ];
    const parts = (item.stock_items || item.kit_items).map((part) => {
      const row = catalog.get(part.equipment_id) || {};
      return {
        name: part.name || row.nome,
        quantity: part.quantity * item.quantity,
        unit_cost: Number(part.unit_cost ?? row.unit_cost ?? 0),
        weight:
          Math.round(Number(part.unit_price ?? row.preco ?? 0) * 100) *
          part.quantity *
          item.quantity,
      };
    });
    const total = Math.round(Number(item.unit_price) * 100) * item.quantity;
    const weight = parts.reduce((sum, part) => sum + part.weight, 0);
    const count = parts.reduce((sum, part) => sum + part.quantity, 0);
    let allocated = 0;
    return parts.flatMap((part, index) => {
      const cents =
        index === parts.length - 1
          ? total - allocated
          : Math.floor(total * (weight ? part.weight / weight : part.quantity / count));
      allocated += cents;
      const unit = Math.floor(cents / part.quantity);
      const extra = cents % part.quantity;
      return [
        ...(part.quantity > extra
          ? [
              {
                name: part.name,
                quantity: part.quantity - extra,
                unit_price: unit / 100,
                unit_cost: part.unit_cost,
              },
            ]
          : []),
        ...(extra
          ? [
              {
                name: part.name,
                quantity: extra,
                unit_price: (unit + 1) / 100,
                unit_cost: part.unit_cost,
              },
            ]
          : []),
      ];
    });
  });
}
