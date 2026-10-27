"""
Reexporta todos los esquemas de Pydantic para mantener compatibilidad con
`from app.schemas import X` en cualquier parte de la app.
"""

from app.schemas.usuario_schema import (
    ForgotPasswordRequest,
    GoogleAuthRequest,
    ResetPasswordRequest,
    TokenResponse,
    UsuarioBase,
    UsuarioCreate,
    UsuarioLogin,
    UsuarioResponse,
    UsuarioUpdate,
    VerifyPinRequest,
)
from app.schemas.colaborador_schema import (
    ColaboradorCreate,
    ColaboradorInvitar,
    ColaboradorResponse,
    ColaboradorUpdate,
    InvitacionCorreoResponse,
)
from app.schemas.proyecto_schema import (
    ProyectoBase,
    ProyectoCreate,
    ProyectoResponse,
    ProyectoUpdate,
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
from app.schemas.reporte_schema import EvidenciaResponse
from app.schemas.solicitud_schema import SolicitudMaterialCreate, SolicitudMaterialResponse, SolicitudMaterialUpdate
from app.schemas.invitacion_schema import (
    AceptarInvitacionResponse,
    EnlaceInvitacionCreate,
    EnlaceInvitacionResponse,
)

__all__ = [
    "UsuarioBase", "UsuarioCreate", "UsuarioUpdate", "UsuarioResponse", "UsuarioLogin", "TokenResponse", "GoogleAuthRequest",
    "ForgotPasswordRequest", "VerifyPinRequest", "ResetPasswordRequest",
    "ColaboradorCreate", "ColaboradorInvitar", "ColaboradorUpdate", "ColaboradorResponse",
    "InvitacionCorreoResponse",
    "ProyectoBase", "ProyectoCreate", "ProyectoUpdate", "ProyectoResponse",
    "MaterialBase", "MaterialCreate", "MaterialUpdate", "MaterialResponse",
    "RegistroMovimiento", "KardexResponse", "InventarioResponse",
    "ComentarioCreate", "ComentarioResponse",
    "TareaBase", "TareaCreate", "TareaUpdate", "TareaResponse",
    "TurnoBase", "TurnoCreate", "TurnoUpdate", "TurnoResponse",
    "EvidenciaResponse",
    "EnlaceInvitacionCreate", "EnlaceInvitacionResponse", "AceptarInvitacionResponse",
    "SolicitudMaterialCreate", "SolicitudMaterialUpdate", "SolicitudMaterialResponse",
]