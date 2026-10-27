from datetime import datetime

from pydantic import BaseModel

from app.models import RolProyecto


class EnlaceInvitacionCreate(BaseModel):
    rol: RolProyecto = RolProyecto.TRABAJADOR


class EnlaceInvitacionResponse(BaseModel):
    id: int
    proyecto_id: int
    rol: RolProyecto
    token: str
    fecha_creacion: datetime
    fecha_expiracion: datetime
    activo: bool

    class Config:
        from_attributes = True


class AceptarInvitacionResponse(BaseModel):
    mensaje: str
    proyecto_id: int
    rol: RolProyecto
