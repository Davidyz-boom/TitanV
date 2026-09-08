-- =========================================================
--  Titan V — Datos de Prueba (Seed) para Demostración
--  Inserta al menos 5 registros completos por módulo
-- =========================================================

-- 1. USUARIOS (Contraseña de todos: ClaveSegura123*)
-- Hash generado con bcrypt: .e9O/W9g.9o7nI4H9wQ1H1P8j8X4uW1Ym
INSERT INTO usuarios (nombres, apellidos, correo_electronico, contrasena_encriptada, rol, activo, tiene_certificacion_maquinaria)
VALUES
('Carlos Mario', 'Restrepo', 'carlos.restrepo@titanv.com', '.o9N9iP5sK9vL1H9wQ1H1P8j8X4uW1Ym', 1, TRUE, TRUE),
('Andrea Carolina', 'Gómez', 'andrea.gomez@titanv.com', '.o9N9iP5sK9vL1H9wQ1H1P8j8X4uW1Ym', 2, TRUE, FALSE),
('Javier Eduardo', 'Silva', 'javier.silva@titanv.com', '.o9N9iP5sK9vL1H9wQ1H1P8j8X4uW1Ym', 3, TRUE, TRUE),
('Mariana Lucía', 'Torres', 'mariana.torres@titanv.com', '.o9N9iP5sK9vL1H9wQ1H1P8j8X4uW1Ym', 2, TRUE, FALSE),
('Roberto', 'Gómez', 'roberto.gomez@titanv.com', '.o9N9iP5sK9vL1H9wQ1H1P8j8X4uW1Ym', 3, TRUE, TRUE),
('Luis Alberto', 'Méndez', 'luis.mendez@titanv.com', '.o9N9iP5sK9vL1H9wQ1H1P8j8X4uW1Ym', 3, TRUE, TRUE)
ON CONFLICT (correo_electronico) DO UPDATE SET activo = TRUE;

-- 2. PROYECTOS DE OBRA
INSERT INTO proyectos_obra (nombre_proyecto, ubicacion_direccion, estado, fecha_inicio, fecha_fin_estimada)
VALUES
('Torre Residencial Mirador del Parque', 'Cra 15 # 124-30, Bogotá', 'En Ejecución', '2026-01-15', '2026-12-20'),
('Centro Comercial Santa Fe Plaza', 'Av. Poblado # 43A-50, Medellín', 'En Ejecución', '2026-02-01', '2026-11-30'),
('Complejo Logístico Industrial del Norte', 'Vía 40 # 85-10, Barranquilla', 'Planificación', '2026-04-10', '2027-02-28'),
('Urbanización Altos de Bellavista', 'Calle 5 # 78-22, Cali', 'Planificación', '2026-05-01', '2027-04-15'),
('Puente Vehicular Río Claro', 'Km 12 Vía Bucaramanga-Girón', 'Finalizado', '2025-06-01', '2026-01-30'),
('Pavimentación Vía Perimetral Sur', 'Diag. 32 # 65-18, Cartagena', 'En Ejecución', '2026-03-01', '2026-09-30');

-- 3. MATERIALES / CATÁLOGO
INSERT INTO materiales (nombre_material, unidad_medida)
VALUES
('Cemento Gris Estructural ARGOS', 'Saco 50kg'),
('Varilla Corrugada 1/2 pulg', 'Unidad 6m'),
('Arena de Peña Lavada', 'Metro Cúbico'),
('Ladrillo Prensado Tolete', 'Millar'),
('Malla Electrosoldada 4mm', 'Rollo 2.4x6m'),
('Grava Triturada 3/4 pulg', 'Metro Cúbico'),
('Pintura Epóxica Tráfico Pesado', 'Cuñete 5 Gal'),
('Bloque de Concreto Estructural 15x20x40', 'Unidad');

-- 4. TAREAS
INSERT INTO tareas (proyecto_id, usuario_id, nombre_tarea, descripcion, estado, fecha_inicio, fecha_fin_estimada)
VALUES
(1, 1, 'Vaciado de placa de entrepiso nivel 3', 'Fundición completa de 120m2 con concreto acelerado a 3 días', 'En Proceso', '2026-03-01', '2026-03-25'),
(1, 2, 'Armado de acero y vigas aéreas', 'Amarre de varilla de 1/2 y estribos según plano estructural E-04', 'En Proceso', '2026-03-01', '2026-03-25'),
(2, 2, 'Instalación de redes hidrosanitarias', 'Tubería PVC sanitaria de 4 y 3 pulgadas con pendientes reglamentarias', 'Pendiente', '2026-03-01', '2026-03-25'),
(2, 3, 'Replanteo topográfico y control de niveles', 'Verificación de ejes principales con estación total', 'Completada', '2026-03-01', '2026-03-25'),
(3, 4, 'Excavación mecánica para cimentación', 'Movimiento de tierra con retroexcavadora y retiro de escombros', 'En Proceso', '2026-03-01', '2026-03-25'),
(4, 5, 'Pañete y acabados en muros exteriores', 'Aplicación de mortero 1:3 impermeable en fachada principal', 'Pendiente', '2026-03-01', '2026-03-25');

-- 5. COMENTARIOS EN TAREAS
INSERT INTO comentarios (tarea_id, usuario_id, contenido)
VALUES
(1, 1, 'Se fundió el 70% del tramo occidental sin novedad técnica.'),
(1, 2, 'Aprobado por interventoría. Mantener curado con agua durante 7 días.'),
(2, 2, 'Se requieren 30 kilos adicionales de alambre negro para los estribos.'),
(3, 3, 'Tubería suministrada por almacén, iniciando empate en batería de baños.'),
(4, 1, 'Nivelación completada dentro de la tolerancia de 2mm estipulada.'),
(5, 4, 'Volqueta en sitio retirando 45m3 de material sobrante.');

-- 6. TURNOS Y ASISTENCIA
INSERT INTO turnos_relevos (proyecto_id, usuario_id, fecha_turno, hora_inicio, hora_fin, estado_asistencia)
VALUES
(1, 1, '2026-03-08', '07:00:00', '16:00:00', 'Presente'),
(1, 2, '2026-03-08', '07:00:00', '16:00:00', 'Presente'),
(2, 3, '2026-03-08', '08:00:00', '17:00:00', 'Presente'),
(2, 4, '2026-03-09', '07:00:00', '16:00:00', 'Programado'),
(3, 5, '2026-03-09', '06:30:00', '15:30:00', 'Programado'),
(1, 2, '2026-03-07', '07:00:00', '16:00:00', 'Ausente');
