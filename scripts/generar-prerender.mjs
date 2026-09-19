#!/usr/bin/env node
// Prerender por pieza para OG social de WhatsApp/Facebook/Twitter.
//
// Crawlers como el de WhatsApp o Facebook NO ejecutan JavaScript al hacer
// scrape de meta OG, así que el deep-link cliente ?p=id no les sirve. Este
// script fetchea las piezas publicadas desde Supabase (anon key pública, la
// misma que usa la vitrina) y genera un HTML estático por pieza en
// p/<id>.html con OG completo + una imagen JPG de acompañamiento. Cuando un
// humano visita esa URL, un <meta refresh> + JS location.replace lo redirige
// al index con ?p=id (el modal se abre). Cuando un crawler la visita, ve el
// OG específico. Regenera sitemap.xml con la lista completa.
//
// Reads: SB_URL y SB_KEY inline en index.html (fuente única de verdad).
// Writes: p/<id>.html, p/img/<id>.jpg, sitemap.xml.

import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://verdeandino.app';

function extraerConfig() {
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  const url = html.match(/var\s+SB_URL\s*=\s*'([^']+)'/)?.[1];
  const key = html.match(/var\s+SB_KEY\s*=\s*'([^']+)'/)?.[1];
  if (!url || !key) throw new Error('No se pudieron leer SB_URL/SB_KEY de index.html');
  return { url, key };
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function slug(id) {
  return String(id).replace(/[^A-Za-z0-9\-_]/g, '-');
}
function fmtPrecio(n) {
  if (!n) return '';
  return '$' + Math.round(Number(n)).toLocaleString('es-CO');
}
function stonesText(piedras) {
  if (!Array.isArray(piedras) || piedras.length === 0) return '';
  return piedras.map(p => {
    if (!p) return '';
    const tipo = p.tipo || '';
    const cant = p.cantidad || p.qty || '';
    const q = p.quilates || p.ct || '';
    return [tipo, cant && `x${cant}`, q && `${q}ct`].filter(Boolean).join(' ');
  }).filter(Boolean).join(', ');
}

async function fetchProductos({ url, key }) {
  const cols = ['id', 'estado', 'categoria', 'estilo', 'metal', 'ley', 'color', 'genero', 'piedras', 'descripcion', 'medida', 'medida_u', 'certificado', 'precio', 'precio_oferta', 'foto_url', 'fotos', 'created_at'].join(',');
  const resp = await fetch(`${url}/rest/v1/productos?select=${cols}&estado=eq.publicado&order=created_at.desc`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });
  if (!resp.ok) throw new Error(`Fetch productos falló: ${resp.status} ${await resp.text()}`);
  return resp.json();
}

function fotoDataUrl(prod) {
  const arr = Array.isArray(prod.fotos) ? prod.fotos : [];
  const primero = arr[0] || prod.foto_url || '';
  return typeof primero === 'string' ? primero : '';
}

function fotoAExtension(dataUrl) {
  const m = dataUrl.match(/^data:image\/([a-z]+);base64,/i);
  if (!m) return null;
  const ext = m[1].toLowerCase();
  return ext === 'jpeg' ? 'jpg' : ext;
}

function guardarFotoLocal(dataUrl, destino) {
  const ext = fotoAExtension(dataUrl);
  if (!ext) return null;
  const base64 = dataUrl.split(',', 2)[1];
  if (!base64) return null;
  const bytes = Buffer.from(base64, 'base64');
  writeFileSync(destino, bytes);
  return ext;
}

function tituloProducto(prod) {
  const base = 'Verde Andino Jewelry — ' + prod.id;
  return prod.descripcion ? `${base} · ${String(prod.descripcion).slice(0, 70)}` : base;
}

function descripcionProducto(prod) {
  const precio = prod.precio_oferta || prod.precio;
  const desc = prod.descripcion || 'Pieza única con esmeraldas colombianas.';
  return precio ? `${desc} — ${fmtPrecio(precio)}` : desc;
}

function jsonLdProduct(prod, url, imagen) {
  const precio = prod.precio_oferta || prod.precio;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    sku: prod.id,
    name: tituloProducto(prod),
    description: descripcionProducto(prod),
    image: imagen,
    brand: { '@type': 'Brand', name: 'Verde Andino Jewelry' },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'COP',
      price: precio ? Math.round(precio) : undefined,
      availability: 'https://schema.org/InStock'
    }
  };
  // Escapar </ para que un valor con "</script>" no rompa el tag externo.
  return JSON.stringify(data).replace(/<\//g, '<\\/');
}

function detallesLista(prod) {
  const filas = [];
  if (prod.metal) filas.push(['Metal', prod.metal + (prod.ley ? ` ${prod.ley}` : '')]);
  if (prod.color) filas.push(['Color', prod.color]);
  const st = stonesText(prod.piedras);
  if (st) filas.push(['Piedras', st]);
  if (prod.medida) filas.push(['Medida', `${prod.medida}${prod.medida_u ? ' ' + prod.medida_u : ''}`]);
  if (prod.genero) filas.push(['Género', prod.genero]);
  if (prod.certificado === 'Sí') filas.push(['Certificado', 'Incluye certificado gemológico']);
  return filas;
}

function paginaHtml(prod, urlProducto, urlImagen) {
  const titulo = tituloProducto(prod);
  const desc = descripcionProducto(prod);
  const jsonLd = jsonLdProduct(prod, urlProducto, urlImagen);
  const precio = prod.precio_oferta || prod.precio;
  const filas = detallesLista(prod)
    .map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`)
    .join('');
  const redirect = `${SITE}/?p=${encodeURIComponent(prod.id)}`;
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${esc(titulo)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="${esc(urlProducto)}">
<meta property="og:type" content="product">
<meta property="og:site_name" content="Verde Andino Jewelry">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(urlProducto)}">
<meta property="og:image" content="${esc(urlImagen)}">
<meta property="og:locale" content="es_CO">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(titulo)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(urlImagen)}">
<meta http-equiv="refresh" content="0; url=${esc(redirect)}">
<script type="application/ld+json">${jsonLd}</script>
<style>
  body { font-family: 'Helvetica Neue', system-ui, sans-serif; max-width: 640px; margin: 2rem auto; padding: 0 1rem; color: #1A1714; background: #FAF8F5; }
  h1 { color: #1F6F4A; font-size: 1.3rem; margin: 0 0 0.5rem; }
  .desc { color: #5F5A54; margin-bottom: 1rem; }
  img { max-width: 100%; height: auto; border-radius: 4px; }
  table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
  th, td { text-align: left; padding: 0.4rem 0.6rem; border-bottom: 1px solid #E5E0D8; font-size: 0.9rem; }
  th { color: #5F5A54; font-weight: 500; width: 8rem; }
  .precio { color: #1F6F4A; font-size: 1.2rem; font-weight: bold; margin: 0.5rem 0 1rem; }
  a { color: #1F6F4A; }
  .redir { color: #948E86; font-size: 0.85rem; margin-top: 1.5rem; }
</style>
</head>
<body>
<noscript><p class="redir">Redirigiendo a la ficha completa…</p></noscript>
<h1>${esc(titulo)}</h1>
<div class="desc">${esc(desc)}</div>
${urlImagen ? `<img src="${esc(urlImagen)}" alt="${esc(prod.descripcion || prod.id)}">` : ''}
${filas ? `<table>${filas}</table>` : ''}
${precio ? `<div class="precio">${esc(fmtPrecio(precio))}</div>` : ''}
<p><a href="${esc(redirect)}">Ver la ficha completa en verdeandino.app →</a></p>
<p class="redir">Si no eres redirigido automáticamente, toca el enlace de arriba.</p>
<script>location.replace(${JSON.stringify(redirect)});</script>
</body>
</html>
`;
}

function limpiarDirectorio(dir, mantener) {
  if (!existsSync(dir)) return;
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    const st = statSync(ruta);
    if (st.isFile() && !mantener.has(nombre)) {
      unlinkSync(ruta);
    }
  }
}

async function main() {
  const cfg = extraerConfig();
  const productos = await fetchProductos(cfg);
  console.log(`Fetched ${productos.length} productos publicados`);

  const dirP = join(ROOT, 'p');
  const dirImg = join(dirP, 'img');
  mkdirSync(dirImg, { recursive: true });

  const htmlEsperados = new Set(['README.md']);
  const imgEsperadas = new Set();
  const urls = [];

  for (const prod of productos) {
    if (!prod.id) continue;
    const s = slug(prod.id);
    // Imagen
    let urlImagen = `${SITE}/assets-fuente/coscuez.avif`; // fallback
    const dataUrl = fotoDataUrl(prod);
    if (dataUrl) {
      const ext = fotoAExtension(dataUrl);
      if (ext) {
        const nombreImg = `${s}.${ext}`;
        guardarFotoLocal(dataUrl, join(dirImg, nombreImg));
        urlImagen = `${SITE}/p/img/${nombreImg}`;
        imgEsperadas.add(nombreImg);
      } else if (/^https?:\/\//.test(dataUrl)) {
        urlImagen = dataUrl;
      }
    }
    const urlProducto = `${SITE}/p/${s}.html`;
    const nombreHtml = `${s}.html`;
    writeFileSync(join(dirP, nombreHtml), paginaHtml(prod, urlProducto, urlImagen));
    htmlEsperados.add(nombreHtml);
    urls.push(urlProducto);
  }

  // Limpiar HTMLs e imágenes de piezas que ya no están publicadas
  limpiarDirectorio(dirP, htmlEsperados);
  limpiarDirectorio(dirImg, imgEsperadas);

  // README en p/ para explicar la carpeta
  writeFileSync(join(dirP, 'README.md'),
    '# Prerender por pieza\n\n' +
    'Archivos generados automáticamente por `scripts/generar-prerender.mjs`.\n' +
    'Cada `<id>.html` es una página estática con OG completo para que\n' +
    'WhatsApp/Facebook/Twitter muestren preview correcto al compartir.\n' +
    'Un humano al abrirla es redirigido a `/?p=<id>` (deep-link cliente).\n\n' +
    '**No editar a mano** — se sobrescribe en cada corrida del workflow.\n'
  );

  // Sitemap
  const hoy = new Date().toISOString().slice(0, 10);
  const urlsXml = [`${SITE}/`, ...urls]
    .map(u => `  <url><loc>${u}</loc><lastmod>${hoy}</lastmod><changefreq>weekly</changefreq></url>`)
    .join('\n');
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>
`;
  writeFileSync(join(ROOT, 'sitemap.xml'), sitemap);

  console.log(`Generados ${productos.length} HTMLs, ${imgEsperadas.size} imágenes, sitemap con ${urls.length + 1} URLs`);
}

// Exportar para tests locales
export { paginaHtml, jsonLdProduct, detallesLista, tituloProducto, descripcionProducto, esc, slug, fmtPrecio, stonesText, fotoAExtension };

// Ejecutar solo cuando se invoca directo (no cuando se importa desde un test)
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
