// Edge Function: bold-firmar
// Recibe una referencia de pedido, calcula el monto real desde la base,
// firma con HMAC-SHA256 según la especificación de Bold y devuelve los
// datos que el frontend necesita para inicializar BoldCheckout.
//
// Secrets requeridos en Supabase (Dashboard → Edge Functions → Secrets):
//   BOLD_API_KEY        — clave pública de Bold (va al frontend via esta respuesta)
//   BOLD_INTEGRITY_KEY  — clave privada para firmar (nunca sale del servidor)
//   SUPABASE_URL        — se inyecta automáticamente
//   SUPABASE_SERVICE_ROLE_KEY — se inyecta automáticamente

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CURRENCY = 'COP';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'content-type, apikey, authorization',
      },
    });
  }

  try {
    const { referencia } = await req.json();
    if (!referencia) return error('Falta referencia', 400);

    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: pedido, error: dbErr } = await sb
      .from('pedidos')
      .select('monto, estado')
      .eq('referencia_pago', referencia)
      .single();

    if (dbErr || !pedido) return error('Pedido no encontrado', 404);
    if (pedido.estado !== 'pendiente') return error('Pedido ya procesado', 409);

    const apiKey = Deno.env.get('BOLD_API_KEY');
    const integrityKey = Deno.env.get('BOLD_SECRET_KEY');
    if (!apiKey || !integrityKey) return error('Pasarela no configurada', 500);

    // Firma Bold: SHA256(orderId + amount + currency + integrity_key)
    const mensaje = referencia + pedido.monto + CURRENCY + integrityKey;
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(mensaje));
    const signature = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return new Response(
      JSON.stringify({
        apiKey,
        referencia,
        amount: pedido.monto,
        currency: CURRENCY,
        signature,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    );
  } catch (e) {
    return error(String(e), 500);
  }
});

function error(msg: string, status: number) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
