'use strict';
// Required by profile-part2-engine.test.cjs, an existing explicit CI entry.
// Missing Playwright, Chromium or any native assertion fails in CI.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const map = require('../ege-profil/exam-map.js');
const root = fs.realpathSync(path.resolve(__dirname, '..'));
test('native Chromium H02 official routes, legacy bookmarks and saved work at three widths', {
  skip: !(process.env.CI || process.env.H02_NATIVE_BROWSER === '1') && 'native acceptance runs in CI Chromium image; set H02_NATIVE_BROWSER=1',
  timeout: 300000
}, async t => {
  const {chromium} = require('playwright');
  const shots = '/tmp/profile-part2-shots/h02-fipi-2027';
  fs.mkdirSync(shots, {recursive: true});
  const widths = [320, 390, 1280], report = {kind: 'native Chromium', jsdom: false, widths, cases: []};
  const mime = {'.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2'};
  const server = http.createServer((req, res) => {
    try {
      let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://fixture').pathname));
      if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
      if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
      file = fs.realpathSync(file);
      if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
      res.setHeader('Content-Type', mime[path.extname(file)] || 'text/html');
      res.end(fs.readFileSync(file));
    } catch (_) { res.writeHead(404).end(); }
  });
  let browser, shutdown;
  const cleanup = () => shutdown || (shutdown = (async () => {
    try { if (browser) await browser.close(); }
    finally { if (server.listening) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); } }
  })());
  t.after(cleanup);
  t.signal.addEventListener('abort', () => { void cleanup().catch(() => {}); }, {once: true});
  try {
    await new Promise((resolve, reject) => {server.once('error', reject); server.listen(0, '127.0.0.1', resolve);});
    const origin = 'http://127.0.0.1:' + server.address().port;
    browser = await chromium.launch({headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox']});
    report.browserVersion = browser.version();
    for (const width of widths) await t.test(width + 'px', async () => {
      const row = {width, official: [], legacy: [], extras: [], screenshots: [], pageErrors: [], badResponses: [], assertions: []};
      report.cases.push(row);
      const context = await browser.newContext({viewport: {width, height: 900}}), page = await context.newPage();
      page.setDefaultTimeout(12000);
      page.on('pageerror', error => row.pageErrors.push(error.message));
      page.on('response', response => {if (response.status() >= 400 && response.url().startsWith(origin)) row.badResponses.push(response.status() + ' ' + response.url());});
      const check = (name, actual, expected = true) => {assert.deepEqual(actual, expected, name); row.assertions.push(name);};
      const capture = async name => {const file = width + '-' + name + '.png'; await page.screenshot({path: path.join(shots, file), fullPage: true}); row.screenshots.push(file);};
      const go = async href => {await page.goto(origin + href); await page.locator('main h1').first().waitFor();};
      const noOverflow = async name => check(name + ' fits viewport', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      const lessonsVisible = async ids => {
        const hrefs = await page.locator('main a[href]').evaluateAll(links => links.map(link => link.getAttribute('href')));
        for (const id of ids) check('reachable lesson ' + id, hrefs.some(href => href.includes('/' + id)));
      };
      try {
        await page.goto(origin + '/ege-profil/');
        await page.locator('#profile-2027').waitFor();
        const actual = await page.locator('#profile-2027 a.first-three-link[data-exam-number]').evaluateAll(links => links.map(link => {
          const url = new URL(link.href);
          return {number: Number(link.getAttribute('data-exam-number')), href: url.pathname.replace(/\/index\.html$/, '/') + url.hash};
        }));
        check('main has 19 ordered official entries', actual.map(link => link.number), map.entries.map(entry => entry.number));
        check('main official entries target their exact routes', actual.map(link => link.href), map.entries.map(entry => map.href(entry)));
        const extras = await page.locator('#profile-2027 nav[aria-labelledby="extra-topic-map"] a.first-three-link').evaluateAll(links => links.map(link => {
          const url = new URL(link.href);
          return {number: link.getAttribute('data-exam-number'), href: url.pathname.replace(/\/index\.html$/, '/') + url.hash};
        }));
        check('main has the ordered extra topics without exam numbers', extras, map.extras.map(entry => ({number: null, href: map.href(entry)})));
        check('main map contains only its official and extra cards', await page.locator('#profile-2027 a.first-three-link').count(), map.entries.length + map.extras.length);
        await noOverflow('main'); await capture('main');
        for (const entry of map.entries) {
          await go(map.href(entry));
          check('official label ' + entry.number, new RegExp('№\\s*' + entry.number + '(?:\\D|$)').test(await page.locator('main').innerText()));
          if (entry.part === 1) {
            const board = await page.locator('main a.board-link').getAttribute('href');
            const target = new URL(board, origin);
            check('first-part board entry ' + entry.number, target.pathname, '/trainers/trainer-board.html');
            const trainer = new URL(target.searchParams.get('trainer'), origin);
            check('board preserves the chosen number ' + entry.number, trainer.hash, entry.number === 2 ? '#exam/2' : map.hash(entry));
          }
          await lessonsVisible(entry.number === 2 ? entry.preparationIds : entry.lessonIds);
          await noOverflow('official ' + entry.number);
          row.official.push(entry.number);
          if ([8, 12, 16, 18, 19].includes(entry.number)) await capture('official-' + entry.number);
        }
        for (const entry of map.extras) {
          await go(map.href(entry)); await lessonsVisible(entry.lessonIds);
          check('extra is labelled ' + entry.id, /дополнительная\s+тема/iu.test(await page.locator('main .eyebrow').first().innerText()));
          await noOverflow(entry.id); row.extras.push(entry.id);
        }
        for (const [area, hash, entry] of [
          ['start', '#calm/13', map.get(16)], ['start', '#exam/13', map.get(16)],
          ['start', '#calm/9', map.fromLegacyStart(9)], ['start', '#exam/9', map.fromLegacyStart(9)],
          ['start', '#topic/integral', map.topic('integral')],
          ...[14, 15, 16, 17, 18, 19, 20].map(number => ['part-two', '#exam/' + number, map.fromLegacyPartTwo(number)])
        ]) {
          await go('/ege-profil/' + area + '/' + hash); await lessonsVisible(entry.lessonIds);
          row.legacy.push(area + hash);
        }
        await go('/ege-profil/start/#exam/16');
        check('old START inequality bookmark keeps its theme', /Неравенства/.test(await page.locator('main h1').innerText()));
        check('old START inequality bookmark shows 15', /№\s*15/.test(await page.locator('main').innerText()));
        row.legacy.push('start#exam/16');
        check('browsing did not create START progress', await page.evaluate(() => localStorage.getItem('mathexam.profileStart2027.v1')), null);
        check('browsing did not create Part Two credit', await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('mathExam.profile.partTwo.v1.')).length), 0);

        const seed = await page.evaluate(() => {
          const lesson = window.ProfileLessons.find(item => item.id === 'finance-lesson-07-equal-payments'), task = lesson.tasks[0], completed = lesson.tasks[3];
          const state = {version: 1, records: {[lesson.id]: {guided: [], independent: [completed.id], attempts: 2}}, seen: {[task.id]: 1, [completed.id]: 1}, sessions: {
            [lesson.id + ':guided']: {taskId: task.id, step: 0, wrong: false, assisted: true, familiar: false, done: false, draft: '12/5', answers: [], started: '2026-11-14T12:00:00.000Z', registered: false}
          }};
          localStorage.setItem('mathexam.profileStart2027.v1', JSON.stringify(state));
          return {id: lesson.id, taskId: task.id, completedId: completed.id};
        });
        await go(map.href(16));
        await go('/ege-profil/start/#practice/' + seed.id + '/guided');
        await page.locator('#answer-form').waitFor();
        check('saved START draft displayed', await page.locator('#answer').inputValue(), '12/5');
        await page.reload(); await page.locator('#answer-form').waitFor();
        check('saved START draft survives reload', await page.locator('#answer').inputValue(), '12/5');
        const savedStart = await page.evaluate(() => JSON.parse(localStorage.getItem('mathexam.profileStart2027.v1')));
        check('original task identity preserved', savedStart.sessions[seed.id + ':guided'].taskId, seed.taskId);
        check('existing independent credit preserved exactly', savedStart.records[seed.id].independent, [seed.completedId]);
        check('navigation adds no START attempts', savedStart.records[seed.id].attempts, 2);
        await capture('finance-saved');
        await go(map.href(16));
        const written = page.getByRole('link', {name:'Решить №16 письменно', exact:true});
        check('official START finance links to written practice', await written.getAttribute('href'), '/ege-profil/part-two/#fipi/2027/16');
        await written.click();
        await page.getByRole('heading', {name:'Остаток уменьшается равными долями'}).waitFor();
        const firstWrittenTask = page.locator('a[href="#task/h12-monthly-balance-4/independent"]');
        await firstWrittenTask.click();
        await page.locator('#proof-draft').fill('Ставку применяю к остатку перед начислением.');
        await page.locator('#final-0').fill('9');
        await page.locator('#final-form button').click();
        await page.locator('#feedback.error').waitFor();
        await page.locator('#final-0').fill('12');
        await page.locator('#final-form button').click();
        await page.locator('#completion').waitFor();
        check('numeric success does not certify the written reasoning', /требует проверки/.test(await page.locator('.proof-status').innerText()));
        await noOverflow('written finance');
        await page.reload(); await page.locator('#proof-draft').waitFor();
        check('written finance proof survives reload', await page.locator('#proof-draft').inputValue(), 'Ставку применяю к остатку перед начислением.');
        check('written finance first attempt survives correction', await page.evaluate(()=>window.ProfilePartTwoApp.store.read('h12-monthly-balance-4').attempts[0].answers[0]), '9');
        check('written finance preserves START practice', await page.evaluate(()=>JSON.parse(localStorage.getItem('mathexam.profileStart2027.v1'))), savedStart);
        await capture('finance-written');
        await page.getByRole('link',{name:'Мой прогресс',exact:true}).click();
        const financeProgress = page.getByRole('region',{name:'№16 · Письменные финансовые задачи'});
        await financeProgress.waitFor();
        check('only the new written result appears in finance progress', /Самостоятельные ответы: 1/.test(await financeProgress.innerText()));
        check('old progress retains its totals without written results', /264 условий.*Самостоятельные ответы: 0/s.test(await page.locator('#main > .stats').innerText()));
        await noOverflow('written finance progress');


        await go('/ege-profil/part-two/#map');
        const savedPart = await page.evaluate(async () => {
          const task = window.ProfilePartTwoLessons.find(lesson => lesson.id === 'param-linear').tasks[3], store = window.ProfilePartTwoApp.store;
          await store.attempt(task.id, {kind: 'final', answers: ['wrong'], correct: false, mode: 'independent', independentEligible: true});
          await store.patch(task.id, record => {record.drafts.proof = 'Сохранённое обоснование'; record.drafts.final = task.final.map(() => '12/5'); record.helped = true;});
          const lab = {version: 1, p: 3, changed: true, prediction: {value: '2', correct: false}, transferFirst: null, transferLast: null, draft: '7'};
          localStorage.setItem('mathexam.profilePartTwoLab.v1.19', JSON.stringify(lab));
          return {id: task.id, raw: localStorage.getItem(store.key(task.id)), lab: JSON.stringify(lab)};
        });
        await go(map.href(18)); await go('/ege-profil/part-two/#task/' + savedPart.id + '/independent');
        check('saved proof restored', await page.locator('#proof-draft').inputValue(), 'Сохранённое обоснование');
        await page.reload(); await page.locator('#proof-draft').waitFor();
        check('saved proof survives reload', await page.locator('#proof-draft').inputValue(), 'Сохранённое обоснование');
        const after = await page.evaluate(id => ({raw: localStorage.getItem(window.ProfilePartTwoApp.store.key(id)), lab: localStorage.getItem('mathexam.profilePartTwoLab.v1.19'), wrongLab: localStorage.getItem('mathexam.profilePartTwoLab.v1.18')}), savedPart.id);
        check('attempts/help/proof record unchanged by navigation', after.raw, savedPart.raw);
        check('legacy lab 19 unchanged', after.lab, savedPart.lab); check('no lab renumbering to 18', after.wrongLab, null);
        await capture('parameters-saved');
        await go('/ege-profil/start/#sources');
        const integralGuide = page.locator('main p').filter({hasText: 'Первообразную и площадь изучаем'});
        check('sources link antiderivative and area to official number 8',
          await integralGuide.getByRole('link', {name: 'задании №8', exact: true}).getAttribute('href'), '#fipi/2027/8');
        await go('/trainers/ege-methods.html');
        await page.locator('main .eyebrow').first().waitFor();
        check('estimate and example header shows the current profile number',
          await page.locator('main .eyebrow').first().innerText(), 'ЕГЭ · профиль №19 и база №21');
        check('no native page errors', row.pageErrors, []); check('no local HTTP failures', row.badResponses, []);
        check('all 19 official routes visited', row.official.length, 19); check('13 old bookmarks retained', row.legacy.length, 13);
        row.status = 'passed';
      } catch (error) {row.status = 'failed'; row.error = error.stack || String(error); await capture('failure').catch(() => {}); throw error;}
      finally {await context.close();}
    });
  } finally {
    report.summary = {cases: report.cases.length, passed: report.cases.filter(row => row.status === 'passed').length, officialRoutes: report.cases.reduce((count, row) => count + row.official.length, 0), legacyRoutes: report.cases.reduce((count, row) => count + row.legacy.length, 0), extras: report.cases.reduce((count, row) => count + row.extras.length, 0)};
    fs.writeFileSync(path.join(shots, 'results.json'), JSON.stringify(report, null, 2) + '\n');
    t.diagnostic('H02_NATIVE_FIPI_BROWSER ' + JSON.stringify(report.summary));
    await cleanup();
  }
  assert.equal(report.summary.passed, 3, 'All three native viewport cases must pass');
  assert.equal(report.summary.officialRoutes, 57);
  assert.equal(report.summary.legacyRoutes, 39);
  assert.equal(report.summary.extras, 6);
});
