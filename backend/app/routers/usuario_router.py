from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas import UsuarioCreate, UsuarioResponse, UsuarioUpdate
from app.services import usuario_service

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


@router.get("/", response_model=List[UsuarioResponse])
def get_usuarios(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return usuario_service.listar_usuarios(db, skip, limit)


@router.get("/{usuario_id}", response_model=UsuarioResponse)
def get_usuario(usuario_id: int, db: Session = Depends(get_db)):
    usuario = usuario_service.obtener_usuario(db, usuario_id)
    if not usuario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return usuario


@router.post("/", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def create_usuario(usuario: UsuarioCreate, db: Session = Depends(get_db)):
    if usuario_service.correo_registrado(db, usuario.correo_electronico):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="El correo electrónico ya está registrado"
        )
    return usuario_service.crear_usuario(db, usuario)


@router.put("/{usuario_id}", response_model=UsuarioResponse)
def update_usuario(usuario_id: int, usuario_actualizado: UsuarioUpdate, db: Session = Depends(get_db)):
    usuario = usuario_service.actualizar_usuario(db, usuario_id, usuario_actualizado)
    if not usuario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return usuario


@router.delete("/{usuario_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_usuario(usuario_id: int, db: Session = Depends(get_db)):
    if not usuario_service.eliminar_usuario(db, usuario_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return None
