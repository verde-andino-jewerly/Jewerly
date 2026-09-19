# Pruebas E2E — Playwright

Pruebas de humo de la vitrina (`index.html`) y del gate del panel
(`panel-deploy.html`).

## Requisitos

- Node ≥ 18
- Python 3 (para el `webServer` local del `playwright.config.js`)
- Al primer clon: `npm install && npx playwright install chromium`

## Correr todo

```bash
npm test                 # headless
npm run test:ui          # modo UI (recomendado para debug interactivo)
npm run test:headed      # con navegador visible
npm run test:report      # abre el último reporte HTML
```

## Solo la vitrina (rápido, sin credenciales)

```bash
npm run test:vitrina
```

Los tests de la vitrina **mockean Supabase** con `page.route`, así que
corren offline y con un catálogo predecible (`tests/fixtures/productos.js`).
No necesitan el proyecto real ni conexión a internet.

## Panel admin (requiere PIN)

```bash
ADMIN_PIN='tu-clave-real' npm run test:panel
```

- Sin `ADMIN_PIN`, los tests del panel se **omiten** (skip).
- Si no tienes acceso al Supabase real y solo quieres validar el gate,
  agrega `MOCK_SUPABASE=1`:

  ```bash
  ADMIN_PIN='cualquier-cosa' MOCK_SUPABASE=1 npm run test:panel
  ```

  (Con `MOCK_SUPABASE=1` el probe de auth devuelve 200 fake, por lo que
  incluso un PIN incorrecto pasa el gate; úsalo solo para probar el
  render.)

## Estructura

```
tests/
  fixtures/productos.js   Mocks de Supabase (4 piezas)
  vitrina.spec.js         Home, catálogo, buscador, deep-link, filtros
  carrito.spec.js         Carrito v2, cantidades, migración v1→v2
  i18n-wishlist.spec.js   ES↔EN, wishlist toggle + filtro
  encargo.spec.js         Modal de encargo → wa.me
  panel.spec.js           Gate del panel-deploy.html (PIN requerido)
```

## Nota sobre CI

En CI conviene:

```bash
CI=1 npm test
```

`retries=2`, `workers=1` y `forbidOnly=true` se activan solos por el
`playwright.config.js`.
