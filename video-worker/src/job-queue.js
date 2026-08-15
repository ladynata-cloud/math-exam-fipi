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
    this.activeController = null;
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
      while (this.pending.length && !this.stopping) {
        const id = this.pending.shift();
        this.pendingIds.delete(id);
        const job = this.store.get(id);
        if (!job || job.status !== 'queued') continue;
        const controller = new AbortController();
        this.activeController = controller;
        try {
          await this.store.assertOwnership();
          await this.processor(job, this.store, { signal: controller.signal });
        } catch (error) {
          console.error(`Video job ${id} failed:`, safeError(error));
          try {
            const cancelled = controller.signal.aborted || error.code === 'JOB_ABORTED';
            await this.store.update(id, cancelled ? {
              status: 'queued',
              progress: { stage: 'queued', current: 0, total: 0 },
              errorCode: null,
              output: null,
              attemptId: null,
            } : {
              status: 'failed',
              progress: { stage: 'failed', current: 0, total: 0 },
              errorCode: error.code || 'VIDEO_RENDER_FAILED',
              output: null,
              attemptId: null,
            });
          } catch (persistenceError) {
            console.error(`Video job ${id} failure could not be persisted:`, safeError(persistenceError));
          }
        } finally {
          if (this.activeController === controller) this.activeController = null;
        }
      }
    } finally {
      this.running = false;
      if (this.pending.length && !this.stopping) queueMicrotask(() => this.drain());
      for (const resolve of this.stopWaiters.splice(0)) resolve();
    }
  }

  async stop(options = {}) {
    this.stopping = true;
    this.pending = [];
    this.pendingIds.clear();
    this.activeController?.abort();
    if (!this.running) return;
    const graceMs = options.graceMs || 30_000;
    let waiter;
    const stopped = new Promise((resolve) => {
      waiter = resolve;
      this.stopWaiters.push(resolve);
    });
    const timeout = new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const index = this.stopWaiters.indexOf(waiter);
        if (index >= 0) this.stopWaiters.splice(index, 1);
        const error = new Error('Video job did not stop within the shutdown grace period');
        error.code = 'SHUTDOWN_TIMEOUT';
        reject(error);
      }, graceMs);
      stopped.finally(() => clearTimeout(timer));
    });
    await Promise.race([stopped, timeout]);
  }
}
