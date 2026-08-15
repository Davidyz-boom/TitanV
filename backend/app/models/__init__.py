"""
Reexporta todos los modelos para que el resto de la app pueda seguir
haciendo `from app.models import Usuario` sin importar de qué archivo
interno viene cada clase.
"""

from app.models.usuario_model import RolUsuario, Usuario
from app.models.proyecto_model import EstadoProyecto, ProyectoObra, Subcontratista
from app.models.material_model import HistorialMovimiento, InventarioObra, Material, TipoMovimiento
from app.models.tarea_model import Comentario, EstadoTarea, Tarea
from app.models.asistencia_model import TurnoRelevo
from app.models.reporte_model import ActaCampo, EvidenciaMultimedia

__all__ = [
    "Usuario",
    "RolUsuario",
    "ProyectoObra",
    "EstadoProyecto",
    "Subcontratista",
    "Material",
    "InventarioObra",
    "HistorialMovimiento",
    "TipoMovimiento",
    "Tarea",
    "Comentario",
    "EstadoTarea",
    "TurnoRelevo",
    "EvidenciaMultimedia",
    "ActaCampo",
]
