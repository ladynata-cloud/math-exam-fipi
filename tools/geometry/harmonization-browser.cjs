'use strict';
// Real-browser acceptance. Run in CI when a local Chromium process is unavailable.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'../..'),C=require(ROOT+'/geometry-course/data/course.json');
const OUT=path.resolve(process.env.GEOMETRY_HARMONIZATION_ARTIFACTS||path.join(ROOT,'artifacts/geometry-harmonization'));
const KEY='mathExamGeometry.v1',HISTORY_KEY='mathExamGeometryCheckpoint.v1',OBSERVATION='Я изменил параметры модели, сравнил результат и проверил границу применимости.',traces=new WeakMap(),report={widths:[320,1280],height:900,topics:C.units.length,views:[],failures:[],consoleErrors:[],offline:[],naturalOffline:[],checkpointRecovery:null,state:[]};
fs.mkdirSync(OUT,{recursive:true});
let browser,server,page;
function issue(test,error,diagnostic){report.failures.push({test,error:String(error?.stack||error),...(diagnostic?{diagnostic}:{})});}
async function flush(p){await p.evaluate(()=>dispatchEvent(new Event('pagehide')));}
async function saved(p,id){return p.evaluate(([key,id])=>JSON.parse(localStorage.getItem(key)).units[id],[KEY,id]);}
async function captureEntry(context,{missingKeyOnObservation=null}={}){await context.addInitScript(({key,historyKey,missingKeyOnObservation})=>{
 // Observe the browser's record before the application can save its start event.
 // The optional fault belongs to one separate scenario. Its removal and the
 // following capture share one initializer, whose ordering is deterministic.
 const entry={url:location.href,checkpoint:null,fault:null};
 try{if(location.protocol==='file:')entry.checkpoint=history.state?.[historyKey]||null;
  if(missingKeyOnObservation&&entry.checkpoint?.local?.research?.observation===missingKeyOnObservation){const before=localStorage.getItem(key);localStorage.removeItem(key);entry.fault={kind:'isolated-missing-key',previousLength:before?.length||0};}
  entry.raw=localStorage.getItem(key);
 }catch(e){entry.error=String(e);}window.__geometryStorageAtEntry=entry;
 window.__geometryObservationInputs=[];addEventListener('input',e=>{if(e.target?.id==='observation'){window.__geometryObservationInputs.push({value:e.target.value,trusted:e.isTrusted,connected:e.target.isConnected,current:document.querySelector('#observation')===e.target,time:performance.now()});window.__geometryObservationInputs=window.__geometryObservationInputs.slice(-10);}},true);
 window.__geometrySnapshot=()=>{
 const id=document.querySelector('.topic-investigation')?.dataset.topic||window.COURSE_CONFIG?.unit.id,field=document.querySelector('#observation'),notice=document.querySelector('#storage-notice');
 const parse=raw=>{try{return raw?JSON.parse(raw).units?.[id]||null:null;}catch(e){return {error:String(e)};}};
 let raw=null,error=null,storageKeys=[];try{raw=localStorage.getItem(key);storageKeys=Object.keys(localStorage).sort().map(k=>({key:k,utf16Bytes:(localStorage.getItem(k)?.length||0)*2}));}catch(e){error=String(e);}
 return {id,url:location.href,observation:field?.value??null,connected:!!field?.isConnected,record:parse(raw),rawStorage:raw,storageLength:raw?.length||0,storageKeys,error,inputs:window.__geometryObservationInputs||[],notice:notice&&!notice.hidden?notice.textContent:null,entry:{url:window.__geometryStorageAtEntry?.url,error:window.__geometryStorageAtEntry?.error,raw:window.__geometryStorageAtEntry?.raw??null,record:parse(window.__geometryStorageAtEntry?.raw),checkpoint:window.__geometryStorageAtEntry?.checkpoint??null,fault:window.__geometryStorageAtEntry?.fault??null}};
 };
},{key:KEY,historyKey:HISTORY_KEY,missingKeyOnObservation});}
async function snapshot(p){return p.evaluate(()=>window.__geometrySnapshot());}
async function reloadObservation(p){await p.reload();const trace=traces.get(p)||{};trace.afterReload=await snapshot(p);traces.set(p,trace);assert.equal(trace.afterReload.observation,OBSERVATION,'Reloaded observation must equal the text that was typed');assert.equal(trace.afterReload.record?.research?.observation,OBSERVATION,'Reload must retain the typed observation in storage');}
function assertResearch(trace){assert.equal(trace.afterFill.observation,OBSERVATION,'The observation field must receive the typed text');assert.equal(trace.afterFlush.observation,OBSERVATION,'Saving must retain the text in the visible field');assert.equal(trace.afterFlush.record?.research?.observation,OBSERVATION,'Saved observation must equal the text that was typed');}
async function verifyResearchReload(p){let failure;try{assertResearch(traces.get(p));}catch(e){failure=e;}
 // Even a failed save gets a real reload, so its next document's pre-bootstrap bytes are observable.
 try{await reloadObservation(p);}catch(e){failure=failure||e;}if(failure)throw failure;
}
async function metrics(p,selector,action){return p.evaluate(({selector,action})=>{
 const svg=document.querySelector(selector);if(!svg)return {missing:selector};const r=svg.getBoundingClientRect(),rect=x=>({x:x.x,y:x.y,width:x.width,height:x.height,right:x.right,bottom:x.bottom});
 const texts=[...svg.querySelectorAll('text')].map(e=>{const b=e.getBoundingClientRect(),m=e.getScreenCTM();return {text:e.textContent,rect:rect(b),font:parseFloat(getComputedStyle(e).fontSize)*Math.hypot(m.c,m.d)};}).filter(t=>t.rect.width&&t.rect.height);
 const overlaps=[];for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++){const a=texts[i].rect,b=texts[j].rect,w=Math.min(a.right,b.right)-Math.max(a.x,b.x),h=Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y);if(w>2&&h>2&&w*h>Math.min(a.width*a.height,b.width*b.height)*.08)overlaps.push([texts[i].text,texts[j].text]);}
 const a=action&&document.querySelector(action)?.getBoundingClientRect();return {figure:rect(r),action:a?rect(a):null,minFont:Math.min(...texts.map(t=>t.font)),labels:texts.map(t=>({text:t.text,font:t.font})),clipped:texts.filter(t=>t.rect.x<r.x-2||t.rect.right>r.right+2||t.rect.y<r.y-2||t.rect.bottom>r.bottom+2).map(t=>t.text),overlaps,overflow:document.documentElement.scrollWidth-innerWidth};
 },{selector,action});}
function assess(name,m,{firstScreen=false,labels=true}={}){
 if(m.missing)return issue(name,'Missing '+m.missing);if(m.overflow>1)issue(name,'Horizontal overflow '+m.overflow);
 if(labels&&m.minFont<13.8)issue(name,'Effective SVG font '+m.minFont.toFixed(2)+'px (<14px)');
 if(m.clipped.length)issue(name,'Clipped labels: '+m.clipped.join(', '));if(m.overlaps.length)issue(name,'Overlapping labels: '+JSON.stringify(m.overlaps));
 if(firstScreen&&(m.figure.y<0||m.figure.bottom>900||!m.action||m.action.y<0||m.action.bottom>900))issue(name,'Condition / next action outside first screen: '+JSON.stringify({figure:m.figure,action:m.action}));
}
async function research(p,strict=true){await p.locator('.research-predict select').selectOption('unsure');await p.locator('.research-predict button').click();await p.locator('.research-controls [data-value]').first().evaluate(e=>{e.value=e.tagName==='SELECT'?[...e.options].find(o=>o.value!==e.value).value:(Number(e.value)===Number(e.max)?e.min:e.max);e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));});const trace={beforeFill:await snapshot(p)};traces.set(p,trace);const field=await p.locator('#observation').elementHandle();try{await p.locator('#observation').fill(OBSERVATION);
 // Capture both sides of the original immediate flush in one browser turn: no wait or retry can hide a late input.
 Object.assign(trace,await field.evaluate(e=>{const afterFill=window.__geometrySnapshot(),fieldAfterFill={value:e.value,connected:e.isConnected,current:e.ownerDocument.querySelector('#observation')===e};dispatchEvent(new Event('pagehide'));return {afterFill,fieldAfterFill,afterFlush:window.__geometrySnapshot()};}));if(strict)assertResearch(trace);
 }finally{await field.dispose();}}
async function submit(p,text){await p.locator('#answer').fill(text);await p.locator('#answer-form button').click();}
(async()=>{
 try{
 server=http.createServer((req,res)=>{let file=path.resolve(ROOT,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(ROOT+path.sep)){res.writeHead(403).end();return;}try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');const ext=path.extname(file);res.setHeader('Content-Type',ext==='.html'?'text/html; charset=utf-8':ext==='.js'?'application/javascript':ext==='.css'?'text/css':'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 const base='http://127.0.0.1:'+server.address().port+'/geometry-course/atlas/';
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||process.env.GEOMETRY_CHROMIUM||undefined});
 for(const width of report.widths){const context=await browser.newContext({viewport:{width,height:900}});await captureEntry(context);page=await context.newPage();page.on('pageerror',e=>report.consoleErrors.push(e.message));
  for(const u of C.units){const name=u.id+'@'+width;traces.delete(page);try{
   await page.goto(base+u.id+'.html');assert.equal(await page.locator('[aria-current=step]').getAttribute('data-stage'),'1');assert.equal(await page.locator('.topic-investigation').getAttribute('data-topic'),u.id);assert.equal(await page.locator('.research-controls').isVisible(),false);await page.evaluate(()=>scrollTo(0,0));
   const before=await metrics(page,'.research-figure svg','.research-predict button');assess(name+' research',before,{firstScreen:true});await page.screenshot({path:path.join(OUT,name+'-research.png')});
   await research(page,false);await page.evaluate(()=>scrollTo(0,0));const after=await metrics(page,'.research-figure svg','.research-controls [data-value]');assess(name+' action',after);const record=await saved(page,u.id);assert(record.research.opened&&record.research.changed);assert.equal(record.assisted,false);await verifyResearchReload(page);
   await page.locator('[data-stage="2"]').click();await page.evaluate(()=>scrollTo(0,0));const proof=await metrics(page,'#lesson figure svg','[data-proof]'),beforeProof=report.failures.length;assess(name+' proof',proof,{firstScreen:true});if(report.failures.length>beforeProof)await page.screenshot({path:path.join(OUT,name+'-proof-failure.png'),fullPage:true});
   await page.locator('[data-stage="3"]').click();await page.evaluate(()=>scrollTo(0,0));const task=await metrics(page,'#lesson figure svg','#answer-form button'),beforeTask=report.failures.length;assess(name+' guided condition',task,{firstScreen:true});if(report.failures.length>beforeTask)await page.screenshot({path:path.join(OUT,name+'-task-failure.png'),fullPage:true});
   report.views.push({id:u.id,width,research:before,action:after,proof,task});
  }catch(e){issue(name,e,traces.get(page));await page.screenshot({path:path.join(OUT,name+'-failure.png'),fullPage:true}).catch(()=>{});}}
  await context.close();console.log('Geometry visual routes completed at',width);
 }
 // Offline pages execute their actual embedded source with all HTTP(S) resources blocked.
 const offline=await browser.newContext({viewport:{width:320,height:900}});await captureEntry(offline);await offline.route(/^https?:\/\//,r=>r.abort());const p=await offline.newPage();p.on('pageerror',e=>report.consoleErrors.push(e.message));
 for(const u of C.units){traces.delete(p);try{await p.goto('file://'+ROOT+'/geometry-course/atlas/'+u.id+'.html');assert.equal(await p.locator('.topic-investigation').getAttribute('data-topic'),u.id);assert.equal(await p.locator('.research-figure svg').count(),1);await research(p,false);await verifyResearchReload(p);report.offline.push(u.id);}catch(e){issue('offline '+u.id,e,traces.get(p));await p.screenshot({path:path.join(OUT,u.id+'-offline-failure.png'),fullPage:true}).catch(()=>{});}}
 await offline.close();
 // A fresh context is shared by all 63 topics. In this separate sequence the
 // next browser operation after trusted fill is a real reload: no synthetic
 // pagehide, diagnostic call, delay, retry, or storage clearing intervenes.
 const natural=await browser.newContext({viewport:{width:320,height:900}});await captureEntry(natural);await natural.route(/^https?:\/\//,r=>r.abort());const np=await natural.newPage();np.on('pageerror',e=>report.consoleErrors.push(e.message));
 for(const u of C.units){const trace={id:u.id,reloads:[]};try{
  await np.goto('file://'+ROOT+'/geometry-course/atlas/'+u.id+'.html');await np.locator('.research-predict select').selectOption('unsure');await np.locator('.research-predict button').click();await np.locator('.research-controls [data-value]').first().evaluate(e=>{e.value=e.tagName==='SELECT'?[...e.options].find(o=>o.value!==e.value).value:(Number(e.value)===Number(e.max)?e.min:e.max);e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));});
  for(let round=1;round<=2;round++){const literal='Немедленный ввод '+round+' для темы '+u.id+'.';
   await np.locator('#observation').fill(literal);
   await np.reload();
   const after=await snapshot(np);trace.reloads.push({literal,after});assert.equal(after.observation,literal,'Natural reload must restore the visible last input');assert.equal(after.record?.research?.observation,literal,'Natural reload must restore the last input in localStorage');assert.equal(after.entry.checkpoint?.local?.research?.observation,literal,'The synchronous checkpoint must reach the next document before bootstrap');assert.equal(after.entry.checkpoint?.unit,u.id);assert.equal(after.record.stage,1);assert.equal(after.record.assisted,false);assert.equal(after.record.independent,0);
  }
  report.naturalOffline.push(trace);
 }catch(e){issue('natural offline '+u.id,e,trace);await np.screenshot({path:path.join(OUT,u.id+'-natural-offline-failure.png'),fullPage:true}).catch(()=>{});}}
 await natural.close();
 // Explicit fault injection is isolated from both ordinary 63-topic routes.
 // It removes the localStorage key at the next document's entry, after the old
 // page's native pagehide, while leaving the real history checkpoint intact.
 const faultLiteral='Проверка восстановления при отсутствующем ключе.',fault=await browser.newContext({viewport:{width:320,height:900}});await captureEntry(fault,{missingKeyOnObservation:faultLiteral});await fault.route(/^https?:\/\//,r=>r.abort());const fp=await fault.newPage();fp.on('pageerror',e=>report.consoleErrors.push(e.message));let faultTrace;
 try{
  await fp.goto('file://'+ROOT+'/geometry-course/atlas/segments.html#checkpoint');await fp.evaluate(()=>history.replaceState({...history.state,foreignFixture:{route:'kept',values:[1,2,3]}},''));
  const start=await fp.evaluate(()=>({url:location.href,length:history.length}));await fp.locator('[data-stage="4"]').click();
  await fp.locator('#answer').fill('Мой самостоятельный черновик');
  await fp.reload();
  assert.equal(await fp.locator('#answer').inputValue(),'Мой самостоятельный черновик');assert.equal((await saved(fp,'segments')).draft,'Мой самостоятельный черновик');assert.equal((await saved(fp,'segments')).assisted,false);assert.equal((await saved(fp,'segments')).independent,0);
  await fp.locator('[data-stage="5"]').click();
  await fp.locator('#written').fill('Моё незавершённое доказательство.');
  await fp.reload();
  assert.equal(await fp.locator('#written').inputValue(),'Моё незавершённое доказательство.');assert.equal((await saved(fp,'segments')).written,'Моё незавершённое доказательство.');
  await fp.locator('[data-stage="1"]').click();await fp.locator('.research-predict select').selectOption('unsure');await fp.locator('.research-predict button').click();await fp.locator('.manual-research>summary').click();await fp.locator('#geo-board [data-tool="midpoint"]').click();await fp.locator('#geo-board .extra-tools>summary').click();for(const id of ['A','B']){await fp.locator('#geo-board .point-select').selectOption(id);await fp.locator('#geo-board [data-act="select"]').click();}
  await fp.locator('#legacy-observation').fill('Прежняя запись к чертежу.');const drawing=await fp.evaluate(key=>history.state[key].local.drawing,HISTORY_KEY);assert.equal(drawing.points.length,3);
  await fp.locator('#observation').fill(faultLiteral);
  await fp.reload();
  faultTrace=await snapshot(fp);const result=faultTrace.record;assert.equal(faultTrace.entry.fault?.kind,'isolated-missing-key');assert.equal(faultTrace.entry.raw,null);assert.equal(faultTrace.entry.record,null);assert.equal(faultTrace.entry.checkpoint?.local?.research?.observation,faultLiteral);assert.equal(faultTrace.observation,faultLiteral);assert.equal(result.research.observation,faultLiteral);assert.equal(result.draft,'Мой самостоятельный черновик');assert.equal(result.written,'Моё незавершённое доказательство.');assert.equal(result.observation,'Прежняя запись к чертежу.');assert.deepEqual(result.drawing,drawing);assert.equal(result.stage,1);assert.equal(result.assisted,false);assert.equal(result.independent,0);
  const foreign=await fp.evaluate(()=>({url:location.href,length:history.length,value:history.state.foreignFixture}));assert.equal(foreign.url,start.url);assert.equal(foreign.length,start.length);assert.deepEqual(foreign.value,{route:'kept',values:[1,2,3]});report.checkpointRecovery={status:'PASS',id:'segments',kind:'isolated-missing-key',naturalFields:['draft','written'],after:faultTrace};
 }catch(e){issue('isolated offline checkpoint recovery',e,faultTrace||await snapshot(fp).catch(()=>null));await fp.screenshot({path:path.join(OUT,'checkpoint-recovery-failure.png'),fullPage:true}).catch(()=>{});}finally{await fault.close();}
 // Legacy stages are seeded before the first application script, never by changing their numeric meaning.
 for(let stage=0;stage<6;stage++){const ctx=await browser.newContext({viewport:{width:320,height:900}});await ctx.addInitScript(({KEY,stage})=>{if(!sessionStorage.getItem('legacy-fixture')){localStorage.setItem(KEY,JSON.stringify({version:1,units:{pythagoras:{stage,seed:8,draft:'14/4',written:'Старое письменное решение',observation:'Прежнее наблюдение',attempts:7,independent:3,complete:true}}}));sessionStorage.setItem('legacy-fixture','1');}},{KEY,stage});const p=await ctx.newPage();try{await p.goto(base+'pythagoras.html');const s=await saved(p,'pythagoras');assert.equal(s.stage,stage);assert.equal(s.seed,8);assert.equal(s.practiceVersion,0);assert.equal(s.draft,'14/4');assert.equal(s.written,'Старое письменное решение');assert.equal(s.independent,3);assert.equal(await p.locator('[aria-current=step]').getAttribute('data-stage'),String(stage));report.state.push('legacy-stage-'+stage);}catch(e){issue('legacy stage '+stage,e);}await ctx.close();}
 const ctx=await browser.newContext({viewport:{width:320,height:900},acceptDownloads:true});await captureEntry(ctx);const a=await ctx.newPage(),b=await ctx.newPage();
 try{
  await a.goto(base+'pythagoras.html');await a.locator('[data-stage="4"]').click();await a.locator('[data-action="new-task"]').click();let initial=await saved(a,'pythagoras');assert.equal(initial.seed,3);
  for(const value of ['', 'sqrt(', '(1/0)^0','sqrt(-4)^0','1/(1/0)']){await submit(a,value);const s=await saved(a,'pythagoras');assert.equal(s.attempts,0);assert.equal(s.checked,false);assert.equal(s.assisted,false);assert.equal(await a.locator('#hint-box').innerText(),'');}
  await a.locator('#answer').fill('Мой черновик');await a.locator('[data-stage="1"]').click();await research(a);await a.locator('[data-stage="4"]').click();assert.equal((await saved(a,'pythagoras')).seed,3);assert.equal(await a.locator('#answer').inputValue(),'Мой черновик');assert.equal((await saved(a,'pythagoras')).assisted,false);await a.reload();assert.equal(await a.locator('#answer').inputValue(),'Мой черновик');
  await b.goto(base+'pythagoras.html');await b.locator('[data-action="show-solution"]').click();const correct=await a.evaluate(()=>GeoTasks.format(GeoPractice.task('pythagoras',JSON.parse(localStorage.getItem(GeoStore.KEY)).units.pythagoras.seed).answer));await submit(a,correct);await a.waitForTimeout(40);const merged=await saved(a,'pythagoras');assert.equal(merged.assisted,true);assert.equal(merged.independent,0);assert.equal(merged.checked,false);assert.equal(merged.recoveries.at(-1).draft,correct);report.state.push('format-domain-no-penalty','research-resumes-attempt','stale-success-after-help');
  await a.goto(base+'segments.html');await a.locator('[data-stage="4"]').click();const q=await a.locator('.task-question').innerText();for(let i=0;i<3;i++)await a.locator('[data-action="new-task"]').click();assert.equal(await a.locator('.task-question').innerText(),q);assert((await saved(a,'segments')).repeatedTask);await a.reload();assert((await saved(a,'segments')).repeatedTask);report.state.push('new-topic-repeated-condition');
  await a.locator('[data-stage="1"]').click();await a.locator('.manual-research>summary').click();await a.locator('#geo-board [data-tool="midpoint"]').click();await a.locator('#geo-board .extra-tools>summary').click();for(const id of ['A','B']){await a.locator('#geo-board .point-select').selectOption(id);await a.locator('#geo-board [data-act="select"]').click();}await flush(a);const drawing=(await saved(a,'segments')).drawing;assert.equal(drawing.points.length,3);await a.reload();assert.deepEqual((await saved(a,'segments')).drawing,drawing);report.state.push('manual-drawing-restored');
  await a.locator('[data-stage="5"]').click();await b.goto(base+'segments.html');await b.locator('[data-stage="5"]').click();await a.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===GeoStore.KEY)throw new DOMException('Quota','QuotaExceededError');return original.call(this,k,v);};});await a.locator('#written').fill('Работа A, оставшаяся при квоте.');await flush(a);await b.locator('#written').fill('Более свежая работа B.');await flush(b);const waiting=a.waitForEvent('download');await a.locator('#export-progress').click();const download=await waiting,json=JSON.parse(fs.readFileSync(await download.path(),'utf8'));assert.equal(json.units.segments.written,'Более свежая работа B.');assert(json.units.segments.recoveries.some(r=>r.written==='Работа A, оставшаяся при квоте.'));assert.equal(await a.locator('#storage-notice').isVisible(),true);report.state.push('quota-export-with-newer-tab');
 }catch(e){issue('state scenarios',e);await a.screenshot({path:path.join(OUT,'state-failure.png'),fullPage:true}).catch(()=>{});}finally{await ctx.close();}
 assert.equal(report.consoleErrors.length,0,report.consoleErrors.join('\n'));
 }catch(e){issue('browser runtime',e);}
 finally{if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));report.status=report.failures.length?'FAIL':'PASS';fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,viewports:report.widths,views:report.views.length,offline:report.offline.length,naturalOffline:report.naturalOffline.length,checkpointRecovery:report.checkpointRecovery?.status||'NOT_PASSED',state:report.state,failures:report.failures.length,artifacts:OUT},null,2));if(report.failures.length){console.error(JSON.stringify(report.failures,null,2));process.exitCode=1;}}
})();
