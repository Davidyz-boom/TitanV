import re
from datetime import date
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models import RolUsuario

# Solo letras (con acentos y ñ), espacios, guiones, apóstrofes y puntos.
PATRON_NOMBRE = re.compile(r"^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ'’.\- ]{2,150}$")


def validar_contrasena(valor: Optional[str]) -> Optional[str]:
    """Reglas únicas de contraseña (registro y cambio de contraseña).

    bcrypt solo guarda los primeros 72 bytes, así que ese es el tope real.
    """
    if valor is None:
        return None
    valor = valor.strip()
    if len(valor) < 8:
        raise ValueError("La contraseña debe tener al menos 8 caracteres.")
    if len(valor.encode("utf-8")) > 72:
        raise ValueError("La contraseña no puede superar los 72 caracteres.")
    if not re.search(r"[A-Z]", valor):
        raise ValueError("La contraseña debe tener al menos una letra mayúscula.")
    if not re.search(r"[0-9]", valor):
        raise ValueError("La contraseña debe tener al menos un número.")
    return valor


def validar_nombre_completo(valor: Optional[str]) -> Optional[str]:
    if valor is None:
        return None
    valor = " ".join(valor.split())
    if not PATRON_NOMBRE.fullmatch(valor):
        raise ValueError(
            "El nombre solo puede contener letras, espacios, puntos, guiones o apóstrofes (2 a 150 caracteres)."
        )
    return valor


class UsuarioBase(BaseModel):
    nombre_completo: str = Field(..., max_length=150, example="David Felipe Galindo")
    correo_electronico: EmailStr
    rol: RolUsuario = RolUsuario.OPERARIO
    fecha_vencimiento_licencia: Optional[date] = None
    tiene_certificacion_maquinaria: bool = False

    @field_validator("nombre_completo")
    @classmethod
    def _nombre_valido(cls, valor):
        return validar_nombre_completo(valor)


class UsuarioCreate(UsuarioBase):
    """Esquema para el registro: exige la contraseña."""

    contrasena: str = Field(..., min_length=8, max_length=72, example="ClaveSegura123")

    @field_validator("contrasena")
    @classmethod
    def _contrasena_valida(cls, valor):
        return validar_contrasena(valor)


class UsuarioUpdate(BaseModel):
    nombre_completo: Optional[str] = None
    rol: Optional[RolUsuario] = None
    activo: Optional[bool] = None
    fecha_vencimiento_licencia: Optional[date] = None
    tiene_certificacion_maquinaria: Optional[bool] = None
    contrasena: Optional[str] = Field(None, min_length=8, max_length=72, example="NuevaClave123")

    @field_validator("nombre_completo")
    @classmethod
    def _nombre_valido(cls, valor):
        return validar_nombre_completo(valor)

    @field_validator("contrasena")
    @classmethod
    def _contrasena_valida(cls, valor):
        return validar_contrasena(valor)


class UsuarioResponse(UsuarioBase):
    """Esquema de respuesta: jamás devuelve la contraseña ni los intentos fallidos."""

    id: int
    activo: bool

    class Config:
        from_attributes = True


class UsuarioLogin(BaseModel):
    """TV-AUTH-02: Credenciales de inicio de sesión.

    La contraseña no se valida con las reglas de fuerza aquí: es una credencial
    existente, y bcrypt compara truncando a 72 bytes igual que al guardarla.
    """

    correo_electronico: EmailStr
    contrasena: str = Field(..., max_length=256)


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

    credential: str = Field(..., min_length=10, max_length=4096)
    correo_electronico: Optional[EmailStr] = None
    nombre_completo: Optional[str] = None
    foto_url: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class VerifyPinRequest(BaseModel):
    email: EmailStr
    pin: str = Field(..., min_length=4, max_length=4, pattern=r"^\d{4}$")


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    pin: str = Field(..., min_length=4, max_length=4, pattern=r"^\d{4}$")
    newPassword: str = Field(..., min_length=8, max_length=72)

    @field_validator("newPassword")
    @classmethod
    def _contrasena_valida(cls, valor):
        return validar_contrasena(valor)
