'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),out=process.env.EGE_BASE_VISIBILITY_OUT||path.join(root,'artifacts/ege-base-stereo-visibility');
const cases=[['box',0],['pyramid',0],['roundbody',0],['roundbody',1],['roundbody',2],['scale',0],['practice-displacement',0],['practice-pour',0],['practice-joined-surface',0],['practice-faces',0],['practice-cone-area',0],['practice-pyramid-lateral',0],['practice-box-diagonal',0],['practice-similar-volume',0]];
const files=['ege-baza/path/index.html','ege-baza/path/models.js','ege-baza/path/stereo-figures.js','ege-baza/path/data.js','ege-baza/path/practice.js','ege-baza/path/task-first.js','ege-baza/path/app.js','ege-baza/path/managed-state.js','ege-baza/path/style.css'];
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex'),sources=()=>Object.fromEntries(files.map(file=>[file,hash(fs.readFileSync(path.join(root,file)))]));
const evidence={completed:false,sourceHashes:sources(),widths:[320,1280],cases:[],screenshots:[],errors:[]};
const save=()=>fs.writeFileSync(path.join(out,'base-stereo-visibility-evidence.json'),JSON.stringify(evidence,null,2)+'\n');
let browser,page;
const server=http.createServer((req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://local').pathname);let file=path.resolve(root,'.'+pathname);if(!file.startsWith(root+path.sep))throw Error();if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
async function screenshot(locator,name){const filename=name+'.png',bytes=await locator.screenshot({path:path.join(out,filename)});evidence.screenshots.push({filename,sha256:hash(bytes)});save();}
async function ready(){
 // A vertical/horizontal SVG stroke has a zero-width/height geometric box.
 // Playwright's generic visible predicate rejects it even when it is painted.
 await page.locator('#model svg').waitFor({state:'visible'});
 await page.locator('#model svg [data-solid-line]').first().waitFor({state:'attached'});
}
async function measure(){return page.locator('#model svg').evaluate(svg=>{
 const shown=node=>{for(let p=node;p;p=p.parentElement){const s=getComputedStyle(p);if(s.display==='none'||s.visibility!=='visible'||Number(s.opacity)===0)return false;}return true;};
 const box=svg.getBoundingClientRect(),svgPainted=shown(svg)&&box.width>0&&box.height>0;
 const lines=[...svg.querySelectorAll('[data-solid-line]')].map(p=>{const s=getComputedStyle(p),b=p.getBBox(),d=p.getAttribute('d'),xy=d.match(/[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/ig).map(Number);return {id:p.dataset.solidLine,hidden:p.dataset.hidden==='true',dash:s.strokeDasharray,d,length:p.getTotalLength(),sourceLength:xy.length===4?Math.hypot(xy[2]-xy[0],xy[3]-xy[1]):NaN,painted:shown(p),stroke:s.stroke,strokeWidth:parseFloat(s.strokeWidth),strokeOpacity:Number(s.strokeOpacity),box:{width:b.width,height:b.height}};});
 return {lines,svgPainted,body:svg.outerHTML};
});}
function check(data){assert(data.svgPainted,'SVG viewport and ancestry are visible');assert(data.lines.some(l=>l.hidden)&&data.lines.some(l=>!l.hidden));assert(data.lines.some(l=>l.id==='axis'&&l.hidden));for(const l of data.lines){assert(!/NaN|Infinity/.test(l.d));assert(Number.isFinite(l.sourceLength)&&l.sourceLength>0,'stroke has nonzero authored length');
 // Float32 SVG geometry may collapse only a microscopic split fragment;
 // an ordinary axis of95 units must still have a positive browser length.
 assert(Number.isFinite(l.length)&&l.length>=0&&(l.length>0||l.sourceLength<1e-4),'stroke has browser geometry');assert(l.painted&&l.stroke!=='none'&&l.stroke!=='transparent'&&!/^rgba\([^,]+,[^,]+,[^,]+,\s*0\s*\)$/.test(l.stroke)&&l.strokeWidth>0&&l.strokeOpacity>0,'stroke has actual computed paint');assert.equal(l.dash!=='none',l.hidden,'browser computed dash style');}}
async function browserNegativeControls(){
 const path=page.locator('#model svg [data-solid-line]').first(),svg=page.locator('#model svg');
 for(const [locator,property,value] of [[path,'stroke','none'],[svg,'display','none']]){
  const prior=await locator.getAttribute('style');await locator.evaluate((el,{property,value})=>el.style.setProperty(property,value,'important'),{property,value});
  try{const current=await measure();assert.throws(()=>check(current),undefined,'unpainted browser drawing must fail');}
  finally{await locator.evaluate((el,prior)=>{if(prior===null)el.removeAttribute('style');else el.setAttribute('style',prior);},prior);}
  check(await measure());
 }
 evidence.browserNegativeControls=['stroke:none','svg display:none'];save();
}
(async()=>{
 const D=require('../ege-baza/path/data.js');require('../ege-baza/path/practice.js');for(const[id,seed]of cases)assert(D.task(id,seed));
 const line={id:'axis',hidden:true,d:'M300,175L300,80',dash:'5px, 5px',length:95,sourceLength:95,painted:true,stroke:'rgb(195, 107, 52)',strokeWidth:2.5,strokeOpacity:1,box:{width:0,height:95}};
 const positive={svgPainted:true,lines:[line,{...line,id:'front',hidden:false,dash:'none',d:'M20,30L100,30',length:80,sourceLength:80,box:{width:80,height:0}}]};check(positive);check({...positive,lines:[...positive.lines,{...line,d:'M300,175L300,175.0000001',length:0,sourceLength:1e-7,box:{width:0,height:0}}]});
 for(const patch of [{stroke:'none'},{painted:false},{strokeOpacity:0},{length:0},{dash:'none'}])assert.throws(()=>check({...positive,lines:[{...line,...patch},positive.lines[1]]}));assert.throws(()=>check({...positive,svgPainted:false}));
 if(process.env.EGE_BASE_VISIBILITY_CHECK_ONLY==='1'){console.log('EGE_BASE_VISIBILITY_PREFLIGHT_OK:14 actual task variants,12 families,320/1280;zero-width/height strokes accepted,6 missing-paint negatives rejected');return;}
 fs.mkdirSync(out,{recursive:true});save();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=process.env.EGE_BASE_VISIBILITY_BASE||'http://127.0.0.1:'+server.address().port;
 const {chromium}=require('playwright');browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox']});
 evidence.browserVersion=browser.version();
 for(const width of evidence.widths)for(const[id,seed]of cases){
  const context=await browser.newContext({viewport:{width,height:950},reducedMotion:'reduce'});page=await context.newPage();page.on('pageerror',e=>evidence.errors.push(e.message));
  await page.goto(base+'/ege-baza/path/index.html#lesson='+id);await page.locator('#new').waitFor();
  const firstSeed=await page.evaluate(id=>PathCourse.state().lessons[id].seed,id);
  for(let i=0;i<seed;i++)await page.locator('#new').click();
  const actualSeed=await page.evaluate(id=>PathCourse.state().lessons[id].seed,id);
  assert.equal(actualSeed,firstSeed+seed,'real new-task controls select expected variant');
  assert.equal(await page.locator('#taskHelp').evaluate(e=>e.open),false);assert.equal(await page.evaluate(id=>PathCourse.state().lessons[id].help,id),false,'condition remains unassisted');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'condition fits viewport');
  const name=id+'-'+actualSeed+'-'+width;
  await screenshot(page.locator('.task-first-problem>.task-support .stereo-figures'),name+'-condition');
  const kind=await page.evaluate(id=>{const l=PathCourse.state().lessons[id];return PathData.task(id,l.seed).model.kind;},id),row={id,seed:actualSeed,width,kind};
  if(kind==='solid'){
   await page.locator('#answer').fill('7/');await page.locator('#taskHelp>summary').click();await page.locator('#taskModel>summary').click();await ready();
   const before=await measure();check(before);if(!evidence.browserNegativeControls)await browserNegativeControls();await screenshot(page.locator('#model'),name+'-initial');
   for(const[field,value]of [['angle',-125],['tilt',-25]])await page.locator('#'+field).evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));},value);
   if(id==='scale')await page.locator('#cut').evaluate(el=>{el.value=.65;el.dispatchEvent(new Event('input',{bubbles:true}));});
   const after=await measure();check(after);assert.notEqual(after.body,before.body,'rotation updates visible drawing');await screenshot(page.locator('#model'),name+'-rotated');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'model fits viewport');
   const state=await page.evaluate(id=>PathCourse.state().lessons[id].taskFirst.model,id);await page.reload();await ready();
   assert.equal(await page.locator('#answer').inputValue(),'7/');assert.deepEqual(await page.evaluate(id=>PathCourse.state().lessons[id].taskFirst.model,id),state);assert.equal((await measure()).body,after.body,'camera/section restored');
   Object.assign(row,{initialHidden:before.lines.filter(l=>l.hidden).length,rotatedHidden:after.lines.filter(l=>l.hidden).length,reloaded:true});
  }
  evidence.cases.push(row);save();await context.close();
 }
 assert.deepEqual(evidence.errors,[]);assert.deepEqual(sources(),evidence.sourceHashes,'source bytes frozen during browser evidence');evidence.completed=true;save();
 console.log('EGE_BASE_STEREO_VISIBILITY_BROWSER_OK:28 actual-page journeys,60 PNG,rotated bodies,computed dashes,old state and drafts retained');
})().catch(async error=>{evidence.errors.push(error.stack||String(error));if(fs.existsSync(out)){if(page&&!page.isClosed())try{await page.screenshot({path:path.join(out,'failure.png'),fullPage:true});}catch{}save();}console.error(error);process.exitCode=1;}).finally(async()=>{await browser?.close();if(server.listening)await new Promise(r=>server.close(r));});
