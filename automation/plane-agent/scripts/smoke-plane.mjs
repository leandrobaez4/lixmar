import assert from "node:assert/strict";
import { loadConfig } from "../src/config.mjs";
import { PlaneClient, rows } from "../src/plane-client.mjs";

const { plane: settings } = loadConfig();
const plane = new PlaneClient(settings);
const projectId = settings.projectId;

const [items, states, labels, modules, cycles, members] = await Promise.all([
  plane.listWorkItems(projectId),
  plane.listStates(projectId),
  plane.listLabels(projectId),
  plane.listModules(projectId),
  plane.listCycles(projectId),
  plane.listMembers(projectId),
]);

for (const [name, response] of Object.entries({ items, states, labels, modules, cycles, members })) {
  assert.ok(Array.isArray(rows(response)), `${name} debe devolver una lista`);
}
assert.ok(rows(states).length > 0, "El proyecto debe tener estados");

for (const cycle of rows(cycles)) {
  const membersOfCycle = await plane.listCycleWorkItems(projectId, cycle.id);
  assert.ok(Array.isArray(rows(membersOfCycle)), "La lectura de tickets de ciclo debe devolver una lista");
}

if (rows(items).length > 0) {
  const item = await plane.getWorkItem(projectId, rows(items)[0].id);
  assert.equal(item.id, rows(items)[0].id, "La lectura de un ticket debe coincidir con la lista");
}

console.log(JSON.stringify({
  ok: true,
  workItems: rows(items).length,
  states: rows(states).length,
  labels: rows(labels).length,
  modules: rows(modules).length,
  cycles: rows(cycles).length,
  members: rows(members).length,
}));
