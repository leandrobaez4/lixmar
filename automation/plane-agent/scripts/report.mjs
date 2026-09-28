import fs from "node:fs/promises";
import path from "node:path";
import { loadConfig } from "../src/config.mjs";

const { dataDir } = loadConfig({ requireSecrets: false });
const report = {
  processed: 0, skipped: {}, executedActions: 0, pendingApprovalActions: 0,
  suggestions: 0, denied: 0, deadLetter: 0, approvalsWaiting: 0, approvalsCompleted: 0,
  llmCalls: 0, fallbackCalls: 0, inputTokens: 0, outputTokens: 0,
  averageLatencyMs: null,
};

async function files(bucket) {
  try { return (await fs.readdir(path.join(dataDir, bucket))).filter((name) => name.endsWith(".json")); }
  catch (error) { if (error.code === "ENOENT") return []; throw error; }
}

let totalLatency = 0;
let measuredLatency = 0;
for (const name of await files("processed")) {
  const job = JSON.parse(await fs.readFile(path.join(dataDir, "processed", name), "utf8"));
  const result = job.result ?? {};
  report.processed++;
  if (result.skipped) report.skipped[result.skipped] = (report.skipped[result.skipped] ?? 0) + 1;
  if (result.provider) {
    report.llmCalls++;
    if (result.fallbackUsed) report.fallbackCalls++;
    const usage = result.usage ?? {};
    report.inputTokens += usage.prompt_tokens ?? usage.input_tokens ?? usage.promptTokenCount ?? 0;
    report.outputTokens += usage.completion_tokens ?? usage.output_tokens ?? usage.candidatesTokenCount ?? 0;
  }
  report.executedActions += result.executed?.length ?? 0;
  report.pendingApprovalActions += result.pendingApproval?.length ?? 0;
  report.suggestions += result.suggestions?.length ?? 0;
  report.denied += result.denied?.length ?? 0;
  const latency = Date.parse(job.completedAt) - Date.parse(job.receivedAt);
  if (Number.isFinite(latency) && latency >= 0) { totalLatency += latency; measuredLatency++; }
}
report.averageLatencyMs = measuredLatency ? Math.round(totalLatency / measuredLatency) : null;
report.deadLetter = (await files("dead-letter")).length;
report.approvalsWaiting = (await files("approvals")).length;
report.approvalsCompleted = (await files("approved")).length;

const inputPrice = Number(process.env.LLM_INPUT_PRICE_PER_M ?? "");
const outputPrice = Number(process.env.LLM_OUTPUT_PRICE_PER_M ?? "");
report.estimatedLlmCost = process.env.LLM_INPUT_PRICE_PER_M && process.env.LLM_OUTPUT_PRICE_PER_M
  && Number.isFinite(inputPrice) && Number.isFinite(outputPrice)
  ? Number(((report.inputTokens * inputPrice + report.outputTokens * outputPrice) / 1_000_000).toFixed(6))
  : null;

console.log(JSON.stringify(report, null, 2));
