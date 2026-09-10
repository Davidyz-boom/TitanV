from datetime import date
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.models import RolUsuario


class UsuarioBase(BaseModel):
    nombre_completo: str = Field(..., max_length=150, example="David Felipe Galindo")
    correo_electronico: EmailStr
    rol: RolUsuario = RolUsuario.OPERARIO
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
    contrasena: Optional[str] = Field(None, min_length=8, max_length=100, example="NuevaClave123*")


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


class TokenResponse(BaseModel):
    """Respuesta del login: JWT real con expiración."""

    mensaje: str
    usuario_id: int
    rol: int
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class GoogleAuthRequest(BaseModel):
    """TV-AUTH-03: Datos para autenticación con cuenta de Google.

    'credential' es el access_token que el frontend obtuvo directamente de Google
    (via @react-oauth/google). El backend lo vuelve a verificar contra los
    servidores de Google — nunca confía en correo_electronico/nombre_completo
    tal cual los manda el cliente, porque esos campos se pueden falsificar.
    """

    credential: str
    correo_electronico: Optional[EmailStr] = None
    nombre_completo: Optional[str] = None
    foto_url: Optional[str] = None

