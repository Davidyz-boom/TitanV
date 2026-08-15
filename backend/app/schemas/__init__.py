"""
Reexporta todos los esquemas de Pydantic para mantener compatibilidad con
`from app.schemas import X` en cualquier parte de la app.
"""

from app.schemas.usuario_schema import (
    UsuarioBase,
    UsuarioCreate,
    UsuarioLogin,
    UsuarioResponse,
    UsuarioUpdate,
)
from app.schemas.proyecto_schema import (
    ProyectoBase,
    ProyectoCreate,
    ProyectoResponse,
    ProyectoUpdate,
    SubcontratistaBase,
    SubcontratistaCreate,
    SubcontratistaResponse,
    SubcontratistaUpdate,
)
from app.schemas.material_schema import (
    InventarioResponse,
    KardexResponse,
    MaterialBase,
    MaterialCreate,
    MaterialResponse,
    MaterialUpdate,
    RegistroMovimiento,
)
from app.schemas.tarea_schema import (
    ComentarioCreate,
    ComentarioResponse,
    TareaBase,
    TareaCreate,
    TareaResponse,
    TareaUpdate,
)
from app.schemas.asistencia_schema import (
    TurnoBase,
    TurnoCreate,
    TurnoResponse,
    TurnoUpdate,
)

__all__ = [
    "UsuarioBase", "UsuarioCreate", "UsuarioUpdate", "UsuarioResponse", "UsuarioLogin",
    "ProyectoBase", "ProyectoCreate", "ProyectoUpdate", "ProyectoResponse",
    "SubcontratistaBase", "SubcontratistaCreate", "SubcontratistaResponse", "SubcontratistaUpdate",
    "MaterialBase", "MaterialCreate", "MaterialUpdate", "MaterialResponse",
    "RegistroMovimiento", "KardexResponse", "InventarioResponse",
    "ComentarioCreate", "ComentarioResponse",
    "TareaBase", "TareaCreate", "TareaUpdate", "TareaResponse",
    "TurnoBase", "TurnoCreate", "TurnoUpdate", "TurnoResponse",
]
