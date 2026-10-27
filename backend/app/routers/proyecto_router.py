from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.permissions import verificar_rol_proyecto
from app.models import RolProyecto, Usuario
from app.schemas import ProyectoCreate, ProyectoResponse, ProyectoUpdate
from app.services import auth_service, colaborador_service, proyecto_service

router = APIRouter(prefix="/proyectos", tags=["Proyectos"])


def _exigir_arquitecto(db: Session, proyecto_id: int, usuario: Usuario) -> None:
    """Solo el Arquitecto del proyecto puede invitar, cambiar roles o quitar colaboradores."""
    rol = colaborador_service.obtener_rol_de_usuario(db, proyecto_id, usuario.id_usuario)
    if rol != RolProyecto.ARQUITECTO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo el Arquitecto del proyecto puede gestionar colaboradores.",
        )


@router.get("/", response_model=List[ProyectoResponse])
def get_proyectos(
    usuario_id: Optional[int] = None,
    incluir_eliminados: bool = False,
    skip: int = 0,
    limit: int = 100,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Devuelve PROYECTOS del usuario autenticado. La identidad siempre sale del
    token JWT; el query param usuario_id se conserva solo por compatibilidad y
    no se usa como fuente de verdad."""
    return proyecto_service.listar_proyectos(db, current_user.id_usuario, incluir_eliminados, skip, limit)


@router.get("/{proyecto_id}", response_model=ProyectoResponse)
def get_proyecto(
    proyecto_id: int,
    incluir_eliminados: bool = False,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    proyecto = proyecto_service.obtener_proyecto(db, proyecto_id, incluir_eliminados)
    if not proyecto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proyecto no encontrado")
    verificar_rol_proyecto(db, current_user, proyecto_id)
    return proyecto


@router.post("/", response_model=ProyectoResponse, status_code=status.HTTP_201_CREATED)
def create_proyecto(
    proyecto: ProyectoCreate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Quien crea el proyecto (el usuario del token) queda automáticamente como Arquitecto."""
    return proyecto_service.crear_proyecto(db, proyecto, usuario_creador_id=current_user.id_usuario)


@router.put("/{proyecto_id}", response_model=ProyectoResponse)
def update_proyecto(
    proyecto_id: int,
    proyecto_actualizado: ProyectoUpdate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _exigir_arquitecto(db, proyecto_id, current_user)
    proyecto = proyecto_service.actualizar_proyecto(db, proyecto_id, proyecto_actualizado)
    if not proyecto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proyecto no encontrado")
    return proyecto


@router.delete("/{proyecto_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_proyecto(
    proyecto_id: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(auth_service.obtener_usuario_actual),
):
    _exigir_arquitecto(db, proyecto_id, usuario_actual)
    if not proyecto_service.eliminar_proyecto(db, proyecto_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proyecto no encontrado")
    return None


@router.post("/{proyecto_id}/restaurar", response_model=ProyectoResponse)
def restaurar_proyecto(
    proyecto_id: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(auth_service.obtener_usuario_actual),
):
    """Deshace un DELETE — el proyecto vuelve a aparecer en los listados normales."""
    _exigir_arquitecto(db, proyecto_id, usuario_actual)
    proyecto = proyecto_service.restaurar_proyecto(db, proyecto_id)
    if not proyecto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Proyecto no encontrado o no está eliminado"
        )
    return proyecto
