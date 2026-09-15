// Firma la transaccion antes de mandar al comprador a pagar con Wompi.
// El secreto de integridad NUNCA puede vivir en el HTML de la vitrina
// (cualquiera lo veria); por eso esta funcion corre en el servidor.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

async function sha256Hex(texto: string): Promise<string> {
  const datos = new TextEncoder().encode(texto)
  const hash = await crypto.subtle.digest('SHA-256', datos)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Metodo no permitido' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { referencia } = await req.json()
    if (!referencia || typeof referencia !== 'string') {
      return new Response(JSON.stringify({ error: 'Falta la referencia del pedido' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: filas, error } = await supabase
      .from('ventas')
      .select('monto_total, estado')
      .eq('referencia_pago', referencia)

    if (error) throw error
    if (!filas || filas.length === 0) {
      return new Response(JSON.stringify({ error: 'Ese pedido no existe' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (filas.some((fila) => fila.estado !== 'pendiente')) {
      return new Response(JSON.stringify({ error: 'Ese pedido ya no esta pendiente de pago' }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const total = filas.reduce((acumulado, fila) => acumulado + Number(fila.monto_total), 0)
    const amountInCents = Math.round(total * 100)
    const currency = 'COP'
    const secreto = Deno.env.get('WOMPI_INTEGRITY_SECRET')!

    const checksum = await sha256Hex(referencia + amountInCents + currency + secreto)

    return new Response(JSON.stringify({
      referencia, amountInCents, currency, signature: checksum,
      publicKey: Deno.env.get('WOMPI_PUBLIC_KEY') || '',
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('wompi-firmar:', e)
    return new Response(JSON.stringify({ error: 'Error al firmar el pedido' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
