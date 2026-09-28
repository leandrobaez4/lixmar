import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { createHmac, randomUUID } from "node:crypto";
import { loadConfig } from "../src/config.mjs";
import { sleep, stableId } from "../src/util.mjs";

const config = loadConfig();
const deliveryId = `smoke-${randomUUID()}`;
const payload = JSON.stringify({
  event: "issue", action: "created",
  data: { id: randomUUID(), project: "00000000-0000-0000-0000-000000000000" },
});
const signature = createHmac("sha256", config.plane.webhookSecret).update(payload).digest("hex");
const endpoint = process.env.AGENT_URL ?? `http://127.0.0.1:${config.port}`;
const send = async () => {
  const response = await fetch(`${endpoint}/webhooks/plane`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-plane-signature": signature, "x-plane-delivery": deliveryId },
    body: payload,
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(response.status, 200);
  return response.json();
};

const first = await send();
const duplicate = await send();
assert.equal(first.queued, true);
assert.equal(duplicate.duplicate, true);

const completedFile = path.join(config.dataDir, "processed", `${stableId(deliveryId)}.json`);
let completed = false;
for (let attempt = 0; attempt < 30; attempt++) {
  try {
    const job = JSON.parse(await fs.readFile(completedFile, "utf8"));
    assert.equal(job.result.skipped, "project_not_allowed");
    completed = true;
    break;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    await sleep(200);
  }
}
assert.equal(completed, true, "El worker no procesó el webhook de prueba a tiempo");
console.log(JSON.stringify({ ok: true, signedWebhook: true, duplicateIgnored: true, workerProcessed: true }));
