from typing import Optional

from sqlalchemy.orm import Session

from app.core.soft_delete import marcar_eliminado, restaurar, sin_eliminados
from app.models import Subcontratista
from app.schemas import SubcontratistaCreate, SubcontratistaUpdate


def listar_subcontratistas(
    db: Session, proyecto_id: Optional[int] = None, incluir_eliminados: bool = False, skip: int = 0, limit: int = 100
):
    query = db.query(Subcontratista)
    if proyecto_id is not None:
        query = query.filter(Subcontratista.proyecto_id == proyecto_id)
    if not incluir_eliminados:
        query = sin_eliminados(query, Subcontratista)
    return query.offset(skip).limit(limit).all()


def obtener_subcontratista(
    db: Session, subcontratista_id: int, incluir_eliminados: bool = False
) -> Optional[Subcontratista]:
    query = db.query(Subcontratista).filter(Subcontratista.id == subcontratista_id)
    if not incluir_eliminados:
        query = sin_eliminados(query, Subcontratista)
    return query.first()


def crear_subcontratista(db: Session, datos: SubcontratistaCreate) -> Subcontratista:
    nuevo = Subcontratista(**datos.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


def actualizar_subcontratista(
    db: Session, subcontratista_id: int, datos: SubcontratistaUpdate
) -> Optional[Subcontratista]:
    subcontratista = obtener_subcontratista(db, subcontratista_id)
    if not subcontratista:
        return None

    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(subcontratista, campo, valor)

    db.commit()
    db.refresh(subcontratista)
    return subcontratista


def eliminar_subcontratista(db: Session, subcontratista_id: int) -> bool:
    """Soft delete: importante aquí en particular — si hay que revisar más adelante
    si un subcontratista tenía la póliza vigente en determinada fecha, el registro
    sigue existiendo aunque ya no aparezca en la lista activa."""
    subcontratista = obtener_subcontratista(db, subcontratista_id)
    if not subcontratista:
        return False

    marcar_eliminado(db, subcontratista)
    return True


def restaurar_subcontratista(db: Session, subcontratista_id: int) -> Optional[Subcontratista]:
    subcontratista = obtener_subcontratista(db, subcontratista_id, incluir_eliminados=True)
    if not subcontratista or subcontratista.fecha_eliminacion is None:
        return None

    restaurar(db, subcontratista)
    return subcontratista
