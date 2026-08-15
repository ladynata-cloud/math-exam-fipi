import { safeError } from './security.js';

export class JobQueue {
  constructor(store, processor) {
    this.store = store;
    this.processor = processor;
    this.pending = [];
    this.pendingIds = new Set();
    this.running = false;
    this.stopping = false;
    this.stopWaiters = [];
  }

  start() {
    for (const job of this.store.listQueued()) this.enqueue(job.id);
  }

  enqueue(id) {
    if (this.stopping) return;
    if (this.pendingIds.has(id)) return;
    this.pendingIds.add(id);
    this.pending.push(id);
    queueMicrotask(() => this.drain());
  }

  async drain() {
    if (this.running) return;
    this.running = true;
    try {
      while (this.pending.length) {
        const id = this.pending.shift();
        this.pendingIds.delete(id);
        const job = this.store.get(id);
        if (!job || job.status !== 'queued') continue;
        try {
          await this.store.assertOwnership();
          await this.processor(job, this.store);
        } catch (error) {
          console.error(`Video job ${id} failed:`, safeError(error));
          try {
            await this.store.update(id, {
              status: 'failed',
              progress: { stage: 'failed', current: 0, total: 0 },
              errorCode: error.code || 'VIDEO_RENDER_FAILED',
              output: null,
              attemptId: null,
            });
          } catch (persistenceError) {
            console.error(`Video job ${id} failure could not be persisted:`, safeError(persistenceError));
          }
        }
      }
    } finally {
      this.running = false;
      if (this.pending.length && !this.stopping) queueMicrotask(() => this.drain());
      for (const resolve of this.stopWaiters.splice(0)) resolve();
    }
  }

  async stop() {
    this.stopping = true;
    this.pending = [];
    this.pendingIds.clear();
    if (!this.running) return;
    await new Promise((resolve) => this.stopWaiters.push(resolve));
  }
}
