from typing import Optional

from sqlalchemy.orm import Session

from app.core.soft_delete import marcar_eliminado, restaurar, sin_eliminados
from app.models import Material
from app.schemas import MaterialCreate, MaterialUpdate


def listar_materiales(db: Session, incluir_eliminados: bool = False, skip: int = 0, limit: int = 100):
    query = db.query(Material)
    if not incluir_eliminados:
        query = sin_eliminados(query, Material)
    return query.offset(skip).limit(limit).all()


def obtener_material(db: Session, material_id: int, incluir_eliminados: bool = False) -> Optional[Material]:
    query = db.query(Material).filter(Material.id == material_id)
    if not incluir_eliminados:
        query = sin_eliminados(query, Material)
    return query.first()


def crear_material(db: Session, material: MaterialCreate) -> Material:
    nuevo_material = Material(**material.model_dump())
    db.add(nuevo_material)
    db.commit()
    db.refresh(nuevo_material)
    return nuevo_material


def actualizar_material(db: Session, material_id: int, datos: MaterialUpdate) -> Optional[Material]:
    material = obtener_material(db, material_id)
    if not material:
        return None

    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(material, campo, valor)

    db.commit()
    db.refresh(material)
    return material


def eliminar_material(db: Session, material_id: int) -> bool:
    """Soft delete: deja de listarse, pero el historial de movimientos que lo
    referencia sigue siendo consultable (no se pierde el kardex)."""
    material = obtener_material(db, material_id)
    if not material:
        return False

    marcar_eliminado(db, material)
    return True


def restaurar_material(db: Session, material_id: int) -> Optional[Material]:
    material = obtener_material(db, material_id, incluir_eliminados=True)
    if not material or material.fecha_eliminacion is None:
        return None

    restaurar(db, material)
    return material


def reabastecer_material(db: Session, material_id: int, cantidad: float) -> Optional[Material]:
    """Aumenta la cantidad disponible en bodega para este tipo de material."""
    material = obtener_material(db, material_id)
    if not material:
        return None

    material.stock_total = float(material.stock_total or 0.0) + float(cantidad)
    db.commit()
    db.refresh(material)
    return material


def obtener_resumen_inventario(db: Session):
    """Calcula para cada material: stock total registrado, colocado en proyectos y disponible en bodega."""
    from app.models import InventarioObra, ProyectoObra

    materiales = db.query(Material).filter(Material.fecha_eliminacion.is_(None)).order_by(Material.nombre_material).all()
    resultado = []

    for m in materiales:
        inventarios = (
            db.query(InventarioObra, ProyectoObra.nombre_proyecto)
            .join(ProyectoObra, InventarioObra.proyecto_id == ProyectoObra.id)
            .filter(
                InventarioObra.material_id == m.id,
                ProyectoObra.fecha_eliminacion.is_(None),
            )
            .all()
        )

        total_en_obras = sum(inv.InventarioObra.cantidad_disponible for inv in inventarios)
        stock_total = float(m.stock_total or 0.0)
        disponible_bodega = max(0.0, stock_total - total_en_obras)

        proyectos_detalle = [
            {
                "proyecto_id": inv.InventarioObra.proyecto_id,
                "proyecto_nombre": inv.nombre_proyecto,
                "cantidad": float(inv.InventarioObra.cantidad_disponible),
            }
            for inv in inventarios
            if inv.InventarioObra.cantidad_disponible > 0
        ]

        resultado.append({
            "id": m.id,
            "nombre_material": m.nombre_material,
            "unidad_medida": m.unidad_medida,
            "stock_total": stock_total,
            "cantidad_asignada_proyectos": total_en_obras,
            "stock_disponible_bodega": disponible_bodega,
            "proyectos_detalle": proyectos_detalle,
        })

    return resultado

