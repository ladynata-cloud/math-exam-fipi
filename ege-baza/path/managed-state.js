(function (root) {
  'use strict';
  const plain = x => !!x && typeof x === 'object' && !Array.isArray(x) && [Object.prototype, null].includes(Object.getPrototypeOf(x));
  const copy = x => JSON.parse(JSON.stringify(x));
  const number = (n, lo, hi) => typeof n === 'number' && Number.isFinite(n) && n >= lo && n <= hi;
  const integer = (n, lo, hi) => Number.isSafeInteger(n) && n >= lo && n <= hi;
  function requireValue(ok) { if (!ok) throw new TypeError('Не удалось восстановить состояние задания.'); }
  function string(s, max) { requireValue(typeof s === 'string' && s.length <= max); return s; }
  function keys(x, allowed) { requireValue(plain(x) && Object.keys(x).every(k => allowed.includes(k))); }
  function indices(a, max) { requireValue(Array.isArray(a) && a.length <= max && a.every(n => integer(n, 0, max - 1)) && new Set(a).size === a.length); }
  function model(value, task) {
    if (value === null) return null;
    requireValue(plain(value) && value.kind === task.model.kind);
    const v = copy(value), m = task.model;
    const fields = {
      equation: ['left', 'right', 'pending', 'sign', 'divisor', 'message'],
      'grade7-geometry': ['selected', 'revealed'],
      derivative: ['x', 'h'], solid: ['angle', 'tilt', 'cut'],
      iso: ['constructed', 'choicesOpen', 'wrong'], triangle: ['constructed', 'choicesOpen', 'wrong'],
      trapezoid: ['constructed', 'choicesOpen', 'wrong'], chord: ['constructed', 'choicesOpen', 'wrong'], rectangle: ['constructed', 'choicesOpen', 'wrong'],
      digits: ['kept'], journey: ['part'], ring: ['mode'], line: ['x'], bars: [],
      'fraction-bars': ['selected', 'checked', 'checkedCount'], 'percent-base': ['base', 'experiment', 'percent'],
      'ratio-parts': ['chosen', 'checked', 'checkedCount'], 'polygon-build': ['constructed', 'choice'],
      'interval-signs': ['x'], 'digit-work': ['digits', 'checkedDigits'], 'data-read': ['item'], statements: ['open']
    };
    keys(v, ['kind', ...(fields[v.kind] || ['revealed'])]);
    for (const k of ['constructed', 'choicesOpen', 'wrong', 'checked', 'experiment']) if (k in v) requireValue(typeof v[k] === 'boolean');
    if (v.kind === 'grade7-geometry') {
      requireValue(Array.isArray(m.elements) && (v.selected === null || typeof v.selected === 'string' && m.elements.some(element => element.id === v.selected)));
      requireValue(integer(v.revealed, 0, task.steps.length));
    } else if (v.kind === 'equation') {
      for (const k of ['left', 'right']) requireValue(Array.isArray(v[k]) && v[k].length <= 20 && v[k].every(t => Array.isArray(t) && t.length === 2 && number(t[0], -1e9, 1e9) && integer(t[1], 0, 1)));
      requireValue(v.pending === null || plain(v.pending) && Object.keys(v.pending).length === 2 && integer(v.pending.side, 0, 1) && integer(v.pending.index, 0, (v.pending.side ? v.right : v.left).length - 1));
      requireValue(integer(v.sign, 0, 2)); string(v.divisor, 80); string(v.message, 1200);
    } else if (v.kind === 'derivative') { requireValue(number(v.x, -2, 2) && number(v.h, .05, 2)); }
    else if (v.kind === 'solid') { requireValue(number(v.angle, -Math.PI, Math.PI) && number(v.tilt, -70 * Math.PI / 180, 70 * Math.PI / 180) && number(v.cut, .1, .9)); }
    else if (v.kind === 'digits') { requireValue(Array.isArray(v.kept) && v.kept.length === m.digits.length && v.kept.every(x => typeof x === 'boolean')); }
    else if (v.kind === 'journey') requireValue(integer(v.part, 1, 3));
    else if (v.kind === 'ring') requireValue(integer(v.mode, 0, 2));
    else if (v.kind === 'line') requireValue(number(v.x, m.a - 2, m.b + 2));
    else if (v.kind === 'fraction-bars') { indices(v.selected, m.fractions[0][1]); if (v.checked) requireValue(integer(v.checkedCount, 0, m.fractions[0][1])); }
    else if (v.kind === 'ratio-parts') { indices(v.chosen, m.a + m.b); if (v.checked) requireValue(integer(v.checkedCount, 0, m.a + m.b)); }
    else if (v.kind === 'percent-base') requireValue(['', 'part', 'whole'].includes(v.base) && number(v.percent, 0, 100));
    else if (v.kind === 'polygon-build') requireValue(['', 'rectangle', 'diagonal'].includes(v.choice));
    else if (v.kind === 'interval-signs') requireValue(number(v.x, m.a - 3, m.b + 3));
    else if (v.kind === 'digit-work') { for (const k of ['digits', 'checkedDigits']) if (k in v) requireValue(Array.isArray(v[k]) && v[k].length === 4 && v[k].every(n => integer(n, 0, 9))); }
    else if (v.kind === 'data-read') requireValue(v.item === null || integer(v.item, 0, (task.display.kind === 'table' ? task.display.rows.length : (task.display.labels || task.display.names).length) - 1));
    else if (v.kind === 'statements') indices(v.open, task.choices.length);
    else if (!(v.kind in fields)) requireValue(integer(v.revealed, 0, task.steps.length));
    return v;
  }
  function fresh(taskSpec) {
    return { version: 1, taskSpec: { id: taskSpec.id || taskSpec.contentId, seed: taskSpec.seed, contentVersion: 1 },
      work: { stage: 3, step: 0, answers: [], draft: '', note: '', help: false, attempted: false, done: false, model: null },
      view: { feedback: '', feedbackKind: '', hintText: '', gapOpen: false, supportOpen: [] } };
  }
  function validate(value, taskSpec, correct = root.PathData && root.PathData.correct) {
    if (value == null) return fresh(taskSpec);
    const id = taskSpec.id || taskSpec.contentId;
    requireValue(plain(taskSpec.task) && Array.isArray(taskSpec.task.steps) && plain(taskSpec.task.model));
    requireValue(JSON.stringify(value).length <= 65536);
    keys(value, ['version', 'taskSpec', 'work', 'view']);
    requireValue(value.version === 1); keys(value.taskSpec, ['id', 'seed', 'contentVersion']);
    requireValue(value.taskSpec.id === id && value.taskSpec.seed === taskSpec.seed && value.taskSpec.contentVersion === taskSpec.contentVersion && taskSpec.contentVersion === 1);
    const w = value.work, v = value.view;
    keys(w, ['stage', 'step', 'answers', 'draft', 'note', 'help', 'attempted', 'done', 'model']);
    requireValue(integer(w.stage, 0, 4) && integer(w.step, 0, taskSpec.task.steps.length));
    requireValue(Array.isArray(w.answers) && w.answers.length === w.step && w.answers.every((answer, i) => typeof answer === 'string' && answer.length <= 4000 && typeof correct === 'function' && correct(taskSpec.task.steps[i], answer)));
    string(w.draft, 4000); string(w.note, 4000);
    for (const k of ['help', 'attempted', 'done']) requireValue(typeof w[k] === 'boolean');
    keys(v, ['feedback', 'feedbackKind', 'hintText', 'gapOpen', 'supportOpen']);
    string(v.feedback, 4000); string(v.hintText, 4000);
    requireValue(['', 'good', 'bad', 'info'].includes(v.feedbackKind) && typeof v.gapOpen === 'boolean');
    indices(v.supportOpen || [], 40);
    const clean = copy(value); clean.work.model = model(w.model, taskSpec.task); clean.view.supportOpen = v.supportOpen || [];
    return clean;
  }
  root.PathManagedState = { fresh, validate, model };
  if (typeof module !== 'undefined') module.exports = root.PathManagedState;
})(typeof window === 'undefined' ? globalThis : window);
