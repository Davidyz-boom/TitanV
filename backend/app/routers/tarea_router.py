from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas import ComentarioCreate, ComentarioResponse, TareaCreate, TareaResponse, TareaUpdate
from app.services import tarea_service

router = APIRouter(prefix="/tareas", tags=["Tareas"])


@router.get("/", response_model=List[TareaResponse])
def get_tareas(
    proyecto_id: Optional[int] = Query(None, description="Filtrar por proyecto"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    return tarea_service.listar_tareas(db, proyecto_id, skip, limit)


@router.get("/{tarea_id}", response_model=TareaResponse)
def get_tarea(tarea_id: int, db: Session = Depends(get_db)):
    tarea = tarea_service.obtener_tarea(db, tarea_id)
    if not tarea:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarea no encontrada")
    return tarea


@router.post("/", response_model=TareaResponse, status_code=status.HTTP_201_CREATED)
def create_tarea(tarea: TareaCreate, db: Session = Depends(get_db)):
    return tarea_service.crear_tarea(db, tarea)


@router.put("/{tarea_id}", response_model=TareaResponse)
def update_tarea(tarea_id: int, tarea_actualizada: TareaUpdate, db: Session = Depends(get_db)):
    tarea = tarea_service.actualizar_tarea(db, tarea_id, tarea_actualizada)
    if not tarea:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarea no encontrada")
    return tarea


@router.delete("/{tarea_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tarea(tarea_id: int, db: Session = Depends(get_db)):
    if not tarea_service.eliminar_tarea(db, tarea_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarea no encontrada")
    return None


# --- Comentarios anidados bajo una tarea ---

@router.get("/{tarea_id}/comentarios", response_model=List[ComentarioResponse])
def get_comentarios(tarea_id: int, db: Session = Depends(get_db)):
    if not tarea_service.obtener_tarea(db, tarea_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarea no encontrada")
    return tarea_service.listar_comentarios(db, tarea_id)


@router.post(
    "/{tarea_id}/comentarios",
    response_model=ComentarioResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_comentario(
    tarea_id: int,
    comentario: ComentarioCreate,
    usuario_id: int = Query(..., description="ID del usuario que publica el comentario"),
    db: Session = Depends(get_db),
):
    if not tarea_service.obtener_tarea(db, tarea_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarea no encontrada")
    return tarea_service.crear_comentario(db, tarea_id, usuario_id, comentario)


@router.delete("/comentarios/{comentario_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comentario(comentario_id: int, db: Session = Depends(get_db)):
    if not tarea_service.eliminar_comentario(db, comentario_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comentario no encontrado")
    return None
