# 🏗️ Titan V — Sistema de Gestión de Obra

Titan V es un sistema integral de gestión y control de proyectos de infraestructura,
diseñado para centralizar la información operativa, logística y técnica de una
constructora en tiempo real: proyectos, materiales, personal y evidencias de campo.

Está pensado para pequeñas y medianas empresas de construcción, permitiendo llevar
el registro de sus obras, adjuntar evidencia multimedia y mantener informado al
cliente contratante sobre el avance de su proyecto, sin costos de licenciamiento.

## 👥 Usuarios del sistema

1. **Administrador / Constructora**: personal interno (ingenieros, directores de obra,
   supervisores). Crea los proyectos, gestiona inventario y sube avances.
2. **Cliente / Contratante**: usuario externo que consulta el estado de su obra.

## 🚀 Funcionalidades

- [x] Gestión de proyectos de obra (CRUD completo)
- [x] Gestión de materiales (CRUD completo)
- [x] Gestión de usuarios (CRUD completo)
- [x] Gestión de tareas y comentarios anidados (CRUD completo)
- [x] Gestión de turnos y asistencia (CRUD completo)
- [x] Gestión de subcontratistas (CRUD completo)
- [x] Kardex de inventario: entradas/salidas con validación de stock disponible
- [x] Colaboradores por proyecto: Arquitecto / Trabajador / Visualizador — el rol
      de una persona depende del proyecto en el que participa, no es fijo en su cuenta
- [x] Autenticación con JWT real (`/auth/login` emite un token firmado y con expiración)
- [x] Contraseñas cifradas con bcrypt (nunca se guardan en texto plano)
- [x] Soft delete: eliminar un proyecto, material, tarea, turno, subcontratista o
      usuario no borra la fila de la base de datos — la oculta de los listados
      normales pero queda disponible para auditar (`?incluir_eliminados=true`) o
      restaurar (`POST /.../{id}/restaurar`)
- [x] Trigger en PostgreSQL que impide registrar una salida de material mayor al
      stock disponible, a nivel de base de datos (`backend/sql/database.sql`)
- [x] Frontend en React + TypeScript, conectado al backend real (Login, Proyectos)
- [x] Desbloqueo progresivo: un usuario nuevo solo ve "Crear Proyecto" hasta que
      registra el primero
- [ ] Autorización por rol aplicada a **todos** los endpoints (por ahora protegidos:
      eliminar proyecto y gestionar colaboradores — falta extenderlo al resto)
- [ ] Conectar el resto del frontend al backend real (Materiales, Usuarios, Tareas,
      Turnos, Subcontratistas, Inventario siguen usando datos de prueba en memoria)
- [ ] Evidencias multimedia y actas de campo (los modelos y esquemas ya existen,
      falta el router; requiere decidir dónde se guardan los archivos)
- [ ] Migraciones con Alembic (hoy las tablas se crean automáticamente con
      `create_all`, sin control de versiones del esquema)

## 🛠️ Stack tecnológico

- **Backend:** Python + FastAPI
- **Base de datos:** PostgreSQL
- **ORM:** SQLAlchemy
- **Validación:** Pydantic
- **Seguridad:** JWT (PyJWT) + hash de contraseñas (bcrypt)
- **Frontend:** React + TypeScript (Vite)

## 📂 Estructura del proyecto

```text
titanV/
├── Frontend/                    # Cliente web en React + TypeScript (Vite)
│   ├── index.html
│   ├── package.json
│   └── src/
│       ├── main.tsx / App.tsx
│       ├── types.ts             # Tipos compartidos (Sesion, Proyecto, ...)
│       ├── api/
│       │   └── client.ts        # Wrapper único de fetch hacia el backend
│       ├── pages/                # LandingPage, LoginPage, DashboardPage
│       └── components/           # Sidebar, ProyectosTab, MaterialesTab, Usuarios, ...
│
└── backend/
    ├── requirements.txt
    ├── .env.example              # DATABASE_URL + JWT_SECRET_KEY
    └── app/
        ├── main.py                # Punto de entrada de la API + CORS + registro de routers
        │
        ├── core/
        │   └── database.py        # Conexión a PostgreSQL, sesión y Base declarativa
        │
        ├── routers/                # Capa de entrada HTTP (validación, status codes)
        │   ├── auth_router.py           # /auth/login, /auth/verificar
        │   ├── usuario_router.py
        │   ├── proyecto_router.py       # incluye /proyectos/{id}/colaboradores
        │   ├── material_router.py
        │   ├── tarea_router.py          # incluye /tareas/{id}/comentarios
        │   ├── turno_router.py
        │   ├── subcontratista_router.py
        │   └── movimiento_router.py     # kardex + stock por proyecto
        │
        ├── services/                # Lógica de negocio (independiente de FastAPI)
        │   ├── auth_service.py           # hash de contraseñas + JWT + dependencia de sesión
        │   ├── usuario_service.py
        │   ├── proyecto_service.py
        │   ├── colaborador_service.py    # invitar/listar/quitar colaboradores por proyecto
        │   ├── material_service.py
        │   ├── tarea_service.py          # tareas + comentarios
        │   ├── asistencia_service.py
        │   ├── subcontratista_service.py
        │   └── movimiento_service.py     # valida stock antes de cada salida
        │
        ├── schemas/                  # Esquemas Pydantic (entrada/salida de la API)
        │   ├── usuario_schema.py
        │   ├── proyecto_schema.py
        │   ├── colaborador_schema.py
        │   ├── material_schema.py
        │   ├── tarea_schema.py
        │   └── asistencia_schema.py
        │
        └── models/                    # Modelos SQLAlchemy (tablas)
            ├── usuario_model.py
            ├── proyecto_model.py
            ├── colaborador_model.py     # tabla proyecto_colaboradores + enum RolProyecto
            ├── material_model.py
            ├── tarea_model.py
            ├── asistencia_model.py
            └── reporte_model.py
```

**Flujo de una petición:** `router` recibe la petición HTTP y valida con un `schema`
→ delega la lógica al `service` correspondiente → el `service` usa los `models` para
leer/escribir en PostgreSQL a través de `core/database.py`.

## ⚙️ Instalación y ejecución local

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # En Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copia el archivo de ejemplo y ajusta tu conexión a Postgres
cp .env.example .env
```

Antes de arrancar, abre `.env` y define una clave propia para `JWT_SECRET_KEY`
(por ejemplo con `python -c "import secrets; print(secrets.token_hex(32))"`).
Si la dejas vacía, el backend usa una clave de desarrollo — **no la uses en producción**.

Las tablas se crean automáticamente al arrancar (`Base.metadata.create_all`), pero
el **trigger de validación de stock no** — es SQL puro, no algo que SQLAlchemy pueda
crear por ti. Después de tener la base de datos creada, corre:

```bash
psql -U tu_usuario -d titanv_db -f backend/sql/database.sql
```

Este script crea las tablas (si no existen) y el trigger `trigger_validar_stock`,
que impide registrar una salida de material mayor al stock disponible — a nivel de
base de datos, no solo en el backend. Probado directo contra PostgreSQL: una
salida que excede el stock es rechazada por la base de datos incluso si se inserta
con SQL puro, sin pasar por la API.

```bash
uvicorn app.main:app --reload --port 8000
```

La API queda disponible en `http://localhost:8000`, y la documentación interactiva
(Swagger) en `http://localhost:8000/docs`.

### Frontend

```bash
cd Frontend
npm install
npm run dev
```

Queda disponible en `http://localhost:5173`. El backend debe estar corriendo en
paralelo — el frontend apunta a `http://localhost:8000` (ver `src/api/client.ts`).

### Autenticación

Los endpoints protegidos esperan un header `Authorization: Bearer <token>`, con
el token que devuelve `POST /auth/login`. El token expira a las 8 horas.

## 📡 Endpoints principales

| Método | Ruta                  | Descripción                     |
|--------|-----------------------|----------------------------------|
| POST   | `/auth/login`          | Inicio de sesión — devuelve un JWT real |
| GET    | `/auth/verificar`      | Confirma si el token enviado sigue siendo válido |
| GET    | `/proyectos/`           | Listar proyectos (`?usuario_id=` filtra solo los propios) |
| POST   | `/proyectos/`           | Crear proyecto (`?usuario_id=` = quien lo crea, queda como Arquitecto) |
| GET    | `/proyectos/{id}`       | Obtener un proyecto              |
| PUT    | `/proyectos/{id}`       | Actualizar un proyecto (parcial)|
| DELETE | `/proyectos/{id}`       | Eliminar un proyecto 🔒 requiere token + ser Arquitecto |
| GET    | `/proyectos/{id}/colaboradores` | Listar colaboradores del proyecto |
| POST   | `/proyectos/{id}/colaboradores` | Invitar colaborador por correo 🔒 requiere token + ser Arquitecto |
| PUT    | `/proyectos/{id}/colaboradores/{id}` | Cambiar el rol de un colaborador 🔒 |
| DELETE | `/proyectos/{id}/colaboradores/{id}` | Quitar un colaborador 🔒 |
| GET    | `/materiales/`          | Listar materiales               |
| POST   | `/materiales/`          | Crear material                  |
| GET    | `/materiales/{id}`      | Obtener un material              |
| PUT    | `/materiales/{id}`      | Actualizar un material (parcial)|
| DELETE | `/materiales/{id}`      | Eliminar un material             |
| GET    | `/usuarios/`            | Listar usuarios                 |
| POST   | `/usuarios/`            | Crear usuario                   |
| GET    | `/usuarios/{id}`        | Obtener un usuario                |
| PUT    | `/usuarios/{id}`        | Actualizar un usuario             |
| DELETE | `/usuarios/{id}`        | Eliminar un usuario               |
| GET    | `/tareas/?proyecto_id=` | Listar tareas (filtro opcional) |
| POST   | `/tareas/`              | Crear tarea                     |
| PUT    | `/tareas/{id}`          | Actualizar tarea (parcial)      |
| DELETE | `/tareas/{id}`          | Eliminar tarea                  |
| GET    | `/tareas/{id}/comentarios` | Listar comentarios de una tarea |
| POST   | `/tareas/{id}/comentarios` | Publicar comentario en una tarea |
| DELETE | `/tareas/comentarios/{id}` | Eliminar un comentario          |
| GET    | `/turnos/?proyecto_id=` | Listar turnos (filtro opcional) |
| POST   | `/turnos/`              | Crear turno                     |
| PUT    | `/turnos/{id}`          | Actualizar turno (marcar asistencia) |
| DELETE | `/turnos/{id}`          | Eliminar turno                  |
| GET    | `/subcontratistas/?proyecto_id=` | Listar subcontratistas |
| POST   | `/subcontratistas/`     | Registrar subcontratista         |
| PUT    | `/subcontratistas/{id}` | Actualizar subcontratista        |
| DELETE | `/subcontratistas/{id}` | Eliminar subcontratista          |
| POST   | `/movimientos/`         | Registrar entrada/salida de material (valida stock) |
| GET    | `/movimientos/?proyecto_id=&material_id=` | Historial de movimientos (kardex) |
| GET    | `/movimientos/inventario/{proyecto_id}` | Stock actual por proyecto |

## 🧭 Metodología de desarrollo

**Scrum.** Sus ciclos iterativos e incrementales (sprints) se ajustan bien a la
naturaleza cambiante de los requerimientos de construcción y permiten distribuir
el trabajo entre el equipo de desarrollo de forma equitativa.
