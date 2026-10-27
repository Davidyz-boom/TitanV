import os

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect, text

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
from app.routers.invitacion_router import router as invitacion_router
from app.routers.solicitud_router import router as solicitud_router

# Crear tablas automáticamente si la base de datos está disponible
try:
    Base.metadata.create_all(bind=engine)
    columnas_materiales = {columna["name"] for columna in inspect(engine).get_columns("materiales")}
    if "cantidad_inicial" not in columnas_materiales:
        with engine.begin() as conexion:
            conexion.execute(text("ALTER TABLE materiales ADD COLUMN cantidad_inicial DOUBLE PRECISION NOT NULL DEFAULT 0"))
            conexion.execute(text("""
                UPDATE materiales AS material
                SET cantidad_inicial = inventario.cantidad_disponible
                FROM inventario_obras AS inventario
                WHERE inventario.material_id = material.id
                  AND inventario.proyecto_id = material.proyecto_id
            """))

    # Columnas nuevas en usuarios (recuperación de contraseña por PIN).
    # create_all no agrega columnas a tablas ya existentes, así que se sincronizan a mano.
    columnas_usuarios = {columna["name"] for columna in inspect(engine).get_columns("usuarios")}
    columnas_a_agregar = [
        ("reset_pin", "ALTER TABLE usuarios ADD COLUMN reset_pin VARCHAR(4)"),
        ("reset_pin_expira", "ALTER TABLE usuarios ADD COLUMN reset_pin_expira TIMESTAMP"),
        ("bloqueado_hasta", "ALTER TABLE usuarios ADD COLUMN bloqueado_hasta TIMESTAMP"),
    ]
    columnas_nuevas = [sentencia for nombre, sentencia in columnas_a_agregar if nombre not in columnas_usuarios]
    if columnas_nuevas:
        with engine.begin() as conexion:
            for sentencia in columnas_nuevas:
                conexion.execute(text(sentencia))
        print(f"[Titan V OK] Columnas agregadas a usuarios: {len(columnas_nuevas)}")

    print("[Titan V OK] Tablas de base de datos conectadas y sincronizadas exitosamente.")
except Exception as e:
    print(f"[Titan V WARN] Advertencia al conectar con la base de datos: {e}")
    print("[Titan V WARN] Asegurate de que el servicio de PostgreSQL este iniciado y revisa la variable DATABASE_URL en tu archivo backend/.env")

app = FastAPI(title="Titan V API")


@app.exception_handler(RequestValidationError)
async def validacion_amigable(request, exc: RequestValidationError):
    """Devuelve los errores de validación de Pydantic como texto legible.

    Por defecto FastAPI responde con una lista técnica que el frontend termina
    mostrando como "[object Object]" en las alertas.
    """
    mensajes = []
    for error in exc.errors():
        campo = ".".join(str(parte) for parte in error["loc"][1:]) or "cuerpo"
        mensajes.append(f"{campo}: {error['msg']}")
    return JSONResponse(status_code=422, content={"detail": "; ".join(mensajes)})


# Configuración de CORS (necesaria para que el frontend, servido desde otro origen, pueda llamar a la API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registro de routers
app.include_router(auth_router)
app.include_router(auth_router, prefix="/api")
app.include_router(usuario_router)
app.include_router(proyecto_router)
app.include_router(colaborador_router)
app.include_router(material_router)
app.include_router(tarea_router)
app.include_router(turno_router)
app.include_router(movimiento_router)
app.include_router(evidencia_router)
app.include_router(invitacion_router)
app.include_router(solicitud_router)

# Sirve los archivos subidos (fotos/PDF de evidencias) en /uploads/...
CARPETA_UPLOADS = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(CARPETA_UPLOADS, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=CARPETA_UPLOADS), name="uploads")


@app.get("/")
def read_root():
    return {"status": "online"}
