from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import RolProyecto, Usuario
from app.schemas import AceptarInvitacionResponse, EnlaceInvitacionCreate, EnlaceInvitacionResponse
from app.services import auth_service, colaborador_service, invitacion_service, proyecto_service

router = APIRouter(tags=["Invitaciones"])


def _exigir_arquitecto(db: Session, proyecto_id: int, usuario: Usuario) -> None:
    rol = colaborador_service.obtener_rol_de_usuario(db, proyecto_id, usuario.id_usuario)
    if rol != RolProyecto.ARQUITECTO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo el Arquitecto del proyecto puede generar enlaces de invitación.",
        )


@router.post(
    "/proyectos/{proyecto_id}/enlaces",
    response_model=EnlaceInvitacionResponse,
    status_code=status.HTTP_201_CREATED,
)
def crear_enlace(
    proyecto_id: int,
    datos: EnlaceInvitacionCreate,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(auth_service.obtener_usuario_actual),
):
    if not proyecto_service.obtener_proyecto(db, proyecto_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proyecto no encontrado")
    if datos.rol == RolProyecto.ARQUITECTO:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Los enlaces solo conceden roles de colaborador (Trabajador o Visualizador).",
        )
    _exigir_arquitecto(db, proyecto_id, usuario_actual)
    return invitacion_service.crear_enlace(db, proyecto_id, usuario_actual.id_usuario, datos)


@router.get("/proyectos/{proyecto_id}/enlaces", response_model=List[EnlaceInvitacionResponse])
def listar_enlaces(
    proyecto_id: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(auth_service.obtener_usuario_actual),
):
    _exigir_arquitecto(db, proyecto_id, usuario_actual)
    return invitacion_service.listar_enlaces(db, proyecto_id)


@router.delete("/proyectos/{proyecto_id}/enlaces/{enlace_id}", status_code=status.HTTP_204_NO_CONTENT)
def revocar_enlace(
    proyecto_id: int,
    enlace_id: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(auth_service.obtener_usuario_actual),
):
    _exigir_arquitecto(db, proyecto_id, usuario_actual)
    if not invitacion_service.revocar_enlace(db, proyecto_id, enlace_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enlace no encontrado")
    return None


@router.post("/invitaciones/{token}/aceptar", response_model=AceptarInvitacionResponse)
def aceptar_invitacion(
    token: str,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(auth_service.obtener_usuario_actual),
):
    """El frontend llama esto cuando un usuario logueado abre un link de invitación."""
    try:
        enlace = invitacion_service.aceptar_invitacion(db, token, usuario_actual.id_usuario)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))

    return AceptarInvitacionResponse(
        mensaje="Te uniste al proyecto correctamente.",
        proyecto_id=enlace.proyecto_id,
        rol=RolProyecto(enlace.rol),
    )
