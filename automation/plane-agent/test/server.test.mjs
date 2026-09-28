import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { createServer, validSignature } from "../src/server.mjs";

test("valida la firma HMAC de Plane sobre el cuerpo crudo", () => {
  const body = Buffer.from('{"event":"issue","action":"create"}');
  const signature = createHmac("sha256", "secret").update(body).digest("hex");
  assert.equal(validSignature("secret", body, signature), true);
  assert.equal(validSignature("secret", Buffer.from("alterado"), signature), false);
  assert.equal(validSignature("secret", body, `sha256=${signature}`), true);
});

test("health informa error si el worker dejó de procesar", async () => {
  const server = createServer({ config: { dryRun: false }, queue: {}, isWorkerHealthy: () => false });
  const response = await new Promise((resolve) => {
    let status;
    server.emit("request", { method: "GET", url: "/health" }, {
      writeHead(code) { status = code; },
      end(body) { resolve({ status, body: JSON.parse(body) }); },
    });
  });
  assert.equal(response.status, 503);
  assert.equal(response.body.ok, false);
  server.close();
});
