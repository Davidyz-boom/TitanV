from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import ColaboradorProyecto, RolColaborador, Usuario


def obtener_rol_en_proyecto(db: Session, usuario_id: int, proyecto_id: int) -> Optional[RolColaborador]:
    """Devuelve el rol (Arquitecto/Trabajador/Visualizador) del usuario en ese
    proyecto puntual, o None si no es colaborador de él."""
    colaborador = (
        db.query(ColaboradorProyecto)
        .filter(
            ColaboradorProyecto.usuario_id == usuario_id,
            ColaboradorProyecto.proyecto_id == proyecto_id,
        )
        .first()
    )
    return RolColaborador(colaborador.rol) if colaborador else None


def verificar_rol_proyecto(
    db: Session,
    usuario: Usuario,
    proyecto_id: int,
    *roles_permitidos: RolColaborador,
) -> RolColaborador:
    """Lanza 403 si el usuario no es colaborador del proyecto, o si su rol no
    está entre los permitidos para la acción. Si no se pasa ningún rol permitido,
    solo exige ser colaborador (cualquier rol), útil para endpoints de lectura.

    Devuelve el rol del usuario si la verificación pasa, por si el llamador lo
    necesita (ej. para lógica adicional según el rol).
    """
    rol = obtener_rol_en_proyecto(db, usuario.id_usuario, proyecto_id)

    if rol is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No eres colaborador de este proyecto",
        )

    if roles_permitidos and rol not in roles_permitidos:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Tu rol en este proyecto ('{rol.value}') no tiene permiso para esta acción",
        )

    return rol
