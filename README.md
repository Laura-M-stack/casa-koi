# Casa Koi

Demo de una tienda de té japonés y cerámica en estilo Japandi. Es un proyecto ficticio de portfolio: no procesa pagos.

**Demo:** https://laura-m-stack.github.io/casa-koi/

## Qué muestra

- Estilo Japandi: espacio negativo, paleta arroz, piedra, madera e índigo, tipografía Shippori Mincho y Zen Kaku Gothic New, movimientos lentos.
- Tienda con filtro por categoría y carrito en un panel lateral (`<dialog>`), con cantidades, envío gratis desde cierto monto y persistencia en `localStorage`.
- Fotos reales de producto (Unsplash) con una ilustración SVG propia de respaldo por si una imagen no carga.
- Accesibilidad: foco visible, foco devuelto al cerrar el carrito, botones con nombre accesible, `prefers-reduced-motion`, áreas táctiles de 44 px.

## Tecnología

HTML, CSS y JavaScript sin dependencias ni build. La lógica del carrito está separada del DOM en `site/js/cart.js` y se prueba con el runner nativo de Node.

## Uso

```powershell
npm test      # pruebas de la lógica del carrito
npm start     # servidor local en http://localhost:4173
```

Requiere Node 20 o superior. El sitio publicado es el contenido de `site/`.

## Estructura

```
site/            sitio estático (index.html, css, js, img)
tests/           pruebas con node:test
scripts/serve.mjs  servidor local mínimo
```

## Créditos

Fotos: [Unsplash](https://unsplash.com). Precios y stock son datos de ejemplo.
