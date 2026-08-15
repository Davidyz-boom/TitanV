from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas import UsuarioLogin
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/login")
def login(credenciales: UsuarioLogin, db: Session = Depends(get_db)):
    usuario = auth_service.autenticar_usuario(db, credenciales)

    if not usuario:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Credenciales incorrectas")

    if hasattr(usuario, "activo") and not usuario.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El usuario se encuentra inactivo. Contacte al administrador.",
        )

    return {
        "mensaje": "Login exitoso",
        "usuario_id": getattr(usuario, "id_usuario", getattr(usuario, "id", 1)),
        "rol": getattr(usuario, "rol", "usuario"),
        "token": "token-jwt-titanv-activo",
    }
