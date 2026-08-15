from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models import TipoMovimiento


class MaterialBase(BaseModel):
    nombre_material: str = Field(..., max_length=100, example="Cemento Gris ARGOS")
    unidad_medida: str = Field(..., max_length=20, example="Bultos")


class MaterialCreate(MaterialBase):
    """Esquema para registrar un nuevo tipo de material en el sistema."""

    pass


class MaterialUpdate(BaseModel):
    """No existía: el PUT usaba MaterialCreate y obligaba a reenviar todos los campos."""

    nombre_material: Optional[str] = Field(None, max_length=100)
    unidad_medida: Optional[str] = Field(None, max_length=20)


class MaterialResponse(MaterialBase):
    id: int

    class Config:
        from_attributes = True


class RegistroMovimiento(BaseModel):
    """TV-MAT-03 y TV-OUT-13: Carga para entradas y salidas."""

    material_id: int
    proyecto_id: int
    tipo_movimiento: TipoMovimiento
    cantidad: float = Field(..., gt=0, description="La cantidad debe ser mayor a cero")


class InventarioResponse(BaseModel):
    """Stock disponible de un material dentro de un proyecto puntual."""

    proyecto_id: int
    material_id: int
    cantidad_disponible: float

    class Config:
        from_attributes = True


class KardexResponse(BaseModel):
    """TV-KDX-14: Formato de salida inmutable para auditorías."""

    id: int
    proyecto_id: int
    material_id: int
    usuario_id: int
    tipo_movimiento: TipoMovimiento
    cantidad: float
    fecha_movimiento: datetime

    class Config:
        from_attributes = True
