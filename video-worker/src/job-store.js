import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { safeError } from './security.js';

const ACTIVE = new Set(['synthesizing', 'rendering']);
const PENDING = new Set(['queued', ...ACTIVE]);
const JOB_ID = /^vid_[A-Za-z0-9_-]{20,40}$/;

function storeError(message, code, status, publicMessage) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  error.publicMessage = publicMessage;
  return error;
}

function digest(value) {
  return crypto.createHash('sha256').update(String(value), 'utf8').digest('hex');
}

function sameRequest(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export class JobStore {
  constructor(config, options = {}) {
    this.config = config;
    this.lock = options.lock || null;
    this.jobs = new Map();
    this.admissionTail = Promise.resolve();
    this.persistenceHealthy = true;
  }

  expectedOutput(id) {
    return path.join(this.config.mediaDir, `${id}.mp4`);
  }

  async assertOwnership() {
    if (this.lock) await this.lock.assertOwnership();
  }

  async init() {
    await this.assertOwnership();
    if (this.lock) await fs.rm(this.config.workDir, { recursive: true, force: true });
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
        if (!job || !JOB_ID.test(job.id) || file.name !== `${job.id}.json` || !job.request) continue;
        if (job.output && path.resolve(job.output) !== path.resolve(this.expectedOutput(job.id))) job.output = null;
        if (ACTIVE.has(job.status)) {
          job.status = 'queued';
          job.progress = { stage: 'queued', current: 0, total: 0 };
          job.errorCode = null;
          job.attemptId = null;
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

  async serializedAdmission(operation) {
    const result = this.admissionTail.then(operation, operation);
    this.admissionTail = result.catch(() => {});
    return result;
  }

  async createPersisted(request, extra = {}) {
    const now = new Date().toISOString();
    const job = {
      id: `vid_${crypto.randomBytes(16).toString('base64url')}`,
      status: 'queued',
      request,
      createdAt: now,
      updatedAt: now,
      progress: { stage: 'queued', current: 0, total: 0 },
      errorCode: null,
      output: null,
      attemptId: null,
      ...extra,
    };
    await this.write(job);
    this.jobs.set(job.id, job);
    return job;
  }

  async create(request) {
    return this.serializedAdmission(async () => this.createPersisted(request));
  }

  async admit(request, idempotencyKey) {
    const idempotencyHash = digest(idempotencyKey);
    return this.serializedAdmission(async () => {
      await this.assertOwnership();
      const existing = [...this.jobs.values()].find((job) => job.idempotencyHash === idempotencyHash);
      if (existing) {
        if (!sameRequest(existing.request, request)) {
          throw storeError('Idempotency key was already used for another request', 'IDEMPOTENCY_CONFLICT', 409,
            'Этот идентификатор запроса уже использован с другими параметрами.');
        }
        return { job: existing, reused: true };
      }

      await this.prune();
      const now = Date.now();
      if (this.countPending() >= this.config.maxPendingJobs) {
        throw storeError('Pending job limit reached', 'PENDING_LIMIT', 429, 'Очередь заполнена. Попробуйте позже.');
      }
      const hourCutoff = now - 60 * 60 * 1000;
      const recentJobs = [...this.jobs.values()].filter((job) => Date.parse(job.createdAt) >= hourCutoff).length;
      if (recentJobs >= this.config.maxJobsPerHour) {
        throw storeError('Hourly job budget reached', 'HOURLY_JOB_BUDGET', 429,
          'Достигнут часовой лимит создания видео. Попробуйте позже.');
      }
      const today = new Date(now).toISOString().slice(0, 10);
      const reservedToday = [...this.jobs.values()]
        .filter((job) => String(job.createdAt).slice(0, 10) === today)
        .reduce((total, job) => total + Number(job.reservedTtsCharacters || 0), 0);
      if (reservedToday + this.config.maxTtsCharactersPerJob > this.config.dailyTtsCharacterBudget) {
        throw storeError('Daily TTS budget reached', 'DAILY_TTS_BUDGET', 429,
          'Достигнут дневной лимит озвучки. Новое видео можно создать после обновления лимита.');
      }
      const retained = await this.retainedBytes();
      const reservedOutputs = this.countPending() * this.config.maxOutputBytes;
      if (retained + reservedOutputs + this.config.maxOutputBytes > this.config.maxRetainedBytes) {
        throw storeError('Persistent media quota reached', 'MEDIA_QUOTA', 507,
          'Хранилище видео заполнено. Удалите старые ролики или увеличьте квоту.');
      }

      const job = await this.createPersisted(request, {
        idempotencyHash,
        reservedTtsCharacters: this.config.maxTtsCharactersPerJob,
      });
      return { job, reused: false };
    });
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
    return [...this.jobs.values()].filter((job) => PENDING.has(job.status)).length;
  }

  counts() {
    const counts = { queued: 0, synthesizing: 0, rendering: 0, ready: 0, failed: 0 };
    for (const job of this.jobs.values()) if (Object.hasOwn(counts, job.status)) counts[job.status]++;
    return counts;
  }

  health() {
    return { ok: this.persistenceHealthy && (!this.lock || this.lock.held) };
  }

  async update(id, changes) {
    await this.assertOwnership();
    const current = this.get(id);
    if (!current) throw new Error('Job not found');
    const job = { ...current, ...changes, updatedAt: new Date().toISOString() };
    await this.write(job);
    this.jobs.set(id, job);
    if (['queued', 'ready', 'failed'].includes(job.status)) {
      await this.removeAttemptMedia(job.id);
    }
    if (['queued', 'failed'].includes(job.status)) {
      await this.removePersistentFile(this.expectedOutput(job.id));
    }
    return job;
  }

  async write(job) {
    await this.assertOwnership();
    const target = path.join(this.config.jobDir, `${job.id}.json`);
    const temporary = `${target}.${process.pid}.${crypto.randomBytes(6).toString('hex')}.tmp`;
    try {
      await fs.writeFile(temporary, `${JSON.stringify(job, null, 2)}\n`, { mode: 0o600 });
      await fs.rename(temporary, target);
      this.persistenceHealthy = true;
    } catch (error) {
      this.persistenceHealthy = false;
      await fs.rm(temporary, { force: true }).catch(() => {});
      const wrapped = storeError(`Persistent job write failed: ${safeError(error)}`, 'PERSISTENCE_WRITE_FAILED', 507,
        'Не удалось сохранить задание. Проверьте постоянный диск видеосервиса.');
      wrapped.cause = error;
      throw wrapped;
    }
  }

  async retainedBytes() {
    let total = 0;
    const entries = await fs.readdir(this.config.mediaDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.mp4')) continue;
      const stat = await fs.stat(path.join(this.config.mediaDir, entry.name)).catch(() => null);
      if (stat && stat.isFile()) total += stat.size;
    }
    return total;
  }

  async removeOrphanedMedia() {
    const ready = new Set([...this.jobs.values()]
      .filter((job) => job.status === 'ready')
      .map((job) => path.basename(this.expectedOutput(job.id))));
    const activeAttempts = new Set([...this.jobs.values()]
      .filter((job) => ACTIVE.has(job.status) && job.attemptId)
      .map((job) => `${job.id}.${job.attemptId}.tmp.mp4`));
    const activeOutputs = new Set([...this.jobs.values()]
      .filter((job) => ACTIVE.has(job.status))
      .map((job) => path.basename(this.expectedOutput(job.id))));
    const entries = await fs.readdir(this.config.mediaDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.mp4')) continue;
      if (ready.has(entry.name) || activeAttempts.has(entry.name) || activeOutputs.has(entry.name)) continue;
      await this.removePersistentFile(path.join(this.config.mediaDir, entry.name));
    }
  }

  async removePersistentFile(target) {
    try {
      await fs.rm(target, { force: true });
    } catch (error) {
      this.persistenceHealthy = false;
      const wrapped = storeError(`Persistent cleanup failed: ${safeError(error)}`, 'PERSISTENCE_CLEANUP_FAILED', 507,
        'Не удалось очистить постоянное хранилище видео.');
      wrapped.cause = error;
      throw wrapped;
    }
  }

  async removeAttemptMedia(id) {
    const entries = await fs.readdir(this.config.mediaDir, { withFileTypes: true });
    const prefix = `${id}.`;
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.startsWith(prefix) || !entry.name.endsWith('.tmp.mp4')) continue;
      await this.removePersistentFile(path.join(this.config.mediaDir, entry.name));
    }
  }

  async removeCompleted(job) {
    await this.removeAttemptMedia(job.id);
    await this.removePersistentFile(this.expectedOutput(job.id));
    await this.removePersistentFile(path.join(this.config.jobDir, `${job.id}.json`));
    this.jobs.delete(job.id);
  }

  async prune(now = Date.now()) {
    await this.assertOwnership();
    const cutoff = now - this.config.retentionDays * 24 * 60 * 60 * 1000;
    const completed = [...this.jobs.values()]
      .filter((job) => ['ready', 'failed'].includes(job.status))
      .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
    for (const job of completed.filter((item) => Date.parse(item.updatedAt) < cutoff)) {
      await this.removeCompleted(job);
    }
    await this.removeOrphanedMedia();
    let retained = await this.retainedBytes();
    for (const job of completed) {
      if (retained <= this.config.maxRetainedBytes || !this.jobs.has(job.id)) continue;
      const stat = await fs.stat(this.expectedOutput(job.id)).catch(() => null);
      await this.removeCompleted(job);
      retained -= stat && stat.isFile() ? stat.size : 0;
    }
  }
}
