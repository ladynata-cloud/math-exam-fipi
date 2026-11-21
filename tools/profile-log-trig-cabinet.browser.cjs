'use strict';
// Isolated browser presentation/entry gate. No real users or production calls.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const os = require('node:os');
const {chromium} = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const ARTIFACTS = path.resolve(process.env.PROFILE_LOG_TRIG_CABINET_ARTIFACTS || path.join(os.tmpdir(), 'profile-log-trig-cabinet'));
const MIME = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};
const PUPIL = {id:'fixture-pupil',role:'student',name:'Проверочный ученик',login:'fixture-pupil',active:true};
const TEACHER = {id:'fixture-teacher',role:'teacher',name:'Преподаватель',login:'fixture-teacher',active:true};

(async () => {
  fs.mkdirSync(ARTIFACTS, {recursive:true});
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const filename = path.resolve(ROOT, '.' + pathname + (pathname.endsWith('/') ? 'index.html' : ''));
    if (!filename.startsWith(ROOT + path.sep) || !fs.existsSync(filename) || !fs.statSync(filename).isFile()) {
      res.writeHead(404);res.end();return;
    }
    res.writeHead(200, {'Content-Type':MIME[path.extname(filename)] || 'application/octet-stream'});
    fs.createReadStream(filename).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const report = {completed:false,journeys:[],screenshots:[],errors:[],unexpectedRequests:[],writes:[]};
  let browser;
  try {
    browser = await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH || process.env.CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage']});
    for (const width of [1280,320]) for (const teacher of [false,true]) for (const assigned of [false,true]) {
      const role = teacher ? 'teacher' : 'student', route = teacher ? 'student=' + PUPIL.id : 'home';
      const profile = {course:'ege-profile',goal:null,focus:'Повтори выбранную тему.',version:1,...(assigned ? {program:{grade:10,courseIds:['ege-profile']}} : {})};
      const context = await browser.newContext({viewport:{width,height:900},locale:'ru-RU',reducedMotion:'reduce'});
      try {
        await context.route('**/*', async requestRoute => {
          const request = requestRoute.request(), url = new URL(request.url());
          // Verify the exact iframe destination without contacting production.
          if (url.origin === 'https://mathexam.space' && url.pathname === '/trainers/trainer-board.html') {
            return requestRoute.fulfill({contentType:'text/html',body:'<!doctype html><title>Проверка входа</title><p>Тестовая доска</p>'});
          }
          if (url.origin !== origin) {
            report.unexpectedRequests.push(request.method() + ' ' + url.origin + url.pathname);
            return requestRoute.abort();
          }
          if (!url.pathname.startsWith('/api/learning/')) return requestRoute.continue();
          const endpoint = url.pathname.slice('/api/learning'.length);
          if (request.method() !== 'GET') {
            report.writes.push(endpoint);
            return requestRoute.fulfill({status:403,contentType:'application/json',body:'{}'});
          }
          const responses = {
            '/status':{available:true,durable:true},'/session':{account:teacher ? TEACHER : PUPIL,csrfToken:'synthetic-read-only'},
            '/profile':{profile},'/attempts':{attempts:[]},'/assignments':{assignments:[]},'/lessons':{lessons:[]},
            '/assistant':{ok:true,enabled:false,available:false,profile:null,version:0,mode:'unavailable'},
            '/teacher/students':{students:[{...PUPIL,profile,passwordReady:true}]},
            ['/teacher/students/' + PUPIL.id + '/report']:{student:PUPIL,attempts:[],counts:{},positions:[],assignments:[],resets:[]},
            ['/teacher/students/' + PUPIL.id + '/profile']:{profile},
            ['/teacher/students/' + PUPIL.id + '/assistant']:{ok:true,enabled:false,available:false,profile:null,version:0,mode:'unavailable'},
            ['/teacher/students/' + PUPIL.id + '/plan']:{items:[],note:''},
            ['/teacher/students/' + PUPIL.id + '/ai-drafts']:{drafts:[]},
            ['/teacher/students/' + PUPIL.id + '/parent-access']:{parentAccess:{exists:false}}
          };
          if (!Object.hasOwn(responses, endpoint)) {
            report.unexpectedRequests.push(endpoint);
            return requestRoute.fulfill({status:404,contentType:'application/json',body:'{}'});
          }
          return requestRoute.fulfill({contentType:'application/json',body:JSON.stringify(responses[endpoint])});
        });
        const page = await context.newPage();
        page.on('pageerror', error => report.errors.push(error.message));
        page.on('response', response => { if (response.status() >= 400 && ['document','script','stylesheet'].includes(response.request().resourceType())) report.errors.push(response.status() + ' ' + new URL(response.url()).pathname); });
        await page.goto(origin + '/learning/?role=' + role + '#' + route);
        const panel = page.locator('[data-profile-shared-board]');
        await panel.waitFor();
        assert.equal(await panel.count(), 1);
        assert.equal(await panel.locator('[data-profile-shared-item]').count(), 16);
        const name = role + '-' + (assigned ? 'program' : 'profile') + '-' + width;
        await panel.screenshot({path:path.join(ARTIFACTS, name + '.png')});
        report.screenshots.push(name + '.png');
        await panel.locator('.profile-shared-group').nth(1).locator('summary').click();
        await panel.screenshot({path:path.join(ARTIFACTS, name + '-topics.png')});
        report.screenshots.push(name + '-topics.png');
        const overflow = await panel.evaluate(element => ({width:element.clientWidth,content:element.scrollWidth}));
        assert(overflow.content <= overflow.width + 1, 'Shared course entry overflows at ' + width + 'px: ' + JSON.stringify(overflow));
        const task = panel.locator('[data-profile-shared-item="before-radians"] [data-profile-shared-mode="guided"]');
        const entry = new URLSearchParams((await task.getAttribute('href')).slice(1));
        assert.equal(entry.get('return'), route);
        const board = new URL(entry.get('public-practice'), 'https://mathexam.space');
        assert.equal(board.searchParams.get('trainer'), '/trainers/ege-profile-circle.html#task/prep-negative/guided');
        await task.click();
        await page.locator('[data-cabinet-return]').waitFor();
        assert.equal(await page.locator('[data-public-workspace] iframe').getAttribute('src'), board.href);
        assert.equal(await page.locator('[data-cabinet-return]').getAttribute('href'), '#' + route);
        await page.locator('[data-cabinet-return]').click();
        await page.locator('[data-profile-shared-board]').waitFor();
        report.journeys.push({role,assigned,width,selectedTask:'prep-negative',returned:true});
      } finally { await context.close(); }
    }
    assert.deepEqual(report.errors, []);assert.deepEqual(report.unexpectedRequests, []);assert.deepEqual(report.writes, []);
    report.completed = true;
    console.log('PROFILE_LOG_TRIG_CABINET_BROWSER=PASS ' + JSON.stringify({journeys:report.journeys.length,screenshots:report.screenshots.length,widths:[1280,320],readOnly:true}));
  } catch (error) { report.failure = error.stack || String(error);throw error; }
  finally {
    fs.writeFileSync(path.join(ARTIFACTS, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    await browser?.close();
    await new Promise(resolve => { server.closeAllConnections();server.close(resolve); });
  }
})().catch(error => {console.error(error.stack || error);process.exitCode = 1;});
