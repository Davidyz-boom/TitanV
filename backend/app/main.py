import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

from app.core.database import Base, engine

# Importa el paquete de modelos completo ANTES de crear las tablas,
# para que SQLAlchemy pueda resolver todas las relaciones entre clases.
from app import models  # noqa: F401

from app.routers.auth_router import router as auth_router
from app.routers.usuario_router import router as usuario_router
from app.routers.proyecto_router import router as proyecto_router
from app.routers.colaborador_router import router as colaborador_router
from app.routers.material_router import router as material_router
from app.routers.tarea_router import router as tarea_router
from app.routers.turno_router import router as turno_router
from app.routers.movimiento_router import router as movimiento_router
from app.routers.evidencia_router import router as evidencia_router

from app.views.login_view import obtener_pagina_login_html
from sqlalchemy import text

# Crear tablas automáticamente si la base de datos está disponible
try:
    Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE materiales ADD COLUMN IF NOT EXISTS stock_total FLOAT DEFAULT 0.0;"))
        conn.execute(text("ALTER TABLE evidencias_multimedia ADD COLUMN IF NOT EXISTS usuario_id INTEGER DEFAULT 1;"))
        conn.execute(text("ALTER TABLE evidencias_multimedia ADD COLUMN IF NOT EXISTS nombre_archivo VARCHAR(255) DEFAULT 'archivo';"))
        conn.execute(text("ALTER TABLE evidencias_multimedia ADD COLUMN IF NOT EXISTS descripcion VARCHAR(300);"))
        conn.execute(text("ALTER TABLE evidencias_multimedia ADD COLUMN IF NOT EXISTS fecha_eliminacion TIMESTAMP;"))
        conn.execute(text("ALTER TABLE proyectos_obra ADD COLUMN IF NOT EXISTS usuario_creador_id INTEGER;"))
        conn.commit()
    print("[Titan V API] Tablas y columnas de base de datos sincronizadas exitosamente.")
except Exception as e:
    print(f"[Titan V API] Advertencia al conectar con la base de datos: {e}")
    print("Asegúrate de que el servicio de PostgreSQL esté iniciado y revisa la variable DATABASE_URL en tu archivo backend/.env")

app = FastAPI(title="Titan V API - Sistema de Gestión de Obra")

# Middleware para asegurar que los navegadores y clientes HTTP nunca guarden en caché
# respuestas antiguas y siempre muestren los datos actualizados de la base de datos
@app.middleware("http")
async def add_no_cache_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

# Configuración de CORS (necesaria para que el frontend, servido desde otro origen, pueda llamar a la API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registro de routers
app.include_router(auth_router)
app.include_router(usuario_router)
app.include_router(proyecto_router)
app.include_router(colaborador_router)
app.include_router(material_router)
app.include_router(tarea_router)
app.include_router(turno_router)
app.include_router(movimiento_router)
app.include_router(evidencia_router)

# Sirve los archivos subidos (fotos/PDF de evidencias) en /uploads/...
CARPETA_UPLOADS = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(CARPETA_UPLOADS, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=CARPETA_UPLOADS), name="uploads")


# Vistas HTML servidas directamente desde Python con FastAPI
@app.get("/", response_class=HTMLResponse)
def read_root():
    return obtener_pagina_login_html()


@app.get("/login", response_class=HTMLResponse)
def read_login():
    return obtener_pagina_login_html()


@app.get("/registro", response_class=HTMLResponse)
def read_registro():
    return obtener_pagina_login_html()


@app.get("/api/status")
def api_status():
    return {"status": "online", "sistema": "Titan V"}

