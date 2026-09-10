import enum
from datetime import datetime

from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class EstadoProyecto(str, enum.Enum):
    PLANIFICACION = "Planificación"
    EN_EJECUCION = "En Ejecución"
    FINALIZADO = "Finalizado"


class ProyectoObra(Base):
    __tablename__ = "proyectos_obra"

    id = Column(Integer, primary_key=True, index=True)
    nombre_proyecto = Column(String(150), nullable=False)
    ubicacion_direccion = Column(String(255), nullable=False)
    estado = Column(String(50), nullable=False)
    fecha_inicio = Column(Date, nullable=False)
    fecha_fin_estimada = Column(Date, nullable=False)

    # Soft delete: si tiene fecha, está "eliminado" pero sigue en la base de
    # datos para poder auditarlo. Nunca se borra físicamente desde la app.
    fecha_eliminacion = Column(DateTime, nullable=True, default=None)

    # Relaciones
    tareas = relationship("Tarea", back_populates="proyecto", cascade="all, delete-orphan")
    inventario = relationship("InventarioObra", back_populates="proyecto", cascade="all, delete-orphan")
    turnos_relevos = relationship("TurnoRelevo", back_populates="proyecto", cascade="all, delete-orphan")
    historial_movimientos = relationship(
        "HistorialMovimiento", back_populates="proyecto", cascade="all, delete-orphan"
    )
    evidencias = relationship("EvidenciaMultimedia", back_populates="proyecto", cascade="all, delete-orphan")
    actas_campo = relationship("ActaCampo", back_populates="proyecto", cascade="all, delete-orphan")
    colaboradores = relationship("ProyectoColaborador", back_populates="proyecto", cascade="all, delete-orphan")
