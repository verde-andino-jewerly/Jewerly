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
  // Contadores de diagnóstico (leidos por mockDiagnosis o inspeccion manual)
  page.__mockHits = { productos: 0, rpc: 0, functions: 0, supabaseRequests: [] };

  // Sniffer: registra CADA request que sale hacia supabase.co (haya o no
  // matcheado un handler). Si esta lista queda vacia, el fetch ni siquiera
  // se disparo desde la vitrina (rate-limit, error previo, script no ejecutado).
  page.on('request', (req) => {
    try {
      const u = new URL(req.url());
      if (u.hostname.endsWith('supabase.co')) {
        page.__mockHits.supabaseRequests.push(req.method() + ' ' + u.pathname + u.search);
      }
    } catch (_) {}
  });

  // Matchers con RegExp (mas estable que globs y funciones en Playwright).
  await page.route(/supabase\.co\/rest\/v1\/productos/, (route) => {
    page.__mockHits.productos++;
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify(productos),
    });
  });
  await page.route(/supabase\.co\/rest\/v1\/rpc\//, (route) => {
    page.__mockHits.rpc++;
    route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
  });
  await page.route(/supabase\.co\/functions\/v1\//, (route) => {
    page.__mockHits.functions++;
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  // Bloquea el beacon de Cloudflare (no queremos ruido en la red)
  await page.route(/cloudflareinsights\.com/, (route) => route.abort());
}

/**
 * Devuelve un resumen textual del estado del mock. Sirve para el
 * mensaje de error cuando waitForCatalog agota tiempo, para saber si
 * el problema es que la vitrina no hace el fetch o que el matcher no
 * captura.
 */
function mockDiagnosis(page) {
  const h = page.__mockHits || {};
  const reqs = h.supabaseRequests || [];
  return (
    'mock hits: productos=' + (h.productos || 0) +
    ' rpc=' + (h.rpc || 0) +
    ' functions=' + (h.functions || 0) +
    ' | requests observados: ' + (reqs.length ? reqs.join(' ; ') : '(ninguno)')
  );
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
 * Da un mensaje de diagnóstico claro si el mock nunca se disparó.
 */
async function waitForCatalog(page, timeout = 15_000) {
  try {
    await page.waitForLoadState('load', { timeout: 5_000 }).catch(() => {});
    await page.waitForFunction(
      () => Array.isArray(window._sbCache) && window._sbCache.length > 0,
      null,
      { timeout, polling: 100 }
    );
  } catch (err) {
    throw new Error('waitForCatalog agotó ' + timeout + 'ms. ' + mockDiagnosis(page));
  }
}

module.exports = {
  PRODUCTOS, PIX, mockSupabase, mockDiagnosis,
  forceLocaleES, waitForCatalog,
  LOCALE_KEY, CART_KEY, WISHLIST_KEY,
};
