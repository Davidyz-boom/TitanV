"""Protección contra fuerza bruta: límite de intentos por IP y bloqueo de cuentas.

Dos capas:
1. Limitador de tasa en memoria (por IP): corta ráfagas de peticiones antes de
   tocar la base de datos. Como el proceso puede reiniciarse con --reload, el
   estado vive solo en memoria y se pierde al arrancar: no es un control
   permanente, pero sí frena el escaneo en caliente.
2. Bloqueo temporal de la cuenta (columna bloqueado_hasta en usuarios): se
   persiste en PostgreSQL, sobrevive a reinicios y aplica aunque el atacante
   cambie de IP.
"""

import math
import threading
import time
from collections import defaultdict, deque
from datetime import datetime, timedelta

from fastapi import HTTPException, Request, status
from sqlalchemy.orm import Session

from app.models import Usuario

LIMITE_FALLOS_CONSECUTIVOS = 5
MINUTOS_BLOQUEO_CONTRASENA = 15


class LimitadorTasa:
    """Ventana deslizante por clave (thread-safe, en memoria)."""

    def __init__(self) -> None:
        self._eventos: dict[str, deque[float]] = defaultdict(deque)
        self._candado = threading.Lock()

    def verificar(self, clave: str, maximo: int, ventana_segundos: int) -> None:
        ahora = time.monotonic()
        with self._candado:
            eventos = self._eventos[clave]
            while eventos and ahora - eventos[0] > ventana_segundos:
                eventos.popleft()
            if len(eventos) >= maximo:
                espera = int(math.ceil(ventana_segundos - (ahora - eventos[0])))
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Demasiados intentos. Vuelve a intentarlo en {espera} segundos.",
                )
            eventos.append(ahora)


limitador = LimitadorTasa()


def ip_cliente(request: Request) -> str:
    """IP del cliente. Detrás de un proxy se usa X-Forwarded-For si existe."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "desconocida"


def verificar_bloqueo_cuenta(usuario: Usuario) -> None:
    """Lanza 429 si la cuenta está bloqueada temporalmente por intentos fallidos."""
    if not usuario.bloqueado_hasta:
        return
    ahora = datetime.utcnow()
    if ahora < usuario.bloqueado_hasta:
        minutos = max(1, math.ceil((usuario.bloqueado_hasta - ahora).total_seconds() / 60))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Cuenta bloqueada por demasiados intentos fallidos. Intenta de nuevo en {minutos} minuto(s).",
        )
    # Bloqueo vencido: se libera la cuenta.
    usuario.bloqueado_hasta = None
    usuario.intentos_fallidos = 0


def registrar_fallo(db: Session, usuario: Usuario) -> bool:
    """Suma un intento fallido y bloquea la cuenta al llegar al límite.

    Devuelve True si con este fallo la cuenta quedó bloqueada.
    """
    usuario.intentos_fallidos = (usuario.intentos_fallidos or 0) + 1
    bloqueada = usuario.intentos_fallidos >= LIMITE_FALLOS_CONSECUTIVOS
    if bloqueada:
        usuario.bloqueado_hasta = datetime.utcnow() + timedelta(minutes=MINUTOS_BLOQUEO_CONTRASENA)
    db.commit()
    return bloqueada


def reiniciar_intentos(db: Session, usuario: Usuario) -> None:
    """Login correcto: limpia el contador y cualquier bloqueo previo."""
    if usuario.intentos_fallidos or usuario.bloqueado_hasta:
        usuario.intentos_fallidos = 0
        usuario.bloqueado_hasta = None
        db.commit()
