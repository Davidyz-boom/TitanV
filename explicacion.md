# Documento de Explicación Técnica: Módulos de Inventarios y Turnos

Este documento explica en detalle el funcionamiento, la arquitectura y el propósito de los módulos de **Inventarios** y **Turnos** implementados en la aplicación React Native conectada a la base de datos PostgreSQL (`native`).

---

## 1. Arquitectura General del Sistema

El flujo de información se estructura en tres capas principales:

1. **Frontend Móvil / Web (React Native con Expo):**
   * Interfaz de usuario sencilla y funcional que permite consultar, registrar, modificar y eliminar datos.
   * Archivos clave: [`InventariosTab.js`](file:///c:/Users/SENA/Desktop/Native/src/components/InventariosTab.js), [`TurnosTab.js`](file:///c:/Users/SENA/Desktop/Native/src/components/TurnosTab.js), [`AddInventarioModal.js`](file:///c:/Users/SENA/Desktop/Native/src/components/AddInventarioModal.js), [`EditModal.js`](file:///c:/Users/SENA/Desktop/Native/src/components/EditModal.js) y [`App.js`](file:///c:/Users/SENA/Desktop/Native/App.js).
2. **Capa de Servicios y API Intermedia ([`server.js`](file:///c:/Users/SENA/Desktop/Native/server.js)):**
   * Servidor Node.js con Express y el conector `pg`.
   * Expone endpoints HTTP REST que reciben las peticiones de la app móvil y ejecutan consultas SQL seguras con parámetros preparados contra PostgreSQL.
3. **Base de Datos Relacional (PostgreSQL `native` - Puerto 5433):**
   * Almacena las tablas de datos, relaciones de llaves foráneas (`FOREIGN KEY`), restricciones de unicidad (`UNIQUE`) y triggers de validación.

---

## 2. Módulo de Inventarios (`inventario_obras`)

### ¿Para qué sirve?
En el sector de la construcción, controlar el material físico disponible en cada frente de trabajo u obra es crítico para evitar:
1. **Desabastecimiento:** Quedarse sin cemento, arena o acero paraliza a cuadrillas de trabajadores enteras.
2. **Desperdicio o pérdidas:** Sin un registro claro por proyecto, no se sabe cuánto material ingresó a cada obra ni cuánto queda disponible en bodega de campo.

Este módulo permite responder en segundos a preguntas operativas como:
* *¿Cuánto cemento queda disponible exactamente en la Torre Residencial Titan Alpha?*
* *¿Qué materiales están en estado de stock bajo para solicitar pedidos urgentes a compras?*

---

### Estructura en Base de Datos

```sql
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
```

* **`id`:** Identificador único autoincremental de cada registro de inventario.
* **`proyecto_id`:** Llave foránea hacia la tabla `proyectos_obra`. Indica en qué obra física se encuentra el material.
* **`material_id`:** Llave foránea hacia la tabla `materiales`. Indica qué producto es (ej. Cemento, Grava, Varilla).
* **`cantidad_disponible`:** Valor numérico decimal (`FLOAT`) que refleja la cantidad actual real en obra.
* **`unique_material_por_proyecto`:** Restricción de integridad que impide registrar dos filas para el mismo material en la misma obra; en su lugar, se acumula el stock.

---

### Explicación del Código Backend ([`server.js`](file:///c:/Users/SENA/Desktop/Native/server.js))

#### A. Lectura (`GET /api/inventarios`)
Para mostrar datos legibles al usuario no basta con entregar números de ID (`proyecto_id: 1, material_id: 101`). Se realiza una consulta con `JOIN`:

```javascript
app.get('/api/inventarios', async (req, res) => {
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
});
```
* **`JOIN materiales m`**: Obtiene el nombre del material (`Cemento Gris...`) y su unidad de medida (`Bultos 50kg`, `m³`).
* **`JOIN proyectos_obra p`**: Obtiene el nombre legible de la obra donde está ubicado.

#### B. Registro de Material (`POST /api/inventarios`)
Permite asignar un material a una obra. Si el usuario ingresa un material nuevo que no existe en el catálogo, primero se inserta en `materiales` y luego se registra en `inventario_obras`:

```javascript
app.post('/api/inventarios', async (req, res) => {
  // ...
  const insertInv = `
    INSERT INTO inventario_obras (proyecto_id, material_id, cantidad_disponible)
    VALUES ($1, $2, $3)
    ON CONFLICT (proyecto_id, material_id) 
    DO UPDATE SET cantidad_disponible = inventario_obras.cantidad_disponible + EXCLUDED.cantidad_disponible
    RETURNING *;
  `;
  // ...
});
```
* La cláusula `ON CONFLICT (proyecto_id, material_id) DO UPDATE` garantiza que si ese material ya existía en esa obra, simplemente sume la nueva cantidad al stock existente en lugar de fallar por error de llave única.

#### C. Edición de Stock (`PUT /api/inventarios/:id`)
Actualiza el valor numérico en la base de datos tras una verificación física en bodega:

```javascript
app.put('/api/inventarios/:id', async (req, res) => {
  const query = `
    UPDATE inventario_obras
    SET cantidad_disponible = $1
    WHERE id = $2
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [parseFloat(cantidad_disponible), parseInt(id, 10)]);
  res.json({ message: 'Stock actualizado', data: rows[0] });
});
```

#### D. Eliminación (`DELETE /api/inventarios/:id`)
Elimina la fila seleccionada de la base de datos PostgreSQL:

```javascript
app.delete('/api/inventarios/:id', async (req, res) => {
  await pool.query('DELETE FROM inventario_obras WHERE id = $1', [parseInt(id, 10)]);
  res.json({ message: 'Registro eliminado' });
});
```

---

### Explicación del Código Frontend ([`InventariosTab.js`](file:///c:/Users/SENA/Desktop/Native/src/components/InventariosTab.js))

1. **Estado y Filtros:**
   * Utiliza `useMemo` para filtrar en tiempo real por texto (nombre de material u obra) y por estado (*Todos*, *Normal*, *Bajo*).
2. **Identificación de Stock Crítico:**
   * Si `cantidad_disponible <= stock_minimo`, se muestra una etiqueta roja de **Stock Bajo** para alertar al residente de obra.
3. **Botón "+ Agregar Material a Obra":**
   * Abre [`AddInventarioModal.js`](file:///c:/Users/SENA/Desktop/Native/src/components/AddInventarioModal.js), donde se listan las obras activas y los materiales disponibles para vincularlos con su cantidad inicial.
4. **Botones "Editar Stock" y "Eliminar":**
   * El botón *Editar Stock* abre el modal de edición donde se introduce la nueva cifra.
   * El botón *Eliminar* pide confirmación y elimina la tupla de PostgreSQL.

---

## 3. Módulo de Turnos y Relevos (`turnos_relevos`)

### ¿Para qué sirve?
En las obras de construcción y maquinaria pesada, el personal opera bajo diferentes turnos diurnos, nocturnos o rotativos de relevo (maquinaria que no debe parar, supervisión de fundición de concreto, vigilancia técnica).

Este módulo sirve para:
1. **Control de Asistencia:** Saber si el trabajador se encuentra *Presente*, con *Turno en Curso*, *Finalizado* o con *Ausencia Justificada*.
2. **Programación Operativa:** Asignar responsables directos con hora exacta de entrada y salida para cada frente de obra.
3. **Trazabilidad y Seguridad:** En caso de incidentes o firmas de actas de campo, saber exactamente qué supervisor u operario estaba en turno en ese horario.

---

### Estructura en Base de Datos

```sql
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
```

* **`id`:** Identificador único autoincremental del turno asignado.
* **`proyecto_id`:** En qué obra se cumple el turno.
* **`usuario_id`:** Qué trabajador/usuario de la tabla `usuarios` está asignado al turno.
* **`fecha_turno`:** Fecha del turno en formato estándar `YYYY-MM-DD`.
* **`hora_inicio` y `hora_fin`:** Tipo `TIME` en formato `HH:MM:SS` para marcar la franja horaria.
* **`estado_asistencia`:** Cadena de texto (`En Curso`, `Presente`, `Finalizado`, `Ausente Justificado`).
* **`fecha_eliminacion`:** Campo para soporte de borrado lógico (*soft delete*) o auditoría.

---

### Explicación del Código Backend ([`server.js`](file:///c:/Users/SENA/Desktop/Native/server.js))

#### A. Lectura (`GET /api/turnos`)
```javascript
app.get('/api/turnos', async (req, res) => {
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
});
```
* **`TO_CHAR(...)`**: Función SQL de PostgreSQL que formatea los tipos nativos de fecha y hora para que viajen como cadenas legibles por el cliente JavaScript sin desfases horarios de zona horaria (UTC vs Local).
* **`(u.nombres || ' ' || u.apellidos)`**: Concatena el nombre completo del colaborador desde la tabla `usuarios`.

#### B. Edición de Turno (`PUT /api/turnos/:id`)
Permite registrar cambios en el estado de asistencia o reprogramar horarios de relevo:

```javascript
app.put('/api/turnos/:id', async (req, res) => {
  const { id } = req.params;
  const { estado_asistencia, hora_inicio, hora_fin } = req.body;
  const query = `
    UPDATE turnos_relevos
    SET 
      estado_asistencia = COALESCE($1, estado_asistencia),
      hora_inicio = COALESCE($2, hora_inicio),
      hora_fin = COALESCE($3, hora_fin)
    WHERE id = $4
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [estado_asistencia, hora_inicio, hora_fin, parseInt(id, 10)]);
  res.json({ message: 'Turno actualizado', data: rows[0] });
});
```
* La función `COALESCE` permite actualizar solo los campos enviados; si algún parámetro no se especifica, conserva el valor actual en la base de datos.

#### C. Eliminación (`DELETE /api/turnos/:id`)
```javascript
app.delete('/api/turnos/:id', async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM turnos_relevos WHERE id = $1', [parseInt(id, 10)]);
  res.json({ message: `Turno #${id} eliminado con éxito` });
});
```

---

### Explicación del Código Frontend ([`TurnosTab.js`](file:///c:/Users/SENA/Desktop/Native/src/components/TurnosTab.js))

1. **Visualización de Horario y Estado:**
   * Cada tarjeta presenta el nombre del colaborador, el nombre de la obra, la fecha del turno y la franja horaria clara (`07:00:00 - 15:00:00`).
2. **Etiquetas de Asistencia:**
   * Asigna estilos sobrios y claros: azul para `En Curso`, verde para `Presente` o `Finalizado`, y amarillo para turnos especiales o justificados.
3. **Filtros Rápidos:**
   * Filtra por turnos *Todos*, *En Curso* o *Finalizados*.
4. **Buscador:**
   * Permite localizar turnos buscando por nombre del operario, nombre del proyecto o fecha.
5. **Edición:**
   * Permite seleccionar el nuevo estado de asistencia con un solo toque y ajustar el horario.

---

## 4. Resumen de Flujo de Datos

```
[ Usuario interactúa en la App ]
              │
              ▼
[ Método en src/data/db.js ]  (ej. dbService.actualizarInventario)
              │
              ▼
[ Petición HTTP Fetch ]        (PUT http://localhost:3001/api/inventarios/1)
              │
              ▼
[ Servidor server.js ]        (Recibe la petición y ejecuta pool.query)
              │
              ▼
[ PostgreSQL (DB: native) ]   (Ejecuta UPDATE/INSERT/DELETE en disco)
              │
              ▼
[ Respuesta JSON ]            (200 OK + datos actualizados)
              │
              ▼
[ App.js recarga datos ]      (Refresca la lista en pantalla inmediatamente)
```

Toda la estructura ha sido diseñada con estilos limpios, código estructurado en componentes independientes y validaciones directas contra la base de datos PostgreSQL local.
