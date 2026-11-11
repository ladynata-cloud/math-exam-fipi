'use strict';
// Synthetic browser scenarios, run in cloud CI. They do not establish learning
// gains with actual pupils and never access the signed-in production cabinet.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const course = path.join(root, 'trainers', 'oge-basics');
const output = path.join(root, 'artifacts', 'oge-basics-contextual');
const reports = [];
const errors = [];
const widths = [320, 360, 1280];
const contentTypes = {'.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml'};

// Preserve the complete contextual-course inventory from d3d6365. New public
// page types have their own contracts below; they do not replace an old route.
const contextualRoutes = Object.freeze([
  'arithmetic-route.html',
  'decimal-add-subtract.html',
  'fraction-common-denominator.html',
  'fraction-meaning.html',
  'index.html',
  'multiplication-division.html',
  'multiplication-division/arithmetic-foundations.html',
  'multiplication-division/column-multiplication-one-digit.html',
  'multiplication-division/column-multiplication-two-digit.html',
  'multiplication-division/course-append-zeros.html',
  'multiplication-division/course-bring-digit.html',
  'multiplication-division/course-column-four-by-one.html',
  'multiplication-division/course-column-mixed.html',
  'multiplication-division/course-column-one-digit.html',
  'multiplication-division/course-column-three-by-one.html',
  'multiplication-division/course-column-three-by-three.html',
  'multiplication-division/course-column-three-by-two.html',
  'multiplication-division/course-column-two-by-three.html',
  'multiplication-division/course-column-two-digit.html',
  'multiplication-division/course-column-zeros.html',
  'multiplication-division/course-decimal-divisor.html',
  'multiplication-division/course-decimal-natural.html',
  'multiplication-division/course-digit-choice.html',
  'multiplication-division/course-estimate.html',
  'multiplication-division/course-first-part.html',
  'multiplication-division/course-independent-check.html',
  'multiplication-division/course-mixed-guided.html',
  'multiplication-division/course-multiply-bridge.html',
  'multiplication-division/course-multiply-two-digit.html',
  'multiplication-division/course-remainder.html',
  'multiplication-division/course-simple-check.html',
  'multiplication-division/course-subtract.html',
  'multiplication-division/course-whole-simple.html',
  'multiplication-division/course-whole-two-digit.html',
  'multiplication-division/course-zeros.html',
  'multiplication-division/decimal-division-natural.html',
  'multiplication-division/decimal-divisor-shift.html',
  'multiplication-division/division-append-zeros.html',
  'multiplication-division/division-course.html',
  'multiplication-division/division-diagnostic.html',
  'multiplication-division/division-lab.html',
  'multiplication-division/division-with-remainder.html',
  'multiplication-division/index.html',
  'multiplication-division/long-division-from-simple-to-decimals.html',
  'multiplication-division/long-division-mixed-checkpoint.html',
  'multiplication-division/long-division-one-digit.html',
  'multiplication-division/long-division-quotient-digit.html',
  'multiplication-division/long-division-two-digit.html',
  'multiplication-division/long-division-with-remainder.html',
  'multiplication-division/long-division-zero-in-quotient.html',
  'multiplication-division/multiplication-ladder.html',
  'multiplication-division/multiplication-meaning.html',
  'multiplication-division/multiplication-mixed.html',
  'multiplication-division/multiplication-pythagoras-table.html',
  'multiplication-division/multiplication-tricks.html',
  'multiplication-division/quotient-estimate.html',
  'multiplication-division/tabular-division.html',
  'negative-add-subtract.html',
  'negative-number-line.html',
  'order-of-operations.html',
  'percentages/index.html',
  'percentages/percent-change.html',
  'percentages/percent-choose-question.html',
  'percentages/percent-final-checkpoint.html',
  'percentages/percent-meaning.html',
  'percentages/percent-of-number-and-whole.html',
  'percentages/proportion.html',
  'rounding.html',
  'units-area.html',
  'units-length-time.html'
]);
const supplementalRoutes = Object.freeze({
  divisionRoute: 'multiplication-division/division-path.html',
  independentCheckpoint: 'multiplication-division/division-checkpoint.html'
});

function htmlFiles(folder) {
  return fs.readdirSync(folder, {withFileTypes:true}).flatMap(entry => {
    const file = path.join(folder, entry.name);
    return entry.isDirectory() ? htmlFiles(file) : entry.name.endsWith('.html') ? [file] : [];
  }).sort();
}
function checkInventory() {
  assert.equal(contextualRoutes.length, 70, 'All original contextual course routes remain named');
  const expected = [...contextualRoutes, ...Object.values(supplementalRoutes)].sort();
  assert.equal(new Set(expected).size, expected.length, 'Each route has exactly one contract');
  const actual = htmlFiles(course).map(file => path.relative(course, file).split(path.sep).join('/'));
  assert.deepEqual(actual, expected, 'Every course HTML has an explicit contract; no old route may disappear');
  return {contextualRoutes, supplementalRoutes, total:expected.length};
}
const server = http.createServer((req, res) => {
  try {
    let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://fixture').pathname));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    res.setHeader('Content-Type', contentTypes[path.extname(file)] || 'application/octet-stream');
    res.end(fs.readFileSync(file));
  } catch (_) { res.writeHead(404).end(); }
});
let origin;

async function open(page, relative) {
  const response = await page.goto(origin + '/trainers/oge-basics/' + relative, {waitUntil:'load'});
  assert.equal(response.status(), 200, relative + ' is available');
}
async function noOverflow(page, label) {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    label + ': no horizontal page overflow at ' + page.viewportSize().width);
}
async function hitTarget(locator, label) {
  await locator.scrollIntoViewIfNeeded();
  const hit = await locator.evaluate(element => {
    const r = element.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const top = document.elementFromPoint(x, y);
    return {
      ok: r.width >= 24 && r.height >= 24 && r.left >= -1 && r.right <= innerWidth + 1 &&
        y >= 0 && y <= innerHeight && (top === element || element.contains(top)),
      rect: {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height},
      viewport: {width:innerWidth,height:innerHeight}, scrollY,
      target: element.outerHTML.slice(0,500),
      interceptor: top ? top.outerHTML.slice(0,500) : null
    };
  });
  if (!hit.ok) {
    const page=locator.page(), name='hit-target-failure-'+page.viewportSize().width;
    fs.writeFileSync(path.join(output,name+'.json'),JSON.stringify({label,url:page.url(),...hit},null,2));
    await page.screenshot({path:path.join(output,name+'.png'),fullPage:false});
  }
  assert(hit.ok, label + ': visible, usable hit target ' + JSON.stringify(hit));
}
async function shot(page, name) {
  await page.screenshot({path:path.join(output, name + '.png'), fullPage:true, animations:'disabled'});
}
function activeFrame(page) { return page.locator('.bh-frame:visible'); }
function helper(page) { return page.locator('.bh-toggle:visible').first(); }

async function retainDraftInHelp(page, {name, route, answer, prompt, practice, prepare}) {
  await open(page, route);
  if (practice) await page.locator(practice).waitFor({state:'visible'});
  await helper(page).waitFor({state:'visible'});
  const verifyAccepted = prepare ? await prepare(page) : null;
  const input = page.locator(answer).filter({visible:true}).first();
  await input.waitFor({state:'visible'});
  const beforePrompt = await page.locator(prompt).first().textContent();
  assert.equal(await helper(page).getAttribute('aria-expanded'), 'false', name + ': help starts closed');
  await noOverflow(page, name);
  await shot(page, name + '-task-' + page.viewportSize().width);
  await input.fill('17');
  await hitTarget(helper(page), name + ' help');
  await helper(page).click();
  assert.equal(await helper(page).getAttribute('aria-expanded'), 'true');
  assert(await page.locator('.bh-panel:visible').count(), name + ': help opens');
  assert.equal(await input.inputValue(), '17', name + ': help preserves main answer');
  assert.equal(await page.locator(prompt).first().textContent(), beforePrompt, name + ': help preserves problem');
  await noOverflow(page, name + ' help');
  await shot(page, name + '-help-' + page.viewportSize().width);
  await helper(page).click();
  assert.equal(await page.locator('.bh-panel:visible').count(), 0);
  await helper(page).click();
  assert.equal(await input.inputValue(), '17', name + ': reopening preserves main answer');
  assert.equal(await page.locator(prompt).first().textContent(), beforePrompt);
  if (verifyAccepted) await verifyAccepted();
  reports.push({scenario:name, width:page.viewportSize().width, retainedMainDraft:true});
  return {input, beforePrompt};
}

async function chooseLegacyQuotientDigit(page) {
  // This family starts with a visible multiples choice, then asks for its
  // product. Read the two displayed numbers and use the normal choice button.
  const partial = Number((await page.locator('#partialValue').innerText()).trim());
  const divisor = Number((await page.locator('#divisorDisplay').innerText()).trim());
  assert(Number.isSafeInteger(partial) && Number.isSafeInteger(divisor) && divisor > 0);
  const digit = Math.floor(partial / divisor);
  assert(digit >= 0 && digit <= 9, 'The displayed partial dividend has a one-digit quotient');
  // Every displayed digit must remain reachable beside the mobile navigator,
  // independent of which random exercise happens to supply the correct digit.
  const choices=page.locator('#multiples button:visible');
  assert.equal(await choices.count(),10);
  for (let i=0;i<10;i++) await hitTarget(choices.nth(i),'Visible quotient choice '+i);
  const choice = page.locator('#multiples button:visible').nth(digit);
  assert.match(await choice.innerText(), new RegExp('^' + digit + ' [·×] ' + divisor));
  await hitTarget(choice, 'Select the quotient digit from the visible multiples');
  await choice.click();
  await page.locator('#answerArea input').waitFor({state:'visible'});
  const accepted = await page.locator('#quotientDisplay').innerText();
  assert.equal(accepted.trim(), String(digit), 'The accepted digit is written immediately');
  return async () => assert.equal(await page.locator('#quotientDisplay').innerText(), accepted,
    'Opening and closing help retains the already written quotient digit');
}

async function deepHelp(page) {
  const original = await retainDraftInHelp(page, {name:'percentages',
    route:'percentages/percent-of-number-and-whole.html',
    answer:'#p-q input:not([type="radio"])', prompt:'#p-q', practice:'#view-practice'});
  // Every selection is a visible prerequisite control; no state injection or
  // direct calls to the runtime help engine are used.
  const chain = ['percent-part', 'divide', 'quotient', 'multiply', 'add', 'count'];
  const drafts = new Map();
  for (let i = 0; i < chain.length; i++) {
    const id = chain[i];
    const child = page.locator('[data-bh-skill="' + id + '"]:visible').first();
    await hitTarget(child, 'Open prerequisite ' + id);
    await child.click();
    const frame = activeFrame(page);
    assert.equal(await frame.getAttribute('data-bh-node'), id);
    const field = frame.locator('.bh-answer');
    await field.fill(String(80 + i));
    drafts.set(id, String(80 + i));
    await noOverflow(page, 'Deep helper ' + id);
    await hitTarget(frame.locator('.bh-check'), 'Check prerequisite ' + id);
  }
  assert.equal(await activeFrame(page).getAttribute('data-bh-node'), 'count');
  const dot = activeFrame(page).getByRole('button', {name:'Отметить точку 1', exact:true});
  await hitTarget(dot, 'Interactive counting model');
  await dot.click();
  assert.equal(await dot.getAttribute('aria-pressed'), 'true');
  await activeFrame(page).locator('.bh-check').click();
  assert.notEqual(await activeFrame(page).getAttribute('data-bh-solved'), 'true', 'Incorrect child answer is rejected');
  await activeFrame(page).locator('.bh-answer').fill('8');
  await activeFrame(page).locator('.bh-check').click();
  assert.equal(await activeFrame(page).getAttribute('data-bh-solved'), 'true', 'The child example can be solved independently');
  drafts.set('count', '8');
  assert.equal(await original.input.inputValue(), '17', 'Child success does not submit or overwrite the main answer');
  await shot(page, 'deep-help-' + page.viewportSize().width);
  await helper(page).click();
  assert.equal(await page.locator('.bh-panel:visible').count(), 0);
  await helper(page).click();
  assert.equal(await activeFrame(page).getAttribute('data-bh-node'), 'count', 'Reopen returns to the deep node');
  assert.equal(await activeFrame(page).locator('.bh-answer').inputValue(), drafts.get('count'));
  assert.equal(await activeFrame(page).getByRole('button', {name:'Отметить точку 1', exact:true}).getAttribute('aria-pressed'), 'true', 'Reopen retains the model state');
  for (let i = chain.length - 2; i >= 0; i--) {
    await page.locator('.bh-back:visible').click();
    assert.equal(await activeFrame(page).getAttribute('data-bh-node'), chain[i]);
    assert.equal(await activeFrame(page).locator('.bh-answer').inputValue(), drafts.get(chain[i]),
      'Back retains prerequisite draft: ' + chain[i]);
  }
  await page.locator('.bh-root:visible').click();
  assert.equal(await original.input.inputValue(), '17', 'Return retains original draft');
  assert.equal(await page.locator('#p-q').textContent(), original.beforePrompt, 'Return retains original problem');
  await noOverflow(page, 'Returned original task');
  await shot(page, 'deep-return-' + page.viewportSize().width);
  reports.push({scenario:'deep-help', width:page.viewportSize().width, levels:chain.length,
    retainedParentDrafts:true, retainedMainDraft:true});
}

async function diagnosticWithoutHelp(page) {
  await open(page, 'multiplication-division/division-diagnostic.html');
  await page.locator('[data-do="start"]').click();
  await page.locator('#question-title').waitFor();
  assert.equal(await page.locator('.bh-toggle,.bh-panel').count(), 0,
    'Diagnostic never mounts instructional help');
  await hitTarget(page.locator('[data-do="skip"]'), 'Diagnostic skip');
  await noOverflow(page, 'Diagnostic');
  await shot(page, 'diagnostic-' + page.viewportSize().width);
  reports.push({scenario:'diagnostic-no-help', width:page.viewportSize().width});
}

async function miniCheckWithoutHelp(page) {
  await open(page, 'order-of-operations.html');
  await helper(page).waitFor();
  await page.locator('details.bs-navigation > summary').click();
  await page.locator('[data-route="check"]:visible').first().click();
  await page.locator('#view-check').waitFor({state:'visible'});
  assert.equal(await page.locator('.bh-toggle:visible,.bh-panel:visible').count(), 0,
    'Mini-check has no visible instructional help');
  await noOverflow(page, 'Mini-check');
  reports.push({scenario:'mini-check-no-help', width:page.viewportSize().width});
}

async function supplementalDivisionContracts(page) {
  // These are a route map and an independent answer check, not contextual
  // lesson pages. Dedicated division suites cover their complete journeys.
  await open(page, supplementalRoutes.divisionRoute);
  await page.locator('#continue-division').waitFor({state:'visible'});
  const topics = ['start','oneDigit','zero','remainder','twoDigit','decimalNatural','appendZeros','decimalDivisor'];
  assert.deepEqual(await page.locator('.path-step').evaluateAll(items => items.map(item => item.dataset.topic)), topics,
    'Division route exposes all eight ordered skills');
  assert.deepEqual(await page.locator('a[data-guided]').evaluateAll(links => links.map(link => {
    const url = new URL(link.href);
    return {topic:link.dataset.guided, path:url.pathname, hash:url.hash};
  })), topics.map(topic => ({topic, path:'/trainers/long-division-stepwise.html', hash:'#' + topic})),
  'Each route stage enters its exact guided skill');
  assert.equal(await page.locator('a[href="/trainers/long-division-claude.html"]').count(), 1,
    'The alternate Claude trainer remains reachable');
  const checkpointLink = page.locator('.checkpoint a.button');
  assert.equal(await checkpointLink.getAttribute('href'), 'division-checkpoint.html');
  await hitTarget(page.locator('#continue-division'), 'Continue from the division route');
  await hitTarget(checkpointLink, 'Open the independent division check');
  await noOverflow(page, 'Division route');
  reports.push({route:supplementalRoutes.divisionRoute, contract:'ordered-division-route',
    status:200, width:page.viewportSize().width, stages:topics.length});

  await open(page, supplementalRoutes.independentCheckpoint);
  await page.locator('#checkpoint-form').waitFor({state:'visible'});
  assert.equal((await page.locator('#checkpoint-count').innerText()).trim(), 'Пример 1 из 8');
  assert.equal(await page.locator('#checkpoint-progress').getAttribute('max'), '8');
  assert.equal(await page.locator('.bh-toggle,.bh-panel').count(), 0,
    'The independent checkpoint does not mount contextual answer help');
  assert(await page.locator('#checkpoint-review').isHidden(), 'Solution is hidden before submission');
  assert.equal(await page.locator('#checkpoint-correct-answer').textContent(), '', 'No answer is revealed in advance');
  const problem = await page.locator('#checkpoint-problem').textContent();
  await hitTarget(page.locator('#checkpoint-submit'), 'Check the independent answer');
  await page.locator('#checkpoint-submit').click();
  assert.match(await page.locator('#checkpoint-feedback').innerText(), /Сначала введи ответ/);
  assert.equal((await page.locator('#checkpoint-count').innerText()).trim(), 'Пример 1 из 8',
    'Blank input does not consume the single attempt');
  assert(await page.locator('#checkpoint-review').isHidden());
  await page.locator('#checkpoint-answer').fill('17');
  await page.reload({waitUntil:'load'});
  assert.equal(await page.locator('#checkpoint-answer').inputValue(), '17', 'Checkpoint draft survives reload');
  assert.equal(await page.locator('#checkpoint-problem').textContent(), problem, 'Checkpoint problem survives reload');
  assert(await page.locator('#checkpoint-review').isHidden(), 'Saving a draft does not submit an answer');
  const detour = new URL(await page.locator('#checkpoint-help').getAttribute('href'), page.url());
  assert.equal(detour.pathname, '/trainers/long-division-stepwise.html');
  assert.equal(detour.hash, '#start');
  assert.equal(detour.searchParams.get('skillReturn'), '/trainers/oge-basics/' + supplementalRoutes.independentCheckpoint,
    'Practice links carry a return to this independent check');
  await hitTarget(page.locator('#checkpoint-help'), 'Practice before returning to the checkpoint');
  await noOverflow(page, 'Independent division checkpoint');
  reports.push({route:supplementalRoutes.independentCheckpoint, contract:'independent-answer-check',
    status:200, width:page.viewportSize().width, retainedDraft:true, unrevealedAnswer:true});
}

(async () => {
  const inventory = checkInventory();
  if (process.argv.includes('--inventory-only')) {
    console.log('OGE_BASICS_CONTEXTUAL_INVENTORY_OK: 70 unchanged routes + explicit division route and independent checkpoint; no missing or unclassified HTML.');
    return;
  }
  const {chromium} = require('playwright');
  fs.mkdirSync(output, {recursive:true});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = 'http://127.0.0.1:' + server.address().port;
  let browser;
  try {
    browser = await chromium.launch({headless:true,
      ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? {executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE} : {})});
    const routePage = await browser.newPage({viewport:{width:1280,height:900}});
    routePage.on('pageerror', error => errors.push({route:routePage.url(),message:error.message}));
    for (const relative of contextualRoutes) {
      await open(routePage, relative);
      await routePage.locator('main:visible,section:visible').first().waitFor();
      assert((await routePage.title()).trim(), relative + ': descriptive page title');
      assert((await routePage.locator('body').innerText()).trim().length > 30, relative + ': rendered content');
      assert.equal(await routePage.getByText('Тренажёр не загрузился.', {exact:false}).count(), 0, relative + ': no bootstrap failure');
      await noOverflow(routePage, relative);
      reports.push({route:relative, status:200});
    }
    await routePage.close();
    for (const width of widths) {
      const context = await browser.newContext({viewport:{width,height:900}});
      const page = await context.newPage();
      page.on('pageerror', error => errors.push({width,route:page.url(),message:error.message}));
      try {
        await retainDraftInHelp(page, {name:'order', route:'order-of-operations.html',
          answer:'#practiceAnswer input', prompt:'#practicePrompt', practice:'#view-practice'});
        await deepHelp(page);
        await retainDraftInHelp(page, {name:'legacy-division', route:'multiplication-division/long-division-one-digit.html',
          answer:'#answerArea input', prompt:'#taskTitle', practice:'#view-practice', prepare:chooseLegacyQuotientDigit});
        await retainDraftInHelp(page, {name:'managed-public', route:'multiplication-division/course-first-part.html',
          answer:'#lm-answer', prompt:'#learning-remediation-root .lm-card .lm-prompt', practice:'#learning-remediation-root'});
        await retainDraftInHelp(page, {name:'foundations', route:'multiplication-division/arithmetic-foundations.html',
          answer:'#answer', prompt:'#question', practice:'#exercise'});
        await retainDraftInHelp(page, {name:'estimate', route:'multiplication-division/quotient-estimate.html',
          answer:'#estimate-answer', prompt:'#estimate-task', practice:'#view-practice'});
        await retainDraftInHelp(page, {name:'guided-division', route:'multiplication-division/long-division-from-simple-to-decimals.html',
          answer:'#answer', prompt:'#problem', practice:'#guided-division'});
        await retainDraftInHelp(page, {name:'division-lab', route:'multiplication-division/division-lab.html',
          answer:'#answer', prompt:'#problem', practice:'#workspace'});
        await miniCheckWithoutHelp(page);
        await diagnosticWithoutHelp(page);
        await supplementalDivisionContracts(page);
      } finally { await context.close(); }
    }
    assert.deepEqual(errors, [], 'No browser runtime errors');
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify({routes:inventory.total,
      contextualRoutes:inventory.contextualRoutes, supplementalRoutes:inventory.supplementalRoutes,
      widths, reports, errors}, null, 2));
    console.log('OGE_BASICS_CONTEXTUAL_BROWSER_OK: all original 70 routes + division route and independent checkpoint; 320/360/1280; deep help, draft retention, diagnostic boundaries and hit targets.');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => {
  fs.mkdirSync(output, {recursive:true});
  fs.writeFileSync(path.join(output, 'failure.json'), JSON.stringify({message:String(error),reports,errors}, null, 2));
  console.error(error);
  process.exitCode = 1;
});
