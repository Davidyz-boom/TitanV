# EXPLICACIÓN LÍNEA POR LÍNEA: INVENTARIO Y TURNOS
## Titan V - Sistema de Gestión de Obra (React Native + Node.js + PostgreSQL)

Este documento detalla **cada bloque y cada línea de código** de los módulos de **Inventario** y **Turnos**, explicando qué hace cada instrucción, para qué sirve en la lógica del sistema y exactamente cómo se conecta entre la interfaz del celular/web, el servidor backend y la base de datos PostgreSQL.

---

# ÍNDICE GENERAL
1. **Arquitectura de Conexión (¿Cómo viaja el dato?)**
2. **Módulo de Inventarios**
   * 2.1 Backend en `server.js` (Endpoints SQL)
   * 2.2 Capa de Datos en `src/data/db.js` (Funciones Fetch)
   * 2.3 Vista Principal en `src/components/InventariosTab.js`
   * 2.4 Modal de Creación en `src/components/AddInventarioModal.js`
3. **Módulo de Turnos**
   * 3.1 Backend en `server.js` (Endpoints SQL)
   * 3.2 Capa de Datos en `src/data/db.js` (Funciones Fetch)
   * 3.3 Vista Principal en `src/components/TurnosTab.js`
   * 3.4 Modal de Creación en `src/components/AddTurnoModal.js`
4. **Integración en `App.js` (El Director de Orquesta)**

---

# 1. ARQUITECTURA DE CONEXIÓN: ¿CÓMO SE CONECTA TODO?

Antes de ver línea por línea, este es el camino exacto que sigue cualquier acción:

```
[ PANTALLA (React Native) ] 
       │  (El usuario escribe y toca un botón)
       ▼
[ COMPONENTE MODAL / TAB ]  (ej. AddInventarioModal.js / TurnosTab.js)
       │  (Recoge los estados de React y valida los campos)
       ▼
[ CAPA DE SERVICIOS (src/data/db.js) ]
       │  (Convierte los datos a JSON y hace una petición HTTP fetch)
       ▼
[ SERVIDOR API (server.js en Node.js/Express puerto 3001) ]
       │  (Recibe la petición HTTP, extrae parámetros y usa el pool de pg)
       ▼
[ BASE DE DATOS (PostgreSQL 18 - DB: native - puerto 5433) ]
       │  (Ejecuta la sentencia SQL: SELECT / INSERT / UPDATE / DELETE)
       ▼
[ RESPUESTA JSON (hacia atrás) ]
       │  (Regresa los datos actualizados a App.js)
       ▼
[ ACTUALIZACIÓN REACTIVA (useState en App.js) ]
       │  (React redibuja la pantalla con los nuevos datos al instante)
```

---

# 2. MÓDULO DE INVENTARIOS

---

## 2.1 Backend de Inventario en `server.js`

### A. Endpoint de Lectura (`GET /api/inventarios`)

```javascript
app.get('/api/inventarios', async (req, res) => {
```
* **Línea 1:** `app.get(...)` define una ruta HTTP accesible mediante el método `GET` en la URL `/api/inventarios`. `async (req, res)` indica que la función es asíncrona para poder esperar (`await`) la respuesta de la base de datos sin congelar el servidor.

```javascript
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
```
* **`try {`:** Bloque de seguridad para capturar cualquier error de conexión o sintaxis SQL.
* **`SELECT ...`:** Indica qué columnas queremos traer de la base de datos:
  * `io.id`: El identificador único de la fila en `inventario_obras`.
  * `io.proyecto_id` y `io.material_id`: Los códigos numéricos foráneos.
  * `io.cantidad_disponible`: El número con la cantidad física existente en obra.
  * `m.nombre_material`: Trae el nombre del producto (ej: Cemento Gris) desde la tabla `materiales`.
  * `m.unidad_medida AS unidad`: Renombra `unidad_medida` como `unidad` para que el frontend lo lea más fácil (ej: Bultos 50kg).
  * `p.nombre_proyecto`: Trae el nombre de la obra (ej: Torre Residencial Alpha) desde `proyectos_obra`.
  * `CASE WHEN io.cantidad_disponible <= 20 THEN 20.0 ELSE 50.0 END AS stock_minimo`: Lógica condicional en SQL que calcula un umbral de stock mínimo para saber cuándo alertar.
* **`FROM inventario_obras io`:** La tabla principal de donde parte la consulta (con alias `io`).
* **`JOIN materiales m ON io.material_id = m.id`:** Une la tabla de materiales donde coincida el ID para traer su nombre.
* **`JOIN proyectos_obra p ON io.proyecto_id = p.id`:** Une la tabla de obras donde coincida el proyecto_id para traer el nombre del proyecto.
* **`ORDER BY io.id ASC;`:** Ordena los resultados del más antiguo al más nuevo de forma ascendente.

```javascript
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```
* **`const { rows } = await pool.query(query);`:** Ejecuta la consulta SQL en PostgreSQL a través del pool de conexiones y desestructura el arreglo de filas resultantes (`rows`).
* **`res.json(rows);`:** Envía las filas al cliente (React Native) en formato JSON con código de estado HTTP 200 OK.
* **`catch (error) { ... }`:** Si algo falla, devuelve código HTTP 500 con el mensaje de error para no tumbar el servidor.

---

### B. Endpoint de Creación (`POST /api/inventarios`)

```javascript
app.post('/api/inventarios', async (req, res) => {
  const { proyecto_id, material_id, nuevo_material_nombre, unidad_medida, cantidad_disponible } = req.body;
  const client = await pool.connect();
```
* **`app.post('/api/inventarios', ...)`:** Ruta para recibir datos nuevos enviados por el cliente.
* **`const { ... } = req.body;`:** Extrae del cuerpo de la petición los campos enviados desde el formulario móvil.
* **`const client = await pool.connect();`:** Solicita un cliente exclusivo del pool de PostgreSQL para poder ejecutar una **transacción atómica** (BEGIN / COMMIT).

```javascript
  try {
    await client.query('BEGIN');
    let targetMaterialId = material_id ? parseInt(material_id, 10) : null;
```
* **`await client.query('BEGIN');`:** Inicia formalmente una transacción en PostgreSQL. Si algo falla a la mitad, nada queda guardado a medias.
* **`let targetMaterialId = ...`:** Convierte el ID de material a entero si existe.

```javascript
    if (!targetMaterialId && nuevo_material_nombre) {
      const insertMat = await client.query(
        'INSERT INTO materiales (nombre_material, unidad_medida) VALUES ($1, $2) RETURNING id',
        [nuevo_material_nombre.trim(), unidad_medida ? unidad_medida.trim() : 'Unidades']
      );
      targetMaterialId = insertMat.rows[0].id;
    }
```
* **`if (!targetMaterialId && nuevo_material_nombre) {`:** Si el usuario no eligió un material de la lista sino que escribió uno nuevo (ej. "Pintura Epóxica"):
* **`INSERT INTO materiales ... RETURNING id`:** Inserta el material en el catálogo y pide que la base de datos devuelva el nuevo `id` generado automáticamente.
* **`targetMaterialId = insertMat.rows[0].id;`:** Guarda ese nuevo ID para asociarlo inmediatamente a la obra.

```javascript
    const targetProyectoId = parseInt(proyecto_id, 10);
    const cantidad = parseFloat(cantidad_disponible) || 0;
```
* Valida y convierte el `proyecto_id` a número entero y la `cantidad_disponible` a número decimal (`Float`).

```javascript
    const insertInv = `
      INSERT INTO inventario_obras (proyecto_id, material_id, cantidad_disponible)
      VALUES ($1, $2, $3)
      ON CONFLICT (proyecto_id, material_id) 
      DO UPDATE SET cantidad_disponible = inventario_obras.cantidad_disponible + EXCLUDED.cantidad_disponible
      RETURNING *;
    `;
    const result = await client.query(insertInv, [targetProyectoId, targetMaterialId, cantidad]);
```
* **`INSERT INTO inventario_obras ...`:** Inserta la relación obra-material.
* **`ON CONFLICT (proyecto_id, material_id) DO UPDATE ...`:** **Línea clave**. Como en la base de datos existe la regla de unicidad `UNIQUE (proyecto_id, material_id)`, si alguien intenta agregar cemento a una obra donde ya había cemento, PostgreSQL **no arroja error**, sino que ejecuta `DO UPDATE` sumando la nueva cantidad a la que ya existía (`EXCLUDED.cantidad_disponible`).
* **`RETURNING *;`:** Devuelve la fila completa recién insertada o actualizada.

```javascript
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
```
* **`await client.query('COMMIT');`:** Confirma y consolida todos los cambios permanentemente en el disco de PostgreSQL.
* **`res.status(201).json(...)`:** Responde al móvil con código 201 (Created) confirmando la operación.
* **`catch (error) { await client.query('ROLLBACK'); ... }`:** Si hubo cualquier error, `ROLLBACK` cancela todo lo hecho para no dejar datos corruptos.
* **`finally { client.release(); }`:** Devuelve el cliente al pool para que quede libre para otros usuarios.

---

### C. Endpoint de Edición (`PUT /api/inventarios/:id`)

```javascript
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
```
* **`app.put('/api/inventarios/:id', ...)`:** El `:id` es un parámetro dinámico en la URL (ej: `/api/inventarios/3`).
* **`const { id } = req.params;`:** Extrae el ID de la URL.
* **`const { cantidad_disponible } = req.body;`:** Extrae el nuevo número de stock enviado desde la app.
* **`UPDATE inventario_obras SET cantidad_disponible = $1 WHERE id = $2`:** Modifica directamente en la tabla la cantidad del registro correspondiente al ID indicado.
* **`if (rows.length === 0)`:** Si no encontró esa fila, devuelve error 404 (Not Found).
* **`res.json(...)`:** Retorna mensaje de confirmación y el objeto actualizado.

---

### D. Endpoint de Eliminación (`DELETE /api/inventarios/:id`)

```javascript
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
```
* **`app.delete(...)`:** Ruta HTTP para borrar datos.
* **`DELETE FROM inventario_obras WHERE id = $1`:** Borra la tupla de PostgreSQL.
* **`rowCount`:** Informa cuántas filas fueron eliminadas. Si es 0, no existía.

---

## 2.2 Capa de Datos de Inventario en `src/data/db.js`

Este archivo es el puente que comunica la app móvil con el backend:

```javascript
  getInventarios: async () => {
    try {
      const res = await fetch(`${API_HOST}/api/inventarios`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) return await res.json();
      return [];
    } catch (e) {
      console.warn('Error al leer inventarios de PostgreSQL:', e.message);
      return [];
    }
  },
```
* **`fetch(...)`:** Hace la petición HTTP GET al servidor `http://localhost:3001/api/inventarios`.
* **`AbortSignal.timeout(4000)`:** Si en 4 segundos el servidor no responde, aborta la petición para no colgar el teléfono.
* **`if (res.ok) return await res.json();`:** Si el servidor devolvió código 200, transforma los bytes recibidos en un arreglo de objetos JavaScript y los retorna.

```javascript
  crearInventario: async (datos) => {
    const res = await fetch(`${API_HOST}/api/inventarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al agregar a inventario');
    return json;
  },
```
* **`method: 'POST'`:** Indica que es una inserción.
* **`headers: { 'Content-Type': 'application/json' }`:** Le dice a Express que lo que viaja es formato JSON.
* **`body: JSON.stringify(datos)`:** Convierte el objeto de JavaScript a una cadena de texto JSON legible por el servidor.
* **`if (!res.ok) throw new Error(...)`:** Si el backend respondió con error, lanza una excepción para que la pantalla la muestre como alerta.

```javascript
  actualizarInventario: async (id, cantidad_disponible) => {
    const res = await fetch(`${API_HOST}/api/inventarios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cantidad_disponible }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al actualizar inventario');
    return json;
  },
```
* Conecta con `PUT /api/inventarios/:id` enviando el número de stock nuevo empaquetado como `{ cantidad_disponible }`.

```javascript
  eliminarInventario: async (id) => {
    const res = await fetch(`${API_HOST}/api/inventarios/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al eliminar de inventario');
    return json;
  },
```
* Conecta con `DELETE /api/inventarios/:id` para remover el elemento.

---

## 2.3 Vista Principal en `src/components/InventariosTab.js`

```javascript
export default function InventariosTab({
  data,
  refreshing,
  onRefresh,
  onSelectItem,
  onOpenAddModal,
  onEdit,
  onDelete,
}) {
```
* **`InventariosTab`**: Función componente de React Native.
* **`data`:** Lista de registros de inventario traídos de PostgreSQL pasados desde `App.js`.
* **`refreshing` / `onRefresh`:** Controlan el gesto táctil de tirar hacia abajo para refrescar (*Pull-to-refresh*).
* **`onSelectItem`:** Función que abre el modal de inspección detallada.
* **`onOpenAddModal`:** Función que abre el modal para crear nuevo material.
* **`onEdit` / `onDelete`:** Funciones que gestionan la edición y eliminación.

```javascript
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState('todos');
```
* **`search`:** Estado donde se almacena el texto que el usuario escribe en el buscador.
* **`filtro`:** Estado que guarda el filtro activo (`'todos'`, `'normal'` o `'bajo'`).

```javascript
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchSearch =
        (item.nombre_material || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.nombre_proyecto || '').toLowerCase().includes(search.toLowerCase());

      if (!matchSearch) return false;

      const bajoStock = item.cantidad_disponible <= (item.stock_minimo || 20);
      if (filtro === 'bajo') return bajoStock;
      if (filtro === 'normal') return !bajoStock;
      return true;
    });
  }, [data, search, filtro]);
```
* **`useMemo`:** Hook de optimización. Solo recalcula la lista si cambian `data`, `search` o `filtro`. Evita lag al tipear.
* **`matchSearch`:** Comprueba si el texto buscado coincide con el nombre del material o de la obra en minúsculas.
* **`bajoStock`:** Booleano que define si el stock está por debajo del mínimo.
* **`filtro === 'bajo'`:** Filtra solo los materiales con stock crítico.

```javascript
  const handleDelete = (item) => {
    const msg = `¿Eliminar "${item.nombre_material}" de la obra "${item.nombre_proyecto}"?`;
    if (typeof window !== 'undefined' && window.confirm) {
      if (window.confirm(msg)) onDelete(item.id, 'inventario');
    } else {
      Alert.alert('Eliminar de Inventario', msg, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => onDelete(item.id, 'inventario') },
      ]);
    }
  };
```
* **`handleDelete`:** Función de seguridad. Muestra un diálogo de confirmación nativo (`window.confirm` en web o `Alert.alert` en Android/iOS) antes de borrar.

```javascript
  const renderItem = ({ item }) => {
    const bajoStock = item.cantidad_disponible <= (item.stock_minimo || 20);

    return (
      <View style={styles.card}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => onSelectItem(item, 'inventario')}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.materialName}>{item.nombre_material}</Text>
              <Text style={styles.projectName}>Obra: {item.nombre_proyecto}</Text>
            </View>
            <View style={[styles.stockBadge, bajoStock ? styles.badgeBajo : styles.badgeNormal]}>
              <Text style={[styles.stockBadgeText, bajoStock ? styles.textBajo : styles.textNormal]}>
                {bajoStock ? 'Stock Bajo' : 'Disponible'}
              </Text>
            </View>
          </View>
```
* **`renderItem`:** Define cómo se dibuja cada tarjeta individual de material.
* **`<Text style={styles.materialName}>{item.nombre_material}</Text>`:** Muestra el nombre del material.
* **`<View style={[styles.stockBadge, bajoStock ? ... : ...]}>`:** Pinta la insignia de verde si hay suficiente stock o de rojo si está en nivel bajo.

```javascript
        <View style={styles.cardFooter}>
          <Text style={styles.idText}>Registro #{item.id}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(item, 'inventario')}>
              <Text style={styles.editBtnText}>Editar Stock</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
              <Text style={styles.deleteBtnText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
```
* **`onEdit(item, 'inventario')`:** Llama a la función de edición pasando los datos de la fila para precargar el modal.
* **`handleDelete(item)`:** Inicia la rutina de confirmación de borrado.

```javascript
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.addBtn} onPress={onOpenAddModal}>
          <Text style={styles.addBtnText}>+ Agregar Material a Obra</Text>
        </TouchableOpacity>
      </View>
```
* Botón superior visible que activa `onOpenAddModal()` para abrir el formulario de inserción.

```javascript
      <FlatList
        data={filteredData}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
```
* **`<FlatList>`:** Componente optimizado de React Native para renderizar listas largas. Solo dibuja los elementos visibles en pantalla ahorrando memoria RAM.

---

## 2.4 Modal de Creación en `src/components/AddInventarioModal.js`

```javascript
export default function AddInventarioModal({ visible, proyectos, materiales, onClose, onSave }) {
  const [loading, setLoading] = useState(false);
  const [proyectoId, setProyectoId] = useState(1);
  const [materialId, setMaterialId] = useState(101);
  const [modoNuevoMaterial, setModoNuevoMaterial] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaUnidad, setNuevaUnidad] = useState('');
  const [cantidad, setCantidad] = useState('50');
```
* **`visible`:** Booleano que controla si el modal se muestra o está oculto.
* **`proyectos` y `materiales`:** Listas que llenan los botones seleccionables.
* **`modoNuevoMaterial`:** Si es `true`, oculta la lista y muestra dos inputs para crear un material inexistente.
* **`cantidad`:** Estado inicial de cantidad (por defecto "50").

```javascript
  const handleSave = async () => {
    const cantNum = parseFloat(cantidad);
    if (isNaN(cantNum) || cantNum <= 0) {
      alert('Ingresa una cantidad mayor a cero');
      return;
    }
    if (modoNuevoMaterial && !nuevoNombre.trim()) {
      alert('Ingresa el nombre del material');
      return;
    }
```
* Valida que el usuario haya escrito números válidos y no deje campos requeridos en blanco.

```javascript
    setLoading(true);
    try {
      await onSave({
        proyecto_id: proyectoId,
        material_id: modoNuevoMaterial ? null : materialId,
        nuevo_material_nombre: modoNuevoMaterial ? nuevoNombre.trim() : null,
        unidad_medida: modoNuevoMaterial ? nuevaUnidad.trim() || 'Unidades' : null,
        cantidad_disponible: cantNum,
      });
      setNuevoNombre('');
      setNuevaUnidad('');
      setCantidad('50');
      setModoNuevoMaterial(false);
      onClose();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
```
* **`await onSave({...})`:** Ejecuta la función de guardado que en `App.js` llama a `dbService.crearInventario(...)`.
* Si todo sale bien, limpia los formularios y llama a `onClose()` para cerrar la ventana modal.

---

# 3. MÓDULO DE TURNOS

---

## 3.1 Backend de Turnos en `server.js`

### A. Endpoint de Lectura (`GET /api/turnos`)

```javascript
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
```
* **`TO_CHAR(tr.fecha_turno, 'YYYY-MM-DD') AS fecha_turno`:** **Instrucción crítica**. En PostgreSQL el tipo `DATE` suele transformarse a objetos Date con zona horaria UTC en Node.js, lo que en países como Colombia (UTC-5) puede hacer que la fecha retroceda un día en pantalla. `TO_CHAR` fuerza a que PostgreSQL devuelva exactamente la cadena de texto `"2026-09-16"` sin desfase horario.
* **`TO_CHAR(tr.hora_inicio, 'HH24:MI:SS') AS hora_inicio`:** Formatea la hora en formato militar de 24 horas (`07:00:00`).
* **`(u.nombres || ' ' || u.apellidos) AS usuario_nombre`:** Operador de concatenación `||` de PostgreSQL que junta el nombre y el apellido del trabajador desde la tabla `usuarios`.
* **`JOIN usuarios u ON tr.usuario_id = u.id_usuario`:** Relaciona el turno con la persona que lo realiza.
* **`WHERE tr.fecha_eliminacion IS NULL`:** Filtra los registros que no hayan sido marcados con borrado lógico.

---

### B. Endpoint de Creación (`POST /api/turnos`)

```javascript
app.post('/api/turnos', async (req, res) => {
  const { proyecto_id, usuario_id, fecha_turno, hora_inicio, hora_fin, estado_asistencia } = req.body;
  try {
    const query = `
      INSERT INTO turnos_relevos (proyecto_id, usuario_id, fecha_turno, hora_inicio, hora_fin, estado_asistencia)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [
      parseInt(proyecto_id, 10),
      parseInt(usuario_id, 10),
      fecha_turno,
      hora_inicio || '07:00:00',
      hora_fin || '15:00:00',
      estado_asistencia || 'Programado',
    ]);
    res.status(201).json({
      message: 'Turno creado con éxito en PostgreSQL',
      data: rows[0],
    });
  } catch (error) {
    console.error('Error al crear turno:', error.message);
    res.status(500).json({ error: error.message });
  }
});
```
* **`INSERT INTO turnos_relevos (...) VALUES ($1, $2, $3, $4, $5, $6)`:** Inserta la nueva fila en PostgreSQL de forma segura usando parámetros preparados para evitar inyección SQL.
* **`hora_inicio || '07:00:00'`:** Si el usuario no especificó hora de inicio, le asigna un horario por defecto de 7:00 AM.
* **`RETURNING *;`:** Devuelve la tupla recién creada incluyendo su nuevo `id` generado por la secuencia de PostgreSQL.

---

### C. Endpoint de Edición (`PUT /api/turnos/:id`)

```javascript
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
```
* **`COALESCE($1, estado_asistencia)`:** Si el parámetro `$1` viene nulo o indefinido, `COALESCE` conserva el valor que ya tenía el campo en la base de datos. Esto permite actualizaciones parciales sin sobreescribir con valores nulos.

---

### D. Endpoint de Eliminación (`DELETE /api/turnos/:id`)

```javascript
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
```
* Elimina físicamente el turno indicado en PostgreSQL.

---

## 3.2 Capa de Datos de Turnos en `src/data/db.js`

```javascript
  getTurnos: async () => {
    try {
      const res = await fetch(`${API_HOST}/api/turnos`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) return await res.json();
      return [];
    } catch (e) {
      console.warn('Error al leer turnos de PostgreSQL:', e.message);
      return [];
    }
  },
```
* Lee la lista de turnos mediante petición HTTP GET.

```javascript
  crearTurno: async (datos) => {
    const res = await fetch(`${API_HOST}/api/turnos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al crear turno');
    return json;
  },
```
* Envía mediante `POST` la carga útil (`proyecto_id`, `usuario_id`, `fecha_turno`, etc.) al backend.

```javascript
  actualizarTurno: async (id, datos) => {
    const res = await fetch(`${API_HOST}/api/turnos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al actualizar turno');
    return json;
  },
```
* Modifica el turno enviando `PUT`.

```javascript
  eliminarTurno: async (id) => {
    const res = await fetch(`${API_HOST}/api/turnos/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al eliminar turno');
    return json;
  }
```
* Elimina el turno enviando `DELETE`.

---

## 3.3 Vista Principal en `src/components/TurnosTab.js`

```javascript
export default function TurnosTab({
  data,
  refreshing,
  onRefresh,
  onSelectItem,
  onOpenAddModal,
  onEdit,
  onDelete,
}) {
```
* Recibe la lista `data` de turnos y las funciones de acción como props.

```javascript
  const getStatusBadge = (estado = '') => {
    const est = estado.toLowerCase();
    if (est.includes('curso')) return { bg: '#e0f2fe', text: '#0369a1' };
    if (est.includes('presente') || est.includes('finalizado')) return { bg: '#dcfce7', text: '#15803d' };
    return { bg: '#fef3c7', text: '#b45309' };
  };
```
* **`getStatusBadge`:** Determina el color de la insignia según el estado del turno:
  * Si contiene "curso" $\rightarrow$ Fondo azul claro con texto azul oscuro.
  * Si contiene "presente" o "finalizado" $\rightarrow$ Fondo verde claro con texto verde oscuro.
  * Cualquier otro (ej: Ausente / Programado) $\rightarrow$ Fondo amarillo suave.

```javascript
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.addBtn} onPress={onOpenAddModal}>
          <Text style={styles.addBtnText}>+ Crear Turno</Text>
        </TouchableOpacity>
      </View>
```
* Botón superior verde que ejecuta `onOpenAddModal()` para abrir el modal de creación de turno.

```javascript
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Fecha: <Text style={styles.infoValue}>{item.fecha_turno}</Text>
            </Text>
            <Text style={styles.infoLabel}>
              Horario: <Text style={styles.infoValue}>{item.hora_inicio} - {item.hora_fin}</Text>
            </Text>
          </View>
```
* Muestra la fecha exacta y la franja horaria pactada para el trabajador.

```javascript
          <View style={styles.actions}>
            <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(item, 'turno')}>
              <Text style={styles.editBtnText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
              <Text style={styles.deleteBtnText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
```
* Botones para modificar el estado o retirar el turno de la base de datos.

---

## 3.4 Modal de Creación en `src/components/AddTurnoModal.js`

```javascript
  const getTodayDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
```
* **`getTodayDate`:** Función utilitaria que calcula la fecha actual del sistema en formato estándar `YYYY-MM-DD` (ej: `2026-09-16`) para que el usuario no tenga que escribir la fecha manualmente.

```javascript
  const [proyectoId, setProyectoId] = useState(1);
  const [usuarioId, setUsuarioId] = useState(1);
  const [fechaTurno, setFechaTurno] = useState(getTodayDate());
  const [horaInicio, setHoraInicio] = useState('07:00:00');
  const [horaFin, setHoraFin] = useState('15:00:00');
  const [estadoAsistencia, setEstadoAsistencia] = useState('Programado');
```
* Inicializa los estados del formulario con valores iniciales lógicos de obra (jornada de 7:00 AM a 3:00 PM, estado "Programado").

```javascript
            {/* 1. Seleccionar Obra */}
            <Text style={styles.label}>1. Obra o Proyecto:</Text>
            <View style={styles.chipColumn}>
              {proyectos.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.chip, proyectoId === p.id && styles.chipActive]}
                  onPress={() => setProyectoId(p.id)}
                >
                  <Text style={[styles.chipText, proyectoId === p.id && styles.chipTextActive]}>
                    {p.nombre_proyecto}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
```
* Mapea el arreglo de `proyectos` traído de PostgreSQL para que el usuario seleccione la obra pulsando un botón simple.

```javascript
            {/* 2. Seleccionar Colaborador */}
            <Text style={styles.label}>2. Colaborador asignado:</Text>
            <View style={styles.chipColumn}>
              {usuarios.map((u) => (
                <TouchableOpacity
                  key={u.id_usuario}
                  style={[styles.chip, usuarioId === u.id_usuario && styles.chipActive]}
                  onPress={() => setUsuarioId(u.id_usuario)}
                >
                  <Text style={[styles.chipText, usuarioId === u.id_usuario && styles.chipTextActive]}>
                    {u.nombres} {u.apellidos} ({u.rol === 1 ? 'Admin' : u.rol === 2 ? 'Supervisor' : u.rol === 3 ? 'Operario' : 'Auxiliar'})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
```
* Mapea el arreglo de `usuarios` para vincular al trabajador por su `id_usuario`.

```javascript
  const handleSave = async () => {
    // ... validaciones ...
    setLoading(true);
    try {
      await onSave({
        proyecto_id: proyectoId,
        usuario_id: usuarioId,
        fecha_turno: fechaTurno.trim(),
        hora_inicio: horaInicio.trim(),
        hora_fin: horaFin.trim(),
        estado_asistencia: estadoAsistencia,
      });
      // ... cierre y reseteo ...
    }
```
* Recoge los valores seleccionados y ejecuta `onSave` que se comunica con la API.

---

# 4. INTEGRACIÓN EN `App.js` (EL DIRECTOR DE ORQUESTA)

[`App.js`](file:///c:/Users/SENA/Desktop/Native/App.js) es el archivo que une todos los componentes anteriores:

```javascript
  const cargarDatos = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [status, uData, iData, tData, pData, mData] = await Promise.all([
        dbService.checkStatus(),
        dbService.getUsuarios(),
        dbService.getInventarios(),
        dbService.getTurnos(),
        dbService.getProyectos(),
        dbService.getMateriales(),
      ]);

      setDbStatus(status);
      setUsuarios(uData);
      setInventarios(iData);
      setTurnos(tData);
      setProyectos(pData);
      setMateriales(mData);
    } catch (err) {
      console.error('Error al sincronizar con PostgreSQL:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
```
* **`cargarDatos`:** La función principal que se ejecuta al inicio y cada vez que agregamos, editamos o eliminamos algo.
* Consulta simultáneamente la salud de PostgreSQL, los usuarios, inventarios, turnos, proyectos y materiales.
* Guarda los arreglos en sus respectivos estados `setInventarios(...)`, `setTurnos(...)`.

```javascript
  const handleAddTurno = async (payload) => {
    try {
      await dbService.crearTurno(payload);
      await cargarDatos(true);
    } catch (err) {
      throw err;
    }
  };
```
* **`handleAddTurno`:** Recibe los datos enviados desde `AddTurnoModal`, llama al servicio `dbService.crearTurno` (que hace el `POST` a PostgreSQL) y una vez completado llama a `cargarDatos(true)` para que la lista de la pantalla se actualice al instante con la nueva fila guardada en la base de datos.

```javascript
  const handleAddInventario = async (payload) => {
    try {
      await dbService.crearInventario(payload);
      await cargarDatos(true);
    } catch (err) {
      throw err;
    }
  };
```
* **`handleAddInventario`:** Misma lógica: envía el nuevo material a PostgreSQL y recarga los datos en memoria.

---

# RESUMEN PARA EL PROFESOR: ¿QUÉ DECIR EN LA PRESENTACIÓN?

1. **Sobre la conexión:**
   *"El frontend en React Native se comunica a través de peticiones HTTP Fetch en formato JSON hacia nuestro servidor Node.js (`server.js`). Este servidor utiliza un pool de conexiones optimizado con la librería `pg` que ejecuta consultas SQL parametrizadas directamente contra la base de datos PostgreSQL `native` en el puerto 5433."*

2. **Sobre el Inventario:**
   *"El módulo de inventario une las tablas `proyectos_obra` y `materiales`. La base de datos tiene una restricción `UNIQUE` por obra y material, por lo que al agregar material el SQL usa `ON CONFLICT DO UPDATE` sumando stock en lugar de duplicar registros."*

3. **Sobre los Turnos:**
   *"El módulo de turnos gestiona el personal en obra. Para evitar problemas de desfase horario entre UTC y hora local, PostgreSQL formatea la fecha y la hora directamente en el motor usando `TO_CHAR(fecha, 'YYYY-MM-DD')` y `TO_CHAR(hora, 'HH24:MI:SS')`. Las ediciones usan `COALESCE` para permitir cambios parciales de asistencia u horario."*
