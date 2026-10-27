from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models import EstadoSolicitud


class SolicitudMaterialCreate(BaseModel):
    material_id: int
    proyecto_id: int
    cantidad: float = Field(..., gt=0)


class SolicitudMaterialUpdate(BaseModel):
    estado: EstadoSolicitud


class SolicitudMaterialResponse(BaseModel):
    id: int
    proyecto_id: int
    material_id: int
    usuario_id: int
    cantidad: float
    estado: EstadoSolicitud
    fecha_solicitud: datetime
    fecha_actualizacion: datetime
    material_nombre: Optional[str] = None
    unidad_medida: Optional[str] = None
    usuario_nombre: Optional[str] = None
    proyecto_nombre: Optional[str] = None

    class Config:
        from_attributes = True
