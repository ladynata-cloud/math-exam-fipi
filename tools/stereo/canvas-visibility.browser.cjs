'use strict';
// Actual existing course pages and user controls. Canvas hooks observe calls and
// forward them unchanged; they do not substitute rendering or promote content.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),out=path.resolve(process.env.VISIBILITY_CANVAS_ARTIFACTS||'artifacts/visibility-canvas');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const cases=[
 {course:'stereo-course',id:'box',kind:'box',route:'/stereo-course/#box',host:'#viewer',manual:[['A','C₁'],['C','D']]},
 {course:'stereo-course',id:'sphere',kind:'sphere',route:'/stereo-course/#sphere',host:'#viewer'},
 {course:'geometry-merzlyak',id:'merzlyak-base-9-21',kind:'prism',route:'/geometry-merzlyak/atlas/merzlyak-base-9-21.html',host:'#geo-board',manual:[['A','C₁'],['A','B']]},
 {course:'geometry-merzlyak',id:'merzlyak-base-9-22',kind:'cylinder',route:'/geometry-merzlyak/atlas/merzlyak-base-9-22.html',host:'#geo-board'},
 {course:'geometry-pogorelov',id:'pogorelov-base-9-132',kind:'box',route:'/geometry-pogorelov/atlas/pogorelov-base-9-132.html',host:'#geo-board',manual:[['A','C₁'],['C','D']]},
 {course:'geometry-pogorelov',id:'pogorelov-base-9-136',kind:'cylinder',route:'/geometry-pogorelov/atlas/pogorelov-base-9-136.html',host:'#geo-board'}
];
const sources=[...new Set(['stereo-course/index.html','stereo-course/assets/task-scene-viewer.js',...cases.flatMap(c=>[
 c.course+'/assets/viewer.js',c.course+'/assets/space.js',c.course+'/data/course.json',
 ...(c.course==='stereo-course'?['stereo-course/assets/app.js']:[''+c.course+'/assets/lesson.js',c.course+'/atlas/'+c.id+'.html'])])])];
const frozen=Object.fromEntries(sources.map(file=>[file,hash(fs.readFileSync(path.join(root,file)))]));
const evidence={schemaVersion:1,completed:false,commit:process.env.GITHUB_SHA||null,sourceHashes:frozen,widths:[320,1280],journeys:[],screenshots:[],errors:[]};
const write=()=>fs.writeFileSync(path.join(out,'canvas-visibility-evidence.json'),JSON.stringify(evidence,null,2)+'\n');
function preflight(){
 for(const item of cases){const course=JSON.parse(fs.readFileSync(path.join(root,item.course,'data/course.json'),'utf8')),unit=course.units.find(u=>u.id===item.id);assert(unit&& (unit.kind||unit.space)===item.kind,item.id+' actual source model');}
 const standalone=fs.readFileSync(path.join(root,'stereo-course/index.html'),'utf8'),viewer=fs.readFileSync(path.join(root,'stereo-course/assets/viewer.js'),'utf8');
 assert(standalone.includes(viewer.replaceAll('</script','<\\/script')),'workshop embeds exact current canvas renderer');
 console.log('CANVAS_VISIBILITY_BROWSER_PREFLIGHT_OK: six real lessons, three courses, box/prism/cylinder/sphere, 320/1280');
}
preflight();if(process.env.VISIBILITY_CANVAS_CHECK_ONLY==='1')process.exit(0);
let server,browser,context;
async function serve(){server=http.createServer((req,res)=>{let file;try{file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local.test').pathname));}catch{return res.writeHead(400).end();}if(!file.startsWith(root+path.sep))return res.writeHead(403).end();try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'application/javascript; charset=utf-8':file.endsWith('.css')?'text/css; charset=utf-8':'application/json');res.end(fs.readFileSync(file));}catch{return res.writeHead(404).end();}});return await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>resolve('http://127.0.0.1:'+server.address().port));});}
async function capture(page,item,width,stage){
 const canvas=page.locator(item.host+' canvas');await canvas.scrollIntoViewIfNeeded();
 const result=await canvas.evaluate(canvas=>{
  const context=canvas.getContext('2d'),data=context.getImageData(0,0,canvas.width,canvas.height).data,colors=new Set();
  for(let i=0;i<data.length;i+=16)colors.add(data[i]+','+data[i+1]+','+data[i+2]);
  const strokes=window.__visibilityCanvasRead(canvas),geometric=strokes.filter(s=>['#dde7e1','#d29a5355','#2a587b','#537b8955','#bc7020','#a851ba'].includes(s.color));
  return {width:canvas.width,height:canvas.height,pixelColors:colors.size,strokes:geometric.length,
   hidden:geometric.filter(s=>s.dash.length).length,visible:geometric.filter(s=>!s.dash.length).length,
   sectionHidden:geometric.filter(s=>s.color==='#bc7020'&&s.dash.length).length,
   sectionVisible:geometric.filter(s=>s.color==='#bc7020'&&!s.dash.length).length,
   manualHidden:geometric.filter(s=>s.color==='#a851ba'&&s.dash.length).length,
   manualVisible:geometric.filter(s=>s.color==='#a851ba'&&!s.dash.length).length,
   finite:geometric.every(s=>s.path.flat().every(Number.isFinite)&&Number.isFinite(s.offset))};
 });
 assert(result.finite&&result.pixelColors>10&&result.strokes>20,item.id+' actual nonempty finite canvas');
 assert(result.hidden>0&&result.visible>0,item.id+' both visible and hidden strokes actually drawn');
 assert(result.sectionHidden>0&&result.sectionVisible>0,item.id+' section visibility changes around the body');
 if(item.kind==='box')assert(result.manualHidden>0,item.id+' interior diagonal is hidden');
 const file=item.course+'-'+item.id+'-'+stage+'-'+width+'.png';await canvas.screenshot({path:path.join(out,file)});
 evidence.screenshots.push({course:item.course,id:item.id,kind:item.kind,width,stage,file,sha256:hash(fs.readFileSync(path.join(out,file)))});
 return result;
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 try{
  const base=await serve();const {chromium}=require('playwright');browser=await chromium.launch({headless:true,executablePath:process.env.VISIBILITY_CANVAS_CHROMIUM||undefined,args:['--no-sandbox']});
  for(const width of evidence.widths)for(const item of cases){
   context=await browser.newContext({viewport:{width,height:1000},deviceScaleFactor:1,reducedMotion:'reduce'});
   await context.addInitScript(()=>{
    const observations=new WeakMap(),proto=CanvasRenderingContext2D.prototype;
    const state=ctx=>{if(!observations.has(ctx.canvas))observations.set(ctx.canvas,{path:[],strokes:[]});return observations.get(ctx.canvas);};
    for(const name of ['beginPath','moveTo','lineTo','clearRect','stroke']){const original=proto[name];proto[name]=function(...args){const data=state(this);if(name==='beginPath')data.path=[];if(name==='clearRect')data.strokes=[];if(name==='moveTo'||name==='lineTo')data.path.push(args.slice(0,2));if(name==='stroke')data.strokes.push({path:data.path.map(p=>p.slice()),dash:this.getLineDash(),offset:this.lineDashOffset,color:this.strokeStyle});return original.apply(this,args);};}
    window.__visibilityCanvasRead=canvas=>observations.get(canvas)?.strokes||[];
   });
   const page=await context.newPage();page.on('pageerror',error=>evidence.errors.push(error.message));
   await page.goto(base+item.route);
   if(item.course==='stereo-course'&&!await page.locator('.more-sections').evaluate(node=>node.open))await page.locator('.more-sections>summary').click();
   await page.locator('[data-stage="1"]').first().click();
   const host=page.locator(item.host);await host.locator('canvas').waitFor({state:'visible'});
   for(const [a,b]of item.manual||[]){await host.locator('.pick[data-pick="1"]').selectOption(a);await host.locator('.pick[data-pick="2"]').selectOption(b);await host.locator('[data-action="line"]').click();}
   await host.locator('[data-action="section"]').click();
   const before=await capture(page,item,width,'initial');
   await host.locator('canvas').focus();for(let i=0;i<5;i++)await page.keyboard.press('ArrowRight');for(let i=0;i<2;i++)await page.keyboard.press('ArrowDown');
   const rotated=await capture(page,item,width,'rotated');
   const note='Проверка видимости: '+item.course+' '+item.id+' '+width;
   await page.locator('#observation').fill(note);await page.waitForFunction(note=>Object.values(localStorage).some(value=>value.includes(note)),note);
   await page.reload();await page.locator(item.host+' canvas').waitFor({state:'visible'});assert.equal(await page.locator('#observation').inputValue(),note,'real lesson observation survives reload');
   if(item.manual)assert(await page.locator(item.host+' canvas').evaluate(canvas=>window.__visibilityCanvasRead(canvas).some(s=>s.color==='#a851ba')),'manual constructions survive reload');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'actual lesson has no horizontal overflow');
   evidence.journeys.push({course:item.course,id:item.id,width,kind:item.kind,before,rotated,reloaded:true,manualLines:item.manual?.length||0});
   await context.close();context=null;write();
  }
  assert.equal(evidence.journeys.length,12);assert.equal(evidence.screenshots.length,24);assert.deepEqual(evidence.errors,[]);
  assert.deepEqual(Object.fromEntries(sources.map(file=>[file,hash(fs.readFileSync(path.join(root,file)))])),frozen,'tested source bytes unchanged');
  evidence.completed=true;write();console.log('CANVAS_VISIBILITY_BROWSER_OK: 12 actual course journeys, 24 actual canvas PNGs, real rotations/constructions and reload');
 }catch(error){evidence.failure=String(error.stack||error);write();throw error;}
 finally{await context?.close();await browser?.close();if(server)await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
