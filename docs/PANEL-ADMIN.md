# Panel de gestión (guía de uso)

Guía práctica del panel privado donde la dueña carga y administra los productos.

---

## 1. Cómo entrar

La vitrina es pública, pero el panel está **oculto**. Para abrirlo (funciona igual en **celular y computador**):

- **Opción A — Pulsación larga:** mantén presionado el **logo del pie de página** (abajo del todo) durante **~1 segundo**.
- **Opción B — 5 toques:** toca/clic **5 veces seguidas** (rápido) sobre ese mismo logo del pie.

Aparecerá la ventana del **PIN**:
- **Primera vez:** crea un PIN de **4 a 6 dígitos** (lo escribes dos veces para confirmar).
- **Siguientes veces:** ingresa tu PIN.
- **¿Olvidaste el PIN?:** hay un enlace para restablecerlo. Esto **no borra** tu catálogo, solo te deja crear un PIN nuevo.

> **Seguridad realista:** este mecanismo evita que un cliente casual encuentre o use el panel. No es seguridad de nivel bancario: al ser una página estática, alguien con conocimientos técnicos podría inspeccionar el código. Para el objetivo (que solo la dueña cargue productos), es suficiente. Si algún día se necesita seguridad fuerte, hay que migrar a un backend con login real (ver [`ARQUITECTURA.md`](ARQUITECTURA.md) → Evolución futura).

---

## 2. Cargar un producto nuevo

1. **Foto** (opcional pero recomendada): toca el recuadro de foto. El celular te deja elegir **Cámara** o **Galería**. La imagen se comprime automáticamente.
2. **ID**: se genera solo (`VA-001`, `VA-002`…). Puedes cambiarlo si quieres, salvo cuando estás editando.
3. **Estado de publicación**: elige Publicado / Oculto / Borrador (ver sección 5).
4. **Categoría** y **Estilo** (el estilo cambia según la categoría).
5. **Metal** y **Ley** (la ley cambia según el metal).
6. **Color** y **Género**.
7. **Piedras**: agrega tipo + cantidad + quilates. Puedes añadir varias con "+ Agregar piedra".
8. **Descripción**.
9. **Medida** (talla / cm / mm) — opcional.
10. **Certificado**: Sí/No; si es Sí, aparece el campo para el número.
11. **Información administrativa** (sección desplegable): proveedor, costo, margen (el **precio de venta se calcula solo**), notas. Estos datos **no** se muestran al cliente.
12. Toca **"Guardar en catálogo"**. El producto queda guardado y —si está *Publicado*— aparece de inmediato en la vitrina.

---

## 3. Editar un producto existente

En la sección **"Productos cargados"** (galería), cada producto tiene tres botones:
- **✎ Editar** — carga el producto en el formulario.
  - El **ID queda bloqueado**: al editar, el identificador único **no cambia**.
  - El título cambia a "Editar Producto" y aparece una barra con opción **Cancelar**.
  - Modifica lo que necesites y toca **"Guardar cambios"**.

---

## 4. Duplicar un producto

- **⧉ Duplicar** — crea una **copia** del producto con:
  - un **ID nuevo**,
  - estado **Borrador**,
  - todos los metadatos y variables copiados (categoría, metal, ley, color, piedras, etc.).
- Úsalo para crear variantes rápido (ej. el mismo anillo en otra talla o metal). Ajusta lo que cambie y guarda.

---

## 5. Estados de publicación

Cada producto tiene un estado. La vitrina **solo muestra los Publicados**.

| Estado | En la vitrina | Para qué sirve |
|---|---|---|
| 🟢 **Publicado** | Sí, visible | Producto a la venta, visible al cliente. |
| 🟡 **Oculto** | No | Retirarlo temporalmente de la vista **sin borrarlo** (ej. sin stock). |
| ⚪ **Borrador** | No | Trabajo en progreso, aún no listo para publicar. |

En la galería, cada producto muestra una **etiqueta de color** con su estado; los no publicados se ven atenuados.

---

## 6. Eliminar

- **✕ Eliminar** — pide confirmación en una ventana. Si confirmas, el producto se borra del catálogo (no se puede deshacer). Por eso, **exporta con frecuencia** (sección 7).

---

## 7. Exportar (respaldo)

En la sección **"Exportar"**:
- **⬇ Descargar CSV** — baja todo el catálogo como archivo `.csv` (se abre en Excel/Google Sheets, ideal para respaldar en Drive). Incluye todas las columnas, incluido el estado y los datos administrativos.
- **🖼 Descargar fotos** — descarga las fotos de los productos, cada una nombrada con su ID (`VA-001.jpg`, …), para archivarlas o insertarlas en el Excel maestro.

> **Recomendación:** exporta el CSV y las fotos periódicamente y guárdalos en Google Drive. Así, aunque se borren los datos del navegador, tienes un respaldo.

---

## 8. Cerrar el panel

Toca la **✕** en la esquina superior del panel para volver a la vitrina pública. Mientras no cierres el navegador, no te volverá a pedir el PIN.
