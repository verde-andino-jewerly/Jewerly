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

---

## Datos de referencia de la marca

- Esmeraldas de Muzo, Chivor y Coscuez (Boyacá / Cundinamarca, Colombia).
- WhatsApp: +57 318 093 5276
- Instagram: @verde.andino.jewelry
- TikTok: @Verde.Andino.Jewerly

---

## Pendientes / ideas a futuro

- **Auth real con Supabase Auth** — reemplazar PIN + `x-admin-token` por JWT cuando escale la operación.
- **Storage bucket** para fotos grandes en vez de base64 embebido (reduciría el tamaño de las filas de `productos`).
- **Generador de publicaciones para redes** desde el panel privado.
- **Inventario y estadísticas** (visitas, productos más vistos).
- **Dominio propio** cuando esté decidido el nombre comercial final.
