// Recibe el aviso de Wompi cuando un pago se resuelve. Esta es la UNICA
// fuente de verdad de que se pago: la redireccion del navegador de vuelta a
// la vitrina se puede interrumpir o falsificar, este webhook no.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

async function sha256Hex(texto: string): Promise<string> {
  const datos = new TextEncoder().encode(texto)
  const hash = await crypto.subtle.digest('SHA-256', datos)
  return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function leerRuta(objeto: any, ruta: string): unknown {
  return ruta.split('.').reduce((actual, parte) => (actual == null ? undefined : actual[parte]), objeto)
}

async function firmaValida(payload: any): Promise<boolean> {
  const propiedades: string[] = payload?.signature?.properties || []
  const checksumRecibido: string = (payload?.signature?.checksum || '').toLowerCase()
  const timestamp = payload?.timestamp
  if (propiedades.length === 0 || !checksumRecibido || timestamp == null) return false

  const secreto = Deno.env.get('WOMPI_EVENTS_SECRET')!
  const concatenado = propiedades.map((ruta) => String(leerRuta(payload, ruta))).join('') + timestamp + secreto
  const checksumCalculado = await sha256Hex(concatenado)
  return checksumCalculado === checksumRecibido
}

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Metodo no permitido', { status: 405 })

  let payload: any
  try {
    payload = await req.json()
  } catch (_error) {
    return new Response('Cuerpo invalido', { status: 400 })
  }

  const firmaOk = await firmaValida(payload)
  if (!firmaOk) {
    console.error('wompi-webhook: firma invalida, evento ignorado')
    return new Response('Firma invalida', { status: 401 })
  }

  const transaccion = payload?.data?.transaction
  const referencia: string | undefined = transaccion?.reference
  const estado: string | undefined = transaccion?.status
  if (!referencia || !estado) return new Response('ok', { status: 200 })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    if (estado === 'APPROVED') {
      const { error } = await supabase.rpc('confirmar_pago_web', { p_referencia: referencia })
      if (error) throw error
    } else if (estado === 'DECLINED' || estado === 'VOIDED' || estado === 'ERROR') {
      const { error } = await supabase.rpc('cancelar_pago_web', { p_referencia: referencia })
      if (error) throw error
    }
    // Cualquier otro estado (PENDING, etc.) no cambia nada todavia.
  } catch (error) {
    console.error('wompi-webhook: error al aplicar el pago', referencia, error)
    // 200 igual: Wompi reintenta un error 5xx muchas veces y el pedido queda
    // "pendiente" en la base, visible en el panel para revisar a mano.
  }

  return new Response('ok', { status: 200 })
})
