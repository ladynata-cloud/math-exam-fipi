'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const pilot = path.resolve(__dirname, '../../equations/linear-pilot');

function memory() {
  const values = new Map();
  return {
    blocked: false,
    get length() { return values.size; },
    key: index => [...values.keys()][index],
    getItem: key => values.get(key) ?? null,
    setItem(key, value) {
      if (this.blocked) throw new Error('Quota exceeded');
      values.set(key, value);
    }
  };
}

function world(storage) {
  const dom = new JSDOM(fs.readFileSync(path.join(pilot, 'index.html'), 'utf8'), {
    runScripts: 'outside-only', url: 'https://mathexam.space/equations/linear-pilot/'
  });
  const w = dom.window;
  Object.defineProperty(w, 'localStorage', { value: storage });
  w.HTMLElement.prototype.scrollIntoView = () => {};
  for (const file of ['data.js', 'store.js', 'app.js', 'basics-data.js', 'basics.js']) {
    w.eval(fs.readFileSync(path.join(pilot, file), 'utf8'));
  }
  return { dom, w, d: w.document };
}

function fill(x, selector, value) {
  const input = x.d.querySelector(selector);
  input.value = value;
  input.dispatchEvent(new x.w.Event('input', { bubbles: true }));
}

function submit(x) {
  x.d.querySelector('#screen form').dispatchEvent(new x.w.Event('submit', { bubbles: true, cancelable: true }));
}

function finishFirstLesson(x) {
  x.d.querySelector('#advanced-route').click();
  for (let j = 0; j < 3; j++) {
    fill(x, `#c0a${j}`, String(x.w.LinearPilotData.forms[0][j][2]));
    fill(x, `#c0w${j}`, 'Выполняю одно действие с обеими частями.');
    fill(x, `#c0p${j}`, String(x.w.LinearPilotData.probes[j][1]));
  }
  submit(x);
  x.d.querySelector('[data-stage="1"]').click();
  const task = x.w.LinearPilotTest.task(1, 0);
  const choice = x.d.querySelector(`input[name="choice"][value="${task[3][0]}"]`);
  choice.checked = true;
  choice.dispatchEvent(new x.w.Event('input', { bubbles: true }));
  fill(x, '#l1t0answer', String(task[4]));
  fill(x, '#l1t0work', 'Прибавляю одно число к обеим частям равенства.');
  submit(x);
  x.d.querySelector('[data-action="finish"]').click();
}

const settle = () => new Promise(resolve => setImmediate(resolve));

test('advanced route count includes pending in-memory completion when storage is full', async () => {
  const storage = memory();
  storage.blocked = true;
  const x = world(storage);
  let restored;
  try {
    finishFirstLesson(x);
    await settle();
    assert.match(x.d.querySelector('#position').textContent, /Скобки/);
    assert.match(x.d.querySelector('#notice').textContent, /Не удалось сохранить/);
    assert.equal(x.d.querySelector('#advanced-count').textContent, '1 из 4 занятий');
    assert.equal(x.d.querySelector('#basics-count').textContent, '0 из 14 шагов');

    storage.blocked = false;
    fill(x, '#l2t0work', 'Черновик после восстановления сохранения');
    restored = world(storage);
    await settle();
    assert.equal(restored.d.querySelector('#advanced-count').textContent, '1 из 4 занятий');
    assert.equal(restored.d.querySelector('#l2t0work').value, 'Черновик после восстановления сохранения');
  } finally {
    x.dom.window.close();
    restored?.dom.window.close();
  }
});

test('advanced route count updates for completion in another tab', async () => {
  const storage = memory();
  const first = world(storage);
  const second = world(storage);
  try {
    finishFirstLesson(first);
    const eventKey = [...Array(storage.length)].map((_, i) => storage.key(i))
      .find(key => key.startsWith(second.w.LinearPilotStore.PREFIX));
    second.w.dispatchEvent(new second.w.StorageEvent('storage', { key: eventKey }));
    await settle();
    assert.equal(second.d.querySelector('#advanced-count').textContent, '1 из 4 занятий');
    assert.equal(second.d.querySelector('#basics-count').textContent, '0 из 14 шагов');
  } finally {
    first.dom.window.close();
    second.dom.window.close();
  }
});

test('advanced route count reflects newly declared external help without waiting for navigation', async () => {
  const x = world(memory());
  try {
    finishFirstLesson(x);
    await settle();
    assert.equal(x.d.querySelector('#advanced-count').textContent, '1 из 4 занятий');
    x.d.querySelector('[data-stage="1"]').click();
    const external = x.d.querySelector('#screen input[name="external"]');
    external.checked = true;
    external.dispatchEvent(new x.w.Event('input', { bubbles: true }));
    await settle();
    assert.equal(x.d.querySelector('#advanced-count').textContent, '0 из 4 занятий');
    assert.equal(x.d.querySelector('#basics-count').textContent, '0 из 14 шагов');
  } finally {
    x.dom.window.close();
  }
});
