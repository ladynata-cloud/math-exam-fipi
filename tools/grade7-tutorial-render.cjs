'use strict';
/* Reusable silent how-to clips recorded from actual local public trainers.
 * Fresh browser profiles only. No remote requests, accounts, uploads or writes.
 * The overlay is editorial guidance; task controls and feedback are the real UI. */
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const { createRequire } = require('node:module');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const assert = require('node:assert/strict');
const run = promisify(execFile);
const root = path.resolve(__dirname, '..');
const guides = require('../learning/topic-guides.js');
const ids = guides.items.map(item => item.id);
const tasks = (process.argv.find(arg => arg.startsWith('--tasks=')) || '--tasks=linear-equation,numeric-expressions').slice(8).split(',');
assert.ok(tasks.length && tasks.every(id => ids.includes(id)), 'Only fixed public topic IDs may be rendered');
const outputArg = process.argv.find(arg => arg.startsWith('--output='));
assert.ok(outputArg, 'Pass --output=/absolute/scratch/path; files are never published automatically');
const output = path.resolve(outputArg.slice(9));
assert.notEqual(output, path.join(root, 'video-lessons/media'), 'Render to a review directory before publishing');
const mods = process.env.NODE_PATH?.split(path.delimiter)[0] || process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || path.join(root, 'video-worker/node_modules');
const { chromium } = createRequire(path.join(mods, 'package.json'))('playwright');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const formats = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.mp4':'video/mp4' };
let report = { scope:'Actual local public trainer UI, fresh demonstration work, no accounts or remote writes.', tutorials: [], external: [], errors: [] };
let reportWrite = Promise.resolve();
function checkpoint() { const json=JSON.stringify(report,null,2); reportWrite=reportWrite.then(()=>fs.writeFile(path.join(output,'tutorial-report.json'),json)); return reportWrite; }
const server = http.createServer(async (req, res) => {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end(); return; }
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/favicon.ico') { res.writeHead(204); res.end(); return; }
    let filename = path.resolve(root, '.' + decodeURIComponent(url.pathname));
    if (!filename.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
    if ((await fs.stat(filename)).isDirectory()) filename = path.join(filename,'index.html');
    const bytes = await fs.readFile(filename); res.writeHead(200, {'Content-Type':formats[path.extname(filename)] || 'application/octet-stream','Cache-Control':'no-store'}); res.end(req.method === 'HEAD' ? undefined : bytes);
  } catch { res.writeHead(404); res.end(); }
});
function answerText(value) { return Array.isArray(value) ? value.map(answerText).join('; ') : value && typeof value === 'object' ? `${value.n}/${value.d}` : String(value).replace('.', ','); }
async function overlay(page) {
  await page.evaluate(() => {
    const style=document.createElement('style'); style.textContent=`html{scroll-behavior:auto!important;scroll-padding-top:190px}body{padding-top:165px!important;padding-bottom:340px!important}#tutorial-bar{position:fixed;inset:0 0 auto;z-index:2147483647;padding:18px 36px 20px;background:#103c38;color:#fff;box-shadow:0 8px 25px #102a3529;font-family:Arial,sans-serif;text-align:left}#tutorial-kicker{font-size:16px;letter-spacing:.05em;color:#bfe6d7;font-weight:700;margin-bottom:7px}#tutorial-title{font-size:36px;font-weight:750;line-height:1.13}#tutorial-note{font-size:21px;line-height:1.25;color:#e6f4ee;margin-top:8px}#tutorial-focus{position:fixed;z-index:2147483645;border:4px solid #db831e;border-radius:13px;box-shadow:0 0 0 5px #fff9;pointer-events:none;transition:all .45s ease}#tutorial-pointer{position:fixed;z-index:2147483646;pointer-events:none;width:0;height:0;border-left:12px solid transparent;border-right:12px solid transparent;border-top:22px solid #e38a23;filter:drop-shadow(0 1px 2px #fff);transition:left .5s ease,top .5s ease}.tutorial-click{animation:tutorial-pulse .75s ease 2}@keyframes tutorial-pulse{50%{box-shadow:0 0 0 13px #f5b85d77}}`;
    document.head.append(style); const bar=document.createElement('aside');bar.id='tutorial-bar';bar.innerHTML='<div id="tutorial-kicker"></div><div id="tutorial-title"></div><div id="tutorial-note"></div>';document.body.append(bar);
    for(const id of ['tutorial-focus','tutorial-pointer']){const el=document.createElement('div');el.id=id;document.body.append(el);}
  });
}
async function caption(page, chapter, title, note, topic) {
  await page.evaluate(({chapter,title,note,topic}) => {
    document.getElementById('tutorial-kicker').textContent=`КАК ЗАНИМАТЬСЯ · ${topic} · ${chapter}/5`;
    document.getElementById('tutorial-title').textContent=title;document.getElementById('tutorial-note').textContent=note;
  },{chapter,title,note,topic});
}
async function focus(page, locator, click = false) {
  await locator.waitFor({state:'visible'});
  await locator.evaluate(el=>{const rect=el.getBoundingClientRect();window.scrollBy(0,rect.top-340);});
  await sleep(180);
  const box=await locator.boundingBox();assert.ok(box && box.y>160 && box.y<650,'Highlighted real control must be visible below the caption');
  await page.evaluate(box=>{const focus=document.getElementById('tutorial-focus'),pointer=document.getElementById('tutorial-pointer');Object.assign(focus.style,{left:(box.x-8)+'px',top:(box.y-8)+'px',width:(box.width+16)+'px',height:(box.height+16)+'px'});Object.assign(pointer.style,{left:(box.x+box.width/2-12)+'px',top:(box.y-32)+'px'});focus.classList.remove('tutorial-click');},box);
  await sleep(650);await page.mouse.move(box.x+box.width/2,box.y+box.height/2,{steps:14});
  if(click){await page.evaluate(()=>document.getElementById('tutorial-focus').classList.add('tutorial-click'));await locator.click();}
}
async function screenshot(page,folder,name){await page.screenshot({path:path.join(folder,name+'.png')});}
async function finishClip({id,folder,context,page,began,start,target}) {
  const duration=(Date.now()-began)/1000-start,video=page.video();await context.close();const raw=await video.path(),file=path.join(output,`using-${id}.mp4`);
  await run('ffmpeg',['-hide_banner','-loglevel','error','-y','-ss',String(start),'-i',raw,'-t',String(duration),'-vf','fps=30,scale=1280:720','-c:v','libx264','-preset','fast','-crf','23','-pix_fmt','yuv420p','-an','-movflags','+faststart',file],{timeout:180000});
  const metadata=JSON.parse((await run('ffprobe',['-v','error','-show_streams','-show_format','-of','json',file])).stdout);assert.equal(metadata.streams.filter(s=>s.codec_type==='audio').length,0);
  const result={id,file:`using-${id}.mp4`,duration:Number(metadata.format.duration),bytes:(await fs.stat(file)).size,width:1280,height:720,audioStreams:0,route:target.pathname+target.search+target.hash,chapters:5};report.tutorials.push(result);await checkpoint();console.log(JSON.stringify(result));
}
async function recordFoundation(args) {
  const {id,guide,folder,page,began}=args, basic=['negative-numbers','fractions'].includes(id), geometry=id==='adjacent-angles';
  let condition,input,correct,wrong,feedback,check,hint,hintContent,next;
  if(basic){
    await page.locator('#practiceAnswer input, #practiceAnswer button').first().waitFor();
    const t=await page.evaluate(()=>__trainerDebug.state().current);condition='#practicePrompt';feedback='#practiceFeedback';check='#checkTask';hint='#hint1';hintContent='#hintStack';next='#nextTask';
    if(t.kind==='choice'){input='#practiceAnswer [data-id="'+t.answer+'"]';correct=input;wrong='#practiceAnswer [data-id="'+t.options.find(o=>o.id!==t.answer).id+'"]';}
    else {input='#practiceAnswer input';correct=answerText(t.answer);wrong=typeof t.answer==='object'?answerText({n:t.answer.n+t.answer.d,d:t.answer.d}):answerText(Number(t.answer)+1);}
  }else if(geometry){
    condition='#taskText';feedback='#msg';hint='button[onclick="showHint()"]';hintContent='#msg';next='#nextBtn';
    const text=await page.locator(condition).innerText(),u=Number(text.match(/∠1 = (\d+)/)[1]),ask=Number(text.match(/Найдите ∠(\d)/)[1]),answer=ask===3?u:180-u;
    const buttons=await page.locator('#pool button').allTextContents(),correctIndex=buttons.findIndex(label=>label.trim()===answer+'°');assert.ok(correctIndex>=0);
    correct='#pool button:nth-child('+(correctIndex+1)+')';wrong='#pool button:nth-child('+(correctIndex===0?2:1)+')';input=wrong;
  }else{
    await page.locator('#chips .chip').filter({hasText:id==='proportions'?'Найти неизвестный член':'Процент от числа'}).click();
    condition='#p-q .prompt';input='#p-q input';feedback='#p-fb';check='#p-check';hint='#p-h1';hintContent='#p-fb';next='#p-next';
    const text=await page.locator(condition).innerText();
    if(id==='proportions'){const m=text.match(/(x|\d+)\s*:\s*(x|\d+)\s*=\s*(x|\d+)\s*:\s*(x|\d+)/);assert.ok(m);const values=m.slice(1),at=values.indexOf('x'),a=values.map(Number);correct=answerText([a[1]*a[2]/a[3],a[0]*a[3]/a[2],a[0]*a[3]/a[1],a[1]*a[2]/a[0]][at]);}
    else {const percent=Number(text.match(/(\d+)%/)[1]),bold=(await page.locator('#p-q .prompt b').allTextContents()).map(t=>Number(t.replace('%',''))),whole=bold.find(n=>n!==percent);assert.ok(Number.isFinite(whole));correct=answerText(whole*percent/100);}
    wrong=String(Number(correct.replace(',','.'))+1);
  }
  await overlay(page);const start=(Date.now()-began)/1000;
  await caption(page,1,'Прочитай задание целиком',geometry?'Найди на рисунке известный угол и тот, который нужно вычислить.':'Сначала уточни, что именно нужно найти. Ответ вводится отдельно.',guide.title);
  await focus(page,page.locator(condition));await screenshot(page,folder,'01-condition');await sleep(3800);
  await caption(page,2,geometry?'Выбери вариант ответа':'Введи ответ в поле','Покажем на ошибке, как пользоваться проверкой и подсказкой.',guide.title);
  if(wrong.startsWith('#'))await focus(page,page.locator(wrong),true);else{await focus(page,page.locator(input));await page.locator(input).pressSequentially(wrong,{delay:200});}
  await screenshot(page,folder,'02-answer');await sleep(3300);
  await caption(page,3,geometry?'Прочитай сообщение проверки':'Нажми «Проверить»','Если ответ не совпал — это повод уточнить действие, а не начинать всё заново.',guide.title);
  if(check)await focus(page,page.locator(check),true);await focus(page,page.locator(feedback));assert.ok((await page.locator(feedback).innerText()).trim());await screenshot(page,folder,'03-feedback');await sleep(3800);
  await caption(page,4,'Открой подсказку и исправь ответ','Подсказка объясняет следующий ход. Потом попробуй выполнить его сама.',guide.title);
  await focus(page,page.locator(hint),true);await focus(page,page.locator(hintContent));await screenshot(page,folder,'04-hint');await sleep(3400);
  if(correct.startsWith('#'))await focus(page,page.locator(correct),true);else{await focus(page,page.locator(input));await page.locator(input).fill('');await page.locator(input).pressSequentially(correct,{delay:200});}
  if(check)await focus(page,page.locator(check),true);await focus(page,page.locator(feedback));await sleep(1400);
  await caption(page,5,'Возьми новый пример',geometry?'Нажми «Следующая». Прочитай новое условие и рассмотри новый рисунок.':'После разбора нажми «Новый пример». Попробуй решить без открытой подсказки.',guide.title);
  await focus(page,page.locator(next),true);await focus(page,page.locator(condition));await screenshot(page,folder,'05-new');await sleep(3800);
  return finishClip({...args,start});
}
async function recordManagedPath(args) {
  const {id,guide,folder,page,began}=args;
  await page.locator('[data-stage="2"]').click();
  const info=await page.evaluate(()=>{const id=location.hash.split('=')[1],l=PathCourse.state().lessons[id],t=PathData.task(id,l.seed),s=t.steps[l.step];return {first:PathPracticeView.answerText(s),choices:s.choices||[],answer:s.a};});
  await overlay(page);const start=(Date.now()-began)/1000;
  await caption(page,1,'Прочитай условие и вопрос шага','Тренажёр спрашивает один шаг решения. Ответ на всю задачу понадобится позднее.',guide.title);
  await focus(page,page.locator('#main .task').first());await screenshot(page,folder,'01-condition');await sleep(4000);
  await caption(page,2,info.choices.length?'Выбери ответ на этот вопрос':'Введи ответ на этот вопрос','Сначала покажем ошибку: её можно исправить в той же попытке.',guide.title);
  const choices=page.locator('[data-answer-choice]');
  if(info.choices.length){const options=await choices.all();let wrong;for(const option of options){if(await option.getAttribute('data-answer-choice')!==String(info.answer)){wrong=option;break;}}assert.ok(wrong);await focus(page,wrong,true);}
  else{await focus(page,page.locator('#answer'));await page.locator('#answer').pressSequentially('987654',{delay:140});}
  await focus(page,page.locator('#answerForm button.primary'),true);await focus(page,page.locator('#feedback'));assert.match(await page.locator('#feedback').innerText(),/Проверь/);await screenshot(page,folder,'02-answer');await sleep(3900);
  await caption(page,3,'Открой подсказку и исправь шаг','Прочитай причину, затем выбери или введи свой исправленный ответ.',guide.title);
  await focus(page,page.locator('#hint'),true);await focus(page,page.locator('#hintText'));await screenshot(page,folder,'03-feedback');await sleep(4300);
  if(info.choices.length)await focus(page,page.locator('[data-answer-choice="'+info.answer+'"]'),true);
  else{await focus(page,page.locator('#answer'));await page.locator('#answer').fill('');await page.locator('#answer').pressSequentially(info.first,{delay:180});}
  await focus(page,page.locator('#answerForm button.primary'),true);
  await caption(page,4,'Верная строка остаётся в решении','Теперь прочитай следующий вопрос. Если нужно, можно снова открыть подсказку.',guide.title);
  await focus(page,page.locator('#main .steps'));assert.ok((await page.locator('#main .steps').innerText()).trim());await screenshot(page,folder,'04-hint');await sleep(4500);
  await caption(page,5,'Попробуй самостоятельно на новых числах','Выбери «Самостоятельно», затем «Другие числа». В кабинете результат можно сдать учителю.',guide.title);
  await focus(page,page.locator('[data-stage="3"]'),true);await focus(page,page.locator('#new'),true);await focus(page,page.locator('#main .task'));await screenshot(page,folder,'05-new');await sleep(4400);
  return finishClip({...args,start});
}
async function record(id, browser, origin) {
  const guide=guides.get(id),folder=path.join(output,id);await fs.mkdir(folder,{recursive:true});
  const context=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:folder,size:{width:1280,height:720}},serviceWorkers:'block',locale:'ru-RU'});
  await context.route('**/*',route=>{const url=route.request().url();if((url.startsWith(origin+'/')||url.startsWith('data:')||url.startsWith('blob:'))&&['GET','HEAD'].includes(route.request().method()))return route.continue();report.external.push(url.split('?')[0]);return route.abort();});
  const page=await context.newPage(), began=Date.now();page.setDefaultTimeout(10000);page.on('pageerror',error=>report.errors.push({id,message:error.message}));
  const target=new URL(guide.publicUrl);await page.goto(origin+target.pathname+target.search+target.hash);
  const school=target.pathname.startsWith('/school/'),pathCourse=target.pathname.startsWith('/ege-baza/path/');
  if(!school&&!pathCourse)return recordFoundation({id,guide,folder,context,page,began,origin,target});
  if(id.startsWith('grade7-'))return recordManagedPath({id,guide,folder,context,page,began,origin,target});
  await page.locator('#answer').waitFor();
  const task=await page.evaluate(({school})=>{if(school){const state=JSON.parse(localStorage.getItem(WorkshopState.KEY));return WorkshopMath.generate(state.last.skill,state.last.seed);}const lesson=location.hash.split('=')[1],state=PathCourse.state().lessons[lesson];return PathData.task(lesson,state.seed);},{school});
  const first=school?answerText(task.steps[0].answer):await page.evaluate(()=>{const id=location.hash.split('=')[1],l=PathCourse.state().lessons[id],t=PathData.task(id,l.seed);return PathData.answerText(t.steps[l.step]);});
  await overlay(page);const start=(Date.now()-began)/1000;
  await caption(page,1,'Прочитай условие и вопрос шага','Сейчас отвечай на один вопрос. Всё решение сразу вводить не нужно.',guide.title);
  await focus(page,page.locator(school?'#task-panel .question':'#main .task').first());await screenshot(page,folder,'01-condition');await sleep(4000);
  await caption(page,2,'Введи ответ в это поле','Вводи число со знаком; дробь можно записать через /. Смотри формат вопроса.',guide.title);
  await focus(page,page.locator('#answer'));await page.locator('#answer').pressSequentially(first,{delay:230});await screenshot(page,folder,'02-answer');await sleep(3700);
  await caption(page,3,'Нажми «Проверить»','После верного ответа продолжай по шагам. Пройденные строки остаются.',guide.title);
  await focus(page,page.locator(school?'#answer-form button':'#answerForm button'),true);await sleep(400);
  if(school){await focus(page,page.locator('.feedback'));await sleep(1800);await focus(page,page.locator('[data-cmd="next"]'),true);await focus(page,page.locator('.v6-history'));}
  else await focus(page,page.locator('#main .steps'));
  await screenshot(page,folder,'03-feedback');await sleep(3300);
  await caption(page,4,'Если трудно — открой подсказку','Прочитай объяснение, затем вернись к своему ответу.',guide.title);
  await focus(page,page.locator(school?'[data-cmd="hint"]':'#hint'),true);await focus(page,page.locator(school?'#help .helper':'#hintText'));await screenshot(page,folder,'04-hint');await sleep(4200);
  await caption(page,5,'Теперь попробуй новый пример','Разбор помогает начать. Новый вариант покажет, что ты можешь сама.',guide.title);
  await focus(page,page.locator(school?'[data-cmd="mode"][data-value="practice"]':'#moreGuided'),true);await focus(page,page.locator(school?'#task-panel .question':'#main .task'));await screenshot(page,folder,'05-new');await sleep(4200);
  return finishClip({id,folder,context,page,began,start,target});
}
(async()=>{await fs.mkdir(output,{recursive:true});
if(process.argv.includes('--resume')){
 try{const previous=JSON.parse(await fs.readFile(path.join(output,'tutorial-report.json'),'utf8'));report.errors=previous.errors||[];report.external=previous.external||[];}catch(error){if(error.code!=='ENOENT')throw error;}
 for(const id of ids){const file=path.join(output,`using-${id}.mp4`);try{const stat=await fs.stat(file);for(const name of ['01-condition','02-answer','03-feedback','04-hint','05-new'])await fs.access(path.join(output,id,name+'.png'));const metadata=JSON.parse((await run('ffprobe',['-v','error','-show_streams','-show_format','-of','json',file])).stdout),v=metadata.streams.find(s=>s.codec_type==='video');assert.equal(v.codec_name,'h264');assert.equal(v.width,1280);assert.equal(v.height,720);assert.equal(metadata.streams.filter(s=>s.codec_type==='audio').length,0);assert.ok(Number(metadata.format.duration)>20);const target=new URL(guides.get(id).publicUrl);report.tutorials.push({id,file:`using-${id}.mp4`,duration:Number(metadata.format.duration),bytes:stat.size,width:1280,height:720,audioStreams:0,route:target.pathname+target.search+target.hash,chapters:5,resumed:true});}catch(error){if(error.code!=='ENOENT')throw error;}}
 await checkpoint();
}
const remaining=tasks.filter(id=>!report.tutorials.some(t=>t.id===id));
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;let browser;try{browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,chromiumSandbox:false});for(let i=0;i<remaining.length;i+=2)await Promise.all(remaining.slice(i,i+2).map(id=>record(id,browser,origin)));assert.deepEqual(report.errors,[]);console.log('GRADE7_TUTORIAL_RENDER_OK');}finally{await checkpoint();await browser?.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
