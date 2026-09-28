import test from "node:test";
import assert from "node:assert/strict";
import { validatePlan } from "../src/policy.mjs";

const context = {
  workItem: { id: "item-1" }, labels: [{ id: "label-1" }], states: [{ id: "state-1" }],
  modules: [{ id: "module-1" }], cycles: [{ id: "cycle-1" }], members: [{ member: { id: "member-1" } }],
};
const modes = { update_work_item: "auto", add_comment: "auto", create_work_item: "approval", create_subtask: "approval", add_to_module: "approval", add_to_cycle: "approval" };

test("acepta cambios limitados a recursos existentes", () => {
  const plan = validatePlan({ summary: "clasificar", actions: [{ type: "update_work_item", fields: { priority: "high", labels: ["label-1"], state: "state-1" } }] }, context, modes);
  assert.equal(plan.actions[0].workItemId, "item-1");
  assert.equal(plan.actions[0].mode, "approval");
});

test("mantiene automática la actualización sin cambio de estado", () => {
  const plan = validatePlan({ actions: [{ type: "update_work_item", fields: { priority: "high" } }] }, context, modes);
  assert.equal(plan.actions[0].mode, "auto");
});

test("rechaza IDs inventados y campos peligrosos", () => {
  assert.throws(() => validatePlan({ actions: [{ type: "update_work_item", fields: { labels: ["inventada"] } }] }, context, modes), /etiqueta/);
  assert.throws(() => validatePlan({ actions: [{ type: "update_work_item", fields: { deleted_at: "now" } }] }, context, modes), /Campo no permitido/);
  assert.throws(() => validatePlan({ actions: [{ type: "add_comment", workItemId: "otro", commentText: "hola" }] }, context, modes), /workItemId/);
});

test("escapa HTML generado por el modelo", () => {
  const plan = validatePlan({ actions: [{ type: "add_comment", commentText: "<script>malicioso</script>" }] }, context, modes);
  assert.equal(plan.actions[0].commentHtml, "<p>&lt;script&gt;malicioso&lt;/script&gt;</p>");
});

test("vincula las subtareas al ticket del evento sin aceptar un parent del modelo", () => {
  const plan = validatePlan({ actions: [{ type: "create_subtask", fields: {
    name: "Parte verificable", description_html: "<b>criterio</b>", priority: "high",
  } }] }, context, modes);
  assert.equal(plan.actions[0].parentWorkItemId, "item-1");
  assert.equal(plan.actions[0].mode, "approval");
  assert.equal("parent" in plan.actions[0].fields, false);
  assert.equal(plan.actions[0].fields.description_html, "<p>&lt;b&gt;criterio&lt;/b&gt;</p>");
  assert.throws(() => validatePlan({ actions: [{ type: "create_subtask", fields: {
    name: "Parte verificable", parent: "inventado",
  } }] }, context, modes), /Campo no permitido/);
});

test("conserva etiquetas y responsables existentes al añadir otros", () => {
  const existing = {
    ...context,
    workItem: { id: "item-1", labels: ["label-manual"], assignees: ["member-manual"] },
    labels: [...context.labels, { id: "label-manual" }],
    members: [...context.members, { member: { id: "member-manual" } }],
  };
  const plan = validatePlan({ actions: [{ type: "update_work_item", fields: {
    labels: ["label-1"], assignees: ["member-1"],
  } }] }, existing, modes);
  assert.deepEqual(plan.actions[0].fields.labels, ["label-manual", "label-1"]);
  assert.deepEqual(plan.actions[0].fields.assignees, ["member-manual", "member-1"]);
});
