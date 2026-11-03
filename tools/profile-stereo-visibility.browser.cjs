'use strict';
// Real public pages and controls, isolated synthetic saved attempts, actual SVG
// pixels. Numerical geometry correctness is covered by the independent ray gate.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const out = path.resolve(process.env.VISIBILITY_PROFILE_ARTIFACTS || 'artifacts/visibility-profile');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const data = {};
vm.runInNewContext(fs.readFileSync(path.join(root, 'ege-profil/start/stereo-data.js'), 'utf8'), data);
const t14Source=fs.readFileSync(path.join(root,'ege-profil/trainers/stereo-t14.html'),'utf8');
const t14Data={module:{exports:{}}};
vm.runInNewContext(t14Source.match(/<script>\s*(\/\* ================= ГЕОМЕТРИЯ[\s\S]*?)<\/script>/)[1],t14Data);
const t14Problems=t14Data.module.exports.PROBLEMS;
const cases = [
  {lesson:'stereo-box',id:'stereo-box-diagonal',hidden:'diagonal',step:1,pixels:true},
  {lesson:'stereo-cube',id:'stereo-cube-volume',step:0},
  {lesson:'stereo-prism',id:'stereo-prism-volume',step:0},
  {lesson:'stereo-pyramid',id:'stereo-pyramid-volume',hidden:'height',step:1},
  {lesson:'stereo-cylinder',id:'stereo-cylinder-volume',hidden:'height',step:1},
  {lesson:'stereo-cone',id:'stereo-cone-volume',hidden:'height',step:1},
  {lesson:'stereo-sphere',id:'stereo-sphere-area',hidden:'radius',step:0,equator:true},
  {lesson:'stereo-sphere',id:'stereo-sphere-diameter',hidden:'diameter',step:0,equator:true},
  {lesson:'stereo-compound',id:'stereo-compound-cut-box',step:1},
  {lesson:'stereo-compound',id:'stereo-compound-tube',step:1,tube:true},
  {lesson:'stereo-compound',id:'stereo-compound-cone-cylinder',hidden:'cone-height',step:1}
];
const t14Cases = [
  {id:'t1',index:0,hidden:'A-C1',proof:2,pixels:true},
  {id:'t2',index:1,hidden:'S-O',proof:1},
  {id:'t3',index:2,hidden:'C-M',proof:0},
  {id:'t4',index:3,hidden:'E-F',proof:0},
  {id:'t5',index:4,hidden:'A-M',proof:0},
  {id:'t6',index:5,hidden:'S-O',proof:1}
];
const entries = ['ege-profil/start/index.html','ege-profil/trainers/stereo-t14.html'];
const sourceFiles = new Set([...entries, 'stereo-course/assets/task-scene-viewer.js', 'tools/profile-stereo-visibility.browser.cjs']);
for (const entry of entries) {
  const html=fs.readFileSync(path.join(root,entry),'utf8');
  for(const m of html.matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)="([^"]+)"/g)) {
    const url=new URL(m[1],'http://local/'+entry);
    if(url.hostname==='local' && /\.(?:js|css)$/.test(url.pathname))sourceFiles.add(url.pathname.slice(1));
  }
}
const sourceHashes=Object.fromEntries([...sourceFiles].sort().map(file=>[file,hash(fs.readFileSync(path.join(root,file)))]));
const evidence={schemaVersion:1,completed:false,commit:process.env.GITHUB_SHA||null,sourceHashes,widths:[320,1280],
  fixture:'Fresh isolated browser contexts resume valid synthetic attempts for existing authored tasks. All rendering and controls are the actual public pages.',
  journeys:[],screenshots:[],pixelControls:[],errors:[]};
const save=()=>fs.writeFileSync(path.join(out,'profile-visibility-evidence.json'),JSON.stringify(evidence,null,2)+'\n');
const taskFor=item=>data.ProfileLessons.find(l=>l.id===item.lesson)?.tasks.find(t=>t.id===item.id);
function checkGeometry(result,label){
  assert(result.lines.length>5,label+': actual geometric strokes');
  assert(result.lines.some(n=>n.hidden)&&result.lines.some(n=>!n.hidden),label+': visible and hidden intervals');
  assert.deepEqual(result.layers,['hidden','visible'],label+': hidden strokes painted first');
  for(const line of result.lines){
    assert(Number.isFinite(line.start)&&Number.isFinite(line.end)&&line.start>=0&&line.end<=1&&line.end>line.start,label+': finite partition');
    assert(line.xy.length===4&&line.xy.every(Number.isFinite),label+': finite straight SVG stroke');
    const dashed=line.dash!=='none'&&line.dash.split(/[ ,]+/).some(n=>parseFloat(n)>0);
    assert.equal(dashed,line.hidden||line.ghost,label+': computed dash state '+line.key);
    assert(Number.isFinite(line.width)&&line.width>0,label+': positive computed width');
  }
  assert(result.labels.length,label+': visible diagram labels');
}
function checkInterior(lines,label){
  assert(lines.length,label+': required interior construction exists');
  assert(lines.filter(n=>n.hidden).reduce((sum,n)=>sum+n.end-n.start,0)>1-1e-6,label+': interior construction is hidden');
  for(const n of lines.filter(n=>!n.hidden))assert(Math.hypot(n.xy[2]-n.xy[0],n.xy[3]-n.xy[1])<=.001,label+': no measurable solid interior interval');
}
function checkPixelChange(result,label){assert(result.width>20&&result.height>20&&result.changed>=5,label+': actual dash gaps differ from an intentionally solid stroke');}
function preflight(){
  for(const item of cases){const task=taskFor(item);assert(task&&task.steps[item.step],item.id+': existing authored task/step');}
  for(const item of t14Cases){const task=t14Problems[item.index];assert.equal(task.id,item.id,'T14 actual authored task order');assert(task.proof[item.proof].hl.includes(item.hidden.replace('-','')),'T14 authored proof highlights target construction');}
  const good={lines:[...Array.from({length:6},(_,i)=>({key:String(i),hidden:!!(i%2),ghost:false,start:0,end:1,xy:[0,i,10,i],dash:i%2?'5px, 5px':'none',width:2.4}))],layers:['hidden','visible'],labels:['A']};
  checkGeometry(good,'valid control');
  assert.throws(()=>checkGeometry({...good,lines:good.lines.map(n=>({...n,dash:'none'}))},'all-solid negative'),/computed dash state/);
  assert.throws(()=>checkGeometry({...good,layers:['visible','hidden']},'layer negative'),/hidden strokes painted first/);
  assert.throws(()=>checkInterior([],'missing negative'),/required interior/);
  assert.throws(()=>checkInterior([{...good.lines[0]}],'solid interior negative'),/interior construction is hidden/);
  assert.throws(()=>checkInterior([{...good.lines[1],end:1-1e-8},{...good.lines[0],start:1-1e-8,xy:[0,0,.01,0]}],'tiny solid negative'),/no measurable solid/);
  assert.throws(()=>checkPixelChange({width:100,height:100,changed:0},'identical-pixels negative'),/actual dash gaps/);
  console.log('PROFILE_VISIBILITY_BROWSER_PREFLIGHT_OK: 11 authored profile tasks, all 6 T14 tasks, 320/1280, six negative controls');
}
preflight();if(process.env.VISIBILITY_PROFILE_CHECK_ONLY==='1')process.exit(0);
let server,browser,context,page;
async function host(){
  server=http.createServer((req,res)=>{try{
    const pathname=decodeURIComponent(new URL(req.url,'http://local').pathname);
    if(pathname==='/favicon.ico')return res.writeHead(204).end();
    let file=path.resolve(root,'.'+pathname);if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
    if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
    res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');
    res.setHeader('Cache-Control','no-store');res.end(fs.readFileSync(file));
  }catch(_){res.writeHead(404).end();}});
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  return 'http://127.0.0.1:'+server.address().port;
}
async function openPage(width){
  context=await browser.newContext({viewport:{width,height:1000},deviceScaleFactor:1,reducedMotion:'reduce'});
  page=await context.newPage();page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(30000);
  page.on('pageerror',error=>evidence.errors.push(error.message));
  page.on('response',response=>{if(new URL(response.url()).hostname==='127.0.0.1'&&response.status()>=400)evidence.errors.push('HTTP '+response.status()+' '+new URL(response.url()).pathname);});
  return page;
}
async function settle(){await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
async function geometry(selector){return page.locator(selector).evaluate(svg=>({
  lines:[...svg.querySelectorAll('[data-hidden]')].map(node=>{
    const css=getComputedStyle(node),xy=node.tagName==='line'?['x1','y1','x2','y2'].map(k=>+node.getAttribute(k)):(node.getAttribute('d')||'').match(/[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/ig)?.map(Number)||[];
    return {key:node.getAttribute('data-segment')||node.getAttribute('data-source-stroke'),feature:node.getAttribute('data-feature')||'',hidden:node.dataset.hidden==='true',ghost:node.dataset.ghost==='true',start:+node.dataset.partStart,end:+node.dataset.partEnd,xy,dash:css.strokeDasharray,offset:css.strokeDashoffset,width:parseFloat(css.strokeWidth),color:css.stroke};
  }),layers:[...svg.querySelectorAll('[data-visibility-layer]')].map(n=>n.dataset.visibilityLayer),
  labels:[...svg.querySelectorAll('text')].map(n=>n.textContent.trim()).filter(Boolean),yaw:svg.dataset.yaw||null,pitch:svg.dataset.pitch||null,focus:svg.dataset.focus||null
}));}
async function capture(selector,file,meta){
  const svg=page.locator(selector);await svg.evaluate(node=>node.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'}));await settle();
  const rect=await svg.boundingBox();assert(rect&&rect.width>100&&rect.height>100,'actual rendered SVG size');
  assert(rect.x>=-1&&rect.x+rect.width<=await page.evaluate(()=>innerWidth)+1,'SVG fits viewport width');
  await svg.screenshot({path:path.join(out,file),animations:'disabled'});
  evidence.screenshots.push({...meta,file,sha256:hash(fs.readFileSync(path.join(out,file))),renderedSize:{width:rect.width,height:rect.height},kind:'production'});
  return file;
}
async function pixelControl(svgSelector,targetSelector,baseFile,meta){
  const target=page.locator(svgSelector+' '+targetSelector);
  assert(await target.count()>0,'pixel target exists');
  const saved=await target.evaluateAll(nodes=>nodes.map(n=>n.getAttribute('style')));
  const prior=await page.locator(svgSelector).evaluate(n=>n.outerHTML);
  const solidFile=baseFile.replace(/\.png$/,'-negative-solid.png');
  try{
    await target.evaluateAll(nodes=>nodes.forEach(n=>n.style.setProperty('stroke-dasharray','none','important')));await settle();
    const broken=await geometry(svgSelector);assert.throws(()=>checkGeometry(broken,'intentionally exposed hidden line'),/computed dash state/);
    await page.locator(svgSelector).screenshot({path:path.join(out,solidFile),animations:'disabled'});
    const comparison=await page.evaluate(async ({base,solid})=>{
      const pixels=async encoded=>{const image=new Image();image.src='data:image/png;base64,'+encoded;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);return {width:canvas.width,height:canvas.height,data:ctx.getImageData(0,0,canvas.width,canvas.height).data};};
      const a=await pixels(base),b=await pixels(solid);if(a.width!==b.width||a.height!==b.height)throw Error('pixel control geometry changed');
      let changed=0;for(let i=0;i<a.data.length;i+=4)if(Math.max(Math.abs(a.data[i]-b.data[i]),Math.abs(a.data[i+1]-b.data[i+1]),Math.abs(a.data[i+2]-b.data[i+2]))>30)changed++;
      return {width:a.width,height:a.height,changed};
    },{base:fs.readFileSync(path.join(out,baseFile)).toString('base64'),solid:fs.readFileSync(path.join(out,solidFile)).toString('base64')});
    const record={...meta,baseFile,solidFile,solidSHA256:hash(fs.readFileSync(path.join(out,solidFile))),kind:'negative-control-only',comparison,passed:false};
    evidence.pixelControls.push(record);save();
    checkPixelChange(comparison,baseFile);record.passed=true;save();
  }finally{
    await target.evaluateAll((nodes,styles)=>nodes.forEach((n,i)=>styles[i]===null?n.removeAttribute('style'):n.setAttribute('style',styles[i])),saved);
    assert.equal(await page.locator(svgSelector).evaluate(n=>n.outerHTML),prior,'negative control restores exact production SVG');
  }
}
async function profileCase(base,item,width){
  await openPage(width);const task=taskFor(item);
  await context.addInitScript(({origin,lesson,task,step,answers})=>{
    if(location.origin!==origin||sessionStorage.getItem('visibility-profile-seeded'))return;
    const session={taskId:task,step,wrong:false,assisted:true,familiar:false,done:false,draft:'',answers,started:'2026-01-01T00:00:00.000Z',registered:false};
    localStorage.setItem('mathexam.profileStart2027.v1',JSON.stringify({version:1,records:{},seen:{},sessions:{[lesson+':guided']:session}}));
    sessionStorage.setItem('visibility-profile-seeded','1');
  },{origin:base,lesson:item.lesson,task:item.id,step:item.step,answers:task.steps.slice(0,item.step).map(s=>String(s.answer))});
  await page.goto(base+'/ege-profil/start/index.html#practice/'+item.lesson+'/guided');
  const selector='#task-model [data-stereo-view]';await page.locator(selector).waitFor({state:'visible'});
  const active=await page.evaluate(lesson=>JSON.parse(localStorage.getItem('mathexam.profileStart2027.v1')).sessions[lesson+':guided'].taskId,item.lesson);assert.equal(active,item.id,'actual saved authored task resumed');
  const before=await geometry(selector);checkGeometry(before,item.id+' default');
  if(item.hidden)checkInterior(before.lines.filter(n=>n.feature===item.hidden),item.id+' '+item.hidden);
  if(item.equator){const equator=before.lines.filter(n=>n.feature==='equator');assert(equator.some(n=>n.hidden)&&equator.some(n=>!n.hidden),'sphere equator has front/back arcs');}
  if(item.tube){const rim=before.lines.filter(n=>n.feature==='inner-rim');assert(rim.length>30&&rim.every(n=>!n.hidden),'visible tube opening rim');}
  await capture(selector,'profile-'+item.id+'-default-'+width+'.png',{renderer:'profile',id:item.id,width,stage:'default'});
  await page.locator(selector).focus();for(let i=0;i<5;i++)await page.keyboard.press('ArrowRight');for(let i=0;i<2;i++)await page.keyboard.press('ArrowUp');await settle();
  const rotated=await geometry(selector);checkGeometry(rotated,item.id+' rotated');assert.notEqual(rotated.yaw,before.yaw,'real keyboard rotation changes camera');
  if(item.hidden)checkInterior(rotated.lines.filter(n=>n.feature===item.hidden),item.id+' rotated '+item.hidden);
  const rotatedFile=await capture(selector,'profile-'+item.id+'-rotated-'+width+'.png',{renderer:'profile',id:item.id,width,stage:'rotated'});
  // In the initial box camera, the interior diagonal projects underneath the
  // thicker visible front height. The existing user rotation separates them,
  // so the pixel control measures exposed dash gaps without changing drawing
  // styles or weakening the contrast/count thresholds.
  if(item.pixels)await pixelControl(selector,'[data-feature="'+item.hidden+'"]',rotatedFile,{renderer:'profile',id:item.id,width,stage:'rotated'});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'profile page has no horizontal overflow');
  evidence.journeys.push({renderer:'profile',id:item.id,width,condition:task.prompt,before,rotated});save();await context.close();context=null;page=null;
}
async function t14Case(base,item,width){
  await openPage(width);await page.goto(base+'/ege-profil/trainers/stereo-t14.html');
  await page.locator('[data-view="tasks"]').click();await page.locator('#taskList .pcard').nth(item.index).click();
  const selector='#tFig svg';await page.locator(selector).waitFor({state:'visible'});
  const selected=await page.evaluate(index=>({id:G14.PROBLEMS[index].id,title:G14.PROBLEMS[index].title,cond:G14.PROBLEMS[index].cond}),item.index);
  assert.equal(selected.id,item.id,'T14 browser loaded the expected authored task');
  assert.equal(selected.title,t14Problems[item.index].title);assert.equal(selected.cond,t14Problems[item.index].cond);
  assert.equal(await page.locator('#tTitle').textContent(),selected.title,'T14 selected title');
  assert.equal(await page.locator('#tCond').textContent(),selected.cond,'T14 selected condition');
  const before=await geometry(selector);checkGeometry(before,'T14 '+item.id);checkInterior(before.lines.filter(n=>n.key===item.hidden),'T14 '+item.hidden);
  await capture(selector,'t14-'+item.id+'-default-'+width+'.png',{renderer:'t14',id:item.id,width,stage:'default'});
  await page.locator('#tShowAll').click();await page.locator('#tProof li').nth(item.proof).click();await page.mouse.move(0,0);
  const highlighted=await geometry(selector);checkGeometry(highlighted,'T14 '+item.id+' highlight');
  const target=highlighted.lines.filter(n=>n.key===item.hidden);checkInterior(target,'T14 highlighted '+item.hidden);assert(target.every(n=>n.color==='rgb(194, 47, 42)'&&n.width>=3.2),'real proof control highlights hidden construction');
  const highlightedFile=await capture(selector,'t14-'+item.id+'-highlight-'+width+'.png',{renderer:'t14',id:item.id,width,stage:'highlight'});
  if(item.pixels)await pixelControl(selector,'[data-segment="'+item.hidden+'"]',highlightedFile,{renderer:'t14',id:item.id,width});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'T14 page has no horizontal overflow');
  evidence.journeys.push({renderer:'t14',id:item.id,width,before,highlighted});save();await context.close();context=null;page=null;
}
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  try{
    const base=await host();const {chromium}=require('playwright');browser=await chromium.launch({headless:true,executablePath:process.env.VISIBILITY_PROFILE_CHROMIUM||undefined,args:['--no-sandbox']});
    for(const width of evidence.widths){for(const item of cases)await profileCase(base,item,width);for(const item of t14Cases)await t14Case(base,item,width);}
    assert.equal(evidence.journeys.length,34);assert.equal(evidence.screenshots.length,68);assert.equal(evidence.pixelControls.length,4);assert.deepEqual(evidence.errors,[]);
    assert.deepEqual(Object.fromEntries([...sourceFiles].sort().map(file=>[file,hash(fs.readFileSync(path.join(root,file)))])),sourceHashes,'tested source unchanged');
    evidence.completed=true;save();console.log('PROFILE_VISIBILITY_BROWSER_OK: 34 actual journeys, 68 production PNGs, 4 actual pixel controls, source hashes verified');
  }catch(error){
    evidence.failure=String(error.stack||error);
    if(page)try{await page.screenshot({path:path.join(out,'failure.png'),fullPage:true});}catch(captureError){evidence.failureScreenshotError=String(captureError);}
    if(page)try{evidence.failureDOM=await page.evaluate(()=>({url:location.href,svg:[...document.querySelectorAll('svg')].map(n=>n.outerHTML)}));}catch(captureError){evidence.failureDOMError=String(captureError);}
    save();throw error;
  }finally{await context?.close();await browser?.close();if(server)await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
