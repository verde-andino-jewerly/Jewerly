// 1x1 PNG transparente en base64 para no depender de red.
const PIX = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

const PRODUCTOS = [
  {
    id: 'VA-001',
    estado: 'publicado',
    categoria: 'anillo',
    estilo: 'clasico',
    metal: 'oro',
    ley: '18k',
    color: 'amarillo',
    genero: 'unisex',
    piedras: ['esmeralda'],
    descripcion: 'Anillo de oro amarillo con esmeralda de Muzo',
    medida: '15',
    medida_u: 'mm',
    certificado: 'Si',
    precio: 4500000,
    precio_oferta: null,
    foto_url: PIX,
    fotos: [PIX],
    created_at: '2026-09-01T00:00:00Z',
  },
  {
    id: 'VA-002',
    estado: 'publicado',
    categoria: 'arete',
    estilo: 'moderno',
    metal: 'plata',
    ley: '925',
    color: 'blanco',
    genero: 'mujer',
    piedras: ['esmeralda', 'diamante'],
    descripcion: 'Aretes de plata con esmeralda de Chivor',
    medida: '20',
    medida_u: 'mm',
    certificado: 'No',
    precio: 1200000,
    precio_oferta: 950000,
    foto_url: PIX,
    fotos: [PIX],
    created_at: '2026-08-15T00:00:00Z',
  },
  {
    id: 'VA-003',
    estado: 'publicado',
    categoria: 'collar',
    estilo: 'clasico',
    metal: 'oro',
    ley: '18k',
    color: 'blanco',
    genero: 'mujer',
    piedras: ['esmeralda'],
    descripcion: 'Collar de oro blanco con esmeralda de Coscuez',
    medida: '45',
    medida_u: 'cm',
    certificado: 'Si',
    precio: 7800000,
    precio_oferta: null,
    foto_url: PIX,
    fotos: [PIX],
    created_at: '2026-07-20T00:00:00Z',
  },
  {
    id: 'VA-004',
    estado: 'publicado',
    categoria: 'pulsera',
    estilo: 'moderno',
    metal: 'oro',
    ley: '14k',
    color: 'rosado',
    genero: 'mujer',
    piedras: ['esmeralda'],
    descripcion: 'Pulsera de oro rosado',
    medida: '18',
    medida_u: 'cm',
    certificado: 'No',
    precio: 3200000,
    precio_oferta: null,
    foto_url: PIX,
    fotos: [PIX],
    created_at: '2026-06-10T00:00:00Z',
  },
];

/**
 * Instala interceptores de red en la página para que la vitrina
 * "vea" un catálogo predecible sin salir a Supabase real.
 * Debe llamarse ANTES de page.goto('/').
 */
async function mockSupabase(page, productos = PRODUCTOS) {
  // Un solo router basado en URL parseada (más robusto que los globs
  // de Playwright, que a veces no matchean cross-origin como esperamos).
  await page.route((url) => url.hostname.endsWith('supabase.co'), (route) => {
    const u = new URL(route.request().url());
    if (u.pathname.startsWith('/rest/v1/rpc/')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
    }
    if (u.pathname.startsWith('/rest/v1/productos')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'access-control-allow-origin': '*' },
        body: JSON.stringify(productos),
      });
    }
    if (u.pathname.startsWith('/functions/v1/')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    }
    // Cualquier otra ruta de supabase.co: 200 vacío para no dejar pending
    return route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
  });
  // Bloquea el beacon de Cloudflare (no queremos ruido en la red durante tests)
  await page.route((url) => url.hostname.endsWith('cloudflareinsights.com'), (route) => route.abort());
}

const LOCALE_KEY   = 'va_locale_v1';
const CART_KEY     = 'va_cart_v1';
const WISHLIST_KEY = 'va_wishlist_v1';

/**
 * Fuerza el locale a español ANTES de que la vitrina auto-detecte el
 * navigator.language. Debe llamarse antes de page.goto().
 */
async function forceLocaleES(page) {
  await page.addInitScript((key) => {
    try { localStorage.setItem(key, 'es'); } catch (_) {}
  }, LOCALE_KEY);
}

/**
 * Espera a que el fetch mockeado de productos haya llenado _sbCache.
 * Da un mensaje claro si el mock nunca se disparó (timeout).
 */
async function waitForCatalog(page, timeout = 10_000) {
  await page.waitForFunction(
    () => Array.isArray(window._sbCache) && window._sbCache.length > 0,
    null,
    { timeout }
  );
}

module.exports = {
  PRODUCTOS, PIX, mockSupabase,
  forceLocaleES, waitForCatalog,
  LOCALE_KEY, CART_KEY, WISHLIST_KEY,
};
