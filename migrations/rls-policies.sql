-- Verde Andino Jewelry — RLS Policies
-- Aplica estos cambios en Supabase > SQL Editor
-- Proyecto: rbvqxrkzepthbbqzkbcg

-- 1. Habilitar RLS en tabla `productos` (si no está ya habilitado)
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

-- 3. Política de lectura para datos administrativos
-- Solo el admin (con x-admin-token en headers) ve costos/márgenes
DROP POLICY IF EXISTS "admin_read_all" ON productos;
CREATE POLICY "admin_read_all" ON productos
  FOR SELECT
  USING (
    current_setting('request.headers'::text)->>'x-admin-token' = 'VDA_ADMIN_SECRET'
  );

-- 4. Políticas de escritura (INSERT/UPDATE/DELETE separadas)
-- Solo admin puede modificar (se validará con token en frontend)
-- Nota: La key en Supabase sigue siendo "anon", pero RLS lo restringe
DROP POLICY IF EXISTS "admin_insert" ON productos;
CREATE POLICY "admin_insert" ON productos
  FOR INSERT
  WITH CHECK (
    current_setting('request.headers'::text)->>'x-admin-token' = 'VDA_ADMIN_SECRET'
  );

DROP POLICY IF EXISTS "admin_update" ON productos;
CREATE POLICY "admin_update" ON productos
  FOR UPDATE
  USING (
    current_setting('request.headers'::text)->>'x-admin-token' = 'VDA_ADMIN_SECRET'
  );

DROP POLICY IF EXISTS "admin_delete" ON productos;
CREATE POLICY "admin_delete" ON productos
  FOR DELETE
  USING (
    current_setting('request.headers'::text)->>'x-admin-token' = 'VDA_ADMIN_SECRET'
  );

-- 5. Habilitar RLS en bucket `product-photos`
-- (Ejecuta en Storage > product-photos > Policies)

-- Política de lectura pública para fotos
-- Permitir lectura de fotos de productos publicados
-- Name: public_read_published_photos
-- Definition: (((auth.role() = 'authenticated'::text) OR (auth.role() = 'anon'::text)))
-- Target roles: anon, authenticated

-- 6. Política de escritura/eliminar para admin
-- Name: admin_write_photos
-- Definition: (auth.jwt()->>'email' = 'admin@verdeandinojewelry.com')
-- Target roles: authenticated

-- NOTA IMPORTANTE:
-- Después de aplicar estas políticas, regenera la anon key en Settings > API
-- y actualiza SB_KEY en index.html
