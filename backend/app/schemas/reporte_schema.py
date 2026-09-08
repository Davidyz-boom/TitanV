from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class EvidenciaResponse(BaseModel):
    id: int
    proyecto_id: int
    usuario_id: int
    nombre_archivo: str
    ruta_archivo: str
    descripcion: Optional[str] = None
    fecha_subida: datetime

    class Config:
        from_attributes = True
