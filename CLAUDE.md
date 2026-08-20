# CLAUDE.md — vitrina

Este repositorio contiene **la vitrina** de Verde Andino Jewelry:
`index.html`, un solo archivo con el catálogo público y, escondido dentro, el
cargador de productos.

> **La documentación del ecosistema vive en la carpeta padre**, fuera de este
> repositorio, porque cubre las dos aplicaciones (vitrina y panel):
>
> - `../MANUAL.md` — cómo se opera todo
> - `../TRAMPAS.md` — errores ya cometidos, leer antes de tocar código
> - `../REFERENCIA-TECNICA.md` — modelo de datos, seguridad, contabilidad
> - `../CLAUDE.md` — el mapa general
>
> Si estás viendo solo este repositorio clonado de GitHub, no tienes esos
> archivos: el proyecto completo está en el computador del dueño.

---

## Lo propio de este repositorio

**Se publica solo.** Un `git push` a `main` actualiza
https://verdeandino.app en uno o dos minutos, vía GitHub Pages. El archivo
`CNAME` fija el dominio.

**El panel NO se publica desde aquí.** `panel-deploy.html` en esta carpeta es
solo una **copia de respaldo** del panel, que se genera sola. No editarla: la
fuente está en la raíz del proyecto y se publica en Vercel con
`node herramientas/desplegar.js`.

**Estructura:**

```
index.html          la vitrina (~1,3 MB, todo embebido en base64)
panel-deploy.html   copia de respaldo del panel. No editar.
CNAME               verdeandino.app
docs/               historia y decisiones
docs-privado/       acceso al cargador y respaldos SQL. NO se versiona.
supabase/           Edge Function del cálculo de precio
```

**Dónde está cada cosa en `index.html`** (un solo `<script>`; los números de
línea se corren, buscar por nombre):

| Qué | Funciones |
|---|---|
| Configuración de Supabase | `SB_URL`, `SB_KEY`, `SB_TOKEN_SALT`, `sbGetAdminToken` |
| Conversión de datos | `sbToItem`, `itemToSb` |
| Lectura pública | `sbFetchPublic` — lista explícita de columnas, sin costo ni proveedor |
| Lectura de administrador | `sbFetchAdmin` — todas las columnas, exige token |
| Escrituras | `sbUpsert`, `sbDeleteItem` |
| Entrada al cargador | `admShowGate`, `admCheckPin`, `admProbeAuth` |
| Límite de intentos | `admIsLocked`, `admRecordFail`, `admRecordSuccess` |
| Historial de un producto | `admHistorialProducto` |

**Git:** el correo debe ser la dirección privada de GitHub, porque la cuenta
tiene la privacidad de correo activada:

```bash
git config user.email "314420579+verde-andino-jewerly@users.noreply.github.com"
```
