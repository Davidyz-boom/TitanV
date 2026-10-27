import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


def _generar_token() -> str:
    return secrets.token_urlsafe(24)


def _expiracion_por_defecto() -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=7)


class EnlaceInvitacion(Base):
    """Un link que el Arquitecto genera con un rol ya decidido (como en Canva):
    quien lo abre y entra a Titan V queda vinculado al proyecto con ese rol,
    sin que el Arquitecto tenga que saber su correo de antemano."""

    __tablename__ = "enlaces_invitacion"

    id = Column(Integer, primary_key=True, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos_obra.id", ondelete="CASCADE"), nullable=False)
    creado_por_id = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"), nullable=False)
    rol = Column(String(50), nullable=False)
    token = Column(String(64), unique=True, index=True, nullable=False, default=_generar_token)
    fecha_creacion = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    fecha_expiracion = Column(DateTime, default=_expiracion_por_defecto, nullable=False)
    activo = Column(Boolean, default=True, nullable=False)

    proyecto = relationship("ProyectoObra")
    creado_por = relationship("Usuario")
