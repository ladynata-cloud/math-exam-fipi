'use strict';

const assert = require('node:assert/strict');

const title = 'Углы и треугольники · контрольная по геометрии 7 класса';
const file = 'geometry-7/control-work.html';
const key = 'geometry7-control-written-v1:2-5';
const privateNote = 'Личный черновик вне комнаты';

async function verifyControlWork({ teacher, student, studentContext, connected, frameFor, handoff }) {
  for (const page of [teacher, student]) {
    await page.evaluate(({ key, privateNote }) => localStorage.setItem(key, JSON.stringify({ solution: privateNote })), { key, privateNote });
  }
  await teacher.locator('#chooseTrainer').click();
  await teacher.locator('#pickerSearch').fill('Углы и треугольники');
  const entry = teacher.locator('#pickerResults button').filter({ hasText: title });
  await entry.locator('[data-mirror-capability="supported"]').waitFor();
  await entry.click();
  await Promise.all([connected(teacher), connected(student)]);
  const t = await frameFor(teacher, file);
  let s = await frameFor(student, file);

  const question = (frame, index) => frame.locator(`.steps [data-written-question="${index}"]`).click();
  const variant = (frame, index) => frame.locator(`[data-written-variant="${index}"]`).click();
  const point = async (page, frame, x, y) => {
    const svg = frame.locator('.drawing-surface');
    await svg.scrollIntoViewIfNeeded();
    const box = await svg.boundingBox();
    await page.mouse.click(box.x + 1 + (box.width - 2) * x / 640, box.y + 1 + (box.height - 2) * y / 420);
  };
  const valueIs = (frame, [selector, value]) => frame.waitForFunction(
    ([selector, value]) => document.querySelector(selector)?.value === value, [selector, value]
  );
  const proofOpen = frame => frame.waitForFunction(() =>
    !document.querySelector('#written-work').hidden && document.querySelector('[data-written-variant="1"]').getAttribute('aria-pressed') === 'true' &&
    document.querySelector('.steps [data-written-question="4"]').getAttribute('aria-current') === 'true'
  );

  await variant(t, 1);
  await question(t, 4);
  await proofOpen(s);
  assert.equal(await s.locator('#written-solution').inputValue(), '');
  await t.locator('#written-given').fill('AO = OB. Сравнение a<b>c.');
  await t.locator('#written-goal').fill('△AOC = △BOD.');
  await valueIs(s, ['#written-given', 'AO = OB. Сравнение a<b>c.']);
  await valueIs(s, ['#written-goal', '△AOC = △BOD.']);

  for (const [name, x, y] of [['A', 135, 250], ['B', 480, 170]]) {
    await t.locator('#drawing-text').fill(name);
    await point(teacher, t, x, y);
  }
  await t.locator('[data-tool="segment"]').click();
  await point(teacher, t, 135, 250);
  await point(teacher, t, 480, 170);
  await s.locator('.drawing-surface .drawing-line').waitFor();
  assert.equal(await s.locator('.drawing-surface .drawing-point').count(), 2);
  await t.locator('[data-tool="point"]').click();
  for (const [name, x, y] of [['C', 185, 110], ['D', 443, 305]]) {
    await t.locator('#drawing-text').fill(name);
    await point(teacher, t, x, y);
  }
  await t.locator('[data-tool="segment"]').click();
  await point(teacher, t, 185, 110);
  await point(teacher, t, 443, 305);
  await t.locator('[data-written-panel="tools"] summary').click();
  await t.locator('[data-tool="intersection"]').click();
  await point(teacher, t, 187, 238);
  await point(teacher, t, 227, 142);
  await s.waitForFunction(() => document.querySelectorAll('.drawing-surface .drawing-point').length === 5);
  assert.equal(await s.locator('.drawing-surface .drawing-annotation').last().textContent(), 'O');
  await t.locator('[data-tool="tick"]').click();
  await point(teacher, t, 135, 250);
  const center = await t.locator('.drawing-surface .drawing-point').last().evaluate(circle => [+circle.getAttribute('cx'), +circle.getAttribute('cy')]);
  await point(teacher, t, ...center);
  await s.locator('.drawing-surface .drawing-mark').waitFor();

  const clip = '[data-written-panel="draw-demo"]';
  await t.locator(clip + ' summary').click();
  await t.locator(clip + ' [data-demo-toggle]').click();
  await s.waitForFunction(() => {
    const clip = document.querySelector('[data-written-panel="draw-demo"]');
    const image = clip?.querySelector('img');
    return clip?.open && image?.src.endsWith('/2-5.gif') && image.complete && image.naturalWidth === 640;
  });
  await t.locator(clip + ' [data-demo-toggle]').click();
  await s.waitForFunction(() => document.querySelector('[data-written-panel="draw-demo"] img')?.src.endsWith('/2-5.webp'));

  const toolGroup = '[data-written-panel="tool-demos"]';
  const tickDemo = '[data-demo="tool-tick"]';
  await t.locator(toolGroup + ' > summary').click();
  await t.locator(tickDemo + ' summary').click();
  await t.locator(tickDemo + ' [data-demo-toggle]').click();
  await s.waitForFunction(demo => document.querySelector(demo + ' img')?.src.endsWith('/tool-tick.gif'), tickDemo);
  await s.locator(tickDemo + ' img').scrollIntoViewIfNeeded();
  await s.waitForFunction(([group, demo]) => {
    const image = document.querySelector(demo + ' img');
    return document.querySelector(group)?.open && image?.src.endsWith('/tool-tick.gif') && image.naturalWidth === 640;
  }, [toolGroup, tickDemo]);
  await t.locator(toolGroup + ' > summary').click();
  await s.waitForFunction(([group, demo]) => {
    const list = document.querySelector(group);
    const clip = document.querySelector(demo);
    return list && clip && !list.open && !clip.open && !clip.querySelector('img').hasAttribute('src');
  }, [toolGroup, tickDemo]);

  await handoff(teacher, student, true);
  await student.waitForFunction(() => !document.querySelector('#trainerFrame').inert);
  await s.locator('#written-solution').fill('∠AOC = ∠BOD как вертикальные.');
  await valueIs(t, ['#written-solution', '∠AOC = ∠BOD как вертикальные.']);
  await s.getByRole('button', { name: 'Очистить чертёж', exact: true }).click();
  await t.waitForFunction(() => document.querySelectorAll('.drawing-surface .drawing-point').length === 0);
  await s.getByRole('button', { name: '↶ Отменить', exact: true }).click();
  await t.locator('.drawing-surface .drawing-line').first().waitFor();
  assert.equal(await t.locator('.drawing-surface .drawing-line').count(), 2);

  await variant(s, 0);
  await question(s, 1);
  await s.locator('#written-solution').fill('Рассмотрим вертикальную пару.');
  await valueIs(t, ['#written-solution', 'Рассмотрим вертикальную пару.']);
  await variant(s, 1);
  await proofOpen(t);
  await valueIs(t, ['#written-solution', '∠AOC = ∠BOD как вертикальные.']);

  await s.locator('#train-mode').click();
  await t.locator('#practice-0').waitFor();
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await s.locator('#practice-0').fill('100');
    await s.locator('#practice-form button[type=submit]').click();
  }
  await t.getByRole('heading', { name: 'Подсказка', exact: true }).waitFor();
  await s.locator('#practice-0').fill('112');
  await s.locator('#practice-form button[type=submit]').click();
  await t.waitForFunction(() => document.querySelector('#total-text')?.textContent === 'Решено 1 из 30');
  await s.locator('#check-mode').click();
  await s.locator('#start-check').click();
  await s.locator('#check-0-0').fill('133');
  await valueIs(t, ['#check-0-0', '133']);

  await handoff(teacher, student, false);
  await teacher.waitForFunction(() => !document.querySelector('#trainerFrame').inert);
  await t.locator('#written-mode').click();
  await student.reload();
  await connected(student);
  s = await frameFor(student, file);
  await proofOpen(s);
  await valueIs(s, ['#written-solution', '∠AOC = ∠BOD как вертикальные.']);
  await s.locator('.drawing-surface .drawing-line').first().waitFor();
  assert.equal(await s.locator('.drawing-surface .drawing-point').count(), 5);

  await studentContext.setOffline(true);
  await student.evaluate(() => shared.socket.io.engine.close());
  await student.waitForFunction(() => !shared.connected);
  await t.locator('#written-solution').fill('Далее применим сумму углов треугольника.');
  await studentContext.setOffline(false);
  await connected(student);
  s = await frameFor(student, file);
  await valueIs(s, ['#written-solution', 'Далее применим сумму углов треугольника.']);
  assert.equal(await student.locator('#trainerFrame').evaluate(frame => frame.inert), true);

  for (const page of [teacher, student]) {
    const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key))?.solution, key);
    assert.equal(saved, privateNote);
  }
  console.log('GEOMETRY7_CONTROL_ROOM_PASS · teacher, pupil, drawing, drafts, GIF, both earlier modes, reload and reconnect');
}

module.exports = { verifyControlWork };
