import http from "node:http";
import { createHmac, timingSafeEqual } from "node:crypto";

export function validSignature(secret, body, received) {
  if (!secret || !received) return false;
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const normalized = received.replace(/^sha256=/, "");
  const a = Buffer.from(expected); const b = Buffer.from(normalized);
  return a.length === b.length && timingSafeEqual(a, b);
}

const respond = (res, status, value) => {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(value));
};

export function createServer({ config, queue, isWorkerHealthy = () => true }) {
  return http.createServer(async (req, res) => {
    if (req.method === "GET" && req.url === "/health") {
      const ok = isWorkerHealthy();
      return respond(res, ok ? 200 : 503, { ok, dryRun: config.dryRun });
    }
    if (req.method !== "POST" || req.url !== "/webhooks/plane") return respond(res, 404, { error: "not_found" });
    const chunks = []; let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 1024 * 1024) return respond(res, 413, { error: "payload_too_large" });
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks);
    if (!validSignature(config.plane.webhookSecret, body, req.headers["x-plane-signature"])) return respond(res, 403, { error: "invalid_signature" });
    let payload;
    try { payload = JSON.parse(body.toString("utf8")); } catch { return respond(res, 400, { error: "invalid_json" }); }
    const deliveryId = req.headers["x-plane-delivery"] || payload.webhook_id;
    if (!deliveryId) return respond(res, 400, { error: "missing_delivery_id" });
    const created = await queue.enqueue(String(deliveryId), payload, { event: req.headers["x-plane-event"] });
    return respond(res, 200, { ok: true, queued: created, duplicate: !created });
  });
}
