from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas import MaterialCreate, MaterialResponse, MaterialUpdate
from app.services import material_service

router = APIRouter(prefix="/materiales", tags=["Materiales"])


@router.get("/", response_model=List[MaterialResponse])
def get_materiales(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return material_service.listar_materiales(db, skip, limit)


@router.get("/{material_id}", response_model=MaterialResponse)
def get_material(material_id: int, db: Session = Depends(get_db)):
    material = material_service.obtener_material(db, material_id)
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material no encontrado")
    return material


@router.post("/", response_model=MaterialResponse, status_code=status.HTTP_201_CREATED)
def create_material(material: MaterialCreate, db: Session = Depends(get_db)):
    return material_service.crear_material(db, material)


@router.put("/{material_id}", response_model=MaterialResponse)
def update_material(material_id: int, material_actualizado: MaterialUpdate, db: Session = Depends(get_db)):
    material = material_service.actualizar_material(db, material_id, material_actualizado)
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material no encontrado")
    return material


@router.delete("/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_material(material_id: int, db: Session = Depends(get_db)):
    if not material_service.eliminar_material(db, material_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material no encontrado")
    return None
