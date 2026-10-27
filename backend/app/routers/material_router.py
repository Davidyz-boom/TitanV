from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.permissions import verificar_rol_proyecto
from app.models import RolColaborador, Usuario
from app.schemas import MaterialCreate, MaterialResponse, MaterialUpdate
from app.services import material_service

router = APIRouter(
    prefix="/materiales",
    tags=["Materiales"]
)


def _material_autorizado(
    db: Session,
    material_id: int,
    usuario: Usuario
):
    material = material_service.obtener_material(
        db,
        material_id
    )

    if not material or material.proyecto_id is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material no encontrado"
        )

    verificar_rol_proyecto(
        db,
        usuario,
        material.proyecto_id,
        RolColaborador.ARQUITECTO,
    )

    return material


@router.get(
    "/",
    response_model=List[MaterialResponse]
)
def get_materiales(
    proyecto_id: int = Query(
        ...,
        description="Los insumos son exclusivos de cada proyecto"
    ),
    incluir_eliminados: bool = False,
    skip: int = 0,
    limit: int = 100,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    verificar_rol_proyecto(
        db,
        current_user,
        proyecto_id
    )

    return material_service.listar_materiales(
        db,
        proyecto_id,
        incluir_eliminados,
        skip,
        limit
    )


@router.get(
    "/{material_id}",
    response_model=MaterialResponse
)
def get_material(
    material_id: int,
    incluir_eliminados: bool = False,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    material = material_service.obtener_material(
        db,
        material_id,
        incluir_eliminados
    )

    if not material or material.proyecto_id is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material no encontrado"
        )

    verificar_rol_proyecto(
        db,
        current_user,
        material.proyecto_id
    )

    return material


@router.post(
    "/",
    response_model=MaterialResponse,
    status_code=status.HTTP_201_CREATED
)
def create_material(
    material: MaterialCreate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    verificar_rol_proyecto(
        db,
        current_user,
        material.proyecto_id,
        RolColaborador.ARQUITECTO,
    )

    return material_service.crear_material(
        db,
        material
    )


@router.put(
    "/{material_id}",
    response_model=MaterialResponse
)
def update_material(
    material_id: int,
    material_actualizado: MaterialUpdate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _material_autorizado(
        db,
        material_id,
        current_user
    )

    material = material_service.actualizar_material(
        db,
        material_id,
        material_actualizado
    )

    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material no encontrado"
        )

    return material


@router.delete(
    "/{material_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_material(
    material_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _material_autorizado(
        db,
        material_id,
        current_user
    )

    if not material_service.eliminar_material(
        db,
        material_id
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material no encontrado"
        )

    return None


@router.post(
    "/{material_id}/restaurar",
    response_model=MaterialResponse
)
def restaurar_material(
    material_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _material_autorizado(
        db,
        material_id,
        current_user
    )

    material = material_service.restaurar_material(
        db,
        material_id
    )

    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material no encontrado o no está eliminado"
        )

    return material
