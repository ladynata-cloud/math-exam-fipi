'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const ROOT = path.resolve(__dirname, '..');
const course = require('../stereo-course/sections/data/course.json');
const app = fs.readFileSync(path.join(ROOT, 'stereo-course/sections/assets/app.js'), 'utf8');
const adapter = fs.readFileSync(path.join(ROOT, 'stereo-course/sections/assets/board-session.js'), 'utf8');
const copy = value => JSON.parse(JSON.stringify(value));

// Timers are controlled only after the real course has booted. This exercises
// the authored tour controls without waiting for their presentation delays.
function clock(window) {
  let now = 0, serial = 0;
  const pending = new Map();
  const add = (fn, delay, args, interval) => {
    const id = ++serial;
    pending.set(id, { fn, at: now + Math.max(0, Number(delay) || 0), args, interval });
    return id;
  };
  window.setTimeout = (fn, delay, ...args) => add(fn, delay, args, null);
  window.clearTimeout = id => pending.delete(id);
  window.setInterval = (fn, delay, ...args) => add(fn, delay, args, Math.max(1, Number(delay) || 0));
  window.clearInterval = id => pending.delete(id);
  return {
    get size() { return pending.size; },
    advance(ms) {
      const end = now + ms;
      let calls = 0;
      for (;;) {
        const entry = [...pending].filter(([, timer]) => timer.at <= end).sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
        if (!entry) break;
        assert(++calls < 1000, 'tour timers must settle instead of looping');
        const [id, timer] = entry;
        now = timer.at; pending.delete(id);
        if (timer.interval !== null) pending.set(id, { ...timer, at: now + timer.interval });
        assert.equal(typeof timer.fn, 'function', 'tour does not execute timer strings');
        timer.fn(...timer.args);
      }
      now = end;
    }
  };
}

function boot({ reduced = false, board = false, captureModels = false } = {}) {
  const dom = new JSDOM('<!doctype html><body' + (board ? ' data-sections-board="true"' : '') + '><a class="skip-link" href="#lesson-title">К уроку</a><div id="sections-app"></div></body>', {
    url: 'https://example.test/' + (board ? 'trainers/sections-from-zero.html' : 'stereo-course/sections/'),
    runScripts: 'outside-only', pretendToBeVisual: true
  });
  const w = dom.window, errors = [];
  w.addEventListener('error', event => errors.push(event.error));
  w.TextEncoder = TextEncoder; w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.SVGElement.prototype.getBBox = function () { return { x: 0, y: -16, width: Math.max(12, this.textContent.length * 12), height: 20 }; };
  w.matchMedia = query => ({ matches: reduced && query.includes('prefers-reduced-motion'), media: query,
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
  w.localStorage.setItem(course.storageKey, JSON.stringify({ version: 1, current: 'starter-18', tasks: {
    'starter-18': { mode: 'practice', revealed: 2, independentSteps: 2, draft: 'Моя работа должна сохраниться',
      attemptEvidenceVersion: 1, mistakes: 1, camera: { yaw: .23, pitch: .41 } }
  } }));
  w.localStorage.setItem('mathexam.sections.master.activities.v1', JSON.stringify({ view: 'map', path: {
    stageId: 'begin-06', readiness: { 'begin-01': [true, false] }
  } }));
  w.localStorage.setItem('sections-tour-unrelated', 'preserve byte for byte');
  w.COURSE = w.JSON.parse(JSON.stringify(course));
  const models = [];
  if (captureModels) {
    // Observe the public scene factory without mutating its frozen API object
    // or adding any production-only testing hook. The real renderer still runs.
    let publicApi;
    Object.defineProperty(w, 'SECTIONS_APP', { configurable: true,
      get() { return publicApi; },
      set(api) { publicApi = Object.freeze({ ...api, createScene(...args) {
        models.push(copy(args[1])); return api.createScene(...args);
      } }); }
    });
  }
  if (board) {
    w.MathExamBoard = { register(config) { const unsubscribe = config.subscribe(() => {}); return { destroy: unsubscribe }; } };
    w.eval(adapter);
  }
  w.eval(app);
  const saved = () => Object.fromEntries(Object.keys(w.localStorage).sort().map(key => [key, w.localStorage.getItem(key)]));
  return {
    w, doc: w.document, time: clock(w), models,
    snapshot: () => ({ work: copy(w.SECTIONS_APP.getState()), activities: w.SECTIONS_MASTER ? copy(w.SECTIONS_MASTER.getState()) : null,
      storage: saved(), hash: w.location.hash }),
    close() { w.SECTIONS_BOARD_SESSION?.destroy(); assert.deepEqual(errors, [], 'no uncaught tour errors'); w.close(); }
  };
}

function find(f, selector) { const item = f.doc.querySelector(selector); assert(item, selector); return item; }
function click(f, action) { find(f, '[data-tour-action="' + action + '"]').click(); }
function frame(f) { return Number(find(f, '[data-tour-frame]').dataset.tourFrame); }
function dialog(f) { return find(f, '[data-sections-tour]'); }
function open(f, kind) {
  const trigger = find(f, '[data-tour-open="' + kind + '"]');
  const disclosure = trigger.closest('details'); if (disclosure) disclosure.open = true;
  trigger.focus(); trigger.click();
  assert.equal(dialog(f).getAttribute('data-tour-kind'), kind);
  assert.equal(frame(f), 0);
  return trigger;
}
function isOpen(f) { return !!f.doc.querySelector('[data-sections-tour][open]'); }

test('three optional tours open and close without changing learning work, route, camera or storage', () => {
  const f = boot();
  try {
    assert.deepEqual([...f.doc.querySelectorAll('details.sections-tours [data-tour-open]')].map(node => node.dataset.tourOpen).sort(), ['construct', 'resume', 'start']);
    const before = f.snapshot();
    for (const kind of ['start', 'resume', 'construct']) {
      const trigger = open(f, kind);
      assert(isOpen(f));
      assert(dialog(f).contains(f.doc.activeElement), 'opening moves focus into the dialog');
      assert(find(f, '#sections-tour-frame-title').textContent.trim());
      assert(find(f, '[data-tour-transcript]').textContent.trim(), 'the same explanation is available as text');
      assert.deepEqual(f.snapshot(), before, kind + ': opening is not a learning attempt');
      click(f, 'next'); assert.equal(frame(f), 1);
      click(f, 'previous'); assert.equal(frame(f), 0);
      click(f, 'next'); click(f, 'repeat'); assert.equal(frame(f), 0);
      assert.deepEqual(f.snapshot(), before, kind + ': demonstration navigation does not perform course actions');
      click(f, 'close');
      assert.equal(isOpen(f), false);
      assert.equal(f.doc.activeElement, trigger, 'closing returns to the launching control');
      assert.equal(f.time.size, 0);
      assert.deepEqual(f.snapshot(), before, kind + ': closing preserves the exact saved work');
    }
    assert.equal(f.w.SECTIONS_TOUR.open('unknown'), false);
    assert.equal(isOpen(f), false, 'unknown tour identifiers do not open a partial dialog');
  } finally { f.close(); }
});

test('next, previous, replay and Escape remain local to the demonstration', () => {
  const f = boot();
  try {
    const before = f.snapshot(), trigger = open(f, 'construct');
    assert(find(f, '[data-tour-action="previous"]').disabled);
    click(f, 'next'); assert.equal(frame(f), 1);
    click(f, 'next'); assert.equal(frame(f), 2);
    click(f, 'previous'); assert.equal(frame(f), 1);
    click(f, 'repeat'); assert.equal(frame(f), 0);
    assert.equal(f.time.size, 0, 'replay returns to the first paused frame');
    const closeButton = find(f, '[data-tour-action="close"]');
    const lastControl = find(f, '[data-tour-transcript] > summary');
    closeButton.focus();
    closeButton.dispatchEvent(new f.w.KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }));
    assert.equal(f.doc.activeElement, lastControl, 'Shift+Tab keeps focus within the open dialog');
    lastControl.dispatchEvent(new f.w.KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    assert.equal(f.doc.activeElement, closeButton, 'Tab wraps to the first enabled dialog control');
    trigger.focus();
    assert(dialog(f).contains(f.doc.activeElement), 'fallback modal also prevents background focus');
    assert.deepEqual(f.snapshot(), before);
    dialog(f).dispatchEvent(new f.w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    assert.equal(isOpen(f), false);
    assert.equal(f.doc.activeElement, trigger);
    assert.deepEqual(f.snapshot(), before);
  } finally { f.close(); }
});

test('playback stops on pause, last frame, close, hidden tab and page exit', () => {
  const f = boot();
  try {
    const before = f.snapshot(); open(f, 'construct');
    assert.equal(f.time.size, 0, 'no animation starts until requested');
    click(f, 'play'); assert(f.time.size > 0);
    f.time.advance(3300); assert.equal(frame(f), 1);
    click(f, 'play'); const paused = frame(f); f.time.advance(20000); assert.equal(frame(f), paused);
    assert.equal(f.time.size, 0);
    click(f, 'play');
    Object.defineProperty(f.doc, 'hidden', { configurable: true, value: true });
    Object.defineProperty(f.doc, 'visibilityState', { configurable: true, value: 'hidden' });
    f.doc.dispatchEvent(new f.w.Event('visibilitychange'));
    const hidden = frame(f); f.time.advance(20000); assert.equal(frame(f), hidden);
    assert.equal(f.time.size, 0, 'a hidden tab does not retain playback timers');
    Object.defineProperty(f.doc, 'hidden', { configurable: true, value: false });
    Object.defineProperty(f.doc, 'visibilityState', { configurable: true, value: 'visible' });
    f.doc.dispatchEvent(new f.w.Event('visibilitychange'));
    assert.equal(f.time.size, 0, 'becoming visible does not silently restart playback');
    click(f, 'play'); f.time.advance(30000);
    assert(find(f, '[data-tour-action="next"]').disabled, 'playback stops at the final frame');
    assert.equal(f.time.size, 0);
    click(f, 'repeat'); click(f, 'play'); click(f, 'close');
    assert.equal(f.time.size, 0); f.time.advance(20000); assert.equal(isOpen(f), false);
    open(f, 'construct'); click(f, 'play');
    f.w.dispatchEvent(new f.w.Event('pagehide'));
    assert.equal(f.time.size, 0, 'leaving the page cancels playback');
    f.time.advance(20000);
    assert.deepEqual(f.snapshot(), before, 'all playback controls leave actual course work intact');
  } finally { f.close(); }
});

test('reduced-motion preference keeps all frames and explanation available without playback', () => {
  const f = boot({ reduced: true });
  try {
    const before = f.snapshot(); open(f, 'construct');
    const play = find(f, '[data-tour-action="play"]'); assert(play.disabled);
    play.click(); f.time.advance(30000); assert.equal(frame(f), 0); assert.equal(f.time.size, 0);
    click(f, 'next'); assert.equal(frame(f), 1);
    click(f, 'previous'); assert.equal(frame(f), 0);
    assert(find(f, '[data-tour-transcript]').textContent.includes('P'));
    click(f, 'close'); assert.deepEqual(f.snapshot(), before);
  } finally { f.close(); }
});

test('the independent cube demo builds only PQ, QR and RP on their actual common faces', () => {
  const f = boot({ captureModels: true });
  try {
    const before = f.snapshot(); open(f, 'construct');
    const demo = f.models.find(model => model.model?.points?.P && model.model?.points?.Q && model.model?.points?.R);
    assert(demo, 'a separate authored model is supplied to the real scene renderer');
    const points = demo.model.points;
    assert.deepEqual(points.P, [.35, 0, 0]); assert.deepEqual(points.Q, [0, .55, 0]); assert.deepEqual(points.R, [0, 0, .70]);
    assert.equal(demo.model.edges.length, 12);
    const hits = [], edgeKeys = new Set();
    const evaluate = p => p[0] / .35 + p[1] / .55 + p[2] / .70 - 1;
    const remember = p => { if (!hits.some(hit => Math.hypot(...hit.map((v, i) => v - p[i])) < 1e-10)) hits.push(p); };
    for (const [aName, bName] of demo.model.edges) {
      const aPoint = points[aName], bPoint = points[bName];
      const key = [aName, bName].sort().join('-'); assert(!edgeKeys.has(key)); edgeKeys.add(key);
      assert(aPoint.every(value => value === 0 || value === 1) && bPoint.every(value => value === 0 || value === 1));
      assert.equal(aPoint.filter((value, i) => value !== bPoint[i]).length, 1, key + ' is a unit-cube edge');
      const from = evaluate(aPoint), to = evaluate(bPoint);
      if (Math.abs(from) < 1e-12) remember(aPoint);
      if (Math.abs(to) < 1e-12) remember(bPoint);
      if (from * to < 0) {
        const t = from / (from - to); assert(t > 0 && t < 1);
        remember(aPoint.map((value, i) => value + t * (bPoint[i] - value)));
      }
    }
    assert.equal(hits.length, 3, 'the plane intersects exactly three distinct cube edges');
    for (const expected of [points.P, points.Q, points.R]) assert(hits.some(hit => Math.hypot(...hit.map((value, i) => value - expected[i])) < 1e-10));
    assert.deepEqual(demo.result.polygon, ['P', 'Q', 'R']);
    const svg = () => find(f, '[data-sections-tour] .model-svg');
    const segments = () => [...svg().querySelectorAll('[data-segment]')].map(node => node.dataset.segment).sort();
    assert.deepEqual(segments(), []);
    assert.equal(svg().querySelector('[data-section-polygon]'), null, 'the completed answer is not shown first');
    // Orthographic projection preserves affine ratios. Check the displayed
    // points against the displayed cube, independently of the demo data object.
    function point(name) {
      const node = svg().querySelector('[data-point="' + name + '"]'); assert(node, 'visible point ' + name);
      return [Number(node.getAttribute('cx')), Number(node.getAttribute('cy'))];
    }
    const a = point('A');
    for (const [name, endpoint, ratio] of [['P', 'B', .35], ['Q', 'D', .55], ['R', 'E', .70]]) {
      const p = point(name), end = point(endpoint);
      for (let axis = 0; axis < 2; axis++) assert(Math.abs(p[axis] - (a[axis] + ratio * (end[axis] - a[axis]))) < .001, name + ' lies at its stated fraction of A' + endpoint);
    }
    const expected = [
      ['ABCD', []],
      ['ABCD', ['P-Q']],
      ['ADHE', ['P-Q']],
      ['ADHE', ['P-Q', 'Q-R']],
      ['ABFE', ['P-Q', 'Q-R']],
      ['ABFE', ['P-Q', 'Q-R', 'R-P']]
    ];
    for (const [plane, lines] of expected) {
      click(f, 'next');
      assert(svg().querySelector('[data-active-plane="' + plane + '"]'), 'highlight the common face ' + plane);
      assert.deepEqual(segments(), lines.sort());
      assert.equal(svg().querySelector('[data-section-polygon]'), null);
    }
    click(f, 'next');
    assert.equal(svg().querySelector('[data-section-polygon]')?.dataset.sectionPolygon, 'P-Q-R');
    assert.deepEqual(segments(), ['P-Q', 'Q-R', 'R-P']);
    svg().dispatchEvent(new f.w.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    assert.equal(svg().querySelector('[data-section-polygon]')?.dataset.sectionPolygon, 'P-Q-R', 'a changed view retains exactly the three section vertices');
    click(f, 'close'); assert.deepEqual(f.snapshot(), before, 'even demo camera movement does not rotate the saved course card');
  } finally { f.close(); }
});

test('shared-board wrapper has no tour API or controls and keeps personal records isolated', () => {
  const f = boot({ board: true });
  try {
    assert.equal(f.w.SECTIONS_TOUR, undefined);
    assert.equal(f.doc.querySelector('[data-tour-open]'), null);
    assert.equal(f.doc.querySelector('[data-sections-tour]'), null);
    assert(f.w.__sectionsBoard.validateState(f.w.__sectionsBoard.getState()));
    const before = f.snapshot();
    f.w.dispatchEvent(new f.w.Event('pagehide'));
    f.doc.dispatchEvent(new f.w.Event('visibilitychange'));
    assert.deepEqual(f.snapshot(), before);
  } finally { f.close(); }
});
