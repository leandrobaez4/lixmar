import { loadConfig } from "../src/config.mjs";
import { LlmGateway } from "../src/llm.mjs";
import { systemPrompt } from "../src/processor.mjs";
import { validatePlan } from "../src/policy.mjs";

const config = loadConfig();
const llm = new LlmGateway(config.llm, config.llmFallback);
const cases = [
  { name: "checkout_interrumpido", title: "El checkout falla para todos los compradores", description: "Ningún comprador puede finalizar una orden desde esta mañana.", expectedPriority: "urgent" },
  { name: "error_visual", title: "Corregir espaciado de un icono en ajustes", description: "El icono está unos píxeles desalineado, sin impacto funcional.", expectedPriority: "low" },
  { name: "duplicado", title: "El checkout falla para todos los compradores", description: "Nadie puede finalizar una orden.", existingTitle: "El checkout falla para todos los compradores", expectDuplicate: true },
];

const output = [];
for (const scenario of cases) {
  const context = {
    workItem: { id: "ticket-evaluado", name: scenario.title, description: scenario.description, priority: "none", state: "backlog", labels: [], assignees: [] },
    recentWorkItems: scenario.existingTitle ? [{ id: "ticket-existente", sequence_id: 7, name: scenario.existingTitle, priority: "urgent", state: "backlog", labels: [] }] : [],
    labels: [{ id: "label-bug", name: "bug" }, { id: "label-ux", name: "ux" }], states: [], modules: [], cycles: [], members: [],
  };
  try {
    const completion = await llm.complete(systemPrompt, JSON.stringify({ event: { event: "issue", action: "create" }, context }));
    const plan = validatePlan(completion.value, context, config.actionModes);
    const priority = plan.actions.find((action) => action.type === "update_work_item")?.fields.priority ?? null;
    const duplicate = /duplicad|misma incidencia|ya existe/i.test(JSON.stringify(plan));
    output.push({
      case: scenario.name,
      passed: scenario.expectDuplicate ? duplicate : priority === scenario.expectedPriority,
      proposedPriority: priority,
      duplicateDetected: duplicate,
      provider: completion.provider,
      model: completion.model,
    });
  } catch (error) {
    output.push({ case: scenario.name, passed: false, error: error.name });
  }
}

console.log(JSON.stringify({ passed: output.filter((item) => item.passed).length, total: output.length, cases: output }, null, 2));
if (output.some((item) => !item.passed)) process.exitCode = 1;
