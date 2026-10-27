from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.permissions import verificar_rol_proyecto
from app.models import RolProyecto, Usuario
from app.schemas import ComentarioCreate, ComentarioResponse, TareaCreate, TareaResponse, TareaUpdate
from app.services import colaborador_service, tarea_service

router = APIRouter(prefix="/tareas", tags=["Tareas"])


def _verificar_acceso_tarea(db: Session, tarea_id: int, usuario: Usuario):
    """Devuelve la tarea solo si el usuario es colaborador del proyecto al que
    pertenece. Lanza 403 si no tiene acceso."""
    tarea = tarea_service.obtener_tarea(db, tarea_id)
    if not tarea:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarea no encontrada")
    if colaborador_service.obtener_rol_de_usuario(db, tarea.proyecto_id, usuario.id_usuario) is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No eres colaborador del proyecto de esta tarea",
        )
    return tarea


def _verificar_escritura_tarea(db: Session, tarea_id: int, usuario: Usuario):
    """Como _verificar_acceso_tarea, pero además exige un rol de escritura
    (Arquitecto o Trabajador). El Visualizador solo puede leer."""
    tarea = _verificar_acceso_tarea(db, tarea_id, usuario)
    verificar_rol_proyecto(db, usuario, tarea.proyecto_id, RolProyecto.ARQUITECTO, RolProyecto.TRABAJADOR)
    return tarea


@router.get("/", response_model=List[TareaResponse])
def get_tareas(
    proyecto_id: Optional[int] = Query(None, description="Filtrar por proyecto"),
    incluir_eliminados: bool = False,
    skip: int = 0,
    limit: int = 100,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Devuelve SOLO tareas de proyectos donde el usuario autenticado es colaborador."""
    if proyecto_id is not None:
        verificar_rol_proyecto(db, current_user, proyecto_id)
        return tarea_service.listar_tareas(db, proyecto_id, incluir_eliminados, skip, limit)
    proyectos = colaborador_service.proyectos_de_usuario(db, current_user.id_usuario)
    return tarea_service.listar_tareas(db, None, incluir_eliminados, skip, limit, proyectos_permitidos=proyectos)


@router.get("/{tarea_id}", response_model=TareaResponse)
def get_tarea(
    tarea_id: int,
    incluir_eliminados: bool = False,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _verificar_acceso_tarea(db, tarea_id, current_user)
    return tarea_service.obtener_tarea(db, tarea_id, incluir_eliminados)


@router.post("/", response_model=TareaResponse, status_code=status.HTTP_201_CREATED)
def create_tarea(
    tarea: TareaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    if tarea.proyecto_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debes indicar el proyecto de la tarea.",
        )
    verificar_rol_proyecto(db, current_user, tarea.proyecto_id, RolProyecto.ARQUITECTO, RolProyecto.TRABAJADOR)
    try:
        return tarea_service.crear_tarea(db, tarea)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al registrar tarea: {str(e)}",
        )


@router.put("/{tarea_id}", response_model=TareaResponse)
def update_tarea(
    tarea_id: int,
    tarea_actualizada: TareaUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    _verificar_escritura_tarea(db, tarea_id, current_user)
    tarea = tarea_service.actualizar_tarea(db, tarea_id, tarea_actualizada)
    if not tarea:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarea no encontrada")
    return tarea


@router.delete("/{tarea_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tarea(
    tarea_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    _verificar_escritura_tarea(db, tarea_id, current_user)
    if not tarea_service.eliminar_tarea(db, tarea_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarea no encontrada")
    return None


@router.post("/{tarea_id}/restaurar", response_model=TareaResponse)
def restaurar_tarea(
    tarea_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    _verificar_escritura_tarea(db, tarea_id, current_user)
    tarea = tarea_service.restaurar_tarea(db, tarea_id)
    if not tarea:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarea no encontrada o no está eliminada")
    return tarea


# --- Comentarios anidados bajo una tarea ---

@router.get("/{tarea_id}/comentarios", response_model=List[ComentarioResponse])
def get_comentarios(
    tarea_id: int,
    incluir_eliminados: bool = False,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _verificar_acceso_tarea(db, tarea_id, current_user)
    return tarea_service.listar_comentarios(db, tarea_id, incluir_eliminados)


@router.post(
    "/{tarea_id}/comentarios",
    response_model=ComentarioResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_comentario(
    tarea_id: int,
    comentario: ComentarioCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    tarea = _verificar_acceso_tarea(db, tarea_id, current_user)
    verificar_rol_proyecto(db, current_user, tarea.proyecto_id, RolProyecto.ARQUITECTO, RolProyecto.TRABAJADOR)
    return tarea_service.crear_comentario(db, tarea_id, current_user.id_usuario, comentario)


@router.delete("/comentarios/{comentario_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comentario(
    comentario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    comentario = tarea_service.obtener_comentario(db, comentario_id)
    if not comentario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comentario no encontrado")
    tarea = _verificar_acceso_tarea(db, comentario.tarea_id, current_user)
    rol = colaborador_service.obtener_rol_de_usuario(db, tarea.proyecto_id, current_user.id_usuario)
    if comentario.usuario_id != current_user.id_usuario and rol != RolProyecto.ARQUITECTO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo puedes eliminar tus propios comentarios; el Arquitecto del proyecto puede eliminar cualquiera.",
        )
    if not tarea_service.eliminar_comentario(db, comentario_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comentario no encontrado")
    return None
