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

Panel interno para carga y administración de productos. Usa **un secreto compartido** — múltiples personas autorizadas pueden entrar desde cualquier dispositivo con la misma clave. El detalle del mecanismo de acceso **no se documenta públicamente por razones de seguridad** (ver sección 6). El código convive en el mismo `index.html` pero el acceso está protegido por RLS + validación server-side de la clave.

---

## 3. Persistencia de datos: Supabase

- **Proyecto:** `rbvqxrkzepthbbqzkbcg` (región us-east-1).
- **API:** `https://rbvqxrkzepthbbqzkbcg.supabase.co`
- **Tabla:** `productos` — todos los campos del producto, incluyendo `foto_url` (base64 embebido en la fila).
- **Bucket:** `product-photos` (público, 2 MB por archivo) — opcional para fotos que no queremos embeber.

El schema completo, mapeo camelCase↔snake_case y filtros aplicados están en [`MODELO-DE-DATOS.md`](MODELO-DE-DATOS.md).

### Lectura pública (vitrina)

La vitrina hace `GET` a `productos` con la anon key. Dos capas:
- **RLS (filas):** solo productos con `estado='publicado' AND precio>0 AND descripcion IS NOT NULL`.
- **Columnas explícitas:** el fetch pide solo columnas públicas (`sbFetchPublic`). `cert_num`, `costo`, `margen`, `proveedor` y `notas` nunca viajan en la respuesta al navegador del cliente.

### Escritura (panel privado)

Todas las mutaciones (INSERT / UPDATE / DELETE) requieren header `x-admin-token`. RLS rechaza cualquier escritura sin él. El token no está hardcoded en el código — se deriva del secreto compartido en runtime.

### Cálculo de precios (server-side)

La Edge Function `calculate-price` recibe `{costo, margen}` y devuelve `{precio}` (`precio = costo × (1 + margen/100)`, redondeado). Motivo: evitar que la fórmula de márgenes esté solo en el cliente.

Ver [`../supabase/functions/README.md`](../supabase/functions/README.md).

---

## 4. Manejo de imágenes de producto (v2: múltiples imágenes)

- **Foto principal** (`foto_url`): Requerida para cada producto. Se muestra siempre en la grilla y se usa como fallback.
- **Fotos adicionales** (`fotos` array JSONB): Opcionales (0-4 imágenes extra). Se muestran en carousel modal con flechas ← → y puntos indicadores cuando hay 2+ fotos.
- **Compresión**: Todas las fotos se comprimen en el navegador (canvas) a máx 800 px por lado mayor, JPEG calidad 0.82, **antes** de subir.
- **Almacenamiento**: Se guardan como *data URI* base64 en Supabase.
- **Límite**: Máximo 5 fotos por producto (1 principal + 4 adicionales).
- **Input**: Usa `accept="image/*"` **sin** `capture` para que el celular ofrezca **cámara o galería** (no solo cámara).
- **Retrocompatibilidad**: Si `fotos` está vacío/null, vitrina cae a `foto_url` para mostrar imagen.

## 4.1. Precios promocionales (v1: descuentos opcionales)

- **Precio regular** (`precio`): Calculado server-side en Edge Function desde `costo` y `margen`.
- **Precio de oferta** (`precio_oferta`): Campo opcional (nullable). Si se completa:
  - Vitrina muestra: precio original tachado + precio de oferta (verde esmeralda) + badge con descuento %.
  - Descuento calculado: `(precio - precio_oferta) / precio × 100`.
- **Validación crítica**: `precio_oferta >= costo` para evitar pérdidas de operación (protección en `admSaveProductWithPrice()`).
- **Visibilidad**: Ambas columnas (`precio`, `precio_oferta`) están en `SB_PUBLIC_COLS` (es información de UI, no sensible).

---

## 5. Temas (claro/oscuro)

Respeta `prefers-color-scheme` y permite toggle manual. Colores en variables CSS (`--gold`, `--esm`, etc.) con tres capas: `:root`, `@media (prefers-color-scheme: dark)`, `:root[data-theme="dark"|"light"]`.

---

## 6. Seguridad — enfoque de capas

1. **RLS en Supabase (filas):** la anon key es pública; SELECT solo devuelve productos publicados con precio y descripción.
2. **Fetch con columnas explícitas:** el frontend público pide solo columnas seguras (`SB_PUBLIC_COLS`) — datos administrativos no viajan en la respuesta.
3. **Clave compartida como único secreto:** cualquier persona autorizada la usa desde cualquier dispositivo. Está solo en la mente de las personas, no en el código ni en la documentación pública.
4. **Token derivado en runtime:** el `x-admin-token` que se envía a Supabase es `SHA-256(clave + salt)`, calculado al ingresar la clave. Vive en `sessionStorage` mientras el panel esté abierto, se borra al cerrar.
5. **Validación server-side de la clave:** un upsert de una fila oculta prueba RLS antes de abrir el panel. Sin hash local.
6. **Rate limiting**: 100 req/min por endpoint API; 5 intentos de clave / 5 min de bloqueo local.
7. **Content-Security-Policy** en el `<head>`: restringe `connect-src` y `script-src` al dominio de Supabase + jsPDF CDN.
8. **Auditoría:** trigger PostgreSQL que registra todos los cambios en la tabla `productos_audit`.

**Limitación honesta:** al ser una página estática pública, el mecanismo del gesto de acceso se puede inferir leyendo el código. Pero acceder al panel sin la clave correcta no sirve — no se pueden hacer escrituras. Migración natural futura: auth real con Supabase Auth y JWT.

**Defensa profunda pendiente (opcional):** a nivel Postgres, el rol `anon` sigue teniendo SELECT en todas las columnas. Un atacante que arme su propio request `select=*` podría leer campos administrativos. Se puede endurecer con `REVOKE SELECT` + `GRANT SELECT(columnas)`, pero requiere refactor del fetch admin a una RPC con `SECURITY DEFINER`.

---

## 7. Deploy y CI

- Push a `main` → GitHub Pages reconstruye en 1-2 min.
- No hay build step. `index.html` se sirve como está.
- Los archivos SQL en `migrations/` y el Edge Function en `supabase/functions/` se aplican manualmente desde el dashboard de Supabase (ver [`DESPLIEGUE-WEB.md`](DESPLIEGUE-WEB.md)).
