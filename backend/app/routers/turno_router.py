from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas import TurnoCreate, TurnoResponse, TurnoUpdate
from app.services import asistencia_service

router = APIRouter(prefix="/turnos", tags=["Turnos y Asistencia"])


@router.get("/", response_model=List[TurnoResponse])
def get_turnos(
    proyecto_id: Optional[int] = Query(None, description="Filtrar por proyecto"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    return asistencia_service.listar_turnos(db, proyecto_id, skip, limit)


@router.get("/{turno_id}", response_model=TurnoResponse)
def get_turno(turno_id: int, db: Session = Depends(get_db)):
    turno = asistencia_service.obtener_turno(db, turno_id)
    if not turno:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turno no encontrado")
    return turno


@router.post("/", response_model=TurnoResponse, status_code=status.HTTP_201_CREATED)
def create_turno(turno: TurnoCreate, db: Session = Depends(get_db)):
    return asistencia_service.crear_turno(db, turno)


@router.put("/{turno_id}", response_model=TurnoResponse)
def update_turno(turno_id: int, turno_actualizado: TurnoUpdate, db: Session = Depends(get_db)):
    turno = asistencia_service.actualizar_turno(db, turno_id, turno_actualizado)
    if not turno:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turno no encontrado")
    return turno


@router.delete("/{turno_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_turno(turno_id: int, db: Session = Depends(get_db)):
    if not asistencia_service.eliminar_turno(db, turno_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turno no encontrado")
    return None
