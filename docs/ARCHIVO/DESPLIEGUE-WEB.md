> ## ARCHIVADO — no vigente
>
> Este documento quedo desactualizado. Daba como URL en vivo
> `verde-andino-jewerly.github.io/Jewerly/`, que ya no es la direccion: el sitio
> vive en **https://verdeandino.app**. Ademas es anterior al panel de
> herramientas, que se publica en Vercel por un camino distinto.
>
> **Vigente:** `MANUAL.md` en la raiz del proyecto, seccion 3.
>
> Se conserva como registro historico.

---

# Despliegue

Cómo se publica y se mantiene el sitio.

---

## Estado actual

- **URL en vivo:** https://verde-andino-jewerly.github.io/Jewerly/
- **Hosting:** GitHub Pages (rama `main`, carpeta raíz).
- **Auto-deploy:** cada `git push` a `main` reconstruye el sitio en 1-2 minutos.

---

## Frontend — GitHub Pages

Configuración una sola vez:

1. En GitHub → **Settings → Pages**.
2. En **"Build and deployment" → "Source"**: `Deploy from a branch`.
3. En **"Branch"**: `main` + carpeta `/ (root)`.

Actualizar el sitio:

```bash
git add index.html
git commit -m "descripción del cambio"
git push
```

GitHub Pages reconstruye automáticamente. Refresca con caché limpia (`Ctrl+Shift+R` en desktop) para ver los cambios inmediatamente.

**Dominio propio (opcional):** en Settings → Pages → Custom domain, apuntar el DNS.

---

## Backend — Supabase

El proyecto Supabase (`rbvqxrkzepthbbqzkbcg`) ya está configurado. Para replicar en un ambiente nuevo o después de resetear:

### 1. Tabla `productos`

Se crea manualmente vía Table Editor o con SQL. Las columnas están documentadas en [`MODELO-DE-DATOS.md`](MODELO-DE-DATOS.md).

### 2. Políticas RLS

Aplicar el SQL de [`../migrations/rls-policies.sql`](../migrations/rls-policies.sql) desde:

**Supabase Dashboard → SQL Editor → New query** → pegar el contenido → **Run**.

Verificar:
- Lectura pública funciona solo con `estado='publicado' AND precio>0 AND descripcion IS NOT NULL`.
- Escrituras sin `x-admin-token` fallan con "policy violation".

### 3. Tabla de auditoría

Aplicar [`../migrations/audit-table.sql`](../migrations/audit-table.sql) igual (SQL Editor → Run).

Cada INSERT/UPDATE/DELETE en `productos` queda registrado automáticamente en `productos_audit` con timestamp y datos previos/nuevos.

### 4. Edge Function `calculate-price`

Deploy desde el dashboard:

**Supabase Dashboard → Edge Functions → Create a new function**
- Nombre: `calculate-price`
- Copiar el contenido de [`../supabase/functions/calculate-price/index.ts`](../supabase/functions/calculate-price/index.ts)
- **Deploy**.

Detalles en [`../supabase/functions/README.md`](../supabase/functions/README.md).

### 5. Anon key

La anon key va en `index.html` (variable `SB_KEY`). Es pública por diseño; RLS es lo que protege los datos. Si se regenera desde el dashboard, actualizar `index.html` y hacer push.

---

## Verificación después de deployar

- [ ] La vitrina carga y muestra productos publicados.
- [ ] Filtros y búsqueda funcionan.
- [ ] Modal de producto abre correctamente.
- [ ] Botón WhatsApp abre el chat con mensaje pre-cargado.
- [ ] Fotos de minas (Muzo/Chivor/Coscuez) cargan.
- [ ] Modo claro/oscuro alterna correctamente.
- [ ] En consola no hay errores 401/403 de Supabase.

---

## Alternativas de hosting (si algún día se migra)

- **Netlify** — drag-and-drop de `index.html` o conectar el repo.
- **Vercel** — importar el repo de GitHub, cero configuración.
- **Cloudflare Pages** — misma dinámica, con CDN global.

Todas soportan dominio propio gratis.
