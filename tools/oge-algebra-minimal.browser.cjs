/* CI browser proof for the existing algebra engines in their new presentation. */
const {chromium}=require('playwright');const assert=require('node:assert/strict');const path=require('node:path');const fs=require('node:fs');
const files=['oge-task7-number-line.html','oge-task8-powers-roots.html','oge-task9-equations.html','oge-task10-probability.html','oge-task12-formulas-trainer.html','oge-task14-progressions.html'];
async function checkRootExplanationAnchors(page,width,output){
  await page.locator('.minimal-settings > summary').click();
  await page.locator('nav.tabs button[data-v="learn"]').click();
  const evidence=[];
  for(const id of ['p3','p4']){
    // Use the same visible cross-link as a learner; preserve smooth scrolling.
    await page.locator('#p6').getByRole('button',{name:'п. '+id.slice(1),exact:true}).click();
    await page.evaluate(async id=>{
      const target=document.getElementById(id),start=performance.now();
      let previous=scrollY,stableSince=start;
      while(performance.now()-start<5000){
        await new Promise(requestAnimationFrame);
        const now=performance.now(),current=scrollY;
        if(Math.abs(current-previous)>.1)stableSince=now;
        previous=current;
        const margin=parseFloat(getComputedStyle(target).scrollMarginTop);
        if(now-stableSince>=150&&Math.abs(target.getBoundingClientRect().top-margin)<1)return;
      }
      throw new Error(id+' did not finish scrolling to its explanation');
    },id);
    const measured=await page.evaluate(id=>{
      const target=document.getElementById(id),header=document.querySelector('body > header');
      const position=getComputedStyle(header).position;
      const obstruction=['sticky','fixed'].includes(position)?Math.max(0,header.getBoundingClientRect().bottom):0;
      const rect=element=>{const r=element.getBoundingClientRect();return {top:r.top,bottom:r.bottom};};
      return {id,width:innerWidth,scrollY,headerPosition:position,obstruction,card:rect(target),heading:rect(target.querySelector('h2')),formula:rect(target.querySelector('p .m')),height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth+1};
    },id);
    const context=JSON.stringify(measured);
    assert(measured.card.top>=measured.obstruction+8,context+' card clears header');
    assert(measured.card.top<=measured.obstruction+80,context+' explanation stays near viewport top');
    for(const part of [measured.heading,measured.formula]){
      assert(part.top>=measured.obstruction+8,context+' heading and first formula are unobscured');
      assert(part.bottom<=measured.height,context+' heading and first formula fit in viewport');
    }
    assert.equal(measured.overflow,false,context+' no page overflow');
    evidence.push(measured);
    await page.screenshot({path:path.join(output,'oge-task8-'+id+'-anchor-'+width+'.png'),animations:'disabled'});
  }
  const result=page.locator('#unOut'),combine=page.locator('#p4').getByRole('button',{name:'под один корень',exact:true});
  await page.locator('#unA').fill('0');await page.locator('#unB').fill('4');await combine.click();
  assert.match(await result.innerText(),/= 0\s*— полный квадрат/);
  await page.locator('#unA').fill('-1');await page.locator('#unB').fill('-1');await combine.click();
  assert.match(await result.innerText(),/Объединять нельзя: корень из отрицательного числа не определён/);
  assert.equal(await result.locator('.m').count(),0,'negative inputs clear the previous success formula');
  await page.locator('#unA').fill('32');await page.locator('#unB').fill('2');await combine.click();
  assert.match(await result.innerText(),/= 8\s*— полный квадрат/);
  assert.doesNotMatch(await result.innerText(),/Объединять нельзя/);
  fs.writeFileSync(path.join(output,'oge-task8-anchors-'+width+'.json'),JSON.stringify({anchors:evidence,productCases:['0 * 4 = 0','negative * negative rejected','32 * 2 -> 8; stale feedback cleared']},null,2)+'\n');
}
(async()=>{const browser=await chromium.launch({headless:true});try{const output=path.resolve(process.env.SCREENSHOT_DIR||'artifacts/oge-algebra-minimal');fs.mkdirSync(output,{recursive:true});for(const width of [320,360,641,1280]){const page=await browser.newPage({viewport:{width,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));for(const file of (width===641?['oge-task8-powers-roots.html']:files)){await page.goto('file://'+path.resolve(__dirname,'../trainers',file));const candidates=page.getByRole('button',{name:'Хочешь подсказку?',exact:true}).filter({visible:true});await candidates.first().waitFor();assert.equal(await candidates.count(),1,file+' one visible task');await candidates.first().evaluate(el=>el.setAttribute('data-retained-help','current'));const help=page.locator('[data-retained-help="current"]');assert.equal(await help.first().getAttribute('aria-expanded'),'false');assert.equal(await page.locator('.minimal-settings[open]').count(),0);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,file+' horizontal overflow at '+width);await page.screenshot({path:path.join(output,file.replace('.html','')+'-'+width+'.png'),fullPage:true,animations:'disabled'});if(file==='oge-task10-probability.html')await page.locator('#mar-root .aw-dec').first().fill('0,375');await help.first().click();assert.equal(await help.first().getAttribute('aria-expanded'),'true');assert.equal(await page.locator('.minimal-hint-panel:visible').count(),1);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,file+' hint overflow at '+width);if(file==='oge-task10-probability.html'){const main=page.locator('#mar-root .aw-dec').first(),check=page.locator('#mar-root [id$="-ck"]').first(),step=page.locator('#mar-root .minimal-hint-panel .step input').first();assert.equal(await main.isEnabled(),true);assert.equal(await check.isEnabled(),true);assert.equal(await main.inputValue(),'0,375');await step.fill('23');await help.first().click();assert.equal(await help.first().getAttribute('aria-expanded'),'false');assert.equal(await page.locator('#mar-root .minimal-hint-panel').isVisible(),false);await help.first().click();assert.equal(await help.first().getAttribute('aria-expanded'),'true');assert.equal(await step.inputValue(),'23');assert.equal(await main.inputValue(),'0,375');assert.equal(await check.isEnabled(),true);}if(width===360)await page.screenshot({path:path.join(output,file.replace('.html','')+'-hint.png'),fullPage:true,animations:'disabled'});if(file==='oge-task8-powers-roots.html')await checkRootExplanationAnchors(page,width,output);}assert.deepEqual(errors,[]);await page.close();}console.log('OGE_ALGEBRA_MINIMAL_BROWSER_OK');}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
