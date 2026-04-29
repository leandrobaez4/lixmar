#!/bin/bash
# Script para descargar todas las imágenes de Figma API y guardarlas localmente
# Las imágenes se guardan en /public/assets/ con el UUID como nombre

set -e

DEST_DIR="/Users/leandrobaez/Sites/lixmar/public/assets"
mkdir -p "$DEST_DIR"

# Extraer todas las URLs únicas de Figma
URLS=$(grep -roh 'https://www.figma.com/api/mcp/asset/[a-f0-9-]*' \
  /Users/leandrobaez/Sites/lixmar/src/ \
  /Users/leandrobaez/Sites/lixmar/_legacy/ \
  2>/dev/null | sort -u)

TOTAL=$(echo "$URLS" | wc -l | tr -d ' ')
COUNT=0
SUCCESS=0
FAIL=0

echo "📦 Descargando $TOTAL imágenes de Figma API..."
echo "📂 Destino: $DEST_DIR"
echo ""

for URL in $URLS; do
  COUNT=$((COUNT + 1))
  # Extraer el UUID del asset
  UUID=$(echo "$URL" | grep -o '[a-f0-9-]*$')
  
  # Intentar descargar con curl, seguir redirects, detectar content-type
  HTTP_CODE=$(curl -sL -o "$DEST_DIR/${UUID}.tmp" -w "%{http_code}" \
    --connect-timeout 10 --max-time 30 "$URL" 2>/dev/null || echo "000")
  
  if [ "$HTTP_CODE" = "200" ] && [ -s "$DEST_DIR/${UUID}.tmp" ]; then
    # Detectar tipo de contenido del archivo
    FILE_TYPE=$(file -b --mime-type "$DEST_DIR/${UUID}.tmp" 2>/dev/null)
    
    case "$FILE_TYPE" in
      image/png)  EXT="png" ;;
      image/jpeg) EXT="jpg" ;;
      image/svg+xml) EXT="svg" ;;
      image/webp) EXT="webp" ;;
      image/gif)  EXT="gif" ;;
      *)          EXT="png" ;; # Default to png
    esac
    
    mv "$DEST_DIR/${UUID}.tmp" "$DEST_DIR/${UUID}.${EXT}"
    SUCCESS=$((SUCCESS + 1))
    echo "  ✅ [$COUNT/$TOTAL] $UUID.$EXT"
  else
    rm -f "$DEST_DIR/${UUID}.tmp"
    FAIL=$((FAIL + 1))
    echo "  ❌ [$COUNT/$TOTAL] $UUID (HTTP $HTTP_CODE)"
  fi
done

echo ""
echo "✅ Completado: $SUCCESS descargadas, $FAIL fallidas de $TOTAL total"
echo ""

# Crear un mapping file para facilitar el reemplazo
echo "📝 Generando mapa de URLs..."
MAPPING_FILE="$DEST_DIR/../asset_mapping.txt"
> "$MAPPING_FILE"

for FILE in "$DEST_DIR"/*; do
  if [ -f "$FILE" ]; then
    BASENAME=$(basename "$FILE")
    UUID="${BASENAME%.*}"
    echo "https://www.figma.com/api/mcp/asset/$UUID -> /assets/$BASENAME" >> "$MAPPING_FILE"
  fi
done

echo "📄 Mapa guardado en: $MAPPING_FILE"
