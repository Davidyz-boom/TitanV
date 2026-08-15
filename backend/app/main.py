from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import Base, engine

# Importa el paquete de modelos completo ANTES de crear las tablas,
# para que SQLAlchemy pueda resolver todas las relaciones entre clases.
from app import models  # noqa: F401

from app.routers.auth_router import router as auth_router
from app.routers.usuario_router import router as usuario_router
from app.routers.proyecto_router import router as proyecto_router
from app.routers.material_router import router as material_router
from app.routers.tarea_router import router as tarea_router
from app.routers.turno_router import router as turno_router
from app.routers.subcontratista_router import router as subcontratista_router
from app.routers.movimiento_router import router as movimiento_router

# Crear tablas automáticamente
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Titan V API")

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
app.include_router(material_router)
app.include_router(tarea_router)
app.include_router(turno_router)
app.include_router(subcontratista_router)
app.include_router(movimiento_router)


@app.get("/")
def read_root():
    return {"status": "online"}
