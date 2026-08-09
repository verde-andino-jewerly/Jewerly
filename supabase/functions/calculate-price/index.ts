import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  // Solo POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método no permitido' }), { status: 405 })
  }

  try {
    const { costo, margen } = await req.json()

    // Validar inputs
    if (typeof costo !== 'number' || typeof margen !== 'number') {
      return new Response(JSON.stringify({ error: 'costo y margen deben ser números' }), { status: 400 })
    }

    if (costo < 0 || margen < 0) {
      return new Response(JSON.stringify({ error: 'costo y margen no pueden ser negativos' }), { status: 400 })
    }

    // Calcular precio
    const precio = Math.round(costo * (1 + margen / 100))

    return new Response(JSON.stringify({ precio }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error al procesar' }), { status: 500 })
  }
})
