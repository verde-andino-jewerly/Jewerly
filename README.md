# Verde Andino Jewelry — Ecosistema Digital

Marca colombiana de joyería con esmeraldas nacionales, en etapa de pre‑lanzamiento. Este repositorio contiene **todo el código y la documentación** del ecosistema digital de la marca: la vitrina pública, el panel de gestión de productos y las herramientas internas de operación.

> **Propósito de este repositorio:** ser la fuente de verdad y el respaldo completo del proyecto. Está escrito con el máximo detalle posible para que cualquier persona (o la propia dueña, sin ayuda de ninguna herramienta de IA) pueda entender, mantener, desplegar y evolucionar el sistema.

---

## 🧭 Índice rápido

| Archivo | Qué es |
|---|---|
| [`index.html`](index.html) | **Sitio principal**: vitrina pública + panel de carga/gestión oculto. Es lo que se publica en la web. |
| [`herramientas/calculadora-aleaciones.html`](herramientas/calculadora-aleaciones.html) | Calculadora interna de aleaciones de metales. |
| [`herramientas/control-financiero.html`](herramientas/control-financiero.html) | Control financiero interno (costos, márgenes). |
| [`herramientas/roadmap-lanzamiento.html`](herramientas/roadmap-lanzamiento.html) | Hoja de ruta del lanzamiento. |
| [`docs/`](docs/) | Documentación técnica detallada (arquitectura, datos, panel admin, despliegue, historial). |
| [`assets-fuente/`](assets-fuente/) | Recursos originales (logo, fotos) por si hay que regenerar los HTML. |

---

## 🚀 ¿Qué es esto en una frase?

Una **tienda‑vitrina en un solo archivo HTML** que la dueña puede publicar en cualquier hosting web, y que incluye —oculto tras un acceso privado con PIN— un **panel para cargar, editar, duplicar y ocultar productos** desde el celular o el computador. Los productos que se cargan aparecen automáticamente en la vitrina.

No necesita servidor, base de datos, ni conexión a internet para funcionar: **todo vive dentro del navegador** (tecnología `localStorage`).

---

## 🏗️ Arquitectura en 30 segundos

- **Un solo archivo** (`index.html`) contiene dos "entornos" que comparten los mismos datos:
  1. **Vitrina pública** (lo que ve el cliente): catálogo, filtros, fichas de producto, contacto por WhatsApp, información de las minas de esmeralda.
  2. **Panel de gestión** (oculto, solo la dueña): formulario para cargar productos con foto, editar los existentes, duplicarlos, cambiar su estado y exportar todo a CSV.
- **Los datos se guardan en `localStorage`** bajo la clave `va_catalog_v3`. La vitrina *lee* de ahí; el panel *escribe* ahí. Por eso, al guardar un producto, aparece al instante en la vitrina.
- **Por qué un solo archivo:** si la vitrina y el panel fueran dos páginas/artefactos separados, *no* compartirían `localStorage` (el navegador aísla los datos por origen). Unirlos garantiza la sincronización automática.

👉 Detalle completo en [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md).

---

## 🔐 Cómo entrar al panel de gestión (acceso privado)

La vitrina es pública, pero el panel de carga está **oculto**. Solo la dueña debe entrar. Hay dos formas, ambas funcionan en **celular y computador**:

1. **Mantener presionado el logo** del pie de página (footer) durante **~1 segundo**.
2. **Tocar/clic 5 veces seguidas** (rápido, menos de 3 segundos) sobre ese mismo logo del pie.

Luego se pide un **PIN**:
- La **primera vez** te pide *crear* un PIN de 4 a 6 dígitos.
- Las siguientes veces te pide *ingresarlo*.
- El PIN se guarda **cifrado** (hash SHA‑256) en el navegador; no queda escrito en el código.
- Si lo olvidas, hay un botón "¿Olvidaste tu PIN?" que permite crear uno nuevo **sin borrar el catálogo**.

> El PIN y el catálogo se guardan **por navegador y dispositivo**. Si entras desde otro celular/computador, tendrás que crear el PIN de nuevo y ese dispositivo tendrá su propia copia de los datos. Ver [`docs/PANEL-ADMIN.md`](docs/PANEL-ADMIN.md) y la sección de limitaciones más abajo.

---

## 🧑‍💼 Qué se puede hacer en el panel

- **Cargar un producto** con foto (tomada con la cámara o elegida de la galería), ID automático (`VA‑001`, `VA‑002`…), categoría, estilo, metal, ley (quilataje), color, piedras (tipo + cantidad + quilates), descripción, medida, certificado y datos administrativos internos (**privados — solo la dueña los ve en el panel**):
  - Proveedor
  - Costo (en COP)
  - Margen (porcentaje) → el sistema calcula automáticamente el **precio venta**
  - Notas internas
  
  > **Nota de privacidad:** Los costos y márgenes NUNCA aparecen en la vitrina pública. La vitrina solo muestra: foto, ID, categoría, descripción, precio final, piedras y tallas. Los datos administrativos quedan protegidos en el panel.
- **Editar** un producto existente **sin cambiar su identificador único** (el ID queda bloqueado).
- **Duplicar** un producto: copia sus metadatos y variables a un registro nuevo, con ID nuevo, en estado *borrador*, para crear variantes rápido.
- **Estado de publicación** por producto:
  - 🟢 **Publicado** → visible para los clientes en la vitrina.
  - 🟡 **Oculto** → se retira de la vista del cliente **sin borrarlo** del catálogo.
  - ⚪ **Borrador** → trabajo en progreso; no aparece en la vitrina.
- **Eliminar** un producto (con confirmación).
- **Exportar** el catálogo de dos maneras:
  - **CSV**: para importar a Excel/Google Drive (solo metadatos, sin fotos)
  - **PDF**: catálogo visual con fotos + ID + descripción + precio (ideal para compartir con clientes o imprimir)

👉 Guía paso a paso en [`docs/PANEL-ADMIN.md`](docs/PANEL-ADMIN.md).

---

## 🌐 Publicar en la web (para el lanzamiento)

`index.html` es autosuficiente (sin dependencias externas), así que se puede publicar en cualquier hosting estático. Opciones recomendadas, de más simple a más completa:

1. **GitHub Pages** (gratis, integrado con este repo).
2. **Netlify** o **Vercel** (gratis, arrastrar y soltar o conectar el repo).
3. Cualquier hosting propio (subir `index.html`).

👉 Instrucciones detalladas paso a paso en [`docs/DESPLIEGUE-WEB.md`](docs/DESPLIEGUE-WEB.md).

---

## ⚠️ Limitaciones importantes (leer antes de operar)

- **Los datos viven en el navegador, no en la nube.** El catálogo que cargas queda en *ese* navegador de *ese* dispositivo. No se sincroniza solo entre tu celular y tu computador.
  - Para mover el catálogo entre dispositivos hoy: **exporta el CSV** y las fotos, o carga desde un único dispositivo "maestro".
  - Si borras los datos del navegador (limpiar caché/datos del sitio), **se pierde el catálogo local**. Por eso: **exporta con frecuencia**.
- **El acceso oculto + PIN protege del cliente casual, no es seguridad de nivel bancario.** Como es una página estática, alguien con conocimientos técnicos podría inspeccionar el código. Es suficiente para evitar que un cliente cargue o modifique productos, que es el objetivo. Ver [`docs/PANEL-ADMIN.md`](docs/PANEL-ADMIN.md).
- **Próximo paso natural (futuro):** si se quiere un catálogo único compartido en la nube y en tiempo real entre varios dispositivos, se necesitaría un backend (por ejemplo Supabase, Firebase o una hoja de Google conectada). Ver [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) → "Evolución futura".

---

## 📇 Datos de la marca (referencia)

- **WhatsApp:** +57 318 093 5276
- **Instagram:** @verde.andino.jewelry
- **TikTok:** @Verde.Andino.Jewerly
- **Correo (git):** verdeandinojewerly@gmail.com

---

## 🗂️ Historial y estado del proyecto

Ver [`docs/HISTORIAL.md`](docs/HISTORIAL.md) para el registro de lo que se ha construido y las decisiones tomadas.
