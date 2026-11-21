import { PRODUCTS, CATEGORIES } from './products.js';
import {
  addItem, setQty, removeItem, count, subtotal, shipping, remainingForFreeShipping,
  formatPrice, filterProducts, parseStored, MAX_QTY,
} from './cart.js';

const KEY = 'casa-koi-cart-v1';
const $ = (id) => document.getElementById(id);
const byId = new Map(PRODUCTS.map((p) => [p.id, p]));

let items = [];
let category = 'all';
let lastOpener = null;

const store = {
  read() { try { return localStorage.getItem(KEY); } catch { return null; } },
  write(v) { try { localStorage.setItem(KEY, v); } catch { /* modo privado o sin espacio: el carrito sigue en memoria */ } },
};

function el(tag, props = {}, ...kids) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else node.setAttribute(k, v);
  }
  kids.forEach((c) => node.append(c));
  return node;
}

function renderFilters() {
  const box = $('filters');
  box.replaceChildren(...CATEGORIES.map((c) => {
    const b = el('button', { class: 'chip', type: 'button', 'aria-pressed': String(c.id === category), 'data-cat': c.id, text: c.label });
    return b;
  }));
}

// Si una foto no carga (sin conexión, enlace caído), se usa la ilustración propia.
function withFallback(img, fallback) {
  if (fallback) img.addEventListener('error', () => { img.src = fallback; }, { once: true });
  return img;
}

function renderGrid() {
  const list = filterProducts(PRODUCTS, category);
  $('grid').replaceChildren(...list.map((p) => {
    const add = el('button', { class: 'btn btn-quiet', type: 'button', 'data-add': p.id, 'aria-label': `Agregar ${p.name} al carrito`, text: 'Agregar' });
    const img = withFallback(el('img', { src: p.img, alt: p.alt, width: '600', height: '600', loading: 'lazy' }), p.imgFallback);
    return el('li', { class: 'card' },
      el('div', { class: 'card-img' }, img),
      el('span', { class: 'card-kana', 'aria-hidden': 'true', text: p.kana }),
      el('h3', { text: p.name }),
      el('span', { class: 'unit', text: p.unit }),
      el('p', { class: 'desc', text: p.desc }),
      el('div', { class: 'card-foot' }, el('span', { class: 'price', text: formatPrice(p.price) }), add),
    );
  }));
  $('results-live').textContent = `${list.length} productos`;
}

function renderCart() {
  const n = count(items);
  const badge = $('cart-count');
  badge.textContent = String(n);
  badge.setAttribute('aria-label', n === 1 ? '1 producto' : `${n} productos`);

  const sub = subtotal(items, PRODUCTS);
  const ship = shipping(sub);
  $('cart').querySelector('.cart-panel').dataset.empty = String(items.length === 0);

  const left = remainingForFreeShipping(sub);
  $('free-ship').textContent = left === 0
    ? 'Tu envío es gratis.'
    : `Te faltan ${formatPrice(left)} para el envío gratis.`;

  $('cart-list').replaceChildren(...items.map((i) => {
    const p = byId.get(i.id);
    const minus = el('button', { type: 'button', 'data-dec': i.id, 'aria-label': `Quitar una unidad de ${p.name}`, text: '−' });
    if (i.qty <= 1) minus.setAttribute('aria-label', `Quitar ${p.name} del carrito`);
    const plus = el('button', { type: 'button', 'data-inc': i.id, 'aria-label': `Agregar una unidad de ${p.name}`, text: '+' });
    if (i.qty >= MAX_QTY) plus.disabled = true;
    return el('li', { class: 'line' },
      withFallback(el('img', { src: p.img, alt: '', width: '72', height: '72' }), p.imgFallback),
      el('div', {},
        el('div', { class: 'line-name', text: p.name }),
        el('div', { class: 'line-price', text: `${formatPrice(p.price)} · ${p.unit}` }),
        el('div', { class: 'line-ctrl' },
          el('div', { class: 'qty' }, minus, el('output', { 'aria-label': `Cantidad de ${p.name}`, text: String(i.qty) }), plus),
          el('button', { class: 'link-btn', type: 'button', 'data-del': i.id, 'aria-label': `Eliminar ${p.name}`, text: 'Eliminar' }),
        ),
      ),
    );
  }));

  $('t-sub').textContent = formatPrice(sub);
  $('t-ship').textContent = ship === 0 ? 'Gratis' : formatPrice(ship);
  $('t-total').textContent = formatPrice(sub + ship);
}

function commit(next) {
  items = next;
  store.write(JSON.stringify(items));
  renderCart();
}

const dialog = $('cart');
function openCart(opener) {
  lastOpener = opener ?? $('open-cart');
  $('demo-msg').textContent = '';
  if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
  $('close-cart').focus();
}
function closeCart() {
  if (dialog.open) dialog.close();
  lastOpener?.focus();
}

$('open-cart').addEventListener('click', (e) => openCart(e.currentTarget));
$('close-cart').addEventListener('click', closeCart);
dialog.addEventListener('click', (e) => { if (e.target === dialog) closeCart(); });
dialog.addEventListener('cancel', (e) => { e.preventDefault(); closeCart(); });

$('filters').addEventListener('click', (e) => {
  const b = e.target.closest('[data-cat]');
  if (!b) return;
  category = b.dataset.cat;
  renderFilters();
  renderGrid();
  observeReveal();
  $('filters').querySelector(`[data-cat="${category}"]`)?.focus();
});

$('grid').addEventListener('click', (e) => {
  const b = e.target.closest('[data-add]');
  if (!b) return;
  commit(addItem(items, b.dataset.add));
  const prev = b.textContent;
  b.textContent = 'Agregado';
  setTimeout(() => { b.textContent = prev; }, 1200);
});

$('cart-list').addEventListener('click', (e) => {
  const t = e.target.closest('button');
  if (!t) return;
  const cur = (id) => items.find((i) => i.id === id)?.qty ?? 0;
  if (t.dataset.inc) commit(setQty(items, t.dataset.inc, cur(t.dataset.inc) + 1));
  else if (t.dataset.dec) commit(setQty(items, t.dataset.dec, cur(t.dataset.dec) - 1));
  else if (t.dataset.del) commit(removeItem(items, t.dataset.del));
  else return;
  // El botón pulsado puede haberse eliminado al re-renderizar: devolver el foco a un lugar válido.
  const same = t.dataset.inc || t.dataset.dec;
  const again = same && $('cart-list').querySelector(`[data-${t.dataset.inc ? 'inc' : 'dec'}="${same}"]:not(:disabled)`);
  (again || $('cart-list').querySelector('button') || $('close-cart')).focus();
});

$('checkout').addEventListener('click', () => {
  $('demo-msg').textContent = 'Esto es una demostración: no se procesa ningún pago.';
});

// Si otra pestaña cambia el carrito, sincronizar.
window.addEventListener('storage', (e) => {
  if (e.key === KEY) { items = parseStored(e.newValue, PRODUCTS); renderCart(); }
});

let observer;
function observeReveal() {
  const targets = document.querySelectorAll('.card, .ritual li, .studio > div');
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  observer?.disconnect();
  observer = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); observer.unobserve(en.target); } });
  }, { threshold: 0.12 });
  targets.forEach((t) => { t.classList.add('reveal'); observer.observe(t); });
}

items = parseStored(store.read(), PRODUCTS);
renderFilters();
renderGrid();
renderCart();
observeReveal();

// La foto del héroe puede fallar antes de que este script corra: se revisa también si ya terminó mal.
const heroImg = document.querySelector('.hero-img');
if (heroImg) {
  const useFallback = () => { heroImg.src = 'img/hero.svg'; };
  heroImg.addEventListener('error', useFallback, { once: true });
  if (heroImg.complete && heroImg.naturalWidth === 0) useFallback();
}
