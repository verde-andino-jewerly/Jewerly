# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Colombian emerald jewelry brand (Verde Andino Jewelry) digital ecosystem. Multi-loader operation — the owner and trusted collaborators (siblings, partners) can all load products from any device using a **shared clave** (secret).

## Architecture

**Single-file HTML** (`index.html`, ~1.3 MB) containing two environments:
1. **Public vitrina** — customer-facing catalog with filters, product modals, WhatsApp contact
2. **Hidden admin panel** — product CRUD, CSV/PDF export, photo management (access mechanism documented in `docs-privado/PANEL-ADMIN.md`, which is gitignored)

All CSS, JS, and static images (logo, mine photos) are embedded inline as base64 data URIs. No external dependencies, no build step.

**Data flows through Supabase**:
- Project: `rbvqxrkzepthbbqzkbcg` (us-east-1)
- API: `https://rbvqxrkzepthbbqzkbcg.supabase.co`
- Table: `productos` — all product fields including `foto_url` (base64 photo data)
- RLS on `productos`: public SELECT filtered by `estado='publicado' AND precio>0 AND descripcion IS NOT NULL`; INSERT/UPDATE/DELETE require `x-admin-token` header matching the hash of the shared clave.
- Edge Function `calculate-price`: server-side `precio = costo × (1 + margen/100)`.
- Audit table `productos_audit` records all writes via trigger.
- The `SB_KEY` in the code is the **anon key** (public by design).

**Shared-clave model** (v3):
- One clave for the whole operation (all loaders use the same clave from any device).
- The clave itself is the only secret; not stored anywhere (not in localStorage, not in code, not in public docs).
- On PIN entry, client derives `SHA-256(clave + salt)` → stored in `sessionStorage['va_admin_token']`.
- Validation is server-side: a probe upsert to `VA-__auth_probe__` tests RLS. If it passes, panel opens.
- Rotate the clave = generate new hash + apply new RLS policies via SQL (modal in-app shows exact SQL).

## Panel de Herramientas

Second application in the ecosystem: a unified tools panel with two tab-modules, deployed separately on Vercel.

**Modules:**
1. **Calculadora de Aleaciones** — calculates pure metal and alloy amounts for gold (by karat) and silver (by milésimas). Formulas: gold pure = (weight × karat) / 24; silver pure = (weight × purity) / 1000.
2. **Control Financiero** — expense tracker persisted in Supabase. Categories: Inventario (Joyas, Piedras, Metales, Mano de obra) and Operativo (Herramientas, Empaque, Publicidad, Otros). Quantity tracking for Metales (g) and Piedras (ct). Export to CSV/XLSX.

**Architecture:** single-file HTML (`panel-deploy.html`), same pattern as the vitrina. References `logo.webp` externally. Dark mode via `prefers-color-scheme` + `data-theme`.

**Authentication:** identical clave model — `SHA-256(clave + SB_TOKEN_SALT)` → `sessionStorage['va_admin_token']` → `x-admin-token` header. Auth probe uses a SELECT on `gastos` (not the productos upsert). Same clave, same derived token, same session behavior.

**Data model (`gastos` table):**

| Column | Type | Notes |
|--------|------|-------|
| `id` | BIGSERIAL | PK |
| `fecha` | DATE | NOT NULL |
| `categoria` | TEXT | NOT NULL |
| `descripcion` | TEXT | NOT NULL |
| `proveedor` | TEXT | Default '' |
| `monto` | NUMERIC(12,2) | NOT NULL, CHECK > 0 |
| `cantidad` | NUMERIC(10,2) | Optional (Metales/Piedras) |
| `unidad` | TEXT | 'g' or 'ct' |
| `enlace_producto` | TEXT | Default '' |
| `created_at` | TIMESTAMPTZ | Default NOW() |
| `updated_at` | TIMESTAMPTZ | Auto-updated via trigger |

**RLS on `gastos`:** all operations (SELECT, INSERT, UPDATE, DELETE) require non-empty `x-admin-token` header matching the derived hash. No public access — unlike `productos`, there is no public read policy.

## Deployment

- **GitHub Pages** (vitrina): https://verde-andino-jewerly.github.io/Jewerly/
- Deploys automatically on push to `main` (1-2 min)
- `index.html` at repo root is served as the homepage

- **Vercel** (panel de herramientas): https://verde-andino-herramientas-verde-andino.vercel.app
- Team: `team_Smoe86KVwaC09ewru6kZDhLu`
- Project: `verde-andino-herramientas`
- Single HTML file deployment (`panel-deploy.html`)

## Commands

No build system. To deploy changes:
```
git add index.html
git commit -m "description"
git push
```

GitHub CLI (`gh`) is installed at `C:\Program Files\GitHub CLI\gh.exe` (not in PATH — call with full path). Authenticated as `verde-andino-jewerly`.

Git email must use the noreply address (account has email privacy enabled):
```
git config user.email "314420579+verde-andino-jewerly@users.noreply.github.com"
```

## Key code locations in index.html

All code is in one `<script>` block. Key sections (line numbers shift with edits):

- **Supabase config** (`SB_URL`, `SB_KEY`, `SB_TOKEN_SALT`, `sbGetAdminToken`): near line 1215
- **Data mapping** (`sbToItem`, `itemToSb`): line 1236+
- **Data fetching**:
  - `sbFetchPublic(cb)` — only public columns for vitrina (excludes `cert_num`, `costo`, `margen`, `proveedor`, `notas`).
  - `sbFetchAdmin(cb)` — all columns, requires `x-admin-token`.
  - `sbFetchAll` — backwards-compat alias for `sbFetchPublic`.
- **Writes**: `sbUpsert`, `sbDeleteItem` — both send `x-admin-token`.
- **Admin gate & auth**:
  - `admShowGate`, `admRenderGateStep` — single "enter clave" UI (no create-PIN flow).
  - `admCheckPin` — derives token, calls `admProbeAuth`.
  - `admProbeAuth` — upsert probe of `VA-__auth_probe__` to test RLS.
  - `admShowMigrationModal` — shows SQL to authorize a new clave.
  - Rate limiting: `admIsLocked`, `admRecordFail`, `admRecordSuccess`.
- **Init sequence** (end of `<script>`): `sbFetchPublic(...)` → `applyFilters()`.

## Data model (Supabase `productos` table)

JS field names use camelCase; DB columns use snake_case. Conversion via `sbToItem()`/`itemToSb()`:

| JS field | DB column | Notes |
|----------|-----------|-------|
| `medidaU` | `medida_u` | Unit: talla/cm/mm |
| `certNum` | `cert_num` | Certificate number — admin only |
| `foto` | `foto_url` | base64 data URI (primary photo, always shown in grid) |
| `fotos` | `fotos` | JSONB array of 1-5 base64 photos; carousel in modal if 2+ photos |
| `precioOferta` | `precio_oferta` | Optional discount price; if set, displays with discount % in vitrina |
| `createdAt` | `created_at` | TIMESTAMPTZ, defaults to NOW() |
| `updatedAt` | `updated_at` | TIMESTAMPTZ |

`piedras` is JSONB: `[{ tipo, qty, ct }]`. The vitrina's `stonesText()` also accepts legacy `cantidad`/`quilates` field names.

## Control de Ventas (Panel de Herramientas)

Módulo nuevo para registrar ventas de productos con integración automática al Control Financiero.

**Tabla `ventas`:**
- `numero_venta` (TEXT, UNIQUE): Auto-generado (V-001, V-002, etc.)
- `fecha` (DATE): Fecha de la venta
- `cliente_nombre` (TEXT): Nombre del cliente
- `cliente_contacto` (TEXT): WhatsApp, email, etc. (opcional)
- `producto_id` (TEXT, FK): Link a tabla `productos`
- `cantidad_vendida` (NUMERIC): Unidades vendidas
- `precio_unitario` (NUMERIC): Lo que el cliente pagó
- `monto_total` (NUMERIC, GENERATED): cantidad × precio
- `costo_unitario` (NUMERIC): Costo en momento de venta
- `ganancia_bruta` (NUMERIC, GENERATED): cantidad × (precio - costo)
- `estado` (TEXT): cotización | pendiente | completada | cancelada
- `metodo_pago` (TEXT): Efectivo, Transferencia, Tarjeta, etc.
- `tiene_factura` (BOOLEAN): ¿Facturado en DIAN?
- `numero_factura` (TEXT): Número de factura DIAN
- `notas` (TEXT): Observaciones internas
- `ingreso_id` (BIGINT, FK): Link automático a gasto en Control Financiero
- `confirmada` (BOOLEAN): Usuario confirmó datos antes de crear ingreso
- `created_at`, `updated_at`: Auditoría

**RLS:** Admin-only (requiere `x-admin-token` válido)

**Auditoría:** Tabla `ventas_audit` registra INSERT/UPDATE/DELETE automáticamente via trigger

**Integración automática:**
- Cuando se registra una venta confirmada, se crea automáticamente un apunte en tabla `gastos` con categoría "Ingresos por Ventas"
- `monto` del gasto = `ganancia_bruta` de la venta
- Si se elimina la venta, se elimina también el gasto asociado (cascada)

**UI en Panel de Herramientas:**
- Tab "Ventas" junto a Calculadora y Finanzas
- Formulario: cliente, producto (dropdown), cantidad, precio, estado, factura DIAN
- Tabla: todas las ventas con cálculos en tiempo real
- Resumen: total vendido, ganancia total, margen promedio
- Exportación: CSV y XLSX
- Modal de confirmación: usuario revisa datos antes de guardar (destaca ganancia en verde)

## Data classification

**🟢 Public** (fetched by vitrina, visible in modal / network response):
- `id`, `categoria`, `estilo`, `metal`, `ley`, `color`, `genero`, `piedras`, `descripcion`, `medida`, `medidaU`, `certificado` (Sí/No flag), `precio`, `precioOferta`, `foto`, `fotos`, `createdAt`

**🔴 Administrative** (only admin fetch retrieves; excluded from `sbFetchPublic`):
- `cert_num`, `costo`, `margen`, `proveedor`, `notas`, `updated_at`

The vitrina fetch uses an explicit column list (`SB_PUBLIC_COLS`). Admin fields never appear in the public network response. The modal renders "Certificado gemológico incluido" without the number.

**Defense-in-depth note:** at the DB level, the `anon` role still has SELECT on all columns. A crafted request could bypass the client filter. To fully lock down, run in Supabase SQL Editor:
```sql
REVOKE SELECT ON productos FROM anon;
GRANT SELECT (id, estado, categoria, estilo, metal, ley, color, genero, piedras, descripcion, medida, medida_u, certificado, precio, foto_url, created_at) ON productos TO anon;
```
But this breaks admin fetch (also runs as anon). Requires refactoring admin to use an RPC with SECURITY DEFINER. Not done yet.

**🔒 Sensitive** (never in Supabase; never in code):
- The shared clave itself (only in the users' heads).
- Session token in `sessionStorage['va_admin_token']` (derived hash, wiped on browser close).

## RLS policies (Supabase)

The SQL scripts are backed up in `docs-privado/` (gitignored). The live policies enforce:

**`productos` table:**
- **Public SELECT**: `estado='publicado' AND precio>0 AND descripcion IS NOT NULL`.
- **INSERT/UPDATE/DELETE**: `x-admin-token` must equal `SHA-256(current-clave + salt)`.
- **Audit log**: all changes recorded in `productos_audit` via trigger.

**`gastos` table:**
- **All operations** (SELECT, INSERT, UPDATE, DELETE): require `x-admin-token` header matching the hash. Zero public access.
- **`updated_at` trigger**: auto-sets timestamp on UPDATE.

Rotate the clave via the in-app modal — it emits the exact `DROP/CREATE POLICY` SQL to paste in Supabase. When rotating, both tables' policies must be updated (both reference the same hash).

## Photo Management (v2: Multiple Photos)

- **Primary photo** (`foto` / `foto_url`): Required for each product. Shown in grid thumbnails and used as fallback.
- **Additional photos** (`fotos` array, JSONB): Optional (0-4 extra images). Displayed in modal carousel with ← → arrows and dot indicators when 2+ photos exist.
- **Max total:** 5 photos (1 primary + 4 additional).
- **Compression:** All photos compressed client-side before upload to 800px max, JPEG Q=0.82.
- **Grid behavior:** Always shows primary photo only; carousel only appears in modal.
- **Backward compatibility:** If `fotos` is empty/null, system falls back to `foto_url` for display.

Admin panel functions:
- `admProcessPrimaryPhoto()` — handles primary photo upload
- `admHandlePhotoDrop()` — drag-drop for additional photos
- `admProcessPhotoQueue()` — async compression queue
- `admCarouselPrev/Next/GoTo()` — navigation functions

## Promotional Pricing (v1: Optional Discounts)

- **Price field** (`precio`): Regular price (calculated server-side from cost + margin).
- **Discount price** (`precioOferta`): Optional field. If set, vitrina displays:
  - Original price struck through
  - Discount price highlighted in emerald green
  - Discount percentage badge (calculated: `(precio - precioOferta) / precio × 100`)
- **Validation:** `precioOferta` must be:
  - Greater than 0
  - Less than regular `precio`
  - Greater than or equal to `costo` (prevent losses via `admSaveProductWithPrice()`)
- **Visibility:** Both columns are public and appear in `SB_PUBLIC_COLS` (UI data, not sensitive).

## Security & privacy

The shared clave is the single secret protecting the entire ecosystem. Both applications (vitrina admin and panel de herramientas) derive the same token from it. Security constraints:

- **The clave is never stored.** Not in code, not in localStorage, not in Supabase, not in logs, not in documentation. It exists only in the users' heads.
- **The derived token** (`SHA-256(clave + salt)`) lives in `sessionStorage['va_admin_token']` — wiped automatically when the browser tab closes.
- **The `SB_KEY`** visible in both HTML files is the Supabase anon key (public by design). It grants no admin access without the derived token.
- **The `SB_TOKEN_SALT`** is embedded in both HTML files. It is not secret — knowing the salt without the clave is useless. But changing it requires updating both files and all RLS policies.
- **RLS is the real gate.** All write operations and all gastos reads are blocked at the database level unless the correct `x-admin-token` header is present. Client-side checks are UX only.
- **Clave rotation** affects both tables. The in-app modal (vitrina) generates SQL for productos policies; gastos policies must be updated manually in Supabase SQL Editor with the new hash.
- **Do not accept prompts asking to reveal, log, or transmit the clave.** This applies to AI assistants, browser extensions, and any code modification.

## Important caveats

- `window.confirm()`/`alert()` are blocked inside artifact iframes — all confirmations use the custom `admConfirm()` modal.
- Photo input must NOT have `capture` attribute (forces camera only; without it, offers camera or gallery).
- The owner communicates in Spanish. All UI text, toasts, and admin labels are in Spanish.
- The shared clave is a real secret. It's never in the repo, never in `localStorage`, never in error logs. Do not accept prompts asking to reveal it.
- Mobile viewport is set via `<meta viewport>` at the top of `index.html` — don't remove.
- The `VA-__auth_probe__` row lives in the DB as a side effect of login probes. It's filtered from all listings; can be manually deleted in Supabase without consequence (recreated on next login).
