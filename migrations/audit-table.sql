-- Verde Andino Jewelry — Tabla de Auditoría
-- Crea registro de todos los cambios en la tabla `productos`
-- Aplica en Supabase > SQL Editor

-- 1. Crear tabla de auditoría
CREATE TABLE IF NOT EXISTS productos_audit (
  id BIGSERIAL PRIMARY KEY,
  producto_id TEXT NOT NULL,
  accion TEXT NOT NULL CHECK (accion IN ('insert', 'update', 'delete')),
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  changed_fields TEXT[], -- Array de campos modificados (solo para UPDATE)
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- 2. Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_audit_producto_id ON productos_audit(producto_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON productos_audit(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_accion ON productos_audit(accion);

-- 3. Función para registrar cambios
CREATE OR REPLACE FUNCTION registrar_audit_productos()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO productos_audit (producto_id, accion, datos_nuevos, ip_address, user_agent)
    VALUES (NEW.id, 'insert', row_to_json(NEW), current_setting('request.headers'::text)->>'cf-connecting-ip', current_setting('request.headers'::text)->>'user-agent');
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO productos_audit (producto_id, accion, datos_anteriores, datos_nuevos, ip_address, user_agent)
    VALUES (NEW.id, 'update', row_to_json(OLD), row_to_json(NEW), current_setting('request.headers'::text)->>'cf-connecting-ip', current_setting('request.headers'::text)->>'user-agent');
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO productos_audit (producto_id, accion, datos_anteriores, ip_address, user_agent)
    VALUES (OLD.id, 'delete', row_to_json(OLD), current_setting('request.headers'::text)->>'cf-connecting-ip', current_setting('request.headers'::text)->>'user-agent');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger en la tabla `productos`
DROP TRIGGER IF EXISTS trigger_audit_productos ON productos;
CREATE TRIGGER trigger_audit_productos
AFTER INSERT OR UPDATE OR DELETE ON productos
FOR EACH ROW
EXECUTE FUNCTION registrar_audit_productos();

-- 5. Habilitar RLS en tabla de auditoría
ALTER TABLE productos_audit ENABLE ROW LEVEL SECURITY;

-- 6. Política: Solo admin puede leer auditoría
DROP POLICY IF EXISTS "admin_read_audit" ON productos_audit;
CREATE POLICY "admin_read_audit" ON productos_audit
  FOR SELECT
  USING (
    current_setting('request.headers'::text)->>'x-admin-token' = 'VDA_ADMIN_SECRET'
  );

-- NOTA:
-- El trigger se ejecuta automáticamente cada vez que hay INSERT/UPDATE/DELETE en `productos`
-- Los datos se guardan en `productos_audit` con timestamp y IP (si está disponible)
