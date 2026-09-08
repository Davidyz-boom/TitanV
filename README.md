# Titan V — Sistema de Gestion de Obra

Titan V es un sistema integral de gestion y control de proyectos de construccion,
diseñado para centralizar la informacion operativa, logistica y tecnica de una
constructora en tiempo real: proyectos, materiales, personal, tareas, inventario
y evidencias de campo.

Esta pensado para pequeñas y medianas empresas de construccion, permitiendo llevar
el registro de sus obras, adjuntar evidencia multimedia y mantener informado al
cliente contratante sobre el avance de su proyecto, sin costos de licenciamiento.

## Stack tecnologico

| Capa | Tecnologia | Version |
|------|-----------|---------|
| Frontend | React + TypeScript | React 19.2 / TS 6.0 |
| Bundler | Vite | 8.2 |
| Backend | Python + FastAPI | 0.141.1 |
| ORM | SQLAlchemy | 2.0.52 |
| Base de datos | PostgreSQL | 18 |
| Autenticacion | JWT (PyJWT) + Google OAuth 2.0 | 2.13 |
| Seguridad | bcrypt (hash de contrasenas) | 5.0 |
| Validacion | Pydantic | 2.13 |

## Estructura del proyecto

```text
TitanV--/
├── Frontend/                      # SPA React + TypeScript
│   ├── src/
│   │   ├── main.tsx               # Entry point (GoogleOAuthProvider)
│   │   ├── App.tsx                # Rutas y estado de autenticacion
│   │   ├── api.ts                 # Helper fetchConToken (JWT automatico)
│   │   ├── components/
│   │   │   ├── Sidebar.tsx        # Navegacion lateral (7 modulos)
│   │   │   ├── InicioTab.tsx      # Dashboard de inicio / onboarding
│   │   │   ├── ProyectosTab.tsx   # CRUD de proyectos de obra
│   │   │   ├── MaterialesTab.tsx  # Catalogo de materiales
│   │   │   ├── Usuarios.tsx       # Tabla de usuarios (solo lectura)
│   │   │   ├── TareasTab.tsx      # CRUD de tareas + estados
│   │   │   ├── Comentarios.tsx    # Comentarios anidados por tarea
│   │   │   ├── TurnosTab.tsx      # Programacion de turnos
│   │   │   ├── EvidenciasTab.tsx  # Subida de evidencias multimedia
│   │   │   ├── Login.tsx          # Formulario de login
│   │   │   ├── Registro.tsx       # Formulario de registro
│   │   │   ├── CardAccion.tsx     # Componente reutilizable de input
│   │   │   ├── Productos.tsx      # (Legacy/mock, no se usa)
│   │   │   └── QuienesSomos.tsx   # Seccion de mision/vision/valores
│   │   └── pages/
│   │       ├── LandingPage.tsx    # Pagina publica con video
│   │       ├── LoginPage.tsx      # Login email + Google OAuth
│   │       └── DashboardPage.tsx  # Dashboard con sidebar + tabs
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── backend/                       # API REST Python
│   ├── .env                       # Variables de entorno (DB + JWT)
│   ├── requirements.txt           # Dependencias Python
│   ├── venv/                      # Entorno virtual
│   ├── uploads/                   # Archivos subidos (evidencias)
│   ├── sql/
│   │   └── database.sql           # Script completo de BD + trigger
│   └── app/
│       ├── main.py                # FastAPI app + CORS + create_all
│       ├── core/
│       │   ├── database.py        # Conexion PostgreSQL + SessionLocal
│       │   ├── config.py          # SECRET_KEY, ALGORITHM, TOKEN_EXPIRE
│       │   ├── security.py        # JWT encode/decode, hash password
│       │   ├── deps.py            # get_current_user (dependency FastAPI)
│       │   ├── permissions.py     # Control de roles por proyecto
│       │   └── soft_delete.py     # Utilidades de eliminacion logica
│       ├── models/                # Modelos SQLAlchemy (tablas)
│       │   ├── usuario_model.py
│       │   ├── proyecto_model.py
│       │   ├── material_model.py
│       │   ├── tarea_model.py
│       │   ├── asistencia_model.py
│       │   ├── reporte_model.py   # Evidencias + Actas de campo
│       │   └── colaborador_model.py
│       ├── schemas/               # Esquemas Pydantic (validacion)
│       │   ├── usuario_schema.py
│       │   ├── proyecto_schema.py
│       │   ├── material_schema.py
│       │   ├── tarea_schema.py
│       │   ├── asistencia_schema.py
│       │   ├── colaborador_schema.py
│       │   └── reporte_schema.py
│       ├── routers/               # Endpoints HTTP
│       │   ├── auth_router.py
│       │   ├── usuario_router.py
│       │   ├── proyecto_router.py
│       │   ├── colaborador_router.py
│       │   ├── material_router.py
│       │   ├── tarea_router.py
│       │   ├── turno_router.py
│       │   ├── movimiento_router.py
│       │   ├── evidencia_router.py
│       │   └── subcontratista_router.py
│       └── services/              # Logica de negocio
│           ├── auth_service.py
│           ├── usuario_service.py
│           ├── proyecto_service.py
│           ├── material_service.py
│           ├── tarea_service.py
│           ├── asistencia_service.py
│           ├── movimiento_service.py
│           ├── reporte_service.py
│           ├── colaborador_service.py
│           └── subcontratista_service.py
│
└── PRESENTACION_TITAN_V.md        # Material de exposicion
```

**Flujo de una peticion:**
`Router` (valida entrada HTTP + JWT) → `Service` (logica de negocio) → `Models` (SQLAlchemy ORM) → PostgreSQL

## Arquitectura

El sistema sigue una **arquitectura en capas** separada en responsabilidades:

- **Frontend (React):** consume la API REST, maneja JWT en localStorage, renderiza 7 modulos funcionales con un sidebar de navegacion.
- **Routers (FastAPI):** validan entradas con Pydantic, verifican autenticacion/permisos, retornan respuestas HTTP con status codes adecuados.
- **Services (Python puro):** logica de negocio independiente de FastAPI. Facilmente testeable.
- **Models (SQLAlchemy):** mapean tablas PostgreSQL con relaciones, constraints y enums.
- **PostgreSQL:** base de datos relacional con triggers de validacion de stock.

## Base de datos

12 tablas en PostgreSQL con relaciones de cascada y eliminacion logica:

| Tabla | Descripcion |
|-------|-------------|
| `usuarios` | Usuarios del sistema con roles (1=Admin, 2=Supervisor, 3=Operario) |
| `proyectos_obra` | Obras con estado (Planificacion / En Ejecucion / Finalizado) |
| `proyecto_colaboradores` | Usuarios asignados a proyectos con rol por proyecto |
| `materiales` | Catalogo de tipos de material (nombre + unidad) |
| `inventario_obras` | Stock disponible por proyecto y material |
| `historial_movimientos` | Kardex inmutable: entradas, salidas, ajustes con usuario |
| `tareas` | Tareas asignadas a proyectos con estado y operario |
| `comentarios` | Comentarios anidados en tareas (max 300 caracteres) |
| `turnos_relevos` | Programacion de turnos con control de asistencia |
| `evidencias_multimedia` | Fotos, videos y PDFs vinculados a proyectos |
| `actas_campo` | Actas con firma y coordenadas GPS |
| `subcontratistas` | Empresas subcontratadas con polizas y SS |

**Trigger de PostgreSQL:** `trigger_validar_stock` valida automaticamente que no se pueda sacar mas material del disponible antes de cada INSERT en `historial_movimientos`.

## Funcionalidades

### Autenticacion y seguridad
- Login con email + password (bcrypt + JWT)
- Login con Google OAuth 2.0 (verificacion server-side)
- Registro publico con rol por defecto (Operario)
- Verificacion de sesion activa
- Tokens con expiracion

### Gestion de proyectos (CRUD)
- Crear, listar, actualizar, eliminar y restaurar proyectos
- Estados: Planificacion → En Ejecucion → Finalizado
- El creador se asigna automaticamente como Arquitecto
- Filtro por usuario (solo ve proyectos donde participa)

### Colaboradores por proyecto
- Invitar usuarios existentes por correo
- Roles por proyecto: Arquitecto, Trabajador, Visualizador
- Proteccion: no se puede eliminar o degradar al ultimo Arquitecto

### Catalogo de materiales (CRUD)
- Crear tipos de material con nombre y unidad de medida
- Soft delete que preserva historial

### Inventario y kardex
- Registro de movimientos: Entrada, Salida, Ajuste
- Stock por proyecto (auto-creacion de inventario)
- Validacion doble: en Python (servicio) + trigger en PostgreSQL
- Historial inmutable con usuario responsable

### Tareas y comentarios (CRUD)
- Tareas asignadas a proyecto y operario
- Estados: Pendiente, En Proceso, Completada
- Comentarios anidados por tarea (max 300 caracteres)
- Soft delete en tareas y comentarios

### Turnos y asistencia
- Programacion de turnos por proyecto y operario
- Registro de asistencia: Programado, Presente, Ausente

### Evidencias multimedia
- Subida de archivos: JPG, PNG, WEBP, PDF, MP4 (max 15 MB)
- Almacenamiento con nombre UUID
- Vista previa de imagenes en el frontend
- Vinculacion a proyecto y usuario

### Subcontratistas
- CRUD con registro de polizas y seguridad social
- Filtro por proyecto

## Endpoints principales

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/auth/registro` | Registro publico |
| POST | `/auth/login` | Login email/password |
| POST | `/auth/google` | Login con Google OAuth |
| GET | `/auth/verificar` | Verificar sesion activa |
| GET/POST | `/usuarios/` | Listar / Crear usuarios |
| PUT/DELETE | `/usuarios/{id}` | Actualizar / Eliminar usuario |
| GET/POST | `/proyectos/` | Listar / Crear proyectos |
| PUT/DELETE | `/proyectos/{id}` | Actualizar / Eliminar proyecto |
| GET/POST | `/proyectos/{id}/colaboradores/` | Gestionar colaboradores |
| GET/POST | `/materiales/` | Listar / Crear materiales |
| PUT/DELETE | `/materiales/{id}` | Actualizar / Eliminar material |
| POST | `/movimientos/` | Registrar movimiento (valida stock) |
| GET | `/movimientos/` | Historial kardex |
| GET | `/movimientos/inventario/{id}` | Stock actual por proyecto |
| GET/POST | `/tareas/` | Listar / Crear tareas |
| PUT/DELETE | `/tareas/{id}` | Actualizar / Eliminar tarea |
| GET/POST | `/tareas/{id}/comentarios` | Comentarios por tarea |
| GET/POST | `/turnos/` | Listar / Crear turnos |
| PUT/DELETE | `/turnos/{id}` | Actualizar / Eliminar turno |
| GET/POST | `/proyectos/{id}/evidencias/` | Evidencias multimedia |
| DELETE | `/proyectos/{id}/evidencias/{id}` | Eliminar evidencia |
| CRUD | `/subcontratistas/` | Gestion de subcontratistas |

La documentacion interactiva (Swagger) esta disponible en `http://localhost:8000/docs`.

## Instalacion y ejecucion

### Requisitos previos
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate                 # En Linux/Mac: source venv/bin/activate
pip install -r requirements.txt

# Configurar variables de entorno
copy .env.example .env                # Editar con tus credenciales de PostgreSQL

# Iniciar servidor
python -m uvicorn app.main:app --reload --port 8000
```

La API estara en `http://localhost:8000` y Swagger en `http://localhost:8000/docs`.

### Frontend

```bash
cd Frontend
npm install
npm run dev
```

El frontend estara en `http://localhost:5173` (por defecto).

### Base de datos

```bash
# Crear la base de datos (una sola vez)
psql -U postgres -c "CREATE DATABASE titanv_db;"

# Las tablas se crean automaticamente al iniciar el backend
# Opcionalmente puedes ejecutar sql/database.sql para el esquema manual
```

## Variables de entorno

### Backend (`.env`)

| Variable | Descripcion | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Conexion a PostgreSQL | `postgresql://postgres:1234@localhost:5432/titanv_db` |
| `JWT_SECRET_KEY` | Clave para firmar tokens JWT | `cambia-esto-por-una-clave-larga-y-aleatoria` |
| `JWT_EXPIRE_MINUTES` | Minutos de expiracion del token | `60` (default) |

### Frontend (`.env`)

| Variable | Descripcion | Default |
|----------|-------------|---------|
| `VITE_API_URL` | URL del backend | `http://127.0.0.1:8000` |
| `VITE_GOOGLE_CLIENT_ID` | Client ID de Google OAuth | `''` |

## Metodologia de desarrollo

**Scrum.** Ciclos iterativos e incrementales (sprints) ajustados a la naturaleza
cambiante de los requerimientos de construccion, distribuyendo el trabajo de forma
equitativa entre el equipo de desarrollo.

## Documentacion adicional

- `PRESENTACION_TITAN_V.md` — Material completo para exposicion del proyecto (problema, objetivos, arquitectura, guion de demo, etc.)
