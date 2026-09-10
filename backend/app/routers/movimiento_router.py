from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.permissions import verificar_rol_proyecto
from app.models import RolColaborador, Usuario
from app.schemas import InventarioResponse, KardexResponse, RegistroMovimiento
from app.services import movimiento_service
from app.services.movimiento_service import StockInsuficienteError

router = APIRouter(prefix="/movimientos", tags=["Inventario y Kardex"])


@router.post("/", response_model=KardexResponse, status_code=status.HTTP_201_CREATED)
def registrar_movimiento(
    movimiento: RegistroMovimiento,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """TV-MAT-03 / TV-OUT-13: registra una entrada o salida y actualiza el stock del proyecto."""
    # Antes el autor del movimiento venia de un query param "usuario_id" (cualquiera
    # podia registrar movimientos a nombre de otro). Ahora se toma del token validado.
    verificar_rol_proyecto(
        db, current_user, movimiento.proyecto_id, RolColaborador.ARQUITECTO, RolColaborador.TRABAJADOR
    )
    try:
        return movimiento_service.registrar_movimiento(db, current_user.id_usuario, movimiento)
    except StockInsuficienteError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))


@router.get("/", response_model=List[KardexResponse])
def listar_movimientos(
    proyecto_id: Optional[int] = Query(None),
    material_id: Optional[int] = Query(None),
    skip: int = 0,
    limit: int = 100,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """TV-KDX-14: historial inmutable de movimientos, filtrable por proyecto y/o material."""
    if proyecto_id is not None:
        verificar_rol_proyecto(db, current_user, proyecto_id)
    return movimiento_service.listar_movimientos(db, proyecto_id, material_id, skip, limit)


@router.get("/inventario/{proyecto_id}", response_model=List[InventarioResponse])
def get_inventario_proyecto(
    proyecto_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Stock actual de cada material dentro de un proyecto puntual."""
    verificar_rol_proyecto(db, current_user, proyecto_id)
    return movimiento_service.listar_inventario_proyecto(db, proyecto_id)
