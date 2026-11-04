const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..');
const files={7:'oge-task7-number-line.html',8:'oge-task8-powers-roots.html',9:'oge-task9-equations.html',10:'oge-task10-probability.html',12:'oge-task12-formulas-trainer.html',14:'oge-task14-progressions.html'};
async function open(n,search=''){
 const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/Not implemented/.test(e.message))errors.push(e.message)});
 const dom=new JSDOM(fs.readFileSync(path.join(root,'trainers',files[n]),'utf8'),{url:'https://mathexam.space/trainers/'+files[n]+search,runScripts:'dangerously',virtualConsole:vc,pretendToBeVisual:true,beforeParse(w){w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};}});
 await new Promise(r=>dom.window.addEventListener('load',r,{once:true}));
 assert.deepEqual(errors,[],n+' boot errors');return dom;
}
const active={7:'#mode-mar.active',8:'#view-mar.on',9:'#pane-mara.on',10:'#tab-mar.on',12:'#taskArea',14:'#page-marathon.active'};
const card={7:'#marTask',8:'#marGrid>.mtask:not([hidden])',9:'#mara-list>.task-card:not([hidden])',10:'#mar-root>.card',12:'#taskArea>.card',14:'#m-task>.card'};
const review={7:'#mode-steps.active',8:'#view-step.on',9:'#pane-step.on',10:'#tab-step.on',12:'#stepShow',14:'#page-steps.active'};
for(const n of Object.keys(files).map(Number)){
 test(n+': task first, help optional, settings closed',async()=>{const dom=await open(n);try{const d=dom.window.document;assert.ok(d.querySelector(active[n]),'default task view');assert.equal(d.querySelectorAll(card[n]).length,1,'one main task');assert.ok(d.querySelector('.minimal-settings:not([open])'),'collapsed settings');const c=d.querySelector(card[n]);const b=[...c.querySelectorAll('button')].find(x=>x.textContent==='Хочешь подсказку?');assert.ok(b,'help button');assert.equal(b.getAttribute('aria-expanded'),'false');const before=dom.window.localStorage.getItem('mathExamCourseProgress.v1');b.click();assert.equal(b.getAttribute('aria-expanded'),'true');assert.equal(dom.window.localStorage.getItem('mathExamCourseProgress.v1'),before,'opening help does not add progress');assert.ok(c.querySelector('.minimal-hint-panel'),'help content');}finally{dom.window.close()}});
 test(n+': review entry preserved',async()=>{const dom=await open(n,'?mode=review');try{assert.ok(dom.window.document.querySelector(review[n]),'review active');}finally{dom.window.close()}});
}
for(const n of [8,9])test(n+': pagination reaches every bank task and retains entered answer',async()=>{const dom=await open(n);try{const d=dom.window.document;const cards=[...d.querySelectorAll(n===8?'#marGrid>.mtask':'#mara-list>.task-card')];assert.ok(cards.length>100);const next=d.querySelector('.minimal-next'),select=d.querySelector('.minimal-task-nav select');assert.equal(select.options.length,cards.length);const input=cards[0].querySelector('input');input.value='123';next.click();assert.equal(cards[0].hidden,true);assert.equal(cards[1].hidden,false);select.value='0';select.dispatchEvent(new dom.window.Event('change'));assert.equal(cards[0].hidden,false);assert.equal(input.value,'123');for(let i=0;i<cards.length;i++){select.value=String(i);select.dispatchEvent(new dom.window.Event('change'));assert.equal(cards.filter(c=>!c.hidden).length,1);assert.equal(cards[i].hidden,false);}}finally{dom.window.close()}});
for(const n of [7,8,9,12,14])test(n+': existing answer check still credits once',async()=>{const dom=await open(n);try{const w=dom.window,d=w.document,c=d.querySelector(card[n]);let button;
 if(n===7){const answer=w.eval('BANK[marIdx].key');button=c.querySelectorAll('.optbtn')[answer-1];}
 if(n===8){c.querySelector('input').value=w.eval('BANK[0].ans.join("/")');button=c.querySelector('.ck');}
 if(n===9){c.querySelector('input').value=w.eval('BANK[0].exp');button=[...c.querySelectorAll('button')].find(b=>b.textContent==='Проверить');}
 if(n===12){d.querySelector('#ansIn').value=w.eval('String(cur.answer)');button=d.querySelector('#checkBtn');}
 if(n===14){d.querySelector('#m-dec').value=w.eval('String(__M.task.ans.n)+"/"+String(__M.task.ans.d)');const task=w.eval('__M.task');d.querySelector('#m-dec').value=String(Number(task.ans.n)/Number(task.ans.d));button=d.querySelector('#m-ck');}
 button.click();const first=w.localStorage.getItem('mathExamCourseProgress.v1');assert.ok(first,'progress written');button.click();assert.equal(w.localStorage.getItem('mathExamCourseProgress.v1'),first,'no repeated credit');
 }finally{dom.window.close()}});
test('12: guided steps preserve accepted work and main input',async()=>{const dom=await open(12);try{const w=dom.window,d=w.document;d.querySelector('#ansIn').value='17';w.Math.random=()=>0.25;[...d.querySelectorAll('button')].find(b=>b.textContent==='Хочешь подсказку?').click();const plan=w.eval('buildSteps(cur)');for(let i=0;i<plan.length;i++){const st=plan[i],host=d.querySelector('.minimal-step-current');if(st.kind==='mc'){const opts=st.correctByFlag?st.options:st.options.map((html,j)=>({html,ok:j===st.correct}));host.querySelectorAll('.mc button')[[...opts].findIndex(o=>o.ok)].click();}else{host.querySelector('input').value=String(st.answer);host.querySelector('button').click();}assert.equal(d.querySelectorAll('.minimal-step-history .step-done').length,i+1);}assert.equal(d.querySelector('#ansIn').value,'17');assert.match(d.querySelector('.minimal-step-current').textContent,/Все шаги выполнены/);}finally{dom.window.close()}});

test('12: wrong guided answer retains the existing mistake provenance',async()=>{const dom=await open(12);try{const w=dom.window,d=w.document;w.Math.random=()=>0.25;[...d.querySelectorAll('button')].find(b=>b.textContent==='Хочешь подсказку?').click();const steps=w.eval('buildSteps(cur)'),st=steps[0],host=d.querySelector('.minimal-step-current');if(st.kind==='mc'){const opts=st.correctByFlag?st.options:st.options.map((html,j)=>({html,ok:j===st.correct}));host.querySelectorAll('.mc button')[[...opts].findIndex(o=>!o.ok)].click();}else{host.querySelector('input').value=String(st.answer+123);host.querySelector('button').click();}assert.equal(w.eval('A.missed'),true);d.querySelector('#ansIn').value=w.eval('String(cur.answer)');d.querySelector('#checkBtn').click();assert.equal(w.eval('A.missed'),true);assert.equal(w.eval('CP.openTypes().includes(String(cur.t))'),true,'correct final after wrong step does not close mistake as clean');}finally{dom.window.close()}});

function probabilityCase(w){
 const task=w.eval('window.__hintTask10=genTask("10.2",makePick(RNG(17)));genRandom=()=>window.__hintTask10;marFilter="all";marNew();window.__hintTask10');
 const c=w.document.querySelector('#mar-root>.card'),help=c.querySelector('.minimal-hint'),panel=c.querySelector('.minimal-hint-panel');
 const id=help.id.replace(/-steps$/,'');
 return {task,c,help,panel,input:w.document.getElementById(id+'-dec'),check:w.document.getElementById(id+'-ck'),id};
}
function probabilityProgress(w){return JSON.parse(w.localStorage.getItem('mathExamCourseProgress.v1')||'{}')['oge-t10-veroyatnost']||{};}
function probabilityAnswer(f){return String(f.n)+'/'+String(f.d);}
test('10: help toggles without locking main input, losing steps or changing progress',async()=>{
 const dom=await open(10);try{const w=dom.window,d=w.document,{task,c,help,panel,input,check,id}=probabilityCase(w);
 input.value='0,375';d.getElementById(id+'-tofrac').click();d.getElementById(id+'-n').value='3';d.getElementById(id+'-d').value='8';
 const before=w.localStorage.getItem('mathExamCourseProgress.v1');help.click();
 assert.equal(help.disabled,false);assert.equal(input.disabled,false);assert.equal(check.disabled,false);assert.equal(panel.hidden,false);assert.equal(help.getAttribute('aria-controls'),panel.id);
 const first=panel.querySelector('.step');first.querySelector('input').value=probabilityAnswer(task.steps[0].ans);first.querySelector('button').click();
 const pending=panel.querySelector('.step:last-child input');pending.value='23';
 for(let i=0;i<3;i++){help.click();assert.equal(panel.hidden,true);assert.equal(help.getAttribute('aria-expanded'),'false');help.click();assert.equal(panel.hidden,false);assert.equal(help.getAttribute('aria-expanded'),'true');}
 assert.equal(panel.querySelector('.step'),first);assert.equal(panel.querySelector('.step:last-child input'),pending);assert.equal(pending.value,'23');assert.equal(panel.querySelectorAll('.done-ok').length,1);
 assert.equal(input.value,'0,375');assert.equal(d.getElementById(id+'-n').value,'3');assert.equal(d.getElementById(id+'-d').value,'8');assert.ok(d.getElementById(id+'-aw').classList.contains('fr-mode'));assert.equal(w.localStorage.getItem('mathExamCourseProgress.v1'),before);
 }finally{dom.window.close()}
});
test('10: primary answer after opening help credits once and closes active step actions',async()=>{
 const dom=await open(10);try{const w=dom.window,{task,c,help,panel,input,check}=probabilityCase(w);help.click();
 const stepInput=panel.querySelector('.step input'),stepCheck=panel.querySelector('.step button'),stepShow=panel.querySelector('.step .show');
 stepInput.value=probabilityAnswer(task.steps[0].ans);input.value=probabilityAnswer(task.answer);check.click();
 assert.equal(probabilityProgress(w).solvedByType['10_2'],1);assert.equal(input.disabled,true);assert.equal(stepInput.disabled,true);
 const snapshot=w.localStorage.getItem('mathExamCourseProgress.v1');check.onclick();stepCheck.onclick();stepShow.onclick();
 assert.equal(w.localStorage.getItem('mathExamCourseProgress.v1'),snapshot);assert.equal(w.eval('recOf(window.__hintTask10).shown'),false);
 assert.equal(c.querySelectorAll('[id$="-next"]').length,1);help.click();assert.equal(panel.hidden,true);assert.equal(c.querySelector('[id$="-next"]').closest('.minimal-hint-panel'),null);help.click();assert.equal(panel.hidden,false);
 c.querySelector('[id$="-next"]').click();assert.equal(w.document.querySelector('#mar-root .minimal-hint-panel').hidden,true);assert.equal(w.document.querySelector('#mar-root .aw-dec').value,'');
 }finally{dom.window.close()}
});
test('10: revealed step followed by primary answer keeps shown provenance',async()=>{
 const dom=await open(10);try{const w=dom.window,{task,help,panel,input,check,id}=probabilityCase(w);help.click();panel.querySelector('.step .show').click();
 help.click();input.value=probabilityAnswer(task.answer);check.click();const rec=probabilityProgress(w);
 assert.equal(rec.solvedByType['10_2']||0,0);assert.equal(rec.ext.byType['10.2'].shown,1);assert.equal(rec.ext.byType['10.2'].correct,0);assert.equal(w.eval('recOf(window.__hintTask10).shown'),true);assert.match(w.document.getElementById(id+'-fb').textContent,/Верно! Были показанные шаги — задача в счёт решённых не идёт/);
 }finally{dom.window.close()}
});
test('10: wrong guided answer followed by primary answer retains mistake',async()=>{
 const dom=await open(10);try{const w=dom.window,{task,help,panel,input,check}=probabilityCase(w);help.click();panel.querySelector('.step input').value='999';panel.querySelector('.step button').click();
 input.value=probabilityAnswer(task.answer);check.click();assert.equal(probabilityProgress(w).solvedByType['10_2'],1);assert.equal(w.eval('CP.openTypes().includes("10_2")'),true);
 }finally{dom.window.close()}
});
test('10: completing guided steps credits once and retains the original main answer',async()=>{
 const dom=await open(10);try{const w=dom.window,{task,c,help,panel,input,check}=probabilityCase(w);input.value='0,125';help.click();
 for(const s of task.steps){const current=panel.querySelector('.step:last-child');current.querySelector('input').value=probabilityAnswer(s.ans);current.querySelector('button[id$="-ck"]').click();}
 assert.equal(probabilityProgress(w).solvedByType['10_2'],1);assert.equal(input.value,'0,125');assert.equal(input.disabled,true);assert.equal(check.disabled,true);
 const snapshot=w.localStorage.getItem('mathExamCourseProgress.v1');check.onclick();assert.equal(w.localStorage.getItem('mathExamCourseProgress.v1'),snapshot);assert.equal(c.querySelectorAll('[id$="-next"]').length,1);help.click();assert.equal(panel.hidden,true);help.click();assert.equal(panel.querySelectorAll('.done-ok').length,task.steps.length);
 }finally{dom.window.close()}
});
