# Desplegar en la web (para el lanzamiento)

`index.html` es autosuficiente (no depende de nada externo), así que publicarlo es sencillo. Aquí tres caminos, de más simple a más flexible. Elige uno.

---

## Opción 1 — GitHub Pages (gratis, integrado con este repositorio)

Ideal porque el código ya está aquí.

1. Sube este repositorio a GitHub (ver el `README` principal / el commit ya está hecho).
2. En GitHub, entra al repositorio → **Settings** (Configuración) → **Pages** (en el menú lateral).
3. En **"Build and deployment" → "Source"**, elige **"Deploy from a branch"**.
4. En **"Branch"**, elige `main` y carpeta `/ (root)`. Guarda.
5. Espera 1–2 minutos. GitHub te dará una URL del tipo:
   `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`
6. Esa URL es tu vitrina pública. El panel oculto se accede igual (pulsación larga / 5 toques + PIN).

> Como `index.html` está en la raíz del repo, GitHub Pages lo sirve automáticamente como página principal.

**Dominio propio (opcional):** en Settings → Pages → "Custom domain" puedes conectar un dominio como `verdeandino.com` si lo compras. GitHub tiene guías para apuntar el DNS.

---

## Opción 2 — Netlify (gratis, muy fácil, permite dominio propio)

Sin necesidad de saber comandos:

1. Entra a [netlify.com](https://www.netlify.com) y crea una cuenta (gratis).
2. Opción rápida ("drag & drop"): busca **"Deploy manually"** / **"Add new site" → "Deploy manually"**.
3. Arrastra el archivo `index.html` (o toda la carpeta del repo) a la zona indicada.
4. Netlify publica el sitio y te da una URL tipo `https://algo-al-azar.netlify.app`.
5. Puedes cambiar el nombre del sitio y conectar un **dominio propio** desde el panel de Netlify.

Ventaja: actualizar es volver a arrastrar el archivo nuevo.

---

## Opción 3 — Vercel (gratis, conecta el repositorio)

1. Entra a [vercel.com](https://vercel.com) y crea cuenta (puedes usar tu cuenta de GitHub).
2. **"Add New… → Project"** e importa este repositorio de GitHub.
3. Como es un sitio estático (solo HTML), Vercel lo detecta y publica sin configuración.
4. Te da una URL tipo `https://verde-andino.vercel.app` y permite dominio propio.

---

## ¿Cuál elegir?

| Necesidad | Recomendación |
|---|---|
| Lo más rápido y ya está el código aquí | **GitHub Pages** |
| Arrastrar y soltar, sin comandos | **Netlify** |
| Conectar el repo y que se actualice solo con cada cambio | **Vercel** o **GitHub Pages** |

---

## Cómo actualizar el sitio después de un cambio

1. Reemplaza el `index.html` por la versión nueva (o haz `git push` si usas GitHub Pages/Vercel conectados al repo).
2. En GitHub Pages/Vercel, el sitio se reconstruye solo en 1–2 minutos.
3. En Netlify (modo manual), vuelve a arrastrar el archivo.
4. En el celular, recarga con caché limpia (o cierra y abre el navegador) para ver la versión nueva.

---

## Nota sobre los datos al desplegar en web

Recuerda: el catálogo se guarda en `localStorage` **del navegador de cada visitante/dispositivo**.
- Los **clientes** que visiten la web pública **no** verán productos a menos que la dueña haya cargado el catálogo **en ese mismo navegador**… 

  👉 **Importante:** por esto, con la arquitectura actual, la web publicada mostraría productos solo en el dispositivo donde se cargaron. Para una vitrina pública real y compartida (que todos los visitantes vean el mismo catálogo), se necesita **hornear los productos en el archivo** o migrar a un **backend**. Ver [`ARQUITECTURA.md`](ARQUITECTURA.md) → "Evolución futura" y consultar antes de lanzar públicamente.

Mientras tanto, el sistema es perfecto como **catálogo personal / demostración en un dispositivo** y como base lista para conectarse a un backend.
