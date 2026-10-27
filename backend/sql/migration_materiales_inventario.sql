-- Migración para instalaciones existentes de Titan V. PostgreSQL.
BEGIN;

ALTER TABLE materiales ADD COLUMN IF NOT EXISTS proyecto_id INTEGER;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_material_proyecto') THEN
        ALTER TABLE materiales ADD CONSTRAINT fk_material_proyecto
            FOREIGN KEY (proyecto_id) REFERENCES proyectos_obra(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS solicitudes_materiales (
    id SERIAL PRIMARY KEY,
    proyecto_id INTEGER NOT NULL REFERENCES proyectos_obra(id) ON DELETE CASCADE,
    material_id INTEGER NOT NULL REFERENCES materiales(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    cantidad FLOAT NOT NULL CHECK (cantidad > 0),
    estado VARCHAR(50) NOT NULL DEFAULT 'Pendiente',
    fecha_solicitud TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    fecha_actualizacion TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
);

COMMIT;
