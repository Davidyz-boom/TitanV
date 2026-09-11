# Guía de Sustentación para el Profesor: Funcionamiento de la Aplicación

Este documento está diseñado para explicar al profesor o jurado evaluador, de forma clara, técnica y paso a paso, cómo inicia la aplicación y cómo funcionan los módulos de **Turnos** e **Inventarios**.

---

## 1. Ficha Técnica y Arquitectura del Proyecto

* **Frontend:** React Native (Expo SDK 57, React 19).
* **Backend:** Node.js con Express y el conector oficial `pg` (node-postgres).
* **Base de Datos:** PostgreSQL 18 (Base de datos: `native`, escuchando en el puerto local `5433`).
* **Estilo de Arquitectura:** Cliente-Servidor desacoplado mediante API REST con formato de intercambio JSON.

---

## 2. ¿Cómo Inicia el Código? (Ciclo de Vida de Arranque)

Cuando el usuario o evaluador abre la aplicación, se ejecuta una secuencia ordenada en 6 pasos:

```
[1. PostgreSQL native (Puerto 5433)]
               ▲
               │ Pool de conexiones TCP
               ▼
[2. Servidor server.js (Puerto 3001)]
               ▲
               │ Peticiones HTTP Fetch (JSON)
               ▼
[3. index.js] ➔ [4. App.js (useEffect)] ➔ [5. Promise.all] ➔ [6. Renderizado UI]
```

### Paso 1: Conexión con PostgreSQL en `server.js`
El servidor backend se conecta a la base de datos `native` mediante un **Pool de Conexiones**:
```javascript
const pool = new Pool({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: 'tu_password',
  database: 'native',
});
```
* **¿Por qué usar un `Pool`?** Porque en lugar de abrir y cerrar una conexión por cada clic (lo que volvería la app lenta), el pool mantiene un conjunto de conexiones abiertas listas para atender consultas en milisegundos.

---

### Paso 2: El punto de entrada de React Native (`index.js`)
El archivo [`index.js`](file:///c:/Users/SENA/Desktop/Native/index.js) es el primer archivo que lee el motor de Expo / React Native:
```javascript
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
```
* Su única función es registrar el componente principal `App` dentro del contenedor nativo (móvil o web).

---

### Paso 3: Montaje del Componente Principal (`App.js`)
Al cargarse [`App.js`](file:///c:/Users/SENA/Desktop/Native/App.js), se inicializan los estados locales de React (`useState`):
* `usuarios`: Lista vacía `[]`.
* `inventarios`: Lista vacía `[]`.
* `turnos`: Lista vacía `[]`.
* `loading`: `true` (para mostrar el spinner de carga inicial).
* `dbStatus`: `{ online: false }`.

---

### Paso 4: Disparo del Hook `useEffect`
Inmediatamente después del primer render, se dispara el hook de ciclo de vida `useEffect`:
```javascript
useEffect(() => {
  cargarDatos();
}, [cargarDatos]);
```

---

### Paso 5: Lectura Concurrente con `Promise.all`
Dentro de la función `cargarDatos`, se utiliza `Promise.all` para consultar **en paralelo** todos los endpoints necesarios:
```javascript
const [status, uData, iData, tData, pData, mData] = await Promise.all([
  dbService.checkStatus(),     // GET /api/status (Verifica si PostgreSQL está en línea)
  dbService.getUsuarios(),      // GET /api/usuarios (Tabla usuarios)
  dbService.getInventarios(),   // GET /api/inventarios (Tabla inventario_obras)
  dbService.getTurnos(),        // GET /api/turnos (Tabla turnos_relevos)
  dbService.getProyectos(),     // GET /api/proyectos (Tabla proyectos_obra)
  dbService.getMateriales(),    // GET /api/materiales (Tabla materiales)
]);
```
* **Ventaja para responder al profesor:** Al usar `Promise.all`, las 6 peticiones se envían al mismo tiempo y no en cascada. La carga total toma lo que tarda la petición más lenta (menos de 100 ms), logrando un inicio ultrarrápido.

---

### Paso 6: Actualización de Estado y Renderizado
* Se actualizan los estados (`setUsuarios`, `setInventarios`, etc.).
* `setLoading(false)` oculta el spinner de carga.
* Se renderiza el [`Header.js`](file:///c:/Users/SENA/Desktop/Native/src/components/Header.js) mostrando el punto verde: `Conectado a PostgreSQL (native - puerto 5433)`.
* Se dibuja la pestaña activa (por defecto, `InventariosTab`).

---

## 3. ¿Cómo Funciona el Módulo de Inventarios?

### 1. Propósito Operativo
En el sector de la construcción, cada obra es un centro de costos independiente. Este módulo responde a dos necesidades:
1. **Control de existencias por obra:** Saber qué materiales y qué cantidades exactas hay en cada proyecto físico.
2. **Prevención de desabastecimiento:** Alertar si un material está por debajo del stock mínimo para que el residente de obra solicite compras a tiempo.

---

### 2. Modelo Relacional en la Base de Datos
La tabla principal es `inventario_obras`, que actúa como tabla intermedia relacionando obras con materiales:

```
[ proyectos_obra ] 1 ───< N [ inventario_obras ] N >─── 1 [ materiales ]
  - id                        - id                          - id
  - nombre_proyecto           - proyecto_id (FK)            - nombre_material
  - ubicacion_direccion       - material_id (FK)            - unidad_medida
                              - cantidad_disponible (FLOAT)
```

Restricción clave:
```sql
CONSTRAINT unique_material_por_proyecto UNIQUE (proyecto_id, material_id)
```
Esto impide tener duplicados del mismo material en la misma obra a nivel de base de datos.

---

### 3. Flujos del Código de Inventario

#### A. Lectura de Inventario (`GET /api/inventarios`)
En [`server.js`](file:///c:/Users/SENA/Desktop/Native/server.js), el endpoint realiza una consulta SQL con `JOIN`:
```sql
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
```
* **En el Frontend ([`InventariosTab.js`](file:///c:/Users/SENA/Desktop/Native/src/components/InventariosTab.js)):**
  * La aplicación compara: `if (item.cantidad_disponible <= item.stock_minimo)`.
  * Si es menor o igual, muestra la insignia roja **Stock Bajo**.
  * Si es mayor, muestra la insignia verde **Disponible**.
  * Cuenta con un buscador en memoria (`useMemo`) que filtra por nombre de material u obra sin necesidad de recargar la página.

#### B. Registro de Material (`POST /api/inventarios`)
Cuando el usuario presiona **"+ Agregar Material a Obra"**, se abre [`AddInventarioModal.js`](file:///c:/Users/SENA/Desktop/Native/src/components/AddInventarioModal.js):
1. El usuario selecciona la obra y el material (o crea uno nuevo).
2. Ingresa la cantidad inicial disponible.
3. El backend recibe los datos e implementa una **transacción ACID** con manejo de conflictos:
```sql
INSERT INTO inventario_obras (proyecto_id, material_id, cantidad_disponible)
VALUES ($1, $2, $3)
ON CONFLICT (proyecto_id, material_id) 
DO UPDATE SET cantidad_disponible = inventario_obras.cantidad_disponible + EXCLUDED.cantidad_disponible;
```
* **Respuesta para el profesor:** Si el material ya existía en esa obra, el motor de base de datos no arroja error, sino que suma la nueva cantidad al stock disponible de forma atómica.

#### C. Modificación de Stock (`PUT /api/inventarios/:id`)
1. El usuario toca el botón **"Editar Stock"** en una tarjeta.
2. Se abre [`EditModal.js`](file:///c:/Users/SENA/Desktop/Native/src/components/EditModal.js) con el valor actual precargado.
3. Al modificar la cifra y presionar "Guardar", se envía `PUT /api/inventarios/:id` con la nueva `cantidad_disponible`.
4. El servidor ejecuta: `UPDATE inventario_obras SET cantidad_disponible = $1 WHERE id = $2`.
5. Inmediatamente `App.js` llama a `cargarDatos(true)` y la interfaz se refresca automáticamente con los datos guardados en disco.

#### D. Eliminación (`DELETE /api/inventarios/:id`)
1. El usuario presiona **"Eliminar"**.
2. La app solicita confirmación (`window.confirm` o `Alert.alert`).
3. Al confirmar, se envía la petición `DELETE /api/inventarios/:id`.
4. El servidor ejecuta: `DELETE FROM inventario_obras WHERE id = $1`.
5. La fila se elimina de PostgreSQL y desaparece de la pantalla.

---

## 4. ¿Cómo Funciona el Módulo de Turnos?

### 1. Propósito Operativo
En obras de infraestructura o edificación se trabaja por cuadrillas y maquinaria con horarios específicos (relevos diurnos, nocturnos o mixtos). Este módulo sirve para:
1. **Control de asistencia diaria:** Saber qué operario o supervisor está *En Curso*, *Presente*, *Finalizado* o *Ausente*.
2. **Asignación horaria:** Establecer la hora exacta de entrada (`hora_inicio`) y salida (`hora_fin`) de cada trabajador por proyecto.
3. **Seguridad y auditoría:** Identificar quién era el responsable ante cualquier incidente o entrega de fase en obra.

---

### 2. Modelo Relacional en la Base de Datos
La tabla `turnos_relevos` conecta a un usuario (`operario/supervisor`) con una obra (`proyecto_id`):

```
[ usuarios ] 1 ───────────< N [ turnos_relevos ] N >─────────── 1 [ proyectos_obra ]
  - id_usuario                  - id                                - id
  - nombres                     - usuario_id (FK)                   - nombre_proyecto
  - apellidos                   - proyecto_id (FK)                  - ubicacion_direccion
                                - fecha_turno (DATE)
                                - hora_inicio (TIME)
                                - hora_fin (TIME)
                                - estado_asistencia (VARCHAR)
                                - fecha_eliminacion (TIMESTAMP)
```

---

### 3. Flujos del Código de Turnos

#### A. Lectura de Turnos (`GET /api/turnos`)
El endpoint en [`server.js`](file:///c:/Users/SENA/Desktop/Native/server.js) realiza la consulta con formato explícito:
```sql
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
```

* **Detalle técnico de alto valor para el profesor:**
  * Se utiliza `TO_CHAR(tr.fecha_turno, 'YYYY-MM-DD')` y `TO_CHAR(tr.hora_inicio, 'HH24:MI:SS')` directamente en SQL. ¿Por qué? Porque si se devolviera el objeto `Date` nativo de JavaScript, las zonas horarias (UTC vs GMT-5) cambiarían las fechas restando un día o alterando las horas. Con `TO_CHAR`, PostgreSQL garantiza que el horario se visualice exactamente como fue pactado en obra.
  * La cláusula `WHERE tr.fecha_eliminacion IS NULL` soporta borrado lógico o turnos vigentes.

* **En el Frontend ([`TurnosTab.js`](file:///c:/Users/SENA/Desktop/Native/src/components/TurnosTab.js)):**
  * Presenta tarjetas con el nombre del colaborador, el proyecto, la fecha y la franja horaria.
  * Colorea la insignia según el estado:
    * **En Curso:** Azul suave.
    * **Presente / Finalizado:** Verde suave.
    * **Ausente Justificado:** Amarillo suave.
  * Filtros de cabecera para ver solo los turnos *En Curso* o *Finalizados*.

#### B. Modificación de Turno (`PUT /api/turnos/:id`)
Permite cambiar el estado de asistencia o reprogramar los horarios:
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
* **¿Qué hace `COALESCE` en SQL?** Permite actualizaciones parciales: si en la petición no se envía la hora de fin, `COALESCE(NULL, hora_fin)` mantiene intacto el valor que ya tenía el registro en la base de datos sin sobreescribirlo con nulo.

#### C. Eliminación de Turno (`DELETE /api/turnos/:id`)
Ejecuta la eliminación directa en PostgreSQL:
```sql
DELETE FROM turnos_relevos WHERE id = $1;
```
Al responder satisfactoriamente, `App.js` refresca los turnos en pantalla de inmediato.

---

## 5. Preguntas Típicas del Profesor y Cómo Responderlas

### Pregunta 1: "¿Por qué React Native no se conecta directamente a PostgreSQL sin pasar por Node.js?"
> **Respuesta:**
> *"Por arquitectura y seguridad. Los clientes móviles o navegadores web corren en entornos no seguros donde exponer las credenciales de la base de datos (usuario, contraseña y puerto de PostgreSQL) permitiría que cualquier usuario descompile el código y acceda directamente al motor. Además, React Native corre sobre JavaScript y no tiene sockets TCP directos para el protocolo nativo de PostgreSQL. Por eso, el estándar de la industria es usar un servidor backend intermediario (en nuestro caso, Express en `server.js`) que valide las peticiones y ejecute consultas seguras mediante parámetros preparados."*

---

### Pregunta 2: "¿Cómo evitan inyecciones SQL en las consultas?"
> **Respuesta:**
> *"En todo el archivo `server.js` se utilizan parámetros preparados con la sintaxis de marcadores de posición `$1, $2, $3...` provista por la librería `pg`. Nunca se concatenan cadenas directas en las sentencias SQL (`query + variable`), lo que neutraliza cualquier intento de inyección de código malicioso."*

---

### Pregunta 3: "¿Qué sucede si el usuario se queda sin internet o se apaga PostgreSQL?"
> **Respuesta:**
> *"En `App.js` y `db.js`, las llamadas a la API están envueltas en bloques `try/catch` con tiempos límite (`AbortSignal.timeout`). Si el servidor o la base de datos no responden, la aplicación no se congela ni se cierra forzosamente; en su lugar, el indicador superior cambia a rojo ('Sin conexión a base de datos') y carga datos de respaldo en memoria local (fallback) para que la interfaz siga operativa."*

---

### Pregunta 4: "¿Por qué el diseño de la interfaz es limpio y no tiene estilos sobrecargados?"
> **Respuesta:**
> *"Porque se diseñó bajo los estándares de una aplicación administrativa empresarial (B2B). En sistemas de control de obra y logística, la prioridad es la legibilidad de los datos en campo bajo luz solar, el contraste claro, la rapidez de respuesta táctil y la simplicidad en la operación diaria por parte de supervisores e ingenieros residentes."*
