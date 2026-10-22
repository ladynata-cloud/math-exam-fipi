'use strict';
// CI-only visual inspection of authored models, including drafts. This mounts
// the shared renderer directly; no lesson review/status flag is ever promoted.
// This is not proof of mathematical review or student-course readiness.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..');
const course=path.join(root,'stereo-course/merzlyak-10-base');
const bundlePath=path.join(course,'data/course.json');
const bytes=fs.readFileSync(bundlePath),bundle=JSON.parse(bytes);
const out=path.resolve(process.env.MERZLYAK_ARTIFACTS||'artifacts/merzlyak-models');
fs.mkdirSync(out,{recursive:true});
const evidence={schemaVersion:1,purpose:'Engineering visual inspection of draft models; no publication or mathematical review',
 commit:process.env.GITHUB_SHA||null,bundleSHA256:crypto.createHash('sha256').update(bytes).digest('hex'),
 authoredCards:bundle.lessons.length,widths:[320,1280],states:[],screenshots:[],errors:[],completed:false};
assert(bundle.lessons.length>0,'No authored cards');
const write=()=>fs.writeFileSync(path.join(out,'model-evidence.json'),JSON.stringify(evidence,null,2));
const css=fs.readFileSync(path.join(root,'stereo-course/assets/task-scenes.css'),'utf8')+'\n'+fs.readFileSync(path.join(root,'stereo-course/textbook/assets/style.css'),'utf8');
const scopedCSS=fs.readFileSync(path.join(course,'assets/style.css'),'utf8').replace(/^@import[^;]+;/gm,'');
const renderer=fs.readFileSync(path.join(root,'stereo-course/assets/task-scene-viewer.js'),'utf8');
let browser;
(async()=>{
 try{
  browser=await chromium.launch({headless:true});
  for(const width of evidence.widths){
   const page=await browser.newPage({viewport:{width,height:1000},deviceScaleFactor:1});
   page.on('pageerror',error=>evidence.errors.push(error.message));
   await page.setContent('<!doctype html><html lang="ru"><meta charset="utf-8"><style>'+css+'\n'+scopedCSS+'</style><style>html{box-sizing:border-box}*{box-sizing:inherit}body{margin:0;padding:12px;font:18px/1.5 system-ui;color:#15392d;background:#f7faf7}h1{font-size:24px;line-height:1.25}h2{font-size:20px}.note{font-size:14px;color:#765d22}#model{width:100%;max-width:900px;min-height:420px;margin:auto}#model .am-wrap{width:100%}#condition,#caption,#view{max-width:900px;margin:16px auto;overflow-wrap:anywhere}</style><p class="note">Инженерный просмотр черновика. Проверка оформления модели.</p><h1 id="title"></h1><p id="condition"></p><div id="model"></div><p id="caption"></p><h2 id="view"></h2></html>');
   await page.locator('#model').evaluate(node=>node.className='textbook-model task-scene');
   await page.addScriptTag({content:renderer});
   for(const lesson of bundle.lessons){
    await page.evaluate(lesson=>{
     window.modelPreview?.destroy();
     for(const [id,text]of [['title',lesson.title],['condition',lesson.statement.text],['caption',lesson.visualization.caption]])document.getElementById(id).textContent=text;
     window.modelPreview=TaskSceneViewer.mount(document.getElementById('model'),lesson.visualization.model);
    },lesson);
    const views=Object.keys(lesson.visualization.model.views);
    for(const view of views){
     await page.evaluate(view=>{modelPreview.setView(view);document.getElementById('view').textContent=view;},view);
     await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
     const result=await page.locator('#model svg').evaluate(svg=>{
      const box=svg.viewBox.baseVal,matrix=svg.getScreenCTM(),scale=Math.min(Math.hypot(matrix.a,matrix.b),Math.hypot(matrix.c,matrix.d));
      return {finite:!/(?:NaN|Infinity)/.test(svg.outerHTML),width:box.width,height:box.height,
       labels:[...svg.querySelectorAll('.am-label')].map(node=>{const b=node.getBBox();return {key:node.dataset.label,x:b.x,y:b.y,width:b.width,height:b.height,pixels:parseFloat(getComputedStyle(node).fontSize)*scale};})};
     });
     const overlaps=[];
     for(let i=0;i<result.labels.length;i++)for(let j=i+1;j<result.labels.length;j++){
      const a=result.labels[i],b=result.labels[j];
      if(Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)>1&&Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)>1)overlaps.push([a.key,b.key]);
     }
     const entry={id:lesson.id,width,view,...result,overlaps};evidence.states.push(entry);
     assert(result.finite&&result.width>0&&result.height>0,lesson.id+' finite nonempty model');
     assert.deepEqual(overlaps,[],lesson.id+' '+view+' no label overlap at '+width);
     for(const label of result.labels){
      assert(label.pixels>=18-1e-6,lesson.id+' readable label '+label.key);
      assert(label.x>=-1&&label.y>=-1&&label.x+label.width<=result.width+1&&label.y+label.height<=result.height+1,lesson.id+' unclipped label '+label.key);
     }
     assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),lesson.id+' page does not overflow');
     if(view==='neutral'||view===views.at(-1)){
      const file=lesson.id+'-'+view+'-'+width+'.png';
      await page.screenshot({path:path.join(out,file),fullPage:true});
      evidence.screenshots.push({id:lesson.id,width,view,file});
     }
    }
   }
   await page.close();
  }
  assert.deepEqual(evidence.errors,[],'No browser errors');
  assert.equal(evidence.states.length,2*bundle.lessons.reduce((sum,lesson)=>sum+Object.keys(lesson.visualization.model.views).length,0),'Every authored view at both widths');
  evidence.completed=true;write();
  console.log('MERZLYAK_MODEL_BROWSER_OK '+evidence.authoredCards+' cards, '+evidence.states.length+' view/width states');
 }catch(error){evidence.failure=error.stack;write();throw error;}
 finally{await browser?.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
