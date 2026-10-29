'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),out=process.env.EGE_LAB_VISIBILITY_OUT||path.join(root,'artifacts/ege-base-lab-visibility');
const files=['ege-baza/labs/index.html','ege-baza/labs/stereo.js','ege-baza/labs/labs.js','ege-baza/labs/math.js','ege-baza/labs/style.css','assets/stereo-three-visibility.js','ege-profil/trainers/stereo/js/three.min.js'];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),sources=()=>Object.fromEntries(files.map(f=>[f,hash(fs.readFileSync(path.join(root,f)))]));
const evidence={completed:false,sourceHashes:sources(),widths:[320,1280],cases:[],screenshots:[],errors:[]};let browser,page;
const save=()=>fs.writeFileSync(path.join(out,'base-lab-visibility-evidence.json'),JSON.stringify(evidence,null,2)+'\n');
const server=http.createServer((req,res)=>{try{let f=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!f.startsWith(root+path.sep))throw Error();if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch{res.writeHead(404).end();}});
function check(data,mode){
 assert(data.live&&!data.contextLost&&data.renderCalls>0,'real WebGL is rendering');assert(data.hiddenPieces>0&&data.visiblePieces>0);assert(data.hiddenPixelChanges>10,'hidden dash meshes contribute actual canvas pixels');assert(data.gaps>0,'hidden strokes contain actual mesh gaps');
 assert(data.state.strokes.every(s=>s.pickMeshVisible&&!s.pickMaterialVisible),'original continuous line materials remain disabled');
 if(mode==='water'){assert.equal(data.state.surfaces,22);assert.equal(data.state.strokes.length,25);const block=data.state.strokes.filter(s=>s.owners.includes('block'));assert.equal(block.filter(s=>s.parts.reduce((a,p)=>a+(p.hidden?p.end-p.start:0),0)>.99).length,3,'transparent vessel preserves cube visibility');}
 else {assert.equal(data.state.surfaces,192);assert.equal(data.state.strokes.length,13);const rings=data.state.strokes.filter(s=>s.curve.kind==='circle');assert.equal(rings.length,2);assert(rings.every(s=>s.parts.some(p=>p.hidden)&&s.parts.some(p=>!p.hidden)),'base and section both have rear arcs');}
}
async function measure(){return page.evaluate(()=>{
 const v=window.__solidViews.at(-1);v.draw();const canvas=v.renderer.domElement,copy=document.createElement('canvas');copy.width=canvas.width;copy.height=canvas.height;const ctx=copy.getContext('2d');ctx.drawImage(canvas,0,0);const before=ctx.getImageData(0,0,copy.width,copy.height).data;
 const groups=v.group.children.filter(g=>g.name==='classified-stroke'),hidden=[],visible=[];let gaps=0;
 for(const g of groups){const pieces=g.children.filter(p=>p.visible&&p.userData.visibility);for(const p of pieces)(p.userData.visibility.hidden?hidden:visible).push(p);const h=pieces.filter(p=>p.userData.visibility.hidden).map(p=>p.userData.visibility).sort((a,b)=>a.start-b.start);for(let i=1;i<h.length;i++)if(h[i].start>h[i-1].end+1e-5)gaps++;}
 // Actual pixel control: remove only the dashed hidden pieces, render the
 // unchanged scene, and require their real canvas contribution to disappear.
 hidden.forEach(p=>p.visible=false);v.renderer.render(v.scene,v.camera);ctx.clearRect(0,0,copy.width,copy.height);ctx.drawImage(canvas,0,0);const after=ctx.getImageData(0,0,copy.width,copy.height).data;let changed=0;
 for(let i=0;i<before.length;i+=4)if(Math.max(...[0,1,2,3].map(k=>Math.abs(before[i+k]-after[i+k])))>2)changed++;
 hidden.forEach(p=>p.visible=true);v.renderer.render(v.scene,v.camera);
 return {live:v.live,contextLost:v.renderer.getContext().isContextLost(),renderCalls:v.renderer.info.render.calls,hiddenPieces:hidden.length,visiblePieces:visible.length,hiddenPixelChanges:changed,gaps,state:v.visibility.inspect(),theta:v.theta,phi:v.phi,parameter:v.parameter};
 });}
async function shot(name,full=false){const file=name+'.png',bytes=full?await page.screenshot({path:path.join(out,file),fullPage:true}):await page.locator('#solid').screenshot({path:path.join(out,file)});evidence.screenshots.push({file,sha256:hash(bytes)});save();}
(async()=>{
 for(const file of files)assert(fs.existsSync(path.join(root,file)));assert(fs.readFileSync(path.join(root,files[0]),'utf8').includes('assets/stereo-three-visibility.js'));
 const fake={live:true,contextLost:false,renderCalls:10,hiddenPieces:8,visiblePieces:9,hiddenPixelChanges:20,gaps:7,state:{surfaces:22,strokes:[...Array(12)].map((_,i)=>({owners:['block'],pickMeshVisible:true,pickMaterialVisible:false,parts:[{start:0,end:1,hidden:i<3}]})).concat([...Array(13)].map(()=>({owners:['vessel'],pickMeshVisible:true,pickMaterialVisible:false,parts:[{start:0,end:1,hidden:false}]})))}};
 check(fake,'water');assert.throws(()=>check({...fake,hiddenPixelChanges:0},'water'));assert.throws(()=>check({...fake,gaps:0},'water'));
 if(process.env.EGE_LAB_VISIBILITY_CHECK_ONLY==='1'){console.log('EGE_BASE_LAB_VISIBILITY_PREFLIGHT_OK:actual-page hook,source hashes,2 pixel/gap negative controls');return;}
 fs.mkdirSync(out,{recursive:true});save();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=process.env.EGE_LAB_VISIBILITY_BASE||'http://127.0.0.1:'+server.address().port;
 const {chromium}=require('playwright');browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});evidence.browserVersion=browser.version();
 for(const width of evidence.widths)for(const mode of ['water','cone']){
  const context=await browser.newContext({viewport:{width,height:950},deviceScaleFactor:1});await context.addInitScript(()=>{window.__solidViews=[];Object.defineProperty(window,'SolidView',{configurable:true,set(Value){Object.defineProperty(window,'SolidView',{configurable:true,writable:true,value:class extends Value{constructor(...args){super(...args);window.__solidViews.push(this);}}});}});});
  page=await context.newPage();page.on('pageerror',e=>evidence.errors.push(e.message));await page.goto(base+'/ege-baza/labs/index.html');await page.locator('#solid canvas').waitFor();await page.evaluate(()=>localStorage.setItem('mathExamCourseProgress.v1','{"untouched":true}'));
  if(mode==='cone')await page.selectOption('#solidMode',mode);await page.locator('#solidParameter').evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));},mode==='water'?'100':'50');
  const initial=await measure();check(initial,mode);await shot(`${mode}-${width}-initial`);await shot(`${mode}-${width}-page`,true);
  for(let i=0;i<8;i++)await page.click('#turnRight');const rotated=await measure();check(rotated,mode);assert.notEqual(JSON.stringify(initial.state.strokes.map(s=>s.parts)),JSON.stringify(rotated.state.strokes.map(s=>s.parts)));await shot(`${mode}-${width}-rotated`);
  const beforeTab=await page.evaluate(()=>MathExamLabs.getState());await page.click('[data-tab="plane"]');assert(await page.evaluate(()=>window.__solidViews.every(v=>!v.live&&v.visibility===null)),'hiding the lab disposes the old helper and renderer');await page.click('[data-tab="stereo"]');assert.equal(await page.locator('#solidMode').inputValue(),mode);assert.equal(await page.evaluate(()=>MathExamLabs.getState().solidValue),beforeTab.solidValue);check(await measure(),mode);
  const beforeAnimation=await page.evaluate(()=>MathExamLabs.getState().solidValue);await page.click('#animateSolid');const animationStart=await page.evaluate(()=>MathExamLabs.getState().solidValue);
  await page.waitForFunction(({before,start})=>{const value=MathExamLabs.getState().solidValue;return value!==before&&value>Math.max(5,start+.5)&&value<95;},{before:beforeAnimation,start:animationStart});
  await page.click('#animateSolid');const paused=await page.evaluate(()=>MathExamLabs.getState().solidValue);assert(paused>animationStart+.5&&paused!==beforeAnimation,'animation advances after its reset');await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>MathExamLabs.getState().solidValue),paused,'pause stops animation');const animated=await measure();check(animated,mode);await shot(`${mode}-${width}-paused`);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no viewport overflow');assert.equal(await page.evaluate(()=>localStorage.getItem('mathExamCourseProgress.v1')),'{"untouched":true}');
  evidence.cases.push({width,mode,initial,rotated,animated,beforeAnimation,animationStart,paused,tabLifecycle:true,stateRetained:true});save();await context.close();
 }
 assert.deepEqual(evidence.errors,[]);assert.deepEqual(sources(),evidence.sourceHashes);evidence.completed=true;save();console.log('EGE_BASE_LAB_VISIBILITY_BROWSER_OK:4 actual-page journeys,16 PNG,real dashed-mesh pixels,rotation,tab disposal,animation pause,state isolation');
})().catch(async e=>{evidence.errors.push(e.stack||String(e));if(fs.existsSync(out)){if(page&&!page.isClosed())try{await page.screenshot({path:path.join(out,'failure.png'),fullPage:true});}catch{}save();}console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();if(server.listening)await new Promise(r=>server.close(r));});
