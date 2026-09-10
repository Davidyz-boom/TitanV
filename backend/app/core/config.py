import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "clave-secreta-de-desarrollo-titan-v-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE = timedelta(minutes=int(os.getenv("JWT_EXPIRE_MINUTES", 60)))