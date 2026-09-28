import path from "node:path";

const integer = (name, fallback) => {
  const value = Number.parseInt(process.env[name] ?? String(fallback), 10);
  if (!Number.isFinite(value) || value < 0) throw new Error(`${name} debe ser un entero positivo`);
  return value;
};

const number = (name, fallback) => {
  const value = Number.parseFloat(process.env[name] ?? String(fallback));
  if (!Number.isFinite(value)) throw new Error(`${name} debe ser numérico`);
  return value;
};

const boolean = (name, fallback) => {
  const raw = process.env[name];
  if (raw == null) return fallback;
  return ["1", "true", "yes", "on"].includes(raw.toLowerCase());
};

const mode = (name, fallback) => {
  const value = process.env[name] ?? fallback;
  if (!["auto", "approval", "suggestion", "deny"].includes(value)) {
    throw new Error(`${name} debe ser auto, approval, suggestion o deny`);
  }
  return value;
};

export function loadConfig({ requireSecrets = true } = {}) {
  const config = {
    port: integer("PORT", 8787),
    dataDir: path.resolve(process.env.DATA_DIR ?? "./data"),
    maxAttempts: integer("MAX_ATTEMPTS", 5),
    retryBaseMs: integer("RETRY_BASE_MS", 5000),
    workerPollMs: integer("WORKER_POLL_MS", 1000),
    issueCooldownMs: integer("ISSUE_COOLDOWN_MS", 30000),
    dryRun: boolean("DRY_RUN", true),
    processUpdates: boolean("PROCESS_UPDATES", false),
    maxDailyLlmCalls: integer("MAX_DAILY_LLM_CALLS", 50),
    maxPromptChars: integer("MAX_PROMPT_CHARS", 30000),
    cycleCapacityPoints: integer("CYCLE_CAPACITY_POINTS", 20),
    plane: {
      baseUrl: (process.env.PLANE_BASE_URL ?? "http://localhost:8081").replace(/\/$/, ""),
      apiKey: process.env.PLANE_API_KEY ?? "",
      workspace: process.env.PLANE_WORKSPACE_SLUG ?? "lixmar",
      projectId: process.env.PLANE_PROJECT_ID ?? "",
      webhookSecret: process.env.PLANE_WEBHOOK_SECRET ?? "",
      agentActorId: process.env.PLANE_AGENT_ACTOR_ID ?? "",
    },
    llm: {
      provider: process.env.LLM_PROVIDER ?? "openai-compatible",
      model: process.env.LLM_MODEL ?? "",
      apiKey: process.env.LLM_API_KEY ?? "",
      baseUrl: (process.env.LLM_BASE_URL ?? "").replace(/\/$/, ""),
      temperature: number("LLM_TEMPERATURE", 0.1),
      maxTokens: integer("LLM_MAX_TOKENS", 2000),
      timeoutMs: integer("LLM_TIMEOUT_MS", 60000),
    },
    llmFallback: process.env.LLM_FALLBACK_PROVIDER ? {
      provider: process.env.LLM_FALLBACK_PROVIDER,
      model: process.env.LLM_FALLBACK_MODEL ?? "",
      apiKey: process.env.LLM_FALLBACK_API_KEY ?? "",
      baseUrl: (process.env.LLM_FALLBACK_BASE_URL ?? "").replace(/\/$/, ""),
      temperature: number("LLM_FALLBACK_TEMPERATURE", 0.1),
      maxTokens: integer("LLM_FALLBACK_MAX_TOKENS", 2000),
      timeoutMs: integer("LLM_FALLBACK_TIMEOUT_MS", 60000),
    } : null,
    actionModes: {
      update_work_item: mode("ACTION_MODE_UPDATE_WORK_ITEM", "auto"),
      add_comment: mode("ACTION_MODE_ADD_COMMENT", "auto"),
      create_work_item: mode("ACTION_MODE_CREATE_WORK_ITEM", "approval"),
      create_subtask: mode("ACTION_MODE_CREATE_SUBTASK", "approval"),
      add_to_module: mode("ACTION_MODE_ADD_TO_MODULE", "approval"),
      add_to_cycle: mode("ACTION_MODE_ADD_TO_CYCLE", "approval"),
    },
  };

  const providers = ["openai-compatible", "anthropic", "gemini", "ollama"];
  if (config.maxPromptChars < 2000) throw new Error("MAX_PROMPT_CHARS debe ser al menos 2000");
  if (!providers.includes(config.llm.provider)) throw new Error(`LLM_PROVIDER inválido: ${config.llm.provider}`);
  if (config.llmFallback && !providers.includes(config.llmFallback.provider)) throw new Error(`LLM_FALLBACK_PROVIDER inválido: ${config.llmFallback.provider}`);
  if (requireSecrets) {
    const missing = [];
    if (!config.plane.apiKey || config.plane.apiKey.endsWith("REEMPLAZAR")) missing.push("PLANE_API_KEY");
    if (!config.plane.projectId) missing.push("PLANE_PROJECT_ID");
    if (!config.plane.webhookSecret || config.plane.webhookSecret.startsWith("reemplazar")) missing.push("PLANE_WEBHOOK_SECRET");
    if (!config.llm.model) missing.push("LLM_MODEL");
    if (config.llm.provider !== "ollama" && (!config.llm.apiKey || config.llm.apiKey === "reemplazar")) missing.push("LLM_API_KEY");
    if (config.llmFallback && !config.llmFallback.model) missing.push("LLM_FALLBACK_MODEL");
    if (config.llmFallback && config.llmFallback.provider !== "ollama" && !config.llmFallback.apiKey) missing.push("LLM_FALLBACK_API_KEY");
    if (missing.length) throw new Error(`Faltan variables requeridas: ${missing.join(", ")}`);
  }
  return config;
}
