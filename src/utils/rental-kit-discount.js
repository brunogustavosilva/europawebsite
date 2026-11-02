import { expandCartKits, priceCartKits } from './cart-kits.js';

// No cadastro administrativo, a composição precisa coincidir exatamente com um kit.
export function exactRentalKit(items, catalog) {
  if (
    !items.length ||
    items.some(
      (item) =>
        !item.equipment_id || !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1,
    )
  )
    return null;
  const selected = new Map(items.map((item) => [item.equipment_id, Number(item.quantity)]));
  if (selected.size !== items.length) return null;
  const physical = new Map(catalog.filter((item) => !item.is_kit).map((item) => [item.id, item]));
  if (items.some((item) => !physical.has(item.equipment_id))) return null;
  const fullCents = items.reduce(
    (sum, item) =>
      sum + Math.round(Number(physical.get(item.equipment_id).preco) * 100) * Number(item.quantity),
    0,
  );
  if (!fullCents) return null;
  const matches = catalog
    .filter(
      (kit) =>
        kit.is_kit &&
        kit.kit_items?.length === selected.size &&
        new Set(kit.kit_items.map((part) => part.equipment_id)).size === selected.size &&
        kit.kit_items.every((part) => selected.get(part.equipment_id) === Number(part.quantity)) &&
        Math.round(Number(kit.preco) * 100) >= 0 &&
        Math.round(Number(kit.preco) * 100) < fullCents,
    )
    .sort((a, b) => Number(a.preco) - Number(b.preco) || a.id.localeCompare(b.id));
  if (!matches.length) return null;
  const kit = matches[0];
  const priceCents = Math.round(Number(kit.preco) * 100);
  const shares = items.map((item) => {
    const exact =
      (priceCents *
        Math.round(Number(physical.get(item.equipment_id).preco) * 100) *
        Number(item.quantity)) /
      fullCents;
    return { id: item.equipment_id, cents: Math.floor(exact), fraction: exact - Math.floor(exact) };
  });
  let remainder = priceCents - shares.reduce((sum, item) => sum + item.cents, 0);
  for (const share of [...shares].sort((a, b) => b.fraction - a.fraction))
    if (remainder > 0) {
      share.cents++;
      remainder--;
    }
  return {
    id: kit.id,
    name: kit.nome,
    price: priceCents / 100,
    fullPrice: fullCents / 100,
    rate: (fullCents - priceCents) / fullCents,
    lineTotals: Object.fromEntries(shares.map((item) => [item.id, item.cents / 100])),
  };
}

export function selectRentalKit(items, index, kitId, catalog) {
  const quantity = Math.max(1, Math.floor(Number(items[index]?.quantity) || 1));
  const selected = items
    .filter((item, position) => position !== index && item.equipment_id)
    .map((item) => ({ id: item.equipment_id, quantity: Number(item.quantity) }));
  selected.push({ id: kitId, quantity });
  return expandCartKits(selected, catalog).map(({ id, quantity }) => ({
    equipment_id: id,
    quantity,
  }));
}

// Mesma política da sacola, incluindo kits combinados, repetições e fumaça compartilhada.
export function rentalKitDiscount(items, catalog) {
  if (
    !items.length ||
    items.some(
      (item) =>
        !item.equipment_id || !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1,
    )
  )
    return null;
  if (new Set(items.map((item) => item.equipment_id)).size !== items.length) return null;
  if (items.some((item) => !catalog.some((row) => row.id === item.equipment_id && !row.is_kit)))
    return null;
  const pricing = priceCartKits(
    items.map((item) => ({ id: item.equipment_id, quantity: Number(item.quantity) })),
    catalog,
  );
  if (!pricing.discount || !pricing.appliedKits.length) return null;
  return {
    id: pricing.appliedKits
      .map((kit) => kit.id)
      .sort()
      .join('|'),
    name: pricing.appliedKits
      .map((kit) => `${kit.quantity > 1 ? kit.quantity + '× ' : ''}${kit.name}`)
      .join(' + '),
    price: pricing.total,
    fullPrice: pricing.subtotal,
    rate: pricing.discountRate,
    discount: pricing.discount,
    appliedKits: pricing.appliedKits,
    lineTotals: Object.fromEntries(pricing.items.map((item) => [item.id, item.lineTotal])),
  };
}
