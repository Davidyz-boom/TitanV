import enum

from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class EstadoTarea(str, enum.Enum):
    PENDIENTE = "Pendiente"
    EN_PROCESO = "En Proceso"
    COMPLETADA = "Completada"


class Tarea(Base):
    __tablename__ = "tareas"

    id = Column(Integer, primary_key=True, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos_obra.id", ondelete="CASCADE"), nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="SET NULL"), nullable=True)
    nombre_tarea = Column(String(150), nullable=False)
    descripcion = Column(Text, nullable=True)
    estado = Column(String(50), nullable=False)
    fecha_inicio = Column(Date, nullable=True)
    fecha_fin_estimada = Column(Date, nullable=True)
    fecha_asignacion = Column(Date, server_default=func.current_date())

    proyecto = relationship("ProyectoObra", back_populates="tareas")
    operario = relationship("Usuario", back_populates="tareas")
    comentarios = relationship("Comentario", back_populates="tarea", cascade="all, delete-orphan")


class Comentario(Base):
    __tablename__ = "comentarios"

    id = Column(Integer, primary_key=True, index=True)
    tarea_id = Column(Integer, ForeignKey("tareas.id", ondelete="CASCADE"), nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"), nullable=False)
    contenido = Column(Text, nullable=False)
    fecha_comentario = Column(DateTime, server_default=func.now(), nullable=False)

    tarea = relationship("Tarea", back_populates="comentarios")
    usuario = relationship("Usuario", back_populates="comentarios")
