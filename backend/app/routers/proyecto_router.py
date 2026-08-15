from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas import ProyectoCreate, ProyectoResponse, ProyectoUpdate
from app.services import proyecto_service

router = APIRouter(prefix="/proyectos", tags=["Proyectos"])


@router.get("/", response_model=List[ProyectoResponse])
def get_proyectos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return proyecto_service.listar_proyectos(db, skip, limit)


@router.get("/{proyecto_id}", response_model=ProyectoResponse)
def get_proyecto(proyecto_id: int, db: Session = Depends(get_db)):
    proyecto = proyecto_service.obtener_proyecto(db, proyecto_id)
    if not proyecto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proyecto no encontrado")
    return proyecto


@router.post("/", response_model=ProyectoResponse, status_code=status.HTTP_201_CREATED)
def create_proyecto(proyecto: ProyectoCreate, db: Session = Depends(get_db)):
    return proyecto_service.crear_proyecto(db, proyecto)


@router.put("/{proyecto_id}", response_model=ProyectoResponse)
def update_proyecto(proyecto_id: int, proyecto_actualizado: ProyectoUpdate, db: Session = Depends(get_db)):
    proyecto = proyecto_service.actualizar_proyecto(db, proyecto_id, proyecto_actualizado)
    if not proyecto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proyecto no encontrado")
    return proyecto


@router.delete("/{proyecto_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_proyecto(proyecto_id: int, db: Session = Depends(get_db)):
    if not proyecto_service.eliminar_proyecto(db, proyecto_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proyecto no encontrado")
    return None
