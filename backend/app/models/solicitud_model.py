import enum
from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class EstadoSolicitud(str, enum.Enum):
    PENDIENTE = "Pendiente"
    APROBADA = "Aprobada"
    RECHAZADA = "Rechazada"
    ENTREGADA = "Entregada"


class SolicitudMaterial(Base):
    __tablename__ = "solicitudes_materiales"

    id = Column(Integer, primary_key=True, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos_obra.id", ondelete="CASCADE"), nullable=False)
    material_id = Column(Integer, ForeignKey("materiales.id", ondelete="CASCADE"), nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"), nullable=False)
    cantidad = Column(Float, nullable=False)
    estado = Column(String(50), nullable=False, default=EstadoSolicitud.PENDIENTE.value)
    fecha_solicitud = Column(DateTime, server_default=func.now(), nullable=False)
    fecha_actualizacion = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    proyecto = relationship("ProyectoObra", back_populates="solicitudes_materiales")
    material = relationship("Material", back_populates="solicitudes")
    usuario = relationship("Usuario", back_populates="solicitudes_materiales")
