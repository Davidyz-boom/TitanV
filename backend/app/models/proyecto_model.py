import enum

from sqlalchemy import Column, Date, ForeignKey, Integer, String
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

    # Relaciones
    tareas = relationship("Tarea", back_populates="proyecto", cascade="all, delete-orphan")
    inventario = relationship("InventarioObra", back_populates="proyecto", cascade="all, delete-orphan")
    turnos_relevos = relationship("TurnoRelevo", back_populates="proyecto", cascade="all, delete-orphan")
    historial_movimientos = relationship(
        "HistorialMovimiento", back_populates="proyecto", cascade="all, delete-orphan"
    )
    evidencias = relationship("EvidenciaMultimedia", back_populates="proyecto", cascade="all, delete-orphan")
    actas_campo = relationship("ActaCampo", back_populates="proyecto", cascade="all, delete-orphan")
    subcontratistas = relationship("Subcontratista", back_populates="proyecto", cascade="all, delete-orphan")


class Subcontratista(Base):
    """No existía como modelo, aunque schemas.py ya tenía SubcontratistaBase/Create/Response."""

    __tablename__ = "subcontratistas"

    id = Column(Integer, primary_key=True, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos_obra.id", ondelete="CASCADE"), nullable=False)
    nombre_empresa = Column(String(150), nullable=False)
    nit = Column(String(50), nullable=False)
    fecha_vencimiento_poliza = Column(Date, nullable=False)
    fecha_vencimiento_ss = Column(Date, nullable=False)
    estado = Column(String(50), nullable=False, default="Autorizado")

    proyecto = relationship("ProyectoObra", back_populates="subcontratistas")
