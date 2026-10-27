import os
import secrets
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE = timedelta(minutes=int(os.getenv("JWT_EXPIRE_MINUTES", 60)))

# Clave de firma de los JWT: SIEMPRE desde el entorno (.env), nunca embebida
# en el código. Si falta o es demasiado corta, se genera una efímera al arrancar
# (las sesiones se invalidan al reiniciar) en lugar de caer en una clave fija
# conocida, que firmaría tokens que cualquiera podría replicar.
_clave_configurada = os.getenv("JWT_SECRET_KEY", "")
if len(_clave_configurada) >= 32:
    SECRET_KEY = _clave_configurada
else:
    if _clave_configurada:
        print("[Titan V WARN] JWT_SECRET_KEY es muy corta (mínimo 32 caracteres): se ignora.")
    SECRET_KEY = secrets.token_hex(32)
    print(
        "[Titan V WARN] JWT_SECRET_KEY no definida en backend/.env: se generó una clave efímera. "
        "Las sesiones caducarán al reiniciar el servidor."
    )

# Tope de usuarios del sistema. 0 (por defecto) = sin límite, para que no
# bloquee el registro en desarrollo/pruebas.
MAX_USUARIOS = int(os.getenv("MAX_USUARIOS", "0"))
