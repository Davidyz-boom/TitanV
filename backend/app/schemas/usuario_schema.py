from datetime import date
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.models import RolUsuario


class UsuarioBase(BaseModel):
    nombre_completo: str = Field(..., max_length=150, example="David Felipe Galindo")
    correo_electronico: EmailStr
    rol: RolUsuario
    fecha_vencimiento_licencia: Optional[date] = None
    tiene_certificacion_maquinaria: bool = False


class UsuarioCreate(UsuarioBase):
    """Esquema para el registro: exige la contraseña."""

    contrasena: str = Field(..., min_length=8, max_length=100, example="ClaveSegura123*")


class UsuarioUpdate(BaseModel):
    nombre_completo: Optional[str] = None
    rol: Optional[RolUsuario] = None
    activo: Optional[bool] = None
    fecha_vencimiento_licencia: Optional[date] = None
    tiene_certificacion_maquinaria: Optional[bool] = None


class UsuarioResponse(UsuarioBase):
    """Esquema de respuesta: jamás devuelve la contraseña ni los intentos fallidos."""

    id: int
    activo: bool

    class Config:
        from_attributes = True


class UsuarioLogin(BaseModel):
    """TV-AUTH-02: Credenciales de inicio de sesión."""

    correo_electronico: EmailStr
    contrasena: str
