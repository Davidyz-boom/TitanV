from typing import Optional

from sqlalchemy.orm import Session

from app.models import ProyectoObra
from app.schemas import ProyectoCreate, ProyectoUpdate


def listar_proyectos(db: Session, skip: int = 0, limit: int = 100):
    return db.query(ProyectoObra).offset(skip).limit(limit).all()


def obtener_proyecto(db: Session, proyecto_id: int) -> Optional[ProyectoObra]:
    return db.query(ProyectoObra).filter(ProyectoObra.id == proyecto_id).first()


def crear_proyecto(db: Session, proyecto: ProyectoCreate) -> ProyectoObra:
    nuevo_proyecto = ProyectoObra(**proyecto.model_dump())
    db.add(nuevo_proyecto)
    db.commit()
    db.refresh(nuevo_proyecto)
    return nuevo_proyecto


def actualizar_proyecto(db: Session, proyecto_id: int, datos: ProyectoUpdate) -> Optional[ProyectoObra]:
    proyecto_query = db.query(ProyectoObra).filter(ProyectoObra.id == proyecto_id)
    proyecto = proyecto_query.first()
    if not proyecto:
        return None

    # exclude_unset=True: solo se tocan los campos que el cliente realmente envió
    proyecto_query.update(datos.model_dump(exclude_unset=True), synchronize_session=False)
    db.commit()
    return proyecto_query.first()


def eliminar_proyecto(db: Session, proyecto_id: int) -> bool:
    proyecto_query = db.query(ProyectoObra).filter(ProyectoObra.id == proyecto_id)
    if not proyecto_query.first():
        return False

    proyecto_query.delete(synchronize_session=False)
    db.commit()
    return True
