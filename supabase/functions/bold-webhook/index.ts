// Edge Function: bold-webhook
// Bold llama a este endpoint cuando el estado de un pago cambia.
// Verifica la firma del webhook, actualiza el pedido y envía el
// correo de confirmación al comprador.
//
// Secrets requeridos:
//   BOLD_WEBHOOK_SECRET     — clave para verificar que el llamado viene de Bold
//   RESEND_API_KEY          — para enviar correos (resend.com, plan gratuito disponible)
//   RESEND_FROM             — dirección remitente, ej: "Verde Andino <hola@verdeandino.app>"
//   SUPABASE_URL            — inyectado automáticamente
//   SUPABASE_SERVICE_ROLE_KEY — inyectado automáticamente
//
// URL que se configura en Bold Dashboard → Webhooks:
//   https://rbvqxrkzepthbbqzkbcg.supabase.co/functions/v1/bold-webhook

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Método no permitido', { status: 405 });
  }

  const body = await req.text();

  // Verificar firma Bold (X-Bold-Signature: SHA256(secret + body))
  const boldSig = req.headers.get('X-Bold-Signature') || '';
  const webhookSecret = Deno.env.get('BOLD_WEBHOOK_SECRET') || '';
  if (webhookSecret) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', encoder.encode(webhookSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
    );
    const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
    const sigHex = Array.from(new Uint8Array(sigBuffer))
      .map((b) => b.toString(16).padStart(2, '0')).join('');
    if (sigHex !== boldSig) {
      return new Response('Firma inválida', { status: 401 });
    }
  }

  let evento: Record<string, unknown>;
  try { evento = JSON.parse(body); } catch { return new Response('JSON inválido', { status: 400 }); }

  const referencia = String(evento.order_id || evento.orderId || '');
  const estadoBold = String(evento.status || evento.payment_status || '');
  if (!referencia || !estadoBold) return new Response('Campos faltantes', { status: 400 });

  // Mapear estado Bold → estado interno
  const nuevoEstado =
    estadoBold === 'APPROVED' || estadoBold === 'approved' ? 'pagado'
    : estadoBold === 'REJECTED' || estadoBold === 'rejected' || estadoBold === 'CANCELLED' ? 'cancelada'
    : null;

  if (!nuevoEstado) return new Response('Estado ignorado: ' + estadoBold, { status: 200 });

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Actualizar estado del pedido
  const { data: pedido, error: dbErr } = await sb
    .from('pedidos')
    .update({ estado: nuevoEstado })
    .eq('referencia_pago', referencia)
    .eq('estado', 'pendiente')  // solo actualizar si sigue pendiente
    .select('monto, comprador, items')
    .single();

  if (dbErr || !pedido) {
    // Puede que ya estuviera actualizado (Bold reintenta); no es error.
    return new Response('OK (sin cambio)', { status: 200 });
  }

  // Enviar correo solo si el pago fue aprobado
  if (nuevoEstado === 'pagado') {
    await enviarCorreoConfirmacion(pedido, referencia);
  }

  return new Response('OK', { status: 200 });
});

async function enviarCorreoConfirmacion(
  pedido: { monto: number; comprador: Record<string, string>; items: unknown[] },
  referencia: string,
) {
  const resendKey = Deno.env.get('RESEND_API_KEY');
  const emailFrom = Deno.env.get('RESEND_FROM') || 'Verde Andino Jewelry <hola@verdeandino.app>';
  if (!resendKey) return;  // Si no hay clave, omitir sin romper el flujo

  const { nombre, email } = pedido.comprador as Record<string, string>;
  if (!email) return;

  const monto = Number(pedido.monto).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f3f0;font-family:Georgia,serif;">
  <div style="max-width:540px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;">
    <div style="background:#1F6F4A;padding:28px 32px;text-align:center;">
      <p style="margin:0;color:#D4AF37;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">Verde Andino Jewelry</p>
      <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:400;">Pago confirmado</h1>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 16px;color:#333;font-size:15px;">Hola${nombre ? ' ' + nombre : ''},</p>
      <p style="margin:0 0 24px;color:#333;font-size:15px;">
        Tu pago de <strong>${monto}</strong> fue aprobado. Jhojan revisará tu pedido y te contactará pronto para coordinar el envío.
      </p>
      <div style="background:#f5f3f0;border-radius:6px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0 0 6px;font-size:11px;color:#888;letter-spacing:0.1em;text-transform:uppercase;">Referencia del pedido</p>
        <p style="margin:0;font-family:monospace;font-size:14px;color:#1F6F4A;">${referencia}</p>
      </div>
      <p style="margin:0 0 8px;color:#555;font-size:13px;">¿Tienes alguna pregunta? Escríbenos por WhatsApp:</p>
      <a href="https://wa.me/573185609592?text=Hola%2C+mi+pedido+es+${encodeURIComponent(referencia)}"
         style="display:inline-block;background:#25D366;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none;font-size:13px;font-family:Arial,sans-serif;">
        WhatsApp
      </a>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #eee;text-align:center;">
      <p style="margin:0;font-size:11px;color:#aaa;">Verde Andino Jewelry · Esmeraldas de Colombia</p>
    </div>
  </div>
</body>
</html>`;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + resendKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: emailFrom,
      to: [email],
      subject: 'Pago confirmado – Verde Andino Jewelry',
      html,
    }),
  });
}
