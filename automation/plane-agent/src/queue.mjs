import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { stableId } from "./util.mjs";

const writeJsonAtomic = async (file, value) => {
  const temporary = `${file}.${randomUUID()}.tmp`;
  await fs.writeFile(temporary, JSON.stringify(value, null, 2), { flag: "wx", mode: 0o600 });
  await fs.rename(temporary, file);
};

export class FileQueue {
  constructor(root) {
    this.root = root;
    this.enqueuing = new Set();
    this.paths = Object.fromEntries(["pending", "processing", "processed", "dead-letter", "approvals", "approved", "audit", "cooldowns", "writes", "limits"].map((name) => [name, path.join(root, name)]));
  }

  async init() {
    await fs.mkdir(this.root, { recursive: true, mode: 0o700 });
    await fs.chmod(this.root, 0o700);
    await Promise.all(Object.values(this.paths).map(async (dir) => {
      await fs.mkdir(dir, { recursive: true, mode: 0o700 });
      await fs.chmod(dir, 0o700);
      const entries = await fs.readdir(dir, { withFileTypes: true });
      await Promise.all(entries.filter((entry) => entry.isFile()).map((entry) => fs.chmod(path.join(dir, entry.name), 0o600)));
    }));
    const interrupted = await fs.readdir(this.paths.processing);
    await Promise.all(interrupted.filter((name) => name.endsWith(".json")).map((name) => fs.rename(path.join(this.paths.processing, name), path.join(this.paths.pending, name))));
  }

  file(bucket, id) {
    return path.join(this.paths[bucket], `${stableId(id)}.json`);
  }

  async exists(bucket, id) {
    try { await fs.access(this.file(bucket, id)); return true; } catch { return false; }
  }

  async enqueue(deliveryId, payload, headers = {}) {
    // Serialize concurrent requests for the same delivery within this worker.
    if (this.enqueuing.has(deliveryId)) return false;
    this.enqueuing.add(deliveryId);
    try {
      for (const bucket of ["pending", "processing", "processed", "dead-letter"]) {
        if (await this.exists(bucket, deliveryId)) return false;
      }
      await writeJsonAtomic(this.file("pending", deliveryId), {
        deliveryId, payload, headers, attempts: 0, availableAt: Date.now(), receivedAt: new Date().toISOString(),
      });
      return true;
    } finally {
      this.enqueuing.delete(deliveryId);
    }
  }

  async claim() {
    const names = (await fs.readdir(this.paths.pending)).filter((name) => name.endsWith(".json")).sort();
    for (const name of names) {
      const pending = path.join(this.paths.pending, name);
      let job;
      try { job = JSON.parse(await fs.readFile(pending, "utf8")); } catch { continue; }
      if (job.availableAt > Date.now()) continue;
      const processing = path.join(this.paths.processing, name);
      try { await fs.rename(pending, processing); } catch { continue; }
      return { ...job, _file: name };
    }
    return null;
  }

  async complete(job, result) {
    await writeJsonAtomic(this.file("processed", job.deliveryId), { ...job, _file: undefined, completedAt: new Date().toISOString(), result });
    await fs.rm(path.join(this.paths.processing, job._file), { force: true });
  }

  async retry(job, error, maxAttempts, retryBaseMs, delayOverrideMs) {
    const attempts = job.attempts + 1;
    const delay = delayOverrideMs ?? Math.min(retryBaseMs * (2 ** Math.min(10, Math.max(0, attempts - 1))), 60 * 60 * 1000);
    const value = { ...job, _file: undefined, attempts, lastError: error, availableAt: Date.now() + delay };
    const target = attempts >= maxAttempts ? "dead-letter" : "pending";
    await writeJsonAtomic(this.file(target, job.deliveryId), value);
    await fs.rm(path.join(this.paths.processing, job._file), { force: true });
    return target;
  }

  async writeApproval(deliveryId, value) {
    await writeJsonAtomic(this.file("approvals", deliveryId), value);
  }

  async readApproval(deliveryId) {
    return JSON.parse(await fs.readFile(this.file("approvals", deliveryId), "utf8"));
  }

  async completeApproval(deliveryId, value) {
    await writeJsonAtomic(this.file("approved", deliveryId), value);
    await fs.rm(this.file("approvals", deliveryId), { force: true });
  }

  async appendAudit(deliveryId, value) {
    const file = path.join(this.paths.audit, `${new Date().toISOString().slice(0, 10)}.jsonl`);
    await fs.appendFile(file, `${JSON.stringify({ at: new Date().toISOString(), deliveryId, ...value })}\n`, { mode: 0o600 });
  }

  async inCooldown(issueId, durationMs) {
    if (!issueId || durationMs === 0) return false;
    const file = this.file("cooldowns", issueId);
    try {
      const value = JSON.parse(await fs.readFile(file, "utf8"));
      return Date.now() - value.at < durationMs;
    } catch { return false; }
  }

  async markCooldown(issueId) {
    if (issueId) await writeJsonAtomic(this.file("cooldowns", issueId), { issueId, at: Date.now() });
  }

  async beginWrite(deliveryId, index, metadata = {}) {
    const file = this.file("writes", `${deliveryId}:${index}`);
    try {
      await fs.writeFile(file, JSON.stringify({ deliveryId, index, status: "started", at: new Date().toISOString(), ...metadata }), { flag: "wx", mode: 0o600 });
      return true;
    } catch (error) {
      if (error.code === "EEXIST") return false;
      throw error;
    }
  }

  async finishWrite(deliveryId, index) {
    const record = await this.readWrite(deliveryId, index);
    await this.setWrite(deliveryId, index, { ...record, status: "completed", completedAt: new Date().toISOString() });
  }

  async readWrite(deliveryId, index) {
    return JSON.parse(await fs.readFile(this.file("writes", `${deliveryId}:${index}`), "utf8"));
  }

  async setWrite(deliveryId, index, value) {
    await writeJsonAtomic(this.file("writes", `${deliveryId}:${index}`), value);
  }

  async reserveLlmCall(maxDailyCalls) {
    const day = new Date().toISOString().slice(0, 10);
    const file = this.file("limits", day);
    let count = 0;
    try { count = JSON.parse(await fs.readFile(file, "utf8")).count; }
    catch (error) { if (error.code !== "ENOENT") throw error; }
    if (count >= maxDailyCalls) return false;
    await writeJsonAtomic(file, { day, count: count + 1 });
    return true;
  }
}
