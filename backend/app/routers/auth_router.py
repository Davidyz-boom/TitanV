import os
import random
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import MAX_USUARIOS
from app.core.database import get_db
from app.models import Usuario
from app.schemas import (
    ForgotPasswordRequest,
    GoogleAuthRequest,
    ResetPasswordRequest,
    UsuarioCreate,
    UsuarioLogin,
    UsuarioResponse,
    VerifyPinRequest,
)
from app.services import auth_service, email_service, proteccion_service, usuario_service
from app.services.email_service import EmailError
from app.services.proteccion_service import ip_cliente, limitador

router = APIRouter(prefix="/auth", tags=["Autenticación"])

# Ventanas deslizantes (intentos por ventana) por IP / identidad.
VENTANA_LOGIN = 300      # 5 min
VENTANA_REGISTRO = 600   # 10 min
VENTANA_PIN = 300        # 5 min


@router.post("/registro", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def registro(usuario: UsuarioCreate, request: Request, db: Session = Depends(get_db)):
    """Registro público de nuevo usuario en la base de datos."""
    limitador.verificar(f"registro:{ip_cliente(request)}", maximo=5, ventana_segundos=VENTANA_REGISTRO)

    if MAX_USUARIOS > 0:
        total_usuarios = db.query(Usuario).count()
        if total_usuarios >= MAX_USUARIOS:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Se alcanzó el límite máximo de usuarios permitidos en el sistema. Contacta al administrador.",
            )

    if usuario_service.correo_registrado(db, usuario.correo_electronico):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico ya está registrado.",
        )
    return usuario_service.crear_usuario(db, usuario)


@router.post("/google")
def login_google(datos: GoogleAuthRequest, request: Request, db: Session = Depends(get_db)):
    """Inicia sesión con Google o crea al usuario en PostgreSQL si es nuevo.

    El correo y nombre se toman de la respuesta VERIFICADA de Google
    (obtenida server-side con el access_token), nunca de lo que el cliente
    haya mandado en el body — eso es lo que cierra el hueco de seguridad.
    """
    limitador.verificar(f"google:{ip_cliente(request)}", maximo=15, ventana_segundos=VENTANA_LOGIN)

    datos_google = auth_service.verificar_token_google(datos.credential)
    correo_verificado = datos_google["email"]
    nombre_verificado = datos_google.get("name", correo_verificado)

    usuario = db.query(Usuario).filter(Usuario.correo_electronico == correo_verificado).first()

    if not usuario:
        if MAX_USUARIOS > 0 and db.query(Usuario).count() >= MAX_USUARIOS:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Se alcanzó el límite máximo de usuarios permitidos en el sistema. Contacta al administrador.",
            )

        partes = nombre_verificado.strip().split(" ", 1)
        nombres = partes[0]
        apellidos = partes[1] if len(partes) > 1 else ""

        nuevo_usuario = Usuario(
            nombres=nombres,
            apellidos=apellidos,
            correo_electronico=correo_verificado,
            contrasena_encriptada=auth_service.hashear_contrasena(os.urandom(32).hex()),
            rol=3,
            activo=True,
        )
        db.add(nuevo_usuario)
        db.commit()
        db.refresh(nuevo_usuario)
        usuario = nuevo_usuario

    if not usuario.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El usuario se encuentra inactivo en el sistema. Contacte al administrador.",
        )

    proteccion_service.reiniciar_intentos(db, usuario)
    token = auth_service.crear_token_acceso(usuario)

    return {
        "mensaje": "Inicio de sesión con Google exitoso",
        "usuario_id": usuario.id_usuario,
        "nombre": f"{usuario.nombres} {usuario.apellidos}".strip(),
        "correo": usuario.correo_electronico,
        "rol": usuario.rol,
        "token": token,
        "token_type": "bearer",
    }


@router.post("/login")
def login(credenciales: UsuarioLogin, request: Request, db: Session = Depends(get_db)):
    # Capa 1: corta ráfagas por IP antes de tocar la base de datos.
    limitador.verificar(f"login:{ip_cliente(request)}", maximo=10, ventana_segundos=VENTANA_LOGIN)

    usuario = db.query(Usuario).filter(Usuario.correo_electronico == credenciales.correo_electronico).first()
    if not usuario:
        # Mismo mensaje que una contraseña mala: no se revela si el correo existe.
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Credenciales incorrectas")

    # Capa 2: bloqueo persistente de la cuenta tras fallos consecutivos.
    proteccion_service.verificar_bloqueo_cuenta(usuario)

    if not auth_service.verificar_contrasena(credenciales.contrasena, usuario.contrasena_encriptada):
        bloqueada = proteccion_service.registrar_fallo(db, usuario)
        if bloqueada:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=(
                    f"Cuenta bloqueada por {proteccion_service.MINUTOS_BLOQUEO_CONTRASENA} minutos "
                    "tras demasiados intentos fallidos."
                ),
            )
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Credenciales incorrectas")

    if not usuario.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El usuario se encuentra inactivo. Contacte al administrador.",
        )

    proteccion_service.reiniciar_intentos(db, usuario)
    token = auth_service.crear_token_acceso(usuario)

    return {
        "mensaje": "Login exitoso",
        "usuario_id": usuario.id_usuario,
        "nombre": f"{usuario.nombres} {usuario.apellidos}".strip(),
        "rol": usuario.rol,
        "token": token,
        "token_type": "bearer",
    }


@router.get("/verificar")
def verificar_sesion(usuario_actual: Usuario = Depends(auth_service.obtener_usuario_actual)):
    """Útil para que el frontend confirme si el token guardado todavía es válido."""
    return {
        "usuario_id": usuario_actual.id_usuario,
        "nombre": f"{usuario_actual.nombres} {usuario_actual.apellidos}".strip(),
        "rol": usuario_actual.rol,
    }


@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, request: Request, db: Session = Depends(get_db)):
    ip = ip_cliente(request)
    limitador.verificar(f"forgot-ip:{ip}", maximo=5, ventana_segundos=900)
    limitador.verificar(f"forgot-mail:{req.email.lower()}", maximo=5, ventana_segundos=900)

    usuario = db.query(Usuario).filter(Usuario.correo_electronico == req.email).first()
    if not usuario:
        return {"message": "Si el correo está registrado, se ha enviado un código PIN."}

    pin = f"{random.randint(0, 9999):04d}"
    usuario.reset_pin = pin
    usuario.reset_pin_expira = datetime.utcnow() + timedelta(minutes=15)
    db.commit()

    try:
        email_service.enviar_pin_por_correo(req.email, pin)
        print(f"[Titan V PIN] Correo enviado exitosamente a {req.email} con PIN: {pin}")
    except EmailError as e:
        print(f"[Titan V PIN] Advertencia SMTP: {e}")
        print(f"[Titan V PIN] PIN GENERADO PARA {req.email}: {pin}")
        if not email_service._config_smtp():
            return {
                "message": f"Código PIN generado ({pin}). Configura SMTP_USER y SMTP_PASSWORD en backend/.env para recibirlo por correo real.",
                "pin": pin,
            }
        raise HTTPException(
            status_code=500,
            detail=f"No se pudo enviar el código por correo. {e}",
        )

    return {"message": "Código PIN enviado exitosamente a tu correo."}


@router.post("/verify-pin")
def verify_pin(req: VerifyPinRequest, request: Request, db: Session = Depends(get_db)):
    ip = ip_cliente(request)
    # El PIN son 4 dígitos: sin límite por correo, un ataque de fuerza bruta
    # tendría miles de intentos disponibles.
    limitador.verificar(f"pin-ip:{ip}", maximo=15, ventana_segundos=VENTANA_PIN)
    limitador.verificar(f"pin-mail:{req.email.lower()}", maximo=10, ventana_segundos=900)

    usuario = db.query(Usuario).filter(Usuario.correo_electronico == req.email).first()

    if not usuario or usuario.reset_pin != req.pin:
        raise HTTPException(status_code=400, detail="El código PIN es incorrecto.")

    if usuario.reset_pin_expira and datetime.utcnow() > usuario.reset_pin_expira:
        raise HTTPException(status_code=400, detail="El código PIN ha expirado.")

    return {"message": "PIN verificado correctamente."}


@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, request: Request, db: Session = Depends(get_db)):
    ip = ip_cliente(request)
    limitador.verificar(f"reset-ip:{ip}", maximo=10, ventana_segundos=VENTANA_PIN)
    limitador.verificar(f"reset-mail:{req.email.lower()}", maximo=5, ventana_segundos=900)

    usuario = db.query(Usuario).filter(Usuario.correo_electronico == req.email).first()

    if not usuario or usuario.reset_pin != req.pin:
        raise HTTPException(status_code=400, detail="El código PIN es incorrecto.")

    if usuario.reset_pin_expira and datetime.utcnow() > usuario.reset_pin_expira:
        raise HTTPException(status_code=400, detail="El código PIN ha expirado.")

    usuario.contrasena_encriptada = auth_service.hashear_contrasena(req.newPassword)
    usuario.reset_pin = None
    usuario.reset_pin_expira = None
    # Al cambiar la contraseña se limpia el bloqueo por intentos fallidos.
    usuario.intentos_fallidos = 0
    usuario.bloqueado_hasta = None
    db.commit()

    return {"message": "Contraseña actualizada exitosamente."}
