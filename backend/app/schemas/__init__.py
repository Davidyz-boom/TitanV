"""
Reexporta todos los esquemas de Pydantic para mantener compatibilidad con
`from app.schemas import X` en cualquier parte de la app.
"""

from app.schemas.usuario_schema import (
    GoogleAuthRequest,
    TokenResponse,
    UsuarioBase,
    UsuarioCreate,
    UsuarioLogin,
    UsuarioResponse,
    UsuarioUpdate,
)
from app.schemas.colaborador_schema import (
    ColaboradorCreate,
    ColaboradorInvitar,
    ColaboradorResponse,
    ColaboradorUpdate,
)
from app.schemas.proyecto_schema import (
    ProyectoBase,
    ProyectoCreate,
    ProyectoResponse,
    ProyectoUpdate,
)
from app.schemas.material_schema import (
    AsignarMaterialProyecto,
    InventarioResponse,
    KardexResponse,
    MaterialBase,
    MaterialCreate,
    MaterialReabastecer,
    MaterialResponse,
    MaterialUpdate,
    ProyectoDetalleMaterial,
    RegistroMovimiento,
    ResumenInventarioItem,
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
from app.schemas.reporte_schema import EvidenciaResponse

__all__ = [
    "UsuarioBase", "UsuarioCreate", "UsuarioUpdate", "UsuarioResponse", "UsuarioLogin", "TokenResponse", "GoogleAuthRequest",
    "ColaboradorCreate", "ColaboradorInvitar", "ColaboradorUpdate", "ColaboradorResponse",
    "ProyectoBase", "ProyectoCreate", "ProyectoUpdate", "ProyectoResponse",
    "MaterialBase", "MaterialCreate", "MaterialUpdate", "MaterialResponse",
    "RegistroMovimiento", "KardexResponse", "InventarioResponse",
    "ComentarioCreate", "ComentarioResponse",
    "TareaBase", "TareaCreate", "TareaUpdate", "TareaResponse",
    "TurnoBase", "TurnoCreate", "TurnoUpdate", "TurnoResponse",
    "EvidenciaResponse",
]