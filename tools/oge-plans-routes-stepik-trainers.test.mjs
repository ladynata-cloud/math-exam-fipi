import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const trainerDir = path.join(repoRoot, 'trainers', 'oge-1-5-trainers');
const planPath = path.join(trainerDir, 'practice-1-5-plan-reading.html');
const checkpointPath = path.join(trainerDir, 'practice-1-5-routes-checkpoint-2026.html');
const planUrl = '/trainers/oge-1-5-trainers/practice-1-5-plan-reading.html';
const checkpointUrl =
  '/trainers/oge-1-5-trainers/practice-1-5-routes-checkpoint-2026.html';

function domNode() {
  return {
    addEventListener() {},
    append() {},
    appendChild() {},
    classList: { add() {}, contains: () => false, remove() {}, toggle() {} },
    dataset: {},
    disabled: false,
    hidden: false,
    innerHTML: '',
    remove() {},
    select() {},
    style: {},
    textContent: '',
    value: ''
  };
}

async function loadApi(file, exportName, expression) {
  const html = await readFile(file, 'utf8');
  const script = html.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/i)?.[1];
  assert.ok(script, `${exportName} inline script`);
  const exposeAt = script.lastIndexOf('})();');
  assert.notEqual(exposeAt, -1, `${exportName} IIFE terminator`);
  const node = domNode();
  const sandbox = {
    console,
    document: {
      body: domNode(),
      createElement: domNode,
      execCommand() {},
      getElementById: () => node,
      querySelectorAll: () => []
    },
    localStorage: { getItem: () => null, setItem() {} },
    navigator: {},
    window: { scrollTo() {} }
  };
  vm.runInNewContext(
    `${script.slice(0, exposeAt)}
      globalThis.${exportName} = ${expression};
    ${script.slice(exposeAt)}`,
    sandbox,
    { filename: file }
  );
  return sandbox[exportName];
}

async function loadInteractionHarness(file, expression) {
  const html = await readFile(file, 'utf8');
  const script = html.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/i)?.[1];
  assert.ok(script, 'interaction inline script');
  const exposeAt = script.lastIndexOf('})();');
  assert.notEqual(exposeAt, -1, 'interaction IIFE terminator');
  const nodes = new Map();
  const storage = new Map();
  let copiedText = '';
  const nodeFor = id => {
    if (!nodes.has(id)) {
      const node = domNode();
      node.listeners = {};
      node.addEventListener = (type, handler) => {
        node.listeners[type] = handler;
      };
      nodes.set(id, node);
    }
    return nodes.get(id);
  };
  const sandbox = {
    clearInterval() {},
    confirm: () => true,
    console,
    document: {
      body: domNode(),
      createElement: domNode,
      execCommand() {},
      getElementById: nodeFor,
      querySelectorAll: () => []
    },
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value)
    },
    navigator: {
      clipboard: {
        async writeText(value) {
          copiedText = value;
        }
      }
    },
    setInterval: () => 1,
    window: { scrollTo() {} }
  };
  vm.runInNewContext(
    `${script.slice(0, exposeAt)}
      globalThis.__interactionApi = ${expression};
    ${script.slice(exposeAt)}`,
    sandbox,
    { filename: file }
  );
  return {
    api: sandbox.__interactionApi,
    copiedText: () => copiedText,
    nodes,
    storage
  };
}

function wrongAnswer(task) {
  if (task.type === 'single') return (task.answer + 1) % task.options.length;
  if (task.type === 'multi') return task.answer.slice(0, -1);
  if (task.type === 'number') return String(task.answer + 0.01);
  if (task.type === 'order') return [...task.answer].reverse();
  throw new Error(`Unknown task type: ${task.type}`);
}

test('owner-supplied trainer bytes retain their exact approved hashes', async () => {
  const expected = new Map([
    [planPath, '5f1c299fab81c07cb757eff08095343a3454f7630225cf164dc3d25ac6ce9afa'],
    [
      checkpointPath,
      'c0cb721a0c260c985780f285784e9d6b7aa7ebe259c8924c4a58ae85890afeec'
    ]
  ]);
  for (const [file, digest] of expected) {
    const actual = createHash('sha256').update(await readFile(file)).digest('hex');
    assert.equal(actual, digest, path.basename(file));
  }
});

test('both plan-reading sets contain ten mathematically accepted answers', async () => {
  const api = await loadApi(
    planPath,
    '__planApi',
    '{ bank, sets, isCorrect, normalizedNumber, TOPIC_ID, STORAGE_KEY }'
  );
  assert.equal(api.TOPIC_ID, 'practicePlanReadingTrainer');
  assert.equal(api.STORAGE_KEY, 'mathExamCourseProgress.v1');
  assert.deepEqual(Object.keys(api.sets), ['1', '2']);
  assert.equal(api.normalizedNumber('10,5'), 10.5);
  for (const [setId, indexes] of Object.entries(api.sets)) {
    assert.equal(indexes.length, 10, `set ${setId}`);
    const types = new Set();
    for (const index of indexes) {
      const task = api.bank[index];
      types.add(task.type);
      assert.equal(api.isCorrect(task, task.answer), true, `set ${setId}, task ${index}`);
      if (task.type === 'number') {
        assert.equal(
          api.isCorrect(task, String(task.answer).replace('.', ',')),
          true,
          `set ${setId}, comma task ${index}`
        );
      }
      assert.equal(api.isCorrect(task, wrongAnswer(task)), false, `set ${setId}, wrong ${index}`);
    }
    assert.deepEqual([...types].sort(), ['multi', 'number', 'order', 'single']);
  }
});

test('both route-checkpoint variants expose ten verified control answers', async () => {
  const api = await loadApi(
    checkpointPath,
    '__checkpointApi',
    '{ variants, correct, norm, TOPIC_ID, STORAGE_KEY }'
  );
  assert.equal(api.TOPIC_ID, 'practiceRoutesCheckpoint2026');
  assert.equal(api.STORAGE_KEY, 'mathExamCourseProgress.v1');
  const expected = {
    1: ['4213', 7, 5, 20, 5, '7586', 10, 50, 98, 10],
    2: ['3142', 14, 10, 35, 5, '2649', 13, 60, 102, 30]
  };
  for (const [variantId, answers] of Object.entries(expected)) {
    const questions = api.variants[variantId].questions;
    assert.equal(questions.length, 10, `variant ${variantId}`);
    questions.forEach((question, index) => {
      assert.equal(question.answer, answers[index], `variant ${variantId}, task ${index + 1}`);
      assert.equal(api.correct(question, answers[index]), true);
      if (question.type === 'number') {
        assert.equal(api.correct(question, String(answers[index]).replace('.', ',')), true);
        assert.equal(api.correct(question, Number(answers[index]) + 0.01), false);
      } else {
        assert.equal(api.correct(question, `${answers[index]}9`), false);
      }
    });
  }
});

test('progress updates preserve old topics, teacher mode does not write, and copy is usable', async () => {
  const plan = await loadInteractionHarness(
    planPath,
    '{ state, skills, saveProgress, finish, TOPIC_ID, STORAGE_KEY }'
  );
  plan.storage.set(
    plan.api.STORAGE_KEY,
    JSON.stringify({
      legacyTopic: { solved: 4 },
      [plan.api.TOPIC_ID]: { attempts: 2, bestScore: 8, ownerField: 'keep' }
    })
  );
  plan.api.state.score = 9;
  plan.api.state.variant = 2;
  plan.api.state.mode = 'learn';
  plan.api.state.skillStats = Object.fromEntries(
    plan.api.skills.map(skill => [skill, { right: 1, total: 1 }])
  );
  plan.api.saveProgress();
  const planStored = JSON.parse(plan.storage.get(plan.api.STORAGE_KEY));
  assert.deepEqual(planStored.legacyTopic, { solved: 4 });
  assert.equal(planStored[plan.api.TOPIC_ID].ownerField, 'keep');
  assert.equal(planStored[plan.api.TOPIC_ID].attempts, 3);
  assert.equal(planStored[plan.api.TOPIC_ID].bestScore, 9);
  await plan.nodes.get('copy').listeners.click();
  assert.match(plan.copiedText(), /Как читать план и условие/);
  assert.match(plan.copiedText(), /9 из 10/);
  const beforeTeacher = plan.storage.get(plan.api.STORAGE_KEY);
  plan.api.state.mode = 'teacher';
  plan.api.finish();
  assert.equal(plan.storage.get(plan.api.STORAGE_KEY), beforeTeacher);

  const checkpoint = await loadInteractionHarness(
    checkpointPath,
    '{ state, variants, saveProgress, finish, TOPIC_ID, STORAGE_KEY }'
  );
  checkpoint.storage.set(
    checkpoint.api.STORAGE_KEY,
    JSON.stringify({ legacyTopic: { solved: 4 }, [checkpoint.api.TOPIC_ID]: { attempts: 1 } })
  );
  checkpoint.api.state.variant = 1;
  checkpoint.api.saveProgress(8, 120);
  const checkpointStored = JSON.parse(checkpoint.storage.get(checkpoint.api.STORAGE_KEY));
  assert.deepEqual(checkpointStored.legacyTopic, { solved: 4 });
  assert.equal(checkpointStored[checkpoint.api.TOPIC_ID].attempts, 2);
  assert.equal(checkpointStored[checkpoint.api.TOPIC_ID].lastVariant, 1);
  assert.equal(checkpointStored[checkpoint.api.TOPIC_ID].lastTimeSeconds, 120);
  checkpoint.api.state.answers = Object.fromEntries(
    checkpoint.api.variants[1].questions.map((question, index) => [index, question.answer])
  );
  checkpoint.nodes.get('copy').dataset.score = '10';
  checkpoint.nodes.get('copy').dataset.elapsed = '123';
  await checkpoint.nodes.get('copy').listeners.click();
  assert.match(checkpoint.copiedText(), /Планы и маршруты/);
  assert.match(checkpoint.copiedText(), /10 из 10/);
  const checkpointBeforeTeacher = checkpoint.storage.get(checkpoint.api.STORAGE_KEY);
  checkpoint.api.state.mode = 'teacher';
  checkpoint.api.finish(false);
  assert.equal(checkpoint.storage.get(checkpoint.api.STORAGE_KEY), checkpointBeforeTeacher);
});

test('site discovery, map progress, sitemap, and relative links are complete', async () => {
  const files = {
    map: await readFile(path.join(trainerDir, 'practice-1-5-map.html'), 'utf8'),
    course: await readFile(path.join(repoRoot, 'trainers', 'oge-course', 'index.html'), 'utf8'),
    catalog: await readFile(path.join(repoRoot, 'trainers', 'index.html'), 'utf8'),
    sitemap: await readFile(path.join(repoRoot, 'sitemap.xml'), 'utf8')
  };
  for (const url of [planUrl, checkpointUrl]) {
    assert.ok(files.course.includes(url), `course ${url}`);
    assert.ok(files.sitemap.includes(url), `sitemap ${url}`);
  }
  assert.ok(files.map.includes('href="practice-1-5-plan-reading.html"'));
  assert.ok(files.map.includes('href="practice-1-5-routes-checkpoint-2026.html"'));
  assert.equal((files.map.match(/\bdata-topic=/g) || []).length, 12);
  assert.match(files.map, /<small>\s*\/ 12<\/small>/);
  assert.ok(files.catalog.includes('./oge-1-5-trainers/practice-1-5-plan-reading.html'));
  assert.ok(
    files.catalog.includes('./oge-1-5-trainers/practice-1-5-routes-checkpoint-2026.html')
  );

  for (const entryPath of [planPath, checkpointPath]) {
    const html = await readFile(entryPath, 'utf8');
    const hrefs = [...html.matchAll(/\bhref=["']([^"'#]+)["']/gi)].map(match => match[1]);
    for (const href of hrefs) {
      if (/^(?:https?:|mailto:|tel:|javascript:)/i.test(href)) continue;
      const target = href.startsWith('/')
        ? path.join(repoRoot, ...href.slice(1).split('/'))
        : path.resolve(path.dirname(entryPath), href.split(/[?#]/, 1)[0]);
      await readFile(target);
    }
  }
});

test('board quick-select entries are iframe-only and never promise mirror', async () => {
  const manifest = JSON.parse(
    await readFile(path.join(repoRoot, 'trainers', 'board-compat.json'), 'utf8')
  );
  const expected = [
    [
      'practice-1-5-plan-reading',
      'trainers/oge-1-5-trainers/practice-1-5-plan-reading.html'
    ],
    [
      'practice-1-5-routes-checkpoint-2026',
      'trainers/oge-1-5-trainers/practice-1-5-routes-checkpoint-2026.html'
    ]
  ];
  for (const [trainerId, file] of expected) {
    const entry = manifest.trainers.find(item => item.trainerId === trainerId);
    assert.ok(entry, trainerId);
    assert.equal(entry.file, file);
    assert.equal(entry.boardCompatibility, 'opens-in-board');
    assert.equal(entry.supportsBoardMirror, false);
    assert.equal(entry.supportsSeed, false);
    assert.equal(entry.supportsSemanticEvents, false);
    assert.equal(Object.hasOwn(entry, 'stateSchemaVersion'), false);
    assert.equal(Object.hasOwn(entry, 'bridgeProtocolVersion'), false);
  }
});

test('trainer sources contain no secrets, local paths, network calls, or bridge code', async () => {
  for (const entryPath of [planPath, checkpointPath]) {
    const html = await readFile(entryPath, 'utf8');
    assert.doesNotMatch(html, /(?:token|password|passwd|api[_-]?key)\s*[:=]\s*["'][^"']+["']/i);
    assert.doesNotMatch(html, /(?:[A-Za-z]:[\\/](?:Users|home)[\\/]|file:\/\/)/i);
    assert.doesNotMatch(html, /(?:src|href)=["']https?:\/\//i);
    assert.doesNotMatch(html, /\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/);
    assert.doesNotMatch(html, /\b(?:TrainerBridge|postMessage|socket\.io|io\()\b/i);
  }
});
