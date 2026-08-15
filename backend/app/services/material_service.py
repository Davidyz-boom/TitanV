from typing import Optional

from sqlalchemy.orm import Session

from app.models import Material
from app.schemas import MaterialCreate, MaterialUpdate


def listar_materiales(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Material).offset(skip).limit(limit).all()


def obtener_material(db: Session, material_id: int) -> Optional[Material]:
    return db.query(Material).filter(Material.id == material_id).first()


def crear_material(db: Session, material: MaterialCreate) -> Material:
    nuevo_material = Material(**material.model_dump())
    db.add(nuevo_material)
    db.commit()
    db.refresh(nuevo_material)
    return nuevo_material


def actualizar_material(db: Session, material_id: int, datos: MaterialUpdate) -> Optional[Material]:
    material_query = db.query(Material).filter(Material.id == material_id)
    material = material_query.first()
    if not material:
        return None

    material_query.update(datos.model_dump(exclude_unset=True), synchronize_session=False)
    db.commit()
    return material_query.first()


def eliminar_material(db: Session, material_id: int) -> bool:
    material_query = db.query(Material).filter(Material.id == material_id)
    if not material_query.first():
        return False

    material_query.delete(synchronize_session=False)
    db.commit()
    return True
