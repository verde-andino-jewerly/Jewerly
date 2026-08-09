# Modelo de datos

Estructura exacta de los datos que maneja el sistema.

---

## Almacenamiento

- **Base de datos:** Supabase (PostgreSQL).
- **Tabla principal:** `productos`.
- **Tabla de auditoría:** `productos_audit` (registra todos los cambios; ver [`../migrations/audit-table.sql`](../migrations/audit-table.sql)).
- **Bucket de storage:** `product-photos` (opcional; las fotos suelen ir embebidas en la fila como base64).

**Claves locales del navegador** (solo del dispositivo administrativo):

- `va_theme`: preferencia de tema (`light`/`dark`).
- `va_admin_pin_hash`, `va_admin_unlocked`: relacionadas con el acceso privado. **No documentadas públicamente.**

---

## Convención de nombres

- **JavaScript** usa `camelCase` (`medidaU`, `certNum`, `createdAt`).
- **PostgreSQL** usa `snake_case` (`medida_u`, `cert_num`, `created_at`).
- La conversión está en `sbToItem()` / `itemToSb()` dentro de `index.html`.

| JS field | DB column | Notas |
|----------|-----------|-------|
| `medidaU` | `medida_u` | Unidad: `talla` \| `cm` \| `mm` |
| `certNum` | `cert_num` | Número de certificado |
| `foto` | `foto_url` | Data URI base64 |
| `createdAt` | `created_at` | TIMESTAMPTZ, default `NOW()` |
| `updatedAt` | `updated_at` | TIMESTAMPTZ |

---

## Estructura de un producto

```js
{
  // ── Identificación ─────────────────────────────────────
  id:          "VA-001",          // string único, no cambia al editar

  // ── Estado de publicación ──────────────────────────────
  estado:      "publicado",       // "publicado" | "oculto" | "borrador"

  // ── Campos PÚBLICOS (visibles en la vitrina) ───────────
  categoria:   "Anillo",
  estilo:      "Solitario",
  metal:       "Oro",
  ley:         "18K (750)",
  color:       "Amarillo",
  genero:      "Mujer",
  piedras:     [ { tipo: "Esmeralda", qty: 1, ct: 0.85 } ],
  descripcion: "Anillo solitario con esmeralda ovalada",
  medida:      "7",
  medidaU:     "talla",
  certificado: "No",              // "Sí" | "No"
  precio:      4000000,           // COP, calculado server-side vía Edge Function
  foto:        "data:image/jpeg;base64,...",  // o null

  // ── Campos ADMINISTRATIVOS (NO expuestos en la vitrina) ─
  certNum:     "",
  proveedor:   "",
  costo:       2000000,           // COP
  margen:      100,               // porcentaje
  notas:       "",

  // ── Marcas de tiempo ───────────────────────────────────
  createdAt:   "2026-08-01T12:00:00Z",
  updatedAt:   "2026-08-01T12:00:00Z"
}
```

### Sub-objeto `piedras[]`

Cada piedra: `{ tipo, qty, ct }`.

- `tipo` (string): Esmeralda, Diamante, Tanzanita, Moisanita, Rubí, Zafiro, etc.
- `qty` (int): cantidad de piedras.
- `ct` (número): quilates.

> **Nota histórica:** una versión anterior usaba `cantidad`/`quilates`. La vitrina acepta ambos formatos por retrocompatibilidad; el formato actual es `qty`/`ct`.

---

## Clasificación de datos (privacidad)

| Nivel | Campos | Visibilidad |
|---|---|---|
| 🟢 **Público** | `id`, `categoria`, `estilo`, `metal`, `ley`, `color`, `genero`, `piedras`, `descripcion`, `medida`, `medidaU`, `certificado`, `precio`, `foto`, `createdAt` | Vitrina + API pública (via RLS) |
| 🔴 **Administrativo** | `costo`, `margen`, `proveedor`, `notas`, `certNum`, `updated_at` | Solo accesible con `x-admin-token` |
| 🔒 **Sensible** | Hash del PIN, tokens | Nunca en Supabase; solo en `localStorage` del dispositivo administrativo |

RLS enforcement: ver [`../migrations/rls-policies.sql`](../migrations/rls-policies.sql).

---

## Valores de `ley` según `metal`

| Metal | Leyes posibles |
|---|---|
| Oro | `18K (750)`, `14K (585)`, `24K (999.9)` |
| Plata | `925`, `950` |
| Oro laminado | `Laminado` |

En la vitrina, la ley se muestra "limpia" (ej. *Oro 18K*): el número entre paréntesis es interno.

---

## Estilos según `categoria`

| Categoría | Estilos |
|---|---|
| Anillo | Solitario, Tresillo, Eternidad, Liso, Compromiso, Matrimonio, Otro |
| Aretes | Topo, Gota, Argolla, Ear cuff, Colgante, Otro |
| Collar | Con dije, Cadena, Gargantilla, Choker, Otro |
| Pulsera | Tenis, Esclava, Cadena, Charm, Otro |
| Dije+cadena | Corazón, Cruz, Llave, Flor, Geométrico, Letra, Otro |
| Set | Anillo + Aretes, Collar + Aretes, Pulsera + Aretes, Otro |
| Ear cuff | Sencillo, Con piedra, Otro |
| Dije | Corazón, Cruz, Llave, Flor, Geométrico, Otro |

---

## Filtro de la vitrina

Aplicado por RLS en Supabase; la vitrina no puede leer productos que no cumplan:

1. `estado = 'publicado'`, **y**
2. `precio > 0`, **y**
3. `descripcion IS NOT NULL`.

Los productos en **oculto** o **borrador** quedan guardados pero no son visibles al público.

---

## Exportación

Desde el panel privado se exporta:

- **CSV** — para importar a Excel/Sheets (incluye datos administrativos). BOM UTF-8 para que Excel abra bien los acentos.
- **PDF** — catálogo visual con logo, foto, ID, descripción y precio (para clientes o impresión). Usa jsPDF (CDN, lazy-load).
