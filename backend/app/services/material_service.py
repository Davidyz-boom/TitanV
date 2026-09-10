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
