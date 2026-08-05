import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const courseRoot = path.join(repoRoot, 'ege-profile');
const lines = [
  [1, 'Планиметрия', 'Доступен'],
  [2, 'Векторы', 'Доступен'],
  [3, 'Стереометрия', 'Заблокирован до проверки происхождения'],
  [4, 'Классическая вероятность', 'Тренажёр готовится'],
  [5, 'Сложная вероятность', 'Тренажёр готовится'],
  [6, 'Простейшие уравнения', 'Тренажёр готовится'],
  [7, 'Вычисления и преобразования', 'Тренажёр готовится'],
  [8, 'Производная по графику', 'Тренажёр готовится'],
  [9, 'Прикладные задачи', 'Тренажёр готовится'],
  [10, 'Текстовые задачи', 'Тренажёр готовится'],
  [11, 'Графики функций', 'Тренажёр готовится'],
  [12, 'Исследование функции', 'Тренажёр готовится'],
  [13, 'Тригонометрическое уравнение', 'Тренажёр готовится'],
  [14, 'Стереометрия с развёрнутым решением', 'Тренажёр готовится'],
  [15, 'Неравенства', 'Тренажёр готовится'],
  [16, 'Финансовая математика', 'Материалы собраны частично'],
  [17, 'Планиметрия с доказательством', 'Тренажёр готовится'],
  [18, 'Параметры', 'Тренажёр готовится'],
  [19, 'Числа и их свойства', 'Тренажёр готовится']
];
const pages = [
  ['/ege-profile/', path.join(courseRoot, 'index.html')],
  ...lines.map(([n]) => ['/ege-profile/t' + n + '/', path.join(courseRoot, 't' + n, 'index.html')])
];
const protectedHashes = {
  'index.html': '65b167aa9d3a67a4827d2a5b7ecb213d43bd7adeb71d90ed940de2cf2f0e4b09',
  'trainers/index.html': '3716d5c53bacd9cca930356082c550d432f7a172c530639d3d138e43fc02eaf3',
  'sitemap.xml': 'c90324ee180c94577331b29e05bd2330704f690f8abe98972fd05b5a8cda877a',
  'trainers/board-compat.json': '831508bc67540d88d59dc3ae53cadd6c5d748854361bdc364895735d1a0d4c96',
  'trainers/ege-t1-planimetry-trainer.html': '089c88329f7734f2bfbb896b75f46b41ddbafe021b1486ca9de8f1dd04bc606f',
  'trainers/ege-t1-planimetry-generator.html': 'adab7ca073762752bf759b8b130b14b170cd94f7caba8cfadae2cf24a03c7efe',
  'trainers/ege-profile-vectors-trainer.html': '44b53dbb8bcb8b270809e03e2af77829a2933e476a291991509be119cbe84e28',
  'trainers/ege-t2-vectors-trainer.html': 'e2155174f71886cc601100a1793e0d7484aa5dfaf70f34fab3e49b1e08034a1e',
  'trainers/ege-profile-vectors-homework.pdf': '839228bfcabeae9ba10cfcd848c5f153302b2ebc078d962b0a0c0b6da78922d3',
  'trainers/ege-profile-stereometry-3d/index.html': 'e78d8838562ad851d076ad849ce71ea63e0657cd7ce574b09b04e7f1c43b45c5',
  'credit-payment-table-trainer.html': '755d104c16cb81a15beac72a891c8ab5f1fbcd2e5a769f4e72a26e1526fa5ea8',
  'trainers/credit-differential-payment-trainer.html': 'c584585b43e089590c381de7eac8edb618c9c9d152a42524cb5b0ccf13b55c23',
  'trainers/finance-nonstandard-trainer.html': '64bebf8263f474315534e061c6e1f5dcd48bfa618ba5174325f8f256a947d227'
};
const allowedPath = /^(ege-profile\/|docs\/ege-profile\/|tools\/ege-profile-foundation-phase-a\.test\.mjs$|tools\/fixtures\/ege-profile-phase-a\/)/;
const forbiddenControl = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e\u2066-\u2069\ufeff]/u;
const machinePath = /(?:[A-Za-z]:[\\/](?:Users|home|Documents)|\/(?:mnt|home|Users)\/)/u;
const secretAssignment = /\b(?:api[_-]?key|access[_-]?token|password|secret)\b\s*[:=]\s*["'][^"']+["']/iu;

async function exists(file) {
  return stat(file).then(() => true, () => false);
}
function titleOf(html) {
  return html.match(/<title>([\s\S]*?)<\/title>/i)?.[1].trim();
}
function hrefsOf(html) {
  return [...html.matchAll(/<a\b[^>]*\bhref=(["'])(.*?)\1/gi)].map(match => match[2]);
}
function resolveLocalHref(fromFile, href) {
  const clean = href.split('#')[0].split('?')[0];
  if (!clean || /^(?:https?:|mailto:|tel:|data:)/i.test(clean)) return null;
  let target = clean.startsWith('/')
    ? path.join(repoRoot, clean.slice(1))
    : path.resolve(path.dirname(fromFile), clean);
  if (clean.endsWith('/')) target = path.join(target, 'index.html');
  return target;
}

test('all 20 routes are static, accessible, unique and noindex', async () => {
  const titles = new Set();
  for (const [route, file] of pages) {
    const html = await readFile(file, 'utf8');
    assert.match(html, /<html\s+lang="ru"/i, route + ' lang');
    assert.match(html, /<meta\s+name="robots"\s+content="noindex,\s*nofollow"/i, route + ' robots');
    assert.equal((html.match(/<h1\b/gi) || []).length, 1, route + ' one h1');
    assert.equal((html.match(/<main\b/gi) || []).length, 1, route + ' main');
    const title = titleOf(html);
    assert.ok(title, route + ' title');
    assert.ok(!titles.has(title), route + ' unique title');
    titles.add(title);
    assert.doesNotMatch(html, forbiddenControl, route + ' controls');
    assert.doesNotMatch(html, machinePath, route + ' machine path');
    assert.doesNotMatch(html, secretAssignment, route + ' secret');
    assert.doesNotMatch(html, /href\s*=\s*(?:["']["']|["']javascript:)/i, route + ' fake href');
    for (const href of hrefsOf(html)) {
      assert.doesNotMatch(href, /^https?:\/\//i, route + ' unsafe external origin');
      const target = resolveLocalHref(file, href);
      if (target) assert.ok(await exists(target), route + ' broken link ' + href);
    }
    for (const script of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
      assert.doesNotThrow(() => new Function(script[1]), route + ' inline script parses');
    }
  }
  assert.equal(titles.size, 20);
});

test('shared stylesheet supplies responsive and keyboard-visible behavior', async () => {
  const css = await readFile(path.join(courseRoot, 'course.css'), 'utf8');
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media\(max-width:560px\)/);
  assert.match(css, /overflow-x:hidden/);
  assert.doesNotMatch(css, forbiddenControl);
  assert.doesNotMatch(css, machinePath);
  assert.doesNotMatch(css, secretAssignment);
  for (const [, file] of pages) {
    const html = await readFile(file, 'utf8');
    assert.match(html, /<link\s+rel="stylesheet"\s+href="(?:\.\/|\.\.\/)course\.css"/i);
  }
});

test('line statuses and confirmed material bindings are honest', async () => {
  for (const [n, title, status] of lines) {
    const html = await readFile(path.join(courseRoot, 't' + n, 'index.html'), 'utf8');
    assert.ok(html.includes('Задание ' + n + '. ' + title), 't' + n + ' title');
    assert.ok(html.includes(status), 't' + n + ' status');
  }
  const t1 = await readFile(path.join(courseRoot, 't1', 'index.html'), 'utf8');
  assert.ok(t1.includes('/trainers/ege-t1-planimetry-trainer.html'));
  assert.ok(t1.includes('/trainers/ege-t1-planimetry-generator.html'));
  const t2 = await readFile(path.join(courseRoot, 't2', 'index.html'), 'utf8');
  assert.ok(t2.includes('/trainers/ege-profile-vectors-trainer.html'));
  assert.ok(t2.includes('/trainers/ege-profile-vectors-homework.pdf'));
  assert.ok(t2.includes('(PDF)'));
  assert.ok(t2.includes('Версия для занятия/доски'));
  const t3 = await readFile(path.join(courseRoot, 't3', 'index.html'), 'utf8');
  assert.ok(!t3.includes('ege-profile-stereometry-3d'));
  assert.ok(!t3.includes('class="button"'));
  const t16 = await readFile(path.join(courseRoot, 't16', 'index.html'), 'utf8');
  assert.ok(t16.includes('/credit-payment-table-trainer.html'));
  assert.ok(t16.includes('/trainers/credit-differential-payment-trainer.html'));
  assert.ok(t16.includes('/trainers/finance-nonstandard-trainer.html'));
  assert.ok(t16.includes('ещё не прошли единый аудит'));
  for (const n of [...Array.from({ length: 12 }, (_, i) => i + 4), 17, 18, 19]) {
    const html = await readFile(path.join(courseRoot, 't' + n, 'index.html'), 'utf8');
    assert.ok(html.includes('Тренажёр готовится'));
    assert.doesNotMatch(html, />\s*Начать\s*</i);
  }
});

test('confirmed repository assets exist and protected bytes are unchanged', async () => {
  for (const [relative, expected] of Object.entries(protectedHashes)) {
    const bytes = await readFile(path.join(repoRoot, relative));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), expected, relative);
  }
});

test('discovery and reserved services remain untouched in Phase A', async () => {
  for (const relative of ['index.html', 'trainers/index.html', 'sitemap.xml', 'trainers/board-compat.json']) {
    const text = await readFile(path.join(repoRoot, relative), 'utf8');
    assert.ok(!text.includes('/ege-profile/'), relative + ' discovery');
  }
  for (const service of ['exam', 'mock', 'review', 'expert']) {
    assert.equal(await exists(path.join(courseRoot, service)), false, service + ' must stay reserved');
  }
});

test('documentation records all required inventory and blockers', async () => {
  const statusDoc = await readFile(path.join(repoRoot, 'docs/ege-profile/COURSE_STATUS.md'), 'utf8');
  const urlDoc = await readFile(path.join(repoRoot, 'docs/ege-profile/URL_CONTRACT.md'), 'utf8');
  const phasesDoc = await readFile(path.join(repoRoot, 'docs/ege-profile/NEXT_PHASES.md'), 'utf8');
  const blockerDoc = await readFile(path.join(repoRoot, 'docs/ege-profile/T3_CONTENT_PROVENANCE_BLOCKER.md'), 'utf8');
  for (let n = 1; n <= 19; n += 1) assert.ok(urlDoc.includes('/ege-profile/t' + n + '/'));
  for (const module of ['probability-t45', 'exam/variant', 'trigonometry', 'derivative-t8', 'applied-t910',
    'functions-t1112', 'trig-sum-to-product', 'единый expert', 'stereo-t14', 'interval-method',
    'inequalities', 'rationalization', 'planimetry-t17', 'parameters-t18', 'parameters-18/',
    'numbers-t19', 'integers-t19']) assert.ok(phasesDoc.includes(module), module);
  assert.ok(statusDoc.includes('0 HTML'));
  assert.ok(statusDoc.includes('expert.html'));
  assert.ok(statusDoc.includes('inequalities.html'));
  assert.ok(urlDoc.includes('bookQrAllowed:false'));
  assert.ok(blockerDoc.includes('143 задачи'));
  assert.ok(blockerDoc.includes('Решу ЕГЭ'));
});

test('changed-file allowlist is additive-only', () => {
  const changed = spawnSync('git', ['diff', '--name-only', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).stdout
    .split(/\r?\n/).filter(Boolean);
  const untracked = spawnSync('git', ['ls-files', '--others', '--exclude-standard'], { cwd: repoRoot, encoding: 'utf8' }).stdout
    .split(/\r?\n/).filter(Boolean);
  const files = [...new Set([...changed, ...untracked])].sort();
  assert.equal(files.length, 26, 'exact Phase A additive file count');
  for (const file of files) assert.match(file.replaceAll('\\', '/'), allowedPath, file);
});

test('all trailing-slash routes return HTTP 200 under static server semantics', async (t) => {
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
      let relative = pathname.replace(/^\/+/, '');
      if (relative.endsWith('/')) relative += 'index.html';
      const target = path.resolve(repoRoot, relative);
      if (!target.startsWith(repoRoot + path.sep)) throw new Error('outside root');
      const body = await readFile(target);
      response.writeHead(200, { 'content-type': target.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream' });
      response.end(body);
    } catch {
      response.writeHead(404);
      response.end('Not found');
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const address = server.address();
  for (const [route] of pages) {
    const response = await fetch('http://127.0.0.1:' + address.port + route);
    assert.equal(response.status, 200, route);
    assert.match(response.headers.get('content-type') || '', /text\/html/);
  }
});

test('gate marker', () => {
  console.log('EGE_PROFILE_FOUNDATION_PHASE_A_GATE_OK');
});
