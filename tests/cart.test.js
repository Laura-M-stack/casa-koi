import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addItem, setQty, removeItem, count, subtotal, shipping, remainingForFreeShipping,
  formatPrice, filterProducts, parseStored, MAX_QTY, SHIPPING_COST, FREE_SHIPPING_FROM,
} from '../site/js/cart.js';
import { PRODUCTS } from '../site/js/products.js';

const cat = [
  { id: 'a', category: 'te', price: 1000 },
  { id: 'b', category: 'ceramica', price: 2500 },
];

test('addItem agrega un producto nuevo', () => {
  assert.deepEqual(addItem([], 'a'), [{ id: 'a', qty: 1 }]);
});
test('addItem suma cantidad si ya existe', () => {
  assert.deepEqual(addItem([{ id: 'a', qty: 2 }], 'a', 3), [{ id: 'a', qty: 5 }]);
});
test('addItem respeta el máximo', () => {
  assert.equal(addItem([{ id: 'a', qty: 9 }], 'a', 5)[0].qty, MAX_QTY);
});
test('addItem ignora ids vacíos o inválidos y cantidades no positivas', () => {
  assert.deepEqual(addItem([], ''), []);
  assert.deepEqual(addItem([], undefined), []);
  assert.deepEqual(addItem([], 'a', 0), []);
  assert.deepEqual(addItem([], 'a', -3), []);
  assert.deepEqual(addItem([], 'a', 'x'), []);
});
test('addItem no muta el arreglo original', () => {
  const orig = [{ id: 'a', qty: 1 }];
  addItem(orig, 'a');
  assert.equal(orig[0].qty, 1);
});
test('setQty cambia la cantidad y limita al máximo', () => {
  assert.equal(setQty([{ id: 'a', qty: 1 }], 'a', 4)[0].qty, 4);
  assert.equal(setQty([{ id: 'a', qty: 1 }], 'a', 99)[0].qty, MAX_QTY);
});
test('setQty en 0 o negativo elimina el producto', () => {
  assert.deepEqual(setQty([{ id: 'a', qty: 2 }], 'a', 0), []);
  assert.deepEqual(setQty([{ id: 'a', qty: 2 }], 'a', -1), []);
});
test('setQty trunca decimales', () => {
  assert.equal(setQty([{ id: 'a', qty: 1 }], 'a', 2.9)[0].qty, 2);
});
test('removeItem elimina solo el indicado', () => {
  assert.deepEqual(removeItem([{ id: 'a', qty: 1 }, { id: 'b', qty: 1 }], 'a'), [{ id: 'b', qty: 1 }]);
});
test('count suma cantidades', () => {
  assert.equal(count([{ id: 'a', qty: 2 }, { id: 'b', qty: 3 }]), 5);
  assert.equal(count([]), 0);
});
test('subtotal usa el catálogo y tolera ids desconocidos', () => {
  assert.equal(subtotal([{ id: 'a', qty: 2 }, { id: 'b', qty: 1 }], cat), 4500);
  assert.equal(subtotal([{ id: 'zzz', qty: 3 }], cat), 0);
});
test('shipping: 0 si el carrito está vacío', () => {
  assert.equal(shipping(0), 0);
});
test('shipping: cobra bajo el umbral y es gratis desde el umbral', () => {
  assert.equal(shipping(1), SHIPPING_COST);
  assert.equal(shipping(FREE_SHIPPING_FROM - 1), SHIPPING_COST);
  assert.equal(shipping(FREE_SHIPPING_FROM), 0);
});
test('remainingForFreeShipping nunca es negativo', () => {
  assert.equal(remainingForFreeShipping(FREE_SHIPPING_FROM + 500), 0);
  assert.equal(remainingForFreeShipping(10000), FREE_SHIPPING_FROM - 10000);
  assert.equal(remainingForFreeShipping(0), FREE_SHIPPING_FROM);
});
test('formatPrice agrega separador de miles', () => {
  assert.equal(formatPrice(9800), '$ 9.800');
  assert.equal(formatPrice(1234567), '$ 1.234.567');
  assert.equal(formatPrice(0), '$ 0');
  assert.equal(formatPrice(999), '$ 999');
});
test('filterProducts filtra por categoría', () => {
  assert.equal(filterProducts(cat, 'te').length, 1);
  assert.equal(filterProducts(cat, 'all').length, 2);
  assert.equal(filterProducts(cat, undefined).length, 2);
  assert.equal(filterProducts(cat, 'nada').length, 0);
});
test('parseStored acepta datos válidos', () => {
  assert.deepEqual(parseStored('[{"id":"a","qty":2}]', cat), [{ id: 'a', qty: 2 }]);
});
test('parseStored devuelve vacío con JSON roto o forma incorrecta', () => {
  assert.deepEqual(parseStored('{no', cat), []);
  assert.deepEqual(parseStored('{"id":"a"}', cat), []);
  assert.deepEqual(parseStored(null, cat), []);
  assert.deepEqual(parseStored('null', cat), []);
});
test('parseStored descarta ids inexistentes, duplicados y cantidades inválidas', () => {
  const raw = JSON.stringify([
    { id: 'a', qty: 2 }, { id: 'a', qty: 5 }, { id: 'zzz', qty: 1 },
    { id: 'b', qty: 0 }, { id: 'b', qty: 'x' }, null, { qty: 3 },
  ]);
  assert.deepEqual(parseStored(raw, cat), [{ id: 'a', qty: 2 }]);
});
test('parseStored limita cantidades enormes', () => {
  assert.equal(parseStored('[{"id":"a","qty":9999}]', cat)[0].qty, MAX_QTY);
});
test('el catálogo real tiene ids únicos, precios positivos e imágenes con alt', () => {
  const ids = PRODUCTS.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const p of PRODUCTS) {
    assert.ok(p.price > 0 && Number.isInteger(p.price), p.id);
    assert.ok(p.alt && p.img && p.desc, p.id);
    assert.ok(['te', 'ceramica'].includes(p.category), p.id);
  }
});
