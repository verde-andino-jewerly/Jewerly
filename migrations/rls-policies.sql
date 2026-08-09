-- Verde Andino Jewelry — RLS Policies
-- Aplica en Supabase > SQL Editor
-- Proyecto: rbvqxrkzepthbbqzkbcg

-- 1. Habilitar RLS en tabla `productos`
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

-- 2. Política de lectura pública (vitrina)
-- Cualquiera puede leer productos publicados con precio > 0
DROP POLICY IF EXISTS "public_read_published" ON productos;
CREATE POLICY "public_read_published" ON productos
  FOR SELECT
  USING (
    estado = 'publicado'
    AND precio > 0
    AND descripcion IS NOT NULL
  );

-- 3. Política INSERT para admin
-- Solo si request incluye header x-admin-token correcto
DROP POLICY IF EXISTS "admin_insert" ON productos;
CREATE POLICY "admin_insert" ON productos
  FOR INSERT
  WITH CHECK (
    current_setting('request.header.x-admin-token'::text) = 'VDA_ADMIN_SECRET'
  );

-- 4. Política UPDATE para admin
DROP POLICY IF EXISTS "admin_update" ON productos;
CREATE POLICY "admin_update" ON productos
  FOR UPDATE
  USING (
    current_setting('request.header.x-admin-token'::text) = 'VDA_ADMIN_SECRET'
  );

-- 5. Política DELETE para admin
DROP POLICY IF EXISTS "admin_delete" ON productos;
CREATE POLICY "admin_delete" ON productos
  FOR DELETE
  USING (
    current_setting('request.header.x-admin-token'::text) = 'VDA_ADMIN_SECRET'
  );

-- NOTA: La anon key sigue siendo pública (está en el código HTML de GitHub Pages)
-- pero RLS bloquea cualquier INSERT/UPDATE/DELETE sin el token correcto en headers
