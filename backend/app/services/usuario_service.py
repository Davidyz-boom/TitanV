from typing import Optional

from sqlalchemy.orm import Session

from app.models import Usuario
from app.schemas import UsuarioCreate, UsuarioUpdate
from app.services import auth_service


def adaptar_usuario_a_schema(usuario_db: Usuario) -> Usuario:
    """Adapta el objeto de la base de datos para que encaje con lo que espera UsuarioResponse."""
    usuario_db.id = usuario_db.id_usuario
    usuario_db.nombre_completo = f"{usuario_db.nombres} {usuario_db.apellidos}".strip()
    return usuario_db


def listar_usuarios(db: Session, skip: int = 0, limit: int = 100):
    usuarios_db = db.query(Usuario).offset(skip).limit(limit).all()
    return [adaptar_usuario_a_schema(u) for u in usuarios_db]


def obtener_usuario(db: Session, usuario_id: int) -> Optional[Usuario]:
    usuario = db.query(Usuario).filter(Usuario.id_usuario == usuario_id).first()
    return adaptar_usuario_a_schema(usuario) if usuario else None


def correo_registrado(db: Session, correo: str) -> bool:
    return db.query(Usuario).filter(Usuario.correo_electronico == correo).first() is not None


def crear_usuario(db: Session, usuario: UsuarioCreate) -> Usuario:
    partes_nombre = usuario.nombre_completo.split(" ", 1)
    nombres_db = partes_nombre[0]
    apellidos_db = partes_nombre[1] if len(partes_nombre) > 1 else ""

    nuevo_usuario = Usuario(
        nombres=nombres_db,
        apellidos=apellidos_db,
        correo_electronico=usuario.correo_electronico,
        rol=usuario.rol.value if hasattr(usuario.rol, "value") else usuario.rol,
        contrasena_encriptada=auth_service.hashear_contrasena(usuario.contrasena),
        fecha_vencimiento_licencia=usuario.fecha_vencimiento_licencia,
        tiene_certificacion_maquinaria=usuario.tiene_certificacion_maquinaria,
    )

    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return adaptar_usuario_a_schema(nuevo_usuario)


def actualizar_usuario(db: Session, usuario_id: int, datos: UsuarioUpdate) -> Optional[Usuario]:
    usuario = db.query(Usuario).filter(Usuario.id_usuario == usuario_id).first()
    if not usuario:
        return None

    if datos.nombre_completo:
        partes = datos.nombre_completo.split(" ", 1)
        usuario.nombres = partes[0]
        usuario.apellidos = partes[1] if len(partes) > 1 else ""

    if datos.rol is not None:
        usuario.rol = datos.rol.value if hasattr(datos.rol, "value") else datos.rol

    if datos.activo is not None:
        usuario.activo = datos.activo

    if datos.fecha_vencimiento_licencia is not None:
        usuario.fecha_vencimiento_licencia = datos.fecha_vencimiento_licencia

    if datos.tiene_certificacion_maquinaria is not None:
        usuario.tiene_certificacion_maquinaria = datos.tiene_certificacion_maquinaria

    db.commit()
    db.refresh(usuario)
    return adaptar_usuario_a_schema(usuario)


def eliminar_usuario(db: Session, usuario_id: int) -> bool:
    """No borra al usuario de verdad: lo desactiva (activo=False).

    Antes esto hacía un DELETE real, lo que además arrastraba en cascada sus
    tareas, comentarios, turnos e historial de movimientos (por las FK con
    ondelete=CASCADE) — se perdía todo ese historial sin poder recuperarlo.
    """
    usuario = db.query(Usuario).filter(Usuario.id_usuario == usuario_id).first()
    if not usuario:
        return False

    usuario.activo = False
    db.commit()
    return True


def restaurar_usuario(db: Session, usuario_id: int) -> Optional[Usuario]:
    usuario = db.query(Usuario).filter(Usuario.id_usuario == usuario_id).first()
    if not usuario or usuario.activo:
        return None

    usuario.activo = True
    db.commit()
    db.refresh(usuario)
    return adaptar_usuario_a_schema(usuario)
