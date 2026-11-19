// Lógica pura del carrito: sin DOM, para poder probarla con node --test.
export const MAX_QTY = 10;
export const SHIPPING_COST = 4500;
export const FREE_SHIPPING_FROM = 60000;

const clampQty = (n) => Math.min(MAX_QTY, Math.max(0, Math.trunc(Number(n)) || 0));

export function addItem(items, id, qty = 1) {
  if (typeof id !== 'string' || !id) return items;
  const add = clampQty(qty);
  if (add === 0) return items;
  const found = items.find((i) => i.id === id);
  if (!found) return [...items, { id, qty: add }];
  return items.map((i) => (i.id === id ? { id, qty: Math.min(MAX_QTY, i.qty + add) } : i));
}

export function setQty(items, id, qty) {
  const q = clampQty(qty);
  if (q === 0) return removeItem(items, id);
  return items.map((i) => (i.id === id ? { id, qty: q } : i));
}

export const removeItem = (items, id) => items.filter((i) => i.id !== id);

export const count = (items) => items.reduce((n, i) => n + i.qty, 0);

export function subtotal(items, catalog) {
  const byId = new Map(catalog.map((p) => [p.id, p]));
  return items.reduce((sum, i) => sum + (byId.get(i.id)?.price ?? 0) * i.qty, 0);
}

export function shipping(sub) {
  if (sub <= 0) return 0;
  return sub >= FREE_SHIPPING_FROM ? 0 : SHIPPING_COST;
}

export const remainingForFreeShipping = (sub) =>
  sub <= 0 ? FREE_SHIPPING_FROM : Math.max(0, FREE_SHIPPING_FROM - sub);

export const formatPrice = (n) =>
  '$ ' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export function filterProducts(products, category) {
  return category === 'all' || !category ? products : products.filter((p) => p.category === category);
}

// Lee lo guardado sin confiar en él: descarta ids que ya no existen, cantidades inválidas y duplicados.
export function parseStored(raw, catalog) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  const valid = new Set(catalog.map((p) => p.id));
  const seen = new Set();
  const out = [];
  for (const row of data) {
    if (!row || typeof row.id !== 'string' || !valid.has(row.id) || seen.has(row.id)) continue;
    const qty = clampQty(row.qty);
    if (qty === 0) continue;
    seen.add(row.id);
    out.push({ id: row.id, qty });
  }
  return out;
}
