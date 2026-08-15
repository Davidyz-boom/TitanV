from datetime import date, time
from typing import Optional

from pydantic import BaseModel


class TurnoBase(BaseModel):
    fecha_turno: date
    hora_inicio: time
    hora_fin: time
    estado_asistencia: str = "Programado"


class TurnoCreate(TurnoBase):
    usuario_id: int
    proyecto_id: int


class TurnoUpdate(BaseModel):
    fecha_turno: Optional[date] = None
    hora_inicio: Optional[time] = None
    hora_fin: Optional[time] = None
    estado_asistencia: Optional[str] = None


class TurnoResponse(TurnoBase):
    id: int
    usuario_id: int
    proyecto_id: int

    class Config:
        from_attributes = True
