from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models import EnlaceInvitacion, ProyectoColaborador, RolProyecto
from app.schemas import EnlaceInvitacionCreate


def crear_enlace(db: Session, proyecto_id: int, creado_por_id: int, datos: EnlaceInvitacionCreate) -> EnlaceInvitacion:
    nuevo = EnlaceInvitacion(proyecto_id=proyecto_id, creado_por_id=creado_por_id, rol=datos.rol.value)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


def listar_enlaces(db: Session, proyecto_id: int) -> List[EnlaceInvitacion]:
    return (
        db.query(EnlaceInvitacion)
        .filter(EnlaceInvitacion.proyecto_id == proyecto_id)
        .order_by(EnlaceInvitacion.fecha_creacion.desc())
        .all()
    )


def revocar_enlace(db: Session, proyecto_id: int, enlace_id: int) -> bool:
    enlace = (
        db.query(EnlaceInvitacion)
        .filter(EnlaceInvitacion.id == enlace_id, EnlaceInvitacion.proyecto_id == proyecto_id)
        .first()
    )
    if not enlace:
        return False

    enlace.activo = False
    db.commit()
    return True


def _obtener_enlace_valido(db: Session, token: str) -> Optional[EnlaceInvitacion]:
    enlace = db.query(EnlaceInvitacion).filter(EnlaceInvitacion.token == token).first()
    if not enlace or not enlace.activo:
        return None

    expiracion = enlace.fecha_expiracion
    if expiracion.tzinfo is None:
        expiracion = expiracion.replace(tzinfo=timezone.utc)
    if expiracion < datetime.now(timezone.utc):
        return None

    return enlace


def _validar_no_es_ultimo_arquitecto(db: Session, proyecto_id: int, colaborador_id_excluir: int) -> None:
    """Un proyecto siempre debe conservar al menos un Arquitecto: un enlace no
    debe poder degradar al único Arquitecto restante."""
    otros_arquitectos = (
        db.query(ProyectoColaborador)
        .filter(
            ProyectoColaborador.proyecto_id == proyecto_id,
            ProyectoColaborador.rol == RolProyecto.ARQUITECTO.value,
            ProyectoColaborador.id != colaborador_id_excluir,
        )
        .count()
    )
    if otros_arquitectos == 0:
        raise ValueError(
            "No puedes degradar al último Arquitecto del proyecto a través de este enlace. "
            "Asigna otro Arquitecto primero."
        )


def aceptar_invitacion(db: Session, token: str, usuario_id: int) -> EnlaceInvitacion:
    """Vincula al usuario que abrió el link al proyecto, con el rol que trae el enlace.

    Si la persona ya era colaboradora, se le actualiza el rol al del enlace
    (así un mismo link puede reutilizarse para "subir" a alguien de rol, por ejemplo).
    """
    enlace = _obtener_enlace_valido(db, token)
    if not enlace:
        raise ValueError("El enlace de invitación no es válido, expiró o fue revocado.")

    colaborador_existente = (
        db.query(ProyectoColaborador)
        .filter(
            ProyectoColaborador.proyecto_id == enlace.proyecto_id,
            ProyectoColaborador.usuario_id == usuario_id,
        )
        .first()
    )

    if colaborador_existente:
        rol_actual = RolProyecto(colaborador_existente.rol)
        if rol_actual == RolProyecto.ARQUITECTO and enlace.rol != RolProyecto.ARQUITECTO.value:
            _validar_no_es_ultimo_arquitecto(db, enlace.proyecto_id, colaborador_existente.id)
        colaborador_existente.rol = enlace.rol
        db.commit()
    else:
        nuevo_colaborador = ProyectoColaborador(
            proyecto_id=enlace.proyecto_id, usuario_id=usuario_id, rol=enlace.rol
        )
        db.add(nuevo_colaborador)
        db.commit()

    return enlace
