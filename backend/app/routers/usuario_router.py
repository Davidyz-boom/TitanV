from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import RolUsuario, Usuario
from app.schemas import UsuarioCreate, UsuarioResponse, UsuarioUpdate
from app.services import usuario_service

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


def _exigir_admin(current_user: Usuario):
    """Gestionar la cuenta de otras personas (crear/editar/borrar) es un rol
    global del sistema (RolUsuario), no un rol de proyecto: solo ADMIN."""
    if current_user.rol != RolUsuario.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo un administrador puede gestionar usuarios",
        )


@router.get("/", response_model=List[UsuarioResponse])
def get_usuarios(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    return usuario_service.listar_usuarios(db, skip, limit)


@router.get("/{usuario_id}", response_model=UsuarioResponse)
def get_usuario(
    usuario_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    usuario = usuario_service.obtener_usuario(db, usuario_id)
    if not usuario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return usuario


@router.post("/", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def create_usuario(
    usuario: UsuarioCreate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _exigir_admin(current_user)
    if usuario_service.correo_registrado(db, usuario.correo_electronico):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="El correo electronico ya esta registrado"
        )
    return usuario_service.crear_usuario(db, usuario)


@router.put("/{usuario_id}", response_model=UsuarioResponse)
def update_usuario(
    usuario_id: int,
    usuario_actualizado: UsuarioUpdate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Un usuario puede editar su propio perfil (ej. su contrasena); para editar a
    # otros, o para cambiar de rol/estado activo, se exige ser ADMIN.
    es_uno_mismo = current_user.id_usuario == usuario_id
    cambia_campos_sensibles = usuario_actualizado.rol is not None or usuario_actualizado.activo is not None
    if not es_uno_mismo or cambia_campos_sensibles:
        _exigir_admin(current_user)

    usuario = usuario_service.actualizar_usuario(db, usuario_id, usuario_actualizado)
    if not usuario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return usuario


@router.delete("/{usuario_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_usuario(
    usuario_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _exigir_admin(current_user)
    if not usuario_service.eliminar_usuario(db, usuario_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return None


@router.post("/{usuario_id}/restaurar", response_model=UsuarioResponse)
def restaurar_usuario(
    usuario_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _exigir_admin(current_user)
    usuario = usuario_service.restaurar_usuario(db, usuario_id)
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado o ya está activo"
        )
    return usuario
