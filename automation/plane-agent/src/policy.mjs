import { escapeHtml } from "./util.mjs";

const priorities = new Set(["none", "urgent", "high", "medium", "low"]);
const updateFields = new Set(["name", "description_html", "state", "priority", "assignees", "labels", "estimate_point", "start_date", "target_date"]);
const createFields = new Set(["name", "description_html", "priority", "labels", "estimate_point"]);

const object = (value, message) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(message);
  return value;
};

function allowedFields(fields, allowed) {
  const clean = {};
  for (const [key, value] of Object.entries(object(fields, "fields debe ser un objeto"))) {
    if (!allowed.has(key)) throw new Error(`Campo no permitido: ${key}`);
    clean[key] = value;
  }
  if (clean.priority && !priorities.has(clean.priority)) throw new Error(`Prioridad inválida: ${clean.priority}`);
  if (clean.estimate_point != null && (!Number.isInteger(Number(clean.estimate_point)) || Number(clean.estimate_point) < 0 || Number(clean.estimate_point) > 7)) throw new Error("estimate_point debe estar entre 0 y 7");
  for (const key of ["labels", "assignees"]) if (clean[key] && !Array.isArray(clean[key])) throw new Error(`${key} debe ser un array`);
  if (clean.description_html) clean.description_html = `<p>${escapeHtml(clean.description_html).replaceAll("\n", "<br>")}</p>`;
  return clean;
}

export function validatePlan(plan, context, actionModes) {
  object(plan, "El plan debe ser un objeto");
  if (!Array.isArray(plan.actions)) throw new Error("El plan debe contener actions[]");
  if (plan.actions.length > 10) throw new Error("El plan supera el máximo de 10 acciones");
  const ids = {
    label: new Set(context.labels.map((x) => x.id)), state: new Set(context.states.map((x) => x.id)),
    module: new Set(context.modules.map((x) => x.id)), cycle: new Set(context.cycles.map((x) => x.id)),
    member: new Set(context.members.map((x) => x.member?.id ?? x.id)),
  };
  const allowedWorkItems = new Set([context.workItem.id]);
  const actions = plan.actions.map((raw, index) => {
    const action = object(raw, `Acción ${index} inválida`);
    if (!actionModes[action.type]) throw new Error(`Acción no soportada: ${action.type}`);
    const clean = { type: action.type, reason: String(action.reason ?? "").slice(0, 500), mode: actionModes[action.type] };
    if (action.type === "update_work_item") {
      clean.workItemId = action.workItemId || context.workItem.id;
      clean.fields = allowedFields(action.fields, updateFields);
      if (!Object.keys(clean.fields).length) throw new Error("update_work_item requiere cambios");
    } else if (action.type === "create_work_item" || action.type === "create_subtask") {
      clean.fields = allowedFields(action.fields, createFields);
      if (!clean.fields.name) throw new Error(`${action.type} requiere name`);
      if (action.type === "create_subtask") clean.parentWorkItemId = context.workItem.id;
    } else if (action.type === "add_comment") {
      clean.workItemId = action.workItemId || context.workItem.id;
      clean.commentHtml = `<p>${escapeHtml(String(action.commentText ?? action.commentHtml ?? "").slice(0, 10000)).replaceAll("\n", "<br>")}</p>`;
      if (clean.commentHtml === "<p></p>") throw new Error("add_comment requiere commentText");
    } else if (action.type === "add_to_module") {
      clean.workItemId = action.workItemId || context.workItem.id; clean.moduleId = action.moduleId;
      if (!ids.module.has(clean.moduleId)) throw new Error("moduleId no pertenece al proyecto");
    } else if (action.type === "add_to_cycle") {
      clean.workItemId = action.workItemId || context.workItem.id; clean.cycleId = action.cycleId;
      if (!ids.cycle.has(clean.cycleId)) throw new Error("cycleId no pertenece al proyecto");
    }
    const fields = clean.fields ?? {};
    if (clean.workItemId && !allowedWorkItems.has(clean.workItemId)) throw new Error("workItemId no es el ticket del evento");
    if (fields.state && !ids.state.has(fields.state)) throw new Error("state no pertenece al proyecto");
    if (fields.state) {
      clean.mode = "approval";
    }
    if (fields.labels?.some((id) => !ids.label.has(id))) throw new Error("Una etiqueta no pertenece al proyecto");
    if (fields.assignees?.some((id) => !ids.member.has(id))) throw new Error("Un responsable no pertenece al proyecto");
    // Plane replaces these arrays on PATCH. Preserve manual assignments and labels.
    for (const key of ["labels", "assignees"]) {
      if (!fields[key]) continue;
      const previous = (context.workItem[key] ?? []).map((entry) => typeof entry === "object" ? entry.id : entry);
      fields[key] = [...new Set([...previous, ...fields[key]])];
    }
    return clean;
  });
  return { summary: String(plan.summary ?? "").slice(0, 1000), actions };
}
