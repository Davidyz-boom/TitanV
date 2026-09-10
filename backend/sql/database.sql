-- =========================================================
--  Titan V — Script completo de base de datos
--  Generado a partir de los modelos SQLAlchemy (backend/app/models/)
--  Incluye: esquema completo + trigger de validación de stock
--  Dialecto: PostgreSQL
-- =========================================================

-- Opcional: si quieres partir de cero, crea la base antes de correr el resto.
--
-- CREATE DATABASE titanv_db;
-- CREATE USER titanv_user WITH PASSWORD 'tu_password';
-- GRANT ALL PRIVILEGES ON DATABASE titanv_db TO titanv_user;
--
-- Luego conéctate a titanv_db (\c titanv_db) antes de ejecutar lo de abajo.

BEGIN;

CREATE TABLE materiales (
	id SERIAL NOT NULL, 
	nombre_material VARCHAR(100) NOT NULL, 
	unidad_medida VARCHAR(50) NOT NULL, 
	fecha_eliminacion TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id)
);

CREATE TABLE proyectos_obra (
	id SERIAL NOT NULL, 
	nombre_proyecto VARCHAR(150) NOT NULL, 
	ubicacion_direccion VARCHAR(255) NOT NULL, 
	estado VARCHAR(50) NOT NULL, 
	fecha_inicio DATE NOT NULL, 
	fecha_fin_estimada DATE NOT NULL, 
	fecha_eliminacion TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id)
);

CREATE TABLE usuarios (
	id_usuario SERIAL NOT NULL, 
	nombres VARCHAR(100) NOT NULL, 
	apellidos VARCHAR(100) NOT NULL, 
	correo_electronico VARCHAR(150) NOT NULL, 
	contrasena_encriptada VARCHAR(255) NOT NULL, 
	rol INTEGER NOT NULL, 
	intentos_fallidos INTEGER, 
	activo BOOLEAN, 
	fecha_vencimiento_licencia DATE, 
	tiene_certificacion_maquinaria BOOLEAN, 
	PRIMARY KEY (id_usuario), 
	UNIQUE (correo_electronico)
);

CREATE TABLE actas_campo (
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

CREATE TABLE evidencias_multimedia (
	id SERIAL NOT NULL, 
	proyecto_id INTEGER NOT NULL, 
	ruta_archivo VARCHAR(255) NOT NULL, 
	fecha_subida TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(proyecto_id) REFERENCES proyectos_obra (id) ON DELETE CASCADE
);

CREATE TABLE historial_movimientos (
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

CREATE TABLE inventario_obras (
	id SERIAL NOT NULL, 
	proyecto_id INTEGER NOT NULL, 
	material_id INTEGER NOT NULL, 
	cantidad_disponible FLOAT NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT unique_material_por_proyecto UNIQUE (proyecto_id, material_id), 
	FOREIGN KEY(proyecto_id) REFERENCES proyectos_obra (id) ON DELETE CASCADE, 
	FOREIGN KEY(material_id) REFERENCES materiales (id) ON DELETE CASCADE
);

CREATE TABLE proyecto_colaboradores (
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

CREATE TABLE subcontratistas (
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

CREATE TABLE tareas (
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

CREATE TABLE turnos_relevos (
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

CREATE TABLE comentarios (
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

COMMIT;

-- =========================================================
--  Trigger: validación de stock antes de una salida de material
--
--  Esta misma regla ya vive en Python (movimiento_service.py). Este trigger
--  la repite a nivel de base de datos para que se cumpla SIEMPRE — incluso si
--  alguien inserta directo en historial_movimientos sin pasar por la API
--  (un script, otro servicio, o alguien conectado con psql/pgAdmin).
--
--  Probado contra PostgreSQL real: una salida mayor al stock disponible es
--  rechazada por la base de datos con un mensaje de error claro.
-- =========================================================

CREATE OR REPLACE FUNCTION validar_stock_antes_de_movimiento()
RETURNS TRIGGER AS $$
DECLARE
    stock_actual FLOAT;
BEGIN
    -- Solo interesa validar las salidas; entradas y ajustes no se restringen aquí.
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
