from typing import Optional

from sqlalchemy.orm import Session

from app.models import TurnoRelevo
from app.schemas import TurnoCreate, TurnoUpdate


def listar_turnos(db: Session, proyecto_id: Optional[int] = None, skip: int = 0, limit: int = 100):
    query = db.query(TurnoRelevo)
    if proyecto_id is not None:
        query = query.filter(TurnoRelevo.proyecto_id == proyecto_id)
    return query.offset(skip).limit(limit).all()


def obtener_turno(db: Session, turno_id: int) -> Optional[TurnoRelevo]:
    return db.query(TurnoRelevo).filter(TurnoRelevo.id == turno_id).first()


def crear_turno(db: Session, turno: TurnoCreate) -> TurnoRelevo:
    nuevo_turno = TurnoRelevo(**turno.model_dump())
    db.add(nuevo_turno)
    db.commit()
    db.refresh(nuevo_turno)
    return nuevo_turno


def actualizar_turno(db: Session, turno_id: int, datos: TurnoUpdate) -> Optional[TurnoRelevo]:
    turno_query = db.query(TurnoRelevo).filter(TurnoRelevo.id == turno_id)
    turno = turno_query.first()
    if not turno:
        return None

    turno_query.update(datos.model_dump(exclude_unset=True), synchronize_session=False)
    db.commit()
    return turno_query.first()


def eliminar_turno(db: Session, turno_id: int) -> bool:
    turno_query = db.query(TurnoRelevo).filter(TurnoRelevo.id == turno_id)
    if not turno_query.first():
        return False

    turno_query.delete(synchronize_session=False)
    db.commit()
    return True
