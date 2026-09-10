from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models import Usuario

# HTTPBearer: el cliente manda "Authorization: Bearer <token>" (coherente con que
# /auth/login recibe JSON, no un formulario OAuth2 tradicional).
bearer_scheme = HTTPBearer(auto_error=True)


def get_current_user(
    credenciales: HTTPAuthorizationCredentials = Security(bearer_scheme),
    db: Session = Depends(get_db),
) -> Usuario:
    """Valida el JWT del header Authorization y devuelve el Usuario autenticado.
    Cualquier endpoint protegido debe declarar:
        current_user: Usuario = Depends(get_current_user)
    """
    excepcion_credenciales = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar el token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_access_token(credenciales.credentials)
    except ValueError:
        raise excepcion_credenciales

    usuario_id = payload.get("sub")
    if usuario_id is None:
        raise excepcion_credenciales

    try:
        usuario = db.query(Usuario).filter(Usuario.id_usuario == int(usuario_id)).first()
    except (TypeError, ValueError):
        raise excepcion_credenciales

    if usuario is None:
        raise excepcion_credenciales

    if hasattr(usuario, "activo") and not usuario.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El usuario se encuentra inactivo. Contacte al administrador.",
        )

    return usuario
