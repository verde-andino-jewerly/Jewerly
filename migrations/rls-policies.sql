-- Verde Andino Jewelry — RLS Policies (v2)
-- Aplica en Supabase > SQL Editor
-- Proyecto: rbvqxrkzepthbbqzkbcg

-- 1. Habilitar RLS en tabla `productos`
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

-- 2. Política de lectura pública (vitrina)
DROP POLICY IF EXISTS "public_read_published" ON productos;
CREATE POLICY "public_read_published" ON productos
  FOR SELECT
  USING (
    estado = 'publicado'
    AND precio > 0
    AND descripcion IS NOT NULL
  );

-- 3. Políticas de escritura para admin
-- Usa la sintaxis JSON de PostgREST (más portable):
-- current_setting('request.headers', true) devuelve un JSON con todos los headers
DROP POLICY IF EXISTS "admin_insert" ON productos;
CREATE POLICY "admin_insert" ON productos
  FOR INSERT
  WITH CHECK (
    (current_setting('request.headers', true)::json->>'x-admin-token') = 'VDA_ADMIN_SECRET'
  );

DROP POLICY IF EXISTS "admin_update" ON productos;
CREATE POLICY "admin_update" ON productos
  FOR UPDATE
  USING (
    (current_setting('request.headers', true)::json->>'x-admin-token') = 'VDA_ADMIN_SECRET'
  );

DROP POLICY IF EXISTS "admin_delete" ON productos;
CREATE POLICY "admin_delete" ON productos
  FOR DELETE
  USING (
    (current_setting('request.headers', true)::json->>'x-admin-token') = 'VDA_ADMIN_SECRET'
  );

-- NOTA: La anon key sigue siendo pública. RLS bloquea escrituras sin x-admin-token.
