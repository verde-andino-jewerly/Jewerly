# Historial del proyecto y decisiones

Registro de lo que se ha construido y por qué. Sirve como memoria del proyecto.

---

## Componentes construidos

### 1. Sitio principal — `index.html` (vitrina + panel)
La pieza central. Empezó como dos cosas separadas (una vitrina pública y un "cargador de productos") y se **fusionaron en un solo archivo** para resolver un problema real: dos páginas separadas no comparten `localStorage`, así que los productos cargados no aparecían en la vitrina. Al unirlas, comparten datos y se sincronizan solas.

Evolución de funcionalidades:
- Vitrina pública con colección, filtros, fichas de producto, WhatsApp, sección educativa de las minas (Muzo, Chivor, Coscuez) con fotos reales.
- Panel de gestión oculto (acceso por gesto + PIN).
- Carga de productos con foto (cámara o galería), ID automático, metal/ley/piedras/etc.
- **Edición** de productos conservando el ID único.
- **Duplicar** productos (crea copia en borrador con ID nuevo).
- **Estados de publicación**: publicado / oculto / borrador (la vitrina solo muestra publicados).
- Exportación a CSV y descarga de fotos por ID.

### 2. Herramientas internas (`herramientas/`)
- **Calculadora de aleaciones**: cálculo de aleaciones de metales.
- **Control financiero**: costos y márgenes.
- **Roadmap de lanzamiento**: hoja de ruta del proyecto.

---

## Decisiones técnicas clave

1. **Un solo archivo, sin dependencias externas.** Autosuficiencia, funciona offline, compatible con entornos restringidos. Costo: archivo grande (~1.3 MB) por imágenes embebidas.

2. **Datos en `localStorage` (`va_catalog_v3`).** Local‑first. Simple y sin servidor. Limitación: no se comparte entre dispositivos.

3. **Vitrina y panel en el mismo origen.** Necesario para compartir `localStorage`.

4. **Acceso al panel por gesto + PIN.** Gesto: pulsación larga (~1 s) o 5 toques sobre el logo del pie. PIN: hash SHA‑256 en `localStorage`. Pensado para funcionar en **celular y computador**. Es una barrera contra el cliente casual, no seguridad fuerte.

5. **Modal de confirmación propio en vez de `window.confirm()`.** Porque `confirm()`/`alert()` están bloqueados dentro del iframe *sandbox* de los artefactos (faltaba `allow-modals`), lo que hacía que "eliminar" no funcionara en móvil.

6. **Foto sin `capture`.** Se quitó `capture="environment"` para que el celular ofrezca **cámara o galería**, en vez de forzar la cámara.

7. **Retrocompatibilidad de piedras (`qty`/`ct` vs `cantidad`/`quilates`).** La vitrina acepta ambos formatos.

---

## Problemas resueltos (bitácora)

- **Los productos cargados no aparecían en la vitrina** → causa: `localStorage` aislado entre artefactos separados → solución: fusionar en un solo archivo.
- **Piedras sin cantidad/quilates en la vitrina** → desajuste de nombres de campo → solución: aceptar ambos formatos.
- **No se podía acceder al panel desde el celular** → los 5 toques eran difíciles y el parámetro de URL no llegaba al iframe → solución: añadir pulsación larga y listeners táctiles robustos.
- **No se podía eliminar desde el celular** → `confirm()` bloqueado en el iframe → solución: modal propio.
- **La foto solo abría la cámara** → atributo `capture` → solución: quitarlo.
- **Mojibake (acentos corruptos) al inyectar el logo con PowerShell** → solución: leer/escribir con UTF‑8 sin BOM explícito.

---

## Datos de referencia de la marca

- Esmeraldas de Muzo, Chivor y Coscuez (Boyacá / Cundinamarca, Colombia).
- WhatsApp: +57 318 093 5276
- Instagram: @verde.andino.jewelry
- TikTok: @Verde.Andino.Jewerly

---

## Pendientes / ideas a futuro

- **Backend en la nube** (Supabase/Firebase) para catálogo único compartido y respaldo automático — es el siguiente gran paso si se quiere una vitrina pública real donde todos los visitantes vean el mismo catálogo. Ver [`ARQUITECTURA.md`](ARQUITECTURA.md) y [`DESPLIEGUE-WEB.md`](DESPLIEGUE-WEB.md).
- Otras herramientas del roadmap: compras y proveedores, generador de publicaciones para redes, inventario, kit de marca.
