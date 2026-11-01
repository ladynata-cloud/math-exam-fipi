import fs from 'node:fs';

export function publicRelease(value) {
  if (!value || typeof value !== 'object' || !/^[a-f0-9]{40}$/.test(value.sourceCommit || '')) return { sourceCommit: null, changes: [], label: 'Версия для разработки' };
  return { sourceCommit: value.sourceCommit, label: `Версия ${value.sourceCommit.slice(0, 7)}`,
    changes: Array.isArray(value.changes) ? value.changes.filter(s => typeof s === 'string' && s.length <= 200 && !/[\x00-\x1f]/.test(s)).slice(0, 10) : [] };
}
export function readRelease() {
  try { return publicRelease(JSON.parse(fs.readFileSync(new URL('../release.json', import.meta.url), 'utf8'))); }
  catch { return publicRelease(null); }
}
