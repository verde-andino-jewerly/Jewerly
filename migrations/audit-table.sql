-- Verde Andino Jewelry — Tabla de Auditoría
-- Registra todos los cambios en la tabla `productos`
-- Aplica en Supabase > SQL Editor

CREATE TABLE IF NOT EXISTS productos_audit (
  id BIGSERIAL PRIMARY KEY,
  producto_id TEXT NOT NULL,
  accion TEXT NOT NULL CHECK (accion IN ('insert', 'update', 'delete')),
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_audit_producto_id ON productos_audit(producto_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON productos_audit(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_accion ON productos_audit(accion);

-- Función para registrar cambios
CREATE OR REPLACE FUNCTION registrar_audit_productos()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO productos_audit (producto_id, accion, datos_nuevos)
    VALUES (NEW.id, 'insert', row_to_json(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO productos_audit (producto_id, accion, datos_anteriores, datos_nuevos)
    VALUES (NEW.id, 'update', row_to_json(OLD), row_to_json(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO productos_audit (producto_id, accion, datos_anteriores)
    VALUES (OLD.id, 'delete', row_to_json(OLD));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS trigger_audit_productos ON productos;
CREATE TRIGGER trigger_audit_productos
AFTER INSERT OR UPDATE OR DELETE ON productos
FOR EACH ROW
EXECUTE FUNCTION registrar_audit_productos();

-- RLS en auditoría
ALTER TABLE productos_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_audit" ON productos_audit;
CREATE POLICY "admin_read_audit" ON productos_audit
  FOR SELECT
  USING (
    current_setting('request.header.x-admin-token'::text) = 'VDA_ADMIN_SECRET'
  );

-- Nota: El trigger se ejecuta automáticamente cada vez que hay INSERT/UPDATE/DELETE
-- Los cambios se guardan en productos_audit con timestamp
