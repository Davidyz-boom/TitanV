import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

load_dotenv()

# La URL ahora se lee de una variable de entorno (.env).
# Si no existe, cae en un valor por defecto solo para desarrollo local.
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:1234@localhost:5432/titanv_db",
)

# El motor encargado de procesar las consultas
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# La sesión que usaremos en los endpoints para interactuar con las tablas
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# La clase base de la cual heredarán nuestros modelos de base de datos
Base = declarative_base()


def get_db():
    """Abre una sesión de base de datos por petición y la cierra al finalizar."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
