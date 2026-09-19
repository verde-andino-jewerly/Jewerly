# Historial y decisiones

Registro de lo construido y por qué. Memoria del proyecto.

---

## Componentes

### 1. Sitio principal — `index.html`

Vitrina pública + panel de gestión privado, en un solo archivo por dos razones:
- Compatibilidad con entornos restringidos (artefactos) y hosting estático mínimo.
- Compartir código y estilos entre ambos entornos sin build step.

Funcionalidades:
- Colección con búsqueda, filtros por categoría, fichas de producto con foto y WhatsApp.
- Sección educativa sobre las minas colombianas (Muzo, Chivor, Coscuez).
- Panel privado con carga/edición/duplicado, estados de publicación, exportación CSV y PDF.

### 2. Herramientas internas (`herramientas/`)

- **Calculadora de aleaciones** — cálculo de aleaciones de metales.
- **Control financiero** — registro de todos los gastos (chequera de la operación).
- **Roadmap de lanzamiento** — hoja de ruta.

Son HTMLs autocontenidos con su propio `localStorage`; no comparten datos con la vitrina.

---

## Decisiones técnicas clave

1. **Un solo archivo HTML.** Autosuficiencia, sin build, funciona offline. Costo: ~1.3 MB.

2. **Migración de `localStorage` a Supabase (v2).** Necesaria para que todos los visitantes vean el mismo catálogo en tiempo real y para que el catálogo persista entre dispositivos.

3. **Vitrina y panel en el mismo origen.** Aunque los datos ahora viven en Supabase, mantenerlos en el mismo archivo simplifica la sincronización y comparte funciones auxiliares.

4. **Seguridad por capas.**
   - RLS en Supabase (lectura pública filtrada, escrituras con `x-admin-token`).
   - CSP en el `<head>` restringiendo dominios permitidos.
   - Rate limiting cliente (100 req/min).
   - Auditoría automática de todos los cambios (`productos_audit`).
   - PIN local (SHA-256 en `localStorage`) para acceso al panel privado.

5. **Cálculo de precios server-side.** Edge Function `calculate-price` para no exponer la fórmula de márgenes en el cliente (aunque el frontend tiene un fallback local por si la función falla).

6. **PDF de catálogo.** Reemplaza el "descargar fotos individuales" por un PDF visual único con logo, foto, ID, descripción y precio.

7. **Retrocompatibilidad de piedras** (`qty`/`ct` vs `cantidad`/`quilates`). La vitrina acepta ambos formatos.

---

## Problemas resueltos (bitácora)

- **Catálogo aislado por dispositivo** → migración a Supabase (todos ven lo mismo en tiempo real).
- **RLS bloqueaba escrituras del panel** → añadido header `x-admin-token` en `sbUpsert()` y `sbDeleteItem()`.
- **Anon key rota accidentalmente** (cambiada por publishable key en un commit) → restaurada la anon JWT correcta.
- **Edge Function con errores CORS** → añadidos headers CORS + Authorization + fallback local.
- **Los productos cargados no aparecían en la vitrina** (v1 con localStorage) → causa: aislamiento entre archivos → solución (v1): fusionar en un solo archivo → solución (v2): backend Supabase compartido.
- **Piedras sin cantidad/quilates en la vitrina** → desajuste de nombres de campo → aceptar ambos formatos.
- **No se podía eliminar desde el celular** → `confirm()` bloqueado en el iframe de artefactos → modal propio.
- **La foto solo abría la cámara** → atributo `capture` → quitarlo.
- **Mojibake al inyectar el logo con PowerShell** → leer/escribir con UTF-8 sin BOM explícito.
- **PDF export no funcionaba** → jsPDF UMD expone `window.jspdf` (minúsculas), no `window.jsPDF`.
- **Modelo PIN por-dispositivo no servía** para operación con múltiples cargadores → rediseño a **clave compartida** (una sola clave para toda la operación, validada server-side, sin hash local, sin crear PIN por dispositivo).
- **El sitio se veía con zoom en celular** → faltaba `<meta name="viewport">`; sin él, el móvil renderizaba al ancho de escritorio y no aplicaban los media queries.
- **Se podían guardar productos con precio 0** → validación pre-envío: costo debe ser > 0, precio calculado debe ser > 0.
- **Número de certificado (`certNum`) filtrado en modal público** → oculto en la vista, y removido del fetch público (`sbFetchPublic` excluye columnas administrativas).

---

## Datos de referencia de la marca

- Esmeraldas de Muzo, Chivor y Coscuez (Boyacá / Cundinamarca, Colombia).
- WhatsApp: +57 318 093 5276
- Instagram: @verde.andino.jewelry
- TikTok: @Verde.Andino.Jewerly

---

## Cambios recientes (v2)

### Múltiples imágenes por producto (carousel)
- Nueva columna `fotos` (JSONB) para almacenar array de hasta 5 imágenes base64.
- Admin: drag-drop de hasta 4 fotos adicionales + foto principal = 5 máx.
- Vitrina: carousel con flechas (← →) y puntos indicadores cuando hay 2+ fotos.
- Compresión async (800px JPEG Q=0.82) en el navegador antes de subir.
- Retrocompatibilidad: si `fotos` está vacío, sistema usa `foto_url` como fallback.

### Precios promocionales (oferta)
- Nueva columna `precio_oferta` (NUMERIC, nullable) para descuentos.
- Admin: campo opcional en formulario; validación crítica `precio_oferta >= costo` para evitar pérdidas.
- Vitrina: si hay oferta, muestra precio original tachado + precio de oferta + badge "descuento %".
- Cálculo: `(precio - precioOferta) / precio × 100`

---

## Cambios recientes (v3) — Fase 1 ecommerce

Sprint del 18–19/09/2026. Todo en un solo PR draft
(`claude/beautiful-johnson-km54cu` → 8 commits, aditivo, sin backend).

### SEO base
- Estructura HTML5 completa (antes faltaban `<!DOCTYPE>`, `<html lang>`,
  `<head>`, `<body>`, `<meta charset>`).
- Meta description, keywords, robots, theme-color, canonical, Open Graph
  y Twitter Card.
- JSON-LD `Organization` + `WebSite` + `Store` estático en el `<head>`.
- `robots.txt` (allow raíz, disallow `panel-deploy.html` y `docs-privado/`).
- `sitemap.xml` con la raíz.

### URL canónica por producto (`?p=id`)
- `openModal` hace `pushState` a `/?p=<id>` y reescribe `<title>`, meta
  OG/Twitter, canonical al abrir una ficha.
- Inyecta JSON-LD `Product` dinámico (COP, InStock) para Googlebot.
- `cerrarCheckout` y `closeModal` restauran el `<head>` original y limpian
  la URL sin pisar `?pedido=`.
- Listener `popstate` para atrás/adelante del navegador.
- Al cargar, `abrirProductoDesdeUrl` lee `?p=` cuando terminan de cargar
  los productos.
- **Limitación**: crawlers de WhatsApp/Facebook no ejecutan JS, así que un
  enlace compartido `?p=id` sigue mostrando el OG estático de la home. El
  prerender por producto (HTML por pieza) queda para otro PR.

### Analytics — Cloudflare Web Analytics
- Beacon con `spa:true`: pageviews automáticos incluyen los deep-link
  `?p=id`. Outbound clicks capturan wa.me.
- CSP ampliado con `static.cloudflareinsights.com` y `cloudflareinsights.com`.
- Placeholder `TOKEN_CFWA` en el `<head>` — reemplazar por el token real
  antes del merge.
- Helper `trackEvent(nombre, props)`: dispatcher a `__cfBeacon.sendEvent`
  (CFWA Pro), Plausible o Umami; hoy es no-op silencioso con `console.debug`.
  Nunca falla el flujo.
- Hooks en: `ver_producto`, `whatsapp_click` (general/ficha),
  `carrito_agregar`, `checkout_iniciado`, `checkout_confirmado`,
  `pago_iniciado_bold`, `pago_confirmado`, `pago_cancelado`,
  `pago_confirmado_wa_click`, `pago_confirmado_cross_sell_click`,
  `pago_cancelado_wa_click`, `encargo_abierto`, `encargo_enviado`.

### Encargos personalizados (cierra vacío v2)
- Modal `#encargo-modal` con formulario estructurado: tipo, descripción,
  metales (chips multi-select), piedra (con/sin esmeralda), presupuesto,
  plazo, nombre, WhatsApp.
- Al enviar, arma un mensaje formateado y abre wa.me. Antes el CTA solo
  abría WhatsApp con "Hola, quiero consultar por una pieza a la medida".
- `waCustom()` queda como wrapper legacy que delega al modal.

### Cantidades en el carrito (cierra vacío v2)
- Formato v2 en `localStorage`: `[{id, cantidad}, ...]`. `carritoLeer`
  migra al vuelo el formato v1 (`[id, id, ...]`), deduplica por id y
  descarta entradas malformadas (null, sin id, cantidad ≤ 0 o NaN).
- Controles `[-] N [+]` por línea en el modal del carrito con subtotal.
- Badge del header muestra total de unidades, no número de referencias.
- CTA del modal producto: "Sumar otra (N en carrito)" cuando la pieza ya
  está.
- `confirmarCheckout` expande a lista plana `[{producto_id}, ...]` (una
  entrada por unidad) para compat con RPC `crear_pedido_web` actual sin
  ver su firma. Cuando el RPC soporte `{producto_id, cantidad}` nativo,
  se reemplaza esa línea.

### Retorno de pago mejorado (`?pedido=REF`)
- Estado `pagado`: icono verde, referencia visible en chip monoespaciado
  seleccionable, botón WhatsApp con mensaje precargado incluyendo la
  referencia, cross-sell con 3 piezas aleatorias del catálogo (reutilizan
  `openModal` + deep-link).
- Estado `cancelada`: icono rojo, referencia visible, botón WhatsApp para
  ayuda, botón "Volver al catálogo".
- Estado `pendiente`: spinner CSS animado (antes era "..."), copy sobre
  el webhook Bold. Tras 15 intentos o error de red, CTA WhatsApp con
  referencia.
- `catch` de red reintenta 15 veces cada 3s (antes se quedaba muerto).
- `cerrarCheckout` limpia `?pedido=` de la URL para no reabrir el flujo
  en un refresh.

### Filtros avanzados en el catálogo
- Panel colapsable con 4 secciones: rango de precio (min/max), metal
  (chips multi-select), piedras (con/sin esmeralda), solo en oferta.
- `applyFilters` extendido preservando búsqueda + categoría + orden. Match
  de metal case-insensitive por substring (funciona con "Oro amarillo 18k").
- Precio usa el efectivo (`precioOferta || precio`).
- Badge cuenta dimensiones activas en el botón "Filtros".
- Botón "Limpiar filtros", responsive a 1 columna en móvil.

### UX / A11y
- 5 modales con `role="dialog"` + `aria-modal="true"` + `aria-label`.
- Escape global cierra el modal top-most (jerarquía checkout > encargo >
  carrito > producto > legal).
- `MutationObserver` mueve el foco al botón cerrar al abrir cualquier
  modal, sin refactor invasivo de cada `abrir*`.
- Skip link "Saltar al catálogo" invisible que aparece al Tab (WCAG A).
- Botón scroll-to-top flotante bottom-left, aparece pasados 400px.
- `:focus-visible` con outline verde marca.
- `loading="lazy"` en carrito y cross-sell (el grid ya lo tenía).

---

## Pendientes / ideas a futuro

Los marcados con **[documentado]** eran vacíos confirmados en operación real
(novena vuelta, 18/09/2026). Los que ya están cerrados llevan **[hecho v3]**
o **[hecho v4]** (Sprint 2 backend, 19/09/2026).

### Vacíos documentados

- **[documentado] Seguimiento de envío visible para el comprador.** La página
  `?pedido=REF` ya muestra estado, referencia y CTA WhatsApp (v3), pero
  sigue sin mostrar guía ni transportadora. El administrador las envía
  manualmente por WhatsApp. No hay integración automática entre el panel
  y la página de seguimiento del comprador.

- **[hecho v3] Encargos personalizados desde la vitrina.** Cerrado con el
  modal `#encargo-modal` — el mensaje sale a WhatsApp estructurado.

- **[documentado] Historial por cliente.** En la pestaña Ventas del panel
  no hay filtro por nombre o teléfono. Para ver el historial de un cliente
  específico hay que buscar en la lista o exportar el CSV. El panel vive
  fuera de este repo (Vercel).

- **[hecho v3] Múltiples unidades en el carrito.** Cerrado con el formato
  v2 del carrito y la expansión del payload en `confirmarCheckout`.

### Ideas de evolución

- **Prerender por producto** para OG estático de WhatsApp/Facebook —
  GitHub Action que lea Supabase y genere un HTML por pieza.
- **[hecho v4] Stock / reserva en Supabase.** Cerrado con la migración
  `stock_column_and_web_rpcs` (Sprint 2, 19/09/2026): columna
  `productos.stock integer NOT NULL DEFAULT 1`. `crear_pedido_web` bloquea
  al segundo comprador concurrente cuando `(pendientes + confirmadas) >=
  stock`. `confirmar_pago_web` oculta la pieza cuando confirmadas llegan
  a stock. `cancelar_pago_web` libera slots sin cambio (la venta
  cancelada no cuenta). Backfill inicial desde `gastos` (Joyas para
  reventa); piezas únicas en 1.
- **Facturación electrónica DIAN** — integración con Alegra o Factus
  desde `confirmar_pago_web`.
- **Envíos automatizados** — API Servientrega/Coordinadora/Interrapidísimo,
  guía visible en `?pedido=REF`.
- **Emails transaccionales** — Resend o Supabase Auth SMTP para
  confirmación, pago y envío.
- **Multi-idioma ES/EN** para exportación LATAM/anglosajón.
- **Multi-moneda + FX** (COP/USD/MXN) y Stripe/MercadoPago/PayPal.
- **Wishlist / favoritos** en `localStorage`.
- **Certificado de origen PDF** descargable con jsPDF + verificación pública
  por `cert_num`.
- **Auth real con Supabase Auth** — reemplazar `x-admin-token` por JWT.
- **Storage bucket** para fotos grandes en vez de base64 embebido.
- **[hecho v5] Reembolsos (VOID de Bold).** Cerrado con la migración
  `reembolsar_pago_web_rpc` (Sprint 3, 19/09/2026). El webhook Bold
  ahora maneja `VOID_APPROVED` invocando la RPC nueva: las ventas
  pagadas/enviadas/entregadas pasan a `'reembolsado'` (valor añadido
  al check constraint), y si el producto estaba `'oculto'` por stock
  lleno vuelve a `'publicado'` automáticamente. La vista
  `productos_publicos` no cuenta reembolsadas. `VOID_REJECTED` solo
  loguea. Los reembolsos se disparan desde el dashboard de Bold; el
  panel admin no tiene UI propia todavía.
- **Video en productos** — soporte para videos de demostración.
- **Generador de publicaciones para redes** desde el panel privado.
