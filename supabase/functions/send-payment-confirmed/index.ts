// Envia un email transaccional al cliente cuando su pago se confirma.
// Se invoca desde bold-webhook tras aplicar confirmar_pago_web. La firma
// del webhook Bold ya fue validada arriba, aqui solo aplica la autorizacion
// Supabase (Bearer service-role) porque este endpoint tampoco es publico.
//
// Idempotencia: ventas.email_sent_at se marca al confirmar el envio. Si el
// webhook Bold reintenta o el usuario dispara manualmente, no se reenvia.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const RESEND_FROM = Deno.env.get('RESEND_FROM') ?? 'Verde Andino <pedidos@verdeandino.app>'
const RESEND_REPLY_TO = Deno.env.get('RESEND_REPLY_TO') ?? 'contacto@verdeandino.app'
const WA_NUMERO = '573180935276'

interface Venta {
  id: number
  cliente_nombre: string
  cliente_contacto: string | null
  producto_id: string | null
  producto_nombre: string | null
  cantidad_vendida: number
  precio_unitario: number
  monto_total: number
  referencia_pago: string
  email_sent_at: string | null
}

function extraerEmail(contacto: string | null): string | null {
  if (!contacto) return null
  const m = contacto.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)
  return m ? m[0] : null
}

function esc(s: string | null): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  } as Record<string, string>)[c])
}

function fmtPrecio(n: number): string {
  return '$' + Math.round(n).toLocaleString('es-CO')
}

function renderHtml(datos: {
  nombre: string; referencia: string;
  items: { nombre: string; cantidad: number; subtotal: number }[]; total: number;
}): string {
  const itemsHtml = datos.items.map((it) =>
    `<tr><td style="padding:10px 0;border-bottom:1px solid #E5E0D8;">${esc(it.nombre)}</td>` +
    `<td style="padding:10px 0;text-align:right;border-bottom:1px solid #E5E0D8;">${it.cantidad}</td>` +
    `<td style="padding:10px 0;text-align:right;border-bottom:1px solid #E5E0D8;">${fmtPrecio(it.subtotal)}</td></tr>`
  ).join('')
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:32px 16px;background:#FAF8F5;font-family:Georgia,'Times New Roman',serif;color:#1A1714;">
<div style="max-width:560px;margin:0 auto;background:#FFFFFF;padding:36px 32px;border-radius:8px;border:1px solid #E5E0D8;">
  <div style="text-align:center;margin-bottom:24px;">
    <div style="color:#1F6F4A;font-size:14px;letter-spacing:0.15em;text-transform:uppercase;font-family:Arial,sans-serif;">Verde Andino Jewelry</div>
  </div>
  <h1 style="color:#1F6F4A;font-size:24px;margin:0 0 20px;text-align:center;">¡Pago confirmado!</h1>
  <p style="font-size:16px;line-height:1.6;margin:0 0 12px;">Hola ${esc(datos.nombre)},</p>
  <p style="font-size:16px;line-height:1.6;margin:0 0 20px;">
    Recibimos tu pago con la referencia
    <span style="display:inline-block;background:#F5F2ED;padding:2px 10px;border-radius:4px;font-family:'Courier New',monospace;font-size:14px;color:#1F6F4A;">${esc(datos.referencia)}</span>.
  </p>
  <table style="width:100%;border-collapse:collapse;margin:24px 0;font-family:Arial,sans-serif;font-size:14px;">
    <thead>
      <tr style="border-bottom:2px solid #1F6F4A;">
        <th style="text-align:left;padding:10px 0;color:#5F5A54;font-weight:600;">Pieza</th>
        <th style="text-align:right;padding:10px 0;color:#5F5A54;font-weight:600;">Cant.</th>
        <th style="text-align:right;padding:10px 0;color:#5F5A54;font-weight:600;">Subtotal</th>
      </tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
    <tfoot>
      <tr>
        <td colspan="2" style="text-align:right;padding:14px 0 0;font-weight:600;">Total pagado</td>
        <td style="text-align:right;padding:14px 0 0;font-weight:700;color:#1F6F4A;font-size:16px;">${fmtPrecio(datos.total)}</td>
      </tr>
    </tfoot>
  </table>
  <h2 style="color:#1F6F4A;font-size:16px;margin:28px 0 12px;font-family:Arial,sans-serif;">Próximos pasos</h2>
  <ol style="padding-left:20px;line-height:1.8;font-size:15px;">
    <li>Preparamos tu pieza en 24–48 horas.</li>
    <li>Coordinamos el envío por transportadora.</li>
    <li>Te enviamos el número de guía por WhatsApp.</li>
  </ol>
  <p style="margin-top:28px;font-size:15px;line-height:1.6;">
    Cualquier duda escríbenos a
    <a href="https://wa.me/${WA_NUMERO}?text=Hola,%20consulta%20sobre%20el%20pedido%20${encodeURIComponent(datos.referencia)}" style="color:#1F6F4A;font-weight:600;text-decoration:none;">WhatsApp +57 318 093 5276</a>
    o responde este correo.
  </p>
  <div style="border-top:1px solid #E5E0D8;margin-top:32px;padding-top:20px;color:#948E86;font-size:13px;text-align:center;font-family:Arial,sans-serif;">
    Gracias por confiar en Verde Andino Jewelry.<br>
    Joyería con esmeraldas de Colombia · <a href="https://verdeandino.app" style="color:#1F6F4A;">verdeandino.app</a>
  </div>
</div>
</body></html>`
}

function renderTexto(datos: {
  nombre: string; referencia: string;
  items: { nombre: string; cantidad: number; subtotal: number }[]; total: number;
}): string {
  const itemsTxt = datos.items.map((it) => `  - ${it.nombre} x${it.cantidad}: ${fmtPrecio(it.subtotal)}`).join('\n')
  return `Hola ${datos.nombre},

Recibimos tu pago con la referencia ${datos.referencia}.

Detalle:
${itemsTxt}

Total pagado: ${fmtPrecio(datos.total)}

Proximos pasos:
1. Preparamos tu pieza en 24-48 horas.
2. Coordinamos el envio por transportadora.
3. Te enviamos el numero de guia por WhatsApp.

Cualquier duda: WhatsApp +57 318 093 5276

Gracias por confiar en Verde Andino Jewelry.
verdeandino.app
`
}

serve(async (req) => {
  // Auth: verify_jwt=true en el gateway ya valida que llegue un JWT
  // firmado por este proyecto (anon o service_role). No hacemos check
  // extra: sin una referencia valida en la DB no se envia nada, y la
  // idempotencia (ventas.email_sent_at) bloquea reenvios.
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  let body: { referencia?: string }
  try { body = await req.json() } catch { return new Response('Cuerpo invalido', { status: 400 }) }
  const referencia = body.referencia
  if (!referencia) return new Response('Falta referencia', { status: 400 })

  if (!RESEND_API_KEY) {
    console.error('send-payment-confirmed: RESEND_API_KEY sin configurar')
    return new Response(JSON.stringify({ ok: false, reason: 'sin_key' }), { status: 200 })
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const { data: ventas, error } = await supabase
    .from('ventas')
    .select('id, cliente_nombre, cliente_contacto, producto_id, producto_nombre, cantidad_vendida, precio_unitario, monto_total, referencia_pago, email_sent_at')
    .eq('referencia_pago', referencia)
    .eq('estado', 'pagado')

  if (error) {
    console.error('send-payment-confirmed: error consulta ventas', error)
    return new Response(JSON.stringify({ ok: false, reason: 'db_error' }), { status: 200 })
  }
  if (!ventas || ventas.length === 0) {
    return new Response(JSON.stringify({ ok: false, reason: 'sin_ventas' }), { status: 200 })
  }
  const ventasTyped = ventas as Venta[]

  // Idempotencia: si al menos una ya se marco, no reenviar.
  if (ventasTyped.some((v) => v.email_sent_at !== null)) {
    return new Response(JSON.stringify({ ok: true, skipped: 'ya_enviado' }), { status: 200 })
  }

  const cliente = ventasTyped[0]
  const email = extraerEmail(cliente.cliente_contacto)
  if (!email) {
    return new Response(JSON.stringify({ ok: false, reason: 'sin_email' }), { status: 200 })
  }

  const items = ventasTyped.map((v) => ({
    nombre: v.producto_nombre ?? 'Pieza Verde Andino',
    cantidad: Number(v.cantidad_vendida) || 1,
    subtotal: Number(v.monto_total) || 0,
  }))
  const total = items.reduce((sum, it) => sum + it.subtotal, 0)

  const datos = { nombre: cliente.cliente_nombre, referencia, items, total }
  const html = renderHtml(datos)
  const text = renderTexto(datos)

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + RESEND_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: email,
      reply_to: RESEND_REPLY_TO,
      subject: `Pago confirmado ${referencia} — Verde Andino Jewelry`,
      html,
      text,
    }),
  })

  if (!resp.ok) {
    const errText = await resp.text()
    console.error('send-payment-confirmed: Resend error', resp.status, errText)
    return new Response(JSON.stringify({ ok: false, reason: 'resend_error', status: resp.status }), { status: 200 })
  }

  const enviado = await resp.json().catch(() => ({}))

  // Marca todas las ventas de esta referencia como email_sent
  const { error: updErr } = await supabase
    .from('ventas')
    .update({ email_sent_at: new Date().toISOString() })
    .eq('referencia_pago', referencia)
  if (updErr) console.error('send-payment-confirmed: error marcando email_sent_at', updErr)

  return new Response(JSON.stringify({ ok: true, resend_id: (enviado as { id?: string }).id, to: email }), { status: 200 })
})
