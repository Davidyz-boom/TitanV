from typing import Optional

from sqlalchemy.orm import Session

from app.models import EstadoSolicitud, Material, SolicitudMaterial, Usuario
from app.services import movimiento_service
from app.schemas import RegistroMovimiento, SolicitudMaterialCreate


_TRANSICIONES = {
    EstadoSolicitud.PENDIENTE: {EstadoSolicitud.APROBADA, EstadoSolicitud.RECHAZADA},
    EstadoSolicitud.APROBADA: {EstadoSolicitud.ENTREGADA, EstadoSolicitud.RECHAZADA},
    EstadoSolicitud.RECHAZADA: set(),
    EstadoSolicitud.ENTREGADA: set(),
}


def listar_solicitudes(db: Session, proyecto_id: int, estado: Optional[EstadoSolicitud] = None):
    query = db.query(SolicitudMaterial).filter(SolicitudMaterial.proyecto_id == proyecto_id)
    if estado:
        query = query.filter(SolicitudMaterial.estado == estado.value)
    return query.order_by(SolicitudMaterial.fecha_solicitud.desc()).all()


def obtener_solicitud(db: Session, solicitud_id: int) -> Optional[SolicitudMaterial]:
    return db.query(SolicitudMaterial).filter(SolicitudMaterial.id == solicitud_id).first()


def crear_solicitud(db: Session, usuario_id: int, datos: SolicitudMaterialCreate) -> SolicitudMaterial:
    material = (
        db.query(Material)
        .filter(Material.id == datos.material_id, Material.proyecto_id == datos.proyecto_id, Material.fecha_eliminacion.is_(None))
        .first()
    )
    if not material:
        raise ValueError("El material no existe o no pertenece al proyecto seleccionado.")

    solicitud = SolicitudMaterial(
        proyecto_id=datos.proyecto_id,
        material_id=datos.material_id,
        usuario_id=usuario_id,
        cantidad=datos.cantidad,
        estado=EstadoSolicitud.PENDIENTE.value,
    )
    db.add(solicitud)
    db.commit()
    db.refresh(solicitud)
    return solicitud


def actualizar_estado(db: Session, solicitud_id: int, nuevo_estado: EstadoSolicitud, usuario_id: int) -> SolicitudMaterial:
    solicitud = obtener_solicitud(db, solicitud_id)
    if not solicitud:
        raise ValueError("Solicitud no encontrada.")

    estado_actual = EstadoSolicitud(solicitud.estado)
    if nuevo_estado not in _TRANSICIONES[estado_actual]:
        raise ValueError(f"No se puede pasar una solicitud de '{estado_actual.value}' a '{nuevo_estado.value}'.")

    if nuevo_estado == EstadoSolicitud.ENTREGADA:
        # Reutiliza la única lógica de inventario/kardex existente. No se duplica
        # la validación de stock ni el registro del movimiento aquí.
        movimiento_service.registrar_movimiento(
            db,
            usuario_id,
            RegistroMovimiento(
                proyecto_id=solicitud.proyecto_id,
                material_id=solicitud.material_id,
                tipo_movimiento="Salida",
                cantidad=solicitud.cantidad,
            ),
            commit=False,
        )

    solicitud.estado = nuevo_estado.value
    db.commit()
    db.refresh(solicitud)
    return solicitud
