from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.permissions import verificar_rol_proyecto
from app.models import EstadoSolicitud, RolColaborador, Usuario
from app.schemas import SolicitudMaterialCreate, SolicitudMaterialResponse, SolicitudMaterialUpdate
from app.services import solicitud_service

router = APIRouter(prefix="/solicitudes", tags=["Solicitudes de Material"])


def _response(solicitud):
    return SolicitudMaterialResponse(
        id=solicitud.id,
        proyecto_id=solicitud.proyecto_id,
        material_id=solicitud.material_id,
        usuario_id=solicitud.usuario_id,
        cantidad=solicitud.cantidad,
        estado=EstadoSolicitud(solicitud.estado),
        fecha_solicitud=solicitud.fecha_solicitud,
        fecha_actualizacion=solicitud.fecha_actualizacion,
        material_nombre=solicitud.material.nombre_material if solicitud.material else None,
        unidad_medida=solicitud.material.unidad_medida if solicitud.material else None,
        usuario_nombre=(f"{solicitud.usuario.nombres} {solicitud.usuario.apellidos}" if solicitud.usuario else None),
        proyecto_nombre=solicitud.proyecto.nombre_proyecto if solicitud.proyecto else None,
    )


@router.get("/", response_model=List[SolicitudMaterialResponse])
def listar(
    proyecto_id: int = Query(...),
    estado: Optional[EstadoSolicitud] = None,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    verificar_rol_proyecto(db, current_user, proyecto_id)
    return [_response(s) for s in solicitud_service.listar_solicitudes(db, proyecto_id, estado)]


@router.post("/", response_model=SolicitudMaterialResponse, status_code=status.HTTP_201_CREATED)
def crear(
    datos: SolicitudMaterialCreate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    verificar_rol_proyecto(db, current_user, datos.proyecto_id, RolColaborador.ARQUITECTO, RolColaborador.TRABAJADOR)
    try:
        return _response(solicitud_service.crear_solicitud(db, current_user.id_usuario, datos))
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))


@router.put("/{solicitud_id}", response_model=SolicitudMaterialResponse)
def actualizar(
    solicitud_id: int,
    datos: SolicitudMaterialUpdate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    solicitud = solicitud_service.obtener_solicitud(db, solicitud_id)
    if not solicitud:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Solicitud no encontrada.")
    verificar_rol_proyecto(db, current_user, solicitud.proyecto_id, RolColaborador.ARQUITECTO)
    try:
        return _response(solicitud_service.actualizar_estado(db, solicitud_id, datos.estado, current_user.id_usuario))
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))
