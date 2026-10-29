'use strict';
// Actual public course pages and their real help/step controls. This focused
// visual gate supplements the exhaustive independent ray/triangle oracle.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const root = path.resolve(__dirname, '../..');
const out = path.resolve(process.env.VISIBILITY_ARTIFACTS || 'artifacts/visibility');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const cases = [
  { course: 'textbook', id: 'atanasyan2024-main-001-a', views: ['neutral', 'dbc-lines', 'dec'], faces: [4, 4, 4], reported: true },
  { course: 'textbook', id: 'ex-main-0106', views: ['neutral', 'traces', 'section'], faces: [4, 4, 4] },
  { course: 'textbook', id: 'ex-main-0295-a', views: ['neutral', 'compare', 'isosceles', 'plane'], faces: [6, 6, 6, 6] },
  { course: 'textbook', id: 'ex-main-0284', views: ['neutral', 'corner', 'result'], faces: [4, 4, 8] },
  { course: 'textbook', id: 'theory-014', views: ['neutral', 'tetra3', 'tetra4', 'box6'], faces: [6, 4, 4, 6] },
  { course: 'merzlyak-10-base', id: 'ex-16-001', views: ['neutral', 'base', 'lateral'], faces: [5, 5, 5] },
  { course: 'merzlyak-10-base', id: 'merz-theory-19-detail-07', views: ['neutral', 'balls', 'line'], faces: [0, 0, 0], spheres: true },
  { course: 'shestakov-yaschenko-10-11', id: 'sy-4-6-a28-a', views: ['neutral', 'notch'], faces: [9, 9] },
  { course: 'shestakov-yaschenko-10-11', id: 'sy-4-6-b2-a', views: ['neutral', 'first', 'second'], faces: [2, 2, 2] }
];
const widths = [320, 1280];
const courses = Object.fromEntries([...new Set(cases.map(c => c.course))].map(name => {
  const file = path.join(root, 'stereo-course', name, 'data/course.json');
  const bytes = fs.readFileSync(file);
  return [name, { bundle: JSON.parse(bytes), sha256: hash(bytes), file }];
}));
const testedFiles = ['stereo-course/assets/task-scene-viewer.js', 'stereo-course/assets/task-scenes.css',
  ...Object.keys(courses).flatMap(course => ['index.html', 'assets/engine.js', 'assets/style.css', 'data/course.json'].map(file => 'stereo-course/' + course + '/' + file))];
const frozen = Object.fromEntries(testedFiles.map(file => [file, hash(fs.readFileSync(path.join(root, file)))]));
const evidence = { schemaVersion: 1, completed: false, commit: process.env.GITHUB_SHA || null,
  sourceHashes: frozen, widths, cases: [], screenshots: [], rotations: [], phases: [], errors: [] };
let server, browser, context, page, base;
const save = () => fs.writeFileSync(path.join(out, 'visibility-browser-evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
const flatHelp = items => items.flatMap(item => [item, ...flatHelp(item.children || [])]);
const lessonFor = c => courses[c.course].bundle.lessons.find(l => l.id === c.id);

function checkReportedHidden(parts, name) {
  assert(parts.length && parts.filter(part => part.hidden).reduce((sum, part) => sum + part.end - part.start, 0) > 1 - 1e-6, 'Reported hidden coverage ' + name);
  // A vertex on the visible contour can retain a depth-tolerance endpoint.
  // It must have no measurable solid stroke on the SVG.
  for (const part of parts.filter(part => !part.hidden)) {
    const xy = part.d.match(/[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/ig).map(Number);
    assert.equal(xy.length, 4, 'Reported straight SVG interval ' + name);
    assert(Math.hypot(xy[2] - xy[0], xy[3] - xy[1]) <= .001, 'No visible solid length on reported hidden ' + name);
  }
}

function preflight() {
  const endpoint = { hidden: false, start: 0, end: 2e-8, d: 'M10 20 L10 20' };
  const hidden = { hidden: true, start: 2e-8, end: 1, d: 'M10 20 L30 40' };
  checkReportedHidden([endpoint, hidden], 'zero-length contour endpoint control');
  assert.throws(() => checkReportedHidden([{ ...endpoint, end: .1 }, { ...hidden, start: .1 }], 'visible interval control'), /Reported hidden coverage/);
  assert.throws(() => checkReportedHidden([{ ...endpoint, d: 'M10 20 L10.01 20' }, hidden], 'measurable solid stroke control'), /No visible solid length/);
  assert.throws(() => checkReportedHidden([], 'missing line control'), /Reported hidden coverage/);
  assert.throws(() => checkReportedHidden([{ ...endpoint, end: 1, d: 'M10 20 L30 40' }], 'all-solid control'), /Reported hidden coverage/);
  for (const c of cases) {
    const lesson = lessonFor(c);
    assert(lesson && lesson.status === 'reviewed', 'Reviewed actual lesson ' + c.id);
    assert.equal(c.views.length, c.faces.length);
    for (const view of c.views) {
      assert(lesson.visualization.model.views[view], 'Authored view ' + c.id + '/' + view);
      assert(view === 'neutral' || lesson.steps.some(step => step.view === view)
        || flatHelp(lesson.help).some(help => help.view === view), 'Reachable actual UI view ' + c.id + '/' + view);
    }
  }
}

async function host() {
  server = http.createServer((req, res) => {
    try {
      let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://local').pathname));
      if (!file.startsWith(root + path.sep)) throw Error('Outside root');
      if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
      res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' })[path.extname(file)] || 'application/octet-stream');
      res.end(fs.readFileSync(file));
    } catch (_) { res.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return 'http://127.0.0.1:' + server.address().port;
}
const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
async function showView(lesson, view) {
  if (view === 'neutral') return;
  const help = page.locator('[data-main-help]');
  if (!await help.evaluate(node => node.open)) await help.locator(':scope > summary').click();
  const index = lesson.steps.findIndex(step => step.view === view);
  if (index >= 0) {
    while (await page.locator('[data-steps] [data-step]').count() <= index) await page.locator('[data-steps]+button').click();
    await page.locator('[data-step="' + lesson.steps[index].id + '"]').getByRole('button', { name: 'Показать на рисунке', exact: true }).click();
  } else {
    const item = flatHelp(lesson.help).find(help => help.view === view);
    assert(item);
    // Open the actual ancestor disclosures in order, never call the model API.
    const chain = await page.locator('[data-help="' + item.id + '"]').evaluate(node => {
      const ids = [];
      for (let p = node; p; p = p.parentElement) if (p.hasAttribute('data-help')) ids.unshift(p.dataset.help);
      return ids;
    });
    for (const id of chain) {
      const disclosure = page.locator('[data-help="' + id + '"]');
      if (!await disclosure.evaluate(node => node.open)) await disclosure.locator(':scope > summary').click();
    }
  }
  await page.waitForFunction(view => document.querySelector('[data-main-model] svg')?.dataset.view === view, view);
  await settle();
}

async function geometry() {
  return page.locator('[data-main-model] svg').evaluate(svg => {
    const box = svg.viewBox.baseVal;
    const lines = [...svg.querySelectorAll('[data-part-start]')].map(node => ({
      kind: node.hasAttribute('data-edge') ? 'edge' : node.hasAttribute('data-segment') ? 'segment' : node.hasAttribute('data-boundary') ? 'boundary' : 'vector',
      name: node.dataset.edge || node.dataset.segment || node.dataset.boundary || node.dataset.vector,
      start: +node.dataset.partStart, end: +node.dataset.partEnd, hidden: node.dataset.hidden === 'true',
      dash: getComputedStyle(node).strokeDasharray, phase: node.getAttribute('stroke-dashoffset'), d: node.getAttribute('d')
    }));
    return { view: svg.dataset.view, camera: [svg.dataset.yaw, svg.dataset.pitch], faces: svg.querySelectorAll('.am-face').length,
      width: box.width, height: box.height, lines, labels: [...svg.querySelectorAll('.am-label')].map(node => {
        const b = node.getBBox(); return { key: node.dataset.label, x: b.x, y: b.y, width: b.width, height: b.height };
      }) };
  });
}
function checkGeometry(data, name) {
  assert(data.lines.length > 0, name + ' actual lines');
  assert(data.lines.some(line => line.hidden), name + ' contains genuinely hidden portions');
  assert(data.lines.some(line => !line.hidden), name + ' contains genuinely visible portions');
  for (const line of data.lines) {
    assert(line.start >= 0 && line.end <= 1 && line.end > line.start, name + ' valid interval');
    assert(!/NaN|Infinity/.test(line.d));
    if (line.hidden) assert.match(line.dash, /^5(?:px)?(?:,|\s)/, name + ' actual CSS dashes ' + line.name);
    else assert.equal(line.dash, 'none', name + ' visible strokes stay solid ' + line.name);
  }
  for (const label of data.labels) assert(label.x >= -1 && label.y >= -1 && label.x + label.width <= data.width + 1
    && label.y + label.height <= data.height + 1, name + ' label bounds ' + label.key);
}
async function screenshot(c, width, stage) {
  const filename = c.course + '-' + c.id + '-' + width + '-' + stage + '.png';
  const bytes = await page.locator('[data-main-model]').screenshot({ path: path.join(out, filename) });
  evidence.screenshots.push({ course: c.course, id: c.id, width, stage, filename, sha256: hash(bytes), bytes: bytes.length });
  save();
}

// Read actual Chromium screenshot pixels without a further dependency. Chromium
// emits noninterlaced RGB/RGBA8 PNG; reject any unexpected encoding explicitly.
function png(bytes) {
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  let width, height, channels, chunks = [];
  for (let offset = 8; offset < bytes.length;) {
    const length = bytes.readUInt32BE(offset), type = bytes.toString('ascii', offset + 4, offset + 8), data = bytes.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); assert.equal(data[8], 8); assert([2, 6].includes(data[9])); assert.equal(data[12], 0); channels = data[9] === 6 ? 4 : 3; }
    if (type === 'IDAT') chunks.push(data);
    offset += length + 12;
  }
  const packed = zlib.inflateSync(Buffer.concat(chunks)), stride = width * channels, pixels = Buffer.alloc(stride * height);
  assert.equal(packed.length, (stride + 1) * height);
  const paeth = (a, b, c) => { const p = a + b - c, da = Math.abs(p - a), db = Math.abs(p - b), dc = Math.abs(p - c); return da <= db && da <= dc ? a : db <= dc ? b : c; };
  for (let y = 0; y < height; y++) {
    const filter = packed[y * (stride + 1)]; assert(filter <= 4);
    for (let x = 0; x < stride; x++) {
      const i = y * stride + x, left = x >= channels ? pixels[i - channels] : 0, above = y ? pixels[i - stride] : 0, upperLeft = y && x >= channels ? pixels[i - stride - channels] : 0;
      const prediction = [0, left, above, Math.floor((left + above) / 2), paeth(left, above, upperLeft)][filter];
      pixels[i] = (packed[y * (stride + 1) + x + 1] + prediction) & 255;
    }
  }
  return { width, height, at(x, y) { const i = (Math.max(0, Math.min(height - 1, Math.round(y))) * width + Math.max(0, Math.min(width - 1, Math.round(x)))) * channels; return [...pixels.subarray(i, i + 3)]; } };
}

async function reversedDashPixels(c, width) {
  // The real first lesson has base B-D and reversed highlighted D-B, plus the
  // same polygon boundary. Inspect their actual pixel gaps in the browser.
  const info = await page.locator('[data-main-model] svg').evaluate(svg => {
    const paths = [...svg.querySelectorAll('path')];
    const base = paths.find(p => p.dataset.edge === 'B-D' && p.dataset.hidden === 'true');
    const over = paths.filter(p => ['B-D', 'D-B'].includes(p.dataset.segment || p.dataset.boundary));
    if (!base || !over.length) throw Error('Actual reversed B-D/D-B regression missing');
    const b = svg.getBoundingClientRect(), matrix = base.getScreenCTM(), p = base.getPointAtLength(0).matrixTransform(matrix), q = base.getPointAtLength(base.getTotalLength()).matrixTransform(matrix);
    const all = [base, ...over]; all.forEach((node, i) => node.setAttribute('data-phase-test', i === 0 ? 'base' : 'overlay'));
    const style = document.createElement('style'); style.id = 'visibility-pixel-isolation';
    style.textContent = '[data-main-model] svg path:not([data-phase-test]),[data-main-model] svg text,[data-main-model] svg circle,[data-main-model] svg line{visibility:hidden!important}[data-phase-test="overlay"]{visibility:hidden!important}';
    document.head.append(style);
    return { p: [p.x - b.x, p.y - b.y], q: [q.x - b.x, q.y - b.y], box: { width: b.width, height: b.height }, overlays: over.length };
  });
  try {
    await settle();
    const baseBytes = await page.locator('[data-main-model] svg').screenshot(), basePixels = png(baseBytes);
    await page.locator('#visibility-pixel-isolation').evaluate(node => { node.textContent = node.textContent.replace('[data-phase-test="overlay"]{visibility:hidden!important}', ''); });
    await settle();
    const compositeBytes = await page.locator('[data-main-model] svg').screenshot(), composite = png(compositeBytes);
    assert.equal(basePixels.width, composite.width); assert.equal(basePixels.height, composite.height);
    const scale = basePixels.width / info.box.width, a = info.p.map(x => x * scale), b = info.q.map(x => x * scale), length = Math.hypot(b[0] - a[0], b[1] - a[1]), u = [(b[0] - a[0]) / length, (b[1] - a[1]) / length];
    const background = basePixels.at(8, 8), colorDistance = (rgb, bg) => Math.hypot(...rgb.map((x, i) => x - bg[i]));
    const at = s => [a[0] + u[0] * s, a[1] + u[1] * s];
    const blank = (image, s) => colorDistance(image.at(...at(s)), background) < 20;
    const candidates = [];
    for (let s = 10; s < length - 10; s += .5) if ([-1.5, -.75, 0, .75, 1.5].every(d => blank(basePixels, s + d))) candidates.push(s);
    assert(candidates.length >= 2, 'Actual base dash has measurable interior gaps at ' + width);
    const gapsFilled = candidates.filter(s => !blank(composite, s));
    assert.equal(gapsFilled.length, 0, 'Reversed highlighted strokes must preserve base dash gaps: ' + JSON.stringify(gapsFilled));
    const filename = 'reversed-dash-pixels-' + width + '.png'; fs.writeFileSync(path.join(out, filename), compositeBytes);
    evidence.phases.push({ id: c.id, width, overlays: info.overlays, measuredGapSamples: candidates.length, gapsFilled: gapsFilled.length, filename, sha256: hash(compositeBytes) });
  } finally {
    await page.evaluate(() => { document.getElementById('visibility-pixel-isolation')?.remove(); document.querySelectorAll('[data-phase-test]').forEach(node => node.removeAttribute('data-phase-test')); });
    await settle();
  }
}

async function main() {
  preflight();
  if (process.env.VISIBILITY_CHECK_ONLY === '1') {
    console.log('STEREO_VISIBILITY_BROWSER_PREFLIGHT_OK: ' + cases.length + ' actual cards, ' + cases.reduce((n, c) => n + c.views.length, 0) + ' reachable views at320/1280; browser not launched'); return;
  }
  fs.mkdirSync(out, { recursive: true }); save();
  base = (process.env.VISIBILITY_BASE_URL || await host()).replace(/\/$/, '');
  const { chromium } = require('playwright');
  browser = await chromium.launch({ headless: true, executablePath: process.env.VISIBILITY_CHROMIUM || undefined, args: ['--no-sandbox'] });
  evidence.browserVersion = browser.version();
  context = await browser.newContext({ viewport: { width: 1280, height: 1000 }, reducedMotion: 'reduce' });
  page = await context.newPage(); page.setDefaultTimeout(20000);
  page.on('pageerror', e => evidence.errors.push(e.message));
  for (const course of Object.keys(courses)) {
    await page.goto(base + '/stereo-course/' + course + '/'); await page.waitForFunction(() => window.textbookApp);
    const served = await page.evaluate(async () => (await fetch('data/course.json')).text());
    assert.equal(hash(served), courses[course].sha256, 'Actual served course identity ' + course);
    await page.evaluate(() => localStorage.clear());
  }
  for (const width of widths) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(() => localStorage.clear());
    for (const c of cases) {
      const lesson = lessonFor(c), row = { course: c.course, id: c.id, width, views: [] };
      await page.goto(base + '/stereo-course/' + c.course + '/?visibility=' + width + '-' + c.id + '#' + c.id);
      await page.waitForFunction(id => window.textbookApp && document.querySelector('[data-main-model] svg') && location.hash === '#' + id, c.id);
      await settle();
      const draft = 'Проверка сохранения рисунка ' + c.id + ' ' + width;
      if (lesson.answer) await page.locator('#final-answer').fill(draft);
      for (let i = 0; i < c.views.length; i++) {
        const view = c.views[i]; await showView(lesson, view);
        const data = await geometry(); checkGeometry(data, c.id + '/' + view + '/' + width);
        assert.equal(data.faces, c.faces[i], 'Active source surfaces ' + c.id + '/' + view);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'No overflow ' + c.id);
        if (c.reported && view === 'neutral') {
          for (const name of ['D-E', 'E-C', 'M-K']) {
            const parts = data.lines.filter(line => line.kind === 'edge' && line.name === name);
            checkReportedHidden(parts, name);
          }
          const dc = data.lines.filter(line => line.kind === 'edge' && line.name === 'C-D'); assert(dc.length && dc.every(line => !line.hidden), 'DC silhouette stays solid');
        }
        if (c.spheres) {
          const arcs = data.lines.filter(line => line.kind === 'edge' && line.name.includes('_'));
          assert(arcs.some(line => line.hidden) && arcs.some(line => !line.hidden), 'Sphere front/back arc distinction');
        }
        await screenshot(c, width, view); row.views.push({ view, faces: data.faces, lines: data.lines.length, hiddenParts: data.lines.filter(line => line.hidden).length, labels: data.labels.length });
        if (c.reported && view === 'dbc-lines') await reversedDashPixels(c, width);
      }
      if (c.reported) {
        await page.locator('[data-main-model] button[aria-label="Вернуть исходный вид"]').click();
        const before = await geometry();
        for (let n = 0; n < 12; n++) await page.locator('[data-main-model] button[aria-label="Повернуть вправо"]').click();
        const after = await geometry(); checkGeometry(after, 'rotated initial report');
        const status = data => data.lines.filter(line => line.kind === 'edge').map(line => [line.name, line.start, line.end, line.hidden]);
        assert.notDeepEqual(status(after), status(before), 'Rotation recomputes actual visibility');
        evidence.rotations.push({ id: c.id, width, before: before.camera, after: after.camera });
        await screenshot(c, width, 'rotated');
      }
      if (lesson.answer) { assert.equal(await page.locator('#final-answer').inputValue(), draft); await page.reload(); await page.locator('[data-main-model] svg').waitFor(); assert.equal(await page.locator('#final-answer').inputValue(), draft); }
      evidence.cases.push(row); save();
    }
  }
  for (const [file, expected] of Object.entries(frozen)) assert.equal(hash(fs.readFileSync(path.join(root, file))), expected, 'Source changed during visual run: ' + file);
  assert.deepEqual(evidence.errors, []);
  evidence.completed = true; evidence.completedAt = new Date().toISOString(); save();
  console.log('STEREO_VISIBILITY_BROWSER_OK: ' + evidence.cases.length + ' actual-page journeys, ' + evidence.screenshots.length + ' actual PNG, ' + evidence.phases.length + ' reversed-dash pixel checks, three courses, both widths, rotated camera and retained drafts');
}
main().catch(async error => {
  evidence.errors.push(error.stack || String(error));
  if (page && fs.existsSync(out)) {
    evidence.failure = { url: page.url() };
    try {
      const filename = 'failure.png', bytes = await page.screenshot({ path: path.join(out, filename), timeout: 10000 });
      Object.assign(evidence.failure, { filename, sha256: hash(bytes), bytes: bytes.length });
    } catch (captureError) { evidence.errors.push('Failure capture: ' + captureError.message); }
    try {
      if (await page.locator('[data-main-model] svg').count()) evidence.failure.geometry = await geometry();
    } catch (geometryError) { evidence.errors.push('Failure geometry: ' + geometryError.message); }
  }
  if (fs.existsSync(out)) save(); console.error(error); process.exitCode = 1;
})
  .finally(async () => { await browser?.close(); if (server) await new Promise(resolve => server.close(resolve)); });
