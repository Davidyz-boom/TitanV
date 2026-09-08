from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Usuario
from app.schemas import TurnoCreate, TurnoResponse, TurnoUpdate
from app.services import asistencia_service, auth_service

router = APIRouter(prefix="/turnos", tags=["Turnos y Asistencia"])


@router.get("/", response_model=List[TurnoResponse])
def get_turnos(
    proyecto_id: Optional[int] = Query(None, description="Filtrar por proyecto"),
    usuario_id: Optional[int] = Query(None, description="Filtrar por usuario (para no-admins)"),
    incluir_eliminados: bool = False,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    return asistencia_service.listar_turnos(db, proyecto_id, usuario_id, incluir_eliminados, skip, limit)


@router.get("/{turno_id}", response_model=TurnoResponse)
def get_turno(turno_id: int, incluir_eliminados: bool = False, db: Session = Depends(get_db)):
    turno = asistencia_service.obtener_turno(db, turno_id, incluir_eliminados)
    if not turno:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turno no encontrado")
    return turno


@router.post("/", response_model=TurnoResponse, status_code=status.HTTP_201_CREATED)
def create_turno(
    turno: TurnoCreate,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(auth_service.obtener_usuario_actual),
):
    return asistencia_service.crear_turno(db, turno)


@router.put("/{turno_id}", response_model=TurnoResponse)
def update_turno(
    turno_id: int,
    turno_actualizado: TurnoUpdate,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(auth_service.obtener_usuario_actual),
):
    turno = asistencia_service.actualizar_turno(db, turno_id, turno_actualizado)
    if not turno:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turno no encontrado")
    return turno


@router.delete("/{turno_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_turno(
    turno_id: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(auth_service.obtener_usuario_actual),
):
    if not asistencia_service.eliminar_turno(db, turno_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turno no encontrado")
    return None


@router.post("/{turno_id}/restaurar", response_model=TurnoResponse)
def restaurar_turno(
    turno_id: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(auth_service.obtener_usuario_actual),
):
    turno = asistencia_service.restaurar_turno(db, turno_id)
    if not turno:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turno no encontrado o no está eliminado")
    return turno
