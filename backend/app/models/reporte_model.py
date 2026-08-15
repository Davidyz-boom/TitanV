from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class EvidenciaMultimedia(Base):
    __tablename__ = "evidencias_multimedia"

    id = Column(Integer, primary_key=True, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos_obra.id", ondelete="CASCADE"), nullable=False)
    ruta_archivo = Column(String(255), nullable=False)
    fecha_subida = Column(DateTime, server_default=func.now(), nullable=False)

    proyecto = relationship("ProyectoObra", back_populates="evidencias")


class ActaCampo(Base):
    __tablename__ = "actas_campo"

    id = Column(Integer, primary_key=True, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos_obra.id", ondelete="CASCADE"), nullable=False)
    fecha_generacion = Column(DateTime, server_default=func.now(), nullable=False)
    ruta_pdf = Column(String(255), nullable=False)
    firma_supervisor_url = Column(String(255), nullable=True)
    firma_operario_url = Column(String(255), nullable=True)
    coordenadas_gps = Column(String(100), nullable=True)
    marca_agua_timestamp = Column(String(100), nullable=True)

    proyecto = relationship("ProyectoObra", back_populates="actas_campo")
