from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.models import TipoMovimiento


class MaterialBase(BaseModel):
    nombre_material: str = Field(..., max_length=100, example="Cemento Gris ARGOS")
    unidad_medida: str = Field(..., max_length=50, example="Bultos")
    stock_total: float = Field(default=0.0, ge=0, example=100.0)


class MaterialCreate(MaterialBase):
    """Esquema para registrar un nuevo tipo de material en el sistema con stock inicial."""

    pass


class MaterialUpdate(BaseModel):
    nombre_material: Optional[str] = Field(None, max_length=100)
    unidad_medida: Optional[str] = Field(None, max_length=50)
    stock_total: Optional[float] = Field(None, ge=0)


class MaterialReabastecer(BaseModel):
    """TV-MAT-REABASTECER: Aumenta la cantidad física disponible en el catálogo."""

    cantidad: float = Field(..., gt=0, description="Cantidad a agregar al stock del material")


class ProyectoDetalleMaterial(BaseModel):
    proyecto_id: int
    proyecto_nombre: str
    cantidad: float


class ResumenInventarioItem(BaseModel):
    id: int
    nombre_material: str
    unidad_medida: str
    stock_total: float
    cantidad_asignada_proyectos: float
    stock_disponible_bodega: float
    proyectos_detalle: List[ProyectoDetalleMaterial] = []


class AsignarMaterialProyecto(BaseModel):
    material_id: int
    cantidad: float = Field(..., gt=0, description="Cantidad requerida para la obra")


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
