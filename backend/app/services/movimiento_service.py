from typing import Optional

from sqlalchemy.orm import Session

from app.models import HistorialMovimiento, InventarioObra, TipoMovimiento
from app.schemas import RegistroMovimiento


class StockInsuficienteError(Exception):
    """Se intentó registrar una salida mayor al stock disponible."""


def _obtener_o_crear_inventario(db: Session, proyecto_id: int, material_id: int) -> InventarioObra:
    inventario = (
        db.query(InventarioObra)
        .filter(InventarioObra.proyecto_id == proyecto_id, InventarioObra.material_id == material_id)
        .first()
    )
    if not inventario:
        inventario = InventarioObra(proyecto_id=proyecto_id, material_id=material_id, cantidad_disponible=0.0)
        db.add(inventario)
        db.flush()  # para tener el registro disponible sin cerrar la transacción
    return inventario


def registrar_movimiento(db: Session, usuario_id: int, movimiento: RegistroMovimiento) -> HistorialMovimiento:
    """
    TV-MAT-03 / TV-OUT-13: registra una entrada o salida de material y actualiza
    el stock disponible (InventarioObra) de forma atómica junto con el kardex.
    """
    inventario = _obtener_o_crear_inventario(db, movimiento.proyecto_id, movimiento.material_id)

    if movimiento.tipo_movimiento == TipoMovimiento.SALIDA:
        if inventario.cantidad_disponible < movimiento.cantidad:
            raise StockInsuficienteError(
                f"Stock insuficiente: disponible {inventario.cantidad_disponible}, "
                f"solicitado {movimiento.cantidad}"
            )
        inventario.cantidad_disponible -= movimiento.cantidad
    else:  # ENTRADA o AJUSTE positivo
        inventario.cantidad_disponible += movimiento.cantidad

    registro = HistorialMovimiento(
        proyecto_id=movimiento.proyecto_id,
        material_id=movimiento.material_id,
        usuario_id=usuario_id,
        tipo_movimiento=movimiento.tipo_movimiento.value,
        cantidad=movimiento.cantidad,
    )
    db.add(registro)
    db.commit()
    db.refresh(registro)
    return registro


def listar_movimientos(
    db: Session,
    proyecto_id: Optional[int] = None,
    material_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
):
    query = db.query(HistorialMovimiento)
    if proyecto_id is not None:
        query = query.filter(HistorialMovimiento.proyecto_id == proyecto_id)
    if material_id is not None:
        query = query.filter(HistorialMovimiento.material_id == material_id)
    return query.order_by(HistorialMovimiento.fecha_movimiento.desc()).offset(skip).limit(limit).all()


def listar_inventario_proyecto(db: Session, proyecto_id: int):
    return db.query(InventarioObra).filter(InventarioObra.proyecto_id == proyecto_id).all()
