from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.models import RolProyecto


class ColaboradorInvitar(BaseModel):
    """Para invitar, se usa el correo (no el id) — es lo que el arquitecto conoce de la otra persona."""

    correo_electronico: EmailStr
    rol: RolProyecto = RolProyecto.TRABAJADOR


class ColaboradorUpdate(BaseModel):
    rol: RolProyecto


class ColaboradorResponse(BaseModel):
    id: int
    proyecto_id: int
    usuario_id: int
    rol: RolProyecto
    fecha_vinculacion: datetime

    # Datos del usuario "aplanados" en la respuesta, para que el frontend no
    # tenga que hacer una llamada aparte solo para mostrar nombre/correo.
    usuario_nombre: str
    usuario_correo: str

    class Config:
        from_attributes = True


# Alias agregado para solucionar el error del router
ColaboradorCreate = ColaboradorInvitar