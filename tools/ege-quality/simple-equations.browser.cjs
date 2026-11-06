'use strict';
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const args = process.argv.slice(2);
assert(args.length === 0 || (args.length === 1 && args[0] === '--production'), 'Use no arguments or --production');
const production = args.length === 1;
const root = path.resolve(__dirname, '../..');
const slug = 'simple-equations-stepwise';
const source = '/trainers/' + slug + '.html';
const downloadPath = '/downloads/trainers/' + slug + '/';
const folder = path.join(root, downloadPath);
const key = 'mathExamCourseProgress.v1', topic = 'simpleEquationsStepwise';
const earlier = { total: 7, right: 6, history: [{text: 'Сохранённая тестовая запись'}] };
const operators = ['minus', 'plus', 'divide', 'multiply'];
const buttons = {minus:'opMinus', plus:'opPlus', divide:'opDivide', multiply:'opMultiply'};
const back = '/ege-baza/path/index.html#lesson=practice-quadratic';
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'equations-browser-'));
const report = {mode:production?'production':'local', commit:process.env.GITHUB_SHA||'local', status:'running', cases:0, correctClick:0, correctEnter:0, incorrectClick:0, incorrectEnter:0, incorrectNumber:0, wrongChoicesCleared:0, blankProtected:0, repeatProtected:0, restored:0, offlineCases:0, journeys:[], errors:[]};
let browser, server;

function parseEquation(text) {
  let m;
  if ((m = /^x \+ (\d+) = (-?\d+)$/.exec(text))) return ['minus', Number(m[2])-Number(m[1])];
  if ((m = /^x − (\d+) = (-?\d+)$/.exec(text))) return ['plus', Number(m[2])+Number(m[1])];
  if ((m = /^(\d+) · x = (-?\d+)$/.exec(text))) return ['divide', Number(m[2])/Number(m[1])];
  if ((m = /^x : (\d+) = (-?\d+)$/.exec(text))) return ['multiply', Number(m[2])*Number(m[1])];
  throw Error('Unexpected learner-visible equation: '+text);
}

const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
async function publishedFiles() {
  const paths = [source, downloadPath+slug+'.html', downloadPath+slug+'-package.zip'];
  const expected = new Map(paths.map(name => [name, fs.readFileSync(path.join(root, name))]));
  const deadline = Date.now()+8*60*1000;
  let attempts=0, failures=[];
  while(Date.now()<deadline) {
    attempts++;
    const found = new Map();
    failures=[];
    await Promise.all(paths.map(async name => {
      try {
        const url = new URL(name, 'https://mathexam.space');
        url.searchParams.set('release-check', hash(expected.get(name)));
        const response = await fetch(url, {cache:'no-store', redirect:'error', signal:AbortSignal.timeout(Math.min(20000, Math.max(1, deadline-Date.now())))});
        assert.equal(response.status,200,name+' HTTP status');
        const bytes = Buffer.from(await response.arrayBuffer());
        assert(bytes.equals(expected.get(name)), name+' does not yet match the checked-out release');
        found.set(name,bytes);
      } catch(error) { failures.push(error.message); }
    }));
    if(found.size===paths.length) {
      report.publication = {origin:'https://mathexam.space', checkedAt:new Date().toISOString(), attempts, files:paths.map(name=>({path:name, bytes:found.get(name).length, sha256:hash(found.get(name))}))};
      return found;
    }
    console.log('Waiting for matching Pages artifacts: '+failures.join('; '));
    const remaining=deadline-Date.now();
    if(remaining>0) await new Promise(ok=>setTimeout(ok,Math.min(10000,remaining)));
  }
  throw Error('Publication did not match this candidate within eight minutes: '+failures.join('; '));
}

async function main() {
  let origin, standalone = fs.readFileSync(path.join(folder, slug+'.html'));
  let zipFile = path.join(folder,slug+'-package.zip');
  const expectedSource = fs.readFileSync(path.join(root,source));
  if(production) {
    const published = await publishedFiles();
    standalone = published.get(downloadPath+slug+'.html');
    zipFile = path.join(temp,'published-package.zip');
    fs.writeFileSync(zipFile,published.get(downloadPath+slug+'-package.zip'));
    origin='https://mathexam.space';
  } else {
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
    origin='http://127.0.0.1:'+server.address().port;
  }
  const archive = execFileSync('python3', ['-c',
    'import sys,zipfile; z=zipfile.ZipFile(sys.argv[1]); assert z.testzip() is None; assert sorted(z.namelist())==sorted([sys.argv[2],sys.argv[3]]); assert z.read(sys.argv[3])==open(sys.argv[4],"rb").read(); sys.stdout.buffer.write(z.read(sys.argv[2]))',
    zipFile, slug+'.html', slug+'-deepseek-prompt.md', path.join(folder,slug+'-deepseek-prompt.md')]);
  assert(archive.equals(standalone), 'ZIP and standalone HTML must match');
  const local = {};
  for (const [name, bytes] of [['standalone',standalone], ['archive',archive]]) {
    const dir = path.join(temp,name); fs.mkdirSync(dir);
    const file = path.join(dir,slug+'.html'); fs.writeFileSync(file,bytes);
    assert.deepEqual(fs.readdirSync(dir),[slug+'.html'],'offline HTML has no sibling resources');
    local[name] = pathToFileURL(file).href;
  }
  const online = new URL(source,origin);
  online.searchParams.set('returnTo',back);
  if(production)online.searchParams.set('release-check',hash(expectedSource));
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
  report.browser=browser.version();
  for(const [surface,url] of Object.entries({online:online.href,...local})){
    const offline=surface!=='online';
    for(let i=0;i<8;i++) for(const submission of ['click','enter']) {
      const level=i>=4?'medium':'easy', op=operators[i%4];
      const ctx=await browser.newContext({offline,serviceWorkers:'block',viewport:{width:submission==='enter'?1280:390,height:900}});
      try {
        // Fresh anonymous contexts hold only synthetic localStorage. Refuse any server write.
        await ctx.route('**/*',route=>{
          const request=route.request();
          if(!['GET','HEAD'].includes(request.method())){
            report.errors.push(surface+': forbidden network write '+request.method());
            return route.abort();
          }
          return route.continue();
        });
        const page=await ctx.newPage();
        page.on('pageerror',e=>report.errors.push(surface+': '+e.message));
        if(offline){
          page.on('request',req=>{if(req.url()!==url)report.errors.push(surface+': unexpected offline resource '+new URL(req.url()).pathname.split('/').pop());});
          page.on('requestfailed',req=>report.errors.push(surface+': '+new URL(req.url()).pathname.split('/').pop()+' '+req.failure().errorText));
        }
        // Reproducible generators; expected answers come only from the visible equation.
        const seq=[.08,.4,((i%4)+.25)/4,...(i%4===3?[.2]:[])];
        await page.addInitScript(({seq,slug})=>{
          if(!location.pathname.endsWith('/'+slug+'.html')) return;
          let n=0; Math.random=()=>seq[n++%seq.length];
        },{seq,slug});
        const response=await page.goto(url);
        if(production&&!offline)assert((await response.body()).equals(expectedSource),'browser loaded the verified production HTML');
        // Seed the earlier topic only once, never from a reload/init hook.
        await page.evaluate(({key,earlier})=>localStorage.setItem(key,JSON.stringify({topics:{earlier}})),{key,earlier});
        const id=x=>page.locator('#'+x), clickCheck=()=>page.getByRole('button',{name:'Проверить',exact:true}).click();
        const saved=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
        if(level==='medium') await id('med').click();
        assert.equal(parseEquation(await id('eq').innerText())[0],op,'all four equation types in both levels');
        const initial=await saved();
        assert(await id('ans').isDisabled());
        await clickCheck();assert.equal(await id('total').innerText(),'0');assert.deepEqual(await saved(),initial);
        const chooseCorrect=async()=>{
          await id(buttons[op]).click();assert(await id('ans').isEnabled());
          assert(await id('stepBox').isVisible());assert.match(await id('instruction').innerText(),/^2\)/);
          assert.equal(await page.locator('.ops .chosen').count(),1);
          assert(await id(buttons[op]).evaluate(node=>node.classList.contains('chosen')));
        };
        for(const wrong of operators.filter(x=>x!==op)){
          // Each wrong action is checked from step 1 and again after accepting the correct action.
          for(let turn=0;turn<2;turn++){
            if(turn)await chooseCorrect();
            await id(buttons[wrong]).click();
            assert.equal(await page.locator('.ops .chosen').count(),0,'a rejected action is never marked as selected');
            assert.match(await id('instruction').innerText(),/^1\)/,'rejected action returns to step 1');
            assert(await id('ans').isDisabled());assert(await id('stepBox').isHidden());
            await clickCheck();assert.equal(await id('total').innerText(),'0');assert.deepEqual(await saved(),initial);
            report.wrongChoicesCleared++;
          }
        }
        await chooseCorrect();
        await clickCheck();await id('ans').press('Enter');
        assert.equal(await id('total').innerText(),'0');assert.deepEqual(await saved(),initial,'blank answer is not saved by either control');report.blankProtected++;
        let previousHistory=[];
        for(const correct of [true,false]){
          if(!correct){
            // The first reload has restored the result and generated a fresh exercise.
            if(level==='medium')await id('med').click();
            await chooseCorrect();
          }
          const [actualOp,answer]=parseEquation(await id('eq').innerText());
          assert.equal(actualOp,op,'the requested type also covers the incorrect numerical submission');
          await id('ans').fill(String(correct?answer:answer+1));
          if(submission==='enter')await id('ans').press('Enter');else await clickCheck();
          report[(correct?'correct':'incorrect')+(submission==='enter'?'Enter':'Click')]++;
          if(!correct)report.incorrectNumber++;
          const value=await saved(), total=correct?1:2;
          assert.deepEqual(value.topics.earlier,earlier);
          assert.equal(value.topics[topic].total,total);assert.equal(value.topics[topic].right,1);
          assert.equal(value.topics[topic].streak,Number(correct));assert.equal(value.topics[topic].best,1);
          assert.equal(value.topics[topic].history.length,total);
          assert.deepEqual(value.topics[topic].history.slice(1),previousHistory,'previous history is retained when adding an attempt');
          previousHistory=value.topics[topic].history;
          await clickCheck();await id('ans').press('Enter');assert.deepEqual(await saved(),value);report.repeatProtected++;
          const reloaded=await page.reload();
          if(production&&!offline)assert((await reloaded.body()).equals(expectedSource),'reload retains the verified production version');
          assert.equal(await id('total').innerText(),String(total));assert.equal(await id('right').innerText(),'1');
          assert.equal(await page.locator('#history .hist').count(),total);assert.deepEqual(await saved(),value);report.restored++;
        }
        if(offline)report.offlineCases++;
        else {
          const downloads=await page.locator('#download a[download]').evaluateAll(nodes=>nodes.map(n=>n.pathname));
          assert.deepEqual(downloads,[slug+'.html',slug+'-deepseek-prompt.md',slug+'-package.zip'].map(n=>downloadPath+n));
          assert.equal(await page.locator('#ege-return a').getAttribute('href'),origin+back);
          if(i===0&&submission==='click'){await page.locator('#ege-return a').click();await page.waitForURL(origin+back);assert((await page.locator('body').innerText()).length>60,'actual course loaded after return');}
        }
        report.journeys.push({surface,level,operation:op,submission,attempts:2,restored:true});
        report.cases++;
      } catch(error){throw new Error(surface+' '+level+' '+op+' '+submission+': '+error.message,{cause:error});} finally {await ctx.close();}
    }
  }
  assert.equal(report.cases,48);assert.equal(report.wrongChoicesCleared,288);assert.equal(report.offlineCases,32);
  assert.equal(report.blankProtected,48);assert.equal(report.repeatProtected,96);assert.equal(report.restored,96);
  for(const counter of ['correctClick','correctEnter','incorrectClick','incorrectEnter'])assert.equal(report[counter],24);
  assert.equal(report.incorrectNumber,48);assert.deepEqual(report.errors,[]);
  report.status='passed';
  console.log((production?'SIMPLE_EQUATIONS_PRODUCTION_OK':'SIMPLE_EQUATIONS_CHECK_OK')+': '+JSON.stringify(report));
}
main().catch(e=>{report.status='failed';report.errors.push(e.message);console.error(e);process.exitCode=1;}).finally(async()=>{
  await browser?.close();if(server)await new Promise(ok=>server.close(ok));fs.rmSync(temp,{recursive:true,force:true});
  report.finishedAt=new Date().toISOString();
  const out=path.join(root,'ege-quality-results');fs.mkdirSync(out,{recursive:true});
  fs.writeFileSync(path.join(out,production?'simple-equations-production.json':'simple-equations-browser.json'),JSON.stringify(report,null,2)+'\n');
});
