from datetime import date, timedelta
from typing import Optional

from sqlalchemy.orm import Session

from app.core.soft_delete import marcar_eliminado, restaurar, sin_eliminados
from app.models import Comentario, ProyectoObra, Tarea, Usuario
from app.schemas import ComentarioCreate, TareaCreate, TareaUpdate


def _asegurar_proyecto(db: Session, proyecto_id: Optional[int]) -> int:
    """Verifica si el proyecto existe; si no existe ninguno en la base de datos,
    crea un proyecto inicial para que no falle la llave foránea."""
    if proyecto_id:
        proyecto = db.query(ProyectoObra).filter(ProyectoObra.id == proyecto_id).first()
        if proyecto:
            return proyecto.id

    primer_proyecto = db.query(ProyectoObra).first()
    if primer_proyecto:
        return primer_proyecto.id

    # Si no hay ningún proyecto en la base de datos, creamos uno inicial
    nuevo_proyecto = ProyectoObra(
        nombre_proyecto="Proyecto Titan V Principal",
        ubicacion_direccion="Obra Central",
        estado="En Ejecución",
        fecha_inicio=date.today(),
        fecha_fin_estimada=date.today() + timedelta(days=365),
    )
    db.add(nuevo_proyecto)
    db.commit()
    db.refresh(nuevo_proyecto)
    return nuevo_proyecto.id


def _asegurar_usuario(db: Session, usuario_id: Optional[int], obligatorio: bool = False) -> Optional[int]:
    """Verifica si el usuario existe. Si es obligatorio (como en comentarios) y no existe ninguno,
    crea un usuario por defecto."""
    if usuario_id:
        usuario = db.query(Usuario).filter(Usuario.id_usuario == usuario_id).first()
        if usuario:
            return usuario.id_usuario

    primer_usuario = db.query(Usuario).first()
    if primer_usuario:
        return primer_usuario.id_usuario

    if obligatorio:
        # Crea usuario inicial por defecto si la tabla está vacía
        nuevo_usuario = Usuario(
            nombres="David",
            apellidos="Castro",
            correo_electronico="david.castro@titanv.com",
            contrasena_encriptada="$2b$12$eXampleHashedPasswordPlaceholderForDefaultUser",
            rol=1,
            activo=True,
        )
        db.add(nuevo_usuario)
        db.commit()
        db.refresh(nuevo_usuario)
        return nuevo_usuario.id_usuario

    return None


# --- Tareas ---

def listar_tareas(
    db: Session, proyecto_id: Optional[int] = None, incluir_eliminados: bool = False, skip: int = 0, limit: int = 100
):
    query = db.query(Tarea)
    if proyecto_id is not None:
        query = query.filter(Tarea.proyecto_id == proyecto_id)
    if not incluir_eliminados:
        query = sin_eliminados(query, Tarea)
    return query.order_by(Tarea.id.desc()).offset(skip).limit(limit).all()


def obtener_tarea(db: Session, tarea_id: int, incluir_eliminados: bool = False) -> Optional[Tarea]:
    query = db.query(Tarea).filter(Tarea.id == tarea_id)
    if not incluir_eliminados:
        query = sin_eliminados(query, Tarea)
    return query.first()


def crear_tarea(db: Session, tarea: TareaCreate) -> Tarea:
    datos = tarea.model_dump()
    # Garantizar que proyecto_id y usuario_id apunten a registros válidos
    datos["proyecto_id"] = _asegurar_proyecto(db, datos.get("proyecto_id"))
    datos["usuario_id"] = _asegurar_usuario(db, datos.get("usuario_id"), obligatorio=False)

    nueva_tarea = Tarea(**datos)
    db.add(nueva_tarea)
    db.commit()
    db.refresh(nueva_tarea)
    return nueva_tarea


def actualizar_tarea(db: Session, tarea_id: int, datos: TareaUpdate) -> Optional[Tarea]:
    tarea = obtener_tarea(db, tarea_id)
    if not tarea:
        return None

    for campo, valor in datos.model_dump(exclude_unset=True).items():
        if campo == "usuario_id" and valor is not None:
            valor = _asegurar_usuario(db, valor, obligatorio=False)
        setattr(tarea, campo, valor)

    db.commit()
    db.refresh(tarea)
    return tarea


def eliminar_tarea(db: Session, tarea_id: int) -> bool:
    """Soft delete: la tarea (y su historial de comentarios) sigue en la base,
    solo deja de aparecer en los listados normales."""
    tarea = obtener_tarea(db, tarea_id)
    if not tarea:
        return False

    marcar_eliminado(db, tarea)
    return True


def restaurar_tarea(db: Session, tarea_id: int) -> Optional[Tarea]:
    tarea = obtener_tarea(db, tarea_id, incluir_eliminados=True)
    if not tarea or tarea.fecha_eliminacion is None:
        return None

    restaurar(db, tarea)
    return tarea


# --- Comentarios (siempre asociados a una tarea) ---

def listar_comentarios(db: Session, tarea_id: int, incluir_eliminados: bool = False):
    query = db.query(Comentario).filter(Comentario.tarea_id == tarea_id)
    if not incluir_eliminados:
        query = sin_eliminados(query, Comentario)
    return query.order_by(Comentario.fecha_comentario.asc()).all()


def obtener_comentario(db: Session, comentario_id: int) -> Optional[Comentario]:
    return db.query(Comentario).filter(Comentario.id == comentario_id).first()


def crear_comentario(db: Session, tarea_id: int, usuario_id: int, comentario: ComentarioCreate) -> Comentario:
    usuario_valido_id = _asegurar_usuario(db, usuario_id, obligatorio=True)
    nuevo_comentario = Comentario(
        contenido=comentario.contenido,
        tarea_id=tarea_id,
        usuario_id=usuario_valido_id,
    )
    db.add(nuevo_comentario)
    db.commit()
    db.refresh(nuevo_comentario)
    return nuevo_comentario


def eliminar_comentario(db: Session, comentario_id: int) -> bool:
    """Soft delete: útil para poder revisar después si un comentario borrado
    contenía información relevante para una disputa o reclamo."""
    comentario = db.query(Comentario).filter(Comentario.id == comentario_id).first()
    if not comentario or comentario.fecha_eliminacion is not None:
        return False

    marcar_eliminado(db, comentario)
    return True

