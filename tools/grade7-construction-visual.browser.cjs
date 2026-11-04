'use strict';
// Verify actual browser font metrics for every generated diagram. No server,
// learner, credentials or external network is involved.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const D=require('../ege-baza/path/data');
for(const file of ['practice','equation-practice','grade7-algebra','grade7-geometry','grade7-foundations','pre7-arithmetic','pre7-applications','grade7-geometry-core','grade7-geometry-practice','grade7-geometry-rebuild-base','grade7-geometry-rebuild-foundations','grade7-geometry-rebuild-triangles','grade7-geometry-rebuild-relations','grade7-geometry-rebuild-workbook'])require('../ege-baza/path/'+file);
const renderer=require('../ege-baza/path/grade7-geometry-core-models');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});let cases=0,fixtureBytes=0;
  const failuresByFamily=[],fixtures=[],outputDir=process.env.GEOMETRY_REBUILD_OUTPUT_DIR||'/tmp/geometry-rebuild-evidence';
  const fixtureDir=path.join(outputDir,'font-layout-fixtures');
  fs.mkdirSync(fixtureDir,{recursive:true});
  await page.route('**/*',route=>route.abort());
  for(const meta of D.meta.filter(m=>/^grade7-g-(?:core|practice)-/.test(m.id)||m.geometryRebuild)){
   const rows=Array.from({length:meta.geometryRebuild?D.geometryRebuild.count:216},(_,seed)=>{const task=D.task(meta.id,seed);return {seed,html:renderer.svg(task,null,task.model.constructions.map(c=>c.id))};});
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
   cases+=rows.length;
   if(failures.length){
    failuresByFamily.push({contentId:meta.id,errors:failures});
    console.error(`${meta.id}: ${failures.length} font-layout errors across ${new Set(failures.map(error=>error.seed)).size} seeds`);
    // Keep every error in JSON, with a bounded sample of exact public SVGs for
    // inspection. Fixture limits never change which layouts are checked.
    for(const seed of [...new Set(failures.map(error=>error.seed))].slice(0,3)){
     const html=rows[seed].html.replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" '),bytes=Buffer.byteLength(html);
     if(fixtures.length>=100||bytes>128*1024||fixtureBytes+bytes>5*1024*1024)continue;
     const filename=meta.id.replace(/[^a-zA-Z0-9_-]/g,'_')+'-'+seed+'.svg';
     fs.writeFileSync(path.join(fixtureDir,filename),html);
     fixtures.push({contentId:meta.id,seed,file:'font-layout-fixtures/'+filename});fixtureBytes+=bytes;
    }
   }
  }
  const expectedCases=4320+D.geometryRebuild.families.length*D.geometryRebuild.count;
  fs.writeFileSync(path.join(outputDir,'font-layout-report.json'),JSON.stringify({
   cases,expectedCases,failedFamilies:failuresByFamily.length,
   failures:failuresByFamily,fixtures,fixtureBytes
  },null,2)+'\n');
  assert.equal(cases,expectedCases);
  assert.equal(failuresByFamily.length,0,
   'Labels must remain distinct and within the SVG in every family; see font-layout-report.json. Failing families: '+failuresByFamily.map(row=>row.contentId).join(', '));
  console.log(`GRADE7_CONSTRUCTION_VISUAL_OK: ${cases} actual SVG/font layouts; no clipped or overlapping text with all constructions visible.`);
 }finally{await browser.close();}
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
