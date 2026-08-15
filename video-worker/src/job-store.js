import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { safeError } from './security.js';

const ACTIVE = new Set(['synthesizing', 'rendering']);

export class JobStore {
  constructor(config) {
    this.config = config;
    this.jobs = new Map();
  }

  async init() {
    await Promise.all([
      fs.mkdir(this.config.jobDir, { recursive: true }),
      fs.mkdir(this.config.mediaDir, { recursive: true }),
      fs.mkdir(this.config.workDir, { recursive: true }),
    ]);
    const files = await fs.readdir(this.config.jobDir, { withFileTypes: true });
    for (const file of files) {
      if (!file.isFile() || !file.name.endsWith('.json')) continue;
      try {
        const job = JSON.parse(await fs.readFile(path.join(this.config.jobDir, file.name), 'utf8'));
        if (!job || typeof job.id !== 'string' || !job.request) continue;
        if (ACTIVE.has(job.status)) {
          job.status = 'queued';
          job.progress = { stage: 'queued', current: 0, total: 0 };
          job.error = null;
          job.updatedAt = new Date().toISOString();
          await this.write(job);
        }
        this.jobs.set(job.id, job);
      } catch (error) {
        console.error('Skipping unreadable job metadata:', safeError(error));
      }
    }
    await this.prune();
    return this;
  }

  async create(request) {
    await this.prune();
    const now = new Date().toISOString();
    const job = {
      id: `vid_${crypto.randomBytes(16).toString('base64url')}`,
      status: 'queued',
      request,
      createdAt: now,
      updatedAt: now,
      progress: { stage: 'queued', current: 0, total: 0 },
      error: null,
      output: null,
    };
    this.jobs.set(job.id, job);
    await this.write(job);
    return job;
  }

  get(id) {
    return this.jobs.get(id) || null;
  }

  listQueued() {
    return [...this.jobs.values()]
      .filter((job) => job.status === 'queued')
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  countPending() {
    return [...this.jobs.values()].filter((job) => ['queued', 'synthesizing', 'rendering'].includes(job.status)).length;
  }

  counts() {
    const counts = { queued: 0, synthesizing: 0, rendering: 0, ready: 0, failed: 0 };
    for (const job of this.jobs.values()) if (Object.hasOwn(counts, job.status)) counts[job.status]++;
    return counts;
  }

  async update(id, changes) {
    const job = this.get(id);
    if (!job) throw new Error('Job not found');
    Object.assign(job, changes, { updatedAt: new Date().toISOString() });
    await this.write(job);
    return job;
  }

  async write(job) {
    const target = path.join(this.config.jobDir, `${job.id}.json`);
    const temporary = `${target}.${process.pid}.tmp`;
    await fs.writeFile(temporary, `${JSON.stringify(job, null, 2)}\n`, { mode: 0o600 });
    await fs.rename(temporary, target);
  }

  async prune(now = Date.now()) {
    const cutoff = now - this.config.retentionDays * 24 * 60 * 60 * 1000;
    for (const [id, job] of this.jobs) {
      if (!['ready', 'failed'].includes(job.status) || Date.parse(job.updatedAt) >= cutoff) continue;
      this.jobs.delete(id);
      await Promise.allSettled([
        fs.rm(path.join(this.config.jobDir, `${id}.json`), { force: true }),
        job.output ? fs.rm(job.output, { force: true }) : Promise.resolve(),
      ]);
    }
  }
}
