"""
Script de diagnóstico para el error:
UnicodeDecodeError: 'utf-8' codec can't decode byte 0xab in position 86: invalid start byte

Cómo usarlo:
1. Copia este archivo dentro de tu carpeta backend/ (junto a database.py)
2. Ejecuta:  python diagnostico_env.py
3. Lee la salida: te va a mostrar exactamente qué carácter está mal y en qué posición.
"""

import os
from dotenv import load_dotenv

load_dotenv()

url = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:1234@localhost:5432/titanv_db",
)

print("=" * 60)
print("Valor de DATABASE_URL tal como lo lee Python:")
print(repr(url))
print(f"Longitud en caracteres: {len(url)}")
print("=" * 60)

# Intentar codificar a UTF-8 y ver si falla
try:
    encoded = url.encode("utf-8")
    print("La URL se codifica correctamente en UTF-8.")
    print(f"Longitud en bytes UTF-8: {len(encoded)}")
except UnicodeEncodeError as e:
    print(f"Error al codificar: {e}")

# Mostrar cada caracter con su código, marcando los no-ASCII
print("\nCaracteres no-ASCII encontrados en DATABASE_URL:")
found = False
for i, ch in enumerate(url):
    if ord(ch) > 127:
        found = True
        print(f"  Posición {i}: {ch!r} (código Unicode: U+{ord(ch):04X})")

if not found:
    print("  Ninguno encontrado en la variable DATABASE_URL en memoria.")
    print("  Esto sugiere que el problema puede estar en el archivo .env")
    print("  mismo (su codificación en disco), no en el valor interpretado.")

# Revisar el archivo .env directamente en bytes crudos
print("\n" + "=" * 60)
print("Revisando el archivo .env directamente (bytes crudos):")
env_path = ".env"
if os.path.exists(env_path):
    with open(env_path, "rb") as f:
        raw = f.read()
    print(f"Tamaño del archivo: {len(raw)} bytes")

    # Buscar bytes que no son ASCII válido
    bad_positions = []
    for i, b in enumerate(raw):
        if b > 127:
            bad_positions.append((i, b))

    if bad_positions:
        print(f"\nSe encontraron {len(bad_positions)} bytes no-ASCII:")
        for pos, b in bad_positions[:20]:
            context = raw[max(0, pos - 15):pos + 15]
            print(f"  Byte 0x{b:02X} en posición {pos}. Contexto: {context!r}")
    else:
        print("No se encontraron bytes no-ASCII en el archivo .env.")

    # Verificar si tiene BOM (Byte Order Mark)
    if raw.startswith(b"\xef\xbb\xbf"):
        print("\n¡ATENCIÓN! El archivo .env tiene un BOM UTF-8 al inicio.")
        print("Esto puede causar problemas. Guárdalo como 'UTF-8' sin BOM en VS Code.")
else:
    print(f"No se encontró el archivo {env_path} en el directorio actual.")
    print("Ejecuta este script desde la carpeta backend/, junto a database.py")

print("=" * 60)
