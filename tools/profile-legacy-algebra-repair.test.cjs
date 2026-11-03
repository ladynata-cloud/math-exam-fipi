const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');

function page(name, query = '', stored = {}) {
  const errors = [], timers = new Map(); let serial = 0;
  const vc = new VirtualConsole(); vc.on('jsdomError', e => errors.push(e.message));
  const dom = new JSDOM(fs.readFileSync(path.join(__dirname, '../ege-profil/trainers/', name), 'utf8'), {
    url: 'https://mathexam.space/ege-profil/trainers/' + name + query,
    runScripts: 'dangerously', virtualConsole: vc,
    beforeParse(w) {
      w.setTimeout = fn => { const id = ++serial; timers.set(id, fn); return id; };
      w.clearTimeout = id => timers.delete(id);
      for (const [key, value] of Object.entries(stored)) w.localStorage.setItem(key, JSON.stringify(value));
    }
  });
  const w = dom.window, $ = selector => w.document.querySelector(selector);
  return { w, $, errors, timers, close: () => w.close(), tick() {
    const next = timers.entries().next().value;
    assert.ok(next, 'a screen transition is pending'); timers.delete(next[0]); next[1]();
  } };
}
const KEY = 'mathExamCourseProgress.v1';
const seeded = { 'functions-t1112': { solved11: 4, solved12: 5, runs: 2, best: 8, passed: true }, anotherCourse: { solved: 19 } };
function fixture(w, line = 12) {
  let calls = 0;
  w.FN.task = () => { calls++; return { line, type: 'fixture', formula: 'y=x²', text: '', ask: 'Найдите f(1).', answer: 7, sol: 'Ответ: 7.', fn: x => x, pts: [] }; };
  return () => calls;
}

test('functions: assistance, wrong feedback and repeated answers preserve honest progress', () => {
  const p = page('functions-t1112.html', '', { [KEY]: seeded });
  try {
    fixture(p.w); p.$('#dNext').click();
    p.$('#dAnswer').value = '0'; p.$('#dCheck').click();
    assert.doesNotMatch(p.$('#dFb').textContent, /7|Правильный ответ/);
    p.$('#dSol').click(); assert.match(p.$('#dFb').textContent, /Ответ: 7/);
    p.$('#dAnswer').value = '7';
    for (let i = 0; i < 10; i++) p.$('#dCheck').dispatchEvent(new p.w.Event('click'));
    assert.equal(JSON.parse(p.w.localStorage.getItem(KEY))['functions-t1112'].solved12, 5);
    assert.equal(p.$('#stStreak').textContent, '0');
    assert.match(p.$('#dFb').textContent, /с помощью/);
    p.$('#dNext').click(); p.$('#dAnswer').value = '7';
    for (let i = 0; i < 10; i++) p.$('#dCheck').dispatchEvent(new p.w.Event('click'));
    const saved = JSON.parse(p.w.localStorage.getItem(KEY));
    assert.equal(saved['functions-t1112'].solved12, 6);
    assert.deepEqual(saved.anotherCourse, seeded.anotherCourse);
    assert.equal(saved['functions-t1112'].best, 8);
    assert.equal(saved['functions-t1112'].passed, true);
    assert.equal(p.timers.size, 1);
    p.$('#dNext').click(); assert.equal(p.timers.size, 0, 'manual next cancels automatic next');
    assert.deepEqual(p.errors, []);
  } finally { p.close(); }
});

test('functions: ten clicks cannot pass a ten-task exam; restart invalidates pending next', () => {
  const p = page('functions-t1112.html', '', { [KEY]: seeded });
  try {
    const calls = fixture(p.w);
    p.$('#zStart').click(); p.$('#zAnswer').value = '7';
    for (let i = 0; i < 10; i++) p.$('#zCheck').dispatchEvent(new p.w.Event('click'));
    assert.equal(p.w.document.querySelectorAll('#zDots .ok').length, 1);
    assert.equal(JSON.parse(p.w.localStorage.getItem(KEY))['functions-t1112'].best, 8);
    assert.equal(p.$('#zDone').style.display, 'none');
    const stale = [...p.timers.values()][0];
    p.$('#zStart').click(); const before = calls(); stale();
    assert.equal(calls(), before, 'a callback from an older exam cannot advance a restarted exam');
    assert.equal(p.timers.size, 0);
    for (let n = 0; n < 10; n++) {
      p.$('#zAnswer').value = '7'; p.$('#zCheck').click();
      p.$('#zCheck').dispatchEvent(new p.w.Event('click'));
      if (n < 9) p.tick();
    }
    assert.equal(p.$('#zScore').textContent, '10 / 10');
    assert.equal(JSON.parse(p.w.localStorage.getItem(KEY))['functions-t1112'].best, 10);
    assert.deepEqual(p.errors, []);
  } finally { p.close(); }
});

test('functions: zero coefficient is a punctured horizontal line, with controls visible', () => {
  const p = page('functions-t1112.html');
  try {
    p.$('#sk').value = '0'; p.$('#sk').dispatchEvent(new p.w.Event('input'));
    assert.equal(p.$('#skv').textContent, '0');
    assert.ok(p.$('#heroInfo').textContent.includes('x ≠ -1'));
    assert.equal(p.w.document.querySelectorAll('#heroFig [data-hole]').length, 1);
    assert.equal(p.w.document.querySelectorAll('#heroFig [stroke-dasharray]').length, 0);
    assert.ok(p.$('#heroFig path').getAttribute('d').length > 100);
    assert.equal(p.$('#heroFig').closest('details'), null);
    assert.equal(p.$('#sk').closest('details'), null);
    assert.equal(p.w.document.querySelectorAll('details[open]').length, 0);
  } finally { p.close(); }
});

test('functions: topic links select existing practice and retain storage and unknown coefficients', () => {
  for (const [topic, label, number] of [['graphs', 'графики', '№12'], ['extrema', 'экстремумы', '№9']]) {
    const p = page('functions-t1112.html', '?topic=' + topic, { [KEY]: seeded });
    try {
      assert.ok(p.$('#view-drill').classList.contains('on'));
      assert.equal(p.$('#modeChips [aria-pressed=true]').textContent, label);
      assert.ok(p.$('#dTag').textContent.startsWith(number));
      assert.deepEqual(JSON.parse(p.w.localStorage.getItem(KEY)), seeded);
      assert.equal(p.w.FN.G11[4]().formula, 'f(x) = log_b(x + a)');
      assert.equal(p.w.FN.G11[5]().formula, 'f(x) = √(x + p) + q');
      assert.deepEqual(p.errors, []);
    } finally { p.close(); }
  }
});

test('functions: shared help and the idea tab do not earn an independent exam pass', () => {
  const p = page('functions-t1112.html', '', { [KEY]: seeded });
  try {
    fixture(p.w);
    const help = p.w.document.createElement('button'); help.id = 'profile-course-help'; p.w.document.body.appendChild(help);
    p.$('#dNext').click(); help.click(); p.$('#dAnswer').value = '7'; p.$('#dCheck').click();
    assert.equal(JSON.parse(p.w.localStorage.getItem(KEY))['functions-t1112'].solved12, 6, 'opening the help chooser alone is not assistance');
    p.$('#dNext').click();
    p.w.document.dispatchEvent(new p.w.CustomEvent('profile-course-help-requested', {detail:{path:'/ege-profil/trainers/functions-t1112.html',lessonId:'expr-powers'}}));
    p.$('#dAnswer').value = '7'; p.$('#dCheck').click();
    assert.equal(JSON.parse(p.w.localStorage.getItem(KEY))['functions-t1112'].solved12, 6);
    p.$('#dNext').click(); p.$('#zStart').click(); p.$('[data-view=idea]').click();
    for (let n = 0; n < 10; n++) {
      p.$('#zAnswer').value = '7'; p.$('#zCheck').click();
      if (n < 9) p.tick();
    }
    const result = JSON.parse(p.w.localStorage.getItem(KEY))['functions-t1112'];
    assert.equal(result.best, 8); assert.equal(result.passed, true, 'a historical pass is retained');
    assert.equal(result.assistedExamBest, 10);
    assert.match(p.$('#zVerdict').textContent, /с помощью/);
    assert.deepEqual(p.errors, []);
  } finally { p.close(); }
});

function fillAssembly(p, id, selector) {
  const answer = p.w.eval('ASSEMBLIES[' + JSON.stringify(id) + '].answer');
  for (const value of answer) {
    const b = [...p.w.document.querySelectorAll(selector + ' .tile')].find(x => x.dataset.t === value && !x.classList.contains('placed'));
    assert.ok(b, 'an unused matching tile exists'); b.click();
  }
}

test('sum-to-product: repeated entry and all ten traps remain interactive, without automatic answers', () => {
  const p = page('trig-sum-to-product.html');
  try {
    for (const mode of ['practice', 'learn', 'practice']) p.$('[data-mode=' + mode + ']').click();
    const firstCorrect = p.w.eval('TRAPS[0].correct');
    p.$('#trap-c [data-i="' + ((firstCorrect + 1) % 3) + '"]').click();
    assert.equal(p.w.state.trapIx, 0);
    assert.equal(p.w.document.querySelectorAll('#trap-c .correct').length, 0);
    assert.match(p.$('#trap-fb').textContent, /попробовать ещё раз/);
    assert.equal(p.w.document.querySelectorAll('details[open]').length, 0);
    p.tick();
    for (let n = 0; n < 10; n++) {
      const correct = p.w.eval('TRAPS[state.trapIx].correct');
      const button = p.$('#trap-c [data-i="' + correct + '"]');
      button.click(); button.dispatchEvent(new p.w.Event('click'));
      assert.equal(p.timers.size, 1); p.tick();
      assert.equal(p.w.state.trapIx, n + 1);
    }
    assert.equal(p.w.state.progress.trapsCleared, 10);
    assert.equal(JSON.parse(p.w.localStorage.getItem('trig-stp-trainer-v2')).progress.trapsCleared, 10);
    assert.deepEqual(p.errors, []);
  } finally { p.close(); }
});

test('sum-to-product: five different answers produce exactly five marks and persist the result', () => {
  for (const assisted of [false, true]) {
  const p = page('trig-sum-to-product.html');
  try {
    p.w.state.view = 'finalTest'; p.w.state.test = p.w.buildFinalTest(); p.w.render();
    if (assisted) {
      p.w.state.progress.testBest = 4;
      p.w.document.dispatchEvent(new p.w.CustomEvent('profile-course-help-requested', {detail:{path:p.w.location.pathname,lessonId:'algebra-double-angle'}}));
    }
    for (let index = 0; index < 5; index++) {
      const q = p.w.state.test[index]; let button;
      if (q.kind === 'assembly') {
        fillAssembly(p, q.id, '#ft-bank'); button = p.$('#ft-check');
      } else if (q.kind === 'pick') {
        const text = p.w.document.createElement('div'); text.innerHTML = p.w.eval('FORMULAS[' + JSON.stringify(q.id) + ']');
        button = [...p.w.document.querySelectorAll('#ft-c .choice')].find(b => b.querySelector('.body').textContent === text.textContent);
      } else {
        const correct = p.w.eval('TRAPS.find(t=>t.id===' + JSON.stringify(q.id) + ').correct');
        button = p.$('#ft-tc [data-i="' + correct + '"]');
      }
      assert.ok(button); button.click();
      for (let n = 0; n < 6; n++) button.dispatchEvent(new p.w.Event('click'));
      assert.equal(p.w.state.testAnswers.length, index + 1);
      assert.equal(p.w.state.testIx, index + 1);
      assert.equal(p.timers.size, 1); p.tick();
    }
    assert.match(p.$('h2').textContent, /5 \/ 5/);
    assert.equal(p.w.state.progress.testBest, assisted ? 4 : 5);
    assert.equal(JSON.parse(p.w.localStorage.getItem('trig-stp-trainer-v2')).progress.testBest, assisted ? 4 : 5);
    if (assisted) {
      assert.equal(p.w.state.progress.testAssistedBest, 5);
      assert.match(p.w.document.body.textContent, /Решено с помощью/);
      p.w.buildFinalTest(); assert.equal(p.w.state.testHelped, false, 'a new test starts independently');
    }
    assert.deepEqual(p.errors, []);
  } finally { p.close(); }
  }
});

test('sum-to-product: navigation cancels old timers and does not replay a recorded answer', () => {
  const p = page('trig-sum-to-product.html');
  try {
    p.w.state.view = 'finalTest'; p.w.state.test = p.w.buildFinalTest(); p.w.render();
    fillAssembly(p, p.w.state.test[0].id, '#ft-bank'); p.$('#ft-check').click();
    const stale = [...p.timers.values()][0];
    p.$('[data-mode=learn]').click(); assert.equal(p.timers.size, 0); stale();
    assert.equal(p.w.state.view, 'onboarding'); assert.equal(p.w.state.testIx, 1);
    p.w.state.view = 'finalTest'; p.w.render();
    assert.equal(p.w.state.testIx, 1); assert.equal(p.w.state.testAnswers.length, 1);
    assert.deepEqual(p.errors, []);
  } finally { p.close(); }
});

test('sum-to-product: both introductory cards and all four formula derivations can be completed', () => {
  const p = page('trig-sum-to-product.html');
  try {
    assert.equal(p.$('.colorkey').closest('details').open, false);
    p.$('[data-onb=pq]').click();
    for (let n = 0; n < 2; n++) {
      const correct = p.w.eval('PQ_INTRO.steps[state.pqIx].choices.findIndex(c=>c.correct)');
      p.$('#pq-choices [data-i="' + correct + '"]').click(); p.tick();
      assert.equal(p.w.state.pqIx, n + 1);
    }
    for (const id of ['ssum', 'sdiff', 'csum', 'cdiff']) {
      p.w.state.view = 'lesson'; p.w.state.lesson = id; p.w.state.section = 'derive'; p.w.state.stepIx = 0; p.w.render();
      const steps = p.w.eval('LESSONS[' + JSON.stringify(id) + '].steps');
      for (let n = 0; n < steps.length; n++) {
        const step = steps[n];
        if (step.type === 'construct') {
          for (const value of step.answer) {
            [...p.w.document.querySelectorAll('#bank-' + n + ' .tile')].find(b => b.dataset.t === value && !b.classList.contains('placed')).click();
          }
          const check = p.$('#check-' + n); check.click(); check.dispatchEvent(new p.w.Event('click'));
          assert.equal(p.timers.size, 1); p.tick();
        } else if (step.type === 'choice') {
          const correct = step.choices.findIndex(c => c.correct);
          p.$('#lc-' + n + ' [data-i="' + correct + '"]').click(); p.tick();
        } else {
          const next = [...p.w.document.querySelectorAll('.btn-row button')].find(b => /state\.stepIx\+\+/.test(b.getAttribute('onclick') || ''));
          assert.ok(next); next.click();
        }
        assert.equal(p.w.state.stepIx, n + 1, id + ': step advances once');
      }
      assert.equal(p.w.state.progress[id].derive, true);
    }
    assert.deepEqual(p.errors, []);
  } finally { p.close(); }
});
