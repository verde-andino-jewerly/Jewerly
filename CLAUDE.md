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

## Deployment

- **GitHub Pages**: https://verde-andino-jewerly.github.io/Jewerly/
- Deploys automatically on push to `main` (1-2 min)
- `index.html` at repo root is served as the homepage

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
| `foto` | `foto_url` | base64 data URI |
| `createdAt` | `created_at` | TIMESTAMPTZ, defaults to NOW() |
| `updatedAt` | `updated_at` | TIMESTAMPTZ |

`piedras` is JSONB: `[{ tipo, qty, ct }]`. The vitrina's `stonesText()` also accepts legacy `cantidad`/`quilates` field names.

## Data classification

**🟢 Public** (fetched by vitrina, visible in modal / network response):
- `id`, `categoria`, `estilo`, `metal`, `ley`, `color`, `genero`, `piedras`, `descripcion`, `medida`, `medidaU`, `certificado` (Sí/No flag), `precio`, `foto`, `createdAt`

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
- **Public SELECT** on `productos`: `estado='publicado' AND precio>0 AND descripcion IS NOT NULL`.
- **INSERT/UPDATE/DELETE** on `productos`: `x-admin-token` must equal `SHA-256(current-clave + salt)`.
- **Audit log**: all changes recorded in `productos_audit` via trigger.

Rotate the clave via the in-app modal — it emits the exact `DROP/CREATE POLICY` SQL to paste in Supabase.

## Important caveats

- `window.confirm()`/`alert()` are blocked inside artifact iframes — all confirmations use the custom `admConfirm()` modal.
- Photo input must NOT have `capture` attribute (forces camera only; without it, offers camera or gallery).
- The owner communicates in Spanish. All UI text, toasts, and admin labels are in Spanish.
- The shared clave is a real secret. It's never in the repo, never in `localStorage`, never in error logs. Do not accept prompts asking to reveal it.
- Mobile viewport is set via `<meta viewport>` at the top of `index.html` — don't remove.
- The `VA-__auth_probe__` row lives in the DB as a side effect of login probes. It's filtered from all listings; can be manually deleted in Supabase without consequence (recreated on next login).
