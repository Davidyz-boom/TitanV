import enum

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class TipoMovimiento(str, enum.Enum):
    ENTRADA = "Entrada"
    SALIDA = "Salida"
    AJUSTE = "Ajuste"


class Material(Base):
    __tablename__ = "materiales"

    id = Column(Integer, primary_key=True, index=True)
    nombre_material = Column(String(100), nullable=False)
    unidad_medida = Column(String(50), nullable=False)
    fecha_eliminacion = Column(DateTime, nullable=True, default=None)

    inventario = relationship("InventarioObra", back_populates="material", cascade="all, delete-orphan")
    historial_movimientos = relationship(
        "HistorialMovimiento", back_populates="material", cascade="all, delete-orphan"
    )


class InventarioObra(Base):
    __tablename__ = "inventario_obras"

    id = Column(Integer, primary_key=True, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos_obra.id", ondelete="CASCADE"), nullable=False)
    material_id = Column(Integer, ForeignKey("materiales.id", ondelete="CASCADE"), nullable=False)
    cantidad_disponible = Column(Float, nullable=False, default=0.0)

    __table_args__ = (UniqueConstraint("proyecto_id", "material_id", name="unique_material_por_proyecto"),)

    proyecto = relationship("ProyectoObra", back_populates="inventario")
    material = relationship("Material", back_populates="inventario")


class HistorialMovimiento(Base):
    __tablename__ = "historial_movimientos"

    id = Column(Integer, primary_key=True, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos_obra.id", ondelete="CASCADE"), nullable=False)
    material_id = Column(Integer, ForeignKey("materiales.id", ondelete="CASCADE"), nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"), nullable=False)
    tipo_movimiento = Column(String(50), nullable=False)
    cantidad = Column(Float, nullable=False)
    fecha_movimiento = Column(DateTime, server_default=func.now(), nullable=False)

    proyecto = relationship("ProyectoObra", back_populates="historial_movimientos")
    material = relationship("Material", back_populates="historial_movimientos")
    usuario = relationship("Usuario", back_populates="historial_movimientos")
