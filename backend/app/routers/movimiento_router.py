from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas import InventarioResponse, KardexResponse, RegistroMovimiento
from app.services import movimiento_service
from app.services.movimiento_service import StockInsuficienteError

router = APIRouter(prefix="/movimientos", tags=["Inventario y Kardex"])


@router.post("/", response_model=KardexResponse, status_code=status.HTTP_201_CREATED)
def registrar_movimiento(
    movimiento: RegistroMovimiento,
    usuario_id: int = Query(..., description="ID del usuario que registra el movimiento"),
    db: Session = Depends(get_db),
):
    """TV-MAT-03 / TV-OUT-13: registra una entrada o salida y actualiza el stock del proyecto."""
    try:
        return movimiento_service.registrar_movimiento(db, usuario_id, movimiento)
    except StockInsuficienteError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))


@router.get("/", response_model=List[KardexResponse])
def listar_movimientos(
    proyecto_id: Optional[int] = Query(None),
    material_id: Optional[int] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """TV-KDX-14: historial inmutable de movimientos, filtrable por proyecto y/o material."""
    return movimiento_service.listar_movimientos(db, proyecto_id, material_id, skip, limit)


@router.get("/inventario/{proyecto_id}", response_model=List[InventarioResponse])
def get_inventario_proyecto(proyecto_id: int, db: Session = Depends(get_db)):
    """Stock actual de cada material dentro de un proyecto puntual."""
    return movimiento_service.listar_inventario_proyecto(db, proyecto_id)
