'use strict';
// Verify actual browser font metrics for every generated diagram. No server,
// learner, credentials or external network is involved.
const assert=require('node:assert/strict'),{chromium}=require('playwright');
const D=require('../ege-baza/path/data');
for(const file of ['practice','equation-practice','grade7-algebra','grade7-geometry','grade7-foundations','pre7-arithmetic','pre7-applications','grade7-geometry-core','grade7-geometry-practice'])require('../ege-baza/path/'+file);
const renderer=require('../ege-baza/path/grade7-geometry-core-models');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});let cases=0;
  await page.route('**/*',route=>route.abort());
  for(const meta of D.meta.filter(m=>/^grade7-g-(?:core|practice)-/.test(m.id))){
   const rows=Array.from({length:216},(_,seed)=>{const task=D.task(meta.id,seed);return {seed,html:renderer.svg(task,null,task.model.constructions.map(c=>c.id))};});
   const failures=await page.evaluate(rows=>{
    const out=[];
    for(const row of rows){
     document.body.innerHTML=row.html;
     const svg=document.querySelector('svg'),v=svg.viewBox.baseVal;
     const labels=[...svg.querySelectorAll('text')].map(t=>{const r=t.getBBox();return {text:t.textContent,x:r.x,y:r.y,w:r.width,h:r.height};});
     for(const t of labels)if(t.x<v.x||t.y<v.y||t.x+t.w>v.x+v.width||t.y+t.h>v.y+v.height)out.push({seed:row.seed,clipped:t.text});
     for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){
      const a=labels[i],b=labels[j],x=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x),y=Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y);
      if(x>2&&y>2)out.push({seed:row.seed,overlap:[a.text,b.text]});
      // Nearby feet H and M once read as a single "HM" despite their boxes
      // technically not overlapping. Keep a readable gap between the names.
      if([a.text,b.text].sort().join(',')==='H,M'&&x>-8&&y>2)out.push({seed:row.seed,touchingFeet:true});
     }
    }
    return out;
   },rows);
   assert.deepEqual(failures,[],meta.id+' labels must remain distinct and within the SVG');cases+=rows.length;
  }
  assert.equal(cases,4320);
  console.log(`GRADE7_CONSTRUCTION_VISUAL_OK: ${cases} actual SVG/font layouts; no clipped or overlapping text with all constructions visible.`);
 }finally{await browser.close();}
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
