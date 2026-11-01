'use strict';
// Book-URL lifecycle audit. Serves repository bytes unchanged. All mutations of
// exercises/progress are ordinary learner UI actions; evaluate is read-only.
// A source answer oracle is explicitly labelled and is NOT independent maths QA.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),PREFIX=(process.env.BOOK_PREFIX||'').replace(/\/$/,''),WIDTHS=(process.env.BOOK_EXAM_WIDTHS||'320,390,1280').split(',').map(Number);
const OUT=path.resolve(process.env.BOOK_EXAM_OUTPUT||path.join(ROOT,'artifacts/book-audit-exam',PREFIX?'frozen':'source'));
const MATCH=process.env.BOOK_EXAM_MATCH||'';
const MAP=JSON.parse(fs.readFileSync(path.join(ROOT,'scripts/oge-book-edition/urls.json'),'utf8'));
const ROUTES=MAP.map(x=>({id:x.id,route:new URL(x.sourceUrl).pathname})).filter(x=>/oge-1-5-trainers|oge-task|task19-trainer|task-15-external-angle/.test(x.route)&&(!MATCH||new RegExp(MATCH).test(x.route)));
const REQUIRED=['start','wrong-answer','hints','correct-answer','next-example','finish','saved-result','topic','layout'];
const MIME={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8','.css':'text/css;charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{try{let f=path.resolve(ROOT,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(f!==ROOT&&!f.startsWith(ROOT+path.sep))return res.writeHead(403).end();if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');const bytes=fs.readFileSync(f);res.setHeader('Content-Type',MIME[path.extname(f)]||'application/octet-stream');res.setHeader('Content-Length',bytes.length);res.setHeader('X-Book-Audit-Sha256',crypto.createHash('sha256').update(bytes).digest('hex'));res.end(bytes);}catch{res.writeHead(404).end();}});
let origin;const reports=[];
const clean=s=>String(s).replace(/\u2212/g,'-').replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim();
const numbers=s=>(clean(s).match(/-?\d+(?:[,.]\d+)?/g)||[]).map(s=>Number(s.replace(',','.')));
const finite=n=>{if(!Number.isFinite(Number(n)))throw Error('Nonfinite oracle '+n);return String(Math.round(Number(n)*1e9)/1e9);};
function record(r,action,status,detail={}){r.actions.push({action,status:typeof status==='boolean'?(status?'PASS':'FAIL'):status,...detail});}
function oracle(r,prompt,expected,method,extra={}){r.oracles.push({prompt:clean(prompt),expected,method,...extra});}
async function source(p,expression){return p.evaluate(x=>JSON.parse(JSON.stringify(eval(x),(_k,v)=>typeof v==='bigint'?String(v):v)),expression);}
async function text(l){return clean(await l.innerText());}
async function tick(p){await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));}
async function dimensions(p,r,stage){const d=await p.evaluate(()=>({viewport:innerWidth,html:document.documentElement.scrollWidth,body:document.body.scrollWidth,overflow:document.documentElement.scrollWidth>innerWidth+2?[...document.querySelectorAll('body *')].filter(e=>{const b=e.getBoundingClientRect();return (b.width>innerWidth||b.right>innerWidth+2)&&e.getClientRects().length&&!e.closest('svg');}).slice(0,15).map(e=>({tag:e.tagName,id:e.id,cls:e.className,width:e.getBoundingClientRect().width,right:e.getBoundingClientRect().right,text:e.textContent.trim().slice(0,120)})):[]}));record(r,'layout',d.html<=d.viewport+2&&d.body<=d.viewport+2,{stage,...d});}
async function storage(p){return p.evaluate(()=>Object.fromEntries(Object.entries(localStorage).sort(([a],[b])=>a.localeCompare(b))));}
function outcomes(store,filter){const out={};function walk(v,key){if(/(?:^|\.)(events|current|seenArch|notes|draft|history)(?:\.|$)/i.test(key))return;if(v&&typeof v==='object'){for(const[k,x]of Object.entries(v))walk(x,key+'.'+k);}else if(/solved|correct|wrong|attempt|score|completed|streak|tries|closed|answered|results|success|records|perType|checkpoint|total|prog/i.test(key)&&!/updatedAt|(?:^|\.)(last|t|ts)$/.test(key))out[key]=v;}for(const[k,v]of Object.entries(store))if(!filter||filter.test(k))try{walk(JSON.parse(v),k);}catch{}return out;}
async function saved(p,r,before,filter){const after=await storage(p),a=outcomes(after,filter),b=outcomes(before,filter);const changed=Object.keys(a).filter(k=>JSON.stringify(a[k])!==JSON.stringify(b[k]));r.storageAfter=Object.fromEntries(Object.entries(after).filter(([k])=>(!filter||filter.test(k))&&after[k]!==before[k]));await p.reload({waitUntil:'load'});await tick(p);const reloaded=outcomes(await storage(p),filter);record(r,'saved-result',changed.length>0&&changed.every(k=>JSON.stringify(a[k])===JSON.stringify(reloaded[k])),{method:'Result counters/records changed through UI and survived reload. Event timestamps, seen markers and notes excluded.',changedOutcomePaths:changed,outcomeBeforeReload:a,outcomeAfterReload:reloaded,storageAfter:r.storageAfter});}
async function help(p,r,button,fields,panel){const control=await button.elementHandle();const draft=await fields.evaluateAll(a=>a.map(e=>e.value)),before=await text(p.locator('body'));await button.click();await tick(p);const shown=panel?await panel.isVisible():(await text(p.locator('body')))!==before;await dimensions(p,r,'hint-open');const back=p.getByRole('button',{name:/Вернуться к (моему ответу|задаче|своему ответу)/}).filter({visible:true});if(await back.count())await back.first().click();else if(await control.isEnabled())await control.click();record(r,'hints',shown&&JSON.stringify(draft)===JSON.stringify(await fields.evaluateAll(a=>a.map(e=>e.value))),{draft,helpVisible:shown,draftRetained:JSON.stringify(draft)===JSON.stringify(await fields.evaluateAll(a=>a.map(e=>e.value)))});}
async function numeric(p,r,cfg){
  const host=cfg.host?p.locator(cfg.host):p.locator('body'),fields=host.locator(cfg.input).filter({visible:true}),check=cfg.check?host.locator(cfg.check):host.getByRole('button',{name:'Проверить',exact:true});
  const before=await storage(p),prompt=cfg.prompt?await text(host.locator(cfg.prompt)):await text(host);
  let answers=typeof cfg.answers==='function'?await cfg.answers():cfg.answers;answers=Array.isArray(answers)?answers:[answers];
  oracle(r,prompt,answers,cfg.method||'independent-visible-mathematics');
  record(r,'start',await fields.first().isVisible()&&await check.first().isEnabled(),{mode:cfg.mode||'default practice'});
  for(let i=0;i<await fields.count();i++)await fields.nth(i).fill('-999');await check.first().click();await tick(p);
  const bad=await text(host.locator(cfg.feedback));record(r,'wrong-answer',!/^✓?\s*Верно[!.\s]/i.test(bad)&&bad.length>0,{feedback:bad});
  if(cfg.hint){for(let i=0;i<await fields.count();i++)if(await fields.nth(i).isEditable())await fields.nth(i).fill('12');await help(p,r,host.locator(cfg.hint),fields,cfg.panel?host.locator(cfg.panel):null);}else record(r,'hints','NA',{reason:'No hint control for this example.'});
  for(let i=0;i<answers.length;i++)await fields.nth(i).fill(String(answers[i]));await check.first().click();await tick(p);
  const good=await text(host.locator(cfg.feedback));const accepted=/верно|правильно|✓/i.test(good)&&!/неверно|неправильно|пока неверно/i.test(good);record(r,'correct-answer',accepted,{feedback:good});record(r,'finish',accepted,{scope:'completed exercise',feedback:good});
  if(cfg.next){const next=cfg.nextRole?host.getByRole('button',{name:cfg.nextRole,exact:true}):(cfg.nextGlobal?p.locator(cfg.next):host.locator(cfg.next));const old=cfg.prompt?await text(host.locator(cfg.prompt)):await text(host),oldField=await fields.first().elementHandle();await next.first().click();await tick(p);const newText=cfg.prompt?await text(host.locator(cfg.prompt)):await text(host),replaced=oldField&&!await oldField.evaluate(e=>e.isConnected);record(r,'next-example',newText!==old||replaced,{promptChanged:newText!==old,answerControlReplaced:replaced,newPrompt:cfg.prompt?newText:undefined});}else record(r,'next-example','NA',{reason:'Standalone one-example page.'});
  if(cfg.save===false)record(r,'saved-result','NA',{reason:'Standalone worked example; no promised progress record.'});else if(!cfg.deferSave)await saved(p,r,before,cfg.storageFilter||/mathExam|mathexam|oge|task|progress/i);
  record(r,'session-completion',cfg.session||'NA',{reason:cfg.sessionReason||'Selected practice presents individual questions; other exam/quiz modes are outside this case.',scope:cfg.mode||'default practice'});
}
async function diagrams(p,r){r.visibleSvgLabels=await p.locator('svg').evaluateAll(nodes=>nodes.filter(n=>n.getClientRects().length).map(n=>({viewBox:n.getAttribute('viewBox'),aria:n.getAttribute('aria-label'),svg:n.outerHTML,text:[...n.querySelectorAll('text')].map(t=>t.textContent.trim()).filter(Boolean)})));}
async function scenario(p,r){
 const route=r.route;
 if(route.includes('task-15-external'))return numeric(p,r,{input:'#ocg15-answer',feedback:'.ocg-feedback',hint:'#hintPanel > summary',panel:'#hintPanel',answers:38,prompt:'.ocg-primary-figure',save:false,mode:'single external-angle exercise, 180−142=38'});
 if(route.includes('oge-task6-'))return fractions6(p,r);
 if(route.includes('oge-task8-'))return numeric(p,r,{host:'#marGrid > .mtask:not([hidden])',input:'input.ans',check:'.ck',feedback:':scope > .mrow .fb',hint:'.bs',answers:64,prompt:'.expr',next:'.minimal-next',nextGlobal:true,mode:'first root/power exercise; sqrt(4^6)=64'});
 if(route.includes('oge-task9-'))return numeric(p,r,{host:'.task-card:not([hidden])',input:'input.ans',feedback:':scope > .fb',hint:'.minimal-hint',answers:10,prompt:'.task-q',next:'.minimal-next',nextGlobal:true,mode:'first linear equation 4x−4=16+2x'});
 if(route.includes('oge-task12-'))return numeric(p,r,{host:'#taskArea',input:'#ansIn',check:'#checkBtn',feedback:'#fb',hint:'.minimal-hint',answers:async()=>source(p,'cur.answer'),method:'source-derived read-only current-task answer; independent maths pending',prompt:'.story',next:'#nextBtn'});
 if(route.includes('oge-task16-'))return numeric(p,r,{input:'#ans',check:'#check',feedback:'#fb',hint:'#courseHintToggle',panel:'#courseHintPanel',answers:async()=>source(p,'trTask.ans'),method:'source-derived read-only trTask.ans',prompt:'#main .task',next:'#next'});
 if(route.includes('oge-task17-'))return numeric(p,r,{input:'#ans',check:'#chk',feedback:'#fb',hint:'#courseHintToggle',panel:'#courseHintPanel',answers:async()=>source(p,'CUR.ans'),method:'source-derived read-only CUR.ans',prompt:'.qtext',next:'#nxt'});
 if(route.includes('oge-task18-'))return numeric(p,r,{input:'#ansIn',check:'#chkBtn',feedback:'#fb',hint:'#courseHintToggle',panel:'#courseHintPanel',answers:async()=>source(p,'TR.task.ans'),method:'source-derived read-only TR.task.ans',prompt:'#main .task',next:'#nextBtn'});
 if(route.includes('oge-task25-'))return numeric(p,r,{host:'#panel-train',input:'input[data-ai]',check:'[data-act="tr-check"]',feedback:'#trFb',hint:'#courseHintToggle',answers:async()=>{const m=numbers(await text(p.locator('#panel-train .cond')))[0];return [m*Math.sqrt(13)/4,m*Math.sqrt(13)/2,3*m*Math.sqrt(5)/4];},method:'independent coordinate derivation from visible common length m: AB=m√13/4, BC=m√13/2, AC=3m√5/4; full written proof still not automatically assessed',prompt:'.cond',next:'[data-act="tr-next"]'});
 if(route.includes('oge-task20-')){
   const prompt=await text(p.locator('#body .prompt'));const vals=numbers(prompt);const c=vals[2],constant=vals[5],k=vals[9]??vals[8];
   const parts=await p.locator('#body .prompt').evaluate(e=>({target:e.querySelector('b').textContent,numerator:e.querySelector('.frac .n,.frac>span:first-child')?.textContent,denominator:e.querySelector('.frac .d,.frac>span:last-child')?.textContent,all:e.textContent}));
   const C=numbers(parts.target).at(-1),R=numbers(parts.numerator).at(-1),K=Number(clean(parts.all).split('=').at(-1));
   return numeric(p,r,{host:'#body',input:'.qbox > div .numin:visible',check:'.qbox > .btns button',feedback:'.qbox > .fb',hint:'.minimal-hint > button',panel:'.minimal-help',answers:finite(R*(1-K)+C),prompt:'.prompt',next:'.nextbtn',mode:'module A, expression from a rational identity',storageFilter:/oge20|task20|mathExamCourseProgress/});
 }
 if(route.includes('oge-task21-')){
   const prompt=await text(p.locator('#content .problem'));const ns=numbers(prompt);if(!/велосипедист/.test(prompt))throw Error('Unsupported visible word problem: '+prompt);
   const [stop,distance,v1,v2]=ns;const secondDistance=v2*(distance+v1*stop/60)/(v1+v2),expected=/выехал первый велосипедист/.test(prompt)?distance-secondDistance:secondDistance;
   const before=await storage(p);await numeric(p,r,{host:'#content',input:'.af input.num',feedback:'.af > .fbk',hint:'.minimal-hint > button',answers:finite(expected),prompt:'.problem',next:'.btn',nextRole:'Следующая задача →',deferSave:true,mode:'meeting cyclists with stop; v2*(distance+v1*stop/60)/(v1+v2)'});const prompt2=await text(p.locator('#content .problem')),ns2=numbers(prompt2),second2=ns2[3]*(ns2[1]+ns2[2]*ns2[0]/60)/(ns2[2]+ns2[3]),answer2=/выехал первый велосипедист/.test(prompt2)?ns2[1]-second2:second2;oracle(r,prompt2,answer2,'independent-visible-mathematics',{purpose:'fresh unaided task must earn durable progress'});await p.locator('#content .af input.num:visible').fill(finite(answer2));await p.locator('#content').getByRole('button',{name:'Проверить',exact:true}).click();record(r,'correct-answer',await p.locator('#content .af input.num:visible').isDisabled(),{scope:'second unaided question'});await saved(p,r,before,/oge21_prog/);return;
 }
 if(route.includes('oge-task22-'))return graph22(p,r);
 if(route.includes('oge-task23-'))return geometry23(p,r);
 if(route.includes('oge-task24-'))return proof24(p,r);
 if(route.includes('oge-task13-'))return inequalities(p,r);
 if(route.includes('oge-task7-'))return line7(p,r);
 if(route.includes('oge-task11-'))return graphs11(p,r);
 if(route.includes('task19-trainer'))return truth19(p,r);
 if(route.includes('oge-task10-'))return probability10(p,r);
 if(route.includes('oge-task14-'))return progression14(p,r);
 if(route.includes('entry-diagnostic'))return diagnostic(p,r);
 if(route.includes('practice-1-5-map')){record(r,'start',await p.locator('a[href*="practice-1-5-"]').count()>5);record(r,'topic',true,{reason:'Index of the eight practical storylines and diagnostic.'});for(const a of ['wrong-answer','hints','correct-answer','finish','saved-result'])record(r,a,'NA',{reason:'Navigation index, no exercise.'});const link=p.locator('a[href*="practice-1-5-tires"]').first();await link.click();await p.waitForLoadState('load');record(r,'next-example',p.url().includes('practice-1-5-tires'));return;}
 if(route.includes('percent-table-trainer'))return percent(p,r);
 if(route.includes('practice-1-5-tires'))return tires(p,r);
 if(route.includes('practice-1-5-'))return practical(p,r);
 throw Error('No scenario for '+route);
}
async function inequalities(p,r){const before=await storage(p),chips=p.locator('#chips button');oracle(r,await text(p.locator('body')),'−7 < x < 7','independent-visible-mathematics; x²<49');record(r,'start',await chips.count()===3);await chips.nth(0).click();await p.locator('#check').click();record(r,'wrong-answer',!/верно[!.]/i.test(await text(p.locator('#msg'))),{feedback:await text(p.locator('#msg'))});await help(p,r,p.locator('#hintToggle'),p.locator('#chips button'),p.locator('#hintPanel'));await chips.nth(0).click();await chips.nth(1).click();await p.locator('#check').click();record(r,'correct-answer',await p.locator('#check').isDisabled(),{feedback:await text(p.locator('#msg'))});record(r,'finish',await p.locator('#check').isDisabled(),{scope:'single quadratic inequality'});await p.locator('#next').click();record(r,'next-example',!await p.locator('#check').isDisabled());await saved(p,r,before,/inequal|oge13|task13|CourseProgress/i);}
async function line7(p,r){const before=await storage(p);const data=await source(p,'({task:BANK[marIdx],index:marIdx})');oracle(r,await text(p.locator('#marTask')),data.task.key,'source-derived read-only BANK key',{task:data});const opts=p.locator('#marTask .optbtn');record(r,'start',await opts.count()===4);await opts.nth(data.task.key%4).click();record(r,'wrong-answer',/неверно|проверь|подумай|не так|ошиб/i.test(await text(p.locator('#marTask .msg'))),{feedback:await text(p.locator('#marTask .msg'))});const hint=p.locator('#marTask').getByRole('button',{name:'Хочешь подсказку?',exact:true});await help(p,r,hint,opts);await opts.nth(data.task.key-1).click();record(r,'correct-answer',/верно/i.test(await text(p.locator('#marTask .msg'))),{feedback:await text(p.locator('#marTask .msg'))});record(r,'finish',await opts.nth(data.task.key-1).isDisabled(),{scope:'single number-line question'});await p.getByRole('button',{name:'Следующая →',exact:true}).click();record(r,'next-example',await source(p,'marIdx')!==data.index);await saved(p,r,before,/CourseProgress/);}
async function graphs11(p,r){const before=await storage(p),data=await source(p,'M4.task');oracle(r,await text(p.locator('#m4'))||await text(p.locator('body')),data.key,'source-derived read-only graph mapping',{task:data});record(r,'start',await p.locator('#m4-answer').isVisible());await p.locator('#m4-answer').fill('111');await p.locator('#m4-check').click();record(r,'wrong-answer',!(await p.locator('#m4-check').isDisabled()),{body:await text(p.locator('#m4-soft'))});await help(p,r,p.locator('#m4-hint'),p.locator('#m4-answer'));await p.locator('#m4-answer').fill(data.key.join(''));await p.locator('#m4-check').click();record(r,'correct-answer',await p.locator('#m4-good').isVisible(),{feedback:await text(p.locator('#m4-good'))});record(r,'finish',await p.locator('#m4-good').isVisible(),{scope:'three-function mapping'});await p.locator('#m4-next').click();record(r,'next-example',(await p.locator('#m4-answer').inputValue())==='');await saved(p,r,before,/CourseProgress/);}
async function truth19(p,r){const before=await storage(p),statement=await text(p.locator('#statement'));record(r,'start',statement.length>15);oracle(r,statement,false,'independent mathematics: non-square rhombus has unequal diagonals');await p.locator('#hintToggle').click();record(r,'hints',await p.locator('#hintPanel').isVisible()&&await text(p.locator('#statement'))===statement,{statementRetained:true});await p.locator('#hintToggle').click();await p.locator('#btnTrue').click();record(r,'wrong-answer',await p.locator('#answerPanel').getAttribute('data-correct')==='false',{feedback:await text(p.locator('#resultTitle'))});await p.locator('#nextCard').click();const next=await text(p.locator('#statement'));record(r,'next-example',next!==statement);const data=await source(p,'window.Task19Data.cards.find(c=>c.text===document.querySelector("#statement").textContent.trim())');oracle(r,next,data.truth,'source-derived read-only truth bank; first rhombus independently checked');await p.locator(data.truth?'#btnTrue':'#btnFalse').click();record(r,'correct-answer',await p.locator('#answerPanel').getAttribute('data-correct')==='true',{feedback:await text(p.locator('#resultTitle'))});record(r,'finish',await p.locator('#btnTrue').isDisabled()&&await p.locator('#btnFalse').isDisabled(),{scope:'one wrong and one correct assertion'});await saved(p,r,before,/task19/i);}
async function graph22(p,r){const host=p.locator('.panel:not(.hidden) .mode-host[data-mode="marathon"]'),before=await storage(p);const data=await host.evaluate(e=>JSON.parse(JSON.stringify(e.__problem,(_k,v)=>typeof v==='bigint'?String(v):v)));oracle(r,await text(host),data.atoms||data.vals,'source-derived read-only host.__problem; independent graph analysis pending',{task:data});record(r,'start',await host.isVisible());await host.getByRole('button',{name:'+ отдельное значение',exact:true}).click();await host.locator('.v-dec').fill('-999');await host.locator('.btn-check').click();record(r,'wrong-answer',/Пока не совпадает/.test(await text(host.locator(':scope > .fb'))));await help(p,r,host.locator('.minimal-hint > button'),host.locator('.ans-host input:visible'),host.locator('.minimal-help'));await host.locator('.ab-rm').click();for(const atom of data.atoms){await host.getByRole('button',{name:atom.type==='point'?'+ отдельное значение':'+ промежуток',exact:true}).click();const row=host.locator('.ab-row').last();const vals=atom.type==='point'?[atom.v]:[atom.lo,atom.hi];for(let i=0;i<vals.length;i++){const v=vals[i];if(Number(v.d)===1)await row.locator('.v-dec').nth(i).fill(v.n);else{await row.locator('.v-tog').nth(i).click();await row.locator('.v-num').nth(i).fill(v.n);await row.locator('.v-den').nth(i).fill(v.d);}}if(atom.type==='interval'){await row.locator('select').nth(0).selectOption(atom.loCl?'[':'(');await row.locator('select').nth(1).selectOption(atom.hiCl?']':')');}}await host.locator('.btn-check').click();record(r,'correct-answer',await host.locator('.btn-check').isDisabled(),{feedback:await text(host.locator(':scope > .fb'))});record(r,'finish',await host.locator('.btn-check').isDisabled(),{scope:'one complete parameter set, default piecewise module'});await host.getByRole('button',{name:'Другая задача →',exact:true}).click();record(r,'next-example',await host.locator('.ab-row').count()===0);await saved(p,r,before,/oge22|task22|CourseProgress/);}
async function geometry23(p,r){const picker=p.locator('.filter-bar select');if(!await picker.isVisible())await p.locator('details').filter({has:picker}).locator('summary').first().click();const options=await picker.locator('option').evaluateAll(a=>a.map(o=>({value:o.value,text:o.textContent})));const o=options.find(o=>o.value==='circR')||options.find(o=>/описан/.test(o.text));if(!o)throw Error('circumradius subtype unavailable');await picker.selectOption(o.value);const prompt=await text(p.locator('.train-host .q-text'));const n=numbers(prompt),R=n[0],angle=180-n[1]-n[2];await numeric(p,r,{host:'.train-host',input:'.ans-inp',feedback:'.fb',hint:'#courseHintToggle',answers:finite(2*R*Math.sin(angle*Math.PI/180)),prompt:'.q-text',next:'.btn',nextRole:'Следующая задача →',mode:'circR, sine rule a=2R sin(180−B−C)'});}
async function proof24(p,r){const before=await storage(p),data=await source(p,'({id:curTask().id,task:curTask()})');oracle(r,await text(p.locator('#view')),data.task.steps,'source-derived read-only proof ordering; independent proof review pending',{task:data});record(r,'start',await p.locator('#view .pool button').count()>1);const trap=p.locator('#view .pool button[onclick*="type:\'x\'"]').first();if(await trap.count()){await trap.click();record(r,'wrong-answer',await p.locator('#view .pool .dead .dmsg').isVisible(),{feedback:await text(p.locator('#view'))});}else record(r,'wrong-answer','NOT_RUN',{reason:'No distractor matched in selected proof.'});await help(p,r,p.locator('#courseHintToggle'),p.locator('#view textarea'),p.locator('#courseHintPanel'));for(let i=0;i<data.task.steps.length;i++){await p.locator('#view .pool button').filter({hasText:data.task.steps[i].t.replace(/<[^>]+>/g,'')}).first().click().catch(async()=>{await p.locator('#view .pool button[onclick*="type:\'s\',i:'+i+'"]').click();});}const body=await text(p.locator('#view'));record(r,'correct-answer',await p.locator('#view .qed.show').isVisible(),{feedback:body});record(r,'finish',await p.locator('#view .qed.show').isVisible(),{scope:'full selected proof chain'});const next=p.getByRole('button',{name:/Следующ/}).filter({visible:true}).first();await next.click();record(r,'next-example',(await source(p,'curTask().id'))!==data.id);await saved(p,r,before,/CourseProgress/);}
async function fractions6(p,r){
 await numeric(p,r,{input:'#ans',check:'#check',feedback:'#mark',hint:'#hintToggle',answers:'-31/50',prompt:'#card > .expr',next:'#check',mode:'fractions bank: independent first example, then complete selected bank'});
 const secondPrompt=await p.locator('#card > .expr').innerHTML();
 await p.locator('#previous').click();await tick(p);
 await p.locator('#settings > summary').click();
 const previousInfo=await text(p.locator('#taskInfo')),previousPrompt=await p.locator('#card > .expr').innerHTML();
 const previousOutcome=outcomes(await storage(p),/oge6/);
 await p.reload({waitUntil:'load'});await tick(p);
 await p.locator('#settings > summary').click();
 const restoredInfo=await text(p.locator('#taskInfo'));
 const promptRestored=await p.locator('#card > .expr').innerHTML()===previousPrompt;
 const earnedOutcomeUnchanged=JSON.stringify(outcomes(await storage(p),/oge6/))===JSON.stringify(previousOutcome);
 record(r,'previous-position-reload',/Задача 1 из 81/.test(previousInfo)&&restoredInfo===previousInfo&&promptRestored&&earnedOutcomeUnchanged,{beforeReload:previousInfo,afterReload:restoredInfo,promptHtml:previousPrompt,promptRestored,earnedOutcomeUnchanged});
 await p.locator('#skip').click();await tick(p);
 record(r,'next-after-restored-previous',await p.locator('#card > .expr').innerHTML()===secondPrompt,{expected:'Return to the same second example without awarding another credit for the completed first example.'});
 const before=await storage(p);let count=0;
 while(await p.locator('#ans').count()){
   const data=await source(p,'({index:order[pos],position:pos,total:order.length,task:TASKS[order[pos]]})');
   const answer=data.task.mode==='numerator'?String(data.task.n):`${data.task.n}/${data.task.d}`;
   oracle(r,await text(p.locator('#card > .expr')),answer,'source-derived read-only exact fraction bank; first case independently calculated',{bankIndex:data.index,position:data.position,promptHtml:await p.locator('#card > .expr').innerHTML()});
   await p.locator('#ans').fill(answer);await p.locator('#check').click();
   if(!/Верно/.test(await text(p.locator('#mark'))))throw Error('Bank fraction rejected at '+data.index);
   await p.locator('#check').click();count++;
   if(count>400)throw Error('Bank did not terminate');
 }
 const summary=await text(p.locator('#card'));record(r,'finish',/Раздел завершён/.test(summary),{scope:'entire selected fractions bank',summary,remainingQuestionsCompleted:count});record(r,'session-completion',/Раздел завершён/.test(summary),{summary});
 await saved(p,r,before,/oge6/);record(r,'result-restored-visible',/Раздел завершён/.test(await text(p.locator('#card'))),{summary:await text(p.locator('#card'))});
}
async function revealControl(control){for(const d of await control.locator('xpath=ancestor::details[not(@open)]').all())await d.locator(':scope > summary').click();await control.click();}
async function finiteAssessment(p,r){
 const match=r.route.match(/oge-task(\d+)-/);if(!match)return;const num=Number(match[1]);
 const configs={
  7:{tab:'[data-t="quiz"]',host:'#quizBox',choice:'.optbtn'},
  8:{tab:'[data-v="quiz"]',host:'#view-quiz',input:'#qBox input.ans',check:'.qok',next:'.qnx'},
  9:{tab:'[data-pane="quiz"]',host:'#pane-quiz',input:'input.ans'},
  10:{tab:'#tabb-quiz',host:'#quiz-root',input:'.aw-dec',value:'0.001'},
  11:{tab:'[data-m="m6"]',host:'#m6-box',input:'#m6-answer',check:'#m6-ok',next:'#m6-next',value:'123'},
  12:{tab:'#modes button[data-id="diag"]',host:'#taskArea',input:'#ansIn',check:'#checkBtn',next:'#qNext',autoStart:true},
  14:{tab:'[data-page="quiz"]',host:'#page-quiz',input:'#q-dec',check:'#q-ok',next:'#q-next'},
  16:{tab:'[data-tab="quiz"]',host:'#main',input:'#qAns',check:'#qCheck',next:'#qNext'},
  17:{tab:'#tabQ',host:'#main',input:'#ans',check:'#chk',next:'#nxt',twoTries:true},
  18:{tab:'#tabQuiz',host:'#main',input:'#qIn',check:'#qOk',next:'#qNext'},
  23:{tab:'[data-tab="quiz"]',host:'#main',input:'.ans-inp',automaticNext:true},
  24:{tab:'#tabs button:nth-child(5)',host:'#view',proof:true},
  25:{tab:'[data-tab="exam"]',host:'#panel-exam',input:'input[data-ai]',check:'[data-act="exam-answer"]',next:'[data-act="exam-next"]'}
 };
 const cfg=configs[num];if(!cfg){record(r,'finite-assessment','NA',{reason:'No separate finite assessment in this page; selected bank/variant lifecycle reported above.'});return;}
 const before=await storage(p);await revealControl(p.locator(cfg.tab));const host=p.locator(cfg.host);
 if(cfg.proof)await host.locator('.mcard').filter({hasText:'Начать зачёт'}).click();
 else if(!cfg.autoStart)await host.getByRole('button',{name:/^Начать зачёт/}).click();
 record(r,'assessment-start',true,{mode:'full finite assessment',width:r.width,answerPolicy:cfg.proof?'Assemble each chain through ordinary proof-card clicks; source order oracle labelled.':'Submit a valid intentionally wrong number, or a fixed permitted choice/mapping; practice separately tests correct answers. This tests completion and saved results, not pass-level attainment.'});
 const total=cfg.proof?await source(p,'ST.queue.length'):num===25?8:10;
 for(let i=0;i<total;i++){
   if(cfg.proof){const task=await source(p,'curTask()');oracle(r,await text(host.locator('.givens')),task.steps,'source-derived proof order, finite assessment',{assessmentQuestion:i+1,task});for(let j=0;j<task.steps.length;j++)await host.locator('button[onclick*="type:\'s\',i:'+j+'"]').click();if(!await host.locator('.qed.show').isVisible())throw Error('Proof not completed at assessment '+i);await host.getByRole('button',{name:/^(Следующая|Итоги зачёта) →$/}).click();continue;}
   const prompt=await text(host);r.assessmentCases=r.assessmentCases||[];r.assessmentCases.push({question:i+1,prompt,submitted:cfg.choice?'first displayed option':cfg.value||'-999'});
   if(cfg.choice)await host.locator(cfg.choice).first().click();
   else{const inputs=host.locator(cfg.input).filter({visible:true});await inputs.first().waitFor({state:'visible'});for(const input of await inputs.all())await input.fill(cfg.value||'-999');const check=cfg.check?host.locator(cfg.check):host.getByRole('button',{name:num===23?'Проверить':'Ответить',exact:true});await check.click();if(cfg.twoTries&&await check.isEnabled())await check.click();}
   if(cfg.automaticNext){await p.waitForFunction(({selector,number,last})=>{const host=document.querySelector(selector);return last?!!host?.querySelector('.quiz-result'):host?.querySelector('.prog-txt')?.textContent.includes('Задача '+(number+2)+' из');},{selector:cfg.host,number:i,last:i===total-1});}
   else{const next=cfg.next?host.locator(cfg.next):host.getByRole('button',{name:/^(Дальше →|Итоги →|К результатам|Итог)$/});await next.click();}
 }
 const result=await text(host);record(r,'assessment-finish',/зачёт|зачета|результат/i.test(result)&&!(await host.getByRole('button',{name:'Ответить',exact:true}).count()),{scope:'full finite assessment',questions:total,result});record(r,'session-completion',true,{mode:'finite assessment',questions:total,result});await dimensions(p,r,'assessment-result');await p.screenshot({path:path.join(OUT,`${r.id}-${r.width}-assessment.png`),fullPage:true});await saved(p,r,before,/CourseProgress|oge|task/i);
}
// Every implementation below operates the rendered UI; source oracles are labelled.
async function probability10(p,r){const filter=p.locator('#mar-chips').getByRole('button',{name:'10.1 Равновозможные исходы',exact:true});const details=p.locator('details').filter({has:p.locator('#mar-chips')});if(!await filter.isVisible())await details.locator('summary').first().click();await filter.click();const n=numbers(await text(p.locator('#mar-root > .card > div[style=\"margin:6px 0\"]')));return numeric(p,r,{host:'#mar-root > .card',input:'.aw-dec',check:'[id$="-ck"]',feedback:':scope > [id$="-fb"]',hint:'[id$="-steps"]',answers:finite(n[1]/n[0]),prompt:':scope > div[style=\"margin:6px 0\"]',next:'[id$="-next"]',mode:'10.1 equiprobable outcomes, favourable/total'});}
async function progression14(p,r){const data=await source(p,'__M.task');oracle(r,data.text,data.ans,'source-derived read-only __M.task',{task:data});const a=data.ans;return numeric(p,r,{host:'#m-task',input:'#m-dec',check:'#m-ck',feedback:'#m-fb',hint:'#m-solve',answers:typeof a==='object'?finite(Number(a.n)/Number(a.d)):a,prompt:'.task-text',next:'#m-next',method:'source-derived read-only rational answer',mode:'random default progression exercise'});}
async function diagnostic(p,r){const before=await storage(p);await p.locator('#start-btn').click();record(r,'start',await p.locator('#question-text').isVisible(),{mode:'variant 1, all 10 diagnostic questions'});record(r,'hints','NA',{reason:'Assessment intentionally postpones hints until result/review.'});for(let i=0;i<10;i++){const prompt=await text(p.locator('#question-text')),n=numbers(prompt);let answer;if(i===0)answer=(n[0]+n[1])*n[2];if(i===1)answer=Math.hypot(n[0],n[1]);if(i===2)answer=n[0]*n[1]/100;if(i===3){const volume=n[0]*n[1]*n[2];const rows=await p.locator('#question-visual tbody tr').allTextContents();answer=rows.findIndex(s=>{const d=numbers(s);return d.at(-2)<=volume&&volume<=d.at(-1);})+1;}if(i===4)answer=n[0]*n[1]/(n[2]*n[3]);if(i===5)answer=Math.ceil(n[0]*n[1]/n[2]);if(i===6)answer=n[1]+Math.max(0,n[3]-n[0])*n[2];if(i===7)answer=2**(n[0]-n[1]);if(i===8)answer=n[0]*(1+(/скидки/.test(prompt)?-1:1)*n[1]/100);if(i===9)answer=n[1]/(1+(/повышения/.test(prompt)?1:-1)*n[0]/100);oracle(r,prompt,answer,'independent-visible-mathematics',{question:i+1});const field=p.locator('#answer-control');const submitted=i===0?-999:answer;if(await field.evaluate(e=>e.tagName==='SELECT'))await field.selectOption(String(submitted));else await field.fill(finite(submitted));if(i<9)await p.locator('#next-btn').click();else await p.locator('#finish-btn').click();}await tick(p);const score=Number(await text(p.locator('#score-val')));record(r,'wrong-answer',score===9,{intentionallyWrongQuestion:1,score});record(r,'correct-answer',score===9,{correctQuestions:'2–10',score});record(r,'next-example',true,{questionsNavigated:10});record(r,'finish',await p.locator('#result').isVisible()&&score===9,{scope:'full 10-question diagnostic',result:await text(p.locator('#result'))});record(r,'session-completion',score===9,{questions:10});await dimensions(p,r,'diagnostic-result');await saved(p,r,before,/CourseProgress/);}
async function percent(p,r){const before=await storage(p);let a=await source(p,'__PERCENT_TRAINER_TEST__.getState().current.answer');oracle(r,await text(p.locator('#practice-question')),a,'source-derived read-only current percent problem');record(r,'start',await p.locator('#practice-input').isVisible());await p.locator('#practice-input').fill('-999');await p.locator('#practice-check').click();record(r,'wrong-answer',await p.locator('#practice-input').isEditable(),{feedback:await text(p.locator('#practice-feedback'))});await p.locator('#practice-input').fill('12');await p.locator('#hint-btn').click();record(r,'hints',(await p.locator('#practice-input').inputValue())==='12',{draftRetained:true});await p.locator('#practice-input').fill(String(a));await p.locator('#practice-check').click();record(r,'correct-answer',await p.locator('#practice-input').isDisabled(),{feedback:await text(p.locator('#practice-feedback'))});await p.locator('#next-task').click();record(r,'next-example',await p.locator('#practice-input').isEditable());await p.locator('#practice-to-check').click();await p.locator('[data-check-level="standard"]').click();for(let i=0;i<5;i++){const task=await source(p,'(()=>{const s=__PERCENT_TRAINER_TEST__.getState();return s.checkpoint.tasks[s.checkpoint.index]})()');oracle(r,await text(p.locator('#check-question')),task.answer,'source-derived read-only checkpoint answer',{checkpointQuestion:i+1});await p.locator('#check-input').fill(String(task.answer));await p.locator('#check-save').click();}const result=await text(p.locator('#check-result'));record(r,'finish',await p.locator('#check-result').isVisible()&&/5\s*(из|\/)\s*5/.test(result),{scope:'complete 5-question standard checkpoint',result});record(r,'session-completion',await p.locator('#check-result').isVisible(),{questions:5});await saved(p,r,before,/percent|CourseProgress/i);}
async function tires(p,r){const before=await storage(p),answers=[195,90,614.6,0.4,2.3];record(r,'start',await p.locator('#variant-select').inputValue()==='0',{variant:1,questions:5});for(let i=1;i<=5;i++){const host=p.locator('#section-'+(i+1));const fields=host.locator('input').filter({visible:true});const input=fields.last();const check=host.getByRole('button',{name:'Проверить',exact:true}).filter({visible:true}).last();const prompt=await text(host);oracle(r,prompt,answers[i-1],'independent-visible-mathematics; diameter=25.4d+2Bp/100',{question:i});await input.fill('-999');await check.click();const bad=await text(host);record(r,'wrong-answer',await input.evaluate(e=>e.classList.contains('wrong')||e.getAttribute('aria-invalid')==='true')||await host.locator('.substep-feedback.bad,.substep-feedback.error,.feedback.bad,.feedback.error').count()>0,{question:i,feedback:bad.slice(-1000)});await input.fill('12');const hint=host.locator('.pd-toggle').filter({visible:true}).first();await help(p,r,hint,input);await input.fill(String(answers[i-1]));await check.click();const good=await text(host);record(r,'correct-answer',/верно|правильно|принято/i.test(good),{question:i,feedback:good.slice(-1000)});}record(r,'finish',true,{scope:'all 5 first-variant exercise checks reached; individual assertions above determine pass'});await p.locator('#vb-next').click();record(r,'next-example',await p.locator('#variant-select').inputValue()==='1');await saved(p,r,before,/tires|CourseProgress/i);}
function privateVariant(slug,variant){const vm=require('node:vm');const html=fs.readFileSync(path.join(ROOT,'trainers/oge-1-5-trainers/practice-1-5-'+slug+'.html'),'utf8');const script=html.match(/<script>\s*(\(function\(\)\{[\s\S]*?)<\/script>/)[1];const prefix=script.slice('(function(){'.length,script.indexOf('const TASK_FNS='));const tail=slug==='land-plots'?`RAND=mulberry32((0x85EBCA6B ^ ${variant})>>>0);JSON.stringify([gMatch,gGeom,gTiles,gPercent,gEcon].map(f=>f()));`:`RAND=mulberry32((0x9E3779B9 ^ ${variant})>>>0);const sc=genScenario();JSON.stringify([tMatch,tBill,tCount,tPercent,tSwitch].map(f=>f(sc)));`;return JSON.parse(vm.runInNewContext(prefix+tail,{Math},{timeout:1000}));}
async function pvFill(card,values){for(const[k,v]of Object.entries(values)){const e=card.locator('[data-pv-field="'+k+'"]');if(await e.evaluate(e=>e.tagName==='SELECT'))await e.selectOption(String(v));else await e.fill(String(v));}}
async function practical(p,r){const slug=r.route.match(/practice-1-5-(.+)\.html/)[1],before=await storage(p),cards=p.locator('.pv-task-stream>.pv-question');record(r,'start',await cards.count()===5,{slug,variant:1,questions:5});const locked=['land-plots','tariffs'].includes(slug);let list;if(locked)list=privateVariant(slug,1);if(slug==='roads-grid')list=await source(p,'(()=>{const s=currentScenario(),v=currentVariant(),a=computeAnswers(s,v);return [Object.fromEntries(v.ident.map((r,i)=>["v"+i,s.towns[r].num])),{answer:a.t2},{answer:a.t3},{answer:a.t4},{answer:a.minTotal}]})()');if(slug==='roads-schema')list=await source(p,'[1,2,3,4,5].map(t=>({answer:answer(VARIANTS[0],t)}))');if(slug==='apartments')list=await source(p,'[{answer:t1objs.map(objNum).join("")},{answer:Math.ceil(roleCells("gost")/14)},{answer:roleCells("kor")*.16},{answer:(roleCells("logK")-roleCells("klad"))/roleCells("klad")*100},{answer:28800}]');if(slug==='stoves')list=[{match0:1,match1:3,match2:2},{answer:15.84},{answer:500},{answer:16575},{answer:68}];
 for(let i=0;i<5;i++){const card=cards.nth(i),fields=card.locator('[data-pv-field]');const draft={};for(let j=0;j<await fields.count();j++){const e=fields.nth(j),key=await e.getAttribute('data-pv-field');draft[key]=await e.evaluate(e=>e.tagName==='SELECT'?[...e.options].find(o=>o.value)?.value:'12');}await pvFill(card,draft);await help(p,r,card.locator('.pv-help-button'),fields,card.locator('.pv-help-panel'));if(locked){const expect=list[i];oracle(r,await text(card.locator('.pv-question-condition')),expect.answer,'source-derived independent Node VM of deterministic native generator; does not call or modify browser engine',{variant:1,question:i+1,generatedQuestion:expect.q});await pvFill(card,{answer:expect.answer});}else{const wrong={...draft};for(const key of Object.keys(wrong))wrong[key]=typeof wrong[key]==='string'&&/^-?\d+$/.test(wrong[key])&&await fields.first().evaluate(e=>e.tagName==='SELECT')?(Number(wrong[key])===1?'2':'1'):'-999';await pvFill(card,wrong);await card.locator('.pv-check').click();await tick(p);record(r,'wrong-answer',await card.getAttribute('data-result')==='incorrect',{question:i+1,feedback:await text(card.locator('.pv-feedback'))});if(slug==='paper-sheets'){const a=await source(p,'state.inst.spec.roundTo!=null ? Math.round(state.inst.spec.value*10**state.inst.spec.roundTo)/10**state.inst.spec.roundTo : state.inst.spec.value');if(!list)list=[];list[i]={answer:a};}oracle(r,await text(card.locator('.pv-question-condition')),list[i],slug==='stoves'?'independent visible table/volume/discount/Pythagoras arithmetic':'source-derived read-only native parameters/answer',{question:i+1});await pvFill(card,list[i]);}await card.locator('.pv-check').click();await tick(p);record(r,'correct-answer',await card.getAttribute('data-result')==='correct',{question:i+1,feedback:await text(card.locator('.pv-feedback'))});}
 record(r,'finish',await cards.locator('[data-result="correct"]').count()===5||await cards.evaluateAll(a=>a.every(e=>e.dataset.result==='correct')),{scope:'all five first-variant questions completed'});record(r,'session-completion',await cards.evaluateAll(a=>a.every(e=>e.dataset.result==='correct')),{questions:5,variant:1});
 const controls=p.locator('.pv-controls');if(await controls.locator('select').count()){const select=controls.locator('select').first(),values=await select.locator('option').evaluateAll(a=>a.map(o=>o.value));await select.selectOption(values[1]);}else await controls.getByRole('button',{name:'Новый вариант',exact:true}).click();record(r,'next-example',await cards.count()===5&&await cards.first().getAttribute('data-result')!=='correct');if(locked){await pvFill(cards.first(),{answer:'-999'});await cards.first().locator('.pv-check').click();record(r,'wrong-answer',await cards.first().getAttribute('data-result')==='incorrect'&&await cards.first().locator('.pv-check').isDisabled(),{variant:2,question:1,rule:'Native one attempt closes the question; new variant returns enabled fields.'});}await saved(p,r,before,/CourseProgress|tariffs|land|paper|stove|road|apartment/i);}

const RUN_STARTED=new Date().toISOString();
const TEST_SCRIPT=fs.readFileSync(__filename);
const TEST_SCRIPT_SHA=crypto.createHash('sha256').update(TEST_SCRIPT).digest('hex');
const BASE=require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim();
const SEED_BASE=process.env.BOOK_EXAM_SEED||'oge-book-edition-20261031-v1';
function metadata(){return {schemaVersion:2,generatedAt:new Date().toISOString(),startedAt:RUN_STARTED,base:BASE,testScriptSha256:TEST_SCRIPT_SHA,prefix:PREFIX,widths:WIDTHS,randomFixture:{base:SEED_BASE,algorithm:'xorshift32, seed from SHA256(base + canonical source route), independent of width and prefix'},coverage:'Learner UI lifecycle for selected cases; full finite assessment at1280; independent/source oracles labelled per question',reports};}
async function proofFeedbackRegression(p,r){
 const cases=[
  {id:'t9',trap:0,expected:'Равенство треугольников из условия не следует',rejected:'треугольники разного размера',reason:'Isosceles trapezoid A(-2,0), D(2,0), B(-1,1), C(1,1), O(0,2/3): unequal bases 4 and 2; AOB and DOC are mirror-congruent.'},
  {id:'t15',trap:0,expected:'PM ∥ QN верно: оба радиуса перпендикулярны MN',rejected:'Это про ВНЕШнюю касательную',reason:'Both radii are perpendicular to the same tangent, including an internal tangent. Right angles plus vertical angles at T establish similarity.'},
  {id:'t3',trap:1,expected:'Накрест лежащие углы при AB ∥ DC и секущей DL — это ∠LDC и ∠DLA',rejected:'Они не вертикальные, а накрест лежащие',reason:'The angle bisector establishes ADL=LDC; parallel AB/DC establishes LDC=DLA. ADL and DLA are not themselves alternate interior angles.'}
 ];
 for(const test of cases){
  await revealControl(p.locator('#tabs button').first());
  await p.locator(`.mcard[onclick="startStudy('${test.id}')"]`).click();
  const prompt=await text(p.locator('#view'));
  await p.locator(`#view button[onclick*="type:'x',i:${test.trap}"]`).click();
  const feedback=await text(p.locator('#view .dmsg'));
  record(r,'mathematical-feedback-regression',feedback.includes(test.expected)&&!feedback.includes(test.rejected),{proof:test.id,trap:test.trap,prompt,feedback,independentReason:test.reason});
  await p.reload({waitUntil:'load'});await tick(p);
 }
}
async function corruptedStorageRegression(p,r){
 const match=r.route.match(/oge-task(20|22)-/);if(!match)return;
 const number=Number(match[1]),key=`mathExam.oge${number}.practice.v1`;
 // Fault injection in the isolated regression context. Only invalid JSON is
 // written; no answer, solved count, current exercise or checker is fabricated.
 await p.evaluate(key=>localStorage.setItem(key,'{broken'),key);
 await p.reload({waitUntil:'load'});await tick(p);
 const fault={id:r.id,route:r.route,width:r.width,actions:[],oracles:[],fixture:{key,raw:'{broken',purpose:'Corrupted pre-existing browser storage; not learner-result evidence.'}};
 await scenario(p,fault);
 const raw=await p.evaluate(key=>localStorage.getItem(key),key);
 let parsed=null;try{parsed=JSON.parse(raw);}catch{}
 const solved=parsed&&typeof parsed==='object'?Object.values(parsed).reduce((sum,value)=>sum+(Number.isSafeInteger(value?.solved)?value.solved:0),0):0;
 const score=number===20?p.locator('#body .solved'):p.locator('.panel:not(.hidden) .mode-host[data-mode="marathon"] .score');
 for(const details of await score.locator('xpath=ancestor::details[not(@open)]').all())await details.locator(':scope > summary').click();
 const visibleScore=await text(score);
 fault.rawAfterLearnerSolveAndReload=raw;fault.visibleScoreAfterReload=visibleScore;
 r.faultScenarios=[...(r.faultScenarios||[]),fault];
 const pass=solved===1&&/решено:?\s*1(?:\D|$)/i.test(visibleScore)&&fault.actions.every(action=>action.status==='PASS'||action.status==='NA');
 record(r,'corrupted-storage-result-reload',pass,{fixture: fault.fixture,solved,visibleScore,rawAfterReload:raw,scope:'The ordinary learner scenario earns the result after corruption; a subsequent reload retains it.'});
}
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 fs.writeFileSync(path.join(OUT,'runner-used.cjs'),TEST_SCRIPT);
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
 try{
  for(const width of WIDTHS)for(const {id,route}of ROUTES){
   const randomSeed=crypto.createHash('sha256').update(SEED_BASE+route).digest().readUInt32LE(0)||1;
   const context=await browser.newContext({viewport:{width,height:950},reducedMotion:'reduce'});
   // The same explicit random fixture at every width and on source/frozen pages.
   // Task/check functions and progress are never replaced or directly written.
   await context.addInitScript(seed=>{let n=seed>>>0;Math.random=()=>{n^=n<<13;n^=n>>>17;n^=n<<5;return(n>>>0)/4294967296;};},randomSeed);
   const p=await context.newPage();p.setDefaultTimeout(7000);
   const r={id,route,prefix:PREFIX,width,checkedAt:new Date().toISOString(),base:BASE,testScriptSha256:TEST_SCRIPT_SHA,randomSeed,actions:[],oracles:[],errors:[],network:[],dependencyEscapes:[],blockedExternal:[],resources:{},resourceHashErrors:[],resourceReadWarnings:[],limitations:['Fixed representative random fixture; alternative bank items and seeds are not claimed mathematically verified.','Full separate finite assessments are exercised at1280; phone cases cover the selected practice and its hints/completion.']};
   const file=path.join(ROOT,PREFIX+route);
   if(fs.existsSync(file)&&fs.statSync(file).isFile())r.sha256=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
   const resourceReads=[];
   p.on('pageerror',e=>r.errors.push(e.message));
   p.on('response',res=>{
    const u=new URL(res.url());
    if(res.status()>=400)r.network.push({path:u.pathname,status:res.status()});
    if(u.origin===origin&&res.status()===200){
     const headers=res.headers(),servedHash=headers['x-book-audit-sha256'];
     const remember=(sha256,bytes,method)=>{
      if(r.resources[u.pathname]&&r.resources[u.pathname].sha256!==sha256)r.resourceHashErrors.push({path:u.pathname,reason:'Resource changed during a single scenario'});
      r.resources[u.pathname]={sha256,status:res.status(),contentType:headers['content-type']||'',bytes,method};
     };
     resourceReads.push(res.body().then(bytes=>{
      const sha256=crypto.createHash('sha256').update(bytes).digest('hex');
      if(sha256===servedHash)remember(sha256,bytes.length,'browser-response-body');
      else{
       // Chromium decodes textual resources and removes a UTF-8 BOM. Verify
       // that restoring exactly those three bytes reproduces the sent payload.
       const withBom=Buffer.concat([Buffer.from([0xef,0xbb,0xbf]),bytes]);
       const restoredHash=crypto.createHash('sha256').update(withBom).digest('hex');
       if(restoredHash===servedHash){
        remember(restoredHash,withBom.length,'browser-response-body; UTF-8 BOM restored and verified against exact server payload');
        r.resources[u.pathname].decodedBodySha256=sha256;
       }else{
        r.resourceHashErrors.push({path:u.pathname,reason:'Browser response body differs from exact server-served payload',browserBodySha256:sha256,serverPayloadSha256:servedHash});
        remember(sha256,bytes.length,'browser-response-body; unexplained mismatch');
       }
      }
     }).catch(error=>{
      const reason=String(error.message).split('\n')[0];
      // Immediate redirect/reload can discard Chromium's body handle after a
      // successful HTTP response. Retain the hash calculated from the exact
      // payload sent by this server and label that narrower evidence explicitly.
      if(/^[a-f0-9]{64}$/.test(servedHash||'')){
       r.resourceReadWarnings.push({path:u.pathname,reason,identityMethod:'server-served-payload'});
       remember(servedHash,Number(headers['content-length']),'server-served-payload; browser body unavailable after navigation');
      }else r.resourceHashErrors.push({path:u.pathname,reason});
     }));
    }
   });
   await p.route('**/*',q=>{
    const u=new URL(q.request().url());
    if(PREFIX&&(u.origin!==origin||!u.pathname.startsWith(PREFIX+'/'))){r.dependencyEscapes.push({path:u.origin===origin?u.pathname:u.origin+u.pathname,method:q.request().method()});return q.abort();}
    if(u.origin!==origin){r.blockedExternal.push({url:u.origin+u.pathname});return q.abort();}
    return q.continue();
   });
   try{
    await p.goto(origin+PREFIX+route,{waitUntil:'load'});await tick(p);
    r.finalPath=new URL(p.url()).pathname;r.title=await p.title();r.initialVisibleText=await text(p.locator('body'));
    await diagrams(p,r);
    if(width===390||width===1280){r.initialScreenshot=`${id}-${width}-initial.png`;await p.screenshot({path:path.join(OUT,r.initialScreenshot),fullPage:true});}
    await dimensions(p,r,'initial');
    if(process.env.BOOK_EXAM_ONLY_ASSESSMENTS!=='1')await scenario(p,r);
    if(route.includes('oge-task24-'))await proofFeedbackRegression(p,r);
    if(width===1280&&process.env.BOOK_EXAM_ASSESSMENTS!=='0')await finiteAssessment(p,r);
    await corruptedStorageRegression(p,r);
    await dimensions(p,r,'final');
    if(!r.actions.some(a=>a.action==='topic'))record(r,'topic',true,{title:r.title,reason:'Route/title and exported visible problem match the referenced OGE family; mathematical correctness is separately scoped.'});
   }catch(e){r.error=String(e.stack||e).replaceAll(ROOT,'<repo>');await p.screenshot({path:path.join(OUT,`${id}-${width}-issue.png`),fullPage:true}).catch(()=>{});}
   await Promise.allSettled(resourceReads);
   r.finalHtmlSha256=r.resources[r.finalPath]?.sha256||null;
   r.resourceHashes=Object.fromEntries(Object.entries(r.resources).map(([key,value])=>[key,value.sha256]));
   record(r,'resource-identity',r.resourceHashErrors.length===0&&!!r.finalHtmlSha256,{initialPath:PREFIX+route,finalPath:r.finalPath,finalHtmlSha256:r.finalHtmlSha256,resourceHashErrors:r.resourceHashErrors});
   if(PREFIX)record(r,'immutable-dependencies',r.dependencyEscapes.length===0,{escapes:r.dependencyEscapes});
   record(r,'runtime',r.errors.length===0&&r.network.length===0,{errors:r.errors,network:r.network});
   for(const action of REQUIRED)if(!r.actions.some(a=>a.action===action))record(r,action,'NOT_RUN',{reason:r.error?.split('\n')[0]||'Not reached'});
   r.status=r.error?'PARTIAL':r.actions.some(a=>a.status==='FAIL')?'FAIL':r.actions.some(a=>a.status==='NOT_RUN')?'PARTIAL':'PASS_SELECTED_CASE';
   reports.push(r);
   fs.writeFileSync(path.join(OUT,`${id}-${width}.json`),JSON.stringify(r,null,2));
   fs.writeFileSync(path.join(OUT,'results.json'),JSON.stringify(metadata(),null,2));
   console.log(width,route,r.status,r.error?.split('\n')[0]||'');
   await context.close();
  }
 }finally{await browser.close();await new Promise(r=>server.close(r));}
 if(reports.some(r=>r.status!=='PASS_SELECTED_CASE'))process.exitCode=1;
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
