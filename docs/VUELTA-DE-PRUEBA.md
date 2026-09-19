# Vuelta de prueba — Verde Andino Jewelry

Guía para verificar el ecosistema completo por tus propios medios, sin
terminal ni SQL. Todo se hace desde el navegador, el panel y el dashboard
de Bold.

Marca cada casilla al pasar. Si algo no coincide con lo esperado, anota el
número del paso y qué viste — eso es lo único que necesito para
diagnosticar.

**Tiempo estimado:** 45–60 minutos.
**Costo:** una compra de prueba con el monto mínimo que acepte Bold. Se
reembolsa en el bloque 7, pero ten en cuenta que la comisión de la pasarela
puede no devolverse.

---

## Antes de empezar

Ten a mano:

- El navegador en el computador (Chrome o Edge) y el celular.
- Acceso al panel (Vercel) con tu PIN.
- Acceso al dashboard de Bold.
- Una tarjeta real para la compra de prueba.
- Tu correo, para ver llegar el email de confirmación.

---

## Bloque 0 — Preparar la pieza de prueba

Se hace desde el **panel**, no desde la vitrina.

- [ ] **0.1** Entra al panel y crea una pieza nueva con estos datos:
  - Descripción: `PRUEBA - no comprar`
  - Categoría: la que quieras
  - Precio: el **mínimo que acepte Bold** (prueba con `1000`; si Bold lo
    rechaza al pagar, súbelo a `5000`)
  - Costo: `500`
  - Stock: `1`
  - Foto: cualquiera, hace falta para que se vea la tarjeta
  - Estado: `publicado`
- [ ] **0.2** Anota el **ID** que le quedó a la pieza. Lo vas a necesitar
  varias veces. ID: `________________`

> Si el panel no te deja poner `stock`, avísame: significa que el input no
> quedó en el editor y hay que agregarlo.

---

## Bloque 1 — Vitrina pública (sin gastar)

Todo en `https://verdeandino.app`. Abre en **ventana de incógnito** para
partir limpio.

- [ ] **1.1** El catálogo carga y se ven las piezas con foto y precio.
- [ ] **1.2** Tu pieza `PRUEBA - no comprar` aparece en el catálogo.
- [ ] **1.3** La pieza de prueba muestra el chip verde **"Última pieza
  disponible"** (porque tiene `stock=1` y nadie la ha comprado).
- [ ] **1.4** El buscador filtra: escribe `prueba` y solo queda esa pieza.
  Borra el texto y vuelven todas.
- [ ] **1.5** Los filtros de categoría (las pastillas de arriba) funcionan
  al hacer clic.
- [ ] **1.6** Abre el panel de filtros avanzados y prueba: rango de precio,
  metal, piedra, "solo ofertas". El catálogo responde a cada uno.
- [ ] **1.7** "Limpiar filtros" devuelve el catálogo completo.
- [ ] **1.8** Haz clic en una pieza: abre la ficha con carrusel de fotos,
  descripción y precio.
- [ ] **1.9** Con la ficha abierta, mira la barra de direcciones: debe
  terminar en **`?p=` seguido del ID** de esa pieza.
- [ ] **1.10** Copia esa URL, ábrela en otra pestaña: debe abrir
  **directamente** la ficha de esa pieza.
- [ ] **1.11** Cierra la ficha con la tecla **Escape**: se cierra y la URL
  vuelve a `verdeandino.app` sin el `?p=`.
- [ ] **1.12** Marca una pieza como favorita (el corazón), recarga la
  página: el corazón sigue marcado.
- [ ] **1.13** En filtros avanzados, activa "solo favoritos": el catálogo
  queda solo con las marcadas.
- [ ] **1.14** Agrega dos piezas distintas al carrito. El número junto a la
  bolsa (arriba a la derecha) sube a **2**.
- [ ] **1.15** Abre el carrito y sube la cantidad de una pieza a 3. El
  contador de la bolsa y el total se actualizan.
- [ ] **1.16** Quita una pieza del carrito. El total baja.
- [ ] **1.17** Recarga la página: el carrito conserva lo que quedó.
- [ ] **1.18** **Prueba en el celular**: entra a `verdeandino.app`, revisa
  que no haya botones montados uno sobre otro en la esquina superior
  derecha (idioma, bolsa, tema) y que el catálogo se vea en una o dos
  columnas sin desbordarse.

---

## Bloque 2 — Idioma ES / EN

- [ ] **2.1** Arriba a la derecha está el selector **ES · EN**. Haz clic en
  `EN`.
- [ ] **2.2** El texto grande del inicio cambia a inglés.
- [ ] **2.3** Baja hasta la sección de **preguntas frecuentes**: las
  preguntas y las respuestas están en inglés (no solo los títulos).
- [ ] **2.4** Baja hasta la sección de **esmeraldas** (Muzo / Chivor /
  Coscuez): la región y los datos de cada mina están en inglés.
- [ ] **2.5** Con el idioma en `EN`, haz clic en la pestaña **Chivor** y
  luego **Coscuez**: el contenido de cada una sigue en inglés.
- [ ] **2.6** Vuelve a `ES`: todo regresa a español, incluidas las minas.
- [ ] **2.7** Recarga la página: se mantiene el idioma que dejaste.

---

## Bloque 3 — Legal

- [ ] **3.1** Al pie de la página hay **4 enlaces**: Términos y condiciones ·
  Tratamiento de datos personales · Derecho de retracto y garantía ·
  **Cookies**.
- [ ] **3.2** Cada uno abre su ventana con el texto correspondiente.
- [ ] **3.3** La de **Cookies** menciona que la analítica es sin cookies y
  que no hay Meta Pixel ni Google Ads.
- [ ] **3.4** Cierra cada ventana con **Escape**.
- [ ] **3.5** Abre el carrito y dale a continuar hacia el checkout: antes
  del botón de pago hay un **aviso de datos** con enlaces a Términos y a
  Tratamiento de datos, y esos enlaces abren las ventanas.
- [ ] **3.6** Abre el formulario de **encargo personalizado**: también
  tiene su aviso de datos con enlaces funcionando.
- [ ] **3.7** En inglés (`EN`), los 4 enlaces del pie aparecen traducidos
  (Terms and conditions / Personal data policy / Refund and warranty /
  Cookies). El texto legal en sí se queda en español, eso es correcto: la
  versión válida en Colombia es la española.

---

## Bloque 4 — Encargo personalizado

- [ ] **4.1** Abre el formulario de encargo desde su sección.
- [ ] **4.2** Llénalo completo y envía.
- [ ] **4.3** Se abre WhatsApp con un mensaje **ya armado** que incluye lo
  que escribiste, ordenado por campos.
- [ ] **4.4** No envíes el mensaje, solo verifica que el texto esté
  completo. Cierra WhatsApp.

---

## Bloque 5 — Compra real de prueba

Aquí se gasta plata de verdad (el mínimo). Se reembolsa en el bloque 7.

- [ ] **5.1** Vacía el carrito.
- [ ] **5.2** Agrega **solo** la pieza `PRUEBA - no comprar`.
- [ ] **5.3** Ve al checkout y llena los datos con **tu correo real** —
  ahí llega el email de confirmación.
- [ ] **5.4** Confirma. Se abre el widget de pago de Bold.
- [ ] **5.5** Paga con tu tarjeta.
- [ ] **5.6** Al volver, la página muestra **"¡Pago confirmado!"** con:
  - [ ] La **referencia** visible (anótala: `________________`)
  - [ ] Un botón de **WhatsApp** que al tocarlo abre un mensaje con esa
        referencia ya escrita
  - [ ] Tres piezas recomendadas abajo (cross-sell)
- [ ] **5.7** Haz clic en una recomendación: abre su ficha.
- [ ] **5.8** Cierra y verifica que la URL ya **no** tenga `?pedido=`.

> **Si en vez de "¡Pago confirmado!" ves el círculo girando por más de dos
> minutos:** anótalo y sigue. Significa que el aviso de Bold no llegó y hay
> que revisar el webhook.

---

## Bloque 6 — Email de confirmación

- [ ] **6.1** Revisa tu bandeja de entrada. En **1–2 minutos** debe llegar
  un correo de **Verde Andino** desde `pedidos@verdeandino.app`.
- [ ] **6.2** Si no está en la bandeja, mira en **spam / promociones**.
  Anota dónde cayó — eso importa.
- [ ] **6.3** El correo trae:
  - [ ] Tu nombre
  - [ ] La referencia del pedido
  - [ ] La tabla con la pieza, cantidad y total
  - [ ] Los "próximos pasos"
  - [ ] El botón de WhatsApp
- [ ] **6.4** Responde el correo: debe salir dirigido a
  `contacto@verdeandino.app`.

---

## Bloque 7 — Stock y doble venta

La pieza que compraste tenía `stock=1`, así que ya debe estar agotada.

- [ ] **7.1** Abre `verdeandino.app` en una **ventana de incógnito nueva**.
- [ ] **7.2** Busca `PRUEBA`: la pieza **ya no aparece** en el catálogo
  (se ocultó sola al confirmarse el pago).
- [ ] **7.3** Abre la URL directa de la pieza (`verdeandino.app/?p=` + el
  ID del paso 0.2): no debe dejar comprarla.

Ahora la prueba de doble venta:

- [ ] **7.4** En el panel, crea otra pieza igual: `PRUEBA 2 - no comprar`,
  precio mínimo, **stock `1`**, publicada.
- [ ] **7.5** Abre la vitrina en **dos navegadores distintos** (por
  ejemplo Chrome en el computador y el navegador del celular).
- [ ] **7.6** En ambos, agrega `PRUEBA 2` al carrito y llega hasta el
  checkout, **sin** confirmar todavía.
- [ ] **7.7** Confirma en el **primero**. Debe abrir Bold normalmente.
  **No pagues**, solo verifica que abrió.
- [ ] **7.8** Ahora confirma en el **segundo**. Debe mostrar un **error
  diciendo que la pieza ya está reservada o vendida**, y no abrir Bold.
- [ ] **7.9** Cierra ambos sin pagar.

> El paso 7.8 es el importante: antes de esta corrección, dos personas
> podían pagar la misma pieza única al mismo tiempo.

---

## Bloque 8 — Reembolso

Se dispara desde el **dashboard de Bold**, no desde el panel.

- [ ] **8.1** Entra al dashboard de Bold y busca la transacción del
  bloque 5 (usa la referencia del paso 5.6).
- [ ] **8.2** Anula / reembolsa esa transacción.
- [ ] **8.3** Espera **2–3 minutos**.
- [ ] **8.4** Abre `verdeandino.app` en incógnito y busca `PRUEBA`: la
  pieza `PRUEBA - no comprar` debe **volver a aparecer** en el catálogo,
  con el chip verde **"Última pieza disponible"**.
- [ ] **8.5** En el panel, busca esa venta: su estado debe decir
  **`reembolsado`**.

> Si la pieza no reaparece a los 5 minutos, anótalo. Significa que el aviso
> de anulación de Bold no llegó o que el evento vino con otro nombre.

---

## Bloque 9 — Buscadores y analítica

- [ ] **9.1** Abre `verdeandino.app/sitemap.xml`: debe mostrar una lista de
  direcciones, sin error.
- [ ] **9.2** Abre `verdeandino.app/robots.txt`: debe mencionar el sitemap.
- [ ] **9.3** En Google Search Console, revisa que el sitemap siga en estado
  **correcto** (no "no se pudo leer").
- [ ] **9.4** Comparte por WhatsApp (a ti mismo) el enlace de una pieza
  (`verdeandino.app/?p=` + un ID): debe mostrar **foto y descripción** en la
  vista previa, no solo el enlace pelado.
- [ ] **9.5** En el panel de Cloudflare Web Analytics, revisa que estén
  contando las visitas de hoy — las tuyas de esta vuelta deben aparecer.

> Si **9.5** sale en cero: falta reemplazar el token de Cloudflare en la
> vitrina. Es un pendiente conocido, avísame y lo pongo.

---

## Bloque 10 — Limpieza

- [ ] **10.1** En el panel, borra las piezas `PRUEBA - no comprar` y
  `PRUEBA 2 - no comprar`.
- [ ] **10.2** Borra o marca como cancelada la venta de prueba que quedó
  del paso 7.7 (la que abrió Bold pero no se pagó).
- [ ] **10.3** Verifica en la vitrina que ya no aparezca ninguna pieza de
  prueba.

---

## Qué reportarme

Para cada paso que no haya salido como dice arriba:

1. El **número del paso** (por ejemplo `7.8`).
2. **Qué viste** en su lugar.
3. Si fue en la vitrina: una **captura de pantalla**.
4. Si el paso involucraba un pago: la **referencia**.

Con eso puedo reproducir y arreglar sin pedirte más datos.
