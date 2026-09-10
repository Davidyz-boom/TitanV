# TITAN V — Sistema de Gestion de Obra
## Presentacion Proyecto ADSO — SENA

---

## 1. Identificacion del Proyecto

| Campo | Detalle |
|-------|---------|
| **Nombre** | Titan V — Sistema de Gestion de Obra |
| **Programa** | Analisis y Desarrollo de Software (ADSO) |
| **Ficha** | (completar con tu ficha) |
| **Instructor** | (completar) |
| **Aprendices** | (completar nombres) |
| **Version** | 1.0 |

---

## 2. Planteamiento del Problema

Las pequenas y medianas empresas constructoras en Colombia enfrentan problemas criticos:

- **Informacion fragmentada:** datos de proyectos, materiales y personal dispersos en hojas de calculo, cuadernos y WhatsApp.
- **Sin control de inventario:** no se sabe cuantos materiales hay en obra ni quienes los retiraron.
- **Sin trazabilidad:** no queda registro de quién hizo que cambio, cuando y por qué.
- **Sin evidencia organizada:** fotos y documentos se pierden en celulares sin vinculacion al proyecto.
- **Sin control de asistencia:** no se registra la asistencia del personal en campo.

**Resultado:** perdidas economicas, retrasos en obras, conflictos con clientes y falta de transparencia.

---

## 3. Objetivos

### Objetivo General
Desarrollar un sistema web integral de gestion y control de proyectos de construccion que permita centralizar la informacion operativa, logistica y tecnica en tiempo real.

### Objetivos Especificos
1. Gestionar proyectos de obra con CRUD completo y estados (Planificacion / En Ejecucion / Finalizado).
2. Administrar un catalogo de materiales con control de inventario tipo kardex (entradas, salidas, ajustes).
3. Gestionar usuarios con roles jerarquicos (Administrador, Supervisor, Operario).
4. Controlar tareas asignadas a personal con sistema de comentarios.
5. Programar turnos y registrar asistencia del personal en campo.
6. Permitir subida de evidencias multimedia (fotos, videos, PDFs) vinculadas a proyectos.
7. Implementar autenticacion segura con JWT y login con Google OAuth.

---

## 4. Alcance

### Incluido (MVP)
- Backend API REST con FastAPI
- Base de datos PostgreSQL con 12 tablas
- Frontend SPA con React + TypeScript
- Autenticacion JWT + Google OAuth
- 7 modulos funcionales completos
- Soft delete en todas las entidades
- Trigger de validacion de stock en PostgreSQL

### Excluido (futuras versiones)
- App movil nativa
- Reportes PDF automaticos
- Notificaciones en tiempo real (WebSocket)
- Multitenancy (multi-empresa)

---

## 5. Stack Tecnologico

### Backend
| Tecnologia | Uso | Version |
|-----------|-----|---------|
| Python | Lenguaje backend | 3.x |
| FastAPI | Framework web REST | 0.141.1 |
| SQLAlchemy | ORM (mapeo objeto-relacional) | 2.0.52 |
| Pydantic | Validacion de datos | 2.13.4 |
| PostgreSQL | Base de datos relacional | 18 |
| psycopg2-binary | Driver PostgreSQL | 2.9.12 |
| PyJWT | Autenticacion JWT | 2.13.0 |
| bcrypt | Hash de contrasenas | 5.0.0 |
| Uvicorn | Servidor ASGI | 0.52.4 |

### Frontend
| Tecnologia | Uso | Version |
|-----------|-----|---------|
| React | Libreria de UI | 19.2.8 |
| TypeScript | Tipado estatico | 6.0.2 |
| Vite | Bundler / Dev server | 8.2.0 |
| react-router-dom | Enrutamiento SPA | 7.18.2 |
| @react-oauth/google | Login Google | 0.13.5 |
| axios | Cliente HTTP | 1.20.0 |

---

## 6. Arquitectura del Sistema

### Arquitectura en Capas (Backend)

```
┌─────────────────────────────────────────────┐
│              FRONTEND (React)                │
│         Consumo de API REST + JWT            │
└──────────────────┬──────────────────────────┘
                   │ HTTP (JSON)
┌──────────────────▼──────────────────────────┐
│            CAPA DE RUTAS (FastAPI)           │
│   auth_router, proyecto_router, etc.         │
│   - Validacion de entrada (Pydantic)         │
│   - Control de autenticacion                 │
│   - Codigos de estado HTTP                   │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│          CAPA DE SERVICIOS (Logica)          │
│   auth_service, proyecto_service, etc.       │
│   - Reglas de negocio                        │
│   - Validaciones complejas                   │
│   - Independiente de FastAPI                  │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│       CAPA DE MODELOS (SQLAlchemy ORM)       │
│   usuario_model, proyecto_model, etc.        │
│   - Mapeo de tablas                          │
│   - Relaciones y restricciones               │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│           PostgreSQL (Base de Datos)         │
│   - 12 tablas                                │
│   - Triggers (validacion stock)              │
│   - Constraints y foreign keys               │
└─────────────────────────────────────────────┘
```

### Flujo de una Peticion
1. El frontend envia un HTTP request (ej: `POST /tareas/`)
2. El **router** valida la entrada con Pydantic schemas y verifica autenticacion JWT
3. El router delega la logica al **service** correspondiente
4. El service ejecuta la logica de negocio y usa los **models** para interactuar con la DB
5. El service retorna el resultado al router
6. El router retorna un HTTP response con el dato y codigo de estado apropiado

---

## 7. Diseno de Base de Datos

### Diagrama de Entidades (12 tablas)

```
                        ┌──────────────┐
                        │   usuarios   │
                        │──────────────│
                        │ id_usuario PK│
                        │ nombres      │
                        │ apellidos    │
                        │ correo (UQ)  │
                        │ contrasena   │
                        │ rol (1/2/3)  │
                        │ activo       │
                        └──────┬───────┘
                               │
            ┌──────────────────┼──────────────────┐
            │                  │                  │
   ┌────────▼────────┐ ┌──────▼──────┐  ┌───────▼────────┐
   │ proyecto_       │ │ tareas      │  │ turnos_relevos │
   │ colaboradores   │ │─────────────│  │────────────────│
   │─────────────────│ │ proyecto_id │  │ proyecto_id    │
   │ proyecto_id FK  │ │ usuario_id  │  │ usuario_id     │
   │ usuario_id FK   │ │ nombre      │  │ fecha_turno    │
   │ rol             │ │ estado      │  │ hora_inicio    │
   └────────┬────────┘ │ descripcion │  │ hora_fin       │
            │          └─────────────┘  │ estado         │
            │                │          └────────────────┘
            │          ┌─────▼──────┐
            │          │ comentarios│
            │          │────────────│
            │          │ tarea_id   │
            │          │ usuario_id │
            │          │ contenido  │
            │          └────────────┘
            │
   ┌────────▼──────────────────────────────────────────┐
   │                proyectos_obra                       │
   │─────────────────────────────────────────────────────│
   │ id PK                                                │
   │ nombre_proyecto                                      │
   │ ubicacion_direccion                                  │
   │ estado (Planificacion/En Ejecucion/Finalizado)       │
   │ fecha_inicio, fecha_fin_estimada                     │
   └────┬──────────┬──────────┬──────────┬───────────────┘
        │          │          │          │
   ┌────▼────┐ ┌───▼─────┐ ┌──▼───┐ ┌───▼──────────┐
   │inventario│ │historial│ │actas │ │ evidencias   │
   │_obras    │ │_movim.  │ │_campo│ │ _multimedia  │
   │──────────│ │─────────│ │──────│ │──────────────│
   │proyecto_ │ │proyecto_│ │ruta_ │ │ ruta_archivo │
   │material_ │ │material_│ │pdf   │ │ fecha_subida │
   │cantidad  │ │usuario_ │ │firmas│ │              │
   └──────────┘ │tipo_____│ └──────┘ └──────────────┘
                │cantidad │
                └─────────┘

   ┌──────────────┐
   │  materiales  │
   │──────────────│
   │ id PK        │
   │ nombre       │
   │ unidad_medida│
   └──────────────┘
```

### Enums / Roles
| Enum | Valores |
|------|---------|
| **RolUsuario** | 1 = Administrador, 2 = Supervisor, 3 = Operario |
| **RolProyecto** | Arquitecto, Trabajador, Visualizador |
| **EstadoProyecto** | Planificacion, En Ejecucion, Finalizado |
| **EstadoTarea** | Pendiente, En Proceso, Completada |
| **TipoMovimiento** | Entrada, Salida, Ajuste |

### Key Constraints
- **Soft Delete global:** todas las entidades usan `fecha_eliminacion` (nunca se borran registros fisicamente)
- **Unique constraints:** `(proyecto_id, material_id)` en inventario, `(proyecto_id, usuario_id)` en colaboradores
- **Trigger PostgreSQL:** valida stock antes de cada salida de material (duplica la logica Python a nivel DB)
- **Cascada:** al eliminar un proyecto, se eliminan en cascada tareas, movimientos, evidencias, etc.

---

## 8. Modulos Funcionales

### 8.1 Autenticacion y Seguridad
- Login con email + password (bcrypt)
- Login con Google OAuth 2.0 (verificacion server-side)
- JWT con expiracion (tokens firmados HS256)
- Registro publico con rol por defecto (Operario)
- Verificacion de sesion activa

### 8.2 Gestion de Usuarios
- CRUD completo (crear, listar, actualizar, eliminar/restaurar)
- 3 roles: Administrador, Supervisor, Operario
- Soft delete (desactivar sin borrar historial)
- Solo Admin puede crear/eliminar usuarios

### 8.3 Gestion de Proyectos de Obra
- CRUD completo con estados (Planificacion / En Ejecucion / Finalizado)
- El creador se asigna automaticamente como "Arquitecto"
- Filtro por usuario (solo ve proyectos donde participa)
- Soft delete con restauracion

### 8.4 Colaboradores por Proyecto
- Invitar usuarios existentes por correo electronico
- Roles por proyecto: Arquitecto, Trabajador, Visualizador
- Proteccion: no se puede eliminar/degradar al ultimo Arquitecto

### 8.5 Catalogo de Materiales
- CRUD de tipos de material (nombre + unidad de medida)
- Soft delete que preserva historial de kardex

### 8.6 Inventario y Kardex
- Registro de movimientos: Entrada, Salida, Ajuste
- Stock por proyecto (auto-creacion de inventario)
- **Validacion doble de stock:** en Python (servicio) + trigger en PostgreSQL
- Historial inmutable (kardex) con usuario responsable

### 8.7 Tareas y Comentarios
- CRUD de tareas asignadas a un proyecto y operario
- Estados: Pendiente, En Proceso, Completada
- Sistema de comentarios anidados por tarea (max 300 caracteres)
- Comentarios con soft delete

### 8.8 Turnos y Asistencia
- Programacion de turnos por proyecto y operario
- Registro de asistencia: Programado, Presente, Ausente
- Filtros por proyecto

### 8.9 Evidencias Multimedia
- Subida de archivos: JPG, PNG, WEBP, PDF, MP4
- Almacenamiento local con nombre UUID (seguro)
- Vinculacion a proyecto y usuario
- Vista previa de imagenes en el frontend
- Maximo 15 MB por archivo

---

## 9. Seguridad Implementada

| Capa | Mecanismo |
|------|-----------|
| Contraseñas | Hash bcrypt (nunca se almacenan en texto plano) |
| Sesion | JWT firmado con HS256 + expiracion |
| Google OAuth | Verificacion server-side del token de Google |
| Soft Delete | No se borran registros, solo se desactivan |
| Stock validation | Trigger PostgreSQL + validacion Python (doble capa) |
| Auditoria | Cada movimiento registra el usuario responsable |
| CORS | Configurado para permitir origen del frontend |
| SQL Injection | Prevenido por SQLAlchemy ORM (parametrizado) |

---

## 10. Flujo de Usuario (User Journey)

```
1. Usuario abre la app
   └─► Ve Landing Page con video de fondo + descripcion

2. Click "Iniciar Sesion"
   └─► Formulario email/password O boton "Continuar con Google"

3. Login exitoso
   └─► Redirige a Dashboard

4. Si no tiene proyectos (onboarding):
   └─► Sidebar bloqueado, solo puede crear Proyecto
   └─► Crea proyecto → se desbloquean todos los modulos

5. Dashboard con modulos completos:
   ├── Inicio (accesos rapidos)
   ├── Proyectos de Obra (CRUD)
   ├── Inventario de Insumos (catalogo)
   ├── Gestion de Usuarios (tabla)
   ├── Gestion de Tareas (CRUD + comentarios)
   ├── Turnos y Asistencia (programacion)
   └── Evidencias (subir fotos/PDF/videos)

6. Cerrar Sesion
   └─► Limpia token, redirige a Landing Page
```

---

## 11. Endpoints de la API (45+ endpoints)

### Autenticacion (4 endpoints)
| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| POST | `/auth/registro` | No | Registro publico |
| POST | `/auth/login` | No | Login email/password |
| POST | `/auth/google` | No | Login con Google OAuth |
| GET | `/auth/verificar` | Si | Verificar sesion activa |

### Usuarios (6 endpoints)
| Metodo | Ruta | Auth | Permisos |
|--------|------|------|----------|
| GET | `/usuarios/` | Si | Cualquier autenticado |
| GET | `/usuarios/{id}` | Si | Cualquier autenticado |
| POST | `/usuarios/` | Si | Solo Admin |
| PUT | `/usuarios/{id}` | Si | Admin o self |
| DELETE | `/usuarios/{id}` | Si | Solo Admin |
| POST | `/usuarios/{id}/restaurar` | Si | Solo Admin |

### Proyectos (6 endpoints)
| Metodo | Ruta | Auth | Permisos |
|--------|------|------|----------|
| GET | `/proyectos/` | No | — |
| GET | `/proyectos/{id}` | No | — |
| POST | `/proyectos/` | No | — |
| PUT | `/proyectos/{id}` | No | — |
| DELETE | `/proyectos/{id}` | Si | Arquitecto del proyecto |
| POST | `/proyectos/{id}/restaurar` | Si | Arquitecto del proyecto |

### Colaboradores (4 endpoints)
| Metodo | Ruta | Permisos |
|--------|------|----------|
| GET | `.../colaboradores/` | Cualquier colaborador |
| POST | `.../colaboradores/` | Solo Arquitecto |
| PUT | `.../colaboradores/{id}` | Solo Arquitecto |
| DELETE | `.../colaboradores/{id}` | Solo Arquitecto |

### Materiales (6 endpoints)
| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| GET | `/materiales/` | No | Listar catalogo |
| GET | `/materiales/{id}` | No | Obtener material |
| POST | `/materiales/` | Si | Crear material |
| PUT | `/materiales/{id}` | Si | Actualizar material |
| DELETE | `/materiales/{id}` | Si | Soft delete |
| POST | `/materiales/{id}/restaurar` | Si | Restaurar |

### Inventario / Kardex (3 endpoints)
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/movimientos/` | Registrar movimiento (valida stock) |
| GET | `/movimientos/` | Historial kardex (filtros opcionales) |
| GET | `/movimientos/inventario/{proyecto_id}` | Stock actual por proyecto |

### Tareas + Comentarios (9 endpoints)
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/tareas/` | Listar tareas (filtro por proyecto) |
| GET | `/tareas/{id}` | Obtener tarea |
| POST | `/tareas/` | Crear tarea |
| PUT | `/tareas/{id}` | Actualizar tarea |
| DELETE | `/tareas/{id}` | Soft delete tarea |
| POST | `/tareas/{id}/restaurar` | Restaurar tarea |
| GET | `/tareas/{id}/comentarios` | Listar comentarios |
| POST | `/tareas/{id}/comentarios` | Crear comentario |
| DELETE | `/tareas/comentarios/{id}` | Soft delete comentario |

### Turnos (6 endpoints)
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/turnos/` | Listar turnos |
| GET | `/turnos/{id}` | Obtener turno |
| POST | `/turnos/` | Crear turno |
| PUT | `/turnos/{id}` | Actualizar turno |
| DELETE | `/turnos/{id}` | Soft delete turno |
| POST | `/turnos/{id}/restaurar` | Restaurar turno |

### Evidencias (3 endpoints)
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `.../evidencias/` | Listar evidencias del proyecto |
| POST | `.../evidencias/` | Subir archivo (multipart) |
| DELETE | `.../evidencias/{id}` | Soft delete evidencia |

### Subcontratistas (6 endpoints)
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/subcontratistas/` | Listar subcontratistas |
| GET | `/subcontratistas/{id}` | Obtener subcontratista |
| POST | `/subcontratistas/` | Crear subcontratista |
| PUT | `/subcontratistas/{id}` | Actualizar subcontratista |
| DELETE | `/subcontratistas/{id}` | Soft delete |
| POST | `/subcontratistas/{id}/restaurar` | Restaurar |

---

## 12. Demostracion en Vivo (Guion sugerido)

### Paso 1: Mostrar la Landing Page
> "Esta es la pagina principal. Tiene un diseno profesional con video de fondo que muestra la propuesta de valor."

### Paso 2: Registrar un usuario
> "Vamos a registrarnos como nuevo usuario con rol de Operario."

- Click "Iniciar Sesion" → "Registrate aqui"
- Completar formulario
- Mostrar mensaje de exito

### Paso 3: Login
> "Ahora nos autenticamos con las credenciales creadas."

- Ingresar email + password
- Click "Iniciar Sesion"
- Redirige al Dashboard

### Paso 4: Crear un proyecto (desbloquea modulos)
> "Como es la primera vez, solo podemos crear proyectos. Al crear el primero, se desbloquean todas las funcionalidades."

- Ir a "Proyectos de Obra"
- Completar formulario del proyecto
- Mostrar como se desbloquea el sidebar

### Paso 5: Gestionar materiales
> "Registramos los tipos de material que manejamos en la obra."

- Ir a "Inventario de Insumos"
- Crear material (ej: Cemento, Unidad: Saco 50kg)

### Paso 6: Crear tareas y comentarios
> "Asignamos tareas a los operarios y podemos comentar en cada una."

- Ir a "Gestion de Tareas"
- Crear tarea vinculada al proyecto
- Cambiar estado (Pendiente → En Proceso)
- Abrir comentarios y publicar uno

### Paso 7: Programar turnos
> "Programamos los turnos de trabajo y registramos asistencia."

- Ir a "Turnos y Asistencia"
- Crear turno con proyecto, operario, fecha y horas
- Cambiar asistencia a "Presente"

### Paso 8: Subir evidencias
> "Subimos fotos o documentos como evidencia del avance de la obra."

- Ir a "Evidencias"
- Seleccionar proyecto
- Subir imagen (JPG/PNG)
- Mostrar vista previa

### Paso 9: Cerrar sesion
> "Finalizamos la demostracion cerrando sesion de forma segura."

- Click "Cerrar Sesion"
- Confirma limpieza de token
- Redirige a Landing Page

---

## 13. Instalacion y Ejecucion

### Requisitos previos
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
# Configurar .env con tus credenciales de PostgreSQL
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd Frontend
npm install
npm run dev
```

### Base de datos
```bash
# Crear la base (una sola vez)
psql -U postgres -c "CREATE DATABASE titanv_db;"
# Las tablas se crean automaticamente al iniciar el backend
```

---

## 14. Conclusiones

1. **Titan V** demuestra la aplicacion de un stack moderno (FastAPI + React + PostgreSQL) para resolver un problema real del sector construction en Colombia.
2. La arquitectura en capas permite mantenimiento escalable: se puede cambiar el frontend sin tocar el backend, o viceversa.
3. El **soft delete** es una practica empresarial que preserva la integridad historica de datos criticos.
4. La **validacion de stock doble** (Python + trigger PostgreSQL) garantiza integridad incluso ante accesos directos a la base de datos.
5. La autenticacion con **JWT + Google OAuth** implementa estandares de seguridad de la industria.
6. El proyecto esta listo para ser presentado como solucion MVP para pequenas constructoras.

---

## 15. Tecnologias de Investigacion (Fuentes de Aprendizaje)

- FastAPI Documentation: https://fastapi.tiangolo.com/
- SQLAlchemy 2.0 Docs: https://docs.sqlalchemy.org/
- React Official: https://react.dev/
- PostgreSQL Docs: https://www.postgresql.org/docs/
- Pydantic V2: https://docs.pydantic.dev/
- Google OAuth 2.0: https://developers.google.com/identity/protocols/oauth2

---

## 16. Notas para la Exposicion

- Duracion sugerida: 15-20 minutos
- Mostrar Swagger UI (`localhost:8000/docs`) para demostrar los endpoints en vivo
- Tener una base de datos con datos de ejemplo pre-cargados
- Preparar al menos 2 usuarios (Admin + Operario) para mostrar la diferencia de permisos
- Si hay tiempo extra, mostrar la estructura de codigo en VS Code (capas claras)
