# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Colombian emerald jewelry brand (Verde Andino Jewelry) digital ecosystem. Single-owner operation — only the brand owner loads/manages products via a hidden admin panel protected by PIN.

## Architecture

**Single-file HTML** (`index.html`, ~1.3 MB) containing two environments:
1. **Public vitrina** — customer-facing catalog with filters, product modals, WhatsApp contact
2. **Hidden admin panel** — product CRUD, CSV/PDF export, photo management (access mechanism documented in `docs-privado/PANEL-ADMIN.md`, which is gitignored)

All CSS, JS, and static images (logo, mine photos) are embedded inline as base64 data URIs. No external dependencies, no build step.

**Data flows through Supabase** (free tier):
- Supabase project: `rbvqxrkzepthbbqzkbcg` (us-east-1)
- API: `https://rbvqxrkzepthbbqzkbcg.supabase.co`
- Table: `productos` — stores all product fields including `foto_url` (base64 photo data)
- Storage bucket: `product-photos` (public, 2MB limit per file)
- RLS: public SELECT, open INSERT/UPDATE/DELETE (PIN protects the UI, not the API)
- The `SB_KEY` in the code is the **anon key** (public by design)

**PIN system** stays in browser localStorage (`va_admin_pin_hash` as SHA-256 hash, `va_admin_unlocked` in sessionStorage).

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

- **Supabase config & helpers** (`SB_URL`, `SB_KEY`, `sbToItem`, `itemToSb`, `sbFetchAll`, `sbUpsert`, `sbDeleteItem`): near line 1214
- **`load()`**: returns `_sbCache` (Supabase-fetched products)
- **`realItems()`**: filters for `estado === 'publicado' && precio > 0 && descripcion`
- **`admSaveProduct()`**: builds item from form, calls `sbUpsert()`, updates local cache
- **`admDeleteProduct()`**: calls `sbDeleteItem()` via custom confirm modal
- **`admLoad(cb)`**: async fetch from Supabase into `admState.items`
- **`admSave()`**: syncs `admState.items` into `_sbCache` for vitrina display
- **Init sequence**: at the end of `<script>`, calls `sbFetchAll()` then `applyFilters()`

## Data model (Supabase `productos` table)

JS field names use camelCase; DB columns use snake_case. Conversion via `sbToItem()`/`itemToSb()`:

| JS field | DB column | Notes |
|----------|-----------|-------|
| `medidaU` | `medida_u` | Unit: talla/cm/mm |
| `certNum` | `cert_num` | Certificate number |
| `foto` | `foto_url` | base64 data URI |
| `createdAt` | `created_at` | TIMESTAMPTZ, defaults to NOW() |
| `updatedAt` | `updated_at` | TIMESTAMPTZ |

`piedras` is JSONB: `[{ tipo, qty, ct }]`. The vitrina's `stonesText()` also accepts legacy `cantidad`/`quilates` field names.

## Herramientas (standalone internal tools)

Three separate HTML files in `herramientas/` — each is self-contained with its own localStorage key. They do NOT connect to Supabase.

## Data classification

**🟢 Public** (visible in vitrina via API):
- `id`, `categoria`, `estilo`, `metal`, `ley`, `color`, `genero`, `piedras`, `descripcion`, `medida`, `medidaU`, `certificado`, `precio`, `foto`, `createdAt`

**🔴 Administrative** (only admin sees, via PIN-protected panel):
- `costo`, `margen`, `proveedor`, `notas`, `certNum`, `updated_at`

**🔒 Sensitive** (never sent to Supabase; stays in localStorage):
- PIN hash (`va_admin_pin_hash`), session tokens

## RLS policies (Supabase)

Row-level security is implemented via `migrations/rls-policies.sql` and `migrations/audit-table.sql`:
- **Public SELECT**: only `estado = 'publicado' AND precio > 0 AND descripcion` rows are readable
- **INSERT/UPDATE/DELETE**: restricted to requests with `x-admin-token` header (currently unenforced at API level; PIN protects the UI)
- **Audit log**: all changes recorded in `productos_audit` table (see migrations)

Deploy: Apply both SQL files via Supabase > SQL Editor.

## Important caveats

- The `README.md` and `docs/` still describe the old localStorage-only architecture. They haven't been updated to reflect the Supabase integration.
- `window.confirm()`/`alert()` are blocked inside artifact iframes — all confirmations use the custom `admConfirm()` modal.
- Photo input must NOT have `capture` attribute (forces camera only; without it, offers camera or gallery).
- The owner communicates in Spanish. All UI text, toasts, and admin labels are in Spanish.
- **Security note**: The anon key (`SB_KEY`) is embedded in client code (public by design). Regenerate it immediately after deploying RLS policies from migrations/. See Fase 1 in the security refactor plan.
