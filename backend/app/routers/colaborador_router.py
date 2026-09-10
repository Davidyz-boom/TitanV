from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.permissions import verificar_rol_proyecto
from app.models import RolColaborador, Usuario
from app.schemas import ColaboradorInvitar, ColaboradorResponse, ColaboradorUpdate
from app.services import colaborador_service, proyecto_service

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


@router.post("/", response_model=ColaboradorResponse, status_code=status.HTTP_201_CREATED)
def add_colaborador(
    proyecto_id: int,
    datos: ColaboradorInvitar,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Solo el Arquitecto del proyecto puede agregar colaboradores. Se invita por
    correo (la persona debe tener cuenta creada en Titan V de antemano)."""
    _validar_proyecto(db, proyecto_id)
    verificar_rol_proyecto(db, current_user, proyecto_id, RolColaborador.ARQUITECTO)

    try:
        return colaborador_service.invitar_colaborador(db, proyecto_id, datos)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))


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
