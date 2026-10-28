'use strict';

// Synthetic browser-only local course checks. No account, provider or real work.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.resolve(process.env.PETERSON_HELP_ARTIFACT_DIR || '/tmp/mathexam-peterson-help');
const server = http.createServer((request, response) => {
  const url = new URL(request.url, 'http://local');
  if (url.pathname === '/fixture') {
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.end('<!doctype html><meta charset="utf-8"><iframe title="Курс" style="width:100%;height:800px" src="' +
      url.searchParams.get('course').replace(/&/g, '&amp;').replace(/"/g, '&quot;') + '"></iframe>'); return;
  }
  if (url.pathname === '/favicon.ico') { response.writeHead(204).end(); return; }
  try {
    let file = path.resolve(ROOT, '.' + decodeURIComponent(url.pathname));
    assert(file.startsWith(ROOT + path.sep));
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    response.setHeader('Content-Type', ({ '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json' })[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(response);
  } catch (_) { response.writeHead(404).end(); }
});
let checks = 0;
async function run() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ headless:true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) });
  const errors = [], requests = [];
  try {
    fs.mkdirSync(OUTPUT, { recursive:true });
    const context = await browser.newContext();
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await context.route('**/*', route => {
      const url = route.request().url();
      if (!url.startsWith(origin + '/')) { requests.push(url); return route.abort(); }
      return route.continue();
    });
    await page.goto(origin + '/school/peterson6/');
    await page.evaluate(() => {
      document.querySelector('.peterson-help')?.remove();
      window.helpCalls = [];
      window.helpTask = {id:'safe',title:'Тестовая задача',condition:'<img src=x onerror=alert(1)> {{frac:1:2}}',stepIndex:0,
        steps:[{title:'Первый шаг',hint:'Первая подсказка',explanation:'Первое объяснение',answer:'2'},
          {title:'Второй шаг',hint:'Вторая подсказка',explanation:'Второе объяснение',answer:'4'}],
        onHelp(details){window.helpCalls.push({details,answers:document.querySelectorAll('.peterson-help-answer').length});return true;}};
      window.fixtureHelp = PetersonTaskHelp.mount({getTask:()=>window.helpTask});
    });
    assert(await page.locator('.peterson-help-panel').isHidden());
    await page.locator('.peterson-help-launcher').click();
    assert.equal(await page.locator('.peterson-help-condition img').count(), 0);
    assert.equal(await page.locator('.peterson-help-fraction').count(), 1);
    assert.equal(await page.locator('.peterson-help-close').evaluate(element=>element===document.activeElement), true);
    await page.locator('[data-peterson-help=hint]').click();
    assert.deepEqual(await page.evaluate(()=>window.helpCalls.map(value=>value.answers)), [0], 'Assistance recorded before source answer');
    await page.evaluate(()=>{window.helpTask.stepIndex=1;window.fixtureHelp.sync();});
    await page.locator('[data-peterson-help=hint]').click();
    assert.equal(await page.locator('.peterson-help-answer').count(), 2, 'Earlier hints remain visible');
    await page.locator('[data-peterson-help=hint]').click();
    assert.equal(await page.locator('.peterson-help-answer').count(), 2, 'Repeated hint does not duplicate the log');
    await page.keyboard.press('Escape');
    assert(await page.locator('.peterson-help-panel').isHidden());
    assert.equal(await page.locator('.peterson-help-launcher').evaluate(element=>element===document.activeElement), true);
    await page.locator('.peterson-help-launcher').click();
    await page.evaluate(()=>{window.helpTask={...window.helpTask,id:'changed',condition:'Другое условие'};window.fixtureHelp.sync();});
    assert.equal(await page.locator('.peterson-help-answer').count(), 0, 'A different task clears old answers');
    await page.evaluate(()=>{window.helpTask.onHelp=()=>{window.helpTask={...window.helpTask,id:'raced'};return true;};});
    await page.locator('[data-peterson-help=full]').click();
    assert.equal(await page.locator('.peterson-help-answer').count(), 0, 'Task revocation during marking cannot reveal stale help');
    await page.evaluate(()=>{window.helpTask.onHelp=()=>false;});
    await page.locator('[data-peterson-help=hint]').click();
    assert.equal(await page.locator('.peterson-help-answer').count(), 0, 'A rejected assistance mark reveals nothing');
    checks += 10;

    for (const width of [1280,390,320]) {
      await page.setViewportSize({ width, height:900 });
      for (const course of ['peterson','maxim']) {
        const isPeterson = course === 'peterson';
        const route = isPeterson ? '/school/peterson6/#practice/decimal-add/1' : '/trainers/maxim-peterson6/#river-units';
        await page.goto(origin + route);
        await page.reload(); // The first journey can share the fixture's pathname.
        const input = page.locator(isPeterson ? '#final-answer' : '#answer-input');
        await input.fill('12,345');
        assert(await page.locator('.peterson-help-panel').isHidden());
        await page.locator('.peterson-help-launcher').click();
        await page.locator('[data-peterson-help=hint]').click();
        assert.equal(await input.inputValue(), '12,345', 'Opening help preserves the draft');
        assert.equal(await page.locator('.peterson-help-answer').count(), 1);
        const assisted = await page.evaluate(isPeterson => isPeterson
          ? Object.values(PetersonApp.getState().tasks).some(task=>task.assisted)
          : JSON.parse(localStorage.getItem(TrainerCore.storageKey)).metrics['river-units'].hints > 0, isPeterson);
        assert.equal(assisted, true, 'Real course stores assistance');
        await page.locator('[data-peterson-help=simpler]').click();
        assert.equal(await page.locator('.peterson-help-answer').count(), 2);
        await page.locator('[data-peterson-help=full]').click();
        assert.equal(await page.locator('.peterson-help-answer').count(), 3);
        assert.equal(await page.locator('.peterson-help-message').textContent(), 'Подсказка добавлена. Эта работа будет учитываться с помощью.');
        const bounds = await page.locator('.peterson-help').boundingBox();
        assert(bounds.x >= 0 && bounds.x + bounds.width <= width + 1, 'Helper fits viewport');
        assert(bounds.y >= 0 && bounds.y + bounds.height <= 901, 'Panel and launcher stay within viewport height');
        assert.equal(await page.evaluate(()=>document.querySelector('.peterson-help-panel').scrollWidth <= document.querySelector('.peterson-help-panel').clientWidth), true);
        // The existing Maxim page uses smooth scrolling. Wait for its compositor
        // to settle before recording a fixed panel, rather than capturing motion.
        await page.waitForFunction(() => {
          const state=window.__helpScrollCheck||{y:window.scrollY,at:performance.now()};
          if(state.y!==window.scrollY){state.y=window.scrollY;state.at=performance.now();}
          window.__helpScrollCheck=state;return performance.now()-state.at>400;
        });
        await page.screenshot({ path:path.join(OUTPUT,course+'-'+width+'.png'), fullPage:false });
        await page.locator('.peterson-help-close').click();
        assert(await page.locator('.peterson-help-panel').isHidden());
        if (isPeterson) await page.locator('[data-action=new]').click();
        else await page.locator('#another').click();
        await page.locator('.peterson-help-launcher').click();
        assert.equal(await page.locator('.peterson-help-answer').count(), 0, 'New generated task resets help');
        checks += 8;
      }
    }
    for (const base of ['/school/peterson6/', '/trainers/maxim-peterson6/']) {
      await page.goto(origin+'/fixture?course='+encodeURIComponent(base));
      await page.frameLocator('iframe').locator('body').waitFor();
      assert.equal(await page.frameLocator('iframe').locator('.peterson-help').count(), 0, 'Ordinary embedded modes remain unchanged');
      await page.goto(origin+'/fixture?course='+encodeURIComponent(base+'?cabinet=peterson-helper'));
      await page.frameLocator('iframe').locator('.peterson-help-launcher').waitFor();
      assert.equal(await page.frameLocator('iframe').locator('.peterson-help').count(), 1, 'Exact cabinet opt-in supplies the local helper');
      checks += 2;
    }
    // The shared-board wrapper does not load the helper and the course hook
    // also rejects boardSession even when the cabinet opt-in is present.
    await page.goto(origin+'/trainers/peterson6.html?cabinet=peterson-helper');
    await page.locator('#main').waitFor();
    assert.equal(await page.locator('.peterson-help').count(), 0);
    checks++;
    assert.deepEqual(requests, [], 'No external request is made');
    assert.deepEqual(errors, [], 'No browser runtime errors');
    console.log('PETERSON_TASK_HELP_BROWSER_OK: '+checks+' checks; 6 desktop/mobile screenshots; '+OUTPUT);
    await context.close();
  } finally { await browser.close(); }
}
run().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>server.close());
