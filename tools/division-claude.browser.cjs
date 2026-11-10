'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const KEY='mathExamDivisionClaude.v1';
const fixture={version:1,stats:{total:0,right:0,supported:0,reviewed:0,streak:0,best:0,history:[]},attempt:{problem:{dividend:'4032',divisor:4,quotient:'1008'},mode:'training',level:'zero',phase:'findFirst',subPhase:'pick',stepIdx:0,trySelLen:0,done:false,attempts:0,assisted:false,counted:false}};
const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://fixture').pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  try{res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}
  catch(e){res.writeHead(404);res.end();}
});
async function main(){
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({headless:true});
  try{
    for(const width of [320,1280]){
      const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
      const errors=[];const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
      await page.addInitScript(({KEY,fixture})=>{if(!localStorage.getItem(KEY))localStorage.setItem(KEY,JSON.stringify(fixture));},{KEY,fixture});
      await page.goto('http://127.0.0.1:'+server.address().port+'/trainers/long-division-claude.html');
      assert.equal(await page.title(),'Деление уголком — тренажёр Клода | MathExam');
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no document overflow');
      await page.getByRole('button',{name:'Выбрать 4',exact:true}).press('Enter');
      await page.locator('#countBtns button').filter({hasText:/^4$/}).click();
      await page.reload();
      assert.equal(await page.evaluate(()=>phase+'/'+subPhase),'divide/pick');
      for(let index=0;index<4;index++){
        const digit='1008'[index];
        assert.equal(await page.locator('.zero-suggest').count(),0,'training hides the zero answer');
        await page.locator('#picker button').filter({hasText:new RegExp('^'+digit+'$')}).click();
        if(index===0){
          const aligned=await page.evaluate(()=>{
            const rows=document.querySelectorAll('#ugolok .urow');
            const dividend=rows[1].querySelector('.cell').getBoundingClientRect();
            const product=[...document.querySelector('#ugolok .cell.minus').parentElement.querySelectorAll('.cell')].find(x=>!x.classList.contains('minus')&&!x.classList.contains('gap')).getBoundingClientRect();
            return Math.abs(dividend.x-product.x)<1;
          });
          assert(aligned,'product and dividend use the same written column');
          await page.reload();assert.equal(await page.evaluate(()=>subPhase),'remcheck');
        }
        await page.locator('#remCheckBtns button').first().click();
        if(index<3)await page.locator('#bringBtn').click();
      }
      assert.equal(await page.locator('#total').innerText(),'1');
      assert.equal(await page.locator('#right').innerText(),'1');
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'finished document fits');
      if(process.env.DIVISION_SCREENSHOTS){fs.mkdirSync(process.env.DIVISION_SCREENSHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.DIVISION_SCREENSHOTS,'claude-division-'+width+'.png'),fullPage:true});}
      assert.deepEqual(errors,[]);
      await context.close();
    }
    console.log('DIVISION_CLAUDE_BROWSER_OK: 320/1280, keyboard, zero, retained steps, column alignment');
  }finally{await browser.close();server.close();}
}
main().catch(e=>{console.error(e);server.close();process.exitCode=1;});
