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
  await page.route('**/rest/v1/productos**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify(productos),
    });
  });
  // RPCs varios (crear_pedido_web, estado_pedido_web, etc.): responder vacio
  await page.route('**/rest/v1/rpc/**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: 'null',
    });
  });
  // Edge functions: idem
  await page.route('**/functions/v1/**', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  // Bloquea el beacon de Cloudflare (no queremos ruido en la red durante tests)
  await page.route('**/static.cloudflareinsights.com/**', (route) => route.abort());
  await page.route('**/cloudflareinsights.com/**', (route) => route.abort());
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

module.exports = {
  PRODUCTOS, PIX, mockSupabase,
  forceLocaleES, LOCALE_KEY, CART_KEY, WISHLIST_KEY,
};
