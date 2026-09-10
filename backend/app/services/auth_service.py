import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import httpx
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Usuario
from app.schemas import UsuarioLogin

from app.core.config import ALGORITHM, SECRET_KEY
MINUTOS_EXPIRACION_TOKEN = 60 * 8  # 8 horas

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# --- Contraseñas ---
# Se usa bcrypt directamente (no passlib): passlib 1.7.4 no es compatible con
# versiones recientes de bcrypt y rompe con un ValueError al hashear.

def hashear_contrasena(contrasena: str) -> str:
    return bcrypt.hashpw(contrasena.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verificar_contrasena(contrasena_plana: str, contrasena_hasheada: str) -> bool:
    try:
        return bcrypt.checkpw(contrasena_plana.encode("utf-8"), contrasena_hasheada.encode("utf-8"))
    except (ValueError, TypeError):
        return False


# --- Autenticación (login) ---

def autenticar_usuario(db: Session, credenciales: UsuarioLogin) -> Optional[Usuario]:
    """Busca al usuario y valida la contraseña. Devuelve None si las credenciales no son válidas."""
    usuario = db.query(Usuario).filter(Usuario.correo_electronico == credenciales.correo_electronico).first()
    if not usuario:
        return None

    if not verificar_contrasena(credenciales.contrasena, usuario.contrasena_encriptada):
        return None

    return usuario


# --- JWT ---

def crear_token_acceso(usuario: Usuario) -> str:
    expira = datetime.now(timezone.utc) + timedelta(minutes=MINUTOS_EXPIRACION_TOKEN)
    payload = {
        "sub": str(usuario.id_usuario),
        "rol": usuario.rol,
        "exp": expira,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _decodificar_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="La sesión expiró, vuelve a iniciar sesión.",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido.",
        )


def obtener_usuario_actual(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Usuario:
    """Dependencia de FastAPI: se agrega a cualquier endpoint que deba exigir sesión iniciada.

    Uso:  def mi_endpoint(usuario_actual: Usuario = Depends(obtener_usuario_actual)):
    """
    payload = _decodificar_token(token)
    usuario_id = payload.get("sub")

    usuario = db.query(Usuario).filter(Usuario.id_usuario == int(usuario_id)).first()
    if not usuario:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no encontrado")
    if not usuario.activo:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Usuario inactivo")

    return usuario


# --- Login con Google ---

def verificar_token_google(access_token: str) -> dict:
    """Verifica el access_token directamente con Google — nunca confiar en el
    correo/nombre que el cliente dice que corresponden al token.

    Antes, el endpoint /auth/google recibía correo_electronico y nombre_completo
    del frontend y los usaba tal cual, sin comprobar nada: cualquiera podía
    llamar al endpoint directo (sin pasar por Google) diciendo ser cualquier
    persona, y el backend le daba una sesión válida. Esta función cierra ese
    hueco pidiéndole la confirmación a Google mismo.
    """
    try:
        respuesta = httpx.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=5.0,
        )
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No se pudo contactar a Google para verificar la sesión. Intenta de nuevo.",
        ) from exc

    if respuesta.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="El token de Google no es válido o expiró. Vuelve a iniciar sesión.",
        )

    datos = respuesta.json()
    if datos.get("email_verified") is False:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="La cuenta de Google no tiene el correo verificado.",
        )

    return datos  # incluye 'email', 'name', 'picture' — confirmados por Google, no por el cliente
