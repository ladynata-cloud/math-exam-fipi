'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { JSDOM, VirtualConsole } = require('jsdom');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const html = read('rounding.html');
const pageScript = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
  .filter(match => !/\bsrc\s*=/.test(match[1]))
  .map(match => match[2]).find(source => source.includes('function generateExample()'));
assert(pageScript, 'the actual rounding page application is present');
const question = 'Я в 6 классе, надо делить уголком';

async function fixture(t) {
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => errors.push(error.message));
  const dom = new JSDOM(html, {
    url: 'https://mathexam.example/rounding.html',
    runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole
  });
  const w = dom.window, d = w.document;
  const timers = new Map();
  let clock = 0, sequence = 0;
  // Run real page callbacks at a chosen event boundary. No page/widget source
  // is rewritten, and no network resources or production data are accessed.
  w.setTimeout = (callback, delay, ...args) => {
    const id = ++sequence;
    timers.set(id, { id, at: clock + Math.max(0, Number(delay) || 0), callback, args });
    return id;
  };
  w.clearTimeout = id => timers.delete(id);
  w.Math.random = () => 0.375;
  w.fetch = () => { throw Error('Unexpected network request in rounding focus fixture'); };
  t.after(() => { try { assert.deepEqual(errors, [], 'the actual scripts have no DOM errors'); } finally { w.close(); } });
  w.eval(read('utils/lib.js'));
  w.eval(pageScript);
  w.eval(read('assets/assistant/navigator-data.js'));
  w.eval(read('assets/assistant/navigator-widget.js'));
  await new Promise(resolve => w.addEventListener('load', resolve, { once: true }));
  const shadow = d.getElementById('maxexam-public-assistant').shadowRoot;
  const input = shadow.querySelector('textarea');
  const answer = d.getElementById('userAnswer');
  function active() {
    let node = d.activeElement;
    while (node?.shadowRoot?.activeElement) node = node.shadowRoot.activeElement;
    return node;
  }
  function advance(ms) {
    const until = clock + ms;
    for (;;) {
      const next = [...timers.values()].filter(timer => timer.at <= until)
        .sort((a, b) => a.at - b.at || a.id - b.id)[0];
      if (!next) break;
      clock = next.at; timers.delete(next.id); next.callback.apply(w, next.args);
    }
    clock = until;
  }
  // jsdom does not perform native text editing. Like browser input commands,
  // these fixture operations target whichever element currently has focus.
  function insertText(text) {
    const target = active();
    assert(target && 'value' in target);
    target.value = text;
    target.dispatchEvent(new w.InputEvent('input', { bubbles: true, composed: true, inputType: 'insertText', data: text }));
  }
  function enter() {
    const target = active();
    const options = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true, composed: true };
    if (target.dispatchEvent(new w.KeyboardEvent('keydown', options))) {
      target.dispatchEvent(new w.KeyboardEvent('keypress', { ...options, charCode: 13 }));
    }
    target.dispatchEvent(new w.KeyboardEvent('keyup', options));
  }
  function assertNavigatorReply() {
    assert.equal(shadow.querySelectorAll('.visitor').length, 1, 'the query was submitted exactly once');
    const replies = [...shadow.querySelectorAll('.navigator')];
    assert.equal(replies.at(-1).querySelector('a').getAttribute('href'), '/trainers/long-division-stepwise.html');
    assert.equal(input.value, '');
    assert.equal(answer.value, '', 'the query never enters the mathematics answer');
  }
  return { w, d, shadow, input, answer, active, advance, insertText, enter, assertNavigatorReply,
    open: () => shadow.querySelector('.launcher').click() };
}

test('rounding initially focuses its answer when the visitor has not chosen another control', async t => {
  const f = await fixture(t);
  f.advance(100);
  assert.equal(f.active(), f.answer);
});

test('a pending rounding focus cannot redirect text intended for the navigator', async t => {
  const f = await fixture(t);
  f.open(); f.input.focus();
  f.advance(100); // Between focus/select and the browser text input command.
  assert.equal(f.active(), f.input, 'the later navigator focus remains active');
  f.insertText(question);
  f.input.focus(); f.enter();
  f.assertNavigatorReply();
});

test('a pending rounding focus cannot redirect Enter after a navigator question was entered', async t => {
  const f = await fixture(t);
  f.open(); f.input.focus(); f.insertText(question); f.input.focus();
  f.advance(100); // Between focus and the browser keyboard command.
  assert.equal(f.active(), f.input, 'Enter still belongs to the navigator');
  f.enter(); f.assertNavigatorReply();
  assert.equal(f.d.getElementById('feedback').textContent, '');
});

test('delayed rounding autofocus also respects a later ordinary page control', async t => {
  const f = await fixture(t);
  const aiQuestion = f.d.getElementById('aiQuestion');
  aiQuestion.focus(); f.insertText('Как выбрать нужный разряд?');
  f.advance(100);
  assert.equal(f.active(), aiQuestion);
  assert.equal(aiQuestion.value, 'Как выбрать нужный разряд?');
  assert.equal(f.answer.value, '');
});

for (const blurHiddenControl of [false, true]) {
  test('rounding Next/category retain answer focus and progress' + (blurHiddenControl ? ' when the old control blurs to BODY' : ''), async t => {
    const f = await fixture(t);
    f.advance(100);
    f.insertText(f.w.buildAITaskPayload('fixture', true).correctAnswer); f.enter();
    assert(f.d.querySelector('#feedback .feedback-correct'), 'normal Enter checks the answer');
    const next = f.d.getElementById('nextBtn');
    next.focus(); next.click();
    assert.equal(next.style.display, 'none');
    // Real layout may blur a newly hidden Next button; jsdom has no layout.
    if (blurHiddenControl) { next.blur(); assert.equal(f.d.activeElement, f.d.body); }
    f.advance(100);
    assert.equal(f.active(), f.answer);
    const category = f.d.querySelector('[data-category="decimals"]');
    category.focus(); category.click();
    f.advance(100);
    assert.equal(f.active(), f.answer);
    const progress = JSON.parse(f.w.localStorage.getItem('roundingTrainer2025'));
    assert.equal(progress.totalAttempts, 1);
    assert.equal(progress.correctAttempts, 1);
    assert.equal(progress.currentCategory, 'decimals');
  });
}
