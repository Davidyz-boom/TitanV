from typing import List, Optional

from sqlalchemy.orm import Session

from app.models import ProyectoColaborador, RolProyecto
from app.schemas import ColaboradorUpdate


def _adaptar(colaborador: ProyectoColaborador) -> ProyectoColaborador:
    """Agrega nombre/correo del usuario 'aplanados' para que el frontend no tenga
    que hacer una segunda llamada solo para mostrar quién es cada colaborador."""
    colaborador.usuario_nombre = f"{colaborador.usuario.nombres} {colaborador.usuario.apellidos}".strip()
    colaborador.usuario_correo = colaborador.usuario.correo_electronico
    return colaborador


def proyectos_de_usuario(db: Session, usuario_id: int) -> List[int]:
    """Ids de los proyectos donde el usuario participa como colaborador. Un
    usuario SOLO debe ver y tocar datos de estos proyectos."""
    filas = (
        db.query(ProyectoColaborador.proyecto_id)
        .filter(ProyectoColaborador.usuario_id == usuario_id)
        .all()
    )
    return [fila[0] for fila in filas]


def listar_colaboradores(db: Session, proyecto_id: int) -> List[ProyectoColaborador]:
    colaboradores = (
        db.query(ProyectoColaborador).filter(ProyectoColaborador.proyecto_id == proyecto_id).all()
    )
    return [_adaptar(c) for c in colaboradores]


def obtener_colaborador(db: Session, proyecto_id: int, colaborador_id: int) -> Optional[ProyectoColaborador]:
    colaborador = (
        db.query(ProyectoColaborador)
        .filter(ProyectoColaborador.id == colaborador_id, ProyectoColaborador.proyecto_id == proyecto_id)
        .first()
    )
    return _adaptar(colaborador) if colaborador else None


def obtener_rol_de_usuario(db: Session, proyecto_id: int, usuario_id: int) -> Optional[RolProyecto]:
    """Para más adelante: consultar con qué rol participa (o no) un usuario en un proyecto."""
    colaborador = (
        db.query(ProyectoColaborador)
        .filter(ProyectoColaborador.proyecto_id == proyecto_id, ProyectoColaborador.usuario_id == usuario_id)
        .first()
    )
    return RolProyecto(colaborador.rol) if colaborador else None


def agregar_arquitecto(db: Session, proyecto_id: int, usuario_id: int) -> ProyectoColaborador:
    """Se llama automáticamente al crear un proyecto: quien lo crea queda como Arquitecto."""
    nuevo = ProyectoColaborador(proyecto_id=proyecto_id, usuario_id=usuario_id, rol=RolProyecto.ARQUITECTO.value)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return _adaptar(nuevo)


def actualizar_rol(
    db: Session, proyecto_id: int, colaborador_id: int, datos: ColaboradorUpdate
) -> Optional[ProyectoColaborador]:
    colaborador = (
        db.query(ProyectoColaborador)
        .filter(ProyectoColaborador.id == colaborador_id, ProyectoColaborador.proyecto_id == proyecto_id)
        .first()
    )
    if not colaborador:
        return None

    if colaborador.rol == RolProyecto.ARQUITECTO.value and datos.rol != RolProyecto.ARQUITECTO:
        _validar_no_es_ultimo_arquitecto(db, proyecto_id, colaborador_id)

    colaborador.rol = datos.rol.value
    db.commit()
    db.refresh(colaborador)
    return _adaptar(colaborador)


def eliminar_colaborador(db: Session, proyecto_id: int, colaborador_id: int) -> bool:
    colaborador = (
        db.query(ProyectoColaborador)
        .filter(ProyectoColaborador.id == colaborador_id, ProyectoColaborador.proyecto_id == proyecto_id)
        .first()
    )
    if not colaborador:
        return False

    if colaborador.rol == RolProyecto.ARQUITECTO.value:
        _validar_no_es_ultimo_arquitecto(db, proyecto_id, colaborador_id)

    db.delete(colaborador)
    db.commit()
    return True


def _validar_no_es_ultimo_arquitecto(db: Session, proyecto_id: int, colaborador_id_excluir: int) -> None:
    """Un proyecto siempre debe conservar al menos un Arquitecto."""
    otros_arquitectos = (
        db.query(ProyectoColaborador)
        .filter(
            ProyectoColaborador.proyecto_id == proyecto_id,
            ProyectoColaborador.rol == RolProyecto.ARQUITECTO.value,
            ProyectoColaborador.id != colaborador_id_excluir,
        )
        .count()
    )
    if otros_arquitectos == 0:
        raise ValueError(
            "No puedes quitar o degradar al último Arquitecto del proyecto. "
            "Asigna otro Arquitecto primero."
        )
