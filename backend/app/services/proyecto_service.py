from typing import Optional

from sqlalchemy.orm import Session

from app.core.soft_delete import marcar_eliminado, restaurar, sin_eliminados
from app.models import ProyectoColaborador, ProyectoObra
from app.schemas import ProyectoCreate, ProyectoUpdate
from app.services import colaborador_service


def listar_proyectos(
    db: Session, usuario_id: Optional[int] = None, incluir_eliminados: bool = False, skip: int = 0, limit: int = 100
):
    from app.models import Usuario

    query = db.query(ProyectoObra)

    if usuario_id is not None:
        usuario = db.query(Usuario).filter(Usuario.id_usuario == usuario_id).first()
        # Si el usuario NO es admin (rol != 1), solo ve las obras que él mismo registró/creó o donde colabora
        if usuario and usuario.rol != 1:
            query = query.outerjoin(ProyectoColaborador, ProyectoObra.id == ProyectoColaborador.proyecto_id).filter(
                (ProyectoObra.usuario_creador_id == usuario_id) | (ProyectoColaborador.usuario_id == usuario_id)
            ).distinct()

    if not incluir_eliminados:
        query = sin_eliminados(query, ProyectoObra)

    return query.offset(skip).limit(limit).all()


def obtener_proyecto(db: Session, proyecto_id: int, incluir_eliminados: bool = False) -> Optional[ProyectoObra]:
    query = db.query(ProyectoObra).filter(ProyectoObra.id == proyecto_id)
    if not incluir_eliminados:
        query = sin_eliminados(query, ProyectoObra)
    return query.first()


def crear_proyecto(db: Session, proyecto: ProyectoCreate, usuario_creador_id: int) -> ProyectoObra:
    datos = proyecto.model_dump()
    datos["usuario_creador_id"] = usuario_creador_id
    nuevo_proyecto = ProyectoObra(**datos)
    db.add(nuevo_proyecto)
    db.commit()
    db.refresh(nuevo_proyecto)

    # Quien crea el proyecto queda automáticamente como Arquitecto.
    colaborador_service.agregar_arquitecto(db, nuevo_proyecto.id, usuario_creador_id)

    return nuevo_proyecto


def actualizar_proyecto(db: Session, proyecto_id: int, datos: ProyectoUpdate) -> Optional[ProyectoObra]:
    proyecto = obtener_proyecto(db, proyecto_id)
    if not proyecto:
        return None

    # exclude_unset=True: solo se tocan los campos que el cliente realmente envió
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(proyecto, campo, valor)

    db.commit()
    db.refresh(proyecto)
    return proyecto


def eliminar_proyecto(db: Session, proyecto_id: int) -> bool:
    """Soft delete: el proyecto deja de aparecer en los listados, pero no se borra
    de la base de datos — sigue existiendo por si hay que auditarlo después."""
    proyecto = obtener_proyecto(db, proyecto_id)
    if not proyecto:
        return False

    marcar_eliminado(db, proyecto)
    return True


def restaurar_proyecto(db: Session, proyecto_id: int) -> Optional[ProyectoObra]:
    proyecto = obtener_proyecto(db, proyecto_id, incluir_eliminados=True)
    if not proyecto or proyecto.fecha_eliminacion is None:
        return None

    restaurar(db, proyecto)
    return proyecto


def asignar_material_a_proyecto(
    db: Session, proyecto_id: int, material_id: int, cantidad: float, usuario_id: int
):
    """TV-PROY-MAT: Asigna materiales necesarios a un proyecto y actualiza inventario y kardex."""
    from app.models import HistorialMovimiento, InventarioObra, Material, TipoMovimiento

    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise ValueError("El material especificado no existe.")

    # Buscar o crear el registro en inventario_obras
    inventario = (
        db.query(InventarioObra)
        .filter(InventarioObra.proyecto_id == proyecto_id, InventarioObra.material_id == material_id)
        .first()
    )

    if not inventario:
        inventario = InventarioObra(
            proyecto_id=proyecto_id,
            material_id=material_id,
            cantidad_disponible=float(cantidad),
        )
        db.add(inventario)
    else:
        inventario.cantidad_disponible = float(inventario.cantidad_disponible or 0.0) + float(cantidad)

    # Si el material en catálogo tenía menos stock total que lo asignado, incrementarlo para coherencia
    if (material.stock_total or 0.0) < inventario.cantidad_disponible:
        material.stock_total = float(material.stock_total or 0.0) + float(cantidad)

    # Registrar el movimiento de entrada en el kardex
    movimiento = HistorialMovimiento(
        proyecto_id=proyecto_id,
        material_id=material_id,
        usuario_id=usuario_id,
        tipo_movimiento=TipoMovimiento.ENTRADA.value,
        cantidad=float(cantidad),
    )
    db.add(movimiento)
    db.commit()
    db.refresh(inventario)

    return {
        "mensaje": f"Se asignaron {cantidad} {material.unidad_medida} de {material.nombre_material} a la obra.",
        "proyecto_id": proyecto_id,
        "material_id": material_id,
        "nombre_material": material.nombre_material,
        "unidad_medida": material.unidad_medida,
        "cantidad_disponible": inventario.cantidad_disponible,
    }


def obtener_resumen_proyecto(db: Session, proyecto_id: int):
    """Obtiene el resumen consolidado de una obra: materiales colocados, obreros, turnos y evidencias."""
    from app.models import EvidenciaMultimedia, InventarioObra, Material, ProyectoColaborador, TurnoRelevo, Usuario

    proyecto = obtener_proyecto(db, proyecto_id)
    if not proyecto:
        return None

    # Materiales asignados a la obra
    inventarios = (
        db.query(InventarioObra, Material.nombre_material, Material.unidad_medida)
        .join(Material, InventarioObra.material_id == Material.id)
        .filter(InventarioObra.proyecto_id == proyecto_id)
        .all()
    )
    materiales_list = [
        {
            "material_id": inv.InventarioObra.material_id,
            "nombre_material": inv.nombre_material,
            "unidad_medida": inv.unidad_medida,
            "cantidad": float(inv.InventarioObra.cantidad_disponible),
        }
        for inv in inventarios
    ]

    # Obreros / colaboradores asignados
    colaboradores = (
        db.query(ProyectoColaborador, Usuario.nombres, Usuario.apellidos, Usuario.correo_electronico)
        .join(Usuario, ProyectoColaborador.usuario_id == Usuario.id_usuario)
        .filter(ProyectoColaborador.proyecto_id == proyecto_id)
        .all()
    )
    obreros_list = [
        {
            "usuario_id": c.ProyectoColaborador.usuario_id,
            "nombre_completo": f"{c.nombres} {c.apellidos}".strip(),
            "correo": c.correo_electronico,
            "rol_en_obra": c.ProyectoColaborador.rol,
        }
        for c in colaboradores
    ]

    # Total de turnos
    total_turnos = db.query(TurnoRelevo).filter(TurnoRelevo.proyecto_id == proyecto_id).count()

    # Total de evidencias
    total_evidencias = db.query(EvidenciaMultimedia).filter(EvidenciaMultimedia.proyecto_id == proyecto_id).count()

    return {
        "id": proyecto.id,
        "nombre_proyecto": proyecto.nombre_proyecto,
        "ubicacion_direccion": proyecto.ubicacion_direccion,
        "estado": proyecto.estado,
        "fecha_inicio": str(proyecto.fecha_inicio),
        "fecha_fin_estimada": str(proyecto.fecha_fin_estimada),
        "materiales": materiales_list,
        "cantidad_obreros": len(obreros_list),
        "obreros": obreros_list,
        "total_turnos": total_turnos,
        "total_evidencias": total_evidencias,
    }

