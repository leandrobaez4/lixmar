import os from "node:os";
import { loadConfig } from "../src/config.mjs";
import { FileQueue } from "../src/queue.mjs";
import { PlaneClient } from "../src/plane-client.mjs";
import { matchesFields } from "../src/rollback-fields.mjs";
import { redactError } from "../src/util.mjs";

const deliveryId = process.argv[2];
const index = Number(process.argv[3]);
const confirmed = process.argv.includes("--yes");
if (!deliveryId || !Number.isInteger(index) || index < 0) {
  console.error("Uso: npm run rollback -- <delivery-id> <indice> [--yes]");
  process.exit(2);
}

const config = loadConfig();
const queue = new FileQueue(config.dataDir);
await queue.init();
const record = await queue.readWrite(deliveryId, index);
if (record.status !== "completed" || record.action?.type !== "update_work_item" || !record.before) {
  throw new Error("Sólo se pueden revertir actualizaciones completadas con estado previo registrado");
}
const plane = new PlaneClient(config.plane);
const current = await plane.getWorkItem(record.projectId, record.action.workItemId);
if (!matchesFields(current, record.action.fields)) {
  throw new Error("El ticket cambió desde la acción automática; revisar manualmente antes de revertir");
}
if (!confirmed) {
  console.log(JSON.stringify({ deliveryId, index, workItemId: record.action.workItemId, fields: Object.keys(record.before), ready: true }));
  console.log(`Para revertir: npm run rollback -- ${deliveryId} ${index} --yes`);
  process.exit(0);
}
if (config.dryRun) throw new Error("DRY_RUN=true: no se puede escribir en Plane");

await queue.setWrite(deliveryId, index, { ...record, status: "reverting", revertingAt: new Date().toISOString() });
try {
  await plane.updateWorkItem(record.projectId, record.action.workItemId, record.before);
  await queue.setWrite(deliveryId, index, { ...record, status: "reverted", revertedAt: new Date().toISOString(), revertedBy: os.userInfo().username });
  await queue.appendAudit(deliveryId, { rollback: "completed", index, fields: Object.keys(record.before), actor: os.userInfo().username });
  console.log(JSON.stringify({ ok: true, deliveryId, index, reverted: true }));
} catch (error) {
  await queue.appendAudit(deliveryId, { rollback: "uncertain", index, error: redactError(error) });
  throw error;
}
