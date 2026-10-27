from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.permissions import verificar_rol_proyecto
from app.models import RolColaborador, RolProyecto, Usuario
from app.schemas import ColaboradorInvitar, ColaboradorResponse, ColaboradorUpdate, EnlaceInvitacionCreate, InvitacionCorreoResponse
from app.services import colaborador_service, email_service, invitacion_service, proyecto_service

router = APIRouter(prefix="/proyectos/{proyecto_id}/colaboradores", tags=["Colaboradores"])


def _validar_proyecto(db: Session, proyecto_id: int):
    if not proyecto_service.obtener_proyecto(db, proyecto_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proyecto no encontrado")


@router.get("/", response_model=List[ColaboradorResponse])
def get_colaboradores(
    proyecto_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _validar_proyecto(db, proyecto_id)
    verificar_rol_proyecto(db, current_user, proyecto_id)  # cualquier colaborador puede ver la lista
    return colaborador_service.listar_colaboradores(db, proyecto_id)


@router.post("/", response_model=InvitacionCorreoResponse, status_code=status.HTTP_201_CREATED)
def add_colaborador(
    proyecto_id: int,
    datos: ColaboradorInvitar,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Solo el Arquitecto puede invitar. Crea un enlace de invitación con el rol
    elegido y envía un correo a la persona con el link; quien lo abre se une al
    proyecto (no es necesario que tenga cuenta creada todavía)."""
    _validar_proyecto(db, proyecto_id)
    verificar_rol_proyecto(db, current_user, proyecto_id, RolColaborador.ARQUITECTO)

    if datos.rol == RolProyecto.ARQUITECTO:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo puedes invitar con los roles Trabajador o Visualizador.",
        )

    enlace = invitacion_service.crear_enlace(
        db, proyecto_id, current_user.id_usuario, EnlaceInvitacionCreate(rol=datos.rol)
    )
    enlace_url = email_service.construir_url_invitacion(enlace.token)

    correo_enviado = False
    motivo = ""
    try:
        proyecto = proyecto_service.obtener_proyecto(db, proyecto_id)
        email_service.enviar_correo_invitacion(
            destinatario=str(datos.correo_electronico),
            nombre_proyecto=proyecto.nombre_proyecto,
            rol=datos.rol.value,
            token=enlace.token,
        )
        correo_enviado = True
    except email_service.EmailError as error:
        # El enlace se creó y es válido; solo no llegó el correo. El Arquitecto
        # puede copiar el enlace de la respuesta y compartirlo manualmente.
        motivo = str(error)

    mensaje = (
        "Invitación enviada por correo a la persona invitada."
        if correo_enviado
        else f"No se pudo enviar el correo: {motivo}"
    )
    return InvitacionCorreoResponse(
        correo_electronico=str(datos.correo_electronico),
        rol=datos.rol,
        enlace_url=enlace_url,
        correo_enviado=correo_enviado,
        mensaje=mensaje,
    )


@router.put("/{colaborador_id}", response_model=ColaboradorResponse)
def update_colaborador(
    proyecto_id: int,
    colaborador_id: int,
    datos: ColaboradorUpdate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Solo el Arquitecto puede cambiar el rol de un colaborador."""
    _validar_proyecto(db, proyecto_id)
    verificar_rol_proyecto(db, current_user, proyecto_id, RolColaborador.ARQUITECTO)

    try:
        colaborador = colaborador_service.actualizar_rol(db, proyecto_id, colaborador_id, datos)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))

    if not colaborador:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Colaborador no encontrado")
    return colaborador


@router.delete("/{colaborador_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_colaborador(
    proyecto_id: int,
    colaborador_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Solo el Arquitecto puede quitar colaboradores del proyecto."""
    _validar_proyecto(db, proyecto_id)
    verificar_rol_proyecto(db, current_user, proyecto_id, RolColaborador.ARQUITECTO)

    try:
        eliminado = colaborador_service.eliminar_colaborador(db, proyecto_id, colaborador_id)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))

    if not eliminado:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Colaborador no encontrado")
    return None
