// =========================================================
// Servidor API Local para React Native <-> PostgreSQL
// Base de datos: native (Puerto 5433)
// Soporte CRUD: Read, Create (Inventario), Update, Delete
// =========================================================

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración del Pool de PostgreSQL hacia la BD 'native'
const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5433', 10),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '1234',
  database: process.env.PGDATABASE || 'native',
});

app.use(cors());
app.use(express.json());

// 1. Estado de Conexión
app.get('/api/status', async (req, res) => {
  try {
    const result = await pool.query('SELECT current_database(), now() as server_time');
    res.json({
      online: true,
      database: result.rows[0].current_database,
      server_time: result.rows[0].server_time,
      port: 5433,
    });
  } catch (error) {
    res.status(500).json({ online: false, error: error.message });
  }
});

// Listas auxiliares para selects
app.get('/api/proyectos', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, nombre_proyecto FROM proyectos_obra ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/materiales', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, nombre_material, unidad_medida FROM materiales ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================
// 2. USUARIOS: READ, UPDATE, DELETE
// =========================================================
app.get('/api/usuarios', async (req, res) => {
  try {
    const query = `
      SELECT 
        id_usuario,
        nombres,
        apellidos,
        correo_electronico,
        contrasena_encriptada,
        rol,
        intentos_fallidos,
        activo,
        TO_CHAR(fecha_vencimiento_licencia, 'YYYY-MM-DD') AS fecha_vencimiento_licencia,
        tiene_certificacion_maquinaria
      FROM usuarios
      ORDER BY id_usuario ASC;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  const { nombres, apellidos, correo_electronico, rol, activo, tiene_certificacion_maquinaria } = req.body;
  try {
    const query = `
      UPDATE usuarios
      SET 
        nombres = COALESCE($1, nombres),
        apellidos = COALESCE($2, apellidos),
        correo_electronico = COALESCE($3, correo_electronico),
        rol = COALESCE($4, rol),
        activo = COALESCE($5, activo),
        tiene_certificacion_maquinaria = COALESCE($6, tiene_certificacion_maquinaria)
      WHERE id_usuario = $7
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [
      nombres,
      apellidos,
      correo_electronico,
      rol ? parseInt(rol, 10) : undefined,
      activo !== undefined ? Boolean(activo) : undefined,
      tiene_certificacion_maquinaria !== undefined ? Boolean(tiene_certificacion_maquinaria) : undefined,
      parseInt(id, 10),
    ]);

    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ message: 'Usuario actualizado con éxito en PostgreSQL', data: rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query('DELETE FROM usuarios WHERE id_usuario = $1', [parseInt(id, 10)]);
    if (rowCount === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ message: `Usuario #${id} eliminado con éxito de la base de datos native` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =========================================================
// 3. INVENTARIOS (inventario_obras): READ, CREATE, UPDATE, DELETE
// =========================================================
app.get('/api/inventarios', async (req, res) => {
  try {
    const query = `
      SELECT 
        io.id,
        io.proyecto_id,
        io.material_id,
        io.cantidad_disponible,
        m.nombre_material,
        m.unidad_medida AS unidad,
        p.nombre_proyecto,
        CASE 
          WHEN io.cantidad_disponible <= 20 THEN 20.0 
          ELSE 50.0 
        END AS stock_minimo
      FROM inventario_obras io
      JOIN materiales m ON io.material_id = m.id
      JOIN proyectos_obra p ON io.proyecto_id = p.id
      ORDER BY io.id ASC;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AGREGAR material a inventario
app.post('/api/inventarios', async (req, res) => {
  const { proyecto_id, material_id, nuevo_material_nombre, unidad_medida, cantidad_disponible } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    let targetMaterialId = material_id ? parseInt(material_id, 10) : null;

    // Si especificó un nuevo nombre de material, crearlo en la tabla materiales
    if (!targetMaterialId && nuevo_material_nombre) {
      const insertMat = await client.query(
        'INSERT INTO materiales (nombre_material, unidad_medida) VALUES ($1, $2) RETURNING id',
        [nuevo_material_nombre.trim(), unidad_medida ? unidad_medida.trim() : 'Unidades']
      );
      targetMaterialId = insertMat.rows[0].id;
    }

    if (!targetMaterialId) {
      throw new Error('Debe seleccionar o indicar un material válido.');
    }

    const targetProyectoId = parseInt(proyecto_id, 10);
    const cantidad = parseFloat(cantidad_disponible) || 0;

    // Insertar o actualizar stock en inventario_obras
    const insertInv = `
      INSERT INTO inventario_obras (proyecto_id, material_id, cantidad_disponible)
      VALUES ($1, $2, $3)
      ON CONFLICT (proyecto_id, material_id) 
      DO UPDATE SET cantidad_disponible = inventario_obras.cantidad_disponible + EXCLUDED.cantidad_disponible
      RETURNING *;
    `;
    const result = await client.query(insertInv, [targetProyectoId, targetMaterialId, cantidad]);

    await client.query('COMMIT');
    res.status(201).json({
      message: 'Material registrado/incrementado con éxito en inventario de la base de datos',
      data: result.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// EDITAR cantidad disponible de inventario
app.put('/api/inventarios/:id', async (req, res) => {
  const { id } = req.params;
  const { cantidad_disponible } = req.body;
  try {
    const query = `
      UPDATE inventario_obras
      SET cantidad_disponible = $1
      WHERE id = $2
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [parseFloat(cantidad_disponible), parseInt(id, 10)]);
    if (rows.length === 0) return res.status(404).json({ error: 'Registro de inventario no encontrado' });
    res.json({ message: 'Stock actualizado con éxito en PostgreSQL', data: rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ELIMINAR de inventario
app.delete('/api/inventarios/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query('DELETE FROM inventario_obras WHERE id = $1', [parseInt(id, 10)]);
    if (rowCount === 0) return res.status(404).json({ error: 'Registro de inventario no encontrado' });
    res.json({ message: `Registro de inventario #${id} eliminado con éxito de la base de datos native` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =========================================================
// 4. TURNOS (turnos_relevos): READ, UPDATE, DELETE
// =========================================================
app.get('/api/turnos', async (req, res) => {
  try {
    const query = `
      SELECT 
        tr.id,
        tr.proyecto_id,
        tr.usuario_id,
        TO_CHAR(tr.fecha_turno, 'YYYY-MM-DD') AS fecha_turno,
        TO_CHAR(tr.hora_inicio, 'HH24:MI:SS') AS hora_inicio,
        TO_CHAR(tr.hora_fin, 'HH24:MI:SS') AS hora_fin,
        tr.estado_asistencia,
        tr.fecha_eliminacion,
        (u.nombres || ' ' || u.apellidos) AS usuario_nombre,
        p.nombre_proyecto
      FROM turnos_relevos tr
      JOIN usuarios u ON tr.usuario_id = u.id_usuario
      JOIN proyectos_obra p ON tr.proyecto_id = p.id
      WHERE tr.fecha_eliminacion IS NULL
      ORDER BY tr.id ASC;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// EDITAR estado o horario de turno
app.put('/api/turnos/:id', async (req, res) => {
  const { id } = req.params;
  const { estado_asistencia, hora_inicio, hora_fin } = req.body;
  try {
    const query = `
      UPDATE turnos_relevos
      SET 
        estado_asistencia = COALESCE($1, estado_asistencia),
        hora_inicio = COALESCE($2, hora_inicio),
        hora_fin = COALESCE($3, hora_fin)
      WHERE id = $4
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [
      estado_asistencia,
      hora_inicio,
      hora_fin,
      parseInt(id, 10),
    ]);
    if (rows.length === 0) return res.status(404).json({ error: 'Turno no encontrado' });
    res.json({ message: 'Turno actualizado con éxito en PostgreSQL', data: rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ELIMINAR turno
app.delete('/api/turnos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query('DELETE FROM turnos_relevos WHERE id = $1', [parseInt(id, 10)]);
    if (rowCount === 0) return res.status(404).json({ error: 'Turno no encontrado' });
    res.json({ message: `Turno #${id} eliminado con éxito de la base de datos native` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`[Servidor Native API] Escuchando en http://localhost:${PORT}`);
  console.log(`[Servidor Native API] Conectado a PostgreSQL DB: native (puerto 5433)`);
});
