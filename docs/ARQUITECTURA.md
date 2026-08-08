# Arquitectura técnica

Este documento explica **cómo está construido** el sitio, para que cualquier desarrollador (o la dueña con conocimientos básicos) pueda entenderlo y modificarlo sin ayuda externa.

---

## 1. Principio fundamental: un solo archivo, cero dependencias

Todo el sitio principal es **un único archivo HTML** (`index.html`) que incluye, embebidos en su interior:

- El **HTML** de la estructura.
- El **CSS** (estilos) dentro de una etiqueta `<style>`.
- El **JavaScript** (lógica) dentro de una etiqueta `<script>`.
- Las **imágenes** (logo, fotos de las minas) como *data URIs* en base64, incrustadas directamente en el código.

**No carga nada de internet**: ni fuentes, ni librerías, ni imágenes externas. Esto significa que:
- Funciona sin conexión.
- No se rompe si un servicio externo se cae.
- Se puede abrir con doble clic o publicar en cualquier hosting.
- Es compatible con el entorno restringido de los "artefactos" de Claude (que bloquean recursos externos por seguridad).

**Contrapartida:** el archivo es grande (~1.3 MB) porque las imágenes van embebidas. Es un precio aceptable para la autosuficiencia.

---

## 2. Los dos entornos dentro del archivo

Conceptualmente hay dos "aplicaciones" en el mismo archivo:

### a) Vitrina pública (front)
Lo que ve el cliente. Secciones:
- **Hero** con el logo (detecta el color de fondo del logo para integrarlo sin recuadro).
- **Valores** de la marca.
- **Colección**: grilla de productos con búsqueda, filtros por categoría y ordenamiento. Cada tarjeta abre una **ficha (modal)** con detalle y botón de WhatsApp.
- **Cómo comprar**, **A la medida**.
- **La esmeralda colombiana**: sección educativa con pestañas para Muzo, Chivor y Coscuez (con fotos reales).
- **Contacto** (WhatsApp, Instagram, TikTok) y **FAQ**.
- **Botón flotante de WhatsApp**.

### b) Panel de gestión (admin, oculto)
Solo la dueña. Es un formulario de carga + galería de productos + exportación. Está oculto tras un acceso con gesto + PIN (ver [`PANEL-ADMIN.md`](PANEL-ADMIN.md)). Vive en un `<div id="admin-panel">` que normalmente está oculto (`display:none`) y se muestra a pantalla completa al desbloquearse.

Ambos entornos **comparten los mismos datos y las mismas funciones auxiliares** (formato de precios, escape de texto, etc.).

---

## 3. Persistencia de datos: `localStorage`

- **Clave:** `va_catalog_v3`
- **Formato guardado:** un objeto JSON con la forma:
  ```json
  { "items": [ /* array de productos */ ], "nextIdNum": 5 }
  ```
- La **vitrina lee** de esa clave con la función `load()` y filtra los productos publicados.
- El **panel escribe** en esa clave con la función `admSave()`.
- **Sincronización en tiempo real:** la vitrina escucha el evento `storage` y el evento `visibilitychange`, de modo que si se guarda un producto (incluso en otra pestaña del mismo sitio), la vitrina se actualiza sola.

> **Clave del diseño:** `localStorage` está aislado *por origen* (dominio). Dos páginas distintas NO comparten `localStorage`. Por eso vitrina y panel deben estar en el **mismo archivo/origen**: así comparten los datos automáticamente. Este fue un problema real que se resolvió fusionando ambos en un solo archivo.

El modelo de datos de cada producto está documentado en [`MODELO-DE-DATOS.md`](MODELO-DE-DATOS.md).

---

## 4. Manejo de imágenes de producto

- Al cargar una foto, se **comprime en el navegador** (canvas) a un máximo de 800 px por el lado mayor y se guarda como JPEG calidad 0.82. Esto mantiene `localStorage` manejable.
- La foto se guarda como *data URI* base64 dentro del propio producto (campo `foto`).
- El input de foto usa `accept="image/*"` **sin** el atributo `capture`, para que el celular ofrezca elegir entre **cámara o galería** (con `capture` forzaba abrir solo la cámara).

---

## 5. Acceso al panel y confirmaciones (detalles técnicos)

- **Gesto de acceso:** listeners de `touchstart/touchend` (móvil) y `mousedown/mouseup/click` (escritorio) sobre el logo del pie. Un temporizador detecta la *pulsación larga* (~1 s); un contador detecta los *5 toques*. Se usa `touch-action: manipulation` para evitar que el navegador móvil interprete los toques como zoom.
- **PIN:** se compara el hash **SHA‑256** (vía `crypto.subtle.digest`) del PIN ingresado contra el hash guardado en `localStorage` (`va_admin_pin_hash`). La sesión desbloqueada se marca en `sessionStorage` (`va_admin_unlocked`) para no volver a pedir el PIN hasta cerrar el navegador.
- **Confirmaciones (eliminar, reemplazar, resetear PIN):** se usa un **modal propio** en lugar de `window.confirm()`. Motivo: dentro del iframe *sandbox* de los artefactos, `confirm()`/`alert()` están bloqueados (falta el permiso `allow-modals`), por lo que en móvil "no hacían nada". El modal propio funciona en todos los entornos.

---

## 6. Temas (claro/oscuro)

El sitio respeta el tema del sistema (`prefers-color-scheme`) y permite alternar manualmente. Los colores se definen con variables CSS (`--gold`, `--esm`, etc.) en tres capas: `:root`, `@media (prefers-color-scheme: dark)` y `:root[data-theme="dark"|"light"]`.

---

## 7. Evolución futura (si se quiere crecer)

El diseño actual es **local‑first** (datos en el navegador). Si en el futuro se necesita:

- **Catálogo único en la nube**, compartido y sincronizado entre varios dispositivos/personas.
- **Respaldo automático** sin depender de exportar CSV.
- **Estadísticas, pedidos, inventario en tiempo real.**

…el camino sería añadir un **backend**. Opciones de bajo costo/mantenimiento:
- **Supabase** o **Firebase** (base de datos + almacenamiento de imágenes + autenticación real).
- **Hoja de Google Sheets** conectada vía un script (más simple, menos robusto).

En ese escenario, la vitrina leería del backend en vez de `localStorage`, y el panel escribiría al backend con autenticación real (usuario/contraseña de verdad, no un PIN local). El grueso de la interfaz actual se puede reutilizar.
