'use strict';
// A read-only acceptance audit of real board sessions in a local checkout.
// No synthetic state is injected, no live credentials or paid services used.
// The only mutation is ordinary ownership transfer in temporary local rooms.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const http=require('node:http'),net=require('node:net'),os=require('node:os');
const {spawn,execFileSync}=require('node:child_process');
const {project,mirrors,plan,args}=require('./board-fleet-plan.cjs');
const ROOT=fs.realpathSync(path.resolve(__dirname,'..'));
const HOST='127.0.0.1',BOARD='/trainers/trainer-board.html';
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.woff':'font/woff','.woff2':'font/woff2','.wasm':'application/wasm'};
async function listen(server){
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,HOST,resolve);});
  return 'http://'+HOST+':'+server.address().port;
}
async function localSite(){
  const server=http.createServer((req,res)=>{
    try{
      if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
      const u=new URL(req.url,'http://'+HOST);let file=path.resolve(ROOT,'.'+decodeURIComponent(u.pathname));
      if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
      file=fs.realpathSync(file);
      if(!file.startsWith(ROOT+path.sep)||!fs.statSync(file).isFile())throw Error('Invalid file');
      res.writeHead(200,{'Content-Type':MIME[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
      if(req.method==='HEAD'){res.end();return;}
      const stream=fs.createReadStream(file);stream.on('error',()=>res.destroy());stream.pipe(res);
    }catch(_){res.writeHead(404).end();}
  });
  return {server,origin:await listen(server)};
}
async function localBackend(temp){
  const probe=net.createServer();await listen(probe);const port=probe.address().port;
  await new Promise(resolve=>probe.close(resolve));
  // Do not inherit production persistence, API credentials or custom registries.
  const env={HOST,PORT:String(port),NODE_ENV:'test',PATH:process.env.PATH||'',HOME:temp,TMPDIR:temp};
  const child=spawn(process.execPath,['index.js'],{cwd:path.join(ROOT,'board-server'),env,stdio:['ignore','ignore','pipe']});
  child.stderr.resume();
  const origin='http://'+HOST+':'+port;
  for(let i=0;i<160;i++){
    if(child.exitCode!==null)throw Error('LOCAL_SERVER_EXIT');
    try{const response=await fetch(origin+'/health',{signal:AbortSignal.timeout(500)});if(response.ok)return{child,origin};}catch(_){}
    await delay(75);
  }
  child.kill();throw Error('LOCAL_SERVER_START_TIMEOUT');
}
function installObservation(){
  // The listener observes the real SDK wire messages without patching the SDK.
  // Raw synthetic states remain only in ephemeral browser memory, never reports.
  const probe={count:0,last:null,diagnostics:[]};window.__boardFleetObservation=probe;
  window.addEventListener('mathexam:bridge-diagnostic',e=>{
    const code=String(e.detail?.code||'unknown');if(probe.diagnostics.length<30)probe.diagnostics.push(code.slice(0,80));
  });
  if(window===window.top)window.addEventListener('message',event=>{
    const child=document.getElementById('trainerFrame');
    const data=event.data;
    if(event.source===child?.contentWindow&&event.origin===location.origin&&data?.type==='mathexam:trainer-state'){
      probe.count++;
      probe.last={trainerId:data.trainerId,trainerVersion:data.trainerVersion,stateSchemaVersion:data.stateSchemaVersion,protocolVersion:data.protocolVersion,state:data.state};
    }
  });
}
async function contextFor(browser,site,backend,external){
  const context=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  await context.addInitScript(installObservation);
  // External fetches, including analytics, models and production cabinet APIs,
  // never leave this isolated test. Count origins, not URLs or request payloads.
  await context.route('**/*',route=>{
    let u;try{u=new URL(route.request().url());}catch(_){return route.abort();}
    if(u.origin===site||u.origin===backend)return route.continue();
    if(['data:','blob:','about:'].includes(u.protocol))return route.continue();
    if(external.size<30)external.add(u.origin);
    return route.abort('blockedbyclient');
  });
  // WebSockets need their own interception; HTTP routing does not cover them.
  await context.routeWebSocket('**/*',ws=>{
    let u;try{u=new URL(ws.url());}catch(_){ws.close();return;}
    const httpOrigin=(u.protocol==='wss:'?'https:':'http:')+'//'+u.host;
    if(httpOrigin===site||httpOrigin===backend){ws.connectToServer();return;}
    if(external.size<30)external.add(u.origin);
    ws.close({code:1000,reason:'External network disabled in board fleet audit'});
  });
  return context;
}
async function accepted(page,id,owner){
  await page.waitForFunction(({id,owner})=>
    typeof roomStateReceived!=='undefined'&&roomStateReceived&&shared.connected&&
    document.querySelector('#mirrorStatus')?.dataset.mirrorStatus==='connected'&&
    bridgeSession?.hydrated&&bridgeSession.trainerId===id&&canWrite()===owner,
    {id,owner},{timeout:22000});
}
async function wire(page,id,after){
  await page.waitForFunction(({id,after})=>
    window.__boardFleetObservation?.count>after&&window.__boardFleetObservation.last?.trainerId===id,
    {id,after},{timeout:12000});
  return page.evaluate(()=>window.__boardFleetObservation.last);
}
const counter=page=>page.evaluate(()=>window.__boardFleetObservation?.count||0);
async function sameAccepted(page,id,state){
  await page.waitForFunction(({id,state})=>latestTrainerState?.trainerId===id&&
    JSON.stringify(latestTrainerState.state)===JSON.stringify(state),{id,state},{timeout:12000});
}
function validateWire(payload,row){
  assert.equal(payload.trainerId,row.trainerId);assert.equal(payload.trainerVersion,row.version);
  assert.equal(payload.protocolVersion,row.bridgeProtocolVersion);
  assert.equal(payload.stateSchemaVersion,row.stateSchemaVersion);
  assert.ok(payload.state&&typeof payload.state==='object','structured state exists');
}
async function diagnostics(page,file){
  const frame=page.frames().find(item=>{try{return new URL(item.url()).pathname==='/'+file;}catch(_){return false;}});
  if(!frame)return ['trainer-frame-missing'];
  return frame.evaluate(()=>window.__boardFleetObservation?.diagnostics||[]).catch(()=>['diagnostic-read-failed']);
}
function cleanError(error){
  // Never write Playwright call logs, invitation URLs or state payloads.
  return error?.name==='TimeoutError'?'TimeoutError':
    error?.name==='AssertionError'?'AssertionError':
    (typeof error?.name==='string'&&/^[a-zA-Z][a-zA-Z0-9_]{0,60}$/.test(error.name)?error.name:'Error');
}
async function probe(browser,site,backend,row){
  const started=Date.now(),external=new Set(),contexts=[],pages=[],errors=[],data={trainerId:row.trainerId,file:row.file,status:'FAIL',stage:'init'};
  const stage=name=>{data.stage=name;};
  try{
    const tc=await contextFor(browser,site,backend,external);contexts.push(tc);
    const sc=await contextFor(browser,site,backend,external);contexts.push(sc);
    const teacher=await tc.newPage(),student=await sc.newPage();pages.push(teacher,student);
    for(const [i,page] of pages.entries()){
      page.setDefaultTimeout(12000);page.setDefaultNavigationTimeout(22000);
      page.on('pageerror',error=>{if(errors.length<30)errors.push({client:i===0?'teacher':'pupil',kind:cleanError(error)});});
    }
    stage('teacher-entry');
    const start=new URL(BOARD,site);
    start.searchParams.set('server',backend);start.searchParams.set('trainer','/'+row.file);
    await teacher.goto(start.href,{waitUntil:'domcontentloaded'});
    await teacher.waitForFunction(file=>canonicalTrainerFileFromUrl(state.trainerUrl)===file&&trainerRegistry.status==='ready',row.file,{timeout:22000});
    stage('teacher-room');
    await teacher.locator('#openShare').click();await teacher.locator('#createRoom').click();
    await teacher.waitForFunction(()=>document.querySelector('#studentLink')?.value.includes('room='));
    const invitation=new URL(await teacher.locator('#studentLink').inputValue());
    assert.equal(invitation.origin,site,'local invitation only');
    await teacher.keyboard.press('Escape');
    await accepted(teacher,row.trainerId,true);
    stage('teacher-state');
    const before=await counter(teacher);
    await teacher.evaluate(()=>requestTrainerState());
    const first=await wire(teacher,row.trainerId,before);validateWire(first,row);
    await sameAccepted(teacher,row.trainerId,first.state);
    data.stateBytes=Buffer.byteLength(JSON.stringify(first.state),'utf8');
    stage('pupil-entry');
    await student.goto(invitation.href,{waitUntil:'domcontentloaded'});
    await accepted(student,row.trainerId,false);
    await sameAccepted(student,row.trainerId,first.state);
    assert.equal(await student.locator('#trainerFrame').evaluate(el=>el.inert),true);
    await teacher.waitForFunction(()=>shared.participants.some(p=>p.role==='student'&&(p.connected||Number(p.onlineCount)>0)),null,{timeout:12000});
    stage('handoff');
    const pupilBefore=await counter(student);
    await teacher.locator('#boardControlToggle').click();
    await Promise.all([accepted(student,row.trainerId,true),accepted(teacher,row.trainerId,false)]);
    await student.evaluate(()=>requestTrainerState());
    const second=await wire(student,row.trainerId,pupilBefore);validateWire(second,row);
    // A pupil re-serializes actual applied state, not merely the host's receipt.
    assert.deepEqual(second.state,first.state,'pupil adapter reconstructs accepted state');
    await sameAccepted(teacher,row.trainerId,second.state);
    stage('pupil-reload');
    const beforeReload=await diagnostics(student,row.file);
    if(beforeReload.length)data.pupilDiagnosticsBeforeReload=beforeReload;
    await student.reload({waitUntil:'domcontentloaded'});
    await accepted(student,row.trainerId,true);await sameAccepted(student,row.trainerId,second.state);
    const reloadCount=await counter(student);await student.evaluate(()=>requestTrainerState());
    const restored=await wire(student,row.trainerId,reloadCount);validateWire(restored,row);
    assert.deepEqual(restored.state,second.state,'reload restores the actual adapter state');
    stage('return-control');
    await teacher.locator('#boardControlToggle').click();
    await Promise.all([accepted(teacher,row.trainerId,true),accepted(student,row.trainerId,false)]);
    stage('diagnostics');
    data.teacherDiagnostics=await diagnostics(teacher,row.file);data.pupilDiagnostics=await diagnostics(student,row.file);
    assert.deepEqual([...data.teacherDiagnostics,...(data.pupilDiagnosticsBeforeReload||[]),...data.pupilDiagnostics],[],'SDK diagnostic events');
    assert.deepEqual(errors,[],'uncaught browser errors');
    data.status='PASS';stage('complete');
  }catch(error){
    data.error=cleanError(error);
    for(const [index,page] of pages.entries()){
      const info=await page.evaluate(()=>({mirror:document.querySelector('#mirrorStatus')?.dataset.mirrorStatus||'missing',connected:typeof shared!=='undefined'&&!!shared.connected,accepted:typeof roomStateReceived!=='undefined'&&!!roomStateReceived,hydrated:typeof bridgeSession!=='undefined'&&!!bridgeSession?.hydrated})).catch(()=>({mirror:'unavailable'}));
      data[index===0?'teacher':'pupil']=info;
      data[index===0?'teacherDiagnostics':'pupilDiagnostics']=await diagnostics(page,row.file).catch(()=>['diagnostic-read-failed']);
    }
  }finally{
    data.durationMs=Date.now()-started;data.externalOrigins=[...external].sort();data.pageErrors=errors;
    await Promise.allSettled(contexts.map(context=>context.close()));
  }
  return data;
}
function report(result,index){
  const folder=process.env.BOARD_FLEET_REPORT_DIR||path.join(ROOT,'artifacts','board-fleet');
  fs.mkdirSync(folder,{recursive:true});
  fs.writeFileSync(path.join(folder,'shard-'+index+'.json'),JSON.stringify(result,null,2)+'\n');
  if(process.env.GITHUB_STEP_SUMMARY){
    const text=['### Board fleet audit — shard '+index,'','Mode: '+result.mode+'; selected '+result.selected+'; checked '+result.rows.length,'','| Trainer | Result | Stage |','|---|---|---|',...result.rows.map(row=>'| '+row.trainerId+' | '+row.status+' | '+row.stage+' |'),''].join('\n');
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,text);
  }
}
async function main(){
  const opt=args(process.argv.slice(2)),selection=plan(opt.base,opt.index,opt.total,opt.all);
  if(opt.planOnly){console.log(selection.entries.length);return;}
  const result={schemaVersion:1,commit:execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim(),base:opt.base||null,mode:selection.mode,selected:selection.total,shard:opt.index,shards:opt.total,plannedIds:selection.entries.map(row=>row.trainerId),rows:[]};
  if(!selection.entries.length){report(result,opt.index);return;}
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'mathexam-board-fleet-'));
  let site,backend,browser;
  try{
    site=await localSite();backend=await localBackend(temp);
    const registry=await(await fetch(backend.origin+'/api/trainer-registry')).json();
    assert.deepEqual(registry.trainers,mirrors(selection.manifest).map(project),'actual runtime registry equals committed mirror metadata');
    const {chromium}=require('playwright');
    browser=await chromium.launch({headless:true,args:['--disable-background-networking']});
    for(const row of selection.entries){
      const checked=await probe(browser,site.origin,backend.origin,row);result.rows.push(checked);
      console.log(checked.status+' '+checked.trainerId+' '+checked.stage+' '+checked.durationMs+'ms');
      report(result,opt.index);
    }
    if(result.rows.some(row=>row.status!=='PASS'))process.exitCode=1;
  }catch(error){
    result.infrastructureError=cleanError(error);process.exitCode=1;
  }finally{
    report(result,opt.index);
    if(browser)await browser.close();
    if(backend){backend.child.kill();await Promise.race([new Promise(resolve=>backend.child.once('exit',resolve)),delay(2000)]);}
    if(site){site.server.closeAllConnections();await new Promise(resolve=>site.server.close(resolve));}
    fs.rmSync(temp,{recursive:true,force:true});
  }
}
if(require.main===module)main().catch(error=>{console.error('BOARD_FLEET_INFRASTRUCTURE_FAILURE '+cleanError(error));process.exitCode=1;});
