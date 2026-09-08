from datetime import datetime, timezone

from sqlalchemy.orm import Query, Session


def sin_eliminados(query: Query, modelo) -> Query:
    """Excluye los registros marcados como eliminados (soft delete)."""
    return query.filter(modelo.fecha_eliminacion.is_(None))


def marcar_eliminado(db: Session, instancia) -> None:
    """Elimina físicamente el registro de la base de datos para que desaparezca
    por completo tanto de la aplicación como de pgAdmin."""
    db.delete(instancia)
    db.commit()


def restaurar(db: Session, instancia) -> None:
    """Compatibilidad con endpoints existentes."""
    if hasattr(instancia, 'fecha_eliminacion'):
        instancia.fecha_eliminacion = None
        db.commit()

