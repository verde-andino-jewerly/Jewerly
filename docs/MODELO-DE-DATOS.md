# Modelo de datos

Describe la estructura exacta de los datos que guarda el sistema. Útil para entender el CSV exportado, para migrar a un backend en el futuro, o para depurar.

---

## Almacenamiento

- **Dónde:** `localStorage` del navegador.
- **Clave:** `va_catalog_v3`
- **Contenido:** un objeto JSON:

```json
{
  "items": [ { /* producto */ }, { /* producto */ } ],
  "nextIdNum": 5
}
```

- `items`: lista de productos (ver estructura abajo).
- `nextIdNum`: siguiente número correlativo para autogenerar el ID (`VA-005`, etc.).

Otras claves relacionadas:
- `va_admin_pin_hash`: hash SHA‑256 del PIN de acceso al panel (no el PIN en texto).
- `va_theme`: preferencia de tema (`light`/`dark`), si el usuario la cambió.
- `va_admin_unlocked` (en `sessionStorage`, no `localStorage`): marca que la sesión actual ya ingresó el PIN.

---

## Estructura de un producto (`item`)

```js
{
  // ── Identificación ──────────────────────────────────────────────
  id:          "VA-001",          // string único. NO cambia al editar.

  // ── Estado de publicación ───────────────────────────────────────
  estado:      "publicado",       // "publicado" | "oculto" | "borrador"
                                  //  (si falta, se asume "publicado")

  // ── Campos PÚBLICOS (los usa la vitrina) ────────────────────────
  categoria:   "Anillo",          // Anillo, Aretes, Collar, Pulsera, Dije+cadena, Set, Ear cuff, Dije, Otra
  estilo:      "Solitario",       // depende de la categoría
  metal:       "Oro",             // Oro | Plata | Oro laminado
  ley:         "18K (750)",       // depende del metal (ver abajo)
  color:       "Amarillo",        // Amarillo | Blanco | Rosado | Bicolor
  genero:      "Mujer",           // Mujer | Hombre | Unisex
  piedras:     [                  // lista de piedras
    { tipo: "Esmeralda", qty: 1, ct: 0.85 }
  ],
  descripcion: "Anillo solitario con esmeralda ovalada",
  medida:      "7",               // valor de la talla/medida
  medidaU:     "talla",           // "talla" | "cm" | "mm" | ""
  certificado: "No",              // "Sí" | "No"
  precio:      4000000,           // precio de venta en COP (calculado: costo × (1 + margen/100))
  foto:        "data:image/jpeg;base64,...",  // o null si no hay foto

  // ── Campos ADMINISTRATIVOS (internos; la vitrina NO los muestra) ─
  certNum:     "",                // número de certificado
  proveedor:   "",                // proveedor interno
  costo:       2000000,           // costo real en COP
  margen:      100,               // porcentaje de margen
  notas:       "",                // notas internas

  // ── Marcas de tiempo ────────────────────────────────────────────
  createdAt:   1723100000000,     // Date.now() de creación (se conserva al editar)
  updatedAt:   1723100050000      // Date.now() de la última modificación
}
```

### Sub‑objeto `piedras[]`
Cada piedra tiene:
- `tipo` (string): Esmeralda, Diamante, Tanzanita, Moisanita, Rubí, Zafiro, etc.
- `qty` (número entero): cantidad de piedras de ese tipo.
- `ct` (número): quilates (carats).

> Nota histórica: una versión anterior del cargador guardaba `cantidad`/`quilates` en vez de `qty`/`ct`. La vitrina acepta **ambos** formatos por retrocompatibilidad, pero el formato actual y correcto es `qty`/`ct`.

---

## Valores de `ley` según `metal`

| Metal | Leyes posibles |
|---|---|
| Oro | `18K (750)`, `14K (585)`, `24K (999.9)` |
| Plata | `925`, `950` |
| Oro laminado | `Laminado` |

En la vitrina, la ley se muestra "limpia" (ej. *Oro 18K*): el número entre paréntesis se usa internamente pero no se muestra al cliente.

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

## Filtro que aplica la vitrina

La vitrina solo muestra un producto si:
1. `estado === "publicado"` (o no tiene estado → se asume publicado), **y**
2. tiene `precio > 0`, **y**
3. tiene `descripcion`.

Los productos en **oculto** o **borrador** quedan guardados pero **no** se muestran al cliente.

---

## Columnas del CSV exportado

Orden de columnas al exportar (una fila por producto, la foto no se incluye en el CSV):

`ID, Estado, Línea, Categoría, Estilo, Metal, Ley, Color, Piedra(s), Descripción, Género, Talla/Medida, Costo (COP), Margen (%), Precio venta (COP), Certificado, Núm. Certificado, Proveedor, Notas`

La columna **Piedra(s)** combina las piedras en texto, ej.: `Esmeralda x2 0.3ct | Diamante 0.1ct`.

El archivo lleva un BOM UTF‑8 para que Excel abra bien los acentos.
