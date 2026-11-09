'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),I=require('../../stereo-course/assets/investigations.js');
const root=path.resolve(__dirname,'../..'),out=process.env.ATANASYAN_AUDIT_ARTIFACTS||path.join(require('os').tmpdir(),'mathexam-atanasyan-audit');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});const errors=[],evidence=[];
 try{
  for(const width of [320,390,1280]){
   const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
   for(const [id,kind] of [['sections','cube'],['projection','projection'],['sphere','sphere']]){
    await page.goto('file://'+root+'/stereo-course/index.html#'+id);await page.reload();await page.locator('#answer').fill('Сохранённый ответ');await page.locator('.more-sections>summary').click();await page.locator('[data-stage="1"]').click();
    assert.equal(await page.locator('[data-lab-model]').count(),0);await page.locator('[data-lab-prediction]').selectOption('1');await page.locator('[data-lab-action=reveal]').click();await page.locator('[data-lab-model] svg').waitFor();
    await page.locator('[data-lab-explanation]').fill('Проверю геометрическое основание и особый случай.');
    for(const value of I.specs[kind].presets){
     await page.locator('[data-lab-preset="'+value+'"]').click();const svg=page.locator('[data-lab-model] svg');assert(!/NaN|Infinity/.test(await svg.innerHTML()));
     assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal overflow '+id+'/'+value+'/'+width);
     const info=await svg.evaluate(s=>({labels:[...s.querySelectorAll('.am-label')].map(n=>{const b=n.getBBox(),v=s.viewBox.baseVal;return {text:n.textContent,inside:b.x>=-1&&b.y>=-1&&b.x+b.width<=v.width+1&&b.y+b.height<=v.height+1};}),yaw:s.dataset.yaw}));
     assert(info.labels.every(l=>l.inside),'labels remain inside model');await svg.focus();await page.keyboard.press('ArrowRight');const yaw=await svg.getAttribute('data-yaw');assert.notEqual(yaw,info.yaw);const metric=await page.locator('[data-lab-metrics]').innerText();
     await page.reload();assert.equal(await page.locator('[data-lab-model] svg').getAttribute('data-yaw'),yaw,'camera restored');assert.equal(await page.locator('[data-lab-metrics]').innerText(),metric,'geometry unchanged by rotation/reload');
     evidence.push({id,kind,value,width,metric,labels:info.labels,restored:true});
     if([0,1.5,3,4,5,6,8].includes(value)){await page.locator('#investigation').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'stereo-'+id+'-'+width+'-'+value+'.png'),fullPage:true});}
    }
    assert.equal(await page.locator('[data-lab-explanation]').inputValue(),'Проверю геометрическое основание и особый случай.');await page.locator('[data-lab-action=transfer]').click();assert.equal(await page.locator('[data-lab-model]').count(),0);
    let state=await page.evaluate(id=>JSON.parse(localStorage.getItem('mathExamStereo.v1')).units[id],id);const q=I.questions(kind)[state.investigation.question];await page.locator('[data-lab-answer]').fill(String(q.answer));await page.locator('[data-lab-check] button[type=submit]').click();
    state=await page.evaluate(id=>JSON.parse(localStorage.getItem('mathExamStereo.v1')).units[id],id);assert.equal(state.investigation.independent,1);assert.equal(state.independent,0);await page.reload();await page.locator('[data-lab-check] button[type=submit]').click();assert.equal(await page.evaluate(id=>JSON.parse(localStorage.getItem('mathExamStereo.v1')).units[id].investigation.independent,id),1);
    await page.locator('[data-lab-action=practice]').click();assert.equal(await page.locator('#answer').inputValue(),'');assert.equal(await page.evaluate(id=>JSON.parse(localStorage.getItem('mathExamStereo.v1')).units[id].assisted,id),false);
   }
   await context.close();
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'stereo-investigations-evidence.json'),JSON.stringify({evidence,errors},null,2));console.log('STEREO_INVESTIGATIONS_BROWSER_OK: exact presets, keyboard camera, parameter/explanation restore, fresh checks at 320/390/1280');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
