'use strict';
// Real DOM interactions verify that a final answer can only be credited as
// independent when no method-bearing drawing aid has been opened.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const start = path.resolve(__dirname, '../ege-profil/start');

function fixture() {
  const dom = new JSDOM('<main id="model"></main>', { runScripts: 'outside-only' });
  const w = dom.window;
  for (const name of ['geometry-data', 'stereo-data', 'probability-data', 'equations-data', 'functions-data', 'applied-data',
    'planimetry-tasks', 'vector-tasks', 'stereo-tasks', 'probability-tasks', 'equations-tasks', 'functions-tasks', 'applied-tasks']) {
    w.eval(fs.readFileSync(path.join(start, name + '.js'), 'utf8'));
  }
  const container = w.document.getElementById('model');
  let helps = 0, beforeHelp = () => {}, cleanup = () => {};
  return {
    dom, w, container, lessons: w.ProfileLessons,
    get helps() { return helps; },
    watch(fn) { beforeHelp = fn; },
    mount(task, strict, extra = {}) {
      cleanup(); container.replaceChildren(); helps = 0; beforeHelp = () => {};
      cleanup = w.ProfileTaskModels[task.id](container, task, {
        mode: 'independent', strict, solved: false, completed: 0, ...extra,
        onHelp() { beforeHelp(); helps++; }
      }) || (() => {});
      assert.ok(container.querySelector('svg'), task.id + ': necessary drawing is present');
      assert.equal(helps, 0, task.id + ': reading the drawing is free');
    },
    close() { cleanup(); dom.window.close(); }
  };
}
const selectTasks = (f, predicate) => f.lessons.filter(predicate).flatMap(l => l.tasks);

test('planimetry: every auxiliary construction has a neutral label and records help before revealing its layer', () => {
  const f = fixture();
  try {
    const tasks = selectTasks(f, l => l.group === 'geometry');
    assert.equal(tasks.length, 36);
    for (const strict of [false, true]) for (const task of tasks) {
      f.mount(task, strict);
      const buttons = [...f.container.querySelectorAll('button')];
      const layers = [...f.container.querySelectorAll('[data-model-layer]')];
      assert.ok(buttons.length > 0, task.id);
      if (['geo-right-cosine', 'geo-right-sine', 'geo-right-tangent'].includes(task.id)) {
        assert.equal(buttons.length, 1); assert.equal(layers.length, 0, 'A requested walkthrough is not pre-rendered');
        const button = buttons[0];
        assert.equal(button.textContent, 'Разобрать решение по шагам');
        assert.equal(button.getAttribute('aria-expanded'), 'false');
        assert.equal(f.container.querySelector('.profile-model-note').textContent, 'Это чертёж к текущей задаче. Открытие разбора — подсказка.');
        assert.equal(f.container.querySelector('[data-trig-explanation]'), null);
        assert.doesNotMatch(f.container.textContent, new RegExp('(^|[^\\d])' + task.answer + '([^\\d]|$)', 'u'), task.id + ': no final number before help');
        f.watch(() => {
          assert.equal(f.container.querySelector('[data-trig-explanation]'), null, task.id + ': help precedes explanation DOM');
          assert.equal(f.container.querySelector('[data-model-layer]'), null, task.id + ': help precedes construction DOM');
        });
        button.click(); assert.equal(f.helps, 1);
        const panel = f.container.querySelector('[data-trig-explanation]'), layer = f.container.querySelector('[data-model-layer]');
        assert.equal(layer.getAttribute('visibility'), 'visible'); assert.equal(panel.hidden, false);
        assert.equal(panel.querySelectorAll('[data-trig-step]').length, 1);
        const next = panel.querySelector('[data-trig-next]');
        for (let count = 2; count <= 5; count++) { next.click(); assert.equal(panel.querySelectorAll('[data-trig-step]').length, count); }
        assert.equal(f.helps, 1, 'Next steps are part of the already-recorded help');
        button.click(); assert.equal(f.helps, 1); assert.equal(panel.hidden, true); assert.equal(layer.getAttribute('visibility'), 'hidden');
        button.click(); assert.equal(f.helps, 1); assert.equal(panel.hidden, false); assert.equal(panel.querySelectorAll('[data-trig-step]').length, 5);
        continue;
      }
      assert.equal(buttons.length, layers.length);
      assert.equal(f.container.querySelector('.profile-model-note').textContent, 'Это чертёж к текущей задаче. Открытие построения — подсказка.');
      buttons.forEach((button, i) => {
        assert.equal(button.textContent, 'Показать подсказку к рисунку');
        assert.equal(layers[i].getAttribute('visibility'), 'hidden');
        f.watch(() => assert.equal(layers[i].getAttribute('visibility'), 'hidden', task.id + ': help is recorded first'));
        const before = f.helps;
        button.click();
        assert.equal(f.helps, before + 1); assert.equal(layers[i].getAttribute('visibility'), 'visible');
        assert.notEqual(f.container.querySelector('.profile-model-note').textContent, 'Это чертёж к текущей задаче. Открытие построения — подсказка.');
        button.click(); assert.equal(f.helps, before + 1); assert.equal(layers[i].getAttribute('visibility'), 'hidden');
      });
    }
  } finally { f.close(); }
});


test('right-triangle walkthroughs derive ratios and arithmetic from the current condition', () => {
  const f = fixture();
  try {
    const variants = [
      ['geo-right-cosine', { part: 18, ratio: 0.6 }, 30, '18 : 0,6 = 180 : 6 = 30', '30 · 0,6 = 18'],
      ['geo-right-sine', { whole: 20, ratio: 0.6 }, 12, '20 · 0,6 = 120 : 10 = 12', ['12', '20', '0,6']],
      ['geo-right-tangent', { whole: 8, ratio: 1.5 }, 12, '8 · 1,5 = 120 : 10 = 12', ['12', '8', '1,5']]
    ];
    for (const [id, meta, answer, arithmetic, check] of variants) {
      const original = selectTasks(f, lesson => lesson.group === 'geometry').find(task => task.id === id);
      f.mount({ ...original, meta, answer, prompt: 'Проверочное условие с изменёнными известными величинами.' }, true);
      f.container.querySelector('[data-trig-open]').click();
      const next = f.container.querySelector('[data-trig-next]'); for (let i = 1; i < 5; i++) next.click();
      const panel = f.container.querySelector('[data-trig-explanation]');
      assert.ok(panel.textContent.includes(arithmetic), id + ': current arithmetic');
      const finalStep = panel.querySelector('[data-trig-step="5"]');
      if (Array.isArray(check)) {
        const relation = finalStep.querySelector('.profile-trig-ratio');
        assert.ok(relation, id + ': current ratio is a stacked fraction');
        assert.equal(relation.getAttribute('role'), 'math');
        assert.equal(relation.querySelector('.profile-trig-numerator').textContent, check[0]);
        assert.equal(relation.querySelector('.profile-trig-denominator').textContent, check[1]);
        assert.equal(relation.querySelector('.profile-trig-fraction').getAttribute('aria-hidden'), 'true');
        for (const value of check) assert.ok(relation.getAttribute('aria-label').includes(value), id + ': accessible relation includes ' + value);
      } else assert.ok(finalStep.textContent.includes(check), id + ': current ratio check');
    }
  } finally { f.close(); }
});

test('vectors: projections and reverse-arrow controls cannot silently supply a method', () => {
  const f = fixture();
  try {
    const tasks = selectTasks(f, l => l.group === 'vectors'); assert.equal(tasks.length, 24);
    for (const strict of [false, true]) for (const task of tasks) {
      f.mount(task, strict);
      assert.match(f.container.querySelector('.model-caption').textContent, /^(На рисунке показаны точки и векторы из условия задачи\.|Схема к условию задачи\. Она показана без масштаба\.)$/);
      if (task.id === 'vec-length-unknown') {
        assert.equal(f.container.querySelector('[data-length-triangle]'), null);
        assert.ok(f.container.querySelector('svg').textContent.includes('a = (x; 9)'));
        assert.ok(f.container.querySelector('svg').textContent.includes('|a| = 15'));
      }
      for (const button of f.container.querySelectorAll('button')) {
        assert.equal(button.textContent, 'Показать подсказку к рисунку');
        const beforeSvg = f.container.querySelector('svg').innerHTML;
        f.watch(() => {
          assert.equal(button.getAttribute('aria-pressed'), 'false');
          assert.equal(f.container.querySelector('svg').innerHTML, beforeSvg);
        });
        const before = f.helps; button.click();
        assert.equal(f.helps, before + 1, task.id);
        assert.notEqual(f.container.querySelector('svg').innerHTML, beforeSvg, task.id + ': the requested drawing aid is usable');
        if (task.id === 'vec-length-unknown') assert.ok(f.container.querySelector('[data-length-triangle]'));
        button.click(); assert.equal(f.helps, before + 1);
      }
      for (const [id, missing] of [['vec-coordinates-end', 'B'], ['vec-coordinates-start', 'A'], ['vec-coordinates-equal', 'D']]) {
        if (task.id === id) assert.equal(f.container.querySelector('[data-point="' + missing + '"]'), null, id);
      }
    }
  } finally { f.close(); }
});

test('equations: parts of a formula count as help, while the original expression stays visible', () => {
  const f = fixture();
  try {
    const tasks = selectTasks(f, l => /^(eq-|expr-)/.test(l.id)); assert.equal(tasks.length, 48);
    for (const strict of [false, true]) for (const task of tasks) {
      f.mount(task, strict);
      const parts = f.container.querySelector('[data-expression-parts]'), button = f.container.querySelector('button');
      const expression = f.container.querySelector('[data-current-expression]');
      const expected = task.diagram.left + (task.diagram.right !== null ? ' = ' + task.diagram.right : '');
      assert.equal(expression.textContent, expected); assert.ok(parts.hidden);
      assert.equal(button.textContent, 'Показать подсказку к записи');
      f.watch(() => assert.ok(parts.hidden, task.id + ': help is recorded before explanation'));
      button.click(); assert.equal(f.helps, 1); assert.equal(parts.hidden, false);
      assert.equal(parts.children.length, task.diagram.parts.length);
      button.click(); assert.equal(f.helps, 1); assert.ok(parts.hidden);
    }
  } finally { f.close(); }
});

test('functions: captions do not disclose the method; opening lines or numeric exploration records help first', () => {
  const f = fixture();
  try {
    const tasks = selectTasks(f, l => /^(calc-|fn-)/.test(l.id)); assert.equal(tasks.length, 66);
    for (const strict of [false, true]) for (const task of tasks) {
      // A partial guided step must not accidentally expose the full solution
      // when a caller switches the renderer to independent mode.
      f.mount(task, strict, { completed: 1 });
      const paragraphs = f.container.querySelectorAll('.function-task-model > p');
      assert.match(paragraphs[1].textContent, /^На рисунке дан график (из условия задачи\.|производной f′\(x\)\.)$/);
      const button = f.container.querySelector('button'), details = f.container.querySelector('details');
      assert.equal(button.textContent, 'Показать подсказку к рисунку');
      assert.equal(f.container.querySelector('[data-helper]'), null);
      assert.equal(f.container.querySelector('[data-revealed-value]'), null);
      assert.equal(f.container.querySelector('circle[data-given="false"]'), null);
      f.watch(() => assert.equal(f.container.querySelector('[data-helper]'), null));
      button.click(); assert.equal(f.helps, 1); assert.ok(f.container.querySelector('[data-helper]'));
      button.click(); assert.equal(f.helps, 1);
      f.watch(() => assert.equal(f.container.querySelector('[data-revealed-value]'), null));
      details.open = true; details.dispatchEvent(new f.w.Event('toggle'));
      assert.equal(f.helps, 2); assert.ok(f.container.querySelector('[data-revealed-value]'));
      const slider = f.container.querySelector('input'); slider.value = slider.max; slider.dispatchEvent(new f.w.Event('input'));
      assert.equal(f.helps, 2); assert.ok(f.container.querySelector('[data-cursor]'));
      details.dispatchEvent(new f.w.Event('toggle')); assert.equal(f.helps, 2, 'duplicate toggle events do not duplicate the reveal');
    }
  } finally { f.close(); }
});

test('probability: givens and distributions stay visible, highlighting and enumerating outcomes count as help', () => {
  const f = fixture();
  try {
    const tasks = selectTasks(f, l => l.group === 'probability'); assert.ok(tasks.length >= 24);
    for (const strict of [false, true]) for (const task of tasks) {
      f.mount(task, strict);
      const button = f.container.querySelector('button'), svg = f.container.querySelector('svg');
      assert.equal(button.textContent, 'Показать подсказку к рисунку'); assert.equal(svg.dataset.focus, 'neutral');
      if (task.diagram.type === 'bernoulli') assert.equal(f.container.querySelector('[data-pattern-cell]'), null);
      if (task.diagram.type === 'distribution') assert.ok(svg.textContent.includes('Вероятн.'));
      f.watch(() => { assert.equal(svg.dataset.focus, 'neutral'); assert.equal(button.getAttribute('aria-pressed'), 'false'); });
      button.click(); assert.equal(f.helps, 1); assert.equal(button.getAttribute('aria-pressed'), 'true');
      if (task.diagram.type === 'bernoulli') assert.ok(f.container.querySelector('[data-pattern-cell]'));
      button.click(); assert.equal(f.helps, 1); assert.equal(svg.dataset.focus, 'neutral');
    }
  } finally { f.close(); }
});

test('applied tasks: highlighting supplied data is free; constructing their relationship records help first', () => {
  const f = fixture();
  try {
    const tasks = selectTasks(f, l => l.id.startsWith('applied-')); assert.ok(tasks.length >= 18);
    for (const strict of [false, true]) for (const task of tasks) {
      f.mount(task, strict);
      const table = f.container.querySelector('table'), givens = table.textContent;
      const highlight = f.container.querySelector('[data-model-action="highlight"]'), explain = f.container.querySelector('[data-model-action="explain"]');
      assert.ok(table.querySelector('[data-target]').textContent.includes('?'));
      highlight.click(); assert.equal(f.helps, 0); assert.equal(table.textContent, givens);
      assert.equal(explain.textContent, 'Показать подсказку к рисунку');
      f.watch(() => assert.equal(explain.getAttribute('aria-expanded'), 'false'));
      explain.click(); assert.equal(f.helps, 1); assert.equal(explain.getAttribute('aria-expanded'), 'true');
      assert.ok(f.container.textContent.includes(task.diagram.help));
      explain.click(); assert.equal(f.helps, 1); assert.equal(explain.getAttribute('aria-expanded'), 'false');
    }
  } finally { f.close(); }
});

test('stereometry: rotating the necessary 3D condition remains free in strict independent mode', () => {
  const f = fixture();
  try {
    const tasks = selectTasks(f, l => l.group === 'stereometry'); assert.equal(tasks.length, 48);
    for (const task of tasks) {
      f.mount(task, true);
      const svg = f.container.querySelector('svg'), originalYaw = svg.dataset.yaw;
      assert.equal(f.container.querySelector('.stereo-focus-note').textContent, 'Данные — на рисунке. Поверни фигуру, если нужно.');
      const givens = f.container.querySelector('.stereo-labels').textContent;
      f.container.querySelector('[aria-label="Повернуть влево"]').click();
      assert.notEqual(svg.dataset.yaw, originalYaw); assert.equal(f.helps, 0);
      svg.dispatchEvent(new f.w.KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true })); assert.equal(f.helps, 0);
      for (const button of f.container.querySelectorAll('button')) button.click();
      assert.equal(f.helps, 0); assert.equal(f.container.querySelector('.stereo-labels').textContent, givens);
    }
  } finally { f.close(); }
});
