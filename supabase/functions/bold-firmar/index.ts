// Firma la transaccion antes de mandar al comprador a pagar con Bold.
// La llave secreta NUNCA puede vivir en el HTML de la vitrina (cualquiera la
// veria); por eso esta funcion corre en el servidor.
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
    // Bold recibe el monto en pesos enteros, sin decimales (a diferencia de
    // Wompi, no va multiplicado por 100).
    const amount = Math.round(total)
    const currency = 'COP'
    const secreto = Deno.env.get('BOLD_SECRET_KEY')!

    // Firma de integridad de Bold: SHA256(identificador + monto + divisa + llave secreta)
    const signature = await sha256Hex(referencia + amount + currency + secreto)

    return new Response(JSON.stringify({
      referencia, amount, currency, signature,
      apiKey: Deno.env.get('BOLD_API_KEY') || '',
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('bold-firmar:', e)
    return new Response(JSON.stringify({ error: 'Error al firmar el pedido' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
