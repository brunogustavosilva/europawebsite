function isSmokeMachine(equipment) {
  const name = String(equipment?.nome || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  return /maquina.*fumaca/.test(name);
}

// Kits são convertidos em peças antes de editar quantidades ou calcular descontos.
// Também normaliza sacolas antigas que ainda armazenavam o ID do kit.
export function expandCartKits(items, catalog) {
  const equipment = new Map(catalog.map((item) => [item.id, item]));
  const quantities = new Map();
  for (const item of [...items].sort(
    (a, b) =>
      Number(Boolean(equipment.get(a.id)?.is_kit)) - Number(Boolean(equipment.get(b.id)?.is_kit)),
  )) {
    const row = equipment.get(item.id);
    const parts = row?.is_kit ? row.kit_items : [{ equipment_id: item.id, quantity: 1 }];
    for (const part of parts || []) {
      quantities.set(
        part.equipment_id,
        row?.is_kit && isSmokeMachine(equipment.get(part.equipment_id))
          ? Math.max(quantities.get(part.equipment_id) || 0, part.quantity)
          : (quantities.get(part.equipment_id) || 0) + item.quantity * part.quantity,
      );
    }
  }
  return [...quantities]
    .filter(([, quantity]) => quantity > 0)
    .map(([id, quantity]) => ({ id, quantity }));
}

export function priceCartKits(cartItems, catalog) {
  const physical = new Map(catalog.filter((item) => !item.is_kit).map((item) => [item.id, item]));
  const items = expandCartKits(cartItems, catalog).filter((item) => physical.has(item.id));
  const remaining = new Map(items.map((item) => [item.id, item.quantity]));
  const eligible = new Map();
  const offers = catalog
    .filter((item) => item.is_kit)
    .map((kit) => {
      const parts = kit.kit_items || [];
      const valid =
        parts.length &&
        new Set(parts.map((part) => part.equipment_id)).size === parts.length &&
        parts.every(
          (part) =>
            physical.has(part.equipment_id) &&
            Number.isInteger(Number(part.quantity)) &&
            Number(part.quantity) > 0,
        );
      const full = valid
        ? parts.reduce(
            (sum, part) =>
              sum + Math.round(Number(physical.get(part.equipment_id).preco) * 100) * part.quantity,
            0,
          )
        : 0;
      const price = Math.round(Number(kit.preco) * 100);
      return {
        kit,
        full,
        rate: full > 0 && price >= 0 && price < full ? (full - price) / full : 0,
      };
    })
    .filter((offer) => offer.rate > 0)
    .sort((a, b) => b.rate - a.rate || a.kit.id.localeCompare(b.kit.id));
  const applied = [];
  for (const offer of offers) {
    const sharesSmoke = offer.kit.kit_items.some(
      (part) => !isSmokeMachine(physical.get(part.equipment_id)),
    );
    const quantity = Math.min(
      ...offer.kit.kit_items.map((part) => {
        if (sharesSmoke && isSmokeMachine(physical.get(part.equipment_id)))
          return (remaining.get(part.equipment_id) || 0) >= part.quantity ? Infinity : 0;
        return Math.floor((remaining.get(part.equipment_id) || 0) / part.quantity);
      }),
    );
    if (!quantity) continue;
    applied.push({ id: offer.kit.id, name: offer.kit.nome, quantity, rate: offer.rate });
    for (const part of offer.kit.kit_items) {
      const sharedSmoke = sharesSmoke && isSmokeMachine(physical.get(part.equipment_id));
      const used = sharedSmoke
        ? Math.min(remaining.get(part.equipment_id), part.quantity * quantity)
        : part.quantity * quantity;
      if (!sharedSmoke) remaining.set(part.equipment_id, remaining.get(part.equipment_id) - used);
      eligible.set(
        part.equipment_id,
        sharedSmoke
          ? Math.max(eligible.get(part.equipment_id) || 0, used)
          : (eligible.get(part.equipment_id) || 0) + used,
      );
    }
  }
  // Repetições não acumulam. Mais de um tipo usa o maior + metade do menor.
  const rates = applied.map((offer) => offer.rate);
  const rate = rates.length
    ? Math.min(1, Math.max(...rates) + (rates.length > 1 ? Math.min(...rates) / 2 : 0))
    : 0;
  const lines = items.map((item) => {
    const equipment = physical.get(item.id);
    const unitCents = Math.round(Number(equipment.preco) * 100);
    return {
      ...item,
      equipment,
      originalCents: unitCents * item.quantity,
      eligibleQuantity: eligible.get(item.id) || 0,
      eligibleCents: unitCents * (eligible.get(item.id) || 0),
    };
  });
  const eligibleTotal = lines.reduce((sum, line) => sum + line.eligibleCents, 0);
  const discountCents = Math.round(eligibleTotal * rate);
  const shares = lines.map((line, index) => {
    const exact = eligibleTotal ? (discountCents * line.eligibleCents) / eligibleTotal : 0;
    return { index, cents: Math.floor(exact), fraction: exact - Math.floor(exact) };
  });
  let centsLeft = discountCents - shares.reduce((sum, share) => sum + share.cents, 0);
  for (const share of [...shares].sort((a, b) => b.fraction - a.fraction))
    if (centsLeft > 0 && lines[share.index].eligibleCents > 0) {
      share.cents++;
      centsLeft--;
    }
  const pricedItems = lines.map((line, index) => ({
    ...line,
    lineTotal: (line.originalCents - shares[index].cents) / 100,
    lineDiscount: shares[index].cents / 100,
  }));
  const subtotal = lines.reduce((sum, line) => sum + line.originalCents, 0) / 100;
  return {
    items: pricedItems,
    appliedKits: applied,
    discountRate: rate,
    discount: discountCents / 100,
    subtotal,
    total: (Math.round(subtotal * 100) - discountCents) / 100,
  };
}

export function suggestCartKit(cartItems, catalog) {
  const pricing = priceCartKits(cartItems, catalog);
  if (!pricing.items.length) return null;
  const quantities = new Map(pricing.items.map((item) => [item.id, item.quantity]));
  const physical = new Map(catalog.filter((item) => !item.is_kit).map((item) => [item.id, item]));
  const applied = new Set(pricing.appliedKits.map((kit) => kit.id));
  const suggestions = [];
  for (const kit of catalog.filter((item) => item.is_kit && !applied.has(item.id))) {
    const parts = kit.kit_items || [];
    if (
      !parts.length ||
      !parts.every(
        (part) =>
          physical.has(part.equipment_id) &&
          Number.isInteger(Number(part.quantity)) &&
          Number(part.quantity) > 0,
      )
    )
      continue;
    if (!parts.some((part) => quantities.has(part.equipment_id))) continue;
    const missing = parts
      .map((part) => ({
        id: part.equipment_id,
        equipment: physical.get(part.equipment_id),
        quantity: Math.max(0, part.quantity - (quantities.get(part.equipment_id) || 0)),
      }))
      .filter((part) => part.quantity > 0);
    const missingCount = missing.reduce((sum, part) => sum + part.quantity, 0);
    if (missingCount < 1 || missingCount > 2) continue;
    const projected = priceCartKits(
      [
        ...pricing.items.map(({ id, quantity }) => ({ id, quantity })),
        ...missing.map(({ id, quantity }) => ({ id, quantity })),
      ],
      catalog,
    );
    if (!projected.appliedKits.some((offer) => offer.id === kit.id) || !projected.discount)
      continue;
    suggestions.push({
      kitId: kit.id,
      name: kit.nome,
      price: Number(kit.preco),
      missing,
      missingCount,
      discountRate: projected.discountRate,
    });
  }
  return (
    suggestions.sort(
      (a, b) =>
        a.missingCount - b.missingCount || a.price - b.price || a.kitId.localeCompare(b.kitId),
    )[0] || null
  );
}
