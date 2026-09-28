import { createHash } from "node:crypto";

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function stableId(value) {
  return createHash("sha256").update(String(value)).digest("hex").slice(0, 32);
}

export function jsonFromText(text) {
  const trimmed = String(text ?? "").trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = fenced ?? trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(candidate.slice(start, end + 1));
    throw new Error("El LLM no devolvió JSON válido");
  }
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function redactPromptText(value) {
  return String(value ?? "")
    .replace(/\bsk-(?:proj-)?[A-Za-z0-9_-]{16,}\b/g, "[REDACTED_KEY]")
    .replace(/\bBearer\s+[A-Za-z0-9._~-]{16,}/gi, "Bearer [REDACTED_TOKEN]")
    .replace(/\b(api[_-]?key|token|secret)\s*[:=]\s*["']?([A-Za-z0-9._~-]{16,})/gi, "$1=[REDACTED]");
}

export function redactError(error) {
  return { name: error?.name ?? "Error", message: String(error?.message ?? error).slice(0, 1000) };
}
