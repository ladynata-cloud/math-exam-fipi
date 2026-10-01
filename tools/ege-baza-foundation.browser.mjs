import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const root=process.cwd();
const server=http.createServer((req,res)=>{let p=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!p.startsWith(root+path.sep)&&p!==root){res.writeHead(403).end();return;}if(fs.existsSync(p)&&fs.statSync(p).isDirectory())p=path.join(p,'index.html');if(!fs.existsSync(p)){res.writeHead(404).end();return;}res.setHeader('Content-Type',p.endsWith('.html')?'text/html;charset=utf-8':p.endsWith('.js')?'text/javascript':'text/plain');fs.createReadStream(p).pipe(res);});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url=`http://127.0.0.1:${server.address().port}/trainers/ege-baza/course/`;
let browser;let checks=0;const ok=(value,message)=>{assert.ok(value,message);checks++;};
const snapshots=process.env.FOUNDATION_SCREENSHOTS_DIR;if(snapshots)fs.mkdirSync(snapshots,{recursive:true});
try{
 browser=await chromium.launch({headless:true,...(process.env.FOUNDATION_CHROMIUM_PATH?{executablePath:process.env.FOUNDATION_CHROMIUM_PATH}:{})});
 const context=await browser.newContext({viewport:{width:1366,height:1000}});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);
 const tasks=await page.evaluate(()=>MathExamFoundation.TASKS);
 const key=await page.evaluate(()=>MathExamFoundation.KEY);
 const skills=await page.evaluate(()=>MathExamFoundation.SKILLS.map(s=>s.id));
 ok(tasks.length===60,'All banks load');
 if(snapshots)await page.screenshot({path:path.join(snapshots,'module-desktop.png'),fullPage:true});
 const inputChecks=await page.evaluate(()=>['',' ','1/2','NaN','Infinity','1e3','1 2','<img>'].every(x=>MathExamFoundation.parseNumber(x)===null)&&MathExamFoundation.parseNumber('0,75')===.75&&MathExamFoundation.parseNumber('−2.5')===-2.5);
 ok(inputChecks,'Strict decimal input');
 await page.evaluate(()=>localStorage.setItem('legacy-trainer-progress','keep-me'));
 // Diagnostic: wrong answer and an explicit skip; no answer is revealed early.
 await page.click('[data-action="start-diagnostic"]');
 const diagnostic=tasks.filter(t=>t.phase==='diagnostic');
 for(let i=0;i<diagnostic.length;i++){
  await page.waitForSelector('#answer');
  ok(!(await page.locator('[data-action="hint"]').count()),'No diagnostic hints');
  if(i===1)await page.click('[data-action="skip"]');
  else{await page.fill('#answer',i===0?'999':String(diagnostic[i].answer));await page.click('#answer-form button');}
 }
 await page.waitForURL('**/#results-diagnostic');
 ok(await page.evaluate(()=>MathExamFoundation.result('diagnostic').correct===10),'Diagnostic scores skip and wrong answer');
 ok(await page.evaluate(()=>MathExamFoundation.SKILLS.every(s=>MathExamFoundation.skillState(s).level===0)),'Diagnostic grants no mastery');
 await page.goto(url+'#practice-decimal-0');
 await page.fill('#answer','1/2');await page.click('#answer-form button');
 ok(await page.evaluate(()=>JSON.parse(localStorage.getItem(MathExamFoundation.KEY)).practice['decimal-practice-1']?.tries||0)===0,'Invalid input is not a try');
 await page.click('[data-action="hint"]');await page.reload();
 ok(await page.locator('#feedback').isVisible(),'Hint survives reload');
 await page.fill('#answer','0,75');await page.click('#answer-form button');
 ok(await page.evaluate(()=>MathExamFoundation.skillState(MathExamFoundation.SKILLS[0]).solo===0),'Hint cannot earn independent credit after reload');
 for(const id of skills){const ts=tasks.filter(t=>t.phase==='practice'&&t.skill===id);for(let i=0;i<ts.length;i++){if(id==='decimal'&&i===0)continue;await page.goto(url+`#practice-${id}-${i}`);await page.fill('#answer',String(ts[i].answer).replace('.',','));await page.click('#answer-form button');}}
 ok(await page.evaluate(()=>MathExamFoundation.SKILLS.every(s=>MathExamFoundation.skillState(s).level===2)),'Three or more distinct independent practice successes per skill');
 await page.goto(url+'#checks');ok(await page.locator('[data-action="start-repeat"]').isDisabled(),'Repeat locked before checkpoint');
 await page.click('[data-action="start-checkpoint"]');
 const final=tasks.filter(t=>t.phase==='checkpoint');
 for(let i=0;i<final.length;i++){await page.fill('#answer',String(final[i].answer));await page.click('#answer-form button');if(i===0){await page.reload();ok(await page.locator('h2').innerText()==='Задание 2 из 12','Assessment resumes after reload');}}
 await page.waitForURL('**/#results-checkpoint');
 ok(await page.evaluate(()=>MathExamFoundation.SKILLS.every(s=>MathExamFoundation.skillState(s).level===3)),'Checkpoint confirms all six skills');
 await page.goto(url+'#checks');ok(await page.locator('[data-action="start-repeat"]').isDisabled(),'Repeat locked until 24 hours');
 await page.evaluate(()=>{const at=JSON.parse(localStorage.getItem(MathExamFoundation.KEY)).runs.checkpoint.finishedAt;Date.now=()=>at+24*60*60*1000;location.hash='#map';});
 await page.click('[data-page="checks"]');ok(await page.locator('[data-action="start-repeat"]').isEnabled(),'Repeat unlocks at 24 hours');
 await page.click('[data-action="start-repeat"]');
 for(const t of tasks.filter(t=>t.phase==='repeat')){await page.fill('#answer',String(t.answer));await page.click('#answer-form button');}
 await page.waitForURL('**/#results-repeat');
 ok(await page.evaluate(()=>MathExamFoundation.SKILLS.every(s=>MathExamFoundation.skillState(s).level===4)),'Separate repeat bank confirms retention');
 await page.click('[data-page="report"]');
 const downloaded=page.waitForEvent('download');await page.click('[data-action="download"]');const download=await downloaded;
 ok(download.suggestedFilename()==='mathexam-baza-module-1-report.txt','Report downloads');
 const reportText=await page.locator('#report-text').inputValue();ok(reportText.includes('12/12')&&reportText.includes('10/12'),'Report contains actual assessment scores');
 if(snapshots)await page.screenshot({path:path.join(snapshots,'module-progress.png'),fullPage:true});
 // Existing data survives own reset, and confirmation is necessary.
 await page.click('[data-action="reset-ask"]');await page.click('[data-action="reset-cancel"]');
 ok(await page.evaluate(()=>MathExamFoundation.result('checkpoint').finished),'Cancel reset preserves progress');
 await page.click('[data-action="reset-ask"]');await page.click('[data-action="reset-confirm"]');
 ok(await page.evaluate(()=>localStorage.getItem('legacy-trainer-progress')==='keep-me'&&!localStorage.getItem(MathExamFoundation.KEY)),'Reset touches only module key');
 // An error stays an error across reload; opening a full solution is support.
 await page.goto(url+'#practice-division-0');await page.fill('#answer','999');await page.click('#answer-form button');await page.reload();await page.fill('#answer','12');await page.click('#answer-form button');
 ok(await page.evaluate(()=>MathExamFoundation.skillState(MathExamFoundation.SKILLS[1]).solo===0),'Correction is not first-attempt credit');
 await page.goto(url+'#practice-division-1');await page.click('[data-action="solution"]');await page.reload();await page.fill('#answer','30');await page.click('#answer-form button');
 ok(await page.evaluate(()=>MathExamFoundation.skillState(MathExamFoundation.SKILLS[1]).solo===0),'Full solution remains support after reload');
 // Assessment interrupted by teaching is honestly marked as supported.
 await page.goto(url+'#checks');await page.click('[data-action="start-checkpoint"]');await page.goto(url+'#learn-percent');await page.goto(url+'#test-checkpoint');
 ok(await page.locator('#main .notice').isVisible(),'Learning during assessment is recorded');
 // Responsive models, local links, accessibility and no overflow.
 await page.setViewportSize({width:360,height:800});
 await page.goto(url+'#map');if(snapshots)await page.screenshot({path:path.join(snapshots,'module-mobile.png'),fullPage:true});
 for(const skill of skills){await page.goto(url+'#learn-'+skill);await page.locator('#slider').fill(skill==='division'?'2':skill==='choice'?'15':skill==='rounding'?'7':'50');await page.locator('#slider').dispatchEvent('input');ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No mobile overflow: '+skill);ok((await page.locator('#model-output').innerText()).length>20,'Interactive model: '+skill);}
 await page.goto(url+'#learn-division');await page.selectOption('#example','1');await page.locator('#slider').fill('2');await page.locator('#slider').dispatchEvent('input');
 ok((await page.locator('#model-output').innerText()).includes('350 : 7'),'Both numbers shift by 100');
 if(snapshots)await page.screenshot({path:path.join(snapshots,'division-mobile.png'),fullPage:true});
 for(const hash of ['#checks','#report','#teacher','#practice-choice-0']){await page.goto(url+hash);ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No mobile overflow: '+hash);}
 for(const s of await page.evaluate(()=>MathExamFoundation.SKILLS)){const response=await context.request.get(new URL(s.link,url).href);ok(response.ok(),'Related trainer '+s.id);}
 await page.goto(url+'#practice-choice-0');await page.locator('#answer').focus();await page.keyboard.type('1260');await page.keyboard.press('Enter');ok((await page.locator('#main').innerText()).includes('Верно с первого раза'),'Keyboard answer');
 // Corruption and denied storage retain a usable page and explicit warning.
 await page.evaluate(key=>localStorage.setItem(key,'{broken'),key);await page.reload();ok(await page.locator('#storage-warning').isVisible(),'Malformed storage notice');
 const blocked=await browser.newContext();await blocked.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new Error('blocked')};Storage.prototype.setItem=()=>{throw new Error('blocked')};});const bp=await blocked.newPage();await bp.goto(url+'#practice-decimal-0');await bp.fill('#answer','0.75');await bp.click('#answer-form button');ok(await bp.locator('#storage-warning').isVisible(),'Blocked storage is visible');ok((await bp.locator('#main').innerText()).includes('Верно с первого раза'),'Works without storage');await blocked.close();
 // File:// is supported because the module is self-contained.
 const filePage=await context.newPage();await filePage.goto('file://'+path.join(root,'trainers/ege-baza/course/index.html'));ok(await filePage.locator('h1').count()===1,'Standalone file opens');await filePage.close();
 ok(errors.length===0,'No uncaught browser errors: '+errors.join('; '));
 console.log(`EGE_BAZA_FOUNDATION_BROWSER_OK: ${checks} browser checks; complete diagnostic/practice/checkpoint/repeat flow.`);
}finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
