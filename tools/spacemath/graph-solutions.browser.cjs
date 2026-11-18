'use strict';
// Called by the real three-context unified-board browser suite. No state is
// injected: constructions and edits use the visible editor controls.
const assert = require('node:assert/strict');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function poll(check, label) {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) { if (await check()) return; await delay(150); }
  throw Error(label + ' timed out');
}
const state = frame => frame.evaluate(() => window.SpaceMathApp.getState());
const values = frame => frame.evaluate(() => window.SpaceMathModel.evaluate(window.SpaceMathApp.getState()));
const select = (frame, id) => frame.locator(`[data-object="${id}"]`).click();
async function tool(frame, type) {
  const button = frame.locator(`[data-tool="${type}"]`);
  if (!await button.isVisible()) await frame.locator(`.tool-group:has([data-tool="${type}"]) > summary`).click();
  await button.click();
}
async function addGraph(frame, expression) {
  await frame.locator('#function-expression').fill(expression);
  await frame.locator('#add-function-form button').click();
  return (await state(frame)).objects.filter(o => o.type === 'functionGraph').at(-1).id;
}
async function prepare(frame) {
  const f = await addGraph(frame, 'x^2+c'), g = await addGraph(frame, '1');
  await tool(frame, 'functionRoot'); await select(frame, f);
  await tool(frame, 'functionIntersection'); await select(frame, f); await select(frame, g);
  const current = await state(frame);
  const roots = current.objects.filter(o => o.type === 'functionRoot').map(o => o.id);
  const intersections = current.objects.filter(o => o.type === 'functionIntersection').map(o => o.id);
  assert.equal(roots.length, 2); assert.equal(intersections.length, 2);
  await tool(frame, 'midpoint'); await select(frame, roots[0]); await select(frame, roots[1]);
  const midpoint = (await state(frame)).objects.filter(o => o.type === 'midpoint').at(-1).id;
  await tool(frame, 'move');
  return { f, g, roots, intersections, midpoint, parameter: current.objects.find(o => o.type === 'slider' && o.name === 'c').id };
}
async function exercise(editor, observer, ids) {
  const { parameter, roots, intersections, midpoint } = ids;
  for (const type of ['functionRoot', 'functionIntersection']) assert.equal(await observer.locator(`[data-tool="${type}"]`).isDisabled(), true);
  await select(observer, roots[0]);
  for (const [value, count, tangent] of [[0, 1, true], [1, 0, false], [-1, 2, false], [-4, 2, false]]) {
    await select(editor, parameter);
    await editor.locator('#edit-slider-value').fill(String(value));
    await editor.locator('#edit-object-form button[type="submit"]').click();
    await poll(async () => (await state(observer)).objects.find(o => o.id === parameter).value === value, 'parameter synchronized');
    const local = await values(editor), remote = await values(observer);
    for (const id of [...roots, ...intersections, midpoint]) assert.deepEqual(remote[id], local[id], 'both windows evaluate the same point');
    assert.equal(roots.filter(id => remote[id].defined).length, count);
    assert.equal(remote[midpoint].defined, count === 2);
    if (tangent) assert.equal(remote[roots[0]].relation, 'tangent');
    assert.equal(await observer.locator('#selected-panel').isVisible(), true, 'observer keeps the inspected root open');
    if (!count) assert.match(await observer.locator('#selected-description').textContent(), /решений нет/);
  }
  await assertRestored(editor, ids); await assertRestored(observer, ids);
  // Formula edits recover the same IDs after unsupported/domain-limited input.
  await select(editor, ids.f);
  await editor.locator('#edit-expression').fill('1/x');
  await editor.locator('#edit-object-form button[type="submit"]').click();
  await poll(async () => (await values(observer))[roots[0]].solutionStatus === 'unsupported', 'domain restriction synchronized');
  await editor.locator('#edit-expression').fill('x^2+c');
  await editor.locator('#edit-object-form button[type="submit"]').click();
  await poll(async () => (await values(observer))[roots[0]].x === -2, 'same branch recovers after formula edit');
  console.log('PASS roots/intersections: UI creation, no/one/two points, parameter and formula edits, dependent midpoint, observer lock');
}
async function assertRestored(frame, ids) {
  const current = await state(frame), computed = await values(frame);
  assert.deepEqual(ids.roots.map(id => [computed[id].x, computed[id].y]), [[-2, 0], [2, 0]]);
  assert.equal(computed[ids.midpoint].x, 0);
  for (const [index, id] of ids.intersections.entries()) {
    assert.ok(Math.abs(computed[id].x - (index ? 1 : -1) * Math.sqrt(5)) < 1e-12);
    assert.ok(Math.abs(computed[id].y - 1) < 1e-12);
  }
  for (const id of [...ids.roots, ...ids.intersections]) {
    const definition = current.objects.find(o => o.id === id);
    assert.equal(Object.hasOwn(definition, 'x'), false, 'journal holds dependencies, never cached coordinates');
    await frame.locator('#geometry-board svg text').filter({ hasText: new RegExp('^' + definition.label + '$') }).waitFor({ state: 'visible' });
  }
}
module.exports = { prepare, exercise, assertRestored };
