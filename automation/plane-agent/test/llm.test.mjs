import test from "node:test";
import assert from "node:assert/strict";
import { LlmGateway } from "../src/llm.mjs";

const primary = { provider: "openai-compatible", model: "gpt-5-mini", apiKey: "test-key", baseUrl: "https://api.openai.com", maxTokens: 200, timeoutMs: 1000 };
const fallback = { provider: "ollama", model: "local-test", baseUrl: "http://localhost:11434", maxTokens: 200, timeoutMs: 1000, temperature: 0 };

test("usa y registra el proveedor alternativo sólo tras un error transitorio", async () => {
  const original = globalThis.fetch;
  const urls = [];
  let reservations = 0;
  globalThis.fetch = async (url) => {
    urls.push(url);
    if (urls.length === 1) return new Response('{"error":"rate limit"}', { status: 429 });
    return Response.json({ message: { content: '{"summary":"ok","actions":[]}' } });
  };
  try {
    const result = await new LlmGateway(primary, fallback).complete("system", "user", async () => { reservations++; });
    assert.equal(result.fallbackUsed, true);
    assert.equal(result.model, "local-test");
    assert.equal(urls.length, 2);
    assert.equal(reservations, 2);
  } finally { globalThis.fetch = original; }
});

test("no envía el prompt a otro proveedor si la clave primaria es inválida", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; return new Response('{"error":"unauthorized"}', { status: 401 }); };
  try {
    await assert.rejects(() => new LlmGateway(primary, fallback).complete("system", "user"), /401/);
    assert.equal(calls, 1);
  } finally { globalThis.fetch = original; }
});

test("no registra el cuerpo de error devuelto por el proveedor", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response('{"error":"sk-sensitive-value"}', { status: 500 });
  try {
    await assert.rejects(
      () => new LlmGateway(primary).complete("system", "user"),
      (error) => error.status === 500 && !error.message.includes("sk-sensitive-value"),
    );
  } finally { globalThis.fetch = original; }
});
