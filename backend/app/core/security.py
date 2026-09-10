from datetime import datetime, timezone
from typing import Optional

import bcrypt
import jwt

from app.core.config import ACCESS_TOKEN_EXPIRE, ALGORITHM, SECRET_KEY


def hash_password(plain_password: str) -> str:
    return bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def create_access_token(usuario_id: int, rol=None, extra_claims: Optional[dict] = None) -> str:
    """Genera un JWT real firmado con SECRET_KEY, con expiración (exp) e
    instante de emisión (iat). `sub` es el id del usuario."""
    ahora = datetime.now(timezone.utc)
    payload = {
        "sub": str(usuario_id),
        "iat": ahora,
        "exp": ahora + ACCESS_TOKEN_EXPIRE,
    }
    if rol is not None:
        payload["rol"] = rol
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decodifica y valida el JWT. Lanza ValueError si expiró o es inválido/manipulado."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError as exc:
        raise ValueError("El token ha expirado") from exc
    except jwt.InvalidTokenError as exc:
        raise ValueError("Token inválido") from exc