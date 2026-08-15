from datetime import date
from typing import Optional

from pydantic import BaseModel, Field

from app.models import EstadoProyecto


class ProyectoBase(BaseModel):
    nombre_proyecto: str = Field(..., max_length=150, example="Torre Titán Norte")
    ubicacion_direccion: str = Field(..., max_length=200, example="Calle 100 #15-30, Bogotá")
    estado: EstadoProyecto = EstadoProyecto.PLANIFICACION
    fecha_inicio: date
    fecha_fin_estimada: date


class ProyectoCreate(ProyectoBase):
    pass


class ProyectoUpdate(BaseModel):
    """Todos los campos son opcionales: solo se actualiza lo que se envíe."""

    nombre_proyecto: Optional[str] = None
    ubicacion_direccion: Optional[str] = None
    estado: Optional[EstadoProyecto] = None
    fecha_inicio: Optional[date] = None
    fecha_fin_estimada: Optional[date] = None


class ProyectoResponse(ProyectoBase):
    id: int

    class Config:
        from_attributes = True


class SubcontratistaBase(BaseModel):
    nombre_empresa: str = Field(..., max_length=150)
    nit: str = Field(..., max_length=50)
    fecha_vencimiento_poliza: date
    fecha_vencimiento_ss: date
    estado: str = "Autorizado"


class SubcontratistaCreate(SubcontratistaBase):
    proyecto_id: int


class SubcontratistaUpdate(BaseModel):
    nombre_empresa: Optional[str] = Field(None, max_length=150)
    nit: Optional[str] = Field(None, max_length=50)
    fecha_vencimiento_poliza: Optional[date] = None
    fecha_vencimiento_ss: Optional[date] = None
    estado: Optional[str] = None


class SubcontratistaResponse(SubcontratistaBase):
    id: int
    proyecto_id: int

    class Config:
        from_attributes = True
