import os
import uuid
from typing import List, Optional

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.soft_delete import marcar_eliminado, sin_eliminados
from app.models import EvidenciaMultimedia

# Carpeta donde se guardan los archivos subidos. En este proyecto se usa disco
# local (sin infraestructura extra) — si más adelante se quiere mover a un
# servicio como S3 o Cloudinary, solo hay que cambiar estas dos funciones,
# el resto de la app no se entera.
CARPETA_EVIDENCIAS = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "evidencias")
os.makedirs(CARPETA_EVIDENCIAS, exist_ok=True)

EXTENSIONES_PERMITIDAS = {".jpg", ".jpeg", ".png", ".webp", ".pdf", ".mp4"}
TAMANO_MAXIMO_BYTES = 15 * 1024 * 1024  # 15 MB


def _extension_valida(nombre_archivo: str) -> bool:
    _, ext = os.path.splitext(nombre_archivo.lower())
    return ext in EXTENSIONES_PERMITIDAS


async def guardar_archivo_en_disco(archivo: UploadFile) -> str:
    """Guarda el archivo con un nombre único y devuelve la ruta relativa para guardar en BD."""
    _, ext = os.path.splitext(archivo.filename or "")
    nombre_unico = f"{uuid.uuid4().hex}{ext.lower()}"
    ruta_absoluta = os.path.join(CARPETA_EVIDENCIAS, nombre_unico)

    contenido = await archivo.read()
    with open(ruta_absoluta, "wb") as f:
        f.write(contenido)

    return f"/uploads/evidencias/{nombre_unico}"


async def subir_evidencia(
    db: Session, proyecto_id: int, usuario_id: int, archivo: UploadFile, descripcion: Optional[str] = None
) -> EvidenciaMultimedia:
    if not archivo.filename or not _extension_valida(archivo.filename):
        raise ValueError(
            f"Tipo de archivo no permitido. Formatos válidos: {', '.join(sorted(EXTENSIONES_PERMITIDAS))}"
        )

    ruta = await guardar_archivo_en_disco(archivo)

    nueva_evidencia = EvidenciaMultimedia(
        proyecto_id=proyecto_id,
        usuario_id=usuario_id,
        nombre_archivo=archivo.filename,
        ruta_archivo=ruta,
        descripcion=descripcion,
    )
    db.add(nueva_evidencia)
    db.commit()
    db.refresh(nueva_evidencia)
    return nueva_evidencia


def listar_evidencias(db: Session, proyecto_id: int, incluir_eliminadas: bool = False) -> List[EvidenciaMultimedia]:
    query = db.query(EvidenciaMultimedia).filter(EvidenciaMultimedia.proyecto_id == proyecto_id)
    if not incluir_eliminadas:
        query = sin_eliminados(query, EvidenciaMultimedia)
    return query.order_by(EvidenciaMultimedia.fecha_subida.desc()).all()


def eliminar_evidencia(db: Session, evidencia_id: int) -> bool:
    """Soft delete: el archivo NO se borra del disco, solo se oculta del listado.
    Así, si hace falta revisar evidencia antigua de un reclamo, sigue disponible."""
    evidencia = (
        db.query(EvidenciaMultimedia)
        .filter(EvidenciaMultimedia.id == evidencia_id, EvidenciaMultimedia.fecha_eliminacion.is_(None))
        .first()
    )
    if not evidencia:
        return False

    marcar_eliminado(db, evidencia)
    return True
