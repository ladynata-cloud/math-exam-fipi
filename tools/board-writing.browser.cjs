'use strict';

// Real classic-board acceptance, with synthetic localhost rooms and isolated
// browser contexts. No production traffic, personal accounts or server changes.
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { createReadStream, mkdirSync, statSync } = require('node:fs');
const { createServer } = require('node:http');
const { createServer: createNetServer } = require('node:net');
const { extname, join, resolve, sep } = require('node:path');
const { chromium } = require('playwright');
const ROOT = resolve(__dirname, '..');
const STORAGE_KEY = 'mathexam.trainerBoard.v1';
const ARTIFACTS = process.env.BOARD_WRITING_ARTIFACTS;
const wait = ms => new Promise(resolveWait => setTimeout(resolveWait, ms));
const failures = [], sessions = [], notRun = [];
let phase = 'startup';

async function freePort() {
  const server = createNetServer();
  await new Promise((resolveListen, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolveListen); });
  const port = server.address().port;
  await new Promise(resolveClose => server.close(resolveClose));
  return port;
}
function staticServer() {
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
  return createServer((request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://local').pathname);
      if (pathname === '/favicon.ico') { response.writeHead(204).end(); return; }
      let file = resolve(ROOT, '.' + pathname);
      if (file !== ROOT && !file.startsWith(ROOT + sep)) { response.writeHead(403).end(); return; }
      if (statSync(file).isDirectory()) file = join(file, 'index.html');
      response.setHeader('Content-Type', (mime[extname(file)] || 'application/octet-stream') + (/\.(html|js|css|json|svg)$/.test(file) ? '; charset=utf-8' : ''));
      response.setHeader('Cache-Control', 'no-store');
      createReadStream(file).pipe(response);
    } catch (_) { response.writeHead(404).end(); }
  });
}
async function waitForHealth(origin, child, diagnostics) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error('Local server exited: ' + diagnostics());
    try { if ((await fetch(origin + '/health', { signal: AbortSignal.timeout(1000) })).ok) return; } catch (_) {}
    await wait(100);
  }
  throw new Error('Local server health timed out: ' + diagnostics());
}
async function newSession(browser, siteOrigin, boardOrigin, tag, hasTouch = false) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, hasTouch });
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === siteOrigin || url.origin === boardOrigin || ['data:', 'blob:'].includes(url.protocol)) return route.continue();
    failures.push(tag + ': unexpected external request ' + url.origin + url.pathname);
    return route.abort();
  });
  await context.addInitScript(() => {
    if (window !== window.top) return;
    window.__writingPublications = 0;
    window.__writingPointerEvents = [];
    addEventListener('message', event => {
      if (event.source === document.querySelector('#trainerFrame')?.contentWindow && event.data?.type === 'mathexam:trainer-state') window.__writingPublications++;
    });
    for (const type of ['pointerdown', 'pointerup', 'pointercancel']) addEventListener(type, event => {
      if (event.target?.id === 'canvas') window.__writingPointerEvents.push({ type, pointerType: event.pointerType, pointerId: event.pointerId, isPrimary: event.isPrimary, trusted: event.isTrusted });
    }, true);
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000); page.setDefaultNavigationTimeout(20000);
  page.on('pageerror', error => failures.push(tag + ': ' + error.message));
  page.on('response', response => {
    if (response.status() >= 400 && new URL(response.url()).hostname === '127.0.0.1') failures.push(tag + ': HTTP ' + response.status() + ' ' + new URL(response.url()).pathname);
  });
  const session = { context, page, tag, iframeNavigations: 0 };
  page.on('framenavigated', frame => { if (frame.parentFrame()) session.iframeNavigations++; });
  sessions.push(session);
  return session;
}
async function openBoard(session, siteOrigin, boardOrigin) {
  await session.page.goto(siteOrigin + '/trainers/trainer-board.html?server=' + encodeURIComponent(boardOrigin), { waitUntil: 'domcontentloaded' });
  await session.page.waitForFunction(() => typeof publicSnapshot === 'function' && canvas.width > 100 && typeof camera === 'object');
  await trainerFrame(session.page);
}
async function trainerFrame(page) {
  await page.waitForFunction(() => document.querySelector('#trainerFrame')?.src.includes('negative-numbers-line.html'));
  let frame;
  const deadline = Date.now() + 10000;
  while (!frame && Date.now() < deadline) {
    frame = page.frames().find(item => item.url().includes('/trainers/negative-numbers-line.html'));
    if (!frame) await wait(25);
  }
  assert(frame, 'the real registered trainer is loaded');
  await frame.waitForFunction(() => typeof window.getBoardTrainerState === 'function');
  await frame.evaluate(() => {
    if (window.__writingApplied !== undefined) return;
    window.__writingApplied = 0;
    // Registered after the SDK listener: synchronous apply has completed.
    addEventListener('message', event => { if (event.data?.type === 'mathexam:apply-trainer-state') window.__writingApplied++; });
  });
  return frame;
}
const snapshot = page => page.evaluate(() => publicSnapshot());
const rawPages = page => page.evaluate(() => JSON.stringify(publicSnapshot().pages));
const cameraState = page => page.evaluate(() => ({ scale: camera.scale, x: camera.x, y: camera.y }));
const frameState = async page => (await trainerFrame(page)).evaluate(() => {
  const state = window.getBoardTrainerState();
  // The existing trainer's applyState sanitizes CSS classes, removing the
  // trailing space its initial render produces. Compare those class tokens,
  // while retaining every task, answer, phase, hint and visible-text field.
  for (const field of ['instructionClass', 'feedbackClass']) {
    if (typeof state[field] === 'string') state[field] = state[field].trim().replace(/\s+/g, ' ');
  }
  return JSON.stringify(state);
});
const framesSettled = page => page.evaluate(() => new Promise(resolveFrame => requestAnimationFrame(() => requestAnimationFrame(resolveFrame))));

// The unchanged server replaces createdAt on submission. No geometric,
// author, layer, object-ID or page data is excluded from comparisons.
function semantic(value) {
  const copy = JSON.parse(JSON.stringify(value));
  for (const page of copy.pages) for (const stroke of page.strokes) delete stroke.createdAt;
  return copy;
}
async function sameBoard(source, observer, label) {
  const expected = semantic(await snapshot(source));
  await observer.waitForFunction(value => {
    const actual = publicSnapshot();
    for (const page of actual.pages) page.strokes = page.strokes.map(stroke => { const copy = { ...stroke }; delete copy.createdAt; return copy; });
    return JSON.stringify(actual) === JSON.stringify(value);
  }, expected, { polling: 25 });
  assert.deepEqual(semantic(await snapshot(observer)), expected, label);
  return expected;
}
async function chooseTool(page, tool) {
  const control = page.locator('[data-tool="' + tool + '"]');
  if (!await control.isVisible()) await page.locator('details.shape-menu > summary').click();
  await control.click();
  assert.equal(await control.getAttribute('aria-pressed'), 'true', tool + ' is selected');
}
async function boardSettings(page, action) {
  await page.locator('#boardOptions').click(); await action();
  await page.locator('#boardPanel [data-close-panel]').click();
}
async function mouseGesture(page, start, end, options = {}) {
  const canvas = page.locator('#canvas'); await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  assert(box && box.width > Math.max(start.x, end.x) + 2 && box.height > Math.max(start.y, end.y) + 2, 'gesture fits the visible drawing surface');
  await page.mouse.move(box.x + start.x, box.y + start.y);
  await page.mouse.down({ button: options.button || 'left' });
  await page.mouse.move(box.x + end.x, box.y + end.y, { steps: 8 });
  if (!options.keepDown) await page.mouse.up({ button: options.button || 'left' });
  return box;
}
async function drawStroke(page, tool, start, end) {
  await chooseTool(page, tool); const before = await snapshot(page);
  await mouseGesture(page, start, end);
  await page.waitForFunction(({ index, count }) => publicSnapshot().pages[index].strokes.length === count + 1, { index: before.currentPage, count: before.pages[before.currentPage].strokes.length });
  const stroke = (await snapshot(page)).pages[before.currentPage].strokes.at(-1);
  assert(stroke.objectId, 'a completed user gesture creates an identified object');
  return stroke;
}
async function bitmap(page) {
  return page.locator('#canvas').evaluate(element => {
    const pixels = element.getContext('2d').getImageData(0, 0, element.width, element.height).data;
    let hash = 2166136261, transparent = 0;
    for (let index = 0; index < pixels.length; index++) hash = Math.imul(hash ^ pixels[index], 16777619);
    for (let index = 3; index < pixels.length; index += 4) if (pixels[index] !== 255) transparent++;
    return { width: element.width, height: element.height, hash: hash >>> 0, transparent };
  });
}
async function exportBitmap(page) {
  await page.locator('#boardOptions').click();
  const downloaded = page.waitForEvent('download'); await page.locator('#export').click();
  const download = await downloaded; assert.match(download.suggestedFilename(), /\.png$/);
  const chunks = [], stream = await download.createReadStream();
  for await (const chunk of stream) chunks.push(chunk);
  await page.locator('#boardPanel [data-close-panel]').click();
  return page.evaluate(async base64 => {
    const picture = new Image(); picture.src = 'data:image/png;base64,' + base64; await picture.decode();
    const target = document.createElement('canvas'); target.width = picture.naturalWidth; target.height = picture.naturalHeight;
    const ctx = target.getContext('2d'); ctx.drawImage(picture, 0, 0);
    const pixels = ctx.getImageData(0, 0, target.width, target.height).data;
    let hash = 2166136261, transparent = 0;
    for (let index = 0; index < pixels.length; index++) hash = Math.imul(hash ^ pixels[index], 16777619);
    for (let index = 3; index < pixels.length; index += 4) if (pixels[index] !== 255) transparent++;
    return { width: target.width, height: target.height, hash: hash >>> 0, transparent };
  }, Buffer.concat(chunks).toString('base64'));
}
function near(actual, expected, message, tolerance = 1.1) {
  assert(Math.abs(actual - expected) <= tolerance, message + ': expected ' + expected + ', received ' + actual);
}
function assertPathShape(stroke, name, start, end) {
  assert.equal(stroke.kind, 'path', name + ' uses the existing path protocol');
  assert.equal(stroke.tool, 'pen', name + ' renders on unchanged clients');
  assert(stroke.points.every(point => Number.isFinite(point.x) && Number.isFinite(point.y)), name + ': finite points');
  const xs = stroke.points.map(point => point.x), ys = stroke.points.map(point => point.y);
  near(Math.min(...xs), start.x, name + ': left bound'); near(Math.max(...xs), end.x, name + ': right bound');
  if (name === 'arrow') {
    assert(stroke.points.some(point => Math.abs(point.x - end.x) < 1.1 && Math.abs(point.y - end.y) < 1.1), 'arrow reaches its tip');
    assert(Math.min(...ys) < end.y - 3 && Math.max(...ys) > end.y + 3, 'arrow has two visible head wings');
  } else {
    near(Math.min(...ys), start.y, name + ': top bound'); near(Math.max(...ys), end.y, name + ': bottom bound');
    near(stroke.points[0].x, stroke.points.at(-1).x, name + ': closed x'); near(stroke.points[0].y, stroke.points.at(-1).y, name + ': closed y');
    if (name === 'ellipse') assert(stroke.points.length >= 12, 'ellipse is a curve, not a rectangle');
    if (name === 'triangle') assert.equal(new Set(stroke.points.map(point => point.x.toFixed(2) + ',' + point.y.toFixed(2))).size, 3, 'triangle has exactly three corners');
  }
}

async function screenshotFixture(page) {
  // A synthetic two-colour screenshot, created without a file or user data.
  return Buffer.from(await page.evaluate(() => {
    const fixture = document.createElement('canvas'); fixture.width = 192; fixture.height = 128;
    const ctx = fixture.getContext('2d');
    ctx.fillStyle = '#2079ab'; ctx.fillRect(0, 0, 192, 128);
    ctx.fillStyle = '#f0ba38'; ctx.fillRect(128, 0, 64, 128);
    return fixture.toDataURL('image/png').split(',')[1];
  }), 'base64');
}
async function screenshotCodecs(page) {
  const results = await page.evaluate(async () => {
    const result = [];
    for (const [type, width, height] of [['image/jpeg', 1920, 1200], ['image/webp', 96, 64]]) {
      const fixture = document.createElement('canvas'); fixture.width = width; fixture.height = height;
      const ctx = fixture.getContext('2d'); ctx.fillStyle = '#2079ab'; ctx.fillRect(0, 0, width, height);
      const blob = await new Promise(resolveBlob => fixture.toBlob(resolveBlob, type, .9));
      if (!blob || blob.type !== type) throw new Error('Browser cannot encode test fixture ' + type);
      const imported = await BoardImages.importFile(new File([blob], 'synthetic-' + type.split('/')[1], { type }));
      const decoded = new Image(); decoded.src = imported.src; await decoded.decode();
      result.push({ type, inputWidth: width, inputHeight: height, width: imported.width, height: imported.height,
        decodedWidth: decoded.naturalWidth, decodedHeight: decoded.naturalHeight, srcType: imported.src.split(';')[0], bytes: imported.src.length });
    }
    return result;
  });
  for (const result of results) {
    assert(result.width > 0 && result.height > 0 && Math.max(result.width, result.height) <= 1600, result.type + ' dimensions are bounded');
    assert.equal(result.decodedWidth, result.width, result.type + ' payload decodes to the advertised width');
    assert.equal(result.decodedHeight, result.height, result.type + ' payload decodes to the advertised height');
    near(result.width / result.height, result.inputWidth / result.inputHeight, result.type + ' retains aspect ratio', .01);
    assert.match(result.srcType, /^data:image\/(png|jpeg|webp)$/);
    assert(result.bytes <= 350 * 1024, result.type + ' payload fits the transport bound');
  }
  assert(results[0].width < results[0].inputWidth, 'large JPEG is really downscaled');
}
async function imageVisible(page, object) {
  await page.waitForFunction(value => {
    const element = document.querySelector('#canvas');
    const worldX = value.x + value.width / 4, worldY = value.y + value.height / 2;
    const x = Math.round((worldX * camera.scale + camera.x) * devicePixelRatio);
    const y = Math.round((worldY * camera.scale + camera.y) * devicePixelRatio);
    if (x < 0 || y < 0 || x >= element.width || y >= element.height) return false;
    const pixel = element.getContext('2d').getImageData(x, y, 1, 1).data;
    return Math.abs(pixel[0] - 32) <= 5 && Math.abs(pixel[1] - 121) <= 5 && Math.abs(pixel[2] - 171) <= 5 && pixel[3] === 255;
  }, object, { polling: 25 });
}
async function uploadScreenshot(page, buffer) {
  const before = await snapshot(page);
  const choosing = page.waitForEvent('filechooser');
  await page.locator('#addBoardImage').click();
  await (await choosing).setFiles({ name: 'synthetic-exercise.png', mimeType: 'image/png', buffer });
  await page.waitForFunction(({ index, count }) => publicSnapshot().pages[index].strokes.length === count + 1, { index: before.currentPage, count: before.pages[before.currentPage].strokes.length });
  const object = (await snapshot(page)).pages[before.currentPage].strokes.at(-1);
  assert.equal(object.kind, 'image', 'file picker creates a shared image object');
  assert.equal(object.tool, 'image');
  assert.match(object.src, /^data:image\/(png|jpeg|webp);base64,/);
  assert(object.src.length <= 350 * 1024, 'shared screenshot is bounded');
  assert(object.width > 0 && object.height > 0 && Number.isFinite(object.x) && Number.isFinite(object.y));
  await imageVisible(page, object);
  return object;
}
async function realClipboardScreenshot(session, siteOrigin, buffer) {
  const { page, context } = session;
  try {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: siteOrigin });
    await page.evaluate(async base64 => {
      const blob = await (await fetch('data:image/png;base64,' + base64)).blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    }, buffer.toString('base64'));
  } catch (error) {
    // OS/browser clipboard availability is distinct from the app paste handler.
    // Once clipboard preparation succeeds, a failed real paste fails the gate.
    const reason = 'real OS clipboard preparation: ' + String(error.message).split('\n')[0];
    notRun.push(reason); console.log('NOT_RUN ' + reason); return;
  }
  const before = await snapshot(page);
  await page.locator('#canvas').focus(); await page.keyboard.press('Control+V');
  await page.waitForFunction(({ index, count }) => publicSnapshot().pages[index].strokes.length === count + 1, { index: before.currentPage, count: before.pages[before.currentPage].strokes.length });
  const pasted = (await snapshot(page)).pages[before.currentPage].strokes.at(-1);
  assert.equal(pasted.kind, 'image', 'real keyboard paste imports the clipboard PNG');
  await imageVisible(page, pasted);
  console.log('PASS real browser clipboard image paste');
}

async function localWriting(browser, siteOrigin, boardOrigin) {
  const session = await newSession(browser, siteOrigin, boardOrigin, 'local', true), page = session.page;
  await openBoard(session, siteOrigin, boardOrigin);
  phase = 'local pen, grid-preserving eraser and actual PNG download';
  const colorChip = page.locator('[data-pen-color]').last();
  const selectedColor = await colorChip.getAttribute('data-pen-color'); await colorChip.click();
  const sizeChip = page.locator('[data-pen-size]').first();
  const selectedSize = Number(await sizeChip.getAttribute('data-pen-size')); await sizeChip.click();
  const blank = await bitmap(page); assert.equal(blank.transparent, 0, 'paper is opaque before writing: ' + JSON.stringify(blank));
  const pen = await drawStroke(page, 'pen', { x: 100, y: 140 }, { x: 220, y: 140 });
  assert.equal(pen.color.toLowerCase(), selectedColor.toLowerCase(), 'quick colour is used by real handwriting');
  assert.equal(pen.size, selectedSize, 'quick thickness is used by real handwriting');
  const ink = await bitmap(page); assert.notEqual(ink.hash, blank.hash, 'pen creates visible ink');
  await chooseTool(page, 'eraser');
  await boardSettings(page, async () => { await page.locator('#size').focus(); await page.keyboard.press('End'); });
  await drawStroke(page, 'eraser', { x: 88, y: 140 }, { x: 232, y: 140 });
  assert.deepEqual(await bitmap(page), blank, 'eraser removes only ink: grid, paper and opacity match the blank sheet');
  assert.deepEqual(await exportBitmap(page), blank, 'downloaded PNG preserves the erased grid and opaque paper');
  await page.locator('#undo').click(); assert.deepEqual(await bitmap(page), ink, 'undo restores the exact original handwriting');
  assert.deepEqual(await exportBitmap(page), ink, 'PNG after undo contains the restored ink');
  await page.locator('#redo').click(); assert.deepEqual(await bitmap(page), blank, 'redo reapplies erasing without a transparent hole');
  assert.deepEqual(await exportBitmap(page), blank, 'PNG after redo remains opaque');

  phase = 'screenshot file chooser, ink over image, eraser and PNG layers';
  await screenshotCodecs(page);
  const fixture = await screenshotFixture(page), uploaded = await uploadScreenshot(page, fixture);
  // The live upload notice temporarily changes the available canvas height.
  // Wait for its actual dismissal before comparing full bitmap dimensions.
  await page.locator('#boardMessage').waitFor({ state: 'hidden', timeout: 10000 });
  await framesSettled(page); await imageVisible(page, uploaded);
  const imageBase = await bitmap(page);
  const sample = { x: uploaded.x + uploaded.width / 4, y: uploaded.y + uploaded.height / 2 };
  await sizeChip.click();
  await drawStroke(page, 'pen', { x: sample.x - 20, y: sample.y }, { x: sample.x + 20, y: sample.y });
  const annotatedImage = await bitmap(page);
  assert.notEqual(annotatedImage.hash, imageBase.hash, 'writing is visible above the imported screenshot');
  await chooseTool(page, 'eraser');
  await boardSettings(page, async () => { await page.locator('#size').focus(); await page.keyboard.press('End'); });
  await drawStroke(page, 'eraser', { x: sample.x - 30, y: sample.y }, { x: sample.x + 30, y: sample.y });
  assert.deepEqual(await bitmap(page), imageBase, 'erasing handwriting preserves every screenshot pixel');
  assert.deepEqual(await exportBitmap(page), imageBase, 'export composites screenshot below erased ink');
  await page.locator('#undo').click(); assert.deepEqual(await bitmap(page), annotatedImage, 'undo restores annotation above the image');
  await page.locator('#redo').click(); assert.deepEqual(await bitmap(page), imageBase, 'redo preserves the screenshot layer');

  phase = 'existing tools, quick controls and compatible mathematical shapes';
  await sizeChip.click();
  await drawStroke(page, 'marker', { x: 100, y: 210 }, { x: 210, y: 230 });
  assert.equal((await snapshot(page)).pages[0].strokes.at(-1).tool, 'marker');
  assert.equal((await drawStroke(page, 'line', { x: 110, y: 270 }, { x: 210, y: 285 })).kind, 'line');
  assert.equal((await drawStroke(page, 'rect', { x: 250, y: 100 }, { x: 370, y: 165 })).kind, 'rect');
  for (const [tool, start, end] of [
    ['arrow', { x: 250, y: 210 }, { x: 370, y: 210 }],
    ['ellipse', { x: 250, y: 260 }, { x: 370, y: 325 }],
    ['triangle', { x: 100, y: 340 }, { x: 220, y: 405 }]
  ]) assertPathShape(await drawStroke(page, tool, start, end), tool, start, end);
  await chooseTool(page, 'text'); await mouseGesture(page, { x: 270, y: 370 }, { x: 270, y: 370 });
  await page.locator('#editor').fill('x² + y = 7'); await page.locator('#editor').press('Control+Enter');
  assert.equal((await snapshot(page)).pages[0].strokes.at(-1).text, 'x² + y = 7', 'text enters the drawing');
  const beforeCancel = await rawPages(page);
  await mouseGesture(page, { x: 270, y: 430 }, { x: 270, y: 430 });
  await page.locator('#editor').fill('cancelled draft'); await page.locator('#editor').press('Escape');
  assert.equal(await rawPages(page), beforeCancel, 'Escape does not commit a text draft');

  phase = 'split dragging, keyboard resize, camera transforms and trainer continuity';
  const trainerBefore = await frameState(page), navigationsBefore = session.iframeNavigations, originalPages = await rawPages(page);
  for (const mode of ['trainer', 'board', 'split']) {
    const button = page.locator('[data-workspace-view="' + mode + '"]');
    await button.click(); await framesSettled(page);
    assert.equal(await button.getAttribute('aria-pressed'), 'true', mode + ' view is exposed as selected');
    if (mode === 'trainer') {
      assert(await page.locator('#lesson').evaluate(element => element.classList.contains('trainer-only')));
      assert((await page.locator('#trainerFrame').boundingBox()).width > 1200, 'trainer-only view uses the available desktop width');
      assert.equal(await page.locator('.board').isVisible(), false);
    } else if (mode === 'board') {
      assert(await page.locator('#lesson').evaluate(element => element.classList.contains('hide-trainer')));
      assert((await page.locator('#canvas').boundingBox()).width > 1200, 'board-only view uses the available desktop width');
      assert.equal(await page.locator('.trainer').isVisible(), false);
    } else {
      assert.equal(await page.locator('.trainer').isVisible(), true);
      assert.equal(await page.locator('.board').isVisible(), true);
    }
    assert.equal(await rawPages(page), originalPages, mode + ' view preserves all ink and image objects');
  }
  await imageVisible(page, uploaded);
  assert.equal(await frameState(page), trainerBefore, 'three workspace modes preserve the current trainer task');
  assert.equal(session.iframeNavigations, navigationsBefore, 'three workspace modes never navigate or replace the trainer');
  const divider = page.locator('#boardDivider'); assert.equal(await divider.getAttribute('role'), 'separator');
  const frameBounds = await page.locator('#trainerFrame').boundingBox(), bounds = await divider.boundingBox();
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + 100); await page.mouse.down();
  await page.mouse.move(bounds.x + 90, bounds.y + 100, { steps: 6 }); await page.mouse.up(); await framesSettled(page);
  assert((await page.locator('#trainerFrame').boundingBox()).width > frameBounds.width + 40, 'real divider drag changes the split');
  await divider.focus(); const widthBeforeKey = (await page.locator('#trainerFrame').boundingBox()).width;
  await page.keyboard.press('ArrowLeft'); await framesSettled(page);
  assert((await page.locator('#trainerFrame').boundingBox()).width < widthBeforeKey, 'keyboard adjusts the split');
  assert.equal(await rawPages(page), originalPages, 'split resizing does not rewrite stroke coordinates');
  const backing = await page.locator('#canvas').evaluate(element => ({ actual: element.width, expected: Math.round(element.getBoundingClientRect().width * devicePixelRatio) }));
  assert.equal(backing.actual, backing.expected, 'drawing backing follows the resized pane');
  await page.locator('#zoomIn').click(); await page.locator('#zoomIn').click();
  const enlarged = await cameraState(page); assert(enlarged.scale > 1, 'zoom in changes the local view');
  await page.locator('#zoomOut').click(); assert((await cameraState(page)).scale < enlarged.scale, 'zoom out decreases the local view');
  const beforePan = await cameraState(page);
  await chooseTool(page, 'hand'); await mouseGesture(page, { x: 120, y: 160 }, { x: 180, y: 190 });
  const afterPan = await cameraState(page);
  near(afterPan.x - beforePan.x, 60, 'pan translates x'); near(afterPan.y - beforePan.y, 30, 'pan translates y');
  assert.equal(await rawPages(page), originalPages, 'pan and zoom do not add or change strokes');
  const screenStart = { x: 140, y: 230 }, screenEnd = { x: 240, y: 260 };
  const transformed = await drawStroke(page, 'pen', screenStart, screenEnd);
  near(transformed.points[0].x, (screenStart.x - afterPan.x) / afterPan.scale, 'zoomed pen inverse x');
  near(transformed.points[0].y, (screenStart.y - afterPan.y) / afterPan.scale, 'zoomed pen inverse y');
  const withTransformedStroke = await rawPages(page);
  await page.locator('#zoomReset').click(); assert.deepEqual(await cameraState(page), { scale: 1, x: 0, y: 0 });
  await page.locator('#fitBoard').click();
  const fitted = await cameraState(page); assert(Number.isFinite(fitted.scale) && fitted.scale > 0, 'fit produces a finite view');
  const canvasBounds = await page.locator('#canvas').boundingBox();
  for (const stroke of (await snapshot(page)).pages[0].strokes) for (const point of stroke.points || [stroke.start, stroke.end].filter(Boolean)) {
    const x = point.x * fitted.scale + fitted.x, y = point.y * fitted.scale + fitted.y;
    assert(x >= -1 && x <= canvasBounds.width + 1 && y >= -1 && y <= canvasBounds.height + 1, 'fit shows all stored path geometry');
  }
  for (const point of [{ x: uploaded.x, y: uploaded.y }, { x: uploaded.x + uploaded.width, y: uploaded.y + uploaded.height }]) {
    assert(point.x * fitted.scale + fitted.x >= -1 && point.x * fitted.scale + fitted.x <= canvasBounds.width + 1 &&
      point.y * fitted.scale + fitted.y >= -1 && point.y * fitted.scale + fitted.y <= canvasBounds.height + 1, 'fit includes the imported screenshot');
  }
  assert.equal(await rawPages(page), withTransformedStroke, 'fit leaves all coordinates unchanged');
  assert.equal(await frameState(page), trainerBefore, 'view changes preserve the live trainer task');
  assert.equal(session.iframeNavigations, navigationsBefore, 'split/zoom/pan/fit do not reload the trainer iframe');
  if (ARTIFACTS) await page.screenshot({ path: join(ARTIFACTS, 'writing-desktop.png') });
  for (const width of [768, 360]) {
    await page.setViewportSize({ width, height: 1000 }); await framesSettled(page);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'no horizontal overflow at ' + width);
    await page.locator('#canvas').scrollIntoViewIfNeeded();
    assert((await page.locator('#canvas').boundingBox()).width > 250, 'narrow layout retains a usable writing surface');
    if (ARTIFACTS) await page.screenshot({ path: join(ARTIFACTS, 'writing-' + width + '.png') });
  }
  await page.setViewportSize({ width: 1440, height: 1000 }); await framesSettled(page);
  await page.locator('#zoomReset').click();
  assert.equal(await rawPages(page), withTransformedStroke, 'responsive reflow preserves every stroke');
  assert.equal(session.iframeNavigations, navigationsBefore, 'responsive reflow does not replace the iframe');

  phase = 'trusted pen and simultaneous secondary touch input';
  await chooseTool(page, 'pen'); const cdp = await session.context.newCDPSession(page);
  await page.locator('#canvas').scrollIntoViewIfNeeded(); const cb = await page.locator('#canvas').boundingBox();
  let before = (await snapshot(page)).pages[0].strokes.length;
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', pointerType: 'pen', button: 'left', buttons: 1, clickCount: 1, x: cb.x + 110, y: cb.y + 460, force: 0.6 });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', pointerType: 'pen', button: 'left', buttons: 1, x: cb.x + 200, y: cb.y + 475, force: 0.7 });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', pointerType: 'pen', button: 'left', buttons: 0, clickCount: 1, x: cb.x + 200, y: cb.y + 475 });
  assert.equal((await snapshot(page)).pages[0].strokes.length, before + 1, 'trusted stylus gesture commits one stroke');
  assert(await page.evaluate(() => window.__writingPointerEvents.some(event => event.pointerType === 'pen' && event.trusted)), 'CDP exercised the browser pen path');
  before = (await snapshot(page)).pages[0].strokes.length;
  const primary = { id: 11, x: cb.x + 110, y: cb.y + 520 }, secondary = { id: 12, x: cb.x + 340, y: cb.y + 560 };
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [primary] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...primary, x: cb.x + 135 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...primary, x: cb.x + 135 }, secondary] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...primary, x: cb.x + 190 }, { ...secondary, x: cb.x + 370 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  const touchStrokes = (await snapshot(page)).pages[0].strokes;
  assert.equal(touchStrokes.length, before + 1, 'secondary contact cannot start or prematurely commit another stroke');
  assert(touchStrokes.at(-1).points.every(point => point.x < 240 && Math.abs(point.y - 520) < 1.1), 'secondary pointer cannot corrupt the active stroke');
  assert(await page.evaluate(() => window.__writingPointerEvents.some(event => event.pointerType === 'touch' && !event.isPrimary && event.trusted)), 'a real secondary browser pointer was delivered');
  await cdp.detach();
  phase = 'real keyboard clipboard paste and persistent local image bytes';
  await realClipboardScreenshot(session, siteOrigin, fixture);
  const localBytes = await rawPages(page);
  await page.waitForFunction(({ key, expected }) => JSON.stringify(JSON.parse(localStorage.getItem(key)).pages.map(({ id, bg, strokes }) => ({ id, bg, strokes }))) === expected, { key: STORAGE_KEY, expected: localBytes });
  await page.locator('[data-workspace-view="board"]').click();
  await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => typeof publicSnapshot === 'function' && canvas.width > 100);
  assert.equal(await rawPages(page), localBytes, 'local reload preserves the stored stroke bytes');
  assert(await page.locator('#lesson').evaluate(element => element.classList.contains('hide-trainer')), 'local board-only preference survives reload');
  await imageVisible(page, uploaded);
  await session.context.close();
  console.log('PASS local writing: opaque eraser/PNG; screenshot and ink layers; tools/shapes; split/camera; pen/secondary touch; reload');
}

async function connected(page) {
  await page.waitForFunction(() => shared.connected && roomStateReceived && document.querySelector('#mirrorStatus')?.dataset.mirrorStatus === 'connected', null, { polling: 25, timeout: 15000 });
  await trainerFrame(page);
  await page.evaluate(() => {
    if (window.__writingSocket === shared.socket) return;
    window.__writingSocket = shared.socket; window.__writingEvents = {}; window.__writingOutgoing = {};
    shared.socket.onAny(event => { window.__writingEvents[event] = (window.__writingEvents[event] || 0) + 1; });
    shared.socket.onAnyOutgoing(event => { window.__writingOutgoing[event] = (window.__writingOutgoing[event] || 0) + 1; });
  });
}
const eventCount = (page, name) => page.evaluate(event => window.__writingEvents[event] || 0, name);
const writingCommands = page => page.evaluate(() => Object.fromEntries(Object.entries(window.__writingOutgoing).filter(([event]) =>
  /^board:(stroke-|text-add|snapshot|page-|clear-page|bg-change)/.test(event))));
async function acknowledged(page, name, before) {
  await page.waitForFunction(({ event, count }) => (window.__writingEvents[event] || 0) > count, { event: name, count: before }, { polling: 25 });
}
async function handoff(teacher, student, studentControls) {
  const previous = studentControls ? teacher : student, next = studentControls ? student : teacher, previousFrame = await trainerFrame(previous);
  const applied = await previousFrame.evaluate(() => window.__writingApplied), published = await next.evaluate(() => window.__writingPublications), beforeFrame = await frameState(previous);
  const teacherEvent = await eventCount(teacher, 'control:changed'), studentEvent = await eventCount(student, 'control:changed');
  await teacher.locator('#boardControlToggle').click();
  await acknowledged(teacher, 'control:changed', teacherEvent); await acknowledged(student, 'control:changed', studentEvent);
  await student.waitForFunction(value => canWrite() === value, studentControls); await teacher.waitForFunction(value => canWrite() !== value, studentControls);
  await next.waitForFunction(count => window.__writingPublications > count, published, { polling: 25 });
  await previousFrame.waitForFunction(count => window.__writingApplied > count, applied, { polling: 25 });
  assert.equal(await frameState(next), beforeFrame, 'handoff preserves the trainer task after bridge settlement');
  await sameBoard(next, previous, 'control handoff preserves the board');
}
async function undoOrRedo(source, observer, command) {
  const beforeSource = await eventCount(source, 'board:page-state'), beforeObserver = await eventCount(observer, 'board:page-state');
  assert.equal(await source.locator('#' + command).isEnabled(), true, command + ' is accessible after the previous acknowledgement');
  await source.locator('#' + command).click();
  await acknowledged(source, 'board:page-state', beforeSource); await acknowledged(observer, 'board:page-state', beforeObserver);
  return sameBoard(source, observer, command + ' acknowledgement agrees on both clients');
}
async function sharedWriting(browser, siteOrigin, boardOrigin) {
  phase = 'real local room and observer permissions';
  const teacherSession = await newSession(browser, siteOrigin, boardOrigin, 'teacher'), teacher = teacherSession.page;
  await openBoard(teacherSession, siteOrigin, boardOrigin);
  await teacher.locator('#openShare').click(); await teacher.locator('#createRoom').click(); await connected(teacher);
  const studentLink = await teacher.locator('#studentLink').inputValue();
  assert.equal(new URL(studentLink).origin, siteOrigin, 'invite remains on the local site');
  assert.equal(new URL(studentLink).searchParams.get('server'), boardOrigin, 'invite targets only the local server');
  await teacher.locator('#sharePanel [data-close-panel]').click();
  const studentSession = await newSession(browser, siteOrigin, boardOrigin, 'student'), student = studentSession.page;
  await student.goto(studentLink, { waitUntil: 'domcontentloaded' }); await connected(student);
  await sameBoard(teacher, student, 'initial room hydration');
  const teacherStroke = await drawStroke(teacher, 'pen', { x: 100, y: 120 }, { x: 220, y: 160 });
  await sameBoard(teacher, student, 'teacher handwriting appears on the observer');
  const observerBefore = await rawPages(student), observerOutgoing = await student.evaluate(() => JSON.stringify(window.__writingOutgoing));
  await mouseGesture(student, { x: 280, y: 120 }, { x: 380, y: 160 });
  assert.equal(await rawPages(student), observerBefore, 'observer cannot edit by pointing at the canvas');
  assert.equal(await student.evaluate(() => JSON.stringify(window.__writingOutgoing)), observerOutgoing, 'observer emits no writing command');

  phase = 'visible handoff and author-aware undo/redo after server acknowledgement';
  await handoff(teacher, student, true);
  const studentStroke = await drawStroke(student, 'pen', { x: 100, y: 210 }, { x: 220, y: 245 });
  await sameBoard(student, teacher, 'student handwriting returns to the teacher');
  assert.equal(studentStroke.authorRole, 'student'); assert.notEqual(studentStroke.authorId, teacherStroke.authorId);
  await handoff(teacher, student, false);
  const undone = await undoOrRedo(teacher, student, 'undo');
  assert.deepEqual(undone.pages[0].strokes.map(stroke => stroke.objectId), [studentStroke.objectId], 'teacher undo removes own older stroke and retains the student stroke');
  const restored = await undoOrRedo(teacher, student, 'redo');
  assert.deepEqual(restored.pages[0].strokes.map(stroke => stroke.objectId), [studentStroke.objectId, teacherStroke.objectId], 'redo restores the correct authored stroke');

  phase = 'room-wide redo across a sheet switch and independent new drawing';
  await undoOrRedo(teacher, student, 'undo'); await teacher.locator('#addSheet').click();
  await student.waitForFunction(() => publicSnapshot().pages.length === 2 && publicSnapshot().currentPage === 1);
  await sameBoard(teacher, student, 'new sheet is shared');
  const secondSheetStroke = await drawStroke(teacher, 'ellipse', { x: 100, y: 120 }, { x: 220, y: 155 });
  assertPathShape(secondSheetStroke, 'ellipse', { x: 100, y: 120 }, { x: 220, y: 155 });
  await sameBoard(teacher, student, 'new sheet handwriting');
  const acrossPages = await undoOrRedo(teacher, student, 'redo');
  assert.equal(acrossPages.currentPage, 1, 'redo on another sheet does not move the current sheet');
  assert.deepEqual(acrossPages.pages[0].strokes.map(stroke => stroke.objectId), [studentStroke.objectId, teacherStroke.objectId], 'new drawing on sheet two does not discard sheet-one redo');
  assert.deepEqual(acrossPages.pages[1].strokes.map(stroke => stroke.objectId), [secondSheetStroke.objectId]);

  phase = 'revoke during real pointer capture discards the unfinished stroke';
  await handoff(teacher, student, true);
  const beforeInterrupted = semantic(await snapshot(student)), observerStart = await eventCount(teacher, 'board:stroke-start');
  const outgoingEnds = await student.evaluate(() => window.__writingOutgoing['board:stroke-end'] || 0);
  await chooseTool(student, 'pen');
  const dragBox = await mouseGesture(student, { x: 110, y: 260 }, { x: 190, y: 285 }, { keepDown: true });
  await acknowledged(teacher, 'board:stroke-start', observerStart); await handoff(teacher, student, false);
  await student.mouse.move(dragBox.x + 240, dragBox.y + 300); await student.mouse.up();
  assert.deepEqual(semantic(await snapshot(student)), beforeInterrupted, 'revoked pointer does not persist a partial stroke');
  assert.equal(await student.evaluate(() => window.__writingOutgoing['board:stroke-end'] || 0), outgoingEnds, 'revoked writer cannot send stroke-end');
  for (const page of [teacher, student]) assert(await page.evaluate(() => current === null && drawing === false), 'handoff clears unfinished drawing and preview on both participants');
  await sameBoard(teacher, student, 'no ghost or late stroke after revoke');

  phase = 'shared screenshot payload and actual observer pixels';
  const screenshot = await uploadScreenshot(teacher, await screenshotFixture(teacher));
  await sameBoard(teacher, student, 'screenshot is synchronized through the unchanged object transport');
  const observedImage = (await snapshot(student)).pages[1].strokes.find(stroke => stroke.objectId === screenshot.objectId);
  assert.equal(observedImage.src, screenshot.src, 'observer receives byte-identical screenshot payload');
  await imageVisible(student, observedImage);
  assert.equal(await student.locator('#addBoardImage').isEnabled(), false, 'observer cannot upload a screenshot');

  phase = 'local views keep shared coordinates and trainer state unchanged';
  const sharedBefore = semantic(await snapshot(teacher)), taskBefore = await frameState(teacher);
  const navigations = [teacherSession.iframeNavigations, studentSession.iframeNavigations], studentCamera = await cameraState(student);
  const viewCommandsBefore = await writingCommands(teacher);
  await teacher.locator('#zoomIn').click(); await chooseTool(teacher, 'hand');
  await mouseGesture(teacher, { x: 110, y: 160 }, { x: 160, y: 185 }); await teacher.locator('#fitBoard').click();
  assert.deepEqual(semantic(await snapshot(teacher)), sharedBefore, 'local teacher view does not rewrite shared coordinates');
  assert.deepEqual(await cameraState(student), studentCamera, 'teacher camera stays local');
  assert.deepEqual(await writingCommands(teacher), viewCommandsBefore, 'camera controls send no drawing, snapshot or page mutation');
  await sameBoard(teacher, student, 'different views share the same drawing');
  assert.equal(await frameState(teacher), taskBefore);
  assert.deepEqual([teacherSession.iframeNavigations, studentSession.iframeNavigations], navigations, 'view changes do not reload either trainer');
  if (ARTIFACTS) await teacher.screenshot({ path: join(ARTIFACTS, 'writing-teacher-shared.png') });

  phase = 'authoritative stroke bytes survive teacher/student reload and late join';
  // Observer objects already contain the server timestamp; compare all bytes.
  const canonicalBytes = await rawPages(student);
  await teacher.reload({ waitUntil: 'domcontentloaded' }); await connected(teacher);
  assert.equal(await rawPages(teacher), canonicalBytes, 'teacher reload restores exact authoritative stroke bytes');
  await imageVisible(teacher, screenshot);
  await student.reload({ waitUntil: 'domcontentloaded' }); await connected(student);
  assert.equal(await rawPages(student), canonicalBytes, 'student reload restores exact authoritative stroke bytes');
  await imageVisible(student, screenshot);
  assert.equal(await teacher.evaluate(() => canWrite()), true, 'teacher keeps control through reload');
  assert.equal(await student.evaluate(() => canWrite()), false, 'student remains an observer through reload');
  const lateSession = await newSession(browser, siteOrigin, boardOrigin, 'late');
  await lateSession.page.goto(studentLink, { waitUntil: 'domcontentloaded' }); await connected(lateSession.page);
  assert.equal(await rawPages(lateSession.page), canonicalBytes, 'late join hydrates exact stored stroke bytes');
  await imageVisible(lateSession.page, screenshot);
  await teacher.locator('#prevSheet').click(); await lateSession.page.waitForFunction(() => publicSnapshot().currentPage === 0);
  await sameBoard(teacher, lateSession.page, 'late join follows subsequent sheet navigation');
  await lateSession.context.close(); await studentSession.context.close(); await teacherSession.context.close();
  console.log('PASS shared writing: owner-only input; real handoff; own undo/redo across sheets; mid-gesture revoke; screenshot bytes/pixels; reload/late join');
}
async function diagnostics() {
  for (const { page, tag } of sessions) {
    if (page.isClosed()) continue;
    const detail = await page.evaluate(() => ({
      shareStatus: document.querySelector('#shareStatus')?.textContent,
      mirror: document.querySelector('#mirrorStatus')?.dataset.mirrorStatus,
      writer: typeof canWrite === 'function' ? canWrite() : null,
      camera: typeof camera === 'object' ? camera : null,
      canvas: (() => {
        const element = document.querySelector('#canvas');
        if (!element?.width || !element?.height) return null;
        const rect = element.getBoundingClientRect(), pixels = element.getContext('2d').getImageData(0, 0, element.width, element.height).data;
        let count = 0, minX = element.width, minY = element.height, maxX = -1, maxY = -1;
        for (let i = 3; i < pixels.length; i += 4) if (pixels[i] !== 255) {
          const x = ((i - 3) / 4) % element.width, y = Math.floor(((i - 3) / 4) / element.width);
          count++; minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        }
        return { width: element.width, height: element.height, cssWidth: rect.width, cssHeight: rect.height, dpr: devicePixelRatio, transparent: count, bounds: count ? { minX, minY, maxX, maxY } : null };
      })(),
      page: typeof state === 'object' ? state.current : null,
      strokes: typeof state === 'object' ? state.pages.map(page => page.strokes.map(stroke => ({ id: stroke.objectId, kind: stroke.kind, tool: stroke.tool, author: stroke.authorRole, points: stroke.points?.length }))) : null,
      events: window.__writingEvents, outgoing: window.__writingOutgoing, pointers: window.__writingPointerEvents?.slice(-8)
    })).catch(() => null);
    console.error('DIAGNOSTIC ' + tag + ' ' + JSON.stringify(detail));
    if (ARTIFACTS) await page.screenshot({ path: join(ARTIFACTS, 'failure-' + tag + '.png'), timeout: 3000 }).catch(() => {});
  }
}
(async () => {
  if (ARTIFACTS) mkdirSync(ARTIFACTS, { recursive: true });
  const server = staticServer();
  let browser, child, watchdog, serverErrors = '';
  try {
    await Promise.race([
      (async () => {
        await new Promise((resolveListen, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolveListen); });
        const siteOrigin = 'http://127.0.0.1:' + server.address().port, boardPort = await freePort(), boardOrigin = 'http://127.0.0.1:' + boardPort;
        const env = { ...process.env, HOST: '127.0.0.1', PORT: String(boardPort), NODE_ENV: 'test', CORS_ALLOWED_ORIGINS: siteOrigin };
        for (const key of Object.keys(env)) if (/^(LEARNING_|PROGRESS_|GROUP_LESSON_|TRAINER_REGISTRY_PATH$)/.test(key)) delete env[key];
        child = spawn(process.execPath, ['index.js'], { cwd: join(ROOT, 'board-server'), env, stdio: ['ignore', 'ignore', 'pipe'] });
        child.stderr.on('data', chunk => { serverErrors = (serverErrors + String(chunk)).slice(-4000); });
        await waitForHealth(boardOrigin, child, () => serverErrors);
        browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || process.env.BROWSER_EXECUTABLE_PATH, headless: true, args: ['--no-sandbox'], timeout: 15000 });
        await localWriting(browser, siteOrigin, boardOrigin); await sharedWriting(browser, siteOrigin, boardOrigin);
        assert.deepEqual(failures, [], 'no browser errors, failed local assets or external requests');
        console.log('BOARD_WRITING_BROWSER_OK: opaque eraser and PNG; screenshot import/layers/synchronization; compatible shapes; split/zoom/pan/fit; trusted pen and secondary touch; real local teacher/student; acknowledged own undo/redo across sheets; mid-gesture revoke; byte-identical reload and late join; notRun=' + JSON.stringify(notRun));
      })(),
      new Promise((_, reject) => { watchdog = setTimeout(() => reject(new Error('Writing gate exceeded 180 seconds at ' + phase)), 180000); })
    ]);
  } catch (error) { await diagnostics(); throw error; }
  finally {
    clearTimeout(watchdog); await browser?.close();
    if (child && child.exitCode === null) child.kill('SIGTERM');
    if (server.listening) await new Promise(resolveClose => server.close(resolveClose));
  }
})().catch(error => { console.error('BOARD_WRITING_BROWSER_FAILED at ' + phase + '\n' + (error.stack || error)); process.exitCode = 1; });
