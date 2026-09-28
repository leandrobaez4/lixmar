#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "No existe $ENV_FILE. Ejecutá npm run configure:openai primero." >&2
  exit 1
fi

read -r -s -p "Nueva OpenAI API key: " OPENAI_API_KEY
printf '\n'

if [[ "$OPENAI_API_KEY" != sk-* ]]; then
  echo "La clave no tiene un formato válido." >&2
  exit 1
fi

TMP_FILE="$(mktemp "$ROOT_DIR/.env.rotate.XXXXXX")"
trap 'rm -f "$TMP_FILE"' EXIT

awk -v key="$OPENAI_API_KEY" '
  BEGIN { replaced = 0 }
  /^LLM_API_KEY=/ {
    print "LLM_API_KEY=" key
    replaced = 1
    next
  }
  { print }
  END {
    if (!replaced) print "LLM_API_KEY=" key
  }
' "$ENV_FILE" > "$TMP_FILE"

chmod 600 "$TMP_FILE"
mv "$TMP_FILE" "$ENV_FILE"
trap - EXIT
unset OPENAI_API_KEY

echo "Clave de OpenAI actualizada en .env (permisos 600)."
