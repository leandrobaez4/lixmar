import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { FileQueue } from "../src/queue.mjs";
import { snapshotFields, matchesFields } from "../src/rollback-fields.mjs";

test("guarda el estado anterior y detecta cambios posteriores antes de revertir", async () => {
  const before = snapshotFields({ priority: "low", state: { id: "todo" }, labels: [{ id: "manual" }] },
    { priority: "high", state: "progress", labels: ["manual", "automatic"] });
  assert.deepEqual(before, { priority: "low", state: "todo", labels: ["manual"] });
  assert.equal(matchesFields({ priority: "high", state: { id: "progress" }, labels: [{ id: "automatic" }, { id: "manual" }] },
    { priority: "high", state: "progress", labels: ["manual", "automatic"] }), true);
  assert.equal(matchesFields({ priority: "urgent" }, { priority: "high" }), false);

  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "plane-agent-rollback-"));
  try {
    const queue = new FileQueue(dir);
    await queue.init();
    assert.equal(await queue.beginWrite("delivery-1", 0, { before, action: { type: "update_work_item" } }), true);
    await queue.finishWrite("delivery-1", 0);
    const record = await queue.readWrite("delivery-1", 0);
    assert.equal(record.status, "completed");
    assert.deepEqual(record.before, before);
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});
