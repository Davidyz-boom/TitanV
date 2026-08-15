from typing import Optional

from sqlalchemy.orm import Session

from app.models import Comentario, Tarea
from app.schemas import ComentarioCreate, TareaCreate, TareaUpdate


# --- Tareas ---

def listar_tareas(db: Session, proyecto_id: Optional[int] = None, skip: int = 0, limit: int = 100):
    query = db.query(Tarea)
    if proyecto_id is not None:
        query = query.filter(Tarea.proyecto_id == proyecto_id)
    return query.offset(skip).limit(limit).all()


def obtener_tarea(db: Session, tarea_id: int) -> Optional[Tarea]:
    return db.query(Tarea).filter(Tarea.id == tarea_id).first()


def crear_tarea(db: Session, tarea: TareaCreate) -> Tarea:
    nueva_tarea = Tarea(**tarea.model_dump())
    db.add(nueva_tarea)
    db.commit()
    db.refresh(nueva_tarea)
    return nueva_tarea


def actualizar_tarea(db: Session, tarea_id: int, datos: TareaUpdate) -> Optional[Tarea]:
    tarea_query = db.query(Tarea).filter(Tarea.id == tarea_id)
    tarea = tarea_query.first()
    if not tarea:
        return None

    tarea_query.update(datos.model_dump(exclude_unset=True), synchronize_session=False)
    db.commit()
    return tarea_query.first()


def eliminar_tarea(db: Session, tarea_id: int) -> bool:
    tarea_query = db.query(Tarea).filter(Tarea.id == tarea_id)
    if not tarea_query.first():
        return False

    tarea_query.delete(synchronize_session=False)
    db.commit()
    return True


# --- Comentarios (siempre asociados a una tarea) ---

def listar_comentarios(db: Session, tarea_id: int):
    return db.query(Comentario).filter(Comentario.tarea_id == tarea_id).order_by(Comentario.fecha_comentario).all()


def crear_comentario(db: Session, tarea_id: int, usuario_id: int, comentario: ComentarioCreate) -> Comentario:
    nuevo_comentario = Comentario(
        contenido=comentario.contenido,
        tarea_id=tarea_id,
        usuario_id=usuario_id,
    )
    db.add(nuevo_comentario)
    db.commit()
    db.refresh(nuevo_comentario)
    return nuevo_comentario


def eliminar_comentario(db: Session, comentario_id: int) -> bool:
    comentario_query = db.query(Comentario).filter(Comentario.id == comentario_id)
    if not comentario_query.first():
        return False

    comentario_query.delete(synchronize_session=False)
    db.commit()
    return True
