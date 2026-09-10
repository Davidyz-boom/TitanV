from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.models import EstadoTarea


class ComentarioCreate(BaseModel):
    """TV-CMT-06: Validación estricta de un máximo de 300 caracteres."""

    contenido: str = Field(..., min_length=1, max_length=300, example="Corrección: Ajustar el nivelado.")
    tarea_id: Optional[int] = None
    multimedia_id: Optional[int] = None


class ComentarioResponse(BaseModel):
    id: int
    contenido: str
    fecha_comentario: datetime
    usuario_id: int

    class Config:
        from_attributes = True


class TareaBase(BaseModel):
    nombre_tarea: str = Field(..., max_length=150)
    descripcion: Optional[str] = ""
    estado: EstadoTarea = EstadoTarea.PENDIENTE


class TareaCreate(TareaBase):
    proyecto_id: int = 1
    usuario_id: Optional[int] = 1  # ID del operario asignado (opcional si aún no hay usuarios)


class TareaUpdate(BaseModel):
    nombre_tarea: Optional[str] = Field(None, max_length=150)
    descripcion: Optional[str] = None
    estado: Optional[EstadoTarea] = None
    usuario_id: Optional[int] = None


class TareaResponse(TareaBase):
    id: int
    fecha_asignacion: Optional[date] = None
    proyecto_id: int
    usuario_id: Optional[int] = None
    comentarios: List[ComentarioResponse] = []

    class Config:
        from_attributes = True

