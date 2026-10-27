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
- [x] Gestión de colaboradores por proyecto (roles: Arquitecto, Trabajador, Visualizador)
- [x] Invitación por correo con enlace (SMTP): la persona no necesita cuenta previa
- [x] Gestión de materiales (CRUD completo) **por proyecto** — cada obra tiene su propio inventario
- [x] Gestión de usuarios (CRUD completo)
- [x] Gestión de tareas y comentarios anidados (CRUD completo)
- [x] Gestión de turnos y asistencia (CRUD completo)
- [x] Gestión de subcontratistas (CRUD completo)
- [x] Kardex de inventario: entradas/salidas con validación de stock disponible
- [x] Autenticación con JWT real (bcrypt + token con expiración)
- [x] Registro público con hash de contraseña real
- [x] Inicio de sesión con Google OAuth 2.0 (verificación server-side)
- [x] Enlaces de invitación por proyecto (link con rol y expiración)
- [x] Evidencias multimedia vinculadas a proyectos (subida de archivos con vista previa)
- [x] Flujo de "proyecto activo": los módulos operativos requieren entrar a un proyecto
- [x] Permisos por rol: el Visualizador solo lee; Arquitecto/Trabajador escriben
- [x] Verificación de sesión activa

## 🛠️ Stack tecnológico

- **Frontend:** React + TypeScript + Vite (SPA)
- **Backend:** Python + FastAPI
- **Base de datos:** PostgreSQL
- **ORM:** SQLAlchemy
- **Validación:** Pydantic
- **Autenticación:** JWT (PyJWT) + Google OAuth 2.0
- **Seguridad:** bcrypt (hash de contraseñas)

## 📂 Estructura del proyecto

```text
titanV/
├── Frontend/                  # SPA React + TypeScript (Vite)
│   ├── src/
│   │   ├── main.tsx           # Entry point (GoogleOAuthProvider)
│   │   ├── App.tsx            # Rutas y estado de autenticación
│   │   ├── api.ts             # Helper fetchConToken (JWT automático)
│   │   ├── components/        # Sidebar, Inicio, Proyectos, Colaboradores,
│   │   │                      # Materiales, Usuarios, Tareas, Comentarios, Turnos,
│   │   │                      # Evidencias, Login, Registro, QuienesSomos
│   │   └── pages/             # LandingPage, LoginPage, DashboardPage,
│   │                          # AceptarInvitacionPage
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
└── backend/                   # API REST Python (FastAPI)
    ├── requirements.txt
    ├── .env.example           # Variables de entorno de ejemplo
    ├── uploads/               # Archivos subidos (evidencias)
    └── app/
        ├── main.py            # Punto de entrada de la API + CORS + registro de routers
        │
        ├── core/              # database, config, security, deps, permissions, soft_delete
        │
        ├── models/            # Usuario, Proyecto, Material, Tarea, Asistencia,
        │                      # Reporte, Colaborador, EnlaceInvitacion
        │
        ├── schemas/           # Esquemas Pydantic (entrada/salida de la API)
        │
        ├── routers/           # Capa de entrada HTTP (validación, status codes)
        │   ├── auth_router.py          # /auth/registro, /auth/login, /auth/google, /auth/verificar
        │   ├── usuario_router.py
        │   ├── proyecto_router.py
        │   ├── colaborador_router.py
        │   ├── material_router.py
        │   ├── tarea_router.py         # incluye /tareas/{id}/comentarios
        │   ├── turno_router.py
        │   ├── subcontratista_router.py
        │   ├── movimiento_router.py    # kardex + stock por proyecto
        │   ├── evidencia_router.py     # evidencias multimedia por proyecto
        │   └── invitacion_router.py    # enlaces y aceptación de invitación
        │
        └── services/         # Lógica de negocio (independiente de FastAPI)
            ├── email_service.py   # envío de correos SMTP (invitaciones)
            └── ...                # auth, colaborador, invitacion, material, reporte, …
```

**Flujo de una petición:** `router` recibe la petición HTTP y valida con un `schema`
→ delega la lógica al `service` correspondiente → el `service` usa los `models` para
leer/escribir en PostgreSQL a través de `core/database.py`.

## 🔑 Sistema de invitaciones

- El **Arquitecto** de un proyecto invita colaboradores desde el módulo
  **Colaboradores**, indicando el correo y el rol (Trabajador o Visualizador).
- El backend crea un enlace con expiración (7 días) y envía un correo SMTP con
  el link; quien lo abre puede **registrarse e ingresar** sin que el Arquitecto
  necesite conocer una cuenta previa.
- Si la persona ya era colaboradora, su rol se actualiza al del enlace (con
  protección para no dejar al proyecto sin Arquitecto).
- Si el correo no puede enviarse (por ejemplo, sin SMTP configurado), la
  respuesta incluye el enlace para que el Arquitecto lo comparta manualmente.
- Los enlaces pueden listarse y revocarse en cualquier momento.

## 👷 Permisos por rol

| Rol          | Puede                                                                  | No puede                                                  |
|--------------|------------------------------------------------------------------------|-----------------------------------------------------------|
| Arquitecto   | Control total: invitar, cambiar roles, quitar colaboradores, CRUD       | —                                                         |
| Trabajador   | Crear/editar tareas y turnos, subir evidencias, registrar movimientos   | Invitar ni administrar colaboradores                      |
| Visualizador | Leer tareas, turnos, evidencias e inventario                            | Crear, editar, eliminar o subir registros                 |

Los módulos operativos (Colaboradores, Insumos, Tareas, Turnos, Evidencias)
solo se desbloquean al **entrar a un proyecto** desde Inicio o desde la barra
lateral, que muestra el proyecto activo y permite cambiarlo en cualquier momento.

## 📡 Endpoints principales

| Método | Ruta                  | Descripción                              |
|--------|-----------------------|-------------------------------------------|
| POST   | `/auth/registro`       | Registro público                          |
| POST   | `/auth/login`          | Inicio de sesión (email + contraseña)     |
| POST   | `/auth/google`         | Inicio de sesión con Google OAuth 2.0     |
| GET    | `/auth/verificar`      | Verificar sesión activa                   |
| GET/POST | `/usuarios/`         | Listar / Crear usuarios                   |
| PUT/DELETE | `/usuarios/{id}`   | Actualizar / Eliminar usuario             |
| GET/POST | `/proyectos/`        | Listar / Crear proyectos                  |
| PUT/DELETE | `/proyectos/{id}`  | Actualizar / Eliminar proyecto            |
| GET/POST | `/proyectos/{id}/colaboradores/` | Invitar por correo (genera enlace + SMTP) |
| GET/POST | `/materiales/?proyecto_id=` | Listar / Crear insumos del proyecto      |
| PUT/DELETE | `/materiales/{id}` | Actualizar / Eliminar material            |
| POST | `/movimientos/`        | Registrar entrada/salida de material (valida stock) |
| GET | `/movimientos/`        | Historial de movimientos (kardex)         |
| GET | `/movimientos/inventario/{proyecto_id}` | Stock actual por proyecto    |
| GET/POST | `/tareas/?proyecto_id=` | Listar / Crear tareas                   |
| PUT/DELETE | `/tareas/{id}`      | Actualizar / Eliminar tarea               |
| GET/POST | `/tareas/{id}/comentarios` | Listar / Publicar comentarios en tarea |
| DELETE | `/tareas/comentarios/{id}` | Eliminar un comentario                 |
| GET/POST | `/turnos/?proyecto_id=` | Listar / Crear turnos                   |
| PUT/DELETE | `/turnos/{id}`      | Actualizar turno (asistencia) / Eliminar  |
| GET/POST | `/proyectos/{id}/evidencias/` | Evidencias multimedia por proyecto   |
| GET/POST | `/proyectos/{id}/enlaces` | Listar / Crear enlaces de invitación   |
| DELETE | `/proyectos/{id}/enlaces/{enlace_id}` | Revocar enlace de invitación   |
| POST | `/invitaciones/{token}/aceptar` | Aceptar invitación (vincular a proyecto) |
| CRUD | `/subcontratistas/`     | Gestión de subcontratistas                |

La documentación interactiva (Swagger) está disponible en `http://localhost:8000/docs`.

## ⚙️ Instalación y ejecución local

### Requisitos previos
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # En Windows: venv\Scripts\activate


# Copia el archivo de ejemplo y ajusta tu conexión a Postgres
copy .env.example .env          # En Linux/Mac: cp .env.example .env

# Opcional: configura SMTP para que las invitaciones lleguen por correo.
# En Gmail usa una contraseña de aplicación (16 dígitos) en SMTP_PASSWORD.
# Si no lo configuras, el enlace de invitación se devuelve al Arquitecto
# para que lo comparta manualmente.

# Crear la base de datos (una sola vez)
psql -U postgres -c "CREATE DATABASE titanv_db;"

uvicorn app.main:app --reload --port 8000
```

La API queda disponible en `http://localhost:8000` y Swagger en `http://localhost:8000/docs`.

### Frontend

```bash
cd Frontend
npm install
npm run dev
```

El frontend queda disponible en `http://localhost:5173`.

## 🧭 Metodología de desarrollo

**Scrum.** Sus ciclos iterativos e incrementales (sprints) se ajustan bien a la
naturaleza cambiante de los requerimientos de construcción y permiten distribuir
el trabajo entre el equipo de desarrollo de forma equitativa.