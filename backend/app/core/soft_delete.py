from datetime import datetime, timezone

from sqlalchemy.orm import Query, Session


def sin_eliminados(query: Query, modelo) -> Query:
    """Excluye los registros marcados como eliminados (soft delete)."""
    return query.filter(modelo.fecha_eliminacion.is_(None))


def marcar_eliminado(db: Session, instancia) -> None:
    """'Elimina' un registro sin borrarlo de la base: solo le pone fecha de eliminación.

    Así, si más adelante hay que auditar algo que se borró, la fila sigue existiendo
    con todo su historial — no desaparece sin dejar rastro.
    """
    instancia.fecha_eliminacion = datetime.now(timezone.utc)
    db.commit()


def restaurar(db: Session, instancia) -> None:
    """Deshace un soft delete: vuelve a dejar el registro activo."""
    instancia.fecha_eliminacion = None
    db.commit()
