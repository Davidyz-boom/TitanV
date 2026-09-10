from typing import Optional

from sqlalchemy.orm import Session

from app.core.soft_delete import marcar_eliminado, restaurar, sin_eliminados
from app.models import ProyectoColaborador, ProyectoObra
from app.schemas import ProyectoCreate, ProyectoUpdate
from app.services import colaborador_service


def listar_proyectos(
    db: Session, usuario_id: Optional[int] = None, incluir_eliminados: bool = False, skip: int = 0, limit: int = 100
):
    query = db.query(ProyectoObra)

    if usuario_id is not None:
        # Solo los proyectos donde este usuario participa como colaborador
        # (Arquitecto, Trabajador o Visualizador) — no todos los del sistema.
        query = query.join(ProyectoColaborador).filter(ProyectoColaborador.usuario_id == usuario_id)

    if not incluir_eliminados:
        query = sin_eliminados(query, ProyectoObra)

    return query.offset(skip).limit(limit).all()


def obtener_proyecto(db: Session, proyecto_id: int, incluir_eliminados: bool = False) -> Optional[ProyectoObra]:
    query = db.query(ProyectoObra).filter(ProyectoObra.id == proyecto_id)
    if not incluir_eliminados:
        query = sin_eliminados(query, ProyectoObra)
    return query.first()


def crear_proyecto(db: Session, proyecto: ProyectoCreate, usuario_creador_id: int) -> ProyectoObra:
    nuevo_proyecto = ProyectoObra(**proyecto.model_dump())
    db.add(nuevo_proyecto)
    db.commit()
    db.refresh(nuevo_proyecto)

    # Quien crea el proyecto queda automáticamente como Arquitecto.
    colaborador_service.agregar_arquitecto(db, nuevo_proyecto.id, usuario_creador_id)

    return nuevo_proyecto


def actualizar_proyecto(db: Session, proyecto_id: int, datos: ProyectoUpdate) -> Optional[ProyectoObra]:
    proyecto = obtener_proyecto(db, proyecto_id)
    if not proyecto:
        return None

    # exclude_unset=True: solo se tocan los campos que el cliente realmente envió
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(proyecto, campo, valor)

    db.commit()
    db.refresh(proyecto)
    return proyecto


def eliminar_proyecto(db: Session, proyecto_id: int) -> bool:
    """Soft delete: el proyecto deja de aparecer en los listados, pero no se borra
    de la base de datos — sigue existiendo por si hay que auditarlo después."""
    proyecto = obtener_proyecto(db, proyecto_id)
    if not proyecto:
        return False

    marcar_eliminado(db, proyecto)
    return True


def restaurar_proyecto(db: Session, proyecto_id: int) -> Optional[ProyectoObra]:
    proyecto = obtener_proyecto(db, proyecto_id, incluir_eliminados=True)
    if not proyecto or proyecto.fecha_eliminacion is None:
        return None

    restaurar(db, proyecto)
    return proyecto
