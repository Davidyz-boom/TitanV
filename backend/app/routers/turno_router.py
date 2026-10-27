from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.permissions import verificar_rol_proyecto
from app.models import RolProyecto, Usuario
from app.schemas import TurnoCreate, TurnoResponse, TurnoUpdate
from app.services import asistencia_service, colaborador_service

router = APIRouter(prefix="/turnos", tags=["Turnos y Asistencia"])


def _verificar_acceso_turno(db: Session, turno_id: int, usuario: Usuario):
    turno = asistencia_service.obtener_turno(db, turno_id)
    if not turno:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turno no encontrado")
    if colaborador_service.obtener_rol_de_usuario(db, turno.proyecto_id, usuario.id_usuario) is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No eres colaborador del proyecto de este turno",
        )
    return turno


def _verificar_escritura_turno(db: Session, turno_id: int, usuario: Usuario):
    """Como _verificar_acceso_turno, pero además exige un rol de escritura
    (Arquitecto o Trabajador). El Visualizador solo puede leer."""
    turno = _verificar_acceso_turno(db, turno_id, usuario)
    verificar_rol_proyecto(db, usuario, turno.proyecto_id, RolProyecto.ARQUITECTO, RolProyecto.TRABAJADOR)
    return turno


@router.get("/", response_model=List[TurnoResponse])
def get_turnos(
    proyecto_id: Optional[int] = Query(None, description="Filtrar por proyecto"),
    incluir_eliminados: bool = False,
    skip: int = 0,
    limit: int = 100,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Devuelve SOLO turnos de proyectos donde el usuario autenticado es colaborador."""
    if proyecto_id is not None:
        verificar_rol_proyecto(db, current_user, proyecto_id)
        return asistencia_service.listar_turnos(db, proyecto_id, incluir_eliminados, skip, limit)
    proyectos = colaborador_service.proyectos_de_usuario(db, current_user.id_usuario)
    return asistencia_service.listar_turnos(db, None, incluir_eliminados, skip, limit, proyectos_permitidos=proyectos)


@router.get("/{turno_id}", response_model=TurnoResponse)
def get_turno(
    turno_id: int,
    incluir_eliminados: bool = False,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _verificar_acceso_turno(db, turno_id, current_user)
    return asistencia_service.obtener_turno(db, turno_id, incluir_eliminados)


@router.post("/", response_model=TurnoResponse, status_code=status.HTTP_201_CREATED)
def create_turno(
    turno: TurnoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    verificar_rol_proyecto(db, current_user, turno.proyecto_id, RolProyecto.ARQUITECTO, RolProyecto.TRABAJADOR)
    return asistencia_service.crear_turno(db, turno)


@router.put("/{turno_id}", response_model=TurnoResponse)
def update_turno(
    turno_id: int,
    turno_actualizado: TurnoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    _verificar_escritura_turno(db, turno_id, current_user)
    turno = asistencia_service.actualizar_turno(db, turno_id, turno_actualizado)
    if not turno:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turno no encontrado")
    return turno


@router.delete("/{turno_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_turno(
    turno_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    _verificar_escritura_turno(db, turno_id, current_user)
    if not asistencia_service.eliminar_turno(db, turno_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turno no encontrado")
    return None
