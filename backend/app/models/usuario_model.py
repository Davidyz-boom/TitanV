import enum

from sqlalchemy import Boolean, Column, Date, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class RolUsuario(int, enum.Enum):
    ADMIN = 1
    SUPERVISOR = 2
    OPERARIO = 3


class Usuario(Base):
    __tablename__ = "usuarios"

    id_usuario = Column(Integer, primary_key=True, index=True)
    nombres = Column(String(100), nullable=False)
    apellidos = Column(String(100), nullable=False)
    correo_electronico = Column(String(150), unique=True, nullable=False)
    contrasena_encriptada = Column(String(255), nullable=False)
    rol = Column(Integer, nullable=False)
    intentos_fallidos = Column(Integer, default=0)
    activo = Column(Boolean, default=True)
    fecha_vencimiento_licencia = Column(Date, nullable=True)
    tiene_certificacion_maquinaria = Column(Boolean, default=False)

    # Relaciones inversas
    comentarios = relationship("Comentario", back_populates="usuario", cascade="all, delete-orphan")
    turnos_relevos = relationship("TurnoRelevo", back_populates="usuario", cascade="all, delete-orphan")
    historial_movimientos = relationship(
        "HistorialMovimiento", back_populates="usuario", cascade="all, delete-orphan"
    )
    tareas = relationship("Tarea", back_populates="operario")
    proyectos_colaborador = relationship(
        "ProyectoColaborador", back_populates="usuario", cascade="all, delete-orphan"
    )
