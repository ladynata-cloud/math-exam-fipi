import { safeError } from './security.js';

export class JobQueue {
  constructor(store, processor) {
    this.store = store;
    this.processor = processor;
    this.pending = [];
    this.pendingIds = new Set();
    this.running = false;
  }

  start() {
    for (const job of this.store.listQueued()) this.enqueue(job.id);
  }

  enqueue(id) {
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
          await this.processor(job, this.store);
        } catch (error) {
          console.error(`Video job ${id} failed:`, safeError(error));
          await this.store.update(id, {
            status: 'failed',
            progress: { stage: 'failed', current: 0, total: 0 },
            error: safeError(error),
            output: null,
          });
        }
      }
    } finally {
      this.running = false;
      if (this.pending.length) queueMicrotask(() => this.drain());
    }
  }
}

