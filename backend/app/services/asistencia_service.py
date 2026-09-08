from typing import Optional

from sqlalchemy.orm import Session

from app.core.soft_delete import marcar_eliminado, restaurar, sin_eliminados
from app.models import TurnoRelevo
from app.schemas import TurnoCreate, TurnoUpdate


def listar_turnos(
    db: Session,
    proyecto_id: Optional[int] = None,
    usuario_id: Optional[int] = None,
    incluir_eliminados: bool = False,
    skip: int = 0,
    limit: int = 100,
):
    from app.models import ProyectoObra, Usuario

    query = db.query(TurnoRelevo)

    if usuario_id is not None:
        usuario = db.query(Usuario).filter(Usuario.id_usuario == usuario_id).first()
        # Si no es admin, solo ve los turnos de este usuario o de sus obras registradas
        if usuario and usuario.rol != 1:
            query = query.outerjoin(ProyectoObra, TurnoRelevo.proyecto_id == ProyectoObra.id).filter(
                (TurnoRelevo.usuario_id == usuario_id) | (ProyectoObra.usuario_creador_id == usuario_id)
            )

    if proyecto_id is not None:
        query = query.filter(TurnoRelevo.proyecto_id == proyecto_id)

    if not incluir_eliminados:
        query = sin_eliminados(query, TurnoRelevo)

    return query.order_by(TurnoRelevo.fecha_turno.desc()).offset(skip).limit(limit).all()


def obtener_turno(db: Session, turno_id: int, incluir_eliminados: bool = False) -> Optional[TurnoRelevo]:
    query = db.query(TurnoRelevo).filter(TurnoRelevo.id == turno_id)
    if not incluir_eliminados:
        query = sin_eliminados(query, TurnoRelevo)
    return query.first()


def crear_turno(db: Session, turno: TurnoCreate) -> TurnoRelevo:
    nuevo_turno = TurnoRelevo(**turno.model_dump())
    db.add(nuevo_turno)
    db.commit()
    db.refresh(nuevo_turno)
    return nuevo_turno


def actualizar_turno(db: Session, turno_id: int, datos: TurnoUpdate) -> Optional[TurnoRelevo]:
    turno = obtener_turno(db, turno_id)
    if not turno:
        return None

    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(turno, campo, valor)

    db.commit()
    db.refresh(turno)
    return turno


def eliminar_turno(db: Session, turno_id: int) -> bool:
    """Soft delete: útil si hay que verificar después un turno/asistencia antiguo
    (por ejemplo, ante un reclamo de horas trabajadas)."""
    turno = obtener_turno(db, turno_id)
    if not turno:
        return False

    marcar_eliminado(db, turno)
    return True


def restaurar_turno(db: Session, turno_id: int) -> Optional[TurnoRelevo]:
    turno = obtener_turno(db, turno_id, incluir_eliminados=True)
    if not turno or turno.fecha_eliminacion is None:
        return None

    restaurar(db, turno)
    return turno
