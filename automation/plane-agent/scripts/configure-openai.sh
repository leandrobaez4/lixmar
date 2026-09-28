#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
if [[ -f .env ]]; then
  echo "Ya existe automation/plane-agent/.env; no se sobrescribió."
  exit 1
fi

if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  read -r -s -p "OpenAI API key: " OPENAI_API_KEY
  echo
fi
if [[ "$OPENAI_API_KEY" != sk-* ]]; then
  echo "La API key no tiene el formato esperado (sk-...)." >&2
  exit 1
fi

PLANE_API_KEY="$(python3 - <<'PY'
import pathlib, tomllib
config = tomllib.loads(pathlib.Path.home().joinpath('.codex/config.toml').read_text())
print(config['mcp_servers']['plane']['env']['PLANE_API_KEY'])
PY
)"
WEBHOOK_SECRET="$(openssl rand -hex 32)"
umask 077
{
  printf 'PLANE_BASE_URL=%s\n' 'http://localhost:8081'
  printf 'PLANE_API_KEY=%s\n' "$PLANE_API_KEY"
  printf 'PLANE_WORKSPACE_SLUG=%s\n' 'lixmar'
  printf 'PLANE_PROJECT_ID=%s\n' '7982a9e7-95a3-4c24-9f8e-6569129a11ad'
  printf 'PLANE_WEBHOOK_SECRET=%s\n' "$WEBHOOK_SECRET"
  printf 'PORT=%s\n' '8787'
  printf 'DATA_DIR=%s\n' './data'
  printf 'MAX_ATTEMPTS=%s\n' '5'
  printf 'RETRY_BASE_MS=%s\n' '5000'
  printf 'WORKER_POLL_MS=%s\n' '1000'
  printf 'ISSUE_COOLDOWN_MS=%s\n' '30000'
  printf 'PROCESS_UPDATES=%s\n' 'false'
  printf 'MAX_DAILY_LLM_CALLS=%s\n' '50'
  printf 'LLM_PROVIDER=%s\n' 'openai-compatible'
  printf 'LLM_MODEL=%s\n' 'gpt-5-mini'
  printf 'LLM_API_KEY=%s\n' "$OPENAI_API_KEY"
  printf 'LLM_BASE_URL=%s\n' 'https://api.openai.com'
  printf 'LLM_TEMPERATURE=%s\n' '0.1'
  printf 'LLM_MAX_TOKENS=%s\n' '2000'
  printf 'LLM_TIMEOUT_MS=%s\n' '60000'
  printf 'DRY_RUN=%s\n' 'true'
  printf 'ACTION_MODE_UPDATE_WORK_ITEM=%s\n' 'auto'
  printf 'ACTION_MODE_ADD_COMMENT=%s\n' 'approval'
  printf 'ACTION_MODE_CREATE_WORK_ITEM=%s\n' 'approval'
  printf 'ACTION_MODE_ADD_TO_MODULE=%s\n' 'approval'
  printf 'ACTION_MODE_ADD_TO_CYCLE=%s\n' 'approval'
} > .env
chmod 600 .env
unset OPENAI_API_KEY PLANE_API_KEY WEBHOOK_SECRET
echo "Configuración creada en automation/plane-agent/.env con permisos 600."
echo "El agente queda en DRY_RUN=true, limitado a tickets nuevos y 50 llamadas diarias."
