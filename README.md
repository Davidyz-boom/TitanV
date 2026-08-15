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
- [x] Inicio de sesión (`/auth/login`)
- [ ] Registro público con hash de contraseña real en el frontend (hoy el login del
      frontend solo simula la sesión con `localStorage`, sin llamar al backend)
- [ ] Evidencias multimedia y actas de campo (los modelos y esquemas ya existen,
      falta el router; requiere manejo de subida de archivos)
- [ ] Autenticación con JWT real (hoy el login devuelve un token fijo de ejemplo)

## 🛠️ Stack tecnológico

- **Backend:** Python + FastAPI
- **Base de datos:** PostgreSQL
- **ORM:** SQLAlchemy
- **Validación:** Pydantic
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla, sin frameworks)

## 📂 Estructura del proyecto

Organizada en capas, según el diagrama de componentes del proyecto:

```text
titanV/
├── Frontend/                  # Cliente web (HTML / CSS / JS)
│   ├── login.html / login.js
│   ├── Dashboard.html / dashboard.js
│   └── Proyecto.html / Proyecto.js
│
└── backend/
    ├── requirements.txt
    ├── .env.example            # Variables de entorno de ejemplo
    └── app/
        ├── main.py             # Punto de entrada de la API + CORS + registro de routers
        │
        ├── core/
        │   └── database.py     # Conexión a PostgreSQL, sesión y Base declarativa
        │
        ├── routers/            # Capa de entrada HTTP (validación, status codes)
        │   ├── auth_router.py
        │   ├── usuario_router.py
        │   ├── proyecto_router.py
        │   ├── material_router.py
        │   ├── tarea_router.py         # incluye /tareas/{id}/comentarios
        │   ├── turno_router.py
        │   ├── subcontratista_router.py
        │   └── movimiento_router.py    # kardex + stock por proyecto
        │
        ├── services/           # Lógica de negocio (independiente de FastAPI)
        │   ├── auth_service.py
        │   ├── usuario_service.py
        │   ├── proyecto_service.py
        │   ├── material_service.py
        │   ├── tarea_service.py        # tareas + comentarios
        │   ├── asistencia_service.py
        │   ├── subcontratista_service.py
        │   └── movimiento_service.py   # valida stock antes de cada salida
        │
        ├── schemas/             # Esquemas Pydantic (entrada/salida de la API)
        │   ├── usuario_schema.py
        │   ├── proyecto_schema.py
        │   ├── material_schema.py
        │   ├── tarea_schema.py
        │   └── asistencia_schema.py
        │
        └── models/               # Modelos SQLAlchemy (tablas)
            ├── usuario_model.py
            ├── proyecto_model.py
            ├── material_model.py
            ├── tarea_model.py
            ├── asistencia_model.py
            └── reporte_model.py
```

**Flujo de una petición:** `router` recibe la petición HTTP y valida con un `schema`
→ delega la lógica al `service` correspondiente → el `service` usa los `models` para
leer/escribir en PostgreSQL a través de `core/database.py`.

## ⚙️ Instalación y ejecución local

```bash
cd backend
python -m venv venv
source venv/bin/activate        # En Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copia el archivo de ejemplo y ajusta tu conexión a Postgres
cp .env.example .env

uvicorn app.main:app --reload --port 8000
```

La API queda disponible en `http://localhost:8000`, y la documentación interactiva
(Swagger) en `http://localhost:8000/docs`.

Para el frontend, abre los archivos de `Frontend/` directamente en el navegador o
sírvelos con una extensión tipo Live Server.

## 📡 Endpoints principales

| Método | Ruta                  | Descripción                     |
|--------|-----------------------|----------------------------------|
| POST   | `/auth/login`          | Inicio de sesión                |
| GET    | `/proyectos/`           | Listar proyectos                |
| POST   | `/proyectos/`           | Crear proyecto                  |
| GET    | `/proyectos/{id}`       | Obtener un proyecto              |
| PUT    | `/proyectos/{id}`       | Actualizar un proyecto (parcial)|
| DELETE | `/proyectos/{id}`       | Eliminar un proyecto            |
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
