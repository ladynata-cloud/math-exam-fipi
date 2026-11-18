'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require('playwright');

(async () => {
  const options = process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {};
  const browser = await chromium.launch({...options, headless:true});
  try {
    const context = await browser.newContext({viewport:{width:320,height:820},offline:true});
    const page = await context.newPage();
    page.setDefaultTimeout(6000);
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    const url=pathToFileURL(path.resolve(__dirname,'../trainers/oge-informatics-1-10-tutor.html')).href;
    await page.goto(url);
    const main=page.locator('#trainingCard'), answer=main.locator('#answerInput');
    async function promptIdentity(n){
      if(n===9) return main.locator('#taskText .graph-key li').allTextContents();
      return main.locator('#taskText').innerText();
    }
    for(let n=1;n<=10;n++){
      await page.locator(`[data-topic="${n}"]`).click();
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true,`mobile width #${n}`);
      await answer.fill('T?');
      await answer.press('Enter');
      assert.ok(await main.locator('#feedback.bad').isVisible());
      await main.locator('#hintBtn').click();
      assert.ok(await main.locator('#hintBox.show').isVisible());
      await main.locator('#tutorOpenBtn').click();
      while(await main.locator('[data-tutor-next]').isEnabled()) await main.locator('[data-tutor-next]').click();
      await main.locator('[data-tutor-reveal]').click();
      const last=await main.locator('#s_tutorInput').inputValue();
      await answer.fill(last); await answer.press('Enter');
      assert.ok(await main.locator('#feedback.good').isVisible(),`correct #${n}`);
      const old=await promptIdentity(n);
      await main.locator('#similarBtn').click();
      assert.notDeepEqual(await promptIdentity(n),old,`fresh question #${n}`);
    }
    await page.locator('[data-topic="9"]').click();
    const graphText=await promptIdentity(9);
    await main.locator('#tutorOpenBtn').click();
    await main.locator('#s_tutorInput').fill('1'); await main.locator('#s_tutorInput').press('Enter');
    assert.equal(await main.locator('[data-city="H"] .path-count').textContent(),'1');
    await main.locator('[data-tutor-next]').click();
    await main.locator('[data-tutor-close]').click(); await main.locator('#tutorOpenBtn').click();
    assert.equal(await main.locator('.active-city').getAttribute('data-city'),'G');
    await page.reload();
    assert.deepEqual(await promptIdentity(9),graphText);
    assert.equal(await main.locator('.active-city').getAttribute('data-city'),'G');
    assert.equal(await main.locator('[data-city="H"] .path-count').textContent(),'1');
    assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('ogeInfoTrainerStats')).attempts===10));
    await page.locator('#variantBtn').click();
    await page.locator('#miniAnswer0').fill('проба'); await page.locator('#miniAnswer0').press('Enter');
    assert.ok(await page.locator('#miniResult0.no').isVisible());
    await page.locator('[data-mode="exam"]').click();
    assert.ok(await page.locator('[data-mini-hint="0"]').isDisabled());
    await page.locator('#checkVariantBtn').click();
    assert.equal(await page.locator('#variantScore').textContent(),'0/10 верно');
    await page.goto(url+'?example=paths-article');
    assert.ok((await main.locator('#taskMeta').innerText()).includes('9'));
    const fixed=await main.locator('#taskText').innerText();
    await page.reload();
    assert.equal(await main.locator('#taskText').innerText(),fixed);
    assert.deepEqual(errors,[]);
    console.log('OGE_INFORMATICS_BROWSER_PASS topics=10 mobile=320 offline=file keyboard=pass resume=pass variant=pass article=pass');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
