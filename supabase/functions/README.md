# Supabase Edge Functions — Verde Andino Jewelry

## `bold-firmar` y `bold-webhook`

Checkout con carrito de la vitrina (Fase 1), pasarela **Bold**.

- **`bold-firmar`**: llamada por la vitrina (llave `anon`) antes de abrir el
  checkout. Lee el monto real de `ventas` (nunca del navegador) y devuelve la
  firma de integridad `SHA256(referencia + monto + moneda + llave_secreta)`
  que exige Bold, junto con la llave de identidad publica.
- **`bold-webhook`**: recibe el aviso de Bold cuando el pago se resuelve.
  Valida la firma HMAC-SHA256 del evento (`x-bold-signature`) y llama a
  `confirmar_pago_web`/`cancelar_pago_web` con la llave `service_role`. Es la
  unica fuente de verdad del pago -- la redireccion del navegador de vuelta a
  la vitrina se puede interrumpir o falsificar, este webhook no.

Ambas requieren los secrets `BOLD_API_KEY` y `BOLD_SECRET_KEY` configurados en
Supabase -> Edge Functions -> Secrets (nunca en codigo, chat ni documentacion).
Detalle completo del modelo de datos en `../../REFERENCIA-TECNICA.md`
(seccion Pedidos web), en la raiz del proyecto.

## `calculate-price`

Calcula el precio de venta a partir de costo y margen, en el servidor.

**Propósito:** Evitar que costos y márgenes viajen en solicitudes del cliente.

### Endpoint

```
POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/calculate-price
```

### Request

```json
{
  "costo": 2000000,
  "margen": 100
}
```

### Response

```json
{
  "precio": 4000000
}
```

### Fórmula

```
precio = costo × (1 + margen/100)
```

Ejemplo:
- costo: 2,000,000 COP
- margen: 100% (doblar el precio)
- precio: 4,000,000 COP

## Cómo deployar en Supabase

### Opción 1: CLI (recomendado)

```bash
# Instalar Supabase CLI (si no está)
npm install -g supabase

# Desde la raíz del repo
supabase functions deploy calculate-price

# Verificar que está deployada
supabase functions list
```

### Opción 2: Dashboard Supabase

1. Ve a **Edge Functions** en el dashboard
2. Click en **"Create a new function"**
3. Nombre: `calculate-price`
4. Copia todo el contenido de `index.ts` en el editor
5. Click **Deploy**

### Autenticación

La función está públicamente accesible (no requiere API key). Para restringir:

Agregar validación en la función:
```typescript
const token = req.headers.get('x-admin-token')
if (token !== 'VDA_ADMIN_SECRET') {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
}
```

## Cómo usar desde index.html

```javascript
function sbCalculatePrice(costo, margen, cb) {
  var url = 'https://PROJECT_ID.supabase.co/functions/v1/calculate-price';
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ costo: costo, margen: margen })
  })
    .then(function(r) { return r.json(); })
    .then(function(data) { if (cb) cb(data.precio); })
    .catch(function(e) { console.error('Error:', e); if (cb) cb(0); });
}

// Uso:
sbCalculatePrice(2000000, 100, function(precio) {
  console.log('Precio calculado:', precio);
});
```

Reemplaza `PROJECT_ID` con tu ID real (encuentra en Supabase Settings → General).
