'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const { execFileSync } = require('node:child_process'), { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..'), base = '5f25f75b6e7178ad1d492c7bcb28ed9e63c97bae';
const D = require('../trainers/algebra-harmonization/data.js'), C = require('../trainers/algebra-harmonization/core.js');
const fixture = require('./fixtures/h35-algebra-conditions.json');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
class MemoryStorage {
  constructor() { this.map = new Map(); this.denyRead = false; this.denyWrite = false; }
  get length() { if (this.denyRead) throw Error('SecurityError'); return this.map.size; }
  key(i) { return [...this.map.keys()][i] ?? null; }
  getItem(k) { if (this.denyRead) throw Error('SecurityError'); return this.map.get(k) ?? null; }
  setItem(k, v) { if (this.denyWrite) throw Error('QuotaExceededError'); this.map.set(k, String(v)); }
}
const ids = ['graph-1', 'graph-2', 'graph-3', 'graph-4'];
function edit(j, a, changes) { return j.update(a.id, Object.assign(C.clone(a.state), changes), a.latest).attempt; }
function oldArray(html, name) { const raw = html.match(new RegExp('const\\s+' + name + '\\s*=\\s*(\\[[\\s\\S]*?\\]);'))?.[1]; assert(raw, name); return JSON.parse(JSON.stringify(vm.runInNewContext(raw))); }
function oldSource(name) { return execFileSync('git', ['show', base + ':' + name], { cwd: root, encoding: 'utf8', maxBuffer: 8e6 }); }
function dom(course, storage = new MemoryStorage(), offlineHtml = null) {
  const file = course === 'systems' ? 'linear-systems-trainer.html' : 'quadratic-inequalities-lab.html';
  const d = new JSDOM(offlineHtml || read('trainers/' + file), { url: 'https://mathexam.test/trainers/' + file, runScripts: 'outside-only', pretendToBeVisual: true });
  Object.defineProperty(d.window, 'localStorage', { value: storage });
  if (offlineHtml) for (const script of d.window.document.scripts) { assert(!script.src, 'offline script must be inline'); d.window.eval(script.textContent); }
  else for (const name of ['data', 'core', 'app']) d.window.eval(read('trainers/algebra-harmonization/' + name + '.js'));
  const document = d.window.document;
  return { ...d, window: d.window, document, storage, close: () => d.window.close(),
    state: () => JSON.parse(JSON.stringify(d.window.H35App.snapshot())),
    click(action, value) { const el = document.querySelector(`[data-action="${action}"]${value === undefined ? '' : `[data-value="${value}"]`}`); assert(el, action + ' ' + value); el.click(); },
    input(value) { const el = document.getElementById('answer'); assert(el, 'answer input'); el.value = value; el.dispatchEvent(new d.window.Event('input', { bubbles: true })); },
    submit() { const form = document.getElementById('answer-form'); assert(form); form.dispatchEvent(new d.window.Event('submit', { bubbles: true, cancelable: true })); },
    select(id) { const el = document.getElementById('task-select'); el.value = id; el.dispatchEvent(new d.window.Event('change', { bubbles: true })); },
    probe(value) { const el = document.getElementById('probe'); el.value = String(value); el.dispatchEvent(new d.window.Event('input', { bubbles: true })); }
  };
}
function research(d, quadratic = false) {
  assert.equal(d.state().active.state.phase, 0);
  assert.equal(d.document.querySelectorAll('[data-answer-label]').length, 0);
  d.click('predict', 'unsure');
  assert.equal(d.state().active.state.help, true);
  assert(d.document.querySelector('[data-action="conclusion"]').disabled);
  if (quadratic) for (const v of ['left', 'middle', 'right', 'roots']) d.click('probe-zone', v);
  else { d.click('observe'); d.probe(1); d.click('observe'); }
  assert(!d.document.querySelector('[data-action="conclusion"]').disabled);
  d.click('conclusion'); assert.equal(d.state().active.state.phase, 2);
  d.click('practice'); assert.equal(d.state().active.state.phase, 3);
}
function solve(d, method, t) {
  const s = d.state().active.state;
  if (method === 'quadratic') {
    const positive = ['gt', 'gte'].includes(t.sign), z = positive ? [0, 2] : [1];
    for (const i of z) if (!d.state().active.state.zones[i]) d.click('zone', String(i));
    d.click('endpoints', String(['gte', 'lte'].includes(t.sign))); d.submit(); return;
  }
  if (s.mode === 'learn' && method !== 'graph') {
    d.click('choice', method === 'sub' ? 'equal' : t.second); d.submit();
    d.input(String(method === 'sub' ? t.x : t.mainVal)); d.submit();
    d.input(String(method === 'sub' ? t.y : t.secondVal)); d.submit();
  }
  const pair = method === 'add' ? (t.main === 'x' ? [t.mainVal, t.secondVal] : [t.secondVal, t.mainVal]) : [t.x, t.y];
  d.input(pair.join(';')); d.submit();
}
test('all 22 complete original records are byte-independent fixtures tied to the authorized base', () => {
  assert.deepEqual(D, fixture);
  const systems = oldSource('trainers/linear-systems-trainer.html'), quadratic = oldSource('trainers/quadratic-inequalities-lab.html');
  assert.deepEqual(D, { graph: oldArray(systems, 'graphTasks'), sub: oldArray(systems, 'subTasks'), add: oldArray(systems, 'addTasks'), quadratic: oldArray(quadratic, 'TASKS') });
  assert.deepEqual(Object.values(D).map(x => x.length), [4, 4, 4, 10]);
});
function polynomial(text, x, y = 0) {
  const normalized = text.replaceAll('−', '-').replaceAll(' ', '');
  const terms = normalized.match(/[+-]?[^+-]+/g); assert(terms);
  return terms.reduce((sum, term) => {
    const m = term.match(/^([+-]?(?:\d+(?:\.\d+)?)?)([xy])?$/); assert(m, term);
    const factor = m[1] === '' || m[1] === '+' ? 1 : m[1] === '-' ? -1 : Number(m[1]);
    return sum + factor * (m[2] === 'x' ? x : m[2] === 'y' ? y : 1);
  }, 0);
}
test('independent substitution verifies both original rows of all 12 systems', () => {
  for (const t of D.graph) { for (const [k, b] of [t.l1, t.l2]) assert.equal(k * t.x + b, t.y); assert.notEqual(t.l1[0], t.l2[0]); }
  for (const t of D.sub) { assert.equal(t.a * t.x + t.b, t.y); assert.equal(t.c * t.x + t.d, t.y); assert.notEqual(t.a, t.c); const [left, right] = t.eq.split('='); assert.equal(polynomial(left, t.x), polynomial(right, t.x)); }
  for (const t of D.add) {
    const x = t.main === 'x' ? t.mainVal : t.secondVal, y = t.main === 'y' ? t.mainVal : t.secondVal;
    for (const row of [t.e1, t.e2, t.add]) { const [left, right] = row.split('='); assert.equal(polynomial(left, x, y), polynomial(right, x, y)); }
    assert.deepEqual(C.pair(t.ans), [x, y]);
    // A deliberately different free variable still solves the sum but not both
    // original rows: the investigation's counterexample is mathematically real.
    const xx = t.main === 'x' ? x : x + 1, yy = t.main === 'y' ? y : y + 1;
    const values = [t.e1, t.e2, t.add].map(row => { const [l, r] = row.split('='); return polynomial(l, xx, yy) === polynomial(r, xx, yy); });
    assert.deepEqual(values, [false, false, true]);
  }
});
test('all ten original polynomial inequalities: actual signs, rational roots, strict endpoints', () => {
  const expressions = [x => (x + 2) * (x - 7), x => (x - 3) * (x + 5), x => x*x - 64, x => x*x - 49, x => 81*x*x - 16, x => 25*x*x - 9, x => x*x - 7*x, x => x*x - 7*x, x => x*x - 16, x => 4*x*x - 36];
  D.quadratic.forEach((t, i) => {
    assert(t.a > 0); assert(t.r1 < t.r2);
    assert(Math.abs(expressions[i](t.r1)) < 1e-10); assert(Math.abs(expressions[i](t.r2)) < 1e-10);
    assert(C.equal(C.number(t.l1), t.r1)); assert(C.equal(C.number(t.l2), t.r2));
    const probes = [t.r1 - 1, (t.r1 + t.r2) / 2, t.r2 + 1];
    assert.deepEqual(probes.map(x => Math.sign(expressions[i](x))), [1, -1, 1]);
    for (const x of probes) assert(C.equal(expressions[i](x), t.a*(x-t.r1)*(x-t.r2)));
    const compare = { gt: x => x > 0, gte: x => x >= 0, lt: x => x < 0, lte: x => x <= 0 }[t.sign];
    assert.equal(compare(0), ['gte', 'lte'].includes(t.sign));
  });
});
test('bounded numeric parser accepts equivalent numbers/fractions and rejects empty, partial and executable input', () => {
  for (const [text, expected] of [['0', 0], ['−1,5', -1.5], ['3/2', 1.5], [' +3 / -2 ', -1.5], ['.5', .5]]) assert.equal(C.number(text), expected);
  assert.deepEqual(C.pair('(3/2; −2,5)'), [1.5, -2.5]);
  for (const raw of ['', ' ', null, '0/', '/2', '1/0', '2junk', '1e3', 'Infinity', 'NaN', '2+3', 'alert(1)', '9'.repeat(161), '1/2/3']) assert.equal(C.number(raw), null, String(raw));
  for (const raw of ['', ';', '2;', ';3', '2,3', '2;3;4', '(2;3', '2;3)']) assert.equal(C.pair(raw), null, raw);
});
test('legacy root and unrelated topics remain byte-identical; old statistics never become independent', () => {
  const storage = new MemoryStorage(), text = '{ "unknown": {"keep":[1,2]}, "topics": {"other":{"x":3},"linearSystemsTrainer":{"solved":22,"correct":20}}, "quadraticInequalitiesLab":{"solved":44,"correct":42} }';
  storage.setItem(C.LEGACY, text);
  for (const course of ['systems', 'quadratic']) {
    const j = new C.Journal(course, ids, storage), a = j.begin(ids[0], 'learn'); edit(j, a, { help: true, done: true, phase: 4 });
    assert.equal(j.stats().independent, 0); assert.equal(j.legacy().correct, course === 'systems' ? 20 : 42);
    assert.equal(storage.getItem(C.LEGACY), text);
  }
});
test('one attempt has one durable result, and opening an already seen condition stays familiar', () => {
  const storage = new MemoryStorage(); let j = new C.Journal('systems', ids, storage), a = j.begin(ids[0], 'solo');
  a = edit(j, a, { done: true, phase: 4, drafts: ['', '', '', '2;3'] });
  a = edit(j, a, { done: true }); assert.equal(j.stats().independent, 1);
  j = new C.Journal('systems', ids, storage); assert.equal(j.stats().independent, 1);
  a = j.begin(ids[0], 'solo'); assert(a.state.familiar); edit(j, a, { done: true, phase: 4 });
  assert.equal(j.stats().independent, 1); assert.equal(j.stats().repeat, 1);
  let helped = j.begin(ids[1], 'solo'); helped = edit(j, helped, { help: true }); edit(j, helped, { help: false, done: true, phase: 4 });
  assert.equal(j.stats().assisted, 1); assert.equal(j.stats().independent, 1);
});
test('stale tab cannot replace new step; its draft is archived and assistance merges conservatively', () => {
  const storage = new MemoryStorage(), j1 = new C.Journal('systems', ids, storage), start = j1.begin(ids[0], 'solo');
  const j2 = new C.Journal('systems', ids, storage), stale = j2.get(start.id);
  const newer = edit(j1, start, { drafts: ['', '', '', '2;3'], done: true, phase: 4 });
  const result = j2.update(stale.id, { ...stale.state, help: true, drafts: ['', '', '', '7;8'] }, stale.latest);
  assert(result.stale); assert.equal(result.attempt.latest, newer.latest); assert.equal(result.attempt.state.drafts[3], '2;3');
  assert(result.attempt.state.help); assert(result.attempt.archives.some(a => a.state.drafts[3] === '7;8'));
  j1.read(); assert.equal(j1.stats().independent, 0); assert.equal(j1.stats().assisted, 1);
});
test('genuinely simultaneous siblings retain both drafts and cannot get independent credit', () => {
  const shared = new MemoryStorage(), seed = new C.Journal('systems', ids, shared), start = seed.begin(ids[0], 'solo');
  // Each client has read the same committed parent. Writes go immediately to the
  // shared store, while that client's read snapshot remains fixed until sync.
  function client(label) {
    const local = new MemoryStorage(); local.map = new Map(shared.map); let synced = false, counter = 0;
    const view = { get length() { return (synced ? shared : local).length; }, key: i => (synced ? shared : local).key(i), getItem: k => (synced ? shared : local).getItem(k), setItem(k, v) { shared.setItem(k, v); local.setItem(k, v); } };
    return { journal: new C.Journal('systems', ids, view, { makeId: () => label + (++counter) }), sync() { synced = true; } };
  }
  const one = client('a'), two = client('b');
  edit(one.journal, one.journal.get(start.id), { drafts: ['', '', '', 'first draft'], done: true, phase: 4 });
  edit(two.journal, two.journal.get(start.id), { drafts: ['', '', '', 'second draft'], help: true, done: true, phase: 4 });
  one.sync(); two.sync(); one.journal.read(); two.journal.read();
  for (const { journal: j } of [one, two]) {
    const a = j.get(start.id); assert(a.conflict); assert(a.state.help); assert.equal(j.stats().independent, 0);
    assert.deepEqual(new Set([a.state.drafts[3], ...a.archives.map(x => x.state.drafts[3])]), new Set(['first draft', 'second draft']));
  }
  assert.deepEqual(one.journal.get(start.id), two.journal.get(start.id));
});
test('quota/read denial recovery preserves pending drafts and does not confirm a result early', () => {
  const storage = new MemoryStorage(), j = new C.Journal('systems', ids, storage); let a = j.begin(ids[0], 'solo');
  storage.denyWrite = true; a = edit(j, a, { drafts: ['', '', '', '2;3'], done: true, phase: 4 });
  assert(j.issue); assert.equal(j.stats().independent, 0); assert.equal(j.stats().pending, 1); assert.equal(a.state.drafts[3], '2;3');
  storage.denyWrite = false; j.read(); assert(j.flush()); assert.equal(j.stats().independent, 1);
  assert.equal(new C.Journal('systems', ids, storage).get(a.id).state.drafts[3], '2;3');
  storage.denyRead = true; const denied = new C.Journal('systems', ids, storage), pending = denied.begin(ids[1], 'solo');
  edit(denied, pending, { drafts: ['', '', '', '2;3'], done: true, phase: 4 }); assert.equal(denied.stats().independent, 0);
  storage.denyRead = false; denied.read(); assert(denied.flush()); assert.equal(denied.stats().independent, 2);
});
test('corrupt or oversized journal is kept, and unavailable storage remains usable without a success claim', () => {
  const storage = new MemoryStorage(), key = C.PREFIX + 'systems.broken'; storage.setItem(key, '{oops');
  const j = new C.Journal('systems', ids, storage), a = j.begin(ids[0], 'solo'); edit(j, a, { done: true, phase: 4 });
  assert.equal(storage.getItem(key), '{oops'); assert.equal(j.stats().independent, 0); assert(j.issue);
  const missing = new C.Journal('systems', ids, null), b = missing.begin(ids[0], 'solo'); edit(missing, b, { done: true, phase: 4 }); assert.equal(missing.stats().pending, 1);
  const capped = new C.Journal('systems', ids, new MemoryStorage(), { limit: 2 }); let c = capped.begin(ids[0], 'solo'); c = edit(capped, c, { drafts: ['', '', '', 'draft'] }); c = edit(capped, c, { done: true, phase: 4 });
  assert.match(capped.issue, /предела/); assert.equal(capped.stats().independent, 0); assert.equal(c.state.drafts[3], 'draft');
});
test('a quota failure in a new attempt keeps earlier durable achievements visible', () => {
  const storage = new MemoryStorage(), j = new C.Journal('systems', ids, storage);
  let old = j.begin(ids[0], 'solo'); old = edit(j, old, { done: true, phase: 4 });
  assert.equal(j.stats().independent, 1);
  storage.denyWrite = true;
  let fresh = j.begin(ids[1], 'solo'); fresh = edit(j, fresh, { drafts: ['', '', '', '2;3'], done: true, phase: 4 });
  assert(j.issue); assert.equal(j.outcome(j.get(old.id)), 'independent'); assert.equal(j.stats().independent, 1); assert.equal(j.stats().pending, 1);
  storage.denyWrite = false; j.read(); assert(j.flush()); assert.equal(j.stats().independent, 2); assert.equal(j.stats().pending, 0);
  assert.equal(new C.Journal('systems', ids, storage).get(fresh.id).state.drafts[3], '2;3');
});
test('all methods require a real first prediction and observations; all 22 existing conditions solve correctly', () => {
  for (const method of ['graph', 'sub', 'add', 'quadratic']) {
    const d = dom(method === 'quadratic' ? 'quadratic' : 'systems');
    if (method !== 'graph' && method !== 'quadratic') d.click('method', method);
    D[method].forEach((t, i) => {
      if (i) d.select(method + '-' + (i + 1));
      research(d, method === 'quadratic');
      if (method === 'sub') assert.match(d.document.querySelector('#learning-step').textContent, /связать/);
      if (method === 'add') assert.match(d.document.querySelector('#learning-step').textContent, /исчезнет/);
      solve(d, method, t); assert(d.state().active.state.done, method + ' ' + i);
      assert.equal(d.state().stats.independent, 0);
    });
    assert.equal(d.state().stats.assisted, D[method].length); d.close();
  }
});
test('source UI: fresh condition, no exact answer leak, format vs error, equivalent answer, reload and repeated submit', () => {
  let d = dom('systems'); const storage = d.storage;
  d.click('fresh'); assert.equal(d.state().active.state.taskId, 'graph-2'); assert.equal(d.state().active.state.help, false);
  assert.equal(d.document.querySelectorAll('[data-answer-label]').length, 0);
  d.submit(); assert.equal(d.state().active.state.errors, 0); assert.match(d.document.querySelector('#feedback').textContent, /Запиши/);
  d.input('2;'); d.submit(); assert.equal(d.state().active.state.errors, 0);
  d.input('1;1'); d.submit(); assert.equal(d.state().active.state.errors, 1); assert.match(d.document.querySelector('#feedback').textContent, /обе/);
  d.input('4/2;6/2'); d.submit(); assert(d.state().active.state.done); assert.equal(d.state().stats.corrected, 1);
  const attempt = d.state().active.id; d.close(); d = dom('systems', storage); assert.equal(d.state().active.id, attempt); assert.equal(d.state().stats.corrected, 1);
  d.document.dispatchEvent(new d.window.Event('submit', { bubbles: true })); assert.equal(d.state().stats.corrected, 1);
  d.click('fresh'); solve(d, 'graph', D.graph[2]); assert.equal(d.state().stats.independent, 1);
  d.click('fresh'); d.click('hint'); d.input('3;5/2'); d.close(); d = dom('systems', storage);
  assert.equal(d.document.getElementById('answer').value, '3;5/2'); assert(d.state().active.state.help); d.submit(); assert.equal(d.state().stats.assisted, 1);
  d.click('fresh'); assert(d.state().active.state.familiar); assert.match(d.document.querySelector('#conflict-notice').textContent, /знакомый повтор/); d.close();
});
test('independent addition has no computed sum; independent substitution has no transformed equation', () => {
  for (const method of ['sub', 'add']) {
    const d = dom('systems'); d.click('method', method); d.click('fresh');
    const t = D[method][1], revealed = method === 'sub' ? t.eq : t.add;
    assert(!d.document.querySelector('#workspace').textContent.includes(revealed), 'no worked step before request');
    d.click('reveal'); assert(d.document.querySelector('#workspace').textContent.includes(revealed)); assert.equal(d.state().active.state.done, false);
    solve(d, method, t); assert.equal(d.state().stats.assisted, 1); assert.equal(d.state().stats.independent, 0); d.close();
  }
});
test('quadratic reveal never selects answers, repeated checking counts once, selected intervals resume', () => {
  let d = dom('quadratic'); const storage = d.storage; d.click('fresh');
  d.click('zone', '1'); d.click('endpoints', 'false'); const before = d.state().active.state;
  d.close(); d = dom('quadratic', storage); assert.deepEqual(d.state().active.state.zones, before.zones); assert.equal(d.state().active.state.endpoints, false);
  d.click('reveal'); assert.equal(d.state().active.state.done, false); assert.deepEqual(d.state().active.state.zones, before.zones);
  d.submit(); assert.equal(d.state().stats.assisted, 1); assert.equal(d.state().stats.independent, 0);
  for (let i = 0; i < 3; i++) d.document.dispatchEvent(new d.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  d.close(); d = dom('quadratic', storage); assert.equal(d.state().stats.assisted, 1);
  d.click('fresh'); d.click('reveal'); d.submit(); assert.equal(d.state().active.state.done, false); assert.equal(d.state().stats.assisted, 1); d.close();
});
test('guided step and draft resume across methods and reload; UI retries denied writes', () => {
  let d = dom('systems'); const storage = d.storage; d.click('method', 'sub'); research(d);
  d.click('choice', 'equal'); d.submit(); d.input('2/');
  d.click('method', 'add'); d.click('method', 'sub'); assert.equal(d.document.querySelector('#answer').value, '2/'); assert.equal(d.state().active.state.step, 1);
  d.close(); d = dom('systems', storage); assert.equal(d.state().active.state.taskId, 'sub-1'); assert.equal(d.document.querySelector('#answer').value, '2/');
  storage.denyWrite = true; d.input('4/2'); assert.match(d.document.querySelector('#storage-notice').textContent, /Не удалось сохранить/);
  storage.denyWrite = false; d.click('retry-save'); assert(d.document.querySelector('#storage-notice').hidden); d.close();
  d = dom('systems', storage); assert.equal(d.document.querySelector('#answer').value, '4/2'); d.submit(); assert.equal(d.state().active.state.step, 2); d.close();
});
test('all other catalog entries and downloaded packages are untouched by the scoped rebuild', () => {
  const before = JSON.parse(oldSource('downloads/trainers-manifest.json')), after = JSON.parse(read('downloads/trainers-manifest.json'));
  assert.deepEqual(after.trainers.filter(e => e.slug !== 'linear-systems-trainer'), before.trainers.filter(e => e.slug !== 'linear-systems-trainer'));
  for (const key of Object.keys(before).filter(k => k !== 'trainers' && k !== 'updated')) assert.deepEqual(after[key], before[key]);
  assert.match(after.updated, /^\d{4}-\d{2}-\d{2}$/); assert(after.updated >= before.updated, 'only the existing builder date metadata may advance');
  const changed = execFileSync('git', ['diff', '--name-only', base, '--', 'downloads/'], { cwd: root, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  assert(changed.every(f => f === 'downloads/trainers-manifest.json' || f.startsWith('downloads/trainers/linear-systems-trainer/')), changed.join('\n'));
});
