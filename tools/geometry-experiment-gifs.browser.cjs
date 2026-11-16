'use strict';

// Record the existing GeoLab/GeoExperiments UI in an isolated browser. All
// constructions use visible controls and pointer events, never Board.make/move.
// The canvas probe observes drawing transforms only, so fitted and unfitted
// course canvases receive the same real UI interactions.
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { mkdirSync, readFileSync, writeFileSync, existsSync } = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
function option(name, fallback) { const i = args.indexOf(name); return i < 0 ? fallback : args[i + 1]; }
const cataloguePath = path.resolve(option('--catalog', path.join(ROOT, 'assets/geometry-experiment-gifs/catalog.json')));
const output = path.resolve(option('--output', path.join(ROOT, '../geometry-experiment-gif-capture')));
const only = new Set((option('--clips', '') || '').split(',').filter(Boolean));
const catalogue = JSON.parse(readFileSync(cataloguePath, 'utf8'));
const clips = (Array.isArray(catalogue.clips) ? catalogue.clips : Object.entries(catalogue.clips).map(([id, clip]) => ({ id, ...clip }))).filter(clip => !only.size || only.has(clip.id));
const sha = value => createHash('sha256').update(value).digest('hex');
const recorderSha256 = sha(readFileSync(__filename));
const E = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
function readSource(file, clip) {
  if (!clip.sourceRef) return readFileSync(path.join(ROOT, file));
  assert(/^[a-f0-9]{40}$/.test(clip.sourceRef), 'immutable source reference');
  return execFileSync('git', ['show', `${clip.sourceRef}:${file}`], { cwd: ROOT, maxBuffer: 4 * 1024 * 1024 });
}

function sourceFiles(clip) {
  const course = clip.sourceCourse || clip.course;
  assert(['geometry-course', 'geometry-pogorelov'].includes(course), 'known course');
  if (clip.surface === 'investigation') return [`${course}/assets/course.css`, `${course}/assets/investigations.js`];
  const files = [`${course}/assets/course.css`, `${course}/assets/geometry.js`];
  if (clip.surface === 'manual') files.push(`${course}/assets/lab.js`);
  else {
    files.push(`${course}/assets/experiments.js`);
    if (course === 'geometry-pogorelov') files.push(`${course}/assets/extra-models.js`);
  }
  return files;
}

function observeCanvas() {
  window.__recordedPoints = new Map();
  const prototype = CanvasRenderingContext2D.prototype;
  const arc = prototype.arc, clear = prototype.clearRect;
  prototype.clearRect = function (...values) {
    window.__recordedPoints.clear();
    return clear.apply(this, values);
  };
  prototype.arc = function (x, y, radius, ...rest) {
    if (radius === 5 || radius === 7) {
      const m = this.getTransform();
      window.__recordedPoints.set(`${x},${y}`, { a: m.a, b: m.b, c: m.c, d: m.d, e: m.e, f: m.f });
    }
    return arc.call(this, x, y, radius, ...rest);
  };
}

async function boot(page, clip, sources) {
  const css = readSource(sources[0], clip).toString('utf8');
  await page.setContent(`<!doctype html><html lang="ru"><meta charset="utf-8"><title>${E(clip.title)}</title><style>${css}</style><style>
    body{background:#fffefa;margin:0;padding:0}#recording-stage{width:684px;padding:12px 22px;position:relative;box-sizing:border-box}#recording-stage .experiment{margin:0}
    #recording-pointer{position:absolute;display:none;pointer-events:none;z-index:99999;width:29px;height:31px;overflow:visible;filter:drop-shadow(0 1px 2px #ffffff)}
    #recording-ring{position:absolute;display:none;pointer-events:none;z-index:99998;border:2px solid #cf5e16;background:#ffd79522;border-radius:50%;width:22px;height:22px;box-sizing:border-box}
    .recording-focus{outline:3px solid #cf5e16!important;outline-offset:3px!important}
  </style><body class="construction-active"><div id="recording-stage"><div id="geo-board"></div></div><div id="recording-ring"></div><svg id="recording-pointer" viewBox="0 0 29 31"><path d="M2 2L2 24L8 18L13 29L18 27L13 16L24 16Z" fill="#163c52" stroke="#fff" stroke-width="2"/></svg></body></html>`);
  await page.evaluate(observeCanvas);
  for (const file of sources.slice(1)) await page.addScriptTag({ content: readSource(file, clip).toString('utf8') });
  await page.evaluate(clip => {
    const target = document.getElementById('geo-board');
    window.__recordEvents = [];
    if (clip.surface === 'manual') {
      window.__recordLab = GeoLab.mount(target, { figure: clip.figure, goal: clip.goal }, event => window.__recordEvents.push({ type: event.type, moved: event.moved }));
    } else if (clip.surface === 'investigation') window.__recordInvestigation = GeoInvestigations.mount(target, clip.topic || clip.unitId, undefined, () => {});
    else GeoExperiments.mount(target, clip.experiment);
  }, clip);
  await page.evaluate(() => document.fonts.ready);
  if (clip.surface === 'manual') await page.locator('canvas').waitFor({ state: 'visible' });
  else if (clip.surface === 'investigation') await page.locator('.research-predict select').waitFor({ state: 'visible' });
  else await page.locator('#geo-board input[type="range"]').first().waitFor({ state: 'visible' });
}

async function mark(page, position, selector) {
  await page.evaluate(({ position, selector }) => {
    document.querySelectorAll('.recording-focus').forEach(el => el.classList.remove('recording-focus'));
    if (selector) document.querySelector(selector)?.classList.add('recording-focus');
    const cursor = document.getElementById('recording-pointer'), ring = document.getElementById('recording-ring');
    for (const element of [cursor, ring]) element.style.display = position ? 'block' : 'none';
    if (position) {
      cursor.style.left = `${position.x}px`; cursor.style.top = `${position.y}px`;
      cursor.style.transformOrigin = '0 0';
      cursor.style.transform = position.x + 34 > document.getElementById('recording-stage').getBoundingClientRect().right ? 'scaleX(-1)' : '';
      ring.style.left = `${position.x - 11}px`; ring.style.top = `${position.y - 11}px`;
    }
  }, { position, selector });
}

async function projected(page, id, to) {
  return page.evaluate(({ id, to }) => {
    const board = window.__recordLab.board, p = board.point(id), cv = document.querySelector('canvas');
    if (!p || p.valid === false) throw Error(`Undefined point ${id}`);
    const matrix = window.__recordedPoints.get(`${p.x},${p.y}`);
    if (!matrix) throw Error(`Point ${id} was not rendered`);
    const q = to ? { x: to[0], y: to[1] } : p, rect = cv.getBoundingClientRect();
    const x = matrix.a * q.x + matrix.c * q.y + matrix.e, y = matrix.b * q.x + matrix.d * q.y + matrix.f;
    return { x: rect.left + x * rect.width / cv.width + scrollX, y: rect.top + y * rect.height / cv.height + scrollY };
  }, { id, to });
}

async function objectPosition(page, spec) {
  return page.evaluate(spec => {
    const board = window.__recordLab.board, cv = document.querySelector('canvas'), rect = cv.getBoundingClientRect();
    const object = board.objects.find(o => (spec.id && o.id === spec.id) || ((!spec.type || o.type === spec.type) && o.a === spec.a && o.b === spec.b));
    if (!object) throw Error(`Missing object ${JSON.stringify(spec)}`);
    const matrix = [...window.__recordedPoints.values()][0];
    const screen = p => ({ x: rect.left + (matrix.a * p.x + matrix.c * p.y + matrix.e) * rect.width / cv.width + scrollX, y: rect.top + (matrix.b * p.x + matrix.d * p.y + matrix.f) * rect.height / cv.height + scrollY });
    const g = board.geometry(object), candidates = [];
    if (g.type === 'circle') for (let i = 0; i < 48; i++) candidates.push({ x: g.o.x + g.r * Math.cos(i * Math.PI / 24), y: g.o.y + g.r * Math.sin(i * Math.PI / 24) });
    else for (let i = 1; i < 10; i++) candidates.push({ x: g.p.x + (g.q.x - g.p.x) * i / 10, y: g.p.y + (g.q.y - g.p.y) * i / 10 });
    let best, separation = -1;
    for (const p of candidates) {
      const q = screen(p);
      if (q.x < rect.left + 20 || q.x > rect.right - 20 || q.y < rect.top + 20 || q.y > rect.bottom - 20) continue;
      let distance = 1000;
      for (const other of board.objects) {
        if (other.id === object.id) continue;
        const h = board.geometry(other); if (!h) continue;
        const foot = h.type === 'circle' ? null : GeoMath.foot(p, h.p, h.q);
        distance = Math.min(distance, h.type === 'circle' ? Math.abs(GeoMath.dist(p, h.o) - h.r) : foot ? GeoMath.dist(p, foot) : 1000);
      }
      if (distance > separation) { separation = distance; best = q; }
    }
    if (!best || separation < 18) throw Error(`No unambiguous visible position on ${object.id}`);
    return { ...best, objectId: object.id };
  }, spec);
}

async function bounds(page, focus) {
  return page.evaluate(focus => {
    const stage = document.getElementById('recording-stage').getBoundingClientRect();
    const visible = el => el.getClientRects().length && !el.closest('details:not([open]),[hidden]');
    const candidates = [...document.querySelectorAll('#geo-board canvas,#geo-board .lab-readout,#geo-board .tools,#geo-board .tool-instruction,#geo-board .experiment output,#geo-board input[type="range"],#geo-board .range-label,#geo-board .research-figure,#geo-board .research-predict,#geo-board .research-readout')].filter(visible);
    const controls = [...document.querySelectorAll('#geo-board button,#geo-board select,#geo-board input,#geo-board textarea')].filter(visible);
    const edges = candidates.map(el => el.getBoundingClientRect().bottom + 8);
    const active = document.querySelector('.recording-focus') || (focus && document.elementFromPoint(focus.x - scrollX, focus.y - scrollY));
    if (active && document.getElementById('geo-board').contains(active)) {
      const wholeControl = active.closest('.row,.object-panel,.research-predict') || active;
      edges.push(wholeControl.getBoundingClientRect().bottom + 8);
    }
    const pointer = document.getElementById('recording-pointer');
    if (focus) edges.push(pointer.getBoundingClientRect().bottom + 4);
    let bottom = Math.max(stage.top + 200, ...edges), y = stage.top;
    if (bottom - y > 720) {
      if (focus && focus.y > y + 675) y = bottom - 720;
      else {
        const complete = edges.filter(edge => edge <= y + 720 && (!focus || edge >= focus.y + 18));
        bottom = complete.length ? Math.max(...complete) : y + 720;
      }
    }
    // Camera changes may omit a previous part of the drawing, but must never
    // leave half a toolbar button, form control, cursor or highlighted target.
    for (let pass = 0; pass < 4; pass++) for (const control of controls) {
      const rect = control.getBoundingClientRect();
      if (rect.top < y && rect.bottom > y) {
        const group = control.closest('.lab-controls,.tools,.keyboard-panel,.object-panel,.research-predict') || control;
        const whole = group.getBoundingClientRect();
        y = focus && whole.bottom < focus.y - 10 ? whole.bottom + 8 : whole.top - 8;
      }
      if (rect.top < bottom && rect.bottom > bottom) bottom = focus && focus.y >= rect.top && focus.y <= rect.bottom ? rect.bottom + 8 : rect.top - 8;
    }
    for (const control of controls) {
      const rect = control.getBoundingClientRect();
      if (rect.bottom <= y || rect.top >= bottom) continue;
      if (rect.top < y - .5 || rect.bottom > bottom + .5) throw Error(`Partial control in recording: ${control.outerHTML.slice(0,120)}`);
    }
    if (focus) {
      const cursor = pointer.getBoundingClientRect();
      if (cursor.top < y || cursor.bottom > bottom || cursor.left < stage.left || cursor.right > stage.right) throw Error('Recording cursor is outside the complete camera frame');
      if (active && document.getElementById('geo-board').contains(active)) {
        const rect = active.getBoundingClientRect();
        if (rect.top < y || rect.bottom > bottom) throw Error('Highlighted target is cropped');
      }
    }
    return { x: Math.floor(stage.left), y: Math.max(0, Math.floor(y)), width: Math.ceil(stage.width), height: Math.ceil(bottom - y) };
  }, focus);
}

async function record(browser, clip) {
  assert(/^[a-z0-9-]+$/.test(clip.id), 'safe clip name');
  const dir = path.join(output, clip.id); mkdirSync(dir, { recursive: true });
  const sources = sourceFiles(clip), sourceHashes = Object.fromEntries(sources.map(file => [file, sha(readSource(file, clip))]));
  if (args.includes('--resume') && existsSync(path.join(dir, 'recording.json'))) {
    const prior = JSON.parse(readFileSync(path.join(dir, 'recording.json'), 'utf8'));
    if (prior.recorderSha256 === recorderSha256 && prior.scenarioSha256 === sha(JSON.stringify(clip)) && JSON.stringify(prior.sourceHashes) === JSON.stringify(sourceHashes)) {
      console.log(`REUSED ${clip.id}: exact source, recorder and scenario`); return prior;
    }
  }
  const page = await browser.newPage({ viewport: { width: 720, height: 1400 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const errors = [], frames = [], logicalFrames = [], operations = [], states = [];
  page.on('pageerror', error => errors.push(error.message));
  let focus = null, stepIndex = 0, caption = '', suppressCapture = false;

  async function snapshot(duration, final = false) {
    if (suppressCapture) return;
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
    const filename = `${clip.id}/${String(frames.length + 1).padStart(4, '0')}.png`;
    const viewport = await bounds(page, focus);
    await page.screenshot({ path: path.join(output, filename), clip: viewport, animations: 'disabled' });
    frames.push({ filename, duration, stepIndex, caption, final, viewport });
    if (final) logicalFrames.push(frames.length - 1);
  }

  async function clickControl(selector) {
    const control = page.locator(selector).first();
    if (!await control.isVisible()) {
      const summary = page.locator('.extra-tools summary');
      if (await summary.count()) await summary.click();
    }
    const box = await control.boundingBox(); assert(box, `visible control ${selector}`);
    focus = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    await mark(page, focus, selector); await control.click();
    const actual = await control.boundingBox();
    focus = { x: actual.x + actual.width / 2, y: actual.y + actual.height / 2 };
    await mark(page, focus, selector);
    await snapshot(450);
  }

  async function act(action) {
    operations.push({ stepIndex, setup: suppressCapture, ...action });
    if (action.type === 'tool') await clickControl(`[data-tool="${action.tool}"]`);
    else if (action.type === 'point') {
      focus = await projected(page, action.id); await mark(page, focus); await page.mouse.click(focus.x, focus.y);
      focus = await projected(page, action.id); await mark(page, focus); await snapshot(600);
    } else if (action.type === 'drag') {
      const start = await projected(page, action.id), finish = await projected(page, action.id, action.to);
      const before = await page.evaluate(id => { const p = window.__recordLab.board.point(id); return [p.x, p.y]; }, action.id);
      focus = start; await mark(page, focus); await page.mouse.move(start.x, start.y); await page.mouse.down();
      for (let i = 1; i <= 8; i++) {
        focus = { x: start.x + (finish.x - start.x) * i / 8, y: start.y + (finish.y - start.y) * i / 8 };
        await page.mouse.move(focus.x, focus.y); await mark(page, focus); await snapshot(120);
      }
      await page.mouse.up();
      const after = await page.evaluate(id => { const p = window.__recordLab.board.point(id); return [p.x, p.y]; }, action.id);
      assert(Math.hypot(after[0] - before[0], after[1] - before[1]) > 1, `drag changed ${action.id}`);
    } else if (action.type === 'object') {
      focus = await objectPosition(page, action.object || { id: action.id });
      await mark(page, focus); await page.mouse.click(focus.x, focus.y);
      focus = await objectPosition(page, action.object || { id: action.id }); await mark(page, focus); await snapshot(600);
    } else if (action.type === 'slider') {
      const selector = action.key ? `[data-value="${action.key}"]` : '#geo-board input[type="range"]';
      const slider = action.key ? page.locator(selector) : page.locator(selector).nth(action.index || 0), box = await slider.boundingBox(); assert(box);
      const values = await slider.evaluate(el => ({ min: Number(el.min || 0), max: Number(el.max || 100), step: Number(el.step || 1), value: Number(el.value) }));
      assert(action.value >= values.min && action.value <= values.max, 'slider value in range');
      const at = value => ({ x: box.x + 8 + (box.width - 16) * (value - values.min) / (values.max - values.min), y: box.y + box.height / 2 });
      const start = at(values.value), finish = at(action.value);
      focus = start; await mark(page, focus); await page.mouse.move(start.x, start.y); await page.mouse.down();
      for (let i = 1; i <= 6; i++) {
        focus = { x: start.x + (finish.x - start.x) * i / 6, y: start.y };
        await page.mouse.move(focus.x, focus.y); await mark(page, focus); await snapshot(140);
      }
      await page.mouse.up(); await slider.focus();
      const current = Number(await slider.inputValue());
      const correction = Math.round((action.value - current) / values.step);
      assert(Math.abs(correction) <= 12, `range pointer reached target neighbourhood: ${current} -> ${action.value}`);
      for (let i = 0; i < Math.abs(correction); i++) await slider.press(correction > 0 ? 'ArrowRight' : 'ArrowLeft');
      assert(Math.abs(Number(await slider.inputValue()) - action.value) < values.step / 10, 'slider reached exact requested value');
      await snapshot(500);
    } else if (action.type === 'prediction' || action.type === 'select') {
      const selector = action.type === 'prediction' ? '.research-predict select' : action.key ? `[data-value="${action.key}"]` : '.research-controls select';
      const select = action.type === 'select' && !action.key ? page.locator(selector).nth(action.index || 0) : page.locator(selector);
      const box = await select.boundingBox(); assert(box, 'visible choice');
      focus = { x: box.x + box.width * .6, y: box.y + box.height / 2 };
      await mark(page, focus, selector); await select.selectOption(String(action.value));
      await snapshot(650);
    } else if (action.type === 'open-experiment') {
      await clickControl('.research-predict button');
      assert(await page.locator('.research-controls').isVisible(), 'experiment controls opened');
    } else if (action.type === 'observation') {
      const box = await page.locator('#observation').boundingBox(); assert(box);
      focus = { x: box.x + 24, y: box.y + 20 }; await mark(page, focus, '#observation');
      assert.equal(await page.locator('#observation').inputValue(), '', 'recording does not fill the answer');
      await snapshot(1000);
    } else if (action.type === 'goal') {
      await clickControl('[data-act="goal"]');
      const result = await page.evaluate(goal => window.__recordLab.board.goal(goal), clip.goal);
      assert.equal(result.ok, clip.goal !== 'explore', `construction ${clip.id}: ${result.message}`);
      await snapshot(750);
    } else throw Error(`Unknown recording action ${JSON.stringify(action)}`);
    const errorBox = page.locator('.lab-feedback.error');
    const error = await errorBox.count() ? await errorBox.textContent() : '';
    assert(!error, `UI rejected action: ${error}`);
  }

  try {
    await boot(page, clip, sources);
    suppressCapture = true;
    for (const action of clip.setup || []) await act(action);
    suppressCapture = false;
    for (const [index, step] of clip.steps.entries()) {
      stepIndex = index; caption = step.caption; assert(caption && caption.length <= 180, 'short readable caption');
      for (const action of step.actions || []) await act(action);
      await snapshot(index === clip.steps.length - 1 ? 3000 : 2200, true);
      states.push(await page.evaluate(() => window.__recordLab ? { drawing: JSON.parse(window.__recordLab.board.snapshot()), readout: document.querySelector('.lab-readout').textContent, feedback: document.querySelector('.lab-feedback').textContent } : window.__recordInvestigation ? { investigation: window.__recordInvestigation.getState(), readout: document.querySelector('.research-readout').textContent } : { sliders: [...document.querySelectorAll('input[type="range"]')].map(el => Number(el.value)), readout: document.querySelector('output')?.textContent || '' }));
    }
    assert.equal(errors.length, 0, errors.join('\n'));
    assert.equal(logicalFrames.length, clip.steps.length, 'every caption has a still frame');
    if (clip.surface === 'manual' && clip.goal !== 'explore') {
      const result = await page.evaluate(goal => window.__recordLab.board.goal(goal), clip.goal);
      assert(result.ok, `Final construction is valid: ${clip.id}: ${result.message}`);
    }
    if (clip.surface === 'investigation') {
      const finalState = await page.evaluate(() => window.__recordInvestigation.getState());
      assert.equal(finalState.observation, '', 'no answer is written by the demonstration');
      assert.equal(finalState.prediction, 'unsure', 'demonstration does not give the forecast answer');
      assert(finalState.opened && finalState.changed, 'demonstration opened and changed the actual experiment');
    }
    for (const [file, hash] of Object.entries(sourceHashes)) assert.equal(sha(readSource(file, clip)), hash, `recording source changed: ${file}`);
    const result = { id: clip.id, title: clip.title, surface: clip.surface, sourcePage: clip.sourcePage, sourceCourse: clip.sourceCourse || clip.course, sourceRef: clip.sourceRef || null, sourceHashes, recorderSha256, scenarioSha256: sha(JSON.stringify(clip)), frames, logicalFrames, operations, states, browser: browser.version(), errors };
    writeFileSync(path.join(dir, 'recording.json'), JSON.stringify(result, null, 2) + '\n');
    console.log(`RECORDED ${clip.id}: ${logicalFrames.length} steps, ${frames.length} frames`);
    return result;
  } finally { await page.close(); }
}

(async () => {
  if (args.includes('--list')) { console.log(clips.map(clip => clip.id).join('\n')); return; }
  assert(clips.length, 'requested clips exist'); mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: process.env.GEOMETRY_GIFS_BROWSER || process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || process.env.CHROMIUM_EXECUTABLE_PATH || undefined, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    let next = 0;
    const workers = Math.max(1, Math.min(4, Number(option('--workers', '2'))));
    await Promise.all(Array.from({ length: workers }, async () => {
      while (next < clips.length) { const clip = clips[next++]; await record(browser, clip); }
    }));
  }
  finally { await browser.close(); }
  const records = (Array.isArray(catalogue.clips) ? catalogue.clips : Object.values(catalogue.clips)).map(clip => clip.id).filter(id => existsSync(path.join(output, id, 'recording.json')));
  writeFileSync(path.join(output, 'recordings.json'), JSON.stringify({ schemaVersion: 1, catalogueSha256: sha(readFileSync(cataloguePath)), clips: records }, null, 2) + '\n');
})().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
