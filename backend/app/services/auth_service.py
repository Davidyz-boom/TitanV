from typing import Optional

from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.models import Usuario
from app.schemas import UsuarioLogin

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def autenticar_usuario(db: Session, credenciales: UsuarioLogin) -> Optional[Usuario]:
    """Busca al usuario y valida la contraseña. Devuelve None si las credenciales no son válidas."""
    usuario = db.query(Usuario).filter(Usuario.correo_electronico == credenciales.correo_electronico).first()
    if not usuario:
        return None

    contrasena_valida = False
    try:
        if pwd_context.verify(credenciales.contrasena, usuario.contrasena_encriptada):
            contrasena_valida = True
    except Exception:
        # Fallback por si la contraseña en BD quedó guardada temporalmente en texto plano
        if usuario.contrasena_encriptada == credenciales.contrasena:
            contrasena_valida = True

    return usuario if contrasena_valida else None
