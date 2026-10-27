from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models import TipoMovimiento


class MaterialBase(BaseModel):
    nombre_material: str = Field(
        ...,
        max_length=100,
        example="Cemento Gris ARGOS"
    )
    unidad_medida: str = Field(
        ...,
        max_length=20,
        example="Bultos"
    )


class MaterialCreate(MaterialBase):
    """Datos para crear un material dentro de un proyecto."""

    proyecto_id: int

    cantidad_inicial: float = Field(
        default=0,
        ge=0,
        description="Cantidad inicial que se registrará en el inventario"
    )


class MaterialUpdate(BaseModel):
    """Datos opcionales para editar un material."""

    nombre_material: Optional[str] = Field(
        None,
        max_length=100
    )
    unidad_medida: Optional[str] = Field(
        None,
        max_length=20
    )


class MaterialResponse(MaterialBase):
    id: int
    proyecto_id: Optional[int] = None
    cantidad_inicial: float = 0
    cantidad_disponible: float = 0

    class Config:
        from_attributes = True


class RegistroMovimiento(BaseModel):
    """TV-MAT-03 y TV-OUT-13: Carga para entradas y salidas."""

    material_id: int
    proyecto_id: int
    tipo_movimiento: TipoMovimiento
    cantidad: float = Field(
        ...,
        gt=0,
        description="La cantidad debe ser mayor a cero"
    )


class InventarioResponse(BaseModel):
    """Stock disponible de un material dentro de un proyecto puntual."""

    proyecto_id: int
    material_id: int
    cantidad_disponible: float
    material_nombre: Optional[str] = None
    unidad_medida: Optional[str] = None

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
    material_nombre: Optional[str] = None
    unidad_medida: Optional[str] = None
    usuario_nombre: Optional[str] = None
    proyecto_nombre: Optional[str] = None

    class Config:
        from_attributes = True
