import os

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Usuario
from app.schemas import GoogleAuthRequest, UsuarioCreate, UsuarioLogin, UsuarioResponse
from app.services import auth_service, usuario_service

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/registro", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def registro(usuario: UsuarioCreate, db: Session = Depends(get_db)):
    """Registro público de nuevo usuario en la base de datos."""
    import re

    if (
        not re.search(r"[a-zA-Z]", usuario.contrasena)
        or not re.search(r"[0-9]", usuario.contrasena)
        or not re.search(r"[^a-zA-Z0-9]", usuario.contrasena)
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña debe contener al menos 8 caracteres, incluyendo letras, números y al menos un símbolo especial (ej: *, #, @, $, !).",
        )

    if usuario_service.correo_registrado(db, usuario.correo_electronico):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico ya está registrado.",
        )
    return usuario_service.crear_usuario(db, usuario)


@router.post("/google")
def login_google(datos: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Inicia sesión con Google o crea al usuario en PostgreSQL si es nuevo.

    El correo y nombre se toman de la respuesta VERIFICADA de Google
    (obtenida server-side con el access_token), nunca de lo que el cliente
    haya mandado en el body — eso es lo que cierra el hueco de seguridad.
    """
    datos_google = auth_service.verificar_token_google(datos.credential)
    correo_verificado = datos_google["email"]
    nombre_verificado = datos_google.get("name", correo_verificado)

    usuario = db.query(Usuario).filter(Usuario.correo_electronico == correo_verificado).first()

    if not usuario:
        # Registrar automáticamente en la base de datos
        partes = nombre_verificado.strip().split(" ", 1)
        nombres = partes[0]
        apellidos = partes[1] if len(partes) > 1 else ""

        nuevo_usuario = Usuario(
            nombres=nombres,
            apellidos=apellidos,
            correo_electronico=correo_verificado,
            # Contraseña aleatoria: esta cuenta solo podrá entrar por Google,
            # nunca por correo/contraseña (nadie conoce este valor).
            contrasena_encriptada=auth_service.hashear_contrasena(os.urandom(32).hex()),
            rol=3,  # Operario / Rol estándar
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
def login(credenciales: UsuarioLogin, db: Session = Depends(get_db)):
    usuario = auth_service.autenticar_usuario(db, credenciales)

    if not usuario:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Credenciales incorrectas")

    if not usuario.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El usuario se encuentra inactivo. Contacte al administrador.",
        )

    token = auth_service.crear_token_acceso(usuario)

    return {
        "mensaje": "Login exitoso",
        "usuario_id": usuario.id_usuario,
        "nombre": f"{usuario.nombres} {usuario.apellidos}".strip(),
        "correo": usuario.correo_electronico,
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
        "correo": usuario_actual.correo_electronico,
        "rol": usuario_actual.rol,
    }

