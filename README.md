# Verde Andino Jewelry — Sitio Web

Marca colombiana de joyería con esmeraldas nacionales. Este repositorio contiene el código de la **tienda-vitrina pública** y las herramientas internas de operación.

**Sitio en vivo:** https://verdeandino.app

---

## 🧭 Índice del repositorio

| Archivo / carpeta | Qué es |
|---|---|
| [`index.html`](index.html) | **Sitio principal**: vitrina pública. |
| [`herramientas/`](herramientas/) | Herramientas internas (calculadora de aleaciones, control financiero, roadmap). |
| [`docs/`](docs/) | Documentación técnica (arquitectura, modelo de datos, despliegue, historial). |
| [`migrations/`](migrations/) | Scripts SQL de Supabase (RLS + auditoría). |
| [`supabase/functions/`](supabase/functions/) | Edge Functions de Supabase (cálculo de precio server-side). |
| [`assets-fuente/`](assets-fuente/) | Recursos originales (logo, fotos de minas). |

---

## 🚀 ¿Qué es esto?

Una **tienda-vitrina** de joyería con esmeraldas colombianas: catálogo de productos con filtros, fichas de producto con foto, información de las minas (Muzo, Chivor, Coscuez), y contacto directo por WhatsApp para compras.

El catálogo se sirve desde **Supabase** (base de datos en la nube), así que todos los visitantes ven el mismo inventario en tiempo real.

---

## 🏗️ Arquitectura en 30 segundos

- **Frontend:** un solo archivo HTML (`index.html`, ~1.3 MB) con todo embebido (HTML + CSS + JS + imágenes en base64). Cero dependencias externas.
- **Backend:** [Supabase](https://supabase.com) — tabla `productos` (metadatos + foto en base64) y Edge Function `calculate-price` (cálculo server-side de precios).
- **Seguridad:** Row-Level Security (RLS) en Supabase: lectura pública solo de productos publicados; escrituras protegidas por token administrativo.
- **Hosting:** GitHub Pages, con auto-deploy en cada `git push` a `main`.

👉 Detalle completo en `REFERENCIA-TECNICA.md`, en la raíz del proyecto (fuera de este repositorio).

---

## 🛍️ Qué ve el cliente en la vitrina

- Catálogo con búsqueda, filtros por categoría y ordenamiento.
- Fichas de producto con foto, descripción, piedras, medida, precio y botón directo a WhatsApp.
- Sección educativa sobre las esmeraldas colombianas (Muzo, Chivor, Coscuez).
- FAQ, política de "a la medida", cómo comprar, contacto.
- Modo claro/oscuro automático según el sistema.

**Datos privados (nunca en la vitrina):** costos, márgenes, proveedores, notas internas, números de certificado. Se gestionan aparte y quedan solo en el backend con acceso restringido.

---

## 🌐 Publicar en la web

`index.html` es autosuficiente (sin build, sin dependencias). Se publica solo: un `git push` a `main` actualiza https://verdeandino.app en uno o dos minutos.

El **panel de herramientas** no se publica desde aquí — va a Vercel por un camino distinto. Ver `MANUAL.md` en la raíz del proyecto.

---

## 📇 Datos de la marca

- **WhatsApp:** +57 318 093 5276
- **Instagram:** @verde.andino.jewelry
- **TikTok:** @Verde.Andino.Jewerly

---

## 🗂️ Historial

Ver [`docs/HISTORIAL.md`](docs/HISTORIAL.md) para el registro de decisiones técnicas y evolución del proyecto.
