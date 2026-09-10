import enum
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class RolProyecto(str, enum.Enum):
    """Rol de una persona DENTRO de un proyecto puntual — no es el rol global de su cuenta.

    La misma persona puede ser ARQUITECTO en un proyecto y estar invitada como
    TRABAJADOR en otro.
    """

    ARQUITECTO = "Arquitecto"
    TRABAJADOR = "Trabajador"
    VISUALIZADOR = "Visualizador"


class ProyectoColaborador(Base):
    """Tabla puente: quién participa en qué proyecto, y con qué rol."""

    __tablename__ = "proyecto_colaboradores"

    id = Column(Integer, primary_key=True, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos_obra.id", ondelete="CASCADE"), nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"), nullable=False)
    rol = Column(String(50), nullable=False, default=RolProyecto.TRABAJADOR.value)
    fecha_vinculacion = Column(DateTime, server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("proyecto_id", "usuario_id", name="unique_colaborador_por_proyecto"),
    )

    proyecto = relationship("ProyectoObra", back_populates="colaboradores")
    usuario = relationship("Usuario", back_populates="proyectos_colaborador")
