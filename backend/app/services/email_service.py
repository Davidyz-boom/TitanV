"""Servicio de envío de correos vía SMTP (Gmail por defecto).

Configuración vía variables de entorno en backend/.env:
  SMTP_HOST      — servidor SMTP (smtp.gmail.com)
  SMTP_PORT      — puerto TLS (587)
  SMTP_USER      — usuario / correo remitente
  SMTP_PASSWORD  — contraseña de aplicación de 16 dígitos (Gmail)
  EMAIL_FROM     — dirección visible en 'From:'
  EMAIL_FROM_NAME — nombre visible del remitente
  FRONTEND_URL   — URL base del frontend (http://localhost:5173)
"""

import logging
import os
import smtplib
from email.message import EmailMessage

logger = logging.getLogger(__name__)


class EmailError(Exception):
    """Se lanza cuando el envío de correo falla."""


def _config_smtp() -> dict | None:
    host = os.getenv("SMTP_HOST")
    port = os.getenv("SMTP_PORT")
    user = os.getenv("SMTP_USER")
    pwd = os.getenv("SMTP_PASSWORD")
    if not all([host, port, user, pwd]):
        return None
    pwd = pwd.replace(" ", "").strip()
    return {"host": host, "port": int(port), "user": user.strip(), "pwd": pwd}


def _correo_desde() -> str:
    return os.getenv("EMAIL_FROM", os.getenv("SMTP_USER", ""))


def _nombre_desde() -> str:
    return os.getenv("EMAIL_FROM_NAME", "Titan V")


def _frontend_url() -> str:
    return os.getenv("FRONTEND_URL", "http://localhost:5173")


def construir_url_invitacion(token: str) -> str:
    """Devuelve la URL completa del link de invitación que el usuario abrirá."""
    return f"{_frontend_url()}/invitacion/{token}"


def _enviar(destinatario: str, asunto: str, cuerpo_html: str) -> None:
    """Función interna común para armar y mandar cualquier correo por SMTP."""
    cfg = _config_smtp()
    if cfg is None:
        raise EmailError(
            "El servidor de correo no está configurado. "
            "Asigna SMTP_HOST, SMTP_PORT, SMTP_USER y SMTP_PASSWORD en backend/.env"
        )

    msg = EmailMessage()
    msg["From"] = f"{_nombre_desde()} <{_correo_desde()}>"
    msg["To"] = destinatario
    msg["Subject"] = asunto
    msg.add_alternative(cuerpo_html, subtype="html")

    try:
        with smtplib.SMTP(cfg["host"], cfg["port"]) as server:
            server.starttls()
            server.login(cfg["user"], cfg["pwd"])
            server.send_message(msg)
            logger.info("Correo enviado a %s (%s)", destinatario, asunto)
    except EmailError:
        raise
    except Exception as exc:
        logger.warning("No se pudo enviar correo a %s: %s", destinatario, exc)
        raise EmailError(f"No se pudo enviar el correo: {exc}") from exc


def _cuerpo_html(nombre_proyecto: str, rol: str, enlace_url: str) -> str:
    if rol == "Trabajador":
        descripcion = (
            "Podrás crear tareas, turnos, subir evidencias y "
            "registrar movimientos de material."
        )
    else:
        descripcion = (
            "Podrás ver tareas, turnos, inventario y evidencias (solo lectura)."
        )

    return (
        '<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#1e1e1e">'
        '<div style="background:#ffd60a;padding:18px 24px;border-radius:12px 12px 0 0">'
        '<h2 style="margin:0;font-size:18px;color:#000">'
        "\U0001f3d7\ufe0f Te invitaron a un proyecto en Titan V"
        "</h2></div>"
        '<div style="background:#f8f9fa;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">'
        '<p style="margin:0 0 12px">Un Arquitecto te invitó a participar en el proyecto:</p>'
        f'<p style="font-size:16px;font-weight:700;margin:0 0 16px">{nombre_proyecto}</p>'
        f'<p style="margin:0 0 4px">Tu rol asignado: <strong>{rol}</strong></p>'
        f'<p style="margin:0 0 20px;font-size:13px;color:#555">{descripcion}</p>'
        f'<a href="{enlace_url}" '
        'style="display:block;text-align:center;background:#000;color:#ffd60a;'
        'padding:14px 0;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">'
        "Unirme al proyecto</a>"
        '<p style="margin:20px 0 0;font-size:12px;color:#888;text-align:center">'
        "Este enlace expira en 7 días.</p></div></div>"
    )


def enviar_correo_invitacion(
    destinatario: str,
    nombre_proyecto: str,
    rol: str,
    token: str,
) -> None:
    """Envía un correo con el link de invitación al proyecto.

    Raises EmailError si no hay configuración SMTP o el envío falla.
    """
    enlace_url = f"{_frontend_url()}/invitacion/{token}"
    asunto = f"Invitación al proyecto «{nombre_proyecto}» — Titan V"
    _enviar(destinatario, asunto, _cuerpo_html(nombre_proyecto, rol, enlace_url))


def _cuerpo_html_pin(pin: str) -> str:
    return (
        '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#1e1e1e">'
        '<div style="background:#ffd60a;padding:18px 24px;border-radius:12px 12px 0 0">'
        '<h2 style="margin:0;font-size:18px;color:#000">'
        "\U0001f510 Recuperación de contraseña — Titan V"
        "</h2></div>"
        '<div style="background:#f8f9fa;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">'
        '<p style="margin:0 0 12px">Has solicitado restablecer tu contraseña.</p>'
        '<p style="margin:0 0 8px">Tu código PIN de verificación es:</p>'
        f'<div style="font-size:28px;font-weight:700;letter-spacing:8px;'
        'background:#181a20;color:#ffcc00;padding:16px;text-align:center;'
        f'border-radius:8px;margin:0 0 16px">{pin}</div>'
        '<p style="margin:0;font-size:13px;color:#555">'
        "Este código expira en 15 minutos. Si no solicitaste este cambio, "
        "puedes ignorar este correo.</p></div></div>"
    )


def enviar_pin_por_correo(destinatario: str, pin: str) -> None:
    """Envía el código PIN de recuperación de contraseña por correo.

    Raises EmailError si no hay configuración SMTP o el envío falla.
    """
    asunto = "Código de recuperación — Titan V"
    _enviar(destinatario, asunto, _cuerpo_html_pin(pin))
