import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

function lockError(message, code = 'WORKER_LOCKED') {
  const error = new Error(message);
  error.code = code;
  error.status = 503;
  error.publicMessage = 'Видеосервис обновляется. Повторите попытку позже.';
  return error;
}

function startupAbortError() {
  return lockError('Video worker startup was cancelled', 'WORKER_STARTUP_ABORTED');
}

async function delay(milliseconds, signal) {
  if (signal?.aborted) throw startupAbortError();
  await new Promise((resolve, reject) => {
    let timer;
    const cleanup = () => signal?.removeEventListener('abort', onAbort);
    const finish = () => {
      cleanup();
      resolve();
    };
    const onAbort = () => {
      clearTimeout(timer);
      cleanup();
      reject(startupAbortError());
    };
    timer = setTimeout(finish, milliseconds);
    signal?.addEventListener('abort', onAbort, { once: true });
    if (signal?.aborted) onAbort();
  });
}

export class WorkerLock {
  constructor(config) {
    this.lockDir = path.join(config.dataDir, 'worker.lock');
    this.token = crypto.randomBytes(24).toString('base64url');
    this.waitMs = config.workerLockWaitMs || 0;
    this.heartbeatMs = config.workerLockHeartbeatMs || 10_000;
    this.timer = null;
    this.held = false;
  }

  async owner() {
    try {
      return JSON.parse(await fs.readFile(path.join(this.lockDir, 'owner.json'), 'utf8'));
    } catch {
      return null;
    }
  }

  async writeHeartbeat() {
    const owner = { token: this.token, heartbeatAt: new Date().toISOString() };
    const target = path.join(this.lockDir, 'owner.json');
    const temporary = path.join(this.lockDir, `owner.${this.token}.tmp`);
    await fs.writeFile(temporary, `${JSON.stringify(owner)}\n`, { mode: 0o600 });
    await fs.rename(temporary, target);
  }

  async acquire(options = {}) {
    const { signal } = options;
    if (signal?.aborted) throw startupAbortError();
    await fs.mkdir(path.dirname(this.lockDir), { recursive: true });
    const deadline = Date.now() + this.waitMs;
    while (true) {
      try {
        await fs.mkdir(this.lockDir, { mode: 0o700 });
        try {
          if (signal?.aborted) throw startupAbortError();
          await this.writeHeartbeat();
          if (signal?.aborted) throw startupAbortError();
          this.held = true;
          this.timer = setInterval(() => {
            this.assertOwnership()
              .then(() => this.writeHeartbeat())
              .catch(() => { this.held = false; });
          }, this.heartbeatMs);
          this.timer.unref();
          return this;
        } catch (error) {
          await fs.rm(this.lockDir, { recursive: true, force: true }).catch(() => {});
          throw error;
        }
      } catch (error) {
        if (error.code !== 'EEXIST') throw error;
      }
      if (Date.now() >= deadline) throw lockError('Another video worker owns the persistent volume');
      await delay(1000, signal);
    }
  }

  async assertOwnership() {
    if (!this.held) throw lockError('Video worker lock is not held', 'WORKER_LOCK_LOST');
    const owner = await this.owner();
    if (!owner || owner.token !== this.token) {
      this.held = false;
      throw lockError('Video worker lock ownership was lost', 'WORKER_LOCK_LOST');
    }
  }

  async release() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    const owner = await this.owner();
    if (owner && owner.token === this.token) {
      await fs.rm(this.lockDir, { recursive: true, force: true });
    }
    this.held = false;
  }
}
