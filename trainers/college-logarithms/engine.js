(function (root, factory) {
  'use strict';
  const data = typeof module === 'object' && module.exports ? require('./data.js') : root.CollegeLogarithmsData;
  const api = factory(data);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.CollegeLogarithmsEngine = api;
})(typeof window !== 'undefined' ? window : globalThis, function (D) {
  'use strict';
  const near = (a, b) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 1e-8 * Math.max(1, Math.abs(a), Math.abs(b));
  function parseNumber(raw) {
    if (typeof raw !== 'string' || raw.length > 160) return null;
    const s = raw.trim().replace(/\u2212/g, '-').replace(/,/g, '.');
    const part = '[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)';
    if (!new RegExp('^' + part + '(?:\\s*/\\s*' + part + ')?$').test(s)) return null;
    const pieces = s.split('/').map(Number);
    if (pieces.length === 2 && pieces[1] === 0) return null;
    const n = pieces.length === 2 ? pieces[0] / pieces[1] : pieces[0];
    return Number.isFinite(n) && Math.abs(n) <= 1e9 ? (Object.is(n, -0) ? 0 : n) : null;
  }
  function parsePoint(raw) {
    if (typeof raw !== 'string') return null;
    const parts = raw.trim().replace(/^\(/, '').replace(/\)$/, '').split(';');
    if (parts.length !== 2) return null;
    const x = parseNumber(parts[0]), y = parseNumber(parts[1]);
    return x === null || y === null ? null : { x, y };
  }
  function parseInterval(raw) {
    if (typeof raw !== 'string' || raw.length > 160) return null;
    const s = raw.trim().replace(/\u2212/g, '-');
    const match = /^([[(])\s*([^;]+)\s*;\s*([^;]+)\s*([)\]])$/.exec(s);
    if (!match) return null;
    const left = match[2].trim(), right = match[3].trim();
    const neg = /^-(?:∞|inf|infinity)$/i.test(left), pos = /^\+?(?:∞|inf|infinity)$/i.test(right);
    const lo = neg ? null : parseNumber(left), hi = pos ? null : parseNumber(right);
    const loClosed = match[1] === '[', hiClosed = match[4] === ']';
    if ((!neg && lo === null) || (!pos && hi === null) || (neg && loClosed) || (pos && hiClosed)) return null;
    if (lo !== null && hi !== null && (lo > hi || (lo === hi && !(loClosed && hiClosed)))) return null;
    return { lo, hi, loClosed, hiClosed };
  }
  function validGraph(g) {
    return g && typeof g === 'object' && Number.isFinite(g.base) && g.base > 0 && g.base !== 1 &&
      Number.isFinite(g.h) && Number.isFinite(g.k) && (g.sign === 1 || g.sign === -1);
  }
  function parseTransform(raw) {
    if (typeof raw !== 'string' || raw.length > 160) return null;
    try {
      const v = JSON.parse(raw);
      if (!Array.isArray(v) || v.length !== 4 || !v.every(Number.isFinite)) return null;
      const g = { base: v[0], h: v[1], k: v[2], sign: v[3] };
      return validGraph(g) ? g : null;
    } catch (_) { return null; }
  }
  function graphDraft(g) { return JSON.stringify([g.base, g.h, g.k, g.sign]); }
  function sameInterval(a, b) {
    return !!a && !!b && (a.lo === null ? b.lo === null : b.lo !== null && near(a.lo, b.lo)) &&
      (a.hi === null ? b.hi === null : b.hi !== null && near(a.hi, b.hi)) && a.loClosed === b.loClosed && a.hiClosed === b.hiClosed;
  }
  function checkStep(step, draft) {
    if (!step || typeof draft !== 'string') return { valid: false, correct: false, reason: 'format' };
    let parsed, correct = false, valid = true;
    if (step.kind === 'choice') {
      valid = (step.options || []).some(o => o.value === draft);
      correct = valid && draft === step.answer;
    } else if (step.kind === 'number') {
      parsed = parseNumber(draft); valid = parsed !== null; correct = valid && near(parsed, step.answer);
    } else if (step.kind === 'point') {
      parsed = parsePoint(draft); valid = parsed !== null;
      correct = valid && near(parsed.x, step.answer.x) && near(parsed.y, step.answer.y);
    } else if (step.kind === 'interval') {
      parsed = parseInterval(draft); valid = parsed !== null; correct = valid && sameInterval(parsed, step.answer);
    } else if (step.kind === 'transform') {
      parsed = parseTransform(draft); valid = parsed !== null;
      correct = valid && ['base', 'h', 'k', 'sign'].every(k => near(parsed[k], step.answer[k]));
    } else valid = false;
    return { valid, correct, reason: !valid ? 'format' : correct ? 'correct' : 'value' };
  }
  function graphParams(task) {
    const g = task && task.graph || {};
    return { base: g.base || 2, h: g.h || 0, k: g.k || 0, sign: g.sign === -1 ? -1 : 1 };
  }
  function initialState(taskId) {
    const task = D.getTask(taskId) || D.tasks.find(t => t.moduleId === 'meaning') || D.tasks[0];
    const graph = graphParams(task), drafts = {}, errors = {};
    task.steps.forEach(s => { drafts[s.id] = s.kind === 'transform' ? graphDraft(graph) : ''; errors[s.id] = 0; });
    return { taskId: task.id, stage: 0, drafts, errors, helpUsed: false, hintOpen: false, feedback: 'none', graph,
      panels: { theory: false, lab: false, route: false } };
  }
  function getMarks(task, state) {
    return task.steps.slice(0, state.stage).filter(s => s.kind === 'point').map(s => ({ x: s.answer.x, y: s.answer.y }));
  }
  function isAssessment(task) { return D.getModule(task.moduleId).kind !== 'learn'; }
  function formatNumber(n) {
    if (!Number.isFinite(n)) return '';
    if (near(n, Math.round(n))) return String(Math.round(n)).replace('-', '−');
    for (let d = 2; d <= 64; d++) {
      const num = Math.round(n * d);
      if (near(n, num / d)) return String(num).replace('-', '−') + '/' + d;
    }
    return String(Number(n.toFixed(6))).replace('-', '−').replace('.', ',');
  }
  function intervalText(v) {
    return (v.loClosed ? '[' : '(') + (v.lo === null ? '−∞' : formatNumber(v.lo)) + '; ' +
      (v.hi === null ? '+∞' : formatNumber(v.hi)) + (v.hiClosed ? ']' : ')');
  }
  return { near, parseNumber, parsePoint, parseInterval, parseTransform, graphDraft, validGraph, sameInterval,
    checkStep, initialState, graphParams, getMarks, isAssessment, formatNumber, intervalText };
});
