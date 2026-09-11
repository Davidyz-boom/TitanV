-- =========================================================
--  Titan V / Native — Script DDL + DML para base de datos: native
--  Dialecto: PostgreSQL (Puerto 5433)
-- =========================================================

BEGIN;

-- 1. Tablas principales de soporte
CREATE TABLE IF NOT EXISTS materiales (
	id SERIAL NOT NULL, 
	nombre_material VARCHAR(100) NOT NULL, 
	unidad_medida VARCHAR(50) NOT NULL, 
	fecha_eliminacion TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS proyectos_obra (
	id SERIAL NOT NULL, 
	nombre_proyecto VARCHAR(150) NOT NULL, 
	ubicacion_direccion VARCHAR(255) NOT NULL, 
	estado VARCHAR(50) NOT NULL, 
	fecha_inicio DATE NOT NULL, 
	fecha_fin_estimada DATE NOT NULL, 
	fecha_eliminacion TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id)
);

-- 2. Tabla: usuarios (Requerida por Native)
CREATE TABLE IF NOT EXISTS usuarios (
	id_usuario SERIAL NOT NULL, 
	nombres VARCHAR(100) NOT NULL, 
	apellidos VARCHAR(100) NOT NULL, 
	correo_electronico VARCHAR(150) NOT NULL, 
	contrasena_encriptada VARCHAR(255) NOT NULL, 
	rol INTEGER NOT NULL, 
	intentos_fallidos INTEGER DEFAULT 0, 
	activo BOOLEAN DEFAULT TRUE, 
	fecha_vencimiento_licencia DATE, 
	tiene_certificacion_maquinaria BOOLEAN DEFAULT FALSE, 
	PRIMARY KEY (id_usuario), 
	UNIQUE (correo_electronico)
);

CREATE TABLE IF NOT EXISTS actas_campo (
	id SERIAL NOT NULL, 
	proyecto_id INTEGER NOT NULL, 
	fecha_generacion TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL, 
	ruta_pdf VARCHAR(255) NOT NULL, 
	firma_supervisor_url VARCHAR(255), 
	firma_operario_url VARCHAR(255), 
	coordenadas_gps VARCHAR(100), 
	marca_agua_timestamp VARCHAR(100), 
	PRIMARY KEY (id), 
	FOREIGN KEY(proyecto_id) REFERENCES proyectos_obra (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS evidencias_multimedia (
	id SERIAL NOT NULL, 
	proyecto_id INTEGER NOT NULL, 
	ruta_archivo VARCHAR(255) NOT NULL, 
	fecha_subida TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(proyecto_id) REFERENCES proyectos_obra (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS historial_movimientos (
	id SERIAL NOT NULL, 
	proyecto_id INTEGER NOT NULL, 
	material_id INTEGER NOT NULL, 
	usuario_id INTEGER NOT NULL, 
	tipo_movimiento VARCHAR(50) NOT NULL, 
	cantidad FLOAT NOT NULL, 
	fecha_movimiento TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(proyecto_id) REFERENCES proyectos_obra (id) ON DELETE CASCADE, 
	FOREIGN KEY(material_id) REFERENCES materiales (id) ON DELETE CASCADE, 
	FOREIGN KEY(usuario_id) REFERENCES usuarios (id_usuario) ON DELETE CASCADE
);

-- 3. Tabla: inventario_obras (Requerida por Native)
CREATE TABLE IF NOT EXISTS inventario_obras (
	id SERIAL NOT NULL, 
	proyecto_id INTEGER NOT NULL, 
	material_id INTEGER NOT NULL, 
	cantidad_disponible FLOAT NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT unique_material_por_proyecto UNIQUE (proyecto_id, material_id), 
	FOREIGN KEY(proyecto_id) REFERENCES proyectos_obra (id) ON DELETE CASCADE, 
	FOREIGN KEY(material_id) REFERENCES materiales (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS proyecto_colaboradores (
	id SERIAL NOT NULL, 
	proyecto_id INTEGER NOT NULL, 
	usuario_id INTEGER NOT NULL, 
	rol VARCHAR(50) NOT NULL, 
	fecha_vinculacion TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT unique_colaborador_por_proyecto UNIQUE (proyecto_id, usuario_id), 
	FOREIGN KEY(proyecto_id) REFERENCES proyectos_obra (id) ON DELETE CASCADE, 
	FOREIGN KEY(usuario_id) REFERENCES usuarios (id_usuario) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS subcontratistas (
	id SERIAL NOT NULL, 
	proyecto_id INTEGER NOT NULL, 
	nombre_empresa VARCHAR(150) NOT NULL, 
	nit VARCHAR(50) NOT NULL, 
	fecha_vencimiento_poliza DATE NOT NULL, 
	fecha_vencimiento_ss DATE NOT NULL, 
	estado VARCHAR(50) NOT NULL, 
	fecha_eliminacion TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(proyecto_id) REFERENCES proyectos_obra (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tareas (
	id SERIAL NOT NULL, 
	proyecto_id INTEGER NOT NULL, 
	usuario_id INTEGER, 
	nombre_tarea VARCHAR(150) NOT NULL, 
	descripcion TEXT, 
	estado VARCHAR(50) NOT NULL, 
	fecha_inicio DATE, 
	fecha_fin_estimada DATE, 
	fecha_asignacion DATE DEFAULT CURRENT_DATE, 
	fecha_eliminacion TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(proyecto_id) REFERENCES proyectos_obra (id) ON DELETE CASCADE, 
	FOREIGN KEY(usuario_id) REFERENCES usuarios (id_usuario) ON DELETE SET NULL
);

-- 4. Tabla: turnos_relevos (Requerida por Native)
CREATE TABLE IF NOT EXISTS turnos_relevos (
	id SERIAL NOT NULL, 
	proyecto_id INTEGER NOT NULL, 
	usuario_id INTEGER NOT NULL, 
	fecha_turno DATE NOT NULL, 
	hora_inicio TIME WITHOUT TIME ZONE NOT NULL, 
	hora_fin TIME WITHOUT TIME ZONE NOT NULL, 
	estado_asistencia VARCHAR(50) NOT NULL, 
	fecha_eliminacion TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(proyecto_id) REFERENCES proyectos_obra (id) ON DELETE CASCADE, 
	FOREIGN KEY(usuario_id) REFERENCES usuarios (id_usuario) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS comentarios (
	id SERIAL NOT NULL, 
	tarea_id INTEGER NOT NULL, 
	usuario_id INTEGER NOT NULL, 
	contenido TEXT NOT NULL, 
	fecha_comentario TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL, 
	fecha_eliminacion TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(tarea_id) REFERENCES tareas (id) ON DELETE CASCADE, 
	FOREIGN KEY(usuario_id) REFERENCES usuarios (id_usuario) ON DELETE CASCADE
);

-- =========================================================
--  INSERCIÓN DE DATOS INICIALES (SEMILLAS)
-- =========================================================

-- Inserción de Proyectos
INSERT INTO proyectos_obra (id, nombre_proyecto, ubicacion_direccion, estado, fecha_inicio, fecha_fin_estimada)
VALUES 
(1, 'Torre Residencial Titan Alpha', 'Cra 15 # 85-20, Bogotá', 'En Ejecución', '2025-01-15', '2026-12-20'),
(2, 'Puente Vehicular Metropolitano', 'Autopista Norte Km 18, Chía', 'En Ejecución', '2025-03-01', '2027-04-15'),
(3, 'Centro Logístico del Valle', 'Vía Yumbo Cl 12, Cali', 'Planeación', '2025-06-10', '2026-11-30')
ON CONFLICT (id) DO NOTHING;

-- Inserción de Materiales
INSERT INTO materiales (id, nombre_material, unidad_medida)
VALUES 
(101, 'Cemento Gris Portland Especial', 'Bultos 50kg'),
(102, 'Arena de Río Lavada', 'm³'),
(103, 'Varilla de Acero Corrugado 1/2"', 'Unidades 6m'),
(104, 'Grava Triturada Estructural 3/4"', 'm³'),
(105, 'Ladrillo Toledano Prensado', 'Millares'),
(106, 'Tubería PVC Sanitaria 4"', 'Tubos 3m')
ON CONFLICT (id) DO NOTHING;

-- Inserción en Tabla: usuarios
INSERT INTO usuarios (id_usuario, nombres, apellidos, correo_electronico, contrasena_encriptada, rol, intentos_fallidos, activo, fecha_vencimiento_licencia, tiene_certificacion_maquinaria)
VALUES 
(1, 'David Fernando', 'Castro Méndez', 'david.castro@titanv.com', '$2b$12$eX4mP1eH4shTitanVAdm1n', 1, 0, TRUE, '2028-11-15', TRUE),
(2, 'Carlos Andrés', 'Ruiz Salamanca', 'carlos.ruiz@titanv.com', '$2b$12$kL3mO8pQ4shTitanVOper', 2, 1, TRUE, '2026-06-30', TRUE),
(3, 'María Camila', 'Gómez Herrera', 'camila.gomez@titanv.com', '$2b$12$jQ9rP2yZ1shTitanVSup', 2, 0, TRUE, '2027-09-12', FALSE),
(4, 'Jorge Eliécer', 'Martínez Mora', 'jorge.martinez@titanv.com', '$2b$12$bB5vX7cR3shTitanVMaq', 3, 2, TRUE, '2025-12-01', TRUE),
(5, 'Andrés Felipe', 'Vargas Peña', 'andres.vargas@titanv.com', '$2b$12$qW1sX8zT4shTitanVAux', 4, 0, FALSE, NULL, FALSE),
(6, 'Elena Patricia', 'Torres Benítez', 'elena.torres@titanv.com', '$2b$12$lM8kR2wP6shTitanVSafe', 2, 0, TRUE, '2029-04-22', FALSE)
ON CONFLICT (id_usuario) DO NOTHING;

-- Inserción en Tabla: inventario_obras
INSERT INTO inventario_obras (id, proyecto_id, material_id, cantidad_disponible)
VALUES 
(1, 1, 101, 450.0),
(2, 1, 102, 32.5),
(3, 1, 103, 18.0),
(4, 2, 101, 850.0),
(5, 2, 104, 120.0),
(6, 3, 105, 5.2),
(7, 3, 106, 140.0)
ON CONFLICT (id) DO NOTHING;

-- Inserción en Tabla: turnos_relevos
INSERT INTO turnos_relevos (id, proyecto_id, usuario_id, fecha_turno, hora_inicio, hora_fin, estado_asistencia)
VALUES 
(1, 1, 2, '2026-09-11', '07:00:00', '15:00:00', 'En Curso'),
(2, 1, 4, '2026-09-11', '07:00:00', '15:00:00', 'Presente'),
(3, 2, 3, '2026-09-11', '06:00:00', '14:00:00', 'Finalizado'),
(4, 2, 1, '2026-09-11', '14:00:00', '22:00:00', 'Programado'),
(5, 3, 5, '2026-09-10', '08:00:00', '16:00:00', 'Ausente Justificado')
ON CONFLICT (id) DO NOTHING;

-- Ajuste de secuencias
SELECT setval('usuarios_id_usuario_seq', COALESCE((SELECT MAX(id_usuario) FROM usuarios), 1));
SELECT setval('proyectos_obra_id_seq', COALESCE((SELECT MAX(id) FROM proyectos_obra), 1));
SELECT setval('materiales_id_seq', COALESCE((SELECT MAX(id) FROM materiales), 1));
SELECT setval('inventario_obras_id_seq', COALESCE((SELECT MAX(id) FROM inventario_obras), 1));
SELECT setval('turnos_relevos_id_seq', COALESCE((SELECT MAX(id) FROM turnos_relevos), 1));

COMMIT;

-- Trigger de validación de stock
CREATE OR REPLACE FUNCTION validar_stock_antes_de_movimiento()
RETURNS TRIGGER AS $$
DECLARE
    stock_actual FLOAT;
BEGIN
    IF NEW.tipo_movimiento = 'Salida' THEN
        SELECT cantidad_disponible INTO stock_actual
        FROM inventario_obras
        WHERE proyecto_id = NEW.proyecto_id AND material_id = NEW.material_id;

        IF stock_actual IS NULL THEN
            RAISE EXCEPTION
                'No hay inventario registrado para el material % en el proyecto %',
                NEW.material_id, NEW.proyecto_id;
        END IF;

        IF stock_actual < NEW.cantidad THEN
            RAISE EXCEPTION
                'Stock insuficiente: disponible %, solicitado % (material %, proyecto %)',
                stock_actual, NEW.cantidad, NEW.material_id, NEW.proyecto_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validar_stock ON historial_movimientos;

CREATE TRIGGER trigger_validar_stock
    BEFORE INSERT ON historial_movimientos
    FOR EACH ROW
    EXECUTE FUNCTION validar_stock_antes_de_movimiento();
