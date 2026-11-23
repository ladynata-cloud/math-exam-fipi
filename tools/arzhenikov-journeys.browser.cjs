'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {execFileSync} = require('node:child_process');
const {pathToFileURL} = require('node:url');
const root = path.resolve(__dirname, '..');
const pagePath = 'trainers/oge-basics/multiplication-division/arzhenikov-map.html';
const trainer = process.env.ARZHENIKOV_TRAINER_URL || pathToFileURL(path.join(root, pagePath)).href;
const artifacts = path.resolve(process.env.ARZHENIKOV_ARTIFACT_DIR || 'artifacts/arzhenikov-adventure');
const key = 'mathexam.arzhenikov.discoveries.v1';
const previousKeys = ['mathexam.arzhenikov.workshop.v1', 'mathexam.arzhenikov.garden.v1',
  'mathexam.arzhenikov.division.v1', 'mathexam.arzhenikov.harbor.v1', 'mathexam.journeys-test.sentinel'];

// Fixed observations derived from each story, not answers imported from its bank.
// Empty trailing groups are omitted; the actual controls determine the padding.
const cases = [
  ['meanings-1', 'each', 'receivers', 12, [], [4, 4, 4], {answer: 4}],
  ['meanings-2', 'groups', 'size', 12, [], [3, 3, 3, 3], {answer: 4}],
  ['meanings-3', 'each', 'receivers', 10, [], [5, 5], {answer: 5}],
  ['meanings-4', 'groups', 'size', 15, [], [5, 5, 5], {answer: 3}],
  ['change-1', 'less', 'stock', 12, [4, 4, 4], [3, 3, 3, 3], {each: 3, total: 12}],
  ['change-2', 'stock', 'each', 16, [4, 4, 4], [4, 4, 4, 4], {added: 4, total: 16}],
  ['change-3', 'less', 'stock', 12, [6, 6], [4, 4, 4], {each: 4, total: 12}],
  ['change-4', 'stock', 'each', 12, [3, 3, 3], [3, 3, 3, 3], {added: 3, total: 12}],
  ['adjust-1', 'rest', 'filled', 20, [], [5, 5, 5, 5], {changed: 3, groups: 4}],
  ['adjust-2', 'rest', 'removed', 15, [], [5, 5, 5], {changed: 2, groups: 3}],
  ['adjust-3', 'rest', 'filled', 16, [], [4, 4, 4, 4], {changed: 3, groups: 4}],
  ['adjust-4', 'rest', 'none', 12, [], [3, 3, 3, 3], {changed: 0, groups: 4}],
  ['boundary-1', 'more-full', 'left', 12, [4, 4, 3], [4, 4, 4], {full: 3, boxes: 3, rest: 0}],
  ['boundary-2', 'more-boxes', 'left', 13, [4, 4, 4], [4, 4, 4, 1], {full: 3, boxes: 4, rest: 1}],
  ['boundary-3', 'partial', 'left', 2, [], [2], {full: 0, boxes: 1, rest: 2}],
  ['boundary-4', 'same-boxes', 'left', 7, [4, 4], [4, 3], {full: 1, boxes: 2, rest: 3}],
  ['reverse-1', 'groups-rest', 'rest', 14, [], [3, 3, 3, 3, 2], {packed: 12, total: 14}],
  ['reverse-2', 'size', 'rest', 13, [], [4, 4, 4, 1], {packed: 12, total: 13}],
  ['reverse-3', 'groups-rest', 'rest', 17, [], [5, 5, 5, 2], {packed: 15, total: 17}],
  ['reverse-4', 'rest', 'rest', 13, [], [3, 3, 3, 3, 1], {packed: 12, total: 13}],
  ['sequence-1', 'reserve', 'part', 18, [], [6, 4, 4, 4], {left: 12, each: 4}],
  ['sequence-2', 'whole', 'whole', 12, [3, 3, 3, 3], [3, 3, 3, 1, 2], {before: 12, left: 10}],
  ['sequence-3', 'reserve', 'part', 20, [], [5, 5, 5, 5], {left: 15, each: 5}],
  ['sequence-4', 'whole', 'whole', 12, [4, 4, 4], [4, 4, 1, 3], {before: 12, left: 9}]
].map(([id, prediction, reason, total, initial, wanted, values]) => ({id, prediction, reason, total, initial, wanted, values}));
const groups = ['city', 'harbor', 'garden', 'discoveries', 'division', 'written', 'fractions', 'decimals', 'connections', 'algebra', 'geometry'];
const pad = (values, length) => Array.from({length}, (_, index) => values[index] || 0);
const numericCount = value => Array.isArray(value) ? value.length : value;

async function solve(flow, task, probes = {}) {
  const at = name => assert.equal(flow.stage(), name, task.id + ': stage ' + name);
  at('predict');
  assert.equal(flow.equations(), 0, task.id + ': no equation before the investigation');
  assert.equal(flow.fields().length, 0, task.id + ': no numerical answer before action');
  if (probes.blank) {
    await flow.action('check-predict'); at('predict');
    assert(flow.feedback().trim(), 'An empty prediction gets usable feedback');
  }
  const predictions = flow.options('dc-predict');
  const prediction = probes.wrongPrediction ? predictions.find(value => value !== task.prediction) : task.prediction;
  assert(predictions.includes(prediction), task.id + ': meaningful prediction option');
  await flow.choose('dc-predict', prediction);
  await flow.action('check-predict'); at('action');
  assert.equal(flow.equations(), 0);
  assert.equal(flow.fields().length, 0);
  const initial = pad(task.initial, flow.piles().length);
  assert.deepEqual(flow.piles(), initial, task.id + ': original concrete situation');
  if (probes.incomplete) {
    await flow.action('check-action'); at('action');
    assert.deepEqual(flow.piles(), initial, task.id + ': incomplete action is preserved');
    assert(flow.feedback().trim(), 'An incomplete arrangement has a next-step hint');
  }
  if (probes.restoreMove) {
    const control = flow.firstMove(); assert(control, task.id + ': a first move exists');
    await flow.action(control.name, control.bin);
    const moved = flow.piles(); const total = flow.total();
    await flow.reload(); at('action');
    assert.deepEqual(flow.piles(), moved, task.id + ': one concrete move survives reload');
    assert.equal(flow.total(), total);
    await flow.action('undo');
    assert.deepEqual(flow.piles(), initial, task.id + ': saved move can be undone');
  }
  if (probes.hint) {
    await flow.action('hint');
    await flow.reload(); at('action');
    assert.equal(flow.equations(), 0, 'Help does not reveal the final equation');
  }
  const wanted = pad(task.wanted, flow.piles().length);
  let current = flow.piles();
  for (let index = 0; index < current.length; index++) {
    for (let n = current[index]; n > wanted[index]; n--) await flow.action('take', index);
  }
  // Reverse stories build their entire stock using the placement controls.
  if (!task.id.startsWith('reverse-')) {
    for (let n = flow.total(); n < task.total; n++) await flow.action('add');
    for (let n = flow.total(); n > task.total; n--) await flow.action('remove');
  }
  current = flow.piles();
  for (let index = 0; index < current.length; index++) {
    for (let n = current[index]; n < wanted[index]; n++) await flow.action('place', index);
  }
  assert.deepEqual(flow.piles(), wanted, task.id + ': complete model');
  assert.equal(flow.total(), task.total, task.id + ': conserved or deliberately changed total');
  await flow.action('check-action'); at('explain');
  assert.equal(flow.equations(), 0, task.id + ': symbolic solution follows the pupil explanation');
  assert.deepEqual(flow.fields().map(field => field.id), Object.keys(task.values));
  for (const [id, value] of Object.entries(task.values)) await flow.fill(id, value);
  await flow.choose('dc-reason', task.reason);
  if (probes.wrongAnswer) {
    const id = Object.keys(task.values).at(-1);
    await flow.fill(id, task.values[id] + 1);
    await flow.action('check-explain'); at('explain');
    const before = flow.fields();
    assert.equal(before.find(field => field.id === id).invalid, true);
    for (const field of before.filter(field => field.id !== id)) {
      assert.equal(field.invalid, false, 'A correct field is preserved');
      assert.equal(field.readOnly, true, 'Accepted work stays fixed while the wrong field is repaired');
    }
    assert(flow.feedback().trim());
    await flow.reload(); at('explain');
    assert.deepEqual(flow.fields(), before, task.id + ': accepted and wrong answers survive reload');
    assert.equal(flow.selected('dc-reason'), task.reason, 'The chosen explanation survives reload');
    await flow.fill(id, task.values[id]);
  }
  await flow.action('check-explain'); at('complete');
  assert(flow.progress().completed.includes(task.id), task.id + ': completion recorded');
  assert(flow.equations() > 0, task.id + ': final notation is now available');
}

function domMethods(getDocument, getWindow) {
  const host = () => getDocument().querySelector('#discoveries-play');
  return {
    stage: () => host()?.dataset.stage,
    equations: () => host().querySelectorAll('.dc-equation').length,
    fields: () => Array.from(host().querySelectorAll('[data-dc-field]'), field => ({id: field.dataset.dcField,
      value: field.value, invalid: field.getAttribute('aria-invalid') === 'true', readOnly: field.readOnly})),
    options: name => Array.from(host().querySelectorAll('input[name="' + name + '"]'), field => field.value),
    selected: name => host().querySelector('input[name="' + name + '"]:checked')?.value,
    piles: () => Array.from(host().querySelectorAll('.dc-target[data-amount]'), group => Number(group.dataset.amount)),
    total: () => host().dataset.total === 'hidden'
      ? Array.from(host().querySelectorAll('.dc-target[data-amount]')).reduce((sum, group) => sum + Number(group.dataset.amount), Number(host().dataset.stock))
      : Number(host().dataset.total),
    feedback: () => host().querySelector('.dc-feedback')?.textContent || '',
    firstMove: () => {
      const button = Array.from(host().querySelectorAll('[data-dc-action="place"],[data-dc-action="take"]')).find(node => !node.disabled);
      return button && {name: button.dataset.dcAction, bin: Number(button.dataset.bin)};
    },
    progress: () => JSON.parse(JSON.stringify(getWindow().ArzhenikovDiscoveriesProgress())),
    previous: () => Object.fromEntries(previousKeys.map(name => [name, getWindow().localStorage.getItem(name)]))
  };
}

// The same concrete interactions can run in JSDOM for local state verification.
// This mode never substitutes for browser rendering, keyboard or layout gates.
class DomFlow {
  constructor(file = path.join(root, pagePath)) { this.file = file; this.saved = {}; Object.assign(this, domMethods(() => this.doc, () => this.window)); }
  async goto(hash) {
    if (this.window) {
      this.saved = Object.fromEntries(Object.keys(this.window.localStorage).map(name => [name, this.window.localStorage.getItem(name)]));
      this.close();
    }
    const {JSDOM, VirtualConsole} = require('jsdom');
    const html = fs.readFileSync(this.file, 'utf8');
    this.errors = [];
    const virtualConsole = new VirtualConsole(); virtualConsole.on('jsdomError', error => this.errors.push(error.message));
    this.dom = new JSDOM(html, {url: 'https://mathexam.test/' + pagePath + hash, runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole});
    this.window = this.dom.window; this.doc = this.window.document;
    const w = this.window;
    w.matchMedia = query => ({matches: /prefers-reduced-motion/.test(query), addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}});
    w.HTMLCanvasElement.prototype.getContext = () => null;
    w.HTMLElement.prototype.scrollIntoView = () => {};
    for (const [name, value] of Object.entries(this.saved)) w.localStorage.setItem(name, value);
    for (const script of this.doc.querySelectorAll('script[src]')) {
      const src = script.getAttribute('src').split('?')[0];
      if (!src.startsWith('/')) w.eval(fs.readFileSync(path.join(path.dirname(this.file), src), 'utf8'));
    }
    await this.tick();
  }
  async tick() { await new Promise(resolve => setTimeout(resolve, 0)); assert.deepEqual(this.errors, []); }
  async reload() { await this.goto(this.window.location.hash); }
  async action(name, bin) {
    const selector = '#discoveries-play [data-dc-action="' + name + '"]' + (bin === undefined ? '' : '[data-bin="' + bin + '"]');
    const control = this.doc.querySelector(selector); assert(control, selector); assert(!control.disabled, selector + ' is usable');
    control.click(); await this.tick();
  }
  async choose(name, value) {
    const field = this.doc.querySelector('#discoveries-play input[name="' + name + '"][value="' + value + '"]');
    assert(field, name + ': ' + value); field.click(); await this.tick();
  }
  async fill(id, value) {
    const field = this.doc.querySelector('#discoveries-play [data-dc-field="' + id + '"]');
    assert(field && !field.readOnly, 'Editable ' + id); field.value = String(value);
    field.dispatchEvent(new this.window.Event('input', {bubbles: true})); await this.tick();
  }
  close() { if (this.window) { assert.deepEqual(this.errors, []); this.window.close(); } }
}

// Browser observations are refreshed after every real user operation. They are
// read-only snapshots: no script fills a model, awards a skill or edits a save.
class BrowserFlow {
  constructor(page, url = trainer) { this.page = page; this.url = url; this.snapshot = {}; }
  async sync() {
    this.snapshot = await this.page.evaluate(keys => {
      const host = document.querySelector('#discoveries-play');
      const fields = selector => Array.from(host?.querySelectorAll(selector) || []);
      const first = fields('[data-dc-action="place"],[data-dc-action="take"]').find(node => !node.disabled);
      return {stage: host?.dataset.stage, equations: fields('.dc-equation').length,
        fields: fields('[data-dc-field]').map(field => ({id: field.dataset.dcField, value: field.value,
          invalid: field.getAttribute('aria-invalid') === 'true', readOnly: field.readOnly})),
        options: Object.fromEntries(['dc-predict', 'dc-reason'].map(name => [name, fields('input[name="' + name + '"]').map(field => field.value)])),
        selected: Object.fromEntries(['dc-predict', 'dc-reason'].map(name => [name, host?.querySelector('input[name="' + name + '"]:checked')?.value])),
        piles: fields('.dc-target[data-amount]').map(group => Number(group.dataset.amount)),
        total: host?.dataset.total === 'hidden'
          ? fields('.dc-target[data-amount]').reduce((sum, group) => sum + Number(group.dataset.amount), Number(host.dataset.stock))
          : Number(host?.dataset.total),
        feedback: host?.querySelector('.dc-feedback')?.textContent || '',
        firstMove: first && {name: first.dataset.dcAction, bin: Number(first.dataset.bin)},
        progress: window.ArzhenikovDiscoveriesProgress?.(), previous: Object.fromEntries(keys.map(name => [name, localStorage.getItem(name)]))};
    }, previousKeys);
  }
  stage() { return this.snapshot.stage; } equations() { return this.snapshot.equations; }
  fields() { return this.snapshot.fields; } options(name) { return this.snapshot.options[name]; }
  selected(name) { return this.snapshot.selected[name]; } piles() { return this.snapshot.piles; }
  total() { return this.snapshot.total; } feedback() { return this.snapshot.feedback; }
  firstMove() { return this.snapshot.firstMove; } progress() { return this.snapshot.progress; }
  previous() { return this.snapshot.previous; }
  async goto(hash) {
    await this.page.goto(this.url.split('#')[0] + hash);
    if (hash.startsWith('#discoveries-')) {
      await this.page.waitForFunction(id => document.querySelector('#discoveries-play')?.dataset.mission === id, hash.slice('#discoveries-'.length));
    }
    await this.sync();
  }
  async reload() { await this.page.reload(); await this.sync(); }
  async action(name, bin) {
    const selector = '#discoveries-play [data-dc-action="' + name + '"]' + (bin === undefined ? '' : '[data-bin="' + bin + '"]');
    await this.page.locator(selector).press('Enter'); await this.sync();
  }
  async choose(name, value) { await this.page.locator('#discoveries-play input[name="' + name + '"][value="' + value + '"]').check(); await this.sync(); }
  async fill(id, value) { await this.page.locator('#discoveries-play [data-dc-field="' + id + '"]').fill(String(value)); await this.sync(); }
}

async function seedPriorWork(flow) {
  const interactions = [
    ['#workshop-picnic', '#workshop-play [data-action="place"][data-index="0"]'],
    ['#garden-pack', '#garden-play form input', '2'],
    ['#harbor-2', '#harbor-play [data-hb-action="place"][data-bin="0"]'],
    ['#count', '#activity input', '7']
  ];
  for (const [hash, selector, value] of interactions) {
    await flow.goto(hash);
    if (flow.page) {
      const control = flow.page.locator(selector).first();
      if (value === undefined) await control.press('Enter'); else await control.fill(value);
      await flow.sync();
    } else {
      const control = flow.doc.querySelector(selector); assert(control, 'Prior-work control ' + selector);
      if (value === undefined) control.click();
      else { control.value = value; control.dispatchEvent(new flow.window.Event('input', {bubbles: true})); }
      await flow.tick();
    }
  }
  if (flow.page) {
    await flow.page.evaluate(() => localStorage.setItem('mathexam.journeys-test.sentinel', 'unrelated-state-is-retained'));
    await flow.sync();
  } else flow.window.localStorage.setItem('mathexam.journeys-test.sentinel', 'unrelated-state-is-retained');
  assert(Object.values(flow.previous()).every(value => typeof value === 'string' && value.length), 'All four old modes have actual unfinished work');
}

async function investigations(flow) {
  await seedPriorWork(flow);
  await flow.goto('#discoveries-meanings-1');
  const preserved = flow.previous();
  for (const task of cases) {
    await flow.goto('#discoveries-' + task.id);
    await solve(flow, task, {blank: task.id === 'meanings-1', incomplete: task.id === 'meanings-1',
      restoreMove: ['meanings-1', 'change-1', 'reverse-1'].includes(task.id),
      wrongAnswer: ['meanings-1', 'change-2', 'boundary-2'].includes(task.id),
      wrongPrediction: task.id === 'change-3', hint: task.id === 'reverse-3'});
  }
  let result = flow.progress();
  assert.equal(result.total, 24);
  assert.deepEqual([...result.completed].sort(), cases.map(task => task.id).sort());
  assert.equal(numericCount(result.independent), 10, 'Two checks used a wrong prediction or help; only ten are independent');
  assert.equal(result.lines.length, 6);
  assert(result.lines.every(line => numericCount(line.completed) === 4 && line.total === 4));
  const before = numericCount(result.independent);
  for (const id of ['reverse-3', 'boundary-3']) {
    await flow.goto('#discoveries-' + id);
    await flow.action('replay');
    await solve(flow, cases.find(task => task.id === id));
    assert.equal(flow.progress().completed.length, 24, 'Replaying does not create another completion');
    assert.equal(numericCount(flow.progress().independent), before, 'Replaying a familiar story never creates new independent evidence');
  }
  await flow.reload();
  assert.equal(flow.progress().completed.length, 24);
  assert.equal(numericCount(flow.progress().independent), before);
  assert.deepEqual(flow.previous(), preserved, 'Investigations preserve all existing trainer saves');
}

async function mapControlsFit(page, where) {
  const boxes = await page.locator('#journey-map').evaluate(map => {
    const box = node => {const r = node.getBoundingClientRect(); return {x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height};};
    return {viewport: box(map.querySelector('.journey-viewport')), camera: box(map.querySelector('.journey-camera-controls')),
      nodes: Array.from(map.querySelectorAll('[data-journey-group],[data-journey-topic]'))
        .filter(node => !node.hidden && getComputedStyle(node).display !== 'none')
        .map(node => ({id: node.dataset.journeyGroup || node.dataset.group + '/' + node.dataset.journeyTopic, ...box(node)}))};
  });
  const separate = (a, b) => a.right <= b.x + 1 || b.right <= a.x + 1 || a.bottom <= b.y + 1 || b.bottom <= a.y + 1;
  try {
    assert(boxes.nodes.length > 0, where + ': visible destinations');
    for (const [index, node] of boxes.nodes.entries()) {
      const v = boxes.viewport;
      assert(node.width >= 44 && node.height >= 44, where + ' ' + node.id + ': usable touch target');
      assert(node.x >= v.x - 1 && node.y >= v.y - 1 && node.right <= v.right + 1 && node.bottom <= v.bottom + 1,
        where + ' ' + node.id + ': whole control fits: ' + JSON.stringify(node));
      assert(separate(node, boxes.camera), where + ' ' + node.id + ': destination must not overlap the zoom controls');
      for (const other of boxes.nodes.slice(0, index)) assert(separate(node, other), where + ': ' + node.id + ' and ' + other.id + ' must not overlap');
    }
  } catch (error) {
    const name = 'journeys-failure-' + where.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    fs.writeFileSync(path.join(artifacts, name + '.json'), JSON.stringify({where, ...boxes}, null, 2) + '\n');
    await page.locator('#journey-map').screenshot({path: path.join(artifacts, name + '.png'), timeout: 5000}).catch(() => {});
    throw error;
  }
}

async function mapBrowser(page, width) {
  const map = page.locator('#journey-map');
  const viewport = map.locator('.journey-viewport');
  const route = hash => page.goto(trainer.split('#')[0] + hash);
  const view = async expected => { await page.waitForFunction(value => document.querySelector('#journey-map')?.dataset.view === value, expected); };
  const fits = async where => assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), where + ': horizontal overflow');
  await route('');
  assert(await page.locator('#workshop-play').isVisible(), 'The first child action remains the default entrance');
  assert.equal(await map.isVisible(), false, 'The large map opens on request');
  await page.locator('#workshop-play [data-action="place"][data-index="0"]').press('Enter');
  const previous = await page.evaluate(keys => Object.fromEntries(keys.map(name => [name, localStorage.getItem(name)])), previousKeys);
  await route('#journey'); await map.waitFor({state: 'visible'}); await view('overview');
  assert.equal(await page.locator('body').getAttribute('data-adventure-mode'), 'journey');
  assert.equal(await map.getAttribute('aria-label'), 'Карта математических путешествий');
  for (const selector of ['#workshop', '#division-harbor', '#garden-play', '#sheet', '#discoveries-play']) {
    assert.equal(await page.locator(selector).isVisible(), false, selector + ' stays out of the map view');
  }
  assert.deepEqual(await map.locator('[data-journey-group]').evaluateAll(nodes => [...new Set(nodes.map(node => node.dataset.journeyGroup))].sort()), [...groups].sort());
  await mapControlsFit(page, 'Overview ' + width);
  await fits('Map overview ' + width);
  await map.screenshot({path: path.join(artifacts, 'journeys-overview-' + width + '.png')});
  for (const group of groups) {
    await route('#journey'); await view('overview');
    await map.locator('[data-journey-group="' + group + '"]').first().press('Enter');
    await view('group'); assert.equal(await map.getAttribute('data-group'), group);
    await mapControlsFit(page, group + ' group ' + width);
    assert((await page.locator('#journey-caption').innerText()).trim());
    const topic = await map.locator('[data-journey-topic][data-group="' + group + '"]').evaluateAll(nodes => {
      const v = document.querySelector('.journey-viewport').getBoundingClientRect();
      return nodes.find(node => {const r = node.getBoundingClientRect(); const style = getComputedStyle(node);
        return style.visibility !== 'hidden' && style.display !== 'none' && r.width > 0 && r.height > 0 &&
          r.x + r.width / 2 >= v.x && r.x + r.width / 2 <= v.right && r.y + r.height / 2 >= v.y && r.y + r.height / 2 <= v.bottom;
      })?.dataset.journeyTopic;
    });
    assert(topic, group + ': at least one topic is reachable inside the map viewport');
    await map.locator('[data-journey-topic="' + topic + '"][data-group="' + group + '"]').press('Enter');
    await view('topic'); assert.equal(await map.getAttribute('data-topic'), topic);
    await mapControlsFit(page, group + ' topic ' + width);
    const destination = await map.locator('a[data-journey-action="open"]').getAttribute('href');
    assert(destination && !/^#journey(?:-|$)/.test(destination) && !/^javascript:/i.test(destination), group + ': topic leads to an actual exercise');
    assert((await map.locator('.journey-breadcrumb').innerText()).trim(), 'A readable path accompanies the zoom');
    await fits(group + ' topic ' + width);
    await page.goBack(); await view('group');
    assert.equal(await map.getAttribute('data-group'), group, 'Browser Back restores the containing group');
    await map.locator('[data-journey-topic="' + topic + '"][data-group="' + group + '"]').press('Enter'); await view('topic');
    if (group === 'discoveries') {
      await map.screenshot({path: path.join(artifacts, 'journeys-topic-' + width + '.png')});
      await viewport.focus(); await viewport.press('Escape'); await view('group');
    } else {
      await map.locator('[data-journey-action="back"]').press('Enter'); await view('group');
    }
    await map.locator('[data-journey-action="overview"]').press('Enter'); await view('overview');
  }
  assert.deepEqual(await page.evaluate(keys => Object.fromEntries(keys.map(name => [name, localStorage.getItem(name)])), previousKeys), previous,
    'Browsing the map does not alter unfinished learning work');
  const world = map.locator('.journey-world');
  assert((await world.evaluate(node => getComputedStyle(node).transitionDuration)).split(',').every(value => parseFloat(value) === 0), 'Reduced motion disables camera transitions');
  const overviewTransform = await world.evaluate(node => getComputedStyle(node).transform);
  await map.locator('[data-journey-action="zoom-in"]').press('Enter'); await view('group'); await fits('Manual zoom ' + width);
  assert.notEqual(await world.evaluate(node => getComputedStyle(node).transform), overviewTransform, 'Zoom visibly changes the camera transform');
  assert(!/NaN|Infinity/.test(await world.getAttribute('style') || ''), 'Camera has finite coordinates');
  await map.locator('[data-journey-action="zoom-out"]').press('Enter'); await view('overview');
  await viewport.focus(); await viewport.press('ArrowRight'); await view('group');
  assert.equal(await map.getAttribute('data-group'), 'city');
  await viewport.press('ArrowRight');
  await page.waitForFunction(() => document.querySelector('#journey-map').dataset.group === 'harbor');
  await viewport.press('ArrowLeft');
  await page.waitForFunction(() => document.querySelector('#journey-map').dataset.group === 'city');
  await map.locator('[data-journey-action="next"]').press('Enter');
  await page.waitForFunction(() => document.querySelector('#journey-map').dataset.group === 'harbor');
  await map.locator('[data-journey-action="previous"]').press('Enter');
  await page.waitForFunction(() => document.querySelector('#journey-map').dataset.group === 'city');
  await viewport.focus();
  await viewport.press('Escape'); await view('overview');
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await map.locator('[data-journey-action="motion"]').press('Enter');
  assert.equal(await map.locator('[data-journey-action="motion"]').getAttribute('aria-pressed'), 'true');
  await map.locator('[data-journey-action="motion"]').press('Enter');
  assert.equal(await map.locator('[data-journey-action="motion"]').getAttribute('aria-pressed'), 'false');
  await page.emulateMedia({reducedMotion: 'reduce'});
  await map.locator('[data-journey-action="overview"]').press('Enter'); await view('overview');
  await route('#workshop-picnic');
  assert.equal(await page.locator('#workshop-play .ws-target').first().locator('.ws-token').count(), 1, 'The previous child action is still present');
}

async function domMap(flow) {
  await flow.goto('#journey');
  let map = flow.doc.querySelector('#journey-map');
  assert(map && !map.hidden && map.dataset.view === 'overview');
  const saved = flow.previous();
  for (const group of groups) {
    await flow.goto('#journey-' + group); map = flow.doc.querySelector('#journey-map');
    assert.equal(map.dataset.view, 'group'); assert.equal(map.dataset.group, group);
    assert.equal(flow.doc.body.dataset.adventureMode, 'journey');
    assert.equal(flow.doc.querySelector('#workshop').hidden, true);
    if (group === 'discoveries') {
      const summary = map.querySelector('.journey-progress').textContent;
      assert(!/meanings-\d|reverse-\d/.test(summary), 'Progress shows counts rather than internal mission IDs');
    }
  }
  await flow.goto('#next-course');
  assert.equal(flow.doc.querySelector('#next-course').hidden, false);
  assert.equal(flow.doc.body.dataset.adventureMode, 'bridge');
  assert.equal(flow.doc.querySelector('#journey-map').hidden, true);
  assert.equal(flow.doc.querySelector('#workshop').hidden, true);
  assert.deepEqual(flow.previous(), saved, 'Map route state does not modify learning state');
}

async function corruptedSaveDom() {
  const raw = '{an unfinished damaged JSON record';
  const flow = new DomFlow(); flow.saved[key] = raw;
  try {
    await flow.goto('#discoveries-boundary-3');
    assert.equal(flow.window.localStorage.getItem(key), raw, 'A damaged save is preserved for possible recovery');
    assert.match(flow.doc.querySelector('.dc-storage').textContent, /нетронутым/iu);
    assert.equal(flow.progress().completed.length, 0, 'A damaged record supplies no completion evidence');
    await solve(flow, cases.find(task => task.id === 'boundary-3'));
    assert.equal(flow.progress().completed.length, 1, 'The pupil can still work in this tab');
    assert.equal(flow.window.localStorage.getItem(key), raw, 'New in-tab work does not overwrite a damaged save');
  } finally { flow.close(); }
}

function unpackOffline() {
  const archive = path.join(root, path.dirname(pagePath), 'arzhenikov-offline.zip');
  assert(fs.existsSync(archive), 'The offline package must be built before its browser check');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'arzhenikov-offline-qa-'));
  execFileSync('python3', ['-c',
    'import pathlib,sys,zipfile\nwith zipfile.ZipFile(sys.argv[1]) as z:\n for n in z.namelist():\n  p=pathlib.PurePosixPath(n)\n  assert not p.is_absolute() and ".." not in p.parts\n z.extractall(sys.argv[2])\n',
    archive, directory], {stdio: 'pipe'});
  return directory;
}

async function offlineBrowser(browser) {
  const directory = unpackOffline();
  const context = await browser.newContext({viewport: {width: 375, height: 850}, reducedMotion: 'reduce'});
  const network = [], errors = [], failedResources = [];
  await context.route(/^https?:\/\//, route => { network.push(route.request().url()); return route.abort('internetdisconnected'); });
  await context.setOffline(true);
  try {
    const page = await context.newPage(); page.setDefaultTimeout(15000);
    page.on('pageerror', error => errors.push(error.message));
    page.on('requestfailed', request => failedResources.push(request.url()));
    const url = pathToFileURL(path.join(directory, 'index.html')).href;
    const flow = new BrowserFlow(page, url);
    await flow.goto('');
    assert(await page.locator('#offline-help').isVisible(), 'The unpacked package identifies itself');
    assert.equal(await page.locator('script[src*="navigator-widget"],script[src*="navigator-data"]').count(), 0);
    await page.locator('#workshop-play [data-action="place"][data-index="0"]').press('Enter');
    await page.reload();
    assert.equal(await page.locator('#workshop-play .ws-target').first().locator('.ws-token').count(), 1, 'Offline city action survives reload');
    await page.locator('#workshop-play [data-action="undo"]').press('Enter');
    await flow.goto('#journey');
    const map = page.locator('#journey-map'), world = map.locator('.journey-world');
    await map.waitFor({state: 'visible'});
    const before = await world.evaluate(node => getComputedStyle(node).transform);
    await map.locator('[data-journey-group="discoveries"]').press('Enter');
    await page.waitForFunction(() => document.querySelector('#journey-map').dataset.group === 'discoveries');
    assert.notEqual(await world.evaluate(node => getComputedStyle(node).transform), before, 'The offline map has a working camera');
    await map.locator('[data-journey-topic="meanings"][data-group="discoveries"]').press('Enter');
    await page.waitForFunction(() => document.querySelector('#journey-map').dataset.view === 'topic');
    assert.equal(await map.locator('a[data-journey-action="open"]').getAttribute('href'), '#discoveries-meanings-1');
    await map.screenshot({path: path.join(artifacts, 'offline-journey-375.png')});
    await map.locator('a[data-journey-action="open"]').press('Enter');
    await page.locator('#discoveries-play[data-stage="predict"]').waitFor({state: 'visible'});
    await flow.sync(); await solve(flow, cases[0], {restoreMove: true, wrongAnswer: true});
    await page.waitForFunction(() => document.documentElement.classList.contains('arz-art-ready') && document.documentElement.classList.contains('arz-world-ready'));
    await page.screenshot({path: path.join(artifacts, 'offline-discovery-375.png')});
    await flow.goto('#journey-algebra-unknown');
    await page.waitForFunction(() => document.querySelector('#journey-map').dataset.group === 'algebra' && document.querySelector('#journey-map').dataset.topic === 'unknown');
    assert.match(await map.locator('a[data-journey-action="open"]').getAttribute('href'), /^https:\/\/mathexam\.space\//,
      'A neighbouring course remains an explicitly online destination');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Offline route fits a phone');
    assert.deepEqual(network, [], 'All startup and lesson resources are local; no HTTP request is attempted');
    assert.deepEqual(failedResources, [], 'Every requested offline resource exists');
    assert.deepEqual(errors, []);
  } finally { await context.close(); fs.rmSync(directory, {recursive: true, force: true}); }
}

async function main() {
  if (process.argv.includes('--dom')) {
    const flow = new DomFlow();
    try {
      await investigations(flow); await domMap(flow); await corruptedSaveDom();
      const directory = unpackOffline();
      const offline = new DomFlow(path.join(directory, 'index.html'));
      try {
        await offline.goto('#discoveries-adjust-3'); await solve(offline, cases.find(task => task.id === 'adjust-3'));
        await domMap(offline);
      } finally { offline.close(); fs.rmSync(directory, {recursive: true, force: true}); }
      console.log('ARZHENIKOV_JOURNEYS_DOM_OK: 24 investigations, errors, partial work, reload/undo, sticky assistance, replay, four actual old saves, eleven map routes and unpacked ZIP runtime. Browser layout and keyboard checks not run in DOM mode.');
    } finally { flow.close(); }
    return;
  }
  fs.mkdirSync(artifacts, {recursive: true});
  const {chromium} = require('playwright');
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({viewport: {width: 1280, height: 900}, reducedMotion: 'reduce'});
    const page = await context.newPage(); page.setDefaultTimeout(15000);
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await investigations(new BrowserFlow(page));
    assert.deepEqual(errors, []); await context.close();
    // 640px reproduces the original overlap. The 800/825px pair surrounds the
    // shared compact boundary: actual canvas widths are about 750/773px.
    for (const width of [320, 375, 390, 640, 800, 825, 1280]) {
      const ctx = await browser.newContext({viewport: {width, height: 850}, reducedMotion: 'reduce'});
      const tab = await ctx.newPage(); tab.setDefaultTimeout(15000);
      const failures = []; tab.on('pageerror', error => failures.push(error.message));
      await mapBrowser(tab, width);
      const flow = new BrowserFlow(tab);
      await flow.goto('#discoveries-boundary-3');
      await solve(flow, cases.find(task => task.id === 'boundary-3'), {restoreMove: true, wrongAnswer: true});
      assert(await tab.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Investigation fits ' + width);
      await tab.screenshot({path: path.join(artifacts, 'discoveries-complete-' + width + '.png')});
      assert.deepEqual(failures, []); await ctx.close();
    }
    await offlineBrowser(browser);
    console.log('ARZHENIKOV_JOURNEYS_BROWSER_OK: 24 investigations; exact saved work, first predictions, independent evidence; ten map areas, zoom/back/keyboard, 320/375/390/640/800/825/1280, reduced motion, preserved city action and unpacked offline ZIP with HTTP blocked.');
  } finally { await browser.close(); }
}

if (require.main === module) main().catch(error => {console.error(error); process.exitCode = 1;});
module.exports = {cases};
