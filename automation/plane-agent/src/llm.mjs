import { jsonFromText } from "./util.mjs";

const defaults = {
  "openai-compatible": "https://api.openai.com",
  anthropic: "https://api.anthropic.com",
  gemini: "https://generativelanguage.googleapis.com",
  ollama: "http://localhost:11434",
};

async function post(url, headers, body, timeoutMs) {
  const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body), signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) {
    // Provider error bodies can echo credentials, URLs or parts of the prompt.
    const error = new Error(`LLM HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

export class LlmGateway {
  constructor(config, fallback = null) { this.config = config; this.fallback = fallback; }

  async complete(system, user, beforeCall = async () => {}) {
    await beforeCall();
    try { return await this.completeWith(this.config, system, user); }
    catch (error) {
      const transient = error.status === 429 || error.status >= 500 || ["TypeError", "TimeoutError"].includes(error.name);
      if (!this.fallback || !transient) throw error;
      await beforeCall();
      const result = await this.completeWith(this.fallback, system, user);
      return { ...result, provider: this.fallback.provider, model: this.fallback.model, fallbackUsed: true };
    }
  }

  async completeWith(c, system, user) {
    const base = c.baseUrl || defaults[c.provider];
    let response;
    let text;
    if (c.provider === "openai-compatible") {
      const openaiReasoning = base === defaults["openai-compatible"] && /^(gpt-5|gpt-6|o[1-9])/.test(c.model);
      const parameters = openaiReasoning
        ? { max_completion_tokens: c.maxTokens }
        : { temperature: c.temperature, max_tokens: c.maxTokens };
      response = await post(`${base}/v1/chat/completions`, { authorization: `Bearer ${c.apiKey}` }, {
        model: c.model, ...parameters,
        response_format: { type: "json_object" }, messages: [{ role: "system", content: system }, { role: "user", content: user }],
      }, c.timeoutMs);
      text = response.choices?.[0]?.message?.content;
    } else if (c.provider === "anthropic") {
      response = await post(`${base}/v1/messages`, { "x-api-key": c.apiKey, "anthropic-version": "2023-06-01" }, {
        model: c.model, temperature: c.temperature, max_tokens: c.maxTokens, system, messages: [{ role: "user", content: user }],
      }, c.timeoutMs);
      text = response.content?.find((part) => part.type === "text")?.text;
    } else if (c.provider === "gemini") {
      response = await post(`${base}/v1beta/models/${encodeURIComponent(c.model)}:generateContent?key=${encodeURIComponent(c.apiKey)}`, {}, {
        systemInstruction: { parts: [{ text: system }] }, generationConfig: { temperature: c.temperature, maxOutputTokens: c.maxTokens, responseMimeType: "application/json" },
        contents: [{ role: "user", parts: [{ text: user }] }],
      }, c.timeoutMs);
      text = response.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("");
    } else {
      response = await post(`${base}/api/chat`, {}, {
        model: c.model, stream: false, format: "json", options: { temperature: c.temperature, num_predict: c.maxTokens },
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
      }, c.timeoutMs);
      text = response.message?.content;
    }
    if (!text) throw new Error("El proveedor LLM devolvió una respuesta vacía");
    return { value: jsonFromText(text), usage: response.usage ?? response.usageMetadata ?? null,
      provider: c.provider, model: c.model, fallbackUsed: false };
  }
}
