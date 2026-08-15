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

async function delay(milliseconds) {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export class WorkerLock {
  constructor(config) {
    this.lockDir = path.join(config.dataDir, 'worker.lock');
    this.token = crypto.randomBytes(24).toString('base64url');
    this.staleMs = config.workerLockStaleMs || 90_000;
    this.waitMs = config.workerLockWaitMs || 0;
    this.heartbeatMs = Math.max(5000, Math.floor(this.staleMs / 3));
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

  async acquire() {
    await fs.mkdir(path.dirname(this.lockDir), { recursive: true });
    const deadline = Date.now() + this.waitMs;
    while (true) {
      try {
        await fs.mkdir(this.lockDir, { mode: 0o700 });
        await this.writeHeartbeat();
        this.held = true;
        this.timer = setInterval(() => {
          this.assertOwnership()
            .then(() => this.writeHeartbeat())
            .catch(() => { this.held = false; });
        }, this.heartbeatMs);
        this.timer.unref();
        return this;
      } catch (error) {
        if (error.code !== 'EEXIST') throw error;
      }

      const owner = await this.owner();
      let age = owner ? Date.now() - Date.parse(owner.heartbeatAt) : 0;
      if (!owner) {
        const stat = await fs.stat(this.lockDir).catch(() => null);
        age = stat ? Date.now() - stat.mtimeMs : 0;
      }
      if (Number.isFinite(age) && age > this.staleMs) {
        const quarantine = `${this.lockDir}.stale-${crypto.randomBytes(8).toString('hex')}`;
        try {
          await fs.rename(this.lockDir, quarantine);
          await fs.rm(quarantine, { recursive: true, force: true });
          continue;
        } catch (error) {
          if (!['ENOENT', 'EEXIST'].includes(error.code)) throw error;
        }
      }
      if (Date.now() >= deadline) throw lockError('Another video worker owns the persistent volume');
      await delay(1000);
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
