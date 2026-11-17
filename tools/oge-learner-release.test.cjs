'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {buildManifest, checkManifest, waitForRelease, hash} = require('./oge-learner-release.cjs');
const origin = 'https://mathexam.space';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'oge-release-'));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  const write = (file, content) => {fs.mkdirSync(path.dirname(path.join(root, file)), {recursive: true}); fs.writeFileSync(path.join(root, file), content);};
  for (const file of ['index.html', 'foundations/index.html', 'trainers/oge-course/index.html', 'trainers/oge-basics/index.html', 'ege-baza/path/index.html']) write(file, '<h1>' + file + '</h1>');
  write('ege-baza/index.html', '<h1>Все задания №1–21</h1><script defer src="exam-map.js?v=21&amp;mode=map"></script><link rel="stylesheet" href="course.css?v=21"><script src="https://external.example/x.js"></script><!-- <script src="missing.js"></script> -->');
  write('ege-baza/exam-map.js', 'map of 21 exam positions');
  write('ege-baza/course.css', 'body { margin: 0; }');
  write('assets/oge-wayfinding.js', 'unchanged navigation');
  write('assets/oge-wayfinding.css', 'unchanged navigation styles');
  const routes = {pages: ['index.html', 'ege-baza/path/index.html'], courseParents: {'ege-baza/path/index.html': {href: '/ege-baza/index.html'}}};
  return {root, write, routes, entries: buildManifest(root, routes)};
}
function responder(root, overrides = new Map()) {
  return async (url, options) => {
    assert.equal(options.cache, 'no-store');
    assert(options.signal instanceof AbortSignal);
    if (overrides.has(url)) {
      const value = overrides.get(url);
      if (value instanceof Error) throw value;
      return new Response(value.body || 'unavailable', {status: value.status || 200});
    }
    let file = new URL(url).pathname.slice(1);
    if (!file || file.endsWith('/')) file += 'index.html';
    return new Response(fs.readFileSync(path.join(root, file)));
  };
}

test('manifest includes the EGE destination and the original three gate files', t => {
  const {entries} = fixture(t);
  for (const file of ['ege-baza/index.html', 'assets/oge-wayfinding.js', 'assets/oge-wayfinding.css', 'trainers/oge-course/index.html']) assert(entries.some(entry => entry.file === file), file);
});
test('manifest includes actual versioned scripts, styles and directory returns', t => {
  const {entries} = fixture(t);
  for (const suffix of ['/ege-baza/exam-map.js?v=21&mode=map', '/ege-baza/course.css?v=21', '/ege-baza/', '/trainers/oge-course/']) assert(entries.some(entry => entry.url === origin + suffix), suffix);
  assert(entries.every(entry => new URL(entry.url).origin === origin));
  assert(!entries.some(entry => entry.file === 'ege-baza/missing.js'));
  assert.equal(entries.length, new Set(entries.map(entry => entry.url)).size);
});
test('newly recorded route and its dependencies cannot escape the gate', t => {
  const f = fixture(t);
  f.write('new/lesson.html', '<SCRIPT SRC="./lesson.js?v=2"></SCRIPT>');
  f.write('new/lesson.js', 'new lesson');
  f.routes.pages.push('new/lesson.html');
  const entries = buildManifest(f.root, f.routes);
  assert(entries.some(entry => entry.file === 'new/lesson.html'));
  assert(entries.some(entry => entry.url === origin + '/new/lesson.js?v=2'));
});
test('data-src and non-resource link attributes are not mistaken for script URLs', t => {
  const f = fixture(t);
  f.write('ege-baza/index.html', '<script data-src="missing.js">const x = 1;</script><link rel="canonical" href="https://mathexam.space/absent/">');
  const entries = buildManifest(f.root, f.routes);
  assert(!entries.some(entry => entry.url.includes('missing.js') || entry.url.includes('/absent/')));
});
test('missing local dependency fails instead of silently reducing coverage', t => {
  const f = fixture(t); fs.unlinkSync(path.join(f.root, 'ege-baza/exam-map.js'));
  assert.throws(() => buildManifest(f.root, f.routes), /ENOENT/);
});
test('path traversal through percent-encoded separators is rejected', t => {
  const f = fixture(t); f.write('ege-baza/index.html', '<script src="/%2e%2e%2foutside.js"></script>');
  assert.throws(() => buildManifest(f.root, f.routes), /Unsafe release path/);
});
test('matching resources pass without waiting', async t => {
  const f = fixture(t); let slept = false;
  await waitForRelease(f.entries, {fetchImpl: responder(f.root), sleep: async () => {slept = true;}});
  assert.equal(slept, false);
});
test('regression: unchanged OGE files cannot approve an old EGE page', async t => {
  const f = fixture(t);
  const overrides = new Map([[origin + '/ege-baza/index.html', {body: '<h1>Old seven lines</h1>'}]]);
  await assert.rejects(waitForRelease(f.entries, {fetchImpl: responder(f.root, overrides), attempts: 1}), /ege-baza\/index.html \(content mismatch\)/);
});
test('correct EGE HTML cannot approve an old versioned exam-map script', async t => {
  const f = fixture(t);
  const overrides = new Map([[origin + '/ege-baza/exam-map.js?v=21&mode=map', {body: 'old script'}]]);
  await assert.rejects(waitForRelease(f.entries, {fetchImpl: responder(f.root, overrides), attempts: 1}), /exam-map.js\?v=21&mode=map/);
});
test('stale directory URL is checked even if index.html is already current', async t => {
  const f = fixture(t);
  const overrides = new Map([[origin + '/ege-baza/', {body: 'old cached directory'}]]);
  await assert.rejects(waitForRelease(f.entries, {fetchImpl: responder(f.root, overrides), attempts: 1}), /ege-baza\/ \(content mismatch\)/);
});
test('503, missing files, network timeout and mixed versions stay failures', async t => {
  const f = fixture(t);
  for (const bad of [{status: 503}, {status: 404}, new Error('request timeout'), {body: 'another release'}]) {
    const failures = await checkManifest(f.entries, responder(f.root, new Map([[origin + '/ege-baza/index.html', bad]])));
    assert.equal(failures.length, 1); assert.equal(failures[0].url, origin + '/ege-baza/index.html');
  }
});
test('cache propagation is retried and requires a fully matching scan', async t => {
  const f = fixture(t); let sleepCount = 0, passes = 0;
  const good = responder(f.root);
  const fetchImpl = async (url, options) => url.endsWith('/ege-baza/index.html') && sleepCount === 0 ? new Response('old') : good(url, options);
  await waitForRelease(f.entries, {fetchImpl, attempts: 2, sleep: async () => {sleepCount++;}, onAttempt: x => {if (!x.failures.length) passes++;}});
  assert.equal(sleepCount, 1); assert.equal(passes, 1);
});
test('retry exhaustion remains red and does not sleep after the final attempt', async t => {
  const f = fixture(t); let attempts = 0, sleeps = 0;
  await assert.rejects(waitForRelease(f.entries, {fetchImpl: async () => new Response('bad'), attempts: 2, sleep: async () => {sleeps++;}, onAttempt: () => {attempts++;}}), /Published release mismatch/);
  assert.equal(attempts, 2); assert.equal(sleeps, 1);
});
test('HTTP probes are bounded to eight concurrent requests', async () => {
  let active = 0, peak = 0;
  const entries = Array.from({length: 25}, (_, i) => ({url: origin + '/' + i, sha256: hash('OK')}));
  assert.deepEqual(await checkManifest(entries, async () => {
    active++; peak = Math.max(peak, active); await new Promise(resolve => setImmediate(resolve)); active--; return new Response('OK');
  }), []);
  assert(peak <= 8);
});
test('overall publication deadline aborts rather than starting more requests', async () => {
  const controller = new AbortController(); controller.abort(new Error('publication deadline'));
  let requested = false;
  await assert.rejects(waitForRelease([{url: origin}], {signal: controller.signal, fetchImpl: async () => {requested = true;}}), /publication deadline/);
  assert.equal(requested, false);
});
test('empty manifest or invalid retry count never passes', async () => {
  await assert.rejects(waitForRelease([]), /Invalid publication gate input/);
  await assert.rejects(waitForRelease([{url: origin}], {attempts: 0}), /Invalid publication gate input/);
});
test('redirect to another origin fails even if it returns matching bytes', async () => {
  const response = {ok: true, url: 'https://other.example/', arrayBuffer: async () => Buffer.from('OK')};
  assert.equal((await checkManifest([{url: origin, sha256: hash('OK')}], async () => response))[0].reason, 'Cross-origin redirect');
});
test('workflow keeps local pre-release checks and pins post-Pages acceptance', () => {
  const yaml = fs.readFileSync(path.join(__dirname, '../.github/workflows/oge-learner-entry.yml'), 'utf8');
  assert.match(yaml, /workflow_run:\s+workflows: \['pages-build-deployment', 'pages build and deployment'\]\s+types: \[completed\]\s+branches: \[main\]/);
  for (const required of ["github.event.workflow_run.conclusion == 'success'", 'github.event.workflow_run.head_repository.full_name == github.repository', 'ref: ${{ github.event.workflow_run.head_sha || github.sha }}', "OGE_ENTRY_BASE_URL: ${{ github.event_name == 'workflow_run' && 'https://mathexam.space' || '' }}", 'node tools/oge-learner-entry.test.cjs', 'node tools/oge-focus-navigation.test.cjs', 'node tools/oge-learner-entry.browser.cjs', "OGE_ENTRY_VERIFY_ONCE: '1'"]) assert(yaml.includes(required), required);
  assert(!yaml.includes("github.event_name == 'push' && 'https://mathexam.space'"));
  assert.match(yaml, /permissions:\s+contents: read/);
  assert.match(yaml, /persist-credentials: false/);
});
const actualRoutes = path.join(__dirname, 'oge-learner-routes.json');
test('actual repository manifest has every recorded page, EGE destination and assets', {skip: !fs.existsSync(actualRoutes)}, () => {
  const routes = JSON.parse(fs.readFileSync(actualRoutes, 'utf8'));
  const entries = buildManifest(path.join(__dirname, '..'), routes);
  for (const file of [...routes.pages, 'ege-baza/index.html', 'ege-baza/exam-map.js']) assert(entries.some(entry => entry.file === file), file);
  console.log('Actual publication manifest: ' + entries.length + ' URLs');
});
