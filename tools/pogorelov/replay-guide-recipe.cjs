'use strict';

const assert = require('node:assert/strict');

async function perform(board, action) {
  switch (action.type) {
    case 'tool':
      await board.locator('[data-tool="' + action.tool + '"]').click();
      return;
    case 'point':
      await board.locator('.point-select').selectOption(action.id);
      await board.locator('[data-act="select"]').click();
      return;
    case 'drag':
    case 'coords':
      await board.locator('.point-select').selectOption(action.id);
      await board.locator('.point-x').fill(String(action.to[0]));
      await board.locator('.point-y').fill(String(action.to[1]));
      await board.locator('[data-act="move"]').click();
      return;
    case 'goal':
      await board.locator('[data-act="goal"]').click();
      return;
    default:
      throw Error('Unsupported guide action: ' + action.type);
  }
}

async function checkCoordinates(page, checks) {
  if (!checks.length) return;
  // Use the pupil's persisted construction. Coordinates in the accessible input
  // fields are rounded; an apparent overlap on screen is insufficient.
  await page.waitForFunction(expected => {
    const {id} = window.COURSE_CONFIG.unit;
    const unit = JSON.parse(localStorage.getItem(GeoStore.KEY)).units[id];
    const points = new Map((unit.drawing?.points || []).map(p => [p.id, p]));
    const close = (a, b) => a && b && a.valid !== false && b.valid !== false &&
      Math.hypot(a.x - b.x, a.y - b.y) < 0.01;
    return expected.every(check => check.type === 'point'
      ? close(points.get(check.id), {x: check.at[0], y: check.at[1]})
      : check.pairs.every(([a, b]) => close(points.get(a), points.get(b))));
  }, checks);
}

module.exports = async function replayGuideRecipe(page, recipe, definition) {
  const board = page.locator('#geo-board');
  await board.locator('[data-act="reset"]').click();
  assert.deepEqual(recipe.steps.map(s => s.caption), definition.steps, recipe.id);
  assert.equal(recipe.steps.length, definition.readouts.length, recipe.id);
  for (const [index, step] of recipe.steps.entries()) {
    for (const action of step.actions) await perform(board, action);
    const readout = await board.locator('.lab-readout').innerText();
    const frame = recipe.id + ', step ' + (index + 1);
    assert.equal(readout, definition.readouts[index], frame);
    const coordinates = [];
    for (const check of step.checks || []) {
      if (check.type === 'readout') {
        for (const text of check.includes) assert.ok(readout.includes(text), frame + ': ' + text);
      } else {
        assert.ok(['coincident', 'point'].includes(check.type), 'Unsupported guide check: ' + check.type);
        coordinates.push(check);
      }
    }
    await checkCoordinates(page, coordinates);
  }
};
