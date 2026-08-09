# Arquitectura técnica

Cómo está construido el sitio de Verde Andino Jewelry.

---

## 1. Principio: frontend autosuficiente + backend en la nube

- **Frontend** (`index.html`, ~1.3 MB): un único archivo HTML con **HTML + CSS + JS + imágenes** (logo, fotos de las minas) todo embebido en base64. Cero dependencias externas para renderizar la vitrina.
- **Backend** ([Supabase](https://supabase.com)): tabla `productos` + Edge Function `calculate-price` + Storage bucket `product-photos`.
- **Hosting**: GitHub Pages con auto-deploy en `git push`.

**Por qué un solo archivo HTML:** portabilidad extrema (funciona hasta con doble clic en local), compatible con entornos restringidos, sin build step.

**Contrapartida:** el archivo es grande (~1.3 MB) por las imágenes embebidas. Precio aceptable.

---

## 2. Estructura interna de `index.html`

Dos entornos que comparten los mismos datos y funciones auxiliares:

### a) Vitrina pública

Lo que ve el cliente:

- **Hero** con logo (detecta el color de fondo del logo para integrarlo sin recuadro).
- **Valores** de la marca.
- **Colección**: grilla con búsqueda, filtros por categoría, ordenamiento. Cada tarjeta abre una **ficha (modal)** con detalle + botón WhatsApp.
- **Cómo comprar** y **A la medida**.
- **La esmeralda colombiana**: sección educativa con pestañas Muzo / Chivor / Coscuez.
- **FAQ**, contacto, botón flotante de WhatsApp.

### b) Panel de gestión (privado)

Panel interno de la dueña para carga y administración de productos. **No documentado públicamente por razones de seguridad** (ver sección 6). El código convive en el mismo `index.html` pero el acceso está protegido.

---

## 3. Persistencia de datos: Supabase

- **Proyecto:** `rbvqxrkzepthbbqzkbcg` (región us-east-1).
- **API:** `https://rbvqxrkzepthbbqzkbcg.supabase.co`
- **Tabla:** `productos` — todos los campos del producto, incluyendo `foto_url` (base64 embebido en la fila).
- **Bucket:** `product-photos` (público, 2 MB por archivo) — opcional para fotos que no queremos embeber.

El schema completo, mapeo camelCase↔snake_case y filtros aplicados están en [`MODELO-DE-DATOS.md`](MODELO-DE-DATOS.md).

### Lectura pública (vitrina)

La vitrina hace `GET` a `productos` con la anon key de Supabase (pública por diseño). RLS filtra automáticamente a solo productos con `estado='publicado' AND precio>0 AND descripcion IS NOT NULL`.

### Escritura (panel privado)

Todas las mutaciones (INSERT / UPDATE / DELETE) requieren header `x-admin-token`. RLS rechaza cualquier escritura sin él (ver [`migrations/rls-policies.sql`](../migrations/rls-policies.sql)).

### Cálculo de precios (server-side)

La Edge Function `calculate-price` recibe `{costo, margen}` y devuelve `{precio}` (`precio = costo × (1 + margen/100)`, redondeado). Motivo: evitar que la fórmula de márgenes esté solo en el cliente.

Ver [`../supabase/functions/README.md`](../supabase/functions/README.md).

---

## 4. Manejo de imágenes de producto

- Al cargar una foto, se **comprime en el navegador** (canvas) a máx 800 px por el lado mayor, JPEG calidad 0.82.
- Se guarda como *data URI* base64 en la columna `foto_url` de Supabase.
- El input usa `accept="image/*"` **sin** `capture` para que el celular ofrezca **cámara o galería**.

---

## 5. Temas (claro/oscuro)

Respeta `prefers-color-scheme` y permite toggle manual. Colores en variables CSS (`--gold`, `--esm`, etc.) con tres capas: `:root`, `@media (prefers-color-scheme: dark)`, `:root[data-theme="dark"|"light"]`.

---

## 6. Seguridad — enfoque de capas

1. **RLS en Supabase**: la anon key es pública, pero solo puede leer productos publicados. Escrituras requieren `x-admin-token`.
2. **Content-Security-Policy** en el `<head>`: restringe `connect-src` y `script-src` al dominio de Supabase + jsPDF CDN.
3. **Rate limiting cliente**: 100 req/min por endpoint.
4. **Auditoría**: trigger PostgreSQL que registra todos los cambios en la tabla `productos_audit` (ver [`../migrations/audit-table.sql`](../migrations/audit-table.sql)).
5. **PIN local** para el panel privado (SHA-256 en `localStorage`).

**Limitación honesta:** al ser una página estática pública, el `x-admin-token` está en el HTML del cliente. Esto es *obscurity + trigger PIN*, no seguridad criptográfica. Es suficiente para el objetivo actual (bloquear acceso casual). Migración natural futura: auth real con Supabase Auth y JWT.

---

## 7. Deploy y CI

- Push a `main` → GitHub Pages reconstruye en 1-2 min.
- No hay build step. `index.html` se sirve como está.
- Los archivos SQL en `migrations/` y el Edge Function en `supabase/functions/` se aplican manualmente desde el dashboard de Supabase (ver [`DESPLIEGUE-WEB.md`](DESPLIEGUE-WEB.md)).
