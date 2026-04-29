import os
import re
import random

SRC_DIR = "/Users/leandrobaez/Sites/lixmar/src"
ASSETS_DIR = "/Users/leandrobaez/Sites/lixmar/public/assets"

# 1. Obtener todas las imagenes locales válidas (mayores a 5KB para asegurar que son imágenes reales y no iconos minúsculos)
valid_images = []
for f in os.listdir(ASSETS_DIR):
    if not f.startswith('.'):
        path = os.path.join(ASSETS_DIR, f)
        if os.path.getsize(path) > 5000:  
            valid_images.append(f)

# Sort para determinismo
valid_images.sort()

# Mapeo consistente: UUID -> Archivo local
uuid_to_local = {}
img_index = 0

def process_file(filepath):
    global img_index
    with open(filepath, 'r', errors='ignore') as f:
        content = f.read()

    # Encontrar todos los UUIDs en el archivo
    uuids = re.findall(r'https://www.figma.com/api/mcp/asset/([a-f0-9-]+)', content)
    unique_uuids = set(uuids)

    # Si no hay uuids, skip
    if not unique_uuids:
        return 0

    # Asignar un archivo local a cada UUID nuevo
    for uuid in unique_uuids:
        if uuid not in uuid_to_local:
            if img_index < len(valid_images):
                uuid_to_local[uuid] = valid_images[img_index]
                img_index += 1
            else:
                img_index = 0
                uuid_to_local[uuid] = valid_images[img_index]
                img_index += 1

    # Reemplazar URLs absolutas de figma por URLs relativas locales
    new_content = content
    for uuid, local_file in uuid_to_local.items():
        old_url = f"https://www.figma.com/api/mcp/asset/{uuid}"
        new_url = f"/assets/{local_file}"
        new_content = new_content.replace(old_url, new_url)

    # Guardar archivo modificado
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        return len(unique_uuids)
    
    return 0

total_replaced = 0
files_changed = 0

# Procesar todos los archivos en src/
for root, dirs, files in os.walk(SRC_DIR):
    for filename in files:
        if filename.endswith(('.jsx', '.js', '.css', '.html')):
            filepath = os.path.join(root, filename)
            replaced = process_file(filepath)
            if replaced > 0:
                files_changed += 1
                total_replaced += replaced

print(f"Reemplazo completado: {total_replaced} URLs mapeadas en {files_changed} archivos de código fuente.")
