'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '../..');
const slug = 'simple-equations-stepwise';
const source = '/trainers/' + slug + '.html';
const folder = path.join(root, 'downloads/trainers', slug);
const key = 'mathExamCourseProgress.v1', topic = 'simpleEquationsStepwise';
const earlier = { total: 7, right: 6, history: [{text: 'Сохранённая тестовая запись'}] };
const operators = ['minus', 'plus', 'divide', 'multiply'];
const buttons = {minus:'opMinus', plus:'opPlus', divide:'opDivide', multiply:'opMultiply'};
const back = '/ege-baza/path/index.html#lesson=practice-quadratic';
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'equations-browser-'));
const report = {cases:0, correctClick:0, correctEnter:0, incorrectNumber:0, wrongChoicesCleared:0, repeatProtected:0, restored:0, offlineCases:0, errors:[]};
let browser, server;

function parseEquation(text) {
  let m;
  if ((m = /^x \+ (\d+) = (-?\d+)$/.exec(text))) return ['minus', Number(m[2])-Number(m[1])];
  if ((m = /^x − (\d+) = (-?\d+)$/.exec(text))) return ['plus', Number(m[2])+Number(m[1])];
  if ((m = /^(\d+) · x = (-?\d+)$/.exec(text))) return ['divide', Number(m[2])/Number(m[1])];
  if ((m = /^x : (\d+) = (-?\d+)$/.exec(text))) return ['multiply', Number(m[2])*Number(m[1])];
  throw Error('Unexpected learner-visible equation: '+text);
}

async function main() {
  const standalone = fs.readFileSync(path.join(folder, slug+'.html'));
  const archive = execFileSync('python3', ['-c',
    'import sys,zipfile; z=zipfile.ZipFile(sys.argv[1]); assert z.testzip() is None; assert sorted(z.namelist())==sorted([sys.argv[2],sys.argv[3]]); sys.stdout.buffer.write(z.read(sys.argv[2]))',
    path.join(folder, slug+'-package.zip'), slug+'.html', slug+'-deepseek-prompt.md']);
  assert(archive.equals(standalone), 'ZIP and standalone HTML must match');
  const local = {};
  for (const [name, bytes] of [['standalone',standalone], ['archive',archive]]) {
    const dir = path.join(temp,name); fs.mkdirSync(dir);
    const file = path.join(dir,slug+'.html'); fs.writeFileSync(file,bytes); local[name] = pathToFileURL(file).href;
  }
  server=http.createServer((req,res)=>{
    const pathname=new URL(req.url,'http://local').pathname, file=path.resolve(root,'.'+pathname);
    if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
    fs.readFile(file,(error,bytes)=>{
      if(error){res.writeHead(404).end();return;}
      res.setHeader('Content-Type',({'.html':'text/html;charset=utf-8','.js':'application/javascript','.css':'text/css'})[path.extname(file)]||'application/octet-stream');
      res.end(bytes);
    });
  });
  await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
  const origin='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
  report.browser=browser.version();
  for(const [surface,url] of Object.entries({online:origin+source+'?returnTo='+encodeURIComponent(back),...local})){
    const offline=surface!=='online';
    for(let i=0;i<8;i++){
      const ctx=await browser.newContext({offline,viewport:{width:i%2?1280:390,height:900}});
      try {
        const page=await ctx.newPage();
        page.on('pageerror',e=>report.errors.push(surface+': '+e.message));
        if(offline)page.on('requestfailed',req=>report.errors.push(surface+': '+new URL(req.url()).pathname.split('/').pop()+' '+req.failure().errorText));
        // Reproducible generators; expected numbers come from the learner-visible equation.
        const seq=[.08,.4,((i%4)+.25)/4,...(i%4===3?[.2]:[])];
        await page.addInitScript(({seq,slug})=>{
          if(!location.pathname.endsWith('/'+slug+'.html')) return;
          let n=0; Math.random=()=>seq[n++%seq.length];
        },{seq,slug});
        await page.goto(url);
        // Seed the earlier synthetic topic only once, never from a reload/init hook.
        await page.evaluate(({key,earlier})=>localStorage.setItem(key,JSON.stringify({topics:{earlier}})),{key,earlier});
        const id=x=>page.locator('#'+x), clickCheck=()=>page.getByRole('button',{name:'Проверить',exact:true}).click();
        const saved=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
        if(i>=4) await id('med').click();
        const [op,answer]=parseEquation(await id('eq').innerText());
        assert.equal(op,operators[i%4],'all four equation types, in both levels');
        const wrong=operators.find(x=>x!==op);
        assert(await id('ans').isDisabled());
        await clickCheck(); assert.equal(await id('total').innerText(),'0');
        for(let turn=0;turn<2;turn++){
          await id(buttons[wrong]).click();
          assert.equal(await page.locator('.ops .chosen').count(),0,'a rejected action is never marked as selected');
          assert.match(await id('instruction').innerText(),/^1\)/,'rejected action leaves learner at step 1');
          assert(await id('ans').isDisabled()); assert(await id('stepBox').isHidden());
          await clickCheck(); assert.equal(await id('total').innerText(),'0'); report.wrongChoicesCleared++;
          await id(buttons[op]).click(); assert(await id('ans').isEnabled());
          assert(await id('stepBox').isVisible()); assert.match(await id('instruction').innerText(),/^2\)/);
          assert.equal(await page.locator('.ops .chosen').count(),1);
          await clickCheck(); assert.equal(await id('total').innerText(),'0','blank answer does not count');
        }
        const correct=i%3!==2;
        await id('ans').fill(String(correct?answer:answer+1));
        if(i%2){await id('ans').press('Enter');if(correct)report.correctEnter++;}
        else{await clickCheck();if(correct)report.correctClick++;}
        if(!correct)report.incorrectNumber++;
        const value=await saved();
        assert.deepEqual(value.topics.earlier,earlier);
        assert.equal(value.topics[topic].total,1);assert.equal(value.topics[topic].right,Number(correct));
        assert.equal(value.topics[topic].history.length,1);
        await clickCheck(); await id('ans').press('Enter'); assert.deepEqual(await saved(),value);report.repeatProtected++;
        await page.reload();assert.equal(await id('total').innerText(),'1','displayed total after reload; stored value '+JSON.stringify(await saved()));assert.equal(await id('right').innerText(),String(Number(correct)));
        assert.deepEqual(await saved(),value);report.restored++;
        if(offline)report.offlineCases++;
        else {
          const downloads=await page.locator('#download a[download]').evaluateAll(nodes=>nodes.map(n=>n.pathname));
          assert.deepEqual(downloads,[slug+'.html',slug+'-deepseek-prompt.md',slug+'-package.zip'].map(n=>'/downloads/trainers/'+slug+'/'+n));
          assert.equal(await page.locator('#ege-return a').getAttribute('href'),origin+back);
          if(i===0){await page.locator('#ege-return a').click(); await page.waitForURL(origin+back);assert((await page.locator('body').innerText()).length>60,'actual course loaded after return');}
        }
        report.cases++;
      } catch(error){throw new Error(surface+' case '+(i+1)+': '+error.message,{cause:error});} finally {await ctx.close();}
    }
  }
  assert.equal(report.cases,24);assert.equal(report.wrongChoicesCleared,48);assert.equal(report.offlineCases,16);assert.deepEqual(report.errors,[]);
  console.log('SIMPLE_EQUATIONS_CHECK_OK: '+JSON.stringify(report));
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{
  await browser?.close();if(server)await new Promise(ok=>server.close(ok));fs.rmSync(temp,{recursive:true,force:true});
});
