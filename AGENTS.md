# AGENTS.md — Titan V

Contexto de proyecto para sesiones futuras de opencode. Léelo completo antes de
trabajar; el README.md sigue siendo la fuente de verdad funcional de la app.

## Qué es el proyecto

**Titan V** es un sistema web de gestión de proyectos de infraestructura/obra
para PyMEs de construcción: proyectos, equipos (colaboradores con roles),
inventario por obra, tareas, turnos, evidencias multimedia y kardex de material.
El cliente (contratante) consulta el avance de su obra; la constructora lo opera.

## Stack

- **Frontend**: React 19 + TypeScript + Vite (SPA) en `Frontend/`
- **Backend**: Python 3 + FastAPI + SQLAlchemy en `backend/`
- **Base de datos**: PostgreSQL local (`titanv_db`)
- **Autenticación**: JWT (PyJWT) + Google OAuth 2.0 (verificación server-side con httpx)
- **Correo**: SMTP (Gmail) para invitaciones (`email_service.py`)
- Sin tests automatizados; validación = `npm run build` (front) + import de la app (back)

## Estructura

```text
titanV/
├── Frontend/src/
│   ├── main.tsx            # GoogleOAuthProvider (VITE_GOOGLE_CLIENT_ID)
│   ├── App.tsx             # Rutas + estado de sesión (localStorage: token)
│   ├── api.ts              # fetchConToken (adjunta JWT, en 401 limpia token)
│   ├── pages/              # Landing, Login, Dashboard, AceptarInvitacion
│   └── components/         # Sidebar, Inicio, Proyectos, Colaboradores,
│                           # Materiales, Tareas, Turnos, Evidencias, Comentarios…
└── backend/app/
    ├── main.py             # Entry point + CORS + routers + create_all
    ├── core/               # config, database, security (bcrypt), deps, permissions
    ├── models/             # Usuario, ProyectoObra, ProyectoColaborador, Material,
    │                       # Tarea, TurnoRelevo, EnlaceInvitacion, Evidencia…
    ├── schemas/            # Pydantic (in/out) — backend/app/schemas/__init__.py
    ├── routers/            # Capa HTTP (valida + status codes)
    └── services/           # Lógica de negocio (sin depender de FastAPI)
```

## Arquitectura y reglas de seguridad (NO romper)

1. **Aislamiento por usuario**: la identidad SIEMPRE sale del JWT
   (`get_current_user`), nunca de `localStorage` ni de query params. Los
   proyectos se listan solo donde el usuario es colaborador
   (`proyecto_service.listar_proyectos` filtra por id del token).
2. **Rol por proyecto** (`RolProyecto`): `Arquitecto`/`Trabajador`/`Visualizador`.
   - Arquitecto: control total + invitar + cambiar/quitar colaboradores + borrar evidencias/comentarios ajenos.
   - Trabajador: escribe (tareas, turnos, evidencias, movimientos) pero no administra.
   - Visualizador: solo lectura. Rutas de escritura usan `_verificar_escritura_*`
     o `verificar_rol_proyecto(..., ARQUITECTO, TRABAJADOR)`.
   - Un proyecto nunca se queda sin Arquitecto (`_validar_no_es_ultimo_arquitecto`).
3. **Materiales por proyecto**: `materiales.proyecto_id` es obligatorio; no hay catálogo global.
4. **Soft delete**: se marcan con `fecha_eliminacion` (nunca borrado físico) via `core/soft_delete.py`.
5. **Invitaciones**: crean enlace expirable (7 días) + correo SMTP. Los enlaces NO
   conceden rol Arquitecto. Si no hay SMTP, el enlace se devuelve al Arquitecto.
6. **Flujo de "proyecto activo"** en el front: los módulos operativos solo se
   desbloquean al entrar a un proyecto; la Sidebar lo muestra y permite cambiarlo.

## Cómo correr (entorno local actual)

- Postgres corre en `localhost:5432` (ver `backend/.env`, que ya está configurado
  con DB, JWT y SMTP — no subir claves reales a git).
- Backend en segundo plano:
  `Start-Process ...\backend\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000`
  (logs en `C:\Users\User\AppData\Local\Temp\opencode\*.log`). Swagger: http://localhost:8000/docs
- Frontend: `npm run dev` → http://localhost:5173 (`Frontend/.env` ya tiene el Google Client ID).

## Verificación obligatoria antes de terminar

- Frontend: `npm run build` en `Frontend/` (tsc + vite).
- Backend: `backend\venv\Scripts\python.exe -m compileall app` y
  `python -c "from app.main import app"` (conecta a la BD real).

## Estado actual (fecha: 2026-09-12)

Rama activa: **test** (se sube a `origin/test`). Funcionalidades terminadas:
CRUD de proyectos/colaboradores/materiales/tareas/turnos/evidencias, kardex de
inventario, JWT + Google OAuth, invitaciones por correo/enlace, permisos por rol,
materiales por proyecto, aislamiento de datos por usuario, flujo de proyecto
activo, panel con estado editable (solo Arquitecto), fechas y rol por proyecto,
y asignación de tareas/turnos limitada a los colaboradores del proyecto.

Al retomar, revisa `git log --oneline -15` y `git status` para saber dónde quedó
el trabajo. Todo se trabaja sobre `test`; no tocar `main` sin pedir confirmación.

## Convenciones

- Código, comentarios y mensajes de commit en **español**.
- Commits con prefijo convencional: `feat(...)`, `fix(...)`, `docs(...)`, `refactor(...)`.
- `pasos_para_opencode.txt` fue eliminado y no se debe recrear.
- `Usuarios.tsx` quedó fuera del menú (no corresponde al modelo actual); no volver a engancharlo.
- El archivo `Frontend/src/api.ts` marca `API_URL` en `http://127.0.0.1:8000`;
  otros componentes usan `http://localhost:8000` directo — mantener consistente al tocar URLs.