import { loadConfig } from "./config.mjs";
import { FileQueue } from "./queue.mjs";
import { PlaneClient } from "./plane-client.mjs";
import { LlmGateway } from "./llm.mjs";
import { Processor } from "./processor.mjs";
import { createServer } from "./server.mjs";
import { redactError, sleep } from "./util.mjs";

const config = loadConfig();
const queue = new FileQueue(config.dataDir);
await queue.init();
const processor = new Processor({ config, queue, plane: new PlaneClient(config.plane), llm: new LlmGateway(config.llm, config.llmFallback) });
let stopping = false;
let workerHealthy = true;

async function worker() {
  while (!stopping) {
    const job = await queue.claim();
    if (!job) { await sleep(config.workerPollMs); continue; }
    const outcome = await processor.work(job);
    console.log(JSON.stringify({ at: new Date().toISOString(), deliveryId: job.deliveryId, status: outcome.status }));
  }
}

const server = createServer({ config, queue, isWorkerHealthy: () => workerHealthy });
server.listen(config.port, "0.0.0.0", () => console.log(`Plane agent escuchando en :${config.port} (dryRun=${config.dryRun})`));
worker().catch((error) => {
  workerHealthy = false;
  console.error(JSON.stringify({ event: "worker_failed", error: redactError(error) }));
  process.exit(1);
});

for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => {
  stopping = true;
  server.close(() => process.exit(0));
});
