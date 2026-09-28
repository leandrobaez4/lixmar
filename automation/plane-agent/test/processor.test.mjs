import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { FileQueue } from "../src/queue.mjs";
import { Processor, buildInput, selectRelatedWorkItems, systemPrompt } from "../src/processor.mjs";

test("crea una subtarea vinculada al ticket analizado", async () => {
  let created;
  const processor = new Processor({
    config: {}, queue: {}, llm: {},
    plane: { createWorkItem: async (_projectId, fields) => { created = fields; return { id: "child-1" }; } },
  });
  const result = await processor.execute("project-1", "delivery-1", {
    type: "create_subtask", parentWorkItemId: "parent-1", fields: { name: "Parte verificable", priority: "high" },
  });
  assert.equal(result.id, "child-1");
  assert.deepEqual(created, { name: "Parte verificable", priority: "high", parent: "parent-1" });
});

test("un reintento no repite una escritura de resultado incierto", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "plane-agent-test-"));
  try {
    const queue = new FileQueue(dir);
    await queue.init();
    let writes = 0;
    const plane = {
      getWorkItem: async () => ({ id: "work-1", name: "Prueba" }),
      listWorkItems: async () => [], listLabels: async () => [], listStates: async () => [],
      listModules: async () => [], listCycles: async () => [], listMembers: async () => [],
      updateWorkItem: async () => { writes += 1; throw new Error("respuesta perdida"); },
    };
    const llm = { complete: async () => ({ value: { summary: "priorizar", actions: [{ type: "update_work_item", fields: { priority: "high" } }] } }) };
    const config = {
      plane: { projectId: "project-1", agentActorId: "" }, processUpdates: false, maxDailyLlmCalls: 50,
      issueCooldownMs: 0, dryRun: false, maxAttempts: 2, retryBaseMs: 0,
      actionModes: { update_work_item: "auto", add_comment: "approval", create_work_item: "approval", add_to_module: "approval", add_to_cycle: "approval" },
      llm: { provider: "openai-compatible", model: "gpt-5-mini" },
    };
    const processor = new Processor({ config, queue, plane, llm });
    await queue.enqueue("delivery-1", { event: "issue", action: "create", data: { id: "work-1", project: "project-1" } });
    assert.equal((await processor.work(await queue.claim())).status, "pending");
    assert.equal((await processor.work(await queue.claim())).status, "dead-letter");
    assert.equal(writes, 1);
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});

test("acepta los verbos created y updated usados por Plane", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "plane-agent-action-test-"));
  try {
    const queue = new FileQueue(dir);
    await queue.init();
    let calls = 0;
    const plane = {
      getWorkItem: async () => ({ id: "work-1", name: "Prueba" }),
      listWorkItems: async () => [], listLabels: async () => [], listStates: async () => [],
      listModules: async () => [], listCycles: async () => [], listMembers: async () => [],
    };
    const llm = { complete: async () => { calls += 1; return { value: { summary: "sin cambios", actions: [] } }; } };
    const config = {
      plane: { projectId: "project-1", agentActorId: "" }, processUpdates: false, maxDailyLlmCalls: 50,
      issueCooldownMs: 0, dryRun: true, maxAttempts: 2, retryBaseMs: 0,
      actionModes: { update_work_item: "auto", add_comment: "auto", create_work_item: "approval", add_to_module: "approval", add_to_cycle: "approval" },
      llm: { provider: "openai-compatible", model: "gpt-5-mini" },
    };
    const processor = new Processor({ config, queue, plane, llm });
    const result = await processor.process({ deliveryId: "delivery-created", payload: { event: "issue", action: "created", data: { id: "work-1", project: "project-1" } } });
    assert.equal(result.summary, "sin cambios");
    assert.match(result.promptHash, /^[a-f0-9]{64}$/);
    assert.equal(calls, 1);
    const skipped = await processor.process({ deliveryId: "delivery-updated", payload: { event: "issue", action: "updated", data: { id: "work-1", project: "project-1" } } });
    assert.equal(skipped.skipped, "updates_disabled");
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});

test("envía al modelo sólo los campos necesarios del ticket", async () => {
  const plane = {
    getWorkItem: async () => ({ id: "work-1", name: "Prueba", description_stripped: "Descripción", priority: "high", created_by: { email: "private@example.test" }, secret_metadata: "secret-not-for-model" }),
    listWorkItems: async () => [], listLabels: async () => [], listStates: async () => [],
    listModules: async () => [], listCycles: async () => [], listMembers: async () => [],
  };
  const processor = new Processor({ config: {}, queue: {}, plane, llm: {} });
  const context = await processor.context("project-1", "work-1");
  assert.equal(context.workItem.description, "Descripción");
  assert.equal(context.workItem.priority, "high");
  assert.equal(JSON.stringify(context).includes("private@example.test"), false);
  assert.equal(JSON.stringify(context).includes("secret-not-for-model"), false);
});

test("oculta claves reconocibles antes de crear el contexto del LLM", async () => {
  const key = `sk-proj-${"A".repeat(40)}`;
  const plane = {
    getWorkItem: async () => ({ id: "work-1", name: `Clave ${key}`, description_stripped: `token=${"B".repeat(32)}` }),
    listWorkItems: async () => [{ id: "work-2", name: `Bearer ${"C".repeat(32)}` }],
    listLabels: async () => [], listStates: async () => [], listModules: async () => [],
    listCycles: async () => [], listMembers: async () => [],
  };
  const processor = new Processor({ config: {}, queue: {}, plane, llm: {} });
  const serialized = JSON.stringify(await processor.context("project-1", "work-1"));
  assert.equal(serialized.includes(key), false);
  assert.equal(serialized.includes("B".repeat(32)), false);
  assert.equal(serialized.includes("C".repeat(32)), false);
  assert.match(serialized, /REDACTED/);
});

test("no compara un ticket recién creado consigo mismo como posible duplicado", async () => {
  const plane = {
    getWorkItem: async () => ({ id: "work-1", name: "Compra fallida" }),
    listWorkItems: async () => [{ id: "work-1", name: "Compra fallida" }, { id: "work-2", name: "Otra incidencia" }],
    listLabels: async () => [], listStates: async () => [], listModules: async () => [],
    listCycles: async () => [], listMembers: async () => [],
  };
  const context = await new Processor({ config: {}, queue: {}, plane, llm: {} }).context("project-1", "work-1");
  assert.deepEqual(context.recentWorkItems.map((item) => item.id), ["work-2"]);
});

test("prioriza un posible duplicado antiguo aunque haya más de cien tickets nuevos", () => {
  const items = Array.from({ length: 110 }, (_, index) => ({ id: `new-${index}`, sequence_id: 200 + index, name: "Ajuste visual de tienda" }));
  items.push({ id: "old-duplicate", sequence_id: 2, name: "Error de pago en checkout" });
  const selected = selectRelatedWorkItems(items, { id: "current", name: "Error en checkout de pago" });
  assert.equal(selected.length, 100);
  assert.equal(selected[0].id, "old-duplicate");
});

test("la cola restringe permisos de archivos con datos de tickets", async () => {
  if (process.platform === "win32") return;
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "plane-agent-permissions-"));
  try {
    const queue = new FileQueue(dir);
    await queue.init();
    await queue.enqueue("delivery-1", { event: "issue", data: { name: "privado" } });
    const file = queue.file("pending", "delivery-1");
    assert.equal((await fs.stat(dir)).mode & 0o777, 0o700);
    assert.equal((await fs.stat(file)).mode & 0o777, 0o600);
    await queue.appendAudit("delivery-1", { summary: "privado" });
    const auditFile = path.join(queue.paths.audit, `${new Date().toISOString().slice(0, 10)}.jsonl`);
    assert.equal((await fs.stat(auditFile)).mode & 0o777, 0o600);
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});

test("dos entregas simultáneas con el mismo ID sólo crean un trabajo", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "plane-agent-duplicate-"));
  try {
    const queue = new FileQueue(dir);
    await queue.init();
    const results = await Promise.all(Array.from({ length: 20 }, () => queue.enqueue("same-delivery", { event: "issue" })));
    assert.equal(results.filter(Boolean).length, 1);
    assert.equal((await fs.readdir(queue.paths.pending)).length, 1);
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});

test("limita el prompt manteniendo el ticket principal", () => {
  const context = {
    workItem: { id: "principal", name: "Incidencia", description: "x".repeat(10000) },
    recentWorkItems: Array.from({ length: 100 }, (_, index) => ({ id: `otro-${index}`, name: "y".repeat(300) })),
    labels: [], states: [], modules: [], cycles: [], members: [],
  };
  const input = buildInput({ event: "issue", action: "create" }, context, 5000);
  assert.ok(input.length + systemPrompt.length <= 5000);
  assert.equal(JSON.parse(input).context.workItem.id, "principal");
  assert.equal(context.recentWorkItems.length, 100);
});

test("no asigna tickets a un ciclo cuando exceden la capacidad", async () => {
  let assigned = 0;
  const plane = {
    listCycleWorkItems: async () => [{ id: "existing", estimate_point: 5 }],
    getWorkItem: async () => ({ id: "new", estimate_point: 3 }),
    addToCycle: async () => { assigned++; },
  };
  const action = { type: "add_to_cycle", cycleId: "cycle-1", workItemId: "new" };
  const processor = new Processor({ config: { cycleCapacityPoints: 7 }, queue: {}, plane, llm: {} });
  await assert.rejects(() => processor.execute("project-1", "delivery", action), /capacidad/);
  assert.equal(assigned, 0);
  processor.config.cycleCapacityPoints = 8;
  await processor.execute("project-1", "delivery", action);
  assert.equal(assigned, 1);
});

test("el límite diario difiere el ticket sin darlo por procesado", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "plane-agent-limit-"));
  try {
    const queue = new FileQueue(dir);
    await queue.init();
    const plane = {
      getWorkItem: async () => ({ id: "work-1" }), listWorkItems: async () => [], listLabels: async () => [],
      listStates: async () => [], listModules: async () => [], listCycles: async () => [], listMembers: async () => [],
    };
    const config = { plane: { projectId: "project-1" }, processUpdates: false, maxDailyLlmCalls: 0,
      issueCooldownMs: 0, maxAttempts: 2, retryBaseMs: 0 };
    const processor = new Processor({ config, queue, plane, llm: { complete: async (_system, _input, reserve) => { await reserve(); throw new Error("No debe llamar al LLM"); } } });
    await queue.enqueue("delivery-limit", { event: "issue", action: "created", data: { id: "work-1", project: "project-1" } });
    assert.equal((await processor.work(await queue.claim())).status, "pending");
    const pending = JSON.parse(await fs.readFile(queue.file("pending", "delivery-limit"), "utf8"));
    assert.ok(pending.availableAt > Date.now());
    assert.equal((await fs.readdir(queue.paths.processed)).length, 0);
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});

test("una caída transitoria del LLM permanece en cola después del máximo normal de intentos", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "plane-agent-outage-"));
  try {
    const queue = new FileQueue(dir);
    await queue.init();
    const plane = {
      getWorkItem: async () => ({ id: "work-1" }), listWorkItems: async () => [], listLabels: async () => [],
      listStates: async () => [], listModules: async () => [], listCycles: async () => [], listMembers: async () => [],
    };
    const llm = { complete: async () => { const error = new Error("LLM HTTP 503"); error.status = 503; throw error; } };
    const config = { plane: { projectId: "project-1" }, processUpdates: false, maxDailyLlmCalls: 50,
      issueCooldownMs: 0, maxAttempts: 2, retryBaseMs: 0 };
    const processor = new Processor({ config, queue, plane, llm });
    await queue.enqueue("delivery-outage", { event: "issue", action: "created", data: { id: "work-1", project: "project-1" } });
    for (let attempt = 0; attempt < 3; attempt++) {
      assert.equal((await processor.work(await queue.claim())).status, "pending");
    }
    assert.equal((await fs.readdir(queue.paths["dead-letter"])).length, 0);
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});
