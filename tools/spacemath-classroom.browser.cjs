'use strict';

// Invoked by the real shared-board suite. Every edit uses a visible control;
// evaluation reads the resulting canonical model without injecting fixtures.
// Explicit forged layout events below exercise the frame ownership boundary.
const assert = require('node:assert/strict');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function poll(check, label) {
  const deadline = Date.now() + 20000;
  let last;
  while (Date.now() < deadline) {
    try { if (await check()) return; } catch (error) { last = error; }
    await delay(150);
  }
  throw Error(label + ' timed out' + (last ? ': ' + last.message : ''));
}
const state = frame => frame.evaluate(() => window.SpaceMathApp.getState());
const values = frame => frame.evaluate(() => window.SpaceMathModel.evaluate(window.SpaceMathApp.getState()));
const select = (frame, id) => frame.locator('#object-list [data-object="' + id + '"]').click();
const submit = frame => frame.locator('#edit-object-form button[type="submit"]').click();
const near = (actual, expected, label) => assert.ok(Math.abs(actual - expected) <= 1e-10 * Math.max(1, Math.abs(expected)), label + ': ' + actual + ' ≈ ' + expected);
async function objectsPanel(frame) {
  if (!await frame.locator('#object-list').isVisible()) await frame.locator('#workspace-objects-toggle').click();
}
async function tool(frame, type) {
  const button = frame.locator('[data-tool="' + type + '"]');
  if (!await button.isVisible()) {
    const toggle = frame.locator('#workspace-tools-toggle');
    if (await toggle.isVisible() && await toggle.getAttribute('aria-expanded') === 'false') await toggle.click();
    const group = frame.locator('.tool-group:has([data-tool="' + type + '"]) > summary');
    if (!await button.isVisible() && await group.count()) await group.click();
  }
  await button.click();
}
async function point(frame, x, y) {
  await objectsPanel(frame);
  const old = new Set((await state(frame)).objects.map(item => item.id));
  await frame.locator('#point-x').fill(String(x)); await frame.locator('#point-y').fill(String(y));
  await frame.locator('#add-point-form button[type="submit"]').click();
  return (await state(frame)).objects.find(item => item.type === 'point' && !old.has(item.id)).id;
}
async function construct(frame, type, parents, parameter) {
  const before = await state(frame), old = new Set(before.objects.map(item => item.id));
  await tool(frame, type);
  if (parameter !== undefined) await frame.locator('#tool-parameter').fill(String(parameter));
  await objectsPanel(frame);
  for (const id of parents) await select(frame, id);
  const after = await state(frame), added = after.objects.filter(item => !old.has(item.id));
  assert.ok(added.length, type + ' creates a complete construction through UI');
  await tool(frame, 'move');
  return { before, after, added };
}
async function parameter(frame, id, value) {
  await objectsPanel(frame); await select(frame, id);
  await frame.locator('#edit-parameter').fill(String(value)); await submit(frame);
}
async function sync(editor, observer) {
  const expected = JSON.stringify(await state(editor));
  await poll(async () => JSON.stringify(await state(observer)) === expected, 'classroom construction synchronized');
}

async function prepare(editor, observer) {
  const a = await point(editor, 0, 0), b = await point(editor, 2, 0);
  const fixed = await construct(editor, 'fixedLength', [a, b], 3);
  const fixedPoint = fixed.added.find(item => item.type === 'fixedDistance').id;
  near((await values(editor))[fixedPoint].x, 3, 'fixed length endpoint');
  const angle = await construct(editor, 'fixedAngle', [b, a], 90);
  const anglePoint = angle.added.find(item => item.type === 'rotate').id;
  near((await values(editor))[anglePoint].x, 0, 'given angle x');
  near((await values(editor))[anglePoint].y, 2, 'given angle y');
  const regular = await construct(editor, 'regularPolygon', [a, b], 4);
  const square = regular.added.find(item => item.type === 'polygon').id;
  const squareDefinition = regular.added.find(item => item.id === square);
  assert.equal(squareDefinition.parents.length, 4);
  assert.equal(regular.added.filter(item => item.type === 'regularVertex').length, 2);
  let computed = await values(editor);
  for (const [i, expected] of [[0, [0, 0]], [1, [2, 0]], [2, [2, 2]], [3, [0, 2]]]) {
    near(computed[square].vertices[i][0], expected[0], 'square x');
    near(computed[square].vertices[i][1], expected[1], 'square y');
  }
  await editor.locator('#undo').click();
  assert.deepEqual((await state(editor)).objects, regular.before.objects, 'one undo removes the complete regular polygon batch');
  await editor.locator('#redo').click();
  assert.deepEqual((await state(editor)).objects, regular.after.objects, 'one redo restores all original batch IDs');

  const rotated = await construct(editor, 'rotate', [square, a], 90);
  const rotation = rotated.added.find(item => item.type === 'transformation').id;
  const rotatedPolygon = rotated.added.find(item => item.type === 'polygon').id;
  const imagePoints = rotated.added.filter(item => item.type === 'transformedPoint');
  assert.equal(imagePoints.length, 4);
  assert.ok(imagePoints.every(item => item.parents[1] === rotation), 'all image vertices use one canonical transformation');
  await sync(editor, observer);
  await objectsPanel(observer); await select(observer, rotation);
  assert.equal(await observer.locator('#edit-parameter').isDisabled(), true, 'observer cannot alter the shared angle');
  await parameter(editor, rotation, 180); await sync(editor, observer);
  assert.equal(await observer.locator('#selected-panel').isVisible(), true, 'observer retains the inspected transformation');
  computed = await values(observer);
  near(computed[rotatedPolygon].vertices[2][0], -2, 'shared angle moves every vertex x');
  near(computed[rotatedPolygon].vertices[2][1], -2, 'shared angle moves every vertex y');

  const circleBatch = await construct(editor, 'circleRadius', [b], 2);
  const circle = circleBatch.added.find(item => item.type === 'circleRadius').id;
  const dilated = await construct(editor, 'dilate', [circle, a], -2);
  const dilation = dilated.added.find(item => item.type === 'transformation').id;
  const imageCircle = dilated.added.find(item => item.type === 'transformedCircle').id;
  computed = await values(editor);
  near(computed[imageCircle].c[0], -4, 'negative dilation transforms circle center');
  near(computed[imageCircle].r, 4, 'negative dilation uses absolute radius factor');
  await parameter(editor, circle, 3);
  near((await values(editor))[imageCircle].r, 6, 'transformed radius remains dependent on source circle');
  await parameter(editor, dilation, 0);
  assert.equal((await values(editor))[imageCircle].defined, false, 'zero dilation retains an undefined circle rather than inventing radius');
  await parameter(editor, dilation, 2);
  assert.equal((await values(editor))[imageCircle].defined, true, 'same circle ID recovers after nonzero factor');

  await select(editor, b); await editor.locator('#edit-x').fill('3'); await submit(editor);
  computed = await values(editor);
  near(computed[square].vertices[2][0], 3, 'moving the original side changes regular polygon');
  near(computed[square].vertices[2][1], 3, 'regular polygon retains equal sides');
  near(computed[rotatedPolygon].vertices[2][0], -3, 'transformed polygon follows original vertices');
  near(computed[anglePoint].y, 3, 'given-angle ray follows first-side point');
  near(computed[fixedPoint].x, 3, 'given length remains three after direction-point motion');
  near(computed[imageCircle].c[0], 6, 'circle center stays dependent');

  await select(editor, a);
  await editor.locator('#appearance-visible').uncheck(); await submit(editor);
  assert.equal((await state(editor)).objects.find(item => item.id === a).appearance.visible, false);
  assert.equal((await values(editor))[square].defined, true, 'hidden auxiliary point remains in the dependency graph');
  await select(editor, square);
  await editor.locator('#appearance-color').fill('#bf3f5f');
  await editor.locator('#appearance-width').fill('4');
  await editor.locator('#appearance-dash').selectOption('2');
  await editor.locator('#appearance-fill').fill('0.3');
  await editor.locator('#appearance-label').check();
  await submit(editor); await sync(editor, observer);
  await poll(async () => await editor.locator('#geometry-board svg [stroke="#bf3f5f"]').count() > 0, 'saved polygon color is actually rendered');
  await poll(async () => await observer.locator('#geometry-board svg [stroke="#bf3f5f"]').count() > 0, 'observer renders the same polygon color');
  await select(observer, square);
  for (const id of ['appearance-visible', 'appearance-label', 'appearance-color', 'appearance-width', 'appearance-dash', 'appearance-fill']) {
    assert.equal(await observer.locator('#' + id).isDisabled(), true, 'observer appearance field locked: ' + id);
  }
  for (const name of ['fixedLength', 'fixedAngle', 'regularPolygon']) assert.equal(await observer.locator('[data-tool="' + name + '"]').isDisabled(), true);
  const final = await state(editor), calculated = await values(editor);
  const ids = [a, b, fixedPoint, anglePoint, square, rotation, rotatedPolygon, circle, dilation, imageCircle];
  const result = { ids, square, a, rotation, definitions: Object.fromEntries(ids.map(id => [id, final.objects.find(item => item.id === id)])), values: Object.fromEntries(ids.map(id => [id, calculated[id]])) };
  await assertRestored(editor, result); await assertRestored(observer, result);
  console.log('PASS classroom tools: lengths, angles, regular polygon, atomic undo, shared whole-figure transformations, dependent circles and appearance');
  return result;
}

async function assertRestored(frame, expected) {
  const current = await state(frame), computed = await values(frame);
  for (const id of expected.ids) {
    assert.deepEqual(current.objects.find(item => item.id === id), expected.definitions[id], 'classroom definition restored: ' + id);
    assert.deepEqual(computed[id], expected.values[id], 'classroom geometry restored: ' + id);
  }
  const hiddenLabel = expected.definitions[expected.a].label;
  assert.equal(await frame.locator('#geometry-board svg text').filter({ hasText: new RegExp('^' + hiddenLabel + '$') }).isVisible(), false, 'hidden source label is not drawn');
}

async function localLayout(page, frame, canonicalWorkspace, readWorkspace) {
  const before = await state(frame);
  await page.setViewportSize({ width: 320, height: 900 });
  await poll(async () => await frame.locator('html').getAttribute('data-workspace-compact') === 'true', 'compact workspace');
  const objects = frame.locator('#workspace-objects-toggle');
  if (await objects.getAttribute('aria-expanded') === 'true') await objects.click();
  const tools = frame.locator('#workspace-tools-toggle');
  if (await tools.getAttribute('aria-expanded') === 'true') await tools.click();
  await frame.locator('.app-header').scrollIntoViewIfNeeded();
  const extent = await frame.evaluate(() => {
    const box = document.getElementById('geometry-board').getBoundingClientRect();
    return { width: box.width, visibleHeight: Math.max(0, Math.min(box.bottom, innerHeight) - Math.max(box.top, 0)), overflow: document.documentElement.scrollWidth - innerWidth };
  });
  assert.ok(extent.width >= 240 && extent.visibleHeight >= 260, 'substantial drawing region appears on the first compact iframe screen');
  assert.ok(extent.overflow <= 1, 'compact workspace has no horizontal page overflow');
  await tools.click();
  assert.equal(await tools.getAttribute('aria-expanded'), 'true');
  await tools.click();
  await objects.click();
  assert.equal(await frame.locator('#object-list').isVisible(), true, 'compact object panel opens');
  await objects.click();
  const focus = frame.locator('#workspace-focus-toggle');
  await focus.click();
  assert.equal(await focus.getAttribute('aria-pressed'), 'true');
  assert.match(await focus.textContent(), /Выйти/);
  await poll(async () => await page.locator('body').getAttribute('data-geometry-focus') === 'true', 'host geometry focus');
  const host = await page.locator('#geometryPanel').boundingBox();
  assert.ok(host && host.x >= -1 && host.x <= 1 && host.width >= 319 && host.width <= 321 && host.y >= 0 && host.y <= 40 && host.y + host.height >= 899,
    'expanded geometry covers the host viewport below its connection status, including teacher chrome');
  const focused = await frame.locator('#geometry-board').boundingBox();
  const visibleHeight = focused && Math.max(0, Math.min(focused.y + focused.height, 900) - Math.max(focused.y, 0));
  assert.ok(focused && focused.x >= 0 && focused.x + focused.width <= 321 && focused.width >= 240 && visibleHeight >= 500,
    'focus exposes at least 500 pixels of drawable height on the actual 320×900 host screen');
  await focus.press('Escape');
  assert.equal(await focus.getAttribute('aria-pressed'), 'false', 'Escape leaves focus even for an observer');
  await poll(async () => await page.locator('body').getAttribute('data-geometry-focus') === 'false', 'host focus exits with iframe focus');
  assert.notEqual(await page.locator('#geometryPanel').evaluate(element => getComputedStyle(element).position), 'fixed', 'exit restores normal host panel layout');

  // Synthetic protocol faults: the owner listens on the current iframe window,
  // never the host window or a bubbling child document event. No model changes.
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('mathexam:spacemath-layout', { detail: { focused: true } })));
  await frame.evaluate(() => document.dispatchEvent(new CustomEvent('mathexam:spacemath-layout', { bubbles: true, detail: { focused: true } })));
  assert.equal(await page.locator('body').getAttribute('data-geometry-focus'), 'false', 'forged host and child-document layout events cannot expand the owned frame');
  assert.equal(await focus.getAttribute('aria-pressed'), 'false', 'forged layout events do not enter child focus');
  assert.deepEqual(await state(frame), before, 'local panel/focus controls preserve model and canonical viewport');
  await delay(1500);
  assert.deepEqual(await readWorkspace(), canonicalWorkspace, 'local layout creates no journal writes');
  await page.setViewportSize({ width: 1280, height: 900 });
  await poll(async () => await frame.locator('html').getAttribute('data-workspace-compact') === 'false', 'desktop workspace restored');
  console.log('PASS local compact/focus controls: host-sized 320/1280 layout, observer navigation, ownership fences and no journal events');
}

module.exports = { prepare, assertRestored, localLayout };
