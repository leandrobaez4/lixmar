import test from "node:test";
import assert from "node:assert/strict";
import { PlaneClient, rows } from "../src/plane-client.mjs";

test("lee todas las páginas de tickets de ciclo antes de calcular capacidad", async () => {
  const original = globalThis.fetch;
  const urls = [];
  globalThis.fetch = async (url) => {
    urls.push(String(url));
    return Response.json(urls.length === 1
      ? { results: [{ id: "one" }], next_page_results: true, next_cursor: "1:1:0" }
      : { results: [{ id: "two" }], next_page_results: false, next_cursor: null });
  };
  try {
    const client = new PlaneClient({ baseUrl: "https://plane.example", apiKey: "test", workspace: "lixmar" });
    assert.deepEqual(rows(await client.listCycleWorkItems("project", "cycle")).map((item) => item.id), ["one", "two"]);
    assert.match(urls[1], /cursor=1%3A1%3A0/);
  } finally { globalThis.fetch = original; }
});

test("lee todas las páginas de tickets del proyecto para detectar duplicados antiguos", async () => {
  const original = globalThis.fetch;
  const urls = [];
  globalThis.fetch = async (url) => {
    urls.push(String(url));
    return Response.json(urls.length === 1
      ? { results: [{ id: "new" }], next_page_results: true, next_cursor: "page:2" }
      : { results: [{ id: "old" }], next_page_results: false, next_cursor: null });
  };
  try {
    const client = new PlaneClient({ baseUrl: "https://plane.example", apiKey: "test", workspace: "lixmar" });
    assert.deepEqual(rows(await client.listWorkItems("project")).map((item) => item.id), ["new", "old"]);
    assert.match(urls[1], /cursor=page%3A2/);
  } finally { globalThis.fetch = original; }
});
