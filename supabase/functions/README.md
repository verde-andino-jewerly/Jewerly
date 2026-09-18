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

**Proposito:** Evitar que costos y margenes viajen en solicitudes del cliente.

### Endpoint

POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/calculate-price

### Request

{ "costo": 2000000, "margen": 100 }

### Response

{ "precio": 4000000 }

### Formula

precio = costo x (1 + margen/100)

Ejemplo:
- costo: 2,000,000 COP
- margen: 100% (doblar el precio)
- precio: 4,000,000 COP

## Como deployar en Supabase

### Opcion 1: MCP de Supabase desde Claude Code (recomendado)

Con el MCP de Supabase conectado en Claude Code, se despliega directamente
pasando el contenido del archivo index.ts. No requiere CLI ni acceso al dashboard.

### Opcion 2: CLI

    npm install -g supabase
    supabase functions deploy calculate-price
    supabase functions list

### Opcion 3: Dashboard Supabase

1. Ve a Edge Functions en el dashboard
2. Click en "Create a new function"
3. Nombre: calculate-price
4. Copia todo el contenido de index.ts en el editor
5. Click Deploy

## CORS y x-admin-token — regla obligatoria

El panel manda x-admin-token en cada peticion. Las Edge Functions deben
incluirlo en Access-Control-Allow-Headers de la respuesta OPTIONS, o el
navegador bloqueara la peticion antes de enviarla.

Plantilla base para toda Edge Function nueva:

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-token',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    }

    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

Ver trampa 18 en TRAMPAS.md del proyecto principal.
