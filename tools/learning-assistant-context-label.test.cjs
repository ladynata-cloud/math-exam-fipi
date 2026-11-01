'use strict';
// Context labels must describe the actual input boundary. A saved attempt ID
// alone does not make its current mathematics available to the generic panel.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { JSDOM } = require('jsdom');
const source = fs.readFileSync(path.join(__dirname, '../learning/assistant.js'), 'utf8');
const catalog = require('../board-server/assistant-profile-catalog.json');
async function settle() { for (let index = 0; index < 8; index++) await new Promise(resolve => setImmediate(resolve)); }

async function fixture(t, profileId, context = {}, contextMode = 'entered') {
  const dom = new JSDOM('<!doctype html><body><div id="host"></div></body>', {
    url: 'https://cabinet.example/learning/', runScripts: 'outside-only'
  });
  const { window } = dom, host = window.document.getElementById('host'), calls = [];
  const profile = catalog.find(item => item.id === profileId);
  window.eval(source);
  const dispose = window.LearningAssistant.mount(host, {
    role: 'student', floating: false, isCurrent: () => true, ...context,
    api: async (route, request = {}) => {
      calls.push({ route, body: request.body ? JSON.parse(request.body) : undefined });
      if (route === '/assistant') return {
        enabled: true, available: true, externalEnabled: false, mode: 'offline',
        profile, remaining: 10, dailyLimit: 10, version: 1
      };
      if (route === '/assistant/ask') return {
        ok: true, remaining: 9, contextMode, followUpAvailable: false,
        answer: { answerId: randomUUID(), title: 'Следующий шаг', text: 'Начни с условия.',
          steps: ['Выдели известные числа.'], check: '', verification: 'curated-guidance' }
      };
      throw Error('Unexpected fixture route: ' + route);
    }
  });
  t.after(() => { dispose(); window.close(); });
  await settle();
  return { window, host, calls,
    get introduction() { return host.querySelector('.cabinet-assistant-context').textContent; },
    async ask(question) {
      const input = host.querySelector('[name=assistant-question]');
      input.value = question; input.dispatchEvent(new window.Event('input', { bubbles: true }));
      host.querySelector('.cabinet-assistant-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
      await settle();
    }
  };
}

test('a saved attempt alone still asks for the condition in NOD/NOK and decimal profiles', async t => {
  for (const profile of ['vilenkin-grade6', 'peterson-decimals']) {
    const f = await fixture(t, profile, { attemptId: 'synthetic-owned-attempt' });
    assert.match(f.introduction, /впиши условие открытой работы/);
    assert.match(f.introduction, /Уточнения продолжают показанную ниже подсказку/);
    assert.doesNotMatch(f.introduction, /знает выбранную задачу|Условие уже выбрано|переписывать не нужно/);
    assert.equal(f.host.querySelector('[name=assistant-question]').required, true);
    assert.equal(f.calls.filter(call => call.route === '/assistant/ask').length, 0);
  }
});

test('automatic source-course context is labelled separately and shows its selected condition', async t => {
  const f = await fixture(t, 'atanasyan-first-steps', {
    courseContext: { courseId: 'atanasyan-first-steps', lessonId: 'synthetic-source-task', stepIndex: 0 },
    courseTaskPrompt: 'На отрезке AB выбрана точка C.', courseTaskLabel: 'Выбранная задача'
  });
  assert.match(f.introduction, /Помощник знает выбранную задачу и текущий шаг/);
  assert.match(f.introduction, /Условие переписывать не нужно/);
  assert.doesNotMatch(f.introduction, /впиши условие/);
  assert.equal(f.host.querySelector('.cabinet-assistant-course-condition').textContent, 'На отрезке AB выбрана точка C.');
  assert.equal(f.host.querySelector('[name=assistant-question]'), null);
  assert.equal(f.calls.filter(call => call.route === '/assistant/ask').length, 0);
});

test('manual and server-resolved answer labels follow contextMode rather than presence of attemptId', async t => {
  const manual = await fixture(t, 'vilenkin-grade6', { attemptId: 'synthetic-owned-attempt' });
  await manual.ask('НОД 24 и 36');
  assert.equal(manual.host.querySelector('.cabinet-assistant-question').textContent, 'Задача: НОД 24 и 36');
  const structured = await fixture(t, 'triangle-congruence', { attemptId: 'synthetic-owned-attempt' }, 'current-task');
  await structured.ask('Как начать доказательство?');
  assert.equal(structured.host.querySelector('.cabinet-assistant-question').textContent, 'Подсказка к текущему заданию кабинета');
  const detached = await fixture(t, 'peterson-decimals');
  assert.match(detached.introduction, /в другой вкладке/);
  assert.match(detached.introduction, /Помощник не видит ту вкладку/);
});
