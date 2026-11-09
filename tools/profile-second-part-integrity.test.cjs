'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

// Exercise the shipped inline handlers with controllable timers, not copies of
// the scoring code. A cancelled callback can still be delivered to test restarts.
function fixture(name, kind = 'num') {
  const html = fs.readFileSync(path.join(__dirname, '../ege-profil/trainers/', name + '.html'), 'utf8');
  const dom = new JSDOM(html, { url: 'https://mathexam.space/ege-profil/trainers/' + name + '.html', runScripts: 'outside-only' });
  const w = dom.window, d = w.document, timers = new Map();
  let nextId = 0, drawn = 0;
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.setTimeout = fn => { timers.set(++nextId, fn); return nextId; };
  w.clearTimeout = id => timers.delete(id);
  const scripts = [...d.querySelectorAll('script:not([src])')];
  w.eval(scripts[0].textContent);
  if (name === 'parameters-t18') {
    w.P18.drill = () => {
      drawn++;
      return { vals: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0], a: 0.5, n: 12 };
    };
  } else {
    w.N19.drill = () => ({ type: 'invariant', kind, text: 'Условие ' + (++drawn), answer: kind === 'yn' ? true : 12, sol: 'Разбор условия' });
  }
  w.localStorage.setItem('mathExamCourseProgress.v1', JSON.stringify({ unrelated: { passed: true } }));
  w.eval(scripts[1].textContent);
  const get = id => d.getElementById(id);
  return {
    w, d, get, timers, get drawn() { return drawn; },
    click(id) { get(id).click(); },
    submit(correct = true) {
      if (kind === 'yn') get(correct ? 'dYes' : 'dNo').click();
      else { get('dAnswer').value = correct ? '12' : '11'; get('dCheck').click(); }
    },
    repeat(correct = true) {
      // dispatchEvent also reaches the guard when the control is disabled.
      if (kind !== 'yn') get('dAnswer').value = correct ? '12' : '11';
      get(kind === 'yn' ? (correct ? 'dYes' : 'dNo') : 'dCheck').dispatchEvent(new w.Event('click'));
      get('dAnswer').dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter' }));
    },
    flush() {
      assert.equal(timers.size, 1, 'one transition is queued');
      const [id, fn] = timers.entries().next().value;
      timers.delete(id); fn();
    },
    saved() { return JSON.parse(w.localStorage.getItem('mathExamCourseProgress.v1')); },
    close() { dom.window.close(); }
  };
}

for (const name of ['parameters-t18', 'numbers-t19']) {
  test(name + ': repeated clicks and Enter cannot award a test from one condition', () => {
    const f = fixture(name);
    try {
      f.click('zStart');
      f.submit();
      for (let i = 0; i < 8; i++) f.repeat();
      assert.equal(f.get('zDots').querySelectorAll('.ok').length, 1);
      assert.equal(f.get('zScore').textContent, '');
      assert.equal(f.saved()[name].passed, false);
      assert.equal(f.drawn, 2, 'one initial practice and one test condition');
      for (let i = 1; i < 8; i++) { f.flush(); f.submit(); }
      assert.equal(f.get('zScore').textContent, '8 / 8');
      assert.equal(f.saved()[name].passed, true);
      assert.equal(f.saved()[name].drillBest, 8);
      assert.deepEqual(f.saved().unrelated, { passed: true });
      assert.equal(f.timers.size, 0);
    } finally { f.close(); }
  });

  test(name + ': correction cannot replace a first test error, seven fresh successes still pass', () => {
    const f = fixture(name);
    try {
      f.click('zStart'); f.submit(false);
      for (let i = 0; i < 8; i++) f.repeat(true);
      assert.equal(f.get('zDots').querySelectorAll('.bad').length, 1);
      assert.equal(f.get('zDots').querySelectorAll('.ok').length, 0);
      const log = f.saved().mistakes[name + '|' + (name === 'parameters-t18' ? 'drill' : 'invariant')];
      assert.equal(log.w, 1); assert.equal(log.r, 0);
      for (let i = 1; i < 8; i++) { f.flush(); f.submit(); }
      assert.equal(f.get('zScore').textContent, '7 / 8');
      assert.equal(f.saved()[name].passed, true);
    } finally { f.close(); }
  });

  test(name + ': restarting invalidates a pending transition and keeps the new draft', () => {
    const f = fixture(name);
    try {
      f.click('zStart'); f.submit();
      const stale = [...f.timers.values()][0];
      f.click('zStart');
      const count = f.drawn;
      f.get('dAnswer').value = '7';
      assert.equal(f.timers.size, 0, 'the old timer is cancelled');
      stale();
      assert.equal(f.drawn, count, 'an already queued old callback is harmless');
      assert.equal(f.get('dAnswer').value, '7');
      assert.equal(f.get('zDots').querySelectorAll('.ok,.bad').length, 0);
      assert.equal(f.get('dCheck').disabled, false);
      assert.equal(f.saved()[name].runs, 2);
    } finally { f.close(); }
  });

  test(name + ': free practice can correct an error but counts a success once', () => {
    const f = fixture(name);
    try {
      f.submit(false);
      assert.equal(f.get('dCheck').disabled, false, 'a free-practice correction stays available');
      f.submit();
      for (let i = 0; i < 8; i++) f.repeat();
      assert.equal(f.get('dStreak').textContent, '1');
      const stale = [...f.timers.values()][0];
      f.click('dNext');
      const count = f.drawn;
      if (stale) stale();
      assert.equal(f.drawn, count, 'manual next also invalidates an old automatic transition');
      f.submit();
      assert.equal(f.get('dStreak').textContent, '2');
    } finally { f.close(); }
  });
}

test('numbers: yes/no buttons cannot count one condition repeatedly or reverse a first error', () => {
  const f = fixture('numbers-t19', 'yn');
  try {
    f.click('zStart'); f.submit(false);
    for (let i = 0; i < 8; i++) f.repeat(true);
    assert.equal(f.get('zDots').querySelectorAll('.bad').length, 1);
    assert.equal(f.get('zDots').querySelectorAll('.ok').length, 0);
    assert.equal(f.get('dYes').disabled, true);
    assert.equal(f.get('dNo').disabled, true);
    assert.equal(f.timers.size, 1);
    f.flush();
    assert.equal(f.get('dYes').disabled, false);
    f.submit();
    assert.equal(f.get('zDots').querySelectorAll('.ok').length, 1);
  } finally { f.close(); }
});

function openTask(f, index) { f.d.querySelectorAll('#taskList button')[index].click(); }
function setParameter(f, value) {
  f.get('tSlider').value = String(value);
  f.get('tSlider').dispatchEvent(new f.w.Event('input'));
}

test('circle and line: the whole decimal slider agrees with the discriminant, including ±4.2', () => {
  const f = fixture('parameters-t18');
  try {
    openTask(f, 1);
    assert.equal(f.get('tExactControls').hidden, false);
    for (let tenth = -60; tenth <= 60; tenth++) {
      const a = tenth / 10, discriminant = 72 - 4 * a * a;
      setParameter(f, a);
      const expected = discriminant > 0 ? 2 : 0;
      assert.match(f.get('tLive').textContent, new RegExp('→ ' + expected + ' решений$'), 'a=' + a);
      assert.doesNotMatch(f.get('tLive').textContent, /касание/);
    }
  } finally { f.close(); }
});

test('exact ±3√2 controls reach both tangencies; moving the slider and changing task clear exact mode', () => {
  const f = fixture('parameters-t18');
  try {
    openTask(f, 1);
    for (const [id, sign, label] of [['tExactMinus', -1, '−3√2'], ['tExactPlus', 1, '3√2']]) {
      f.click(id);
      assert.match(f.get('tLive').textContent, /= 3 → касание, 1 решение$/);
      assert.equal(f.get(id).getAttribute('aria-pressed'), 'true');
      assert.equal(f.get('tSliderVal').textContent, 'a = ' + label + ' ≈ ' + (sign < 0 ? '−4,24' : '4,24'));
      assert.match(f.get('tSlider').getAttribute('aria-valuetext'), /точное значение/);
      const value = Number(f.get('tSlider').value);
      assert.ok(Math.abs(value - sign * 3 * Math.SQRT2) < 1e-12);
      setParameter(f, sign * 4.2);
      assert.match(f.get('tLive').textContent, /→ 2 решений$/);
      assert.equal(f.get(id).getAttribute('aria-pressed'), 'false');
    }
    f.click('tExactPlus'); f.click('backToList'); openTask(f, 0);
    assert.equal(f.get('tExactControls').hidden, true);
    assert.equal(f.get('tSliderVal').textContent, 'a = 2');
    assert.equal(f.get('tExactPlus').getAttribute('aria-pressed'), 'false');
  } finally { f.close(); }
});

test('cubic key asks for a positive integer; its curve includes the extreme slider intersections', () => {
  const f = fixture('parameters-t18');
  try {
    openTask(f, 4);
    assert.match(f.get('tKeyQ').textContent, /Наименьшее положительное целое a/);
    f.get('tKeyInput').value = '3'; f.click('tKeyCheck');
    assert.equal(f.get('tKeyFb').textContent, 'Верно.');
    for (const a of [-4, 4]) {
      setParameter(f, a);
      assert.equal(f.get('tLive').textContent, 'решений: 1');
      const curve = f.d.querySelector('#tFig path[stroke="#1E3A9F"]');
      const commands = [...curve.getAttribute('d').matchAll(/([ML])\s*([\d.e+-]+)\s+([\d.e+-]+)/g)];
      const level = Number(f.d.querySelector('#tFig line[stroke="#C22F2A"]').getAttribute('y1'));
      let crossings = 0;
      for (let i = 1; i < commands.length; i++) {
        if (commands[i][1] === 'L' && (Number(commands[i - 1][3]) - level) * (Number(commands[i][3]) - level) < 0) crossings++;
      }
      assert.equal(crossings, 1, 'the displayed cubic visibly crosses y=' + a);
    }
  } finally { f.close(); }
});
