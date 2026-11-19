#!/usr/bin/env node
'use strict';
// Native screenshots only. This tool never imports media or writes product sources.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const http = require('node:http');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const json = file => JSON.parse(fs.readFileSync(file, 'utf8'));
function args(argv) {
  const result = {};
  for (let i=0;i<argv.length;i++) {
    const key=argv[i];
    assert(['--repo','--plan','--output','--clips','--check'].includes(key),`Unknown argument ${key}`);
    if(key==='--check') result.check=true; else { assert(argv[i+1] && !argv[i+1].startsWith('--')); result[key.slice(2)]=argv[++i]; }
  }
  return result;
}
function inside(root, relative) {
  assert(typeof relative==='string' && relative && !path.isAbsolute(relative));
  const file=path.resolve(root,relative);
  assert(file.startsWith(path.resolve(root)+path.sep),`Path escapes root: ${relative}`);
  assert(!relative.split('/').includes('..'));
  if(fs.existsSync(file)) assert(fs.realpathSync(file).startsWith(fs.realpathSync(root)+path.sep),'Symlink escapes root');
  return file;
}
function validatePlan(plan,repo) {
  assert.equal(plan.schemaVersion,1); assert.equal(plan.clips.length,8);
  const ids=new Set();
  for(const clip of plan.clips) {
    assert(/^[a-z0-9-]+$/.test(clip.id) && !ids.has(clip.id));ids.add(clip.id);
    assert(clip.url.startsWith('/') && !clip.url.startsWith('//') && !clip.url.includes('trainer-board'));
    assert(clip.frames.length>=3 && clip.frames.every(f=>f.caption && Number.isInteger(f.durationMs) && f.durationMs>=500 && f.durationMs%10===0));
    for(const frame of clip.frames) {
      for(const action of frame.actions||[]) {
        assert(['click','fill','select','press'].includes(action.type),'Only native UI actions are allowed');
        assert(typeof action.selector==='string' && action.selector);
        if(action.type==='press')assert(typeof action.key==='string' && (!action.repeat || Number.isInteger(action.repeat) && action.repeat<=1000));
      }
      for(const check of frame.assertions||[])assert(['count','text','value','attr','disabled','circle','sine'].includes(check.kind));
    }
    for(const file of clip.runtimeFiles) assert(plan.sourceHashes[file],`Unpinned source: ${file}`);
  }
  for(const [file,expected] of Object.entries(plan.sourceHashes)) assert.equal(sha(fs.readFileSync(inside(repo,file))),expected,`Runtime drift: ${file}`);
  return ids;
}
function locator(page,spec) { let l=page.locator(spec.selector); if(spec.nth!==undefined)l=l.nth(spec.nth); return l; }
async function action(page,a) {
  const l=locator(page,a);
  if(a.type==='click') await l.click();
  else if(a.type==='fill') await l.fill(a.value);
  else if(a.type==='select') await l.selectOption(a.value);
  else if(a.type==='press') { for(let n=0;n<(a.repeat||1);n++)await l.press(a.key); }
  else throw Error(`Unknown native action ${a.type}`);
}
async function verify(page,a) {
  const l=locator(page,a);
  if(a.kind==='count') assert.equal(await l.count(),a.value,a.selector);
  else if(a.kind==='text') assert((await l.innerText()).includes(a.value),`${a.selector}: missing ${a.value}`);
  else if(a.kind==='value') assert.equal(await l.inputValue(),a.value);
  else if(a.kind==='attr') assert.equal(await l.getAttribute(a.name),a.value);
  else if(a.kind==='disabled') assert.equal(await l.isDisabled(),a.value);
  else if(a.kind==='circle') {
    assert(Math.abs(Number(await l.getAttribute('cx'))-(230+130*Math.cos(a.angle)))<1e-6);
    assert(Math.abs(Number(await l.getAttribute('cy'))-(190-130*Math.sin(a.angle)))<1e-6);
  } else if(a.kind==='sine') {
    const result=await page.locator('#wvSvg').evaluate(svg=>{
      const c=svg.querySelector('circle'),p=svg.querySelector('circle[fill="var(--arc)"]'),g=svg.querySelector('circle[fill="var(--sin)"]');
      return {zero:Number(c.getAttribute('cy')),r:Number(c.getAttribute('r')),y:Number(p.getAttribute('cy')),gy:Number(g.getAttribute('cy'))};
    });
    const angle=Number(await page.locator('#wvT').inputValue());
    assert(Math.abs((result.zero-result.y)/result.r-Math.sin(angle))<1e-9);assert.equal(result.y,result.gy);
  } else throw Error(`Unknown assertion ${a.kind}`);
}
function serve(repo) {
  const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.gif':'image/gif','.woff2':'font/woff2'};
  const server=http.createServer((request,response)=>{
    try {
      assert(['GET','HEAD'].includes(request.method));
      let rel=decodeURIComponent(new URL(request.url,'http://localhost').pathname).replace(/^\//,'');
      if(!rel || rel.endsWith('/'))rel+='index.html';
      const file=inside(repo,rel); assert(fs.statSync(file).isFile());
      const data=fs.readFileSync(file); response.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
      response.end(request.method==='HEAD'?undefined:data);
    }catch {response.writeHead(404);response.end();}
  });
  return new Promise((resolve,reject)=>{server.on('error',reject);server.listen(0,'127.0.0.1',()=>resolve(server));});
}
async function main(argv) {
  const options=args(argv),repo=path.resolve(options.repo||path.join(__dirname,'..'));
  const planFile=path.resolve(options.plan||path.join(__dirname,'habr-gifs-capture-20261119.json'));
  const plan=json(planFile),allIds=validatePlan(plan,repo);
  const requested=options.clips?options.clips.split(','):[...allIds];
  assert(new Set(requested).size===requested.length && requested.every(id=>allIds.has(id)));
  if(options.check) {console.log(JSON.stringify({staticValid:true,browserRun:false,clips:requested,runtimeFiles:Object.keys(plan.sourceHashes).length,planSha256:sha(fs.readFileSync(planFile))}));return;}
  assert.equal(plan.integrationFrozen,true,'Freeze standalone help integration and refresh reviewed hashes before capture');
  assert.equal(process.env.GITHUB_ACTIONS,'true','Native capture runs only in GitHub Actions; use --check elsewhere');
  assert(options.output,'Explicit --output required');
  const out=path.resolve(options.output); assert(!out.startsWith(repo+path.sep),'Output must be outside repository');
  assert(!fs.existsSync(out),'Output must be a new directory; no resume or stale artifact reuse');fs.mkdirSync(out,{recursive:true});
  const git=(...a)=>cp.execFileSync('git',['-C',repo,...a],{encoding:'utf8'}).trim();
  const head=git('rev-parse','HEAD'),tree=git('rev-parse','HEAD^{tree}');
  assert.equal(process.env.GITHUB_SHA,head,'Workflow commit must equal recording checkout');
  assert(git('log','--format=%T','HEAD').split('\n').includes(plan.reviewedSourceTree),'Reviewed immutable source checkpoint tree must be in recording ancestry');
  for(const [file,expected] of Object.entries(plan.sourceHashes)) assert.equal(sha(cp.execFileSync('git',['-C',repo,'show',plan.reviewedSourceTree+':'+file],{maxBuffer:64*1024*1024})),expected,'Reviewed source checkpoint mismatch: '+file);
  assert.equal(git('status','--porcelain','--untracked-files=no'),'','Tracked sources must be clean');
  const encoder=path.join(__dirname,'build-habr-gifs.py');
  const receipt={schemaVersion:1,complete:false,head,tree,workflowRunId:process.env.GITHUB_RUN_ID,workflowRunAttempt:process.env.GITHUB_RUN_ATTEMPT,reviewedSourceTree:plan.reviewedSourceTree,clipList:requested,planSha256:sha(fs.readFileSync(planFile)),recorderSha256:sha(fs.readFileSync(__filename)),encoderSha256:sha(fs.readFileSync(encoder)),sourceHashes:plan.sourceHashes,records:[],startedAt:new Date().toISOString()};
  const save=()=>fs.writeFileSync(path.join(out,'capture-receipt.json'),JSON.stringify(receipt,null,2)+'\n');save();
  let server,browser;
  try {
    const {chromium}=require('playwright');receipt.playwrightVersion=require('playwright/package.json').version;
    assert.equal(receipt.playwrightVersion,plan.playwrightVersion);
    const browserExecutable=chromium.executablePath();
    receipt.chromiumExecutableSha256=sha(fs.readFileSync(browserExecutable));
    server=await serve(repo);const origin=`http://127.0.0.1:${server.address().port}`;
    browser=await chromium.launch({headless:true,executablePath:browserExecutable});receipt.browser=browser.version();
    for(const id of requested) {
      const clip=plan.clips.find(c=>c.id===id),dir=path.join(out,id);fs.mkdirSync(dir);
      const context=await browser.newContext({viewport:plan.viewport,deviceScaleFactor:1,locale:'ru-RU',timezoneId:'UTC',reducedMotion:'reduce',serviceWorkers:'block'});
      const networkErrors=[],blocked=[],loaded={},pageErrors=[];
      // All external traffic is refused. Local storage exists only inside this disposable synthetic context.
      await context.route('**/*',async route=>{
        const req=route.request(),url=new URL(req.url());
        if(url.origin!==origin || !['GET','HEAD'].includes(req.method())) {blocked.push({url:url.href,method:req.method()});await route.abort();return;}
        await route.continue();
      });
      const page=await context.newPage();page.on('pageerror',error=>pageErrors.push(error.message));
      page.on('response',response=>{
        const url=new URL(response.url());if(url.origin!==origin)return;
        let file=decodeURIComponent(url.pathname).slice(1);if(file.endsWith('/'))file+='index.html';
        if(response.status()!==200)networkErrors.push(`${response.status()} ${file}`);
        if(/\.(html|js|css|json|svg|woff2)$/.test(file)) {
          if(!plan.sourceHashes[file] || !clip.runtimeFiles.includes(file))networkErrors.push(`Unpinned loaded resource ${file}`);
          else loaded[file]=plan.sourceHashes[file];
        }
      });
      try {
        await page.goto(origin+clip.url,{waitUntil:'load'});
        await page.locator(clip.captureSelector).waitFor();
        await page.waitForLoadState('networkidle',{timeout:15000});
        const expectedUrl=new URL(clip.url,origin).href;assert.equal(page.url(),expectedUrl,'Exact source route changed');
        await page.evaluate(()=>document.fonts.ready);
        const record={id,url:clip.url,scenarioSha256:sha(JSON.stringify(clip)),sourceHashes:Object.fromEntries(clip.runtimeFiles.map(f=>[f,plan.sourceHashes[f]])),frames:[]};
        for(let index=0;index<clip.frames.length;index++) {
          const frame=clip.frames[index];
          assert.equal(page.url(),expectedUrl,'Source route changed before frame');
          for(const a of frame.actions||[])await action(page,a);
          for(const a of frame.assertions||[])await verify(page,a);
          assert.equal(page.url(),expectedUrl,'Source route changed during frame');
          // Two paint frames settle layout; no model mutation, synthetic input dispatch or hidden solution injection.
          await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
          const target=page.locator(frame.captureSelector||clip.captureSelector);
          await target.scrollIntoViewIfNeeded();
          const box=await target.boundingBox();assert(box && box.width>=200 && box.height>=100 && box.width<=plan.viewport.width && box.height<=1800,`Capture bounds ${id}`);
          const file=`frame-${String(index+1).padStart(2,'0')}.png`;
          await target.screenshot({path:path.join(dir,file),animations:'disabled',caret:'hide'});
          record.frames.push({file,actualPageUrl:page.url().replace(origin,''),caption:frame.caption,durationMs:frame.durationMs,sha256:sha(fs.readFileSync(path.join(dir,file))),actions:frame.actions||[],assertions:frame.assertions||[],bounds:box});
        }
        assert.deepEqual(pageErrors,[],`Page errors ${id}`);assert.deepEqual(networkErrors,[],`Network errors ${id}`);
        assert(!blocked.some(r=>!r.url.startsWith('https://fonts.googleapis.com/')&&!r.url.startsWith('https://fonts.gstatic.com/')),`Unexpected blocked external request ${id}: ${JSON.stringify(blocked)}`);
        record.loadedSources=loaded;record.blockedExternal=blocked;record.complete=true;
        fs.writeFileSync(path.join(dir,'recording.json'),JSON.stringify(record,null,2)+'\n');
        receipt.records.push({id,complete:true,recordingSha256:sha(fs.readFileSync(path.join(dir,'recording.json')))});save();
      } finally {await context.close();}
    }
    validatePlan(plan,repo);assert.equal(git('rev-parse','HEAD'),head);assert.equal(git('rev-parse','HEAD^{tree}'),tree);assert.equal(git('status','--porcelain','--untracked-files=no'),'');
    receipt.complete=true;receipt.finishedAt=new Date().toISOString();save();
  }catch(error){receipt.failure=String(error.stack||error);save();throw error;}
  finally {if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
}
module.exports={args,inside,validatePlan,sha};
if(require.main===module)main(process.argv.slice(2)).catch(e=>{console.error(e);process.exitCode=1;});
