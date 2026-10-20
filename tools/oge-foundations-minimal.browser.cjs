'use strict';
// Run with Playwright Chromium installed; staged execution can set TRAINER_SOURCE_ROOT.
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),source=process.env.TRAINER_SOURCE_ROOT||root;
const output=process.env.OGE_FOUNDATIONS_SCREENSHOTS||path.join(root,'artifacts','oge-foundations-minimal');
const files=[['arifmetika','?level=n3c'],['drobi-oge-trainer',''],['negative-numbers','?seed=minimal-browser'],['rounding-stepwise','?place=-2']];
async function serve(){const server=http.createServer((req,res)=>{let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}
  const file=[root,source].map(base=>path.resolve(base,'.'+pathname)).find(file=>[root,source].some(base=>file.startsWith(base+path.sep))&&fs.existsSync(file)&&fs.statSync(file).isFile());if(!file){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return server;}
async function noOverflow(page){assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'No horizontal page overflow at '+page.viewportSize().width);}
async function submit(page,input,button,value){await page.locator(input).fill(String(value));await page.locator(button).click();}
(async()=>{fs.mkdirSync(output,{recursive:true});const server=await serve();let browser;try{browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{})});const errors=[];
  for(const width of [320,360,1280]){const page=await browser.newPage({viewport:{width,height:900}});page.on('pageerror',error=>errors.push(String(error)));const base='http://127.0.0.1:'+server.address().port;
    for(const [file,query]of files){await page.goto(base+'/trainers/'+file+'.html'+query);await page.locator('#ans,#dAns').first().waitFor();await noOverflow(page);assert.equal(await page.locator('details.foundation-options[open],details.foundation-results[open],details.foundation-reference[open]').count(),0);
      await page.screenshot({path:path.join(output,file+'-'+width+'.png'),fullPage:true});
      if(file==='arifmetika'){const first=await page.evaluate(()=>({answer:task.csteps[cIdx].a,writes:task.csteps[cIdx].writes.filter(w=>w.row!=='CAR')}));await submit(page,'#ans','#check',first.answer);for(const write of first.writes){assert.equal(await page.evaluate(write=>task.writes[write.row][write.col],write),write.ch);}await page.locator('#hint').click();assert(await page.locator('#fb').textContent());await noOverflow(page);}
      if(file==='rounding-stepwise'){const task=await page.evaluate(()=>({ti:window.task.ti,li:window.task.li,decision:window.task.decision,answer:window.task.ansText}));await page.locator('.digit[data-i="'+task.ti+'"]').click();assert.equal(await page.evaluate(()=>step),'look');await page.locator('.digit[data-i="'+task.li+'"]').click();assert.equal(await page.evaluate(()=>step),'decision');await page.locator('#'+task.decision).click();assert.equal(await page.evaluate(()=>step),'answer');await page.locator('#hint').click();assert.equal(await page.locator('#ans').inputValue(),'');await submit(page,'#ans','#check',task.answer);assert.equal(await page.evaluate(()=>stats.total),1);await noOverflow(page);await page.screenshot({path:path.join(output,file+'-solved-'+width+'.png'),fullPage:true});}
      if(file==='negative-numbers'){
        assert(await page.locator('#svg .pt').count());
        const contrast=await page.locator('#svg>text').first().evaluate(node=>{
          const luminance=value=>{const rgb=value.match(/[\d.]+/g).slice(0,3).map(Number).map(c=>{c/=255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;});return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];};
          const a=luminance(getComputedStyle(node).fill),b=luminance(getComputedStyle(document.querySelector('.svgWrap')).backgroundColor);
          return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
        });
        assert(contrast>=4.5,'Number-line labels remain readable on the light surface');
        await page.locator('#hint').click();assert.equal(await page.locator('#ans').inputValue(),'');assert(await page.locator('#hintBox.show').count());
        await page.screenshot({path:path.join(output,file+'-hint-'+width+'.png'),fullPage:true});
        const task=await page.evaluate(()=>getBoardTrainerState().task);
        await page.locator('#svg .pt').nth(task.a+10).click();
        assert.equal(await page.evaluate(()=>getBoardTrainerState().phase),'end','A starting point outside the initial mobile window is reachable by scrolling');
        if(width<=360)assert(await page.locator('.svgWrap').evaluate(node=>node.scrollLeft>0),'The mobile line really pans to the selected positive point');
        await page.locator('#svg .pt').nth(task.res+10).click();
        assert.equal(await page.evaluate(()=>getBoardTrainerState().phase),'answer');
        await submit(page,'#ans','#check',task.res);assert.equal(await page.evaluate(()=>getBoardTrainerState().phase),'done');
        await page.screenshot({path:path.join(output,file+'-solved-'+width+'.png'),fullPage:true});
        await page.locator('#negative-options>summary').click();assert(await page.locator('a[href="/trainers/who-is-stronger.html"]').isVisible());await noOverflow(page);
      }
      if(file==='drobi-oge-trainer'){assert.equal(await page.locator('#dStepsArea').isVisible(),false);await page.locator('#dStepBtn').click();assert.equal(await page.locator('#dAns').inputValue(),'');await submit(page,'#foundationHintAnswer','#foundationHintCheck','50');assert.equal(await page.locator('.foundation-help-step.done').count(),1);await page.locator('#dStepBtn').click();await page.locator('#dStepBtn').click();assert.equal(await page.locator('.foundation-help-step.done').count(),1);await page.locator('#dAns').fill('23/36');assert(await page.locator('.foundation-answer-preview .f').count());await noOverflow(page);await page.screenshot({path:path.join(output,file+'-hint-'+width+'.png'),fullPage:true});}
    }
    for(const route of ['fraction-multiply','decimal-multiply','fraction-mixed','decimal-mixed']){await page.goto(base+'/trainers/drobi-oge-trainer.html#practice='+route);await page.locator('#gIn').waitFor();assert.equal(await page.locator('#gSteps>.gstep').count(),1);await page.locator('#gHint').click();assert(await page.locator('#gHintBox').isVisible());await noOverflow(page);await page.screenshot({path:path.join(output,route+'-'+width+'.png'),fullPage:true});}
    await page.close();
  }assert.deepEqual(errors,[]);console.log('PASS: foundations at 320/360/1280, hints, retained steps, inputs, rounding and deep links. Screenshots: '+output);
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}})().catch(error=>{console.error(error);process.exitCode=1;});
