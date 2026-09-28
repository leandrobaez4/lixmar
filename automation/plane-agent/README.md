# Lixmar Plane Agent

Servicio local para enriquecer y organizar work items de Plane con un LLM configurable. Plane envía webhooks firmados, el servicio los guarda en una cola persistente, el LLM propone acciones JSON y el motor de políticas decide cuáles ejecutar.

## Qué incluye

- Firma `X-Plane-Signature` con HMAC SHA-256 sobre el cuerpo crudo.
- Idempotencia mediante `X-Plane-Delivery`.
- Cola persistente, reintentos exponenciales y dead-letter queue en `DATA_DIR`.
- Los errores transitorios del proveedor se reintentan con espera máxima de una hora; si se alcanza el límite diario de llamadas, el evento permanece pendiente hasta el día siguiente.
- El límite diario cuenta cada llamada real al proveedor, incluida una llamada al fallback.
- Proveedores `openai-compatible`, `anthropic`, `gemini` y `ollama`.
- Fallback opcional de proveedor y modelo ante límites, errores de red o errores 5xx; no reenvía prompts tras un error de autenticación.
- Escrituras con la API `/work-items/` de Plane.
- Políticas `auto`, `approval`, `suggestion` y `deny` por tipo de acción.
- Creación de subtareas vinculadas al ticket analizado, con aprobación independiente mediante `ACTION_MODE_CREATE_SUBTASK`.
- Modo simulación, auditoría JSONL, límite de acciones y validación de IDs.
- La auditoría registra una huella SHA-256 del prompt (sin copiar su contenido) y el usuario local que ejecuta una aprobación.
- Prevención de bucles por autoría, `external_source`, idempotencia y cooldown.
- Por defecto sólo analiza tickets nuevos; `PROCESS_UPDATES=true` habilita cambios y comentarios. El límite diario inicial es 50 llamadas al LLM.
- `MAX_PROMPT_CHARS` limita el tamaño total del prompt: reduce primero los títulos recientes y luego la descripción del ticket antes de llamar al proveedor.
- `CYCLE_CAPACITY_POINTS` limita los puntos acumulados de un ciclo antes de aprobar una nueva asignación; los tickets sin estimación consumen un punto. El valor inicial es 20 y se puede ajustar en `.env`.
- Los cambios de estado propuestos por el LLM siempre requieren aprobación. El flujo de desarrollo lo gestiona una automatización de Codex separada.
- Las etiquetas y los responsables propuestos por el LLM se agregan a los existentes; el agente no elimina asignaciones manuales mediante un PATCH parcial.

## Flujo de desarrollo

La automatización de Codex **Lixmar: ejecutar tickets de Plane** revisa el proyecto cada cinco minutos. Selecciona por prioridad (`urgent`, `high`, `medium`, `low`, `none`) y, en caso de empate, por número de ticket. La secuencia es `Backlog → Todo → In Progress → Test → Done`. Mantiene como máximo un ticket en `In Progress` o `Test`.

Codex implementa el cambio en el repositorio y ejecuta las verificaciones adecuadas al ticket. Una prueba fallida en `Test` devuelve el mismo ticket a `In Progress`; una validación exitosa permite pasarlo a `Done`. La automatización conserva los bloqueos en el ticket activo y no toma otro hasta resolverlos. El estado `Test` pertenece al grupo `started` de Plane.

## Puesta en marcha

```bash
cd automation/plane-agent
cp .env.example .env
# Editar .env y cargarlo en la terminal
set -a; source .env; set +a
npm test
npm start
```

Con Plane local funcionando, `npm run smoke:plane` verifica de forma reproducible y sin escrituras la lectura de tickets, estados, etiquetas, módulos, ciclos, miembros y el detalle de un ticket. Sólo muestra cantidades; no imprime claves ni contenido de tickets.

Con el agente corriendo, `npm run smoke:webhook` envía un evento firmado de prueba al webhook local, comprueba que una entrega repetida se ignore y espera a que el worker la procese. Usa un proyecto ficticio para que no llame al LLM ni modifique Plane. Se puede indicar `AGENT_URL` si el endpoint no está en el puerto configurado.

`npm run report` muestra métricas agregadas de la cola y del LLM: tickets procesados, acciones, aprobaciones, rechazos, errores definitivos, uso de tokens y latencia media. Para estimar el costo configurá `LLM_INPUT_PRICE_PER_M` y `LLM_OUTPUT_PRICE_PER_M` con las tarifas por millón de tokens de tu proveedor; si faltan, el costo queda en `null`. El reporte no imprime tickets ni prompts.

`npm run evaluate` ejecuta tres casos sintéticos reproducibles para prioridad y duplicados contra el proveedor configurado. No escribe en Plane; informa sólo resultados agregados y el modelo utilizado. Sale con código distinto de cero si algún caso falla. Cada ejecución consume tokens del proveedor LLM.

El flujo de GitHub Actions `.github/workflows/plane-agent.yml` ejecuta las pruebas unitarias y la verificación de sintaxis cuando cambian los archivos del agente. Las pruebas de integración con Plane y el LLM se ejecutan localmente porque requieren la instancia y credenciales privadas.

Para dejarlo ejecutándose y reiniciarlo automáticamente con Docker:

```bash
docker compose up -d --build
```

El archivo `compose.yaml` usa `host.docker.internal` para acceder al Plane local y conserva la cola y auditoría en `./data`.

Para OpenAI, se puede crear el `.env` sin mostrar las claves en pantalla:

```bash
cd automation/plane-agent
npm run configure:openai
```

El configurador pide la API key de OpenAI con entrada oculta, reutiliza localmente la clave de Plane configurada en Codex y crea un secreto aleatorio para el webhook. El archivo queda con permisos `600` y está excluido de Git.

El endpoint será `POST http://HOST:8787/webhooks/plane` y la verificación está en `GET /health`.
Si el worker falla de forma fatal, el proceso termina con error para que Docker lo reinicie; `/health` devuelve 503 mientras el worker no está sano.

Plane exige una URL accesible desde el contenedor o proceso donde corre Plane. Si Plane está en Docker y el agente corre en macOS, normalmente se usa `http://host.docker.internal:8787/webhooks/plane`. El secreto que entrega Plane al crear el webhook debe guardarse como `PLANE_WEBHOOK_SECRET`.

Seleccionar en el webhook los eventos **Issue** e **Issue Comment**. El agente responde `200` apenas persiste el evento; el trabajo del LLM ocurre en segundo plano.

## Proveedores

| `LLM_PROVIDER` | `LLM_BASE_URL` predeterminada | Ejemplo de modelo |
| --- | --- | --- |
| `openai-compatible` | `https://api.openai.com` | `gpt-5-mini` |
| `anthropic` | `https://api.anthropic.com` | modelo disponible en la cuenta |
| `gemini` | `https://generativelanguage.googleapis.com` | modelo disponible en la cuenta |
| `ollama` | `http://localhost:11434` | `qwen3:8b` |

Para OpenRouter, LM Studio u otro servidor compatible, usar `openai-compatible` y configurar `LLM_BASE_URL`, `LLM_MODEL` y `LLM_API_KEY`.

Para habilitar un proveedor alternativo configurá `LLM_FALLBACK_PROVIDER`, `LLM_FALLBACK_MODEL`, `LLM_FALLBACK_API_KEY` (salvo Ollama) y, si corresponde, `LLM_FALLBACK_BASE_URL` en `.env`. El proveedor realmente usado queda en la auditoría. No se activa ningún fallback sin estas variables.

## Activación gradual

1. Empezar con `DRY_RUN=true`; revisar `data/audit/*.jsonl`.
2. Mantener creación, módulos y ciclos en `approval`.
3. Cambiar a `DRY_RUN=false` cuando las propuestas sean correctas.
4. Definir `PLANE_AGENT_ACTOR_ID` con el usuario dueño del token para cortar bucles por autoría.

Los archivos en `data/approvals/` son propuestas pendientes. Esta versión no borra work items, no cambia permisos y no cierra ciclos.

Para revisar y aprobar una propuesta:

```bash
npm run approve -- ID-DE-ENTREGA
npm run approve -- ID-DE-ENTREGA --yes
```

El primer comando sólo muestra el plan. El segundo ejecuta las acciones y mueve el registro a `data/approved/`.

Las actualizaciones automáticas nuevas guardan los valores anteriores en `data/writes/`. Para revisar y revertir una actualización completada: `npm run rollback -- ID-DE-ENTREGA INDICE`, seguido de `npm run rollback -- ID-DE-ENTREGA INDICE --yes`. El comando se niega si el campo cambió después de la escritura, y registra quién ejecutó la reversión. Las escrituras anteriores a esta función y las acciones que crean tickets, comentarios o vínculos requieren revisión manual.

## Referencias de Plane

- Webhooks: https://developers.plane.so/dev-tools/intro-webhooks
- API: https://developers.plane.so/api-reference/introduction
- Actualizar work item: https://developers.plane.so/api-reference/issue/update-issue-detail
