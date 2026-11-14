'use strict';
// Fictional learner journeys. Answers come from visible conditions, never the
// application answer key. Reading stored results checks persistence only.
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.BONUS_ARTIFACTS||'artifacts/bonus-answer-integrity');
fs.mkdirSync(out,{recursive:true});
const errors=[],results=[];
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://fixture').pathname);
 const file=path.resolve(root,'.'+pathname);
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 try{const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(fs.readFileSync(file));}
 catch(_){res.writeHead(404);res.end();}
});
const count=async(page,id)=>Number(await page.locator('#'+id).textContent());
async function shot(page,name){await page.screenshot({path:path.join(out,name+'.png'),fullPage:true});}
async function vectors(page,origin,width){
 await page.goto(origin+'/trainers/ege-profile-vectors-trainer.html');
 async function choose(){
  for(let i=0;i<80;i++){
   if((await page.locator('#subLabel').textContent()).trim()==='длина · по координатам')break;
   await page.locator('.tab[data-mode="coords"]').click();
  }
  assert.equal((await page.locator('#subLabel').textContent()).trim(),'длина · по координатам');
  const prompt=await page.locator('#prompt').innerText(),m=prompt.match(/\{\s*(-?\d+)\s*;\s*(-?\d+)\s*\}/);
  assert(m,'Readable coordinates in condition: '+prompt);
  const squared=Number(m[1])**2+Number(m[2])**2;
  return [squared,Math.sqrt(squared)];
 }
 const answers=await choose();
 for(const value of ['',answers[0]+'tail','Infinity']){
  await page.locator('#stepIn').fill(value);await page.locator('#stepCheck').click();
  assert.match(await page.locator('#stepInputFeedback').innerText(),/Введите ответ|Введите число целиком/);
  assert.equal(await page.locator('.stepDone').count(),0);assert.equal(await count(page,'stSolved'),0);
  assert.equal(await page.locator('#hintBox').isVisible(),false,'Format feedback does not reveal the mathematical hint');
 }
 await page.locator('#stepInputFeedback').scrollIntoViewIfNeeded();await shot(page,'vectors-format-'+width);
 await page.locator('#stepHint').click();
 for(const answer of answers){await page.locator('#stepIn').fill(String(answer));await page.locator('#stepCheck').click();}
 assert.equal(await count(page,'stSolved'),1);assert.equal(await count(page,'stRight'),0);assert.equal(await count(page,'stStreak'),0);
 assert.match(await page.locator('#feedback').innerText(),/подсказкой/);
 assert.equal(await page.locator('.stepDone.helped').count(),1);
 await page.locator('#feedback').scrollIntoViewIfNeeded();await shot(page,'vectors-assisted-'+width);
 await page.reload();assert.equal(await count(page,'stSolved'),1);assert.equal(await count(page,'stRight'),0);
 const next=await choose();
 for(const answer of next){await page.locator('#stepIn').fill(String(answer));await page.locator('#stepCheck').click();}
 assert.equal(await count(page,'stSolved'),2);assert.equal(await count(page,'stRight'),1);assert.equal(await count(page,'stStreak'),1);
 results.push({width,trainer:'vectors',solved:2,independent:1,formatFeedback:true,reload:true});
}
async function theatre(page,origin,width){
 await page.goto(origin+'/trainers/teatr-formul-daily.html');await page.locator('#act-2').click();
 for(const mode of ['sum','diff']){
  await page.locator('#t-'+mode).click();
  const base=Number(await page.locator('#t-body .actor.role-a .tile').innerText()),k=Number(await page.locator('#t-body .actor.role-b .tile').innerText());
  const answers=[base*base,2*base*k,k*k,(mode==='sum'?base+k:base-k)**2];
  for(const raw of ['',answers[0]+'.9',answers[0]+'abc']){
   await page.locator('#ans-1').fill(raw);await page.locator('#stepc-1 .go').click();
   assert.equal(await page.locator('#ans-1').isEnabled(),true);assert.equal(await page.locator('#stepc-2').isVisible(),false);
   assert.match(await page.locator('#hint-1').innerText(),/Сначала введите ответ|Введите целое число полностью/);
  }
  if(mode==='sum'){await page.locator('#hint-1').scrollIntoViewIfNeeded();await shot(page,'theatre-format-'+width);}
  for(let i=0;i<answers.length;i++){await page.locator('#ans-'+(i+1)).fill((i===0?'+':'')+answers[i]);await page.locator('#stepc-'+(i+1)+' .go').click();}
 }
 assert.equal(await count(page,'daily-solved'),2);assert.equal(await count(page,'daily-clean'),2,'Format mistakes do not penalize mathematics');
 await page.locator('#act-4').click();await page.locator('#s-train-btn').click();
 const first=await page.locator('#sstepc-1 .eqline').innerText(),p=Number(await page.locator('#sstepc-1 .eqline .rb').innerText());
 const negative=first.split('=')[0].includes('−'),coef=(negative?-2:2)*p;
 await page.locator('#s1b').fill(String(p*p));await page.locator('#sstepc-1 .go').click();
 assert.match(await page.locator('#shint-1').innerText(),/Заполните все поля/);
 await page.locator('#s1a').fill(coef+'x');await page.locator('#sstepc-1 .go').click();
 assert.match(await page.locator('#shint-1').innerText(),/Введите целые коэффициенты полностью/);
 assert.equal(await page.locator('#sstepc-2').isVisible(),false);
 await page.locator('#s1a').fill(String(coef));await page.locator('#sstepc-1 .go').click();
 assert.equal(await page.locator('#s1a').isDisabled(),true);assert.equal(await page.locator('#sstepc-2').isVisible(),true);
 await page.reload();await page.locator('#act-2').click();
 assert.equal(await count(page,'daily-solved'),2);assert.equal(await count(page,'daily-clean'),2);
 results.push({width,trainer:'theatre',solved:2,clean:2,wholeInput:true,coefficientFeedback:true,reload:true});
}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
 try{
  for(const width of [320,390,1280]){
   const context=await browser.newContext({viewport:{width,height:900}});
   // Fonts and remote services are irrelevant to these offline learner checks.
   await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
   await context.addInitScript(()=>{let seed=731;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};});
   try{const page=await context.newPage();page.on('pageerror',error=>errors.push({width,message:error.message}));await vectors(page,origin,width);await theatre(page,origin,width);}
   finally{await context.close();}
  }
  assert.deepEqual(errors,[],'No uncaught page exceptions');
  console.log('BONUS_ANSWER_INTEGRITY_BROWSER_OK '+JSON.stringify(results));
 }finally{fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({results,errors},null,2)+'\n');await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
