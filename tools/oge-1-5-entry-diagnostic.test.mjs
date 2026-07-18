import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const trainerDir = path.join(repoRoot, 'trainers', 'oge-1-5-trainers');
const mapPath = path.join(trainerDir, 'practice-1-5-map.html');
const diagnosticPath = path.join(trainerDir, 'practice-1-5-entry-diagnostic-2026.html');
const mapUrl = '/trainers/oge-1-5-trainers/practice-1-5-map.html';
const diagnosticUrl = '/trainers/oge-1-5-trainers/practice-1-5-entry-diagnostic-2026.html';

function domNode() {
  return {
    addEventListener() {},
    appendChild() {},
    classList: { add() {}, remove() {}, toggle() {} },
    dataset: {},
    hidden: false,
    style: {},
    value: ''
  };
}

async function loadDiagnosticApi() {
  const html = await readFile(diagnosticPath, 'utf8');
  const script = html.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/i)?.[1];
  assert.ok(script, 'diagnostic inline script');
  const exposeAt = script.lastIndexOf('})();');
  assert.notEqual(exposeAt, -1, 'diagnostic IIFE terminator');
  const testable = `${script.slice(0, exposeAt)}
    globalThis.__diagnosticTestApi = { VARIANTS, buildQuestions, checkQuestion };
  ${script.slice(exposeAt)}`;
  const node = domNode();
  const sandbox = {
    console,
    document: {
      body: domNode(),
      createElement: domNode,
      getElementById: () => node,
      querySelectorAll: () => []
    },
    localStorage: { getItem: () => null, setItem() {} },
    navigator: {},
    window: {
      addEventListener() {},
      confirm: () => true,
      print() {},
      scrollTo() {},
      setTimeout() {}
    }
  };
  vm.runInNewContext(testable, sandbox, { filename: diagnosticPath });
  return sandbox.__diagnosticTestApi;
}

function expectedAnswers(variant) {
  const volume = variant.stoves.l * variant.stoves.w * variant.stoves.h;
  const stoveIndex = variant.stoves.models.findIndex(
    model => volume >= model[1] && volume <= model[2]
  ) + 1;
  const directFactor = variant.percentDirect.action === 'discount'
    ? 1 - variant.percentDirect.pct / 100
    : 1 + variant.percentDirect.pct / 100;
  const reverseFactor = variant.percentReverse.action === 'increase'
    ? 1 + variant.percentReverse.pct / 100
    : 1 - variant.percentReverse.pct / 100;
  return [
    (variant.roadsGrid.horizontal + variant.roadsGrid.vertical) * variant.roadsGrid.scale,
    Math.sqrt(variant.roadsSchema.a ** 2 + variant.roadsSchema.b ** 2),
    variant.tires.width * variant.tires.profile / 100,
    String(stoveIndex),
    variant.plots.l * variant.plots.w / (variant.plots.tileL * variant.plots.tileW),
    Math.ceil(variant.apartments.l * variant.apartments.w / variant.apartments.pack),
    variant.tariffs.base
      + Math.max(0, variant.tariffs.used - variant.tariffs.included) * variant.tariffs.extra,
    2 ** variant.paper.folds,
    variant.percentDirect.base * directFactor,
    variant.percentReverse.final / reverseFactor
  ];
}

test('all three diagnostic variants expose ten mathematically correct answers', async () => {
  const { VARIANTS, buildQuestions, checkQuestion } = await loadDiagnosticApi();
  assert.equal(VARIANTS.length, 3);
  for (const variant of VARIANTS) {
    const questions = buildQuestions(variant);
    const expected = expectedAnswers(variant);
    assert.equal(questions.length, 10, variant.label);
    questions.forEach((question, index) => {
      if (question.type === 'select') {
        assert.equal(question.answer, expected[index], `${variant.label} question ${index + 1}`);
        assert.equal(checkQuestion(question, expected[index]), true);
        assert.equal(checkQuestion(question, expected[index] === '1' ? '2' : '1'), false);
        return;
      }
      assert.ok(
        Math.abs(Number(question.answer) - Number(expected[index])) < 1e-9,
        `${variant.label} question ${index + 1}`
      );
      assert.equal(checkQuestion(question, String(expected[index]).replace('.', ',')), true);
      assert.equal(checkQuestion(question, String(Number(expected[index]) + 0.001)), false);
    });
  }
});

test('both trainer entrypoints have closed relative HTML dependencies', async () => {
  for (const entryPath of [mapPath, diagnosticPath]) {
    const html = await readFile(entryPath, 'utf8');
    const hrefs = [...html.matchAll(/\bhref=["']([^"'#]+)["']/gi)].map(match => match[1]);
    for (const href of hrefs) {
      if (href.includes('${') || /^(?:https?:|mailto:|tel:|javascript:)/i.test(href)) continue;
      const target = href.startsWith('/')
        ? path.join(repoRoot, ...href.slice(1).split('/'))
        : path.resolve(path.dirname(entryPath), href.split(/[?#]/, 1)[0]);
      await readFile(target);
    }
  }
});

test('site discovery and sitemap contain both exact canonical URLs', async () => {
  const files = {
    home: await readFile(path.join(repoRoot, 'index.html'), 'utf8'),
    oge: await readFile(path.join(repoRoot, 'oge', 'index.html'), 'utf8'),
    course: await readFile(path.join(repoRoot, 'trainers', 'oge-course', 'index.html'), 'utf8'),
    catalog: await readFile(path.join(repoRoot, 'trainers', 'index.html'), 'utf8'),
    sitemap: await readFile(path.join(repoRoot, 'sitemap.xml'), 'utf8')
  };
  assert.match(files.home, new RegExp(mapUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  for (const name of ['home', 'oge', 'course', 'sitemap']) {
    assert.ok(files[name].includes(diagnosticUrl), `${name} diagnostic URL`);
  }
  assert.ok(
    files.catalog.includes('./oge-1-5-trainers/practice-1-5-entry-diagnostic-2026.html'),
    'catalog diagnostic URL'
  );
  assert.ok(files.sitemap.includes(mapUrl), 'sitemap map URL');
});

test('board registry exposes both trainers as iframe-only quick-select entries', async () => {
  const manifest = JSON.parse(
    await readFile(path.join(repoRoot, 'trainers', 'board-compat.json'), 'utf8')
  );
  const expected = [
    ['practice-1-5-map', 'trainers/oge-1-5-trainers/practice-1-5-map.html'],
    [
      'practice-1-5-entry-diagnostic-2026',
      'trainers/oge-1-5-trainers/practice-1-5-entry-diagnostic-2026.html'
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

test('trainer sources contain no secrets, local paths, or external dependencies', async () => {
  for (const entryPath of [mapPath, diagnosticPath]) {
    const html = await readFile(entryPath, 'utf8');
    assert.doesNotMatch(html, /(?:token|password|passwd|api[_-]?key)\s*[:=]\s*["'][^"']+["']/i);
    assert.doesNotMatch(html, /(?:[A-Za-z]:[\\/](?:Users|home)[\\/]|file:\/\/)/i);
    assert.doesNotMatch(html, /(?:src|href)=["']https?:\/\//i);
    assert.doesNotMatch(html, /\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/);
    assert.doesNotMatch(html, /\b(?:TrainerBridge|postMessage|socket\.io|io\()\b/i);
  }
});
