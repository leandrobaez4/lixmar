import { loadConfig } from "./config.mjs";
import os from "node:os";
import { FileQueue } from "./queue.mjs";
import { PlaneClient } from "./plane-client.mjs";
import { Processor } from "./processor.mjs";
import { redactError } from "./util.mjs";
import { snapshotFields } from "./rollback-fields.mjs";

const deliveryId = process.argv[2];
const confirmed = process.argv.includes("--yes");
if (!deliveryId || deliveryId.startsWith("--")) {
  console.error("Uso: npm run approve -- <delivery-id> [--yes]");
  process.exit(2);
}

const config = loadConfig();
const queue = new FileQueue(config.dataDir);
await queue.init();
let approval;
try { approval = await queue.readApproval(deliveryId); }
catch { console.error(`No existe una aprobación pendiente para ${deliveryId}`); process.exit(1); }

if (!confirmed) {
  console.log(JSON.stringify({ deliveryId, summary: approval.summary, actions: approval.actions }, null, 2));
  console.log(`\nPara ejecutar estas acciones: npm run approve -- ${deliveryId} --yes`);
  process.exit(2);
}

if (config.dryRun) {
  console.error("DRY_RUN=true: ninguna aprobación puede escribir en Plane. Cambiarlo a false sólo después de revisar las propuestas.");
  process.exit(2);
}

const plane = new PlaneClient(config.plane);
const processor = new Processor({ config, queue, plane, llm: null });
const results = [];
for (const [index, action] of approval.actions.entries()) {
  const before = action.type === "update_work_item"
    ? snapshotFields(await plane.getWorkItem(approval.projectId, action.workItemId), action.fields)
    : null;
  if (!(await queue.beginWrite(`approval:${deliveryId}`, index, { projectId: approval.projectId, action, before }))) {
    console.error(`La acción ${index} ya tuvo un intento; revisar Plane antes de repetirla.`);
    process.exit(1);
  }
  try {
    const response = await processor.execute(approval.projectId, deliveryId, action);
    await queue.finishWrite(`approval:${deliveryId}`, index);
    results.push({ action, resultId: response?.id ?? null });
  }
  catch (error) {
    const failure = { action, error: redactError(error) };
    results.push(failure);
    await queue.appendAudit(deliveryId, { approval: "failed", results });
    console.error(JSON.stringify(failure, null, 2));
    process.exit(1);
  }
}
const approvedBy = os.userInfo().username;
const completed = { ...approval, status: "approved", approvedAt: new Date().toISOString(), approvedBy, results };
await queue.completeApproval(deliveryId, completed);
await queue.appendAudit(deliveryId, { approval: "executed", approvedBy, results });
console.log(JSON.stringify({ ok: true, deliveryId, executed: results.length }));
