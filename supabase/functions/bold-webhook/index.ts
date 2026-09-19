// Recibe el aviso de Bold cuando un pago se resuelve. Esta es la UNICA
// fuente de verdad de que se pago: la redireccion del navegador de vuelta a
// la vitrina se puede interrumpir o falsificar, este webhook no.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

async function toBase64(texto: string): Promise<string> {
  const bytes = new TextEncoder().encode(texto)
  let binario = ''
  bytes.forEach((b) => { binario += String.fromCharCode(b) })
  return btoa(binario)
}

async function hmacSha256Hex(secreto: string, mensaje: string): Promise<string> {
  const encoder = new TextEncoder()
  const llave = await crypto.subtle.importKey(
    'raw', encoder.encode(secreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const firma = await crypto.subtle.sign('HMAC', llave, encoder.encode(mensaje))
  return Array.from(new Uint8Array(firma)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Metodo no permitido', { status: 405 })

  const cuerpoCrudo = await req.text()
  const firmaRecibida = (req.headers.get('x-bold-signature') || '').toLowerCase()
  const secreto = Deno.env.get('BOLD_SECRET_KEY') || ''
  const cuerpoBase64 = await toBase64(cuerpoCrudo)
  const firmaCalculada = await hmacSha256Hex(secreto, cuerpoBase64)

  if (!firmaRecibida || firmaCalculada !== firmaRecibida) {
    console.error('bold-webhook: firma invalida, evento ignorado')
    return new Response('Firma invalida', { status: 401 })
  }

  let payload: any
  try {
    payload = JSON.parse(cuerpoCrudo)
  } catch (_error) {
    return new Response('Cuerpo invalido', { status: 400 })
  }

  const tipo: string | undefined = payload?.type
  const referencia: string | undefined = payload?.data?.metadata?.reference
  if (!referencia) return new Response('ok', { status: 200 })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    if (tipo === 'SALE_APPROVED') {
      const { error } = await supabase.rpc('confirmar_pago_web', { p_referencia: referencia })
      if (error) throw error
      // Dispara el email transaccional de confirmacion. Best-effort: si falla
      // no revertimos el pago ni bloqueamos el webhook, solo se loguea. La
      // idempotencia esta en ventas.email_sent_at.
      dispararEmailPagado(referencia).catch((e) => {
        console.error('bold-webhook: fallo el envio de email', referencia, e)
      })
    } else if (tipo === 'SALE_REJECTED') {
      const { error } = await supabase.rpc('cancelar_pago_web', { p_referencia: referencia })
      if (error) throw error
    } else if (tipo === 'VOID_APPROVED') {
      // Reembolso confirmado por Bold: la venta ya estaba pagada y Bold
      // aprobo la anulacion. Marca ventas como 'reembolsado' y libera el
      // stock (republica el producto si estaba oculto).
      const { error } = await supabase.rpc('reembolsar_pago_web', { p_referencia: referencia })
      if (error) throw error
    }
    // VOID_REJECTED: Bold rechazo la solicitud de anulacion (por ejemplo
    // fuera de plazo). No hay que revertir nada en la base, el pago sigue
    // en pie. Solo se loguea el evento para auditoria.
  } catch (error) {
    console.error('bold-webhook: error al aplicar el pago', referencia, error)
    // 200 igual: Bold reintenta un error 5xx hasta 5 veces y el pedido queda
    // "pendiente" en la base, visible en el panel para revisar a mano.
  }

  return new Response('ok', { status: 200 })
})

async function dispararEmailPagado(referencia: string): Promise<void> {
  const url = (Deno.env.get('SUPABASE_URL') || '') + '/functions/v1/send-payment-confirmed'
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ referencia }),
  })
  if (!resp.ok) {
    const txt = await resp.text().catch(() => '')
    throw new Error('send-payment-confirmed ' + resp.status + ' ' + txt)
  }
}
