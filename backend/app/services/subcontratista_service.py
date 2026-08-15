from typing import Optional

from sqlalchemy.orm import Session

from app.models import Subcontratista
from app.schemas import SubcontratistaCreate, SubcontratistaUpdate


def listar_subcontratistas(db: Session, proyecto_id: Optional[int] = None, skip: int = 0, limit: int = 100):
    query = db.query(Subcontratista)
    if proyecto_id is not None:
        query = query.filter(Subcontratista.proyecto_id == proyecto_id)
    return query.offset(skip).limit(limit).all()


def obtener_subcontratista(db: Session, subcontratista_id: int) -> Optional[Subcontratista]:
    return db.query(Subcontratista).filter(Subcontratista.id == subcontratista_id).first()


def crear_subcontratista(db: Session, datos: SubcontratistaCreate) -> Subcontratista:
    nuevo = Subcontratista(**datos.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


def actualizar_subcontratista(db: Session, subcontratista_id: int, datos: SubcontratistaUpdate) -> Optional[Subcontratista]:
    query = db.query(Subcontratista).filter(Subcontratista.id == subcontratista_id)
    subcontratista = query.first()
    if not subcontratista:
        return None

    query.update(datos.model_dump(exclude_unset=True), synchronize_session=False)
    db.commit()
    return query.first()


def eliminar_subcontratista(db: Session, subcontratista_id: int) -> bool:
    query = db.query(Subcontratista).filter(Subcontratista.id == subcontratista_id)
    if not query.first():
        return False

    query.delete(synchronize_session=False)
    db.commit()
    return True
