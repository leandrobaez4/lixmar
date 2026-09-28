#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "No existe $ENV_FILE." >&2
  exit 1
fi

read -r -s -p "Plane webhook secret: " WEBHOOK_SECRET
printf '\n'

if [[ -z "$WEBHOOK_SECRET" ]]; then
  echo "El secreto no puede estar vacío." >&2
  exit 1
fi

TMP_FILE="$(mktemp "$ROOT_DIR/.env.webhook.XXXXXX")"
trap 'rm -f "$TMP_FILE"' EXIT

awk -v secret="$WEBHOOK_SECRET" '
  BEGIN { replaced = 0 }
  /^PLANE_WEBHOOK_SECRET=/ {
    print "PLANE_WEBHOOK_SECRET=" secret
    replaced = 1
    next
  }
  { print }
  END {
    if (!replaced) print "PLANE_WEBHOOK_SECRET=" secret
  }
' "$ENV_FILE" > "$TMP_FILE"

chmod 600 "$TMP_FILE"
mv "$TMP_FILE" "$ENV_FILE"
trap - EXIT
unset WEBHOOK_SECRET

echo "Secreto del webhook guardado en .env (permisos 600)."
