export class PlaneClient {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.workspace = config.workspace;
  }

  async request(path, { method = "GET", body } = {}) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: { "x-api-key": this.apiKey, "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    // Do not include the response body in errors or audit logs: it may contain secrets.
    if (!response.ok) throw new Error(`Plane ${method} ${path}: HTTP ${response.status}`);
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  projectPath(projectId, suffix = "") {
    return `/api/v1/workspaces/${encodeURIComponent(this.workspace)}/projects/${encodeURIComponent(projectId)}${suffix}`;
  }

  async listAll(path) {
    const results = [];
    const cursors = new Set();
    let cursor = null;
    for (let page = 0; page < 100; page++) {
      const response = await this.request(cursor ? `${path}&cursor=${encodeURIComponent(cursor)}` : path);
      results.push(...rows(response));
      if (!response?.next_page_results || !response.next_cursor) return { results };
      if (cursors.has(response.next_cursor)) throw new Error("Plane devolvió un cursor repetido");
      cursors.add(response.next_cursor);
      cursor = response.next_cursor;
    }
    throw new Error("La lista de Plane excede 100 páginas");
  }

  getWorkItem(projectId, workItemId) { return this.request(this.projectPath(projectId, `/work-items/${workItemId}/?expand=labels,state,assignees,module`)); }
  listWorkItems(projectId) { return this.listAll(this.projectPath(projectId, "/work-items/?per_page=100&expand=labels,state,assignees,module")); }
  listLabels(projectId) { return this.request(this.projectPath(projectId, "/labels/")); }
  listStates(projectId) { return this.request(this.projectPath(projectId, "/states/")); }
  listModules(projectId) { return this.request(this.projectPath(projectId, "/modules/")); }
  listCycles(projectId) { return this.request(this.projectPath(projectId, "/cycles/")); }
  listCycleWorkItems(projectId, cycleId) { return this.listAll(this.projectPath(projectId, `/cycles/${cycleId}/cycle-issues/?per_page=100`)); }
  listMembers(projectId) { return this.request(this.projectPath(projectId, "/members/")); }
  updateWorkItem(projectId, id, fields) { return this.request(this.projectPath(projectId, `/work-items/${id}/`), { method: "PATCH", body: fields }); }
  createWorkItem(projectId, fields) { return this.request(this.projectPath(projectId, "/work-items/"), { method: "POST", body: fields }); }
  addComment(projectId, id, html, externalId) {
    return this.request(this.projectPath(projectId, `/work-items/${id}/comments/`), { method: "POST", body: { comment_html: html, comment_json: {}, access: "INTERNAL", external_source: "lixmar-plane-agent", external_id: externalId } });
  }
  addToModule(projectId, moduleId, workItemId) { return this.request(this.projectPath(projectId, `/modules/${moduleId}/module-issues/`), { method: "POST", body: { issues: [workItemId] } }); }
  addToCycle(projectId, cycleId, workItemId) { return this.request(this.projectPath(projectId, `/cycles/${cycleId}/cycle-issues/`), { method: "POST", body: { issues: [workItemId] } }); }
}

export function rows(value) {
  if (Array.isArray(value)) return value;
  return Array.isArray(value?.results) ? value.results : [];
}
