from sqlalchemy import Column, Date, ForeignKey, Integer, String, Time
from sqlalchemy.orm import relationship

from app.core.database import Base


class TurnoRelevo(Base):
    __tablename__ = "turnos_relevos"

    id = Column(Integer, primary_key=True, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos_obra.id", ondelete="CASCADE"), nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"), nullable=False)
    fecha_turno = Column(Date, nullable=False)
    hora_inicio = Column(Time, nullable=False)
    hora_fin = Column(Time, nullable=False)
    estado_asistencia = Column(String(50), nullable=False)

    proyecto = relationship("ProyectoObra", back_populates="turnos_relevos")
    usuario = relationship("Usuario", back_populates="turnos_relevos")
