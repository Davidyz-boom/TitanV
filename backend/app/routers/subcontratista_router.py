from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas import SubcontratistaCreate, SubcontratistaResponse, SubcontratistaUpdate
from app.services import subcontratista_service

router = APIRouter(prefix="/subcontratistas", tags=["Subcontratistas"])


@router.get("/", response_model=List[SubcontratistaResponse])
def get_subcontratistas(
    proyecto_id: Optional[int] = Query(None, description="Filtrar por proyecto"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    return subcontratista_service.listar_subcontratistas(db, proyecto_id, skip, limit)


@router.get("/{subcontratista_id}", response_model=SubcontratistaResponse)
def get_subcontratista(subcontratista_id: int, db: Session = Depends(get_db)):
    subcontratista = subcontratista_service.obtener_subcontratista(db, subcontratista_id)
    if not subcontratista:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subcontratista no encontrado")
    return subcontratista


@router.post("/", response_model=SubcontratistaResponse, status_code=status.HTTP_201_CREATED)
def create_subcontratista(datos: SubcontratistaCreate, db: Session = Depends(get_db)):
    return subcontratista_service.crear_subcontratista(db, datos)


@router.put("/{subcontratista_id}", response_model=SubcontratistaResponse)
def update_subcontratista(subcontratista_id: int, datos: SubcontratistaUpdate, db: Session = Depends(get_db)):
    subcontratista = subcontratista_service.actualizar_subcontratista(db, subcontratista_id, datos)
    if not subcontratista:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subcontratista no encontrado")
    return subcontratista


@router.delete("/{subcontratista_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subcontratista(subcontratista_id: int, db: Session = Depends(get_db)):
    if not subcontratista_service.eliminar_subcontratista(db, subcontratista_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subcontratista no encontrado")
    return None
