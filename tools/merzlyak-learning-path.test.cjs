'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const repo=path.resolve(__dirname,'..'),dir=path.join(repo,'geometry-merzlyak'),S=require(path.join(dir,'assets/store.js'));
function fresh(){return S.clean({seed:1,attemptSchema:2,contentVersion:1});}
function lesson(id='merzlyak-base-7-2',saved){
 const html=fs.readFileSync(path.join(dir,'atlas',id+'.html'),'utf8'),dom=new JSDOM(html,{url:'https://mathexam.space/geometry-merzlyak/atlas/'+id+'.html',runScripts:'outside-only'}),w=dom.window;
 if(saved)w.localStorage.setItem(S.KEY,JSON.stringify(saved));
 w.eval(html.match(/<script>window.COURSE_CONFIG=([\s\S]*?);<\/script>/)[0].slice(8,-9));
 w.GeoExperiments={mount(){}};w.GeoLab={mount(){return {destroy(){},board:{snapshot:()=>'{"points":[],"objects":[]}',points:[],objects:[],update(){},goal:()=>({ok:false})},redraw(){}}}};
 for(const f of ['store.js','tasks.js','extra-tasks.js','lesson.js'])w.eval(fs.readFileSync(path.join(dir,'assets',f),'utf8'));
 return {dom,w,id,get:()=>JSON.parse(w.localStorage.getItem(S.KEY)).units[id]};
}
function submit(c,value){const input=c.w.document.getElementById('answer');input.value=value;input.dispatchEvent(new c.w.Event('input',{bubbles:true}));c.w.document.getElementById('answer-form').dispatchEvent(new c.w.Event('submit',{bubbles:true,cancelable:true}));}
function independent(c){c.w.document.querySelector('[data-stage="4"]').click();}
function answer(c){return c.w.GeoTasks.format(c.w.GeoTasks.task(c.w.COURSE_CONFIG.unit.calc,c.get().seed).answer);}
function catalog(saved){const html=fs.readFileSync(path.join(dir,'index.html'),'utf8'),dom=new JSDOM(html,{url:'https://mathexam.space/geometry-merzlyak/',runScripts:'outside-only'}),w=dom.window;if(saved)w.localStorage.setItem(S.KEY,JSON.stringify(saved));w.eval(html.match(/<script>window.CATALOG=([\s\S]*?);<\/script>/)[0].slice(8,-9));for(const f of ['store.js','catalog.js'])w.eval(fs.readFileSync(path.join(dir,'assets',f),'utf8'));return {dom,w};}
test('first success is credited once, not on repeated submission or reload',()=>{const c=lesson();independent(c);submit(c,answer(c));assert.equal(c.get().independent,1);submit(c,answer(c));assert.equal(c.get().independent,1);const saved=JSON.parse(c.w.localStorage.getItem(S.KEY));c.dom.window.close();const again=lesson(c.id,saved);submit(again,answer(again));assert.equal(again.get().independent,1);again.dom.window.close();});
test('wrong answer then correction is independent self-correction without help',()=>{const c=lesson();independent(c);submit(c,'неверный ответ');assert.equal(c.get().assisted,false);assert.equal(c.get().tries,1);submit(c,answer(c));assert.equal(c.get().independent,0);assert.equal(c.get().selfCorrected,1);assert.match(c.w.document.getElementById('answer-feedback').textContent,/исправил.*самостоятельно/);submit(c,answer(c));assert.equal(c.get().selfCorrected,1);c.dom.window.close();});
test('opened solution remains help after reload and correction',()=>{let c=lesson();independent(c);c.w.document.querySelector('[data-action="show-solution"]').click();submit(c,'неверно');const saved=JSON.parse(c.w.localStorage.getItem(S.KEY));c.dom.window.close();c=lesson(c.id,saved);submit(c,answer(c));assert.equal(c.get().independent,0);assert.equal(c.get().selfCorrected,0);assert.equal(c.get().assistedSolved,1);assert.equal(c.get().result,'helped');c.dom.window.close();});
test('legacy unknown current attempt is never promoted to new independent credit',()=>{const s=S.clean({checked:true,assisted:false,independent:4});assert.equal(S.recordAnswer(s,true),'legacy');assert.equal(s.independent,4);assert.equal(s.selfCorrected,0);});
test('repeated task never adds a new independent or corrected success',()=>{const s=fresh();s.repeatedTask=true;S.recordAnswer(s,false);assert.equal(S.recordAnswer(s,true),'repeated');assert.equal(s.independent+s.selfCorrected,0);});
test('similarity content update archives old work and resets only current achievements',()=>{const id='merzlyak-base-8-14',old={independent:8,stage:4,seed:22,checked:true,proofDone:['s1','s2'],proof:true,written:'Моё прежнее доказательство',observation:'Моё наблюдение',draft:'да',updated:500,drawing:{points:[],objects:[]}},m=S.validate({version:1,units:{[id]:old}},[id]).units[id];assert.equal(m.contentVersion,2);assert.equal(m.independent,0);assert.equal(m.stage,0);assert.equal(m.proof,false);assert.equal(m.previousContent.independent,8);assert.equal(m.previousContent.written,old.written);assert.equal(m.previousContent.observation,old.observation);assert.equal(m.previousContent.draft,'да');assert.equal(m.updated,500);const twice=S.validate({version:1,units:{[id]:m}},[id]).units[id];assert.equal(twice.previousContent.independent,8);assert.equal(twice.previousContent.previousContent,null);});
test('resume selects actual recent work and restores exact stage and draft',()=>{const id='merzlyak-base-7-2',saved={version:1,units:{[id]:{...fresh(),updated:100,stage:4,draft:'моя незаконченная запись'},'merzlyak-base-7-3':{...fresh(),updated:200,events:[{type:'start',time:200}]}}},c=catalog(saved);assert.match(c.w.document.querySelector('[data-resume]').getAttribute('href'),new RegExp(id));assert.match(c.w.document.querySelector('.path-current').textContent,/Этап 5 из 6/);c.dom.window.close();const l=lesson(id,saved);assert.equal(l.w.document.getElementById('answer').value,'моя незаконченная запись');l.dom.window.close();});
test('manual writing and viewing do not count as independent mastery',()=>{const c=catalog({version:1,units:{'merzlyak-base-7-2':{...fresh(),written:'Моё доказательство',updated:10},'merzlyak-base-7-3':{...fresh(),events:[{type:'start',time:20}],updated:20}}});const counts=c.w.document.querySelector('.path-counts').textContent;assert.match(counts,/1 \/ 84тем начато/);assert.match(counts,/0тем с примером без помощи/);assert.match(counts,/1текстов для проверки/);assert.match(c.w.document.querySelector('[data-id="merzlyak-base-7-2"] .status').textContent,/ждёт проверки/);c.dom.window.close();});
test('diagnostic draft survives leaving the stage and reload',()=>{const c=lesson(),field=c.w.document.getElementById('diagnosis');field.value='Нужно проверить особый случай';field.dispatchEvent(new c.w.Event('input',{bubbles:true}));c.w.document.querySelector('[data-stage="4"]').click();const saved=JSON.parse(c.w.localStorage.getItem(S.KEY));c.dom.window.close();const l=lesson(c.id,saved);l.w.document.querySelector('[data-stage="0"]').click();assert.equal(l.w.document.getElementById('diagnosis').value,'Нужно проверить особый случай');l.dom.window.close();});
test('legacy similarity notes are visibly retrievable in the revised lesson',()=>{const id='merzlyak-base-8-14',c=lesson(id,{version:1,units:{[id]:{written:'Старое доказательство',independent:3,updated:1}}});assert.match(c.w.document.querySelector('.previous-work').textContent,/Старое доказательство/);assert.match(c.w.document.querySelector('.previous-work').textContent,/Прежние результаты сохранены отдельно/);assert.equal(c.get().independent,0);c.dom.window.close();});
test('import of newer old-content work preserves current revised task and archives old notes',()=>{const id='merzlyak-base-8-14',c=lesson(id);independent(c);submit(c,answer(c));const store=c.w.GeoStore.open([id]),current=store.get(id);store.import({version:1,units:{[id]:{independent:9,written:'Поздний старый экспорт',updated:current.updated+1000}}});const merged=store.get(id);assert.equal(merged.independent,1);assert.equal(merged.result,'first');assert.equal(merged.previousContent.independent,9);assert.equal(merged.previousContent.written,'Поздний старый экспорт');c.dom.window.close();});
test('read failure keeps latest observed snapshot available for export',()=>{const before=global.localStorage;let raw=JSON.stringify({version:1,units:{a:{written:'Первая запись',updated:1}}}),deny=false;try{global.localStorage={getItem(){if(deny)throw Error('denied');return raw;},setItem(){}};const store=S.open(['a']);raw=JSON.stringify({version:1,units:{a:{written:'Свежая запись',updated:2}}});assert.equal(store.get('a').written,'Свежая запись');deny=true;assert.equal(store.export().units.a.written,'Свежая запись');}finally{if(before===undefined)delete global.localStorage;else global.localStorage=before;}});

function click(c,selector){const el=c.w.document.querySelector(selector);assert.ok(el,'missing '+selector);el.click();}
function reload(c){const id=c.id,saved=JSON.parse(c.w.localStorage.getItem(S.KEY));c.dom.window.close();return lesson(id,saved);}
function draft(c,id,value){const el=c.w.document.getElementById(id);el.value=value;el.dispatchEvent(new c.w.Event('input',{bubbles:true}));}
test('two mistakes offer help without revealing content; requested advice persists and changes credit',()=>{
 let c=lesson();independent(c);submit(c,'0');submit(c,'0');
 assert.equal(c.get().assisted,false);assert.equal(c.get().helpRevealed,0);
 assert.ok(c.w.document.getElementById('help-offer'));assert.equal(c.w.document.getElementById('error-advice-box'),null);
 assert.equal(c.w.document.querySelectorAll('[data-help-step]').length,0);
 click(c,'[data-action="error-advice"]');const advice=c.w.document.getElementById('error-advice-box').textContent;
 assert.ok(advice.length>30);assert.equal(c.get().assisted,true);assert.match(c.w.document.getElementById('attempt-summary').textContent,/Помощь открыта/);
 c=reload(c);assert.equal(c.w.document.getElementById('error-advice-box').textContent,advice);
 const oldQuestion=c.w.document.querySelector('.task-question').textContent,oldKey=c.get().currentTaskKey;
 submit(c,answer(c));submit(c,answer(c));assert.equal(c.get().assistedSolved,1);assert.equal(c.get().independent,0);assert.match(c.w.document.getElementById('attempt-totals').textContent,/С помощью: 1/);
 click(c,'[data-action="new-task"]');assert.notEqual(c.get().currentTaskKey,oldKey);assert.notEqual(c.w.document.querySelector('.task-question').textContent,oldQuestion);
 assert.equal(c.get().assisted,false);assert.equal(c.get().assistedSolved,1);assert.equal(c.get().recentAttempts.length,1);assert.equal(c.get().recentAttempts[0].result,'helped');assert.equal(c.get().recentAttempts[0].mistakes,2);assert.equal(c.get().recentAttempts[0].errorAdvice,c.get().recentAttempts[0].errorAdvice.trim());
 assert.match(c.w.document.getElementById('attempt-history').textContent,/Решено с помощью/);
 c=reload(c);assert.equal(c.get().recentAttempts.length,1);assert.match(c.w.document.getElementById('attempt-history').textContent,/Ошибок: 2/);assert.match(c.w.document.getElementById('attempt-totals').textContent,/С помощью: 1/);c.dom.window.close();
});
test('one hint reveals only one question; explanations and later steps survive reload without replacing earlier steps',()=>{
 let c=lesson();independent(c);const t=c.w.GeoTasks.task(c.w.COURSE_CONFIG.unit.calc,c.get().seed);
 click(c,'[data-action="show-solution"]');assert.equal(c.w.document.querySelectorAll('[data-help-step]').length,1);
 assert.equal(c.w.document.querySelectorAll('[data-help-explanation]').length,0);assert.ok(!c.w.document.getElementById('hint-box').textContent.includes(t.steps[0].reason));
 assert.equal(c.get().fullSolution,false);click(c,'[data-help-explain="0"]');const first=c.w.document.querySelector('[data-help-step="0"]').textContent;
 click(c,'[data-action="show-solution"]');assert.equal(c.w.document.querySelectorAll('[data-help-step]').length,2);assert.equal(c.w.document.querySelector('[data-help-step="0"]').textContent,first);
 assert.equal(c.w.document.querySelectorAll('[data-help-explanation]').length,1);
 c=reload(c);assert.equal(c.w.document.querySelector('[data-help-step="0"]').textContent,first);assert.equal(c.w.document.querySelectorAll('[data-help-step]').length,2);assert.equal(c.get().assisted,true);
 click(c,'[data-action="full-solution"]');assert.equal(c.w.document.querySelectorAll('[data-help-explanation]').length,t.steps.length);c=reload(c);assert.equal(c.get().fullSolution,true);assert.match(c.w.document.getElementById('hint-box').textContent,/Ответ:/);c.dom.window.close();
});
test('free stage navigation retains the same independent draft and help; viewing guided work is assistance',()=>{
 let c=lesson();independent(c);draft(c,'answer','моя самостоятельная запись');const key=c.get().currentTaskKey;
 click(c,'[data-stage="0"]');independent(c);assert.equal(c.get().currentTaskKey,key);assert.equal(c.w.document.getElementById('answer').value,'моя самостоятельная запись');assert.equal(c.get().assisted,false);
 click(c,'[data-stage="3"]');assert.equal(c.get().assisted,true);draft(c,'answer','мой ответ на шаг');click(c,'[data-action="hint"]');
 independent(c);assert.equal(c.w.document.getElementById('answer').value,'моя самостоятельная запись');assert.equal(c.get().currentTaskKey,key);
 click(c,'[data-stage="3"]');assert.equal(c.w.document.getElementById('answer').value,'мой ответ на шаг');assert.ok(c.w.document.getElementById('hint-box').textContent.length>0);
 c=reload(c);assert.equal(c.w.document.getElementById('answer').value,'мой ответ на шаг');assert.ok(c.w.document.getElementById('hint-box').textContent.length>0);
 independent(c);submit(c,answer(c));assert.equal(c.get().result,'helped');assert.equal(c.get().independent,0);c.dom.window.close();
});
test('bounded generator search skips familiar conditions and does not claim mathematical exhaustion',()=>{
 const make=seed=>({question:'q'+seed%3,answer:seed%3}),fingerprint=t=>t.question;
 assert.equal(S.findFreshTask(make,fingerprint,['q0','q1'],0).key,'q2');assert.equal(S.findFreshTask(make,fingerprint,['q0','q1','q2'],0,20),null);
 let c=lesson();independent(c);click(c,'[data-action="show-solution"]');draft(c,'answer','сохранить этот ответ');click(c,'[data-stage="0"]');
 const saved=JSON.parse(c.w.localStorage.getItem(S.KEY)),v=saved.units[c.id],T=c.w.GeoTasks,kind=c.w.COURSE_CONFIG.unit.calc;
 v.stage=4;v.seenTasks=Array.from({length:1025},(_,i)=>T.fingerprint(T.task(kind,v.seed+i)));
 const oldSeed=v.seed;c.dom.window.close();c=lesson(c.id,saved);click(c,'[data-action="new-task"]');
 assert.equal(c.get().seed,oldSeed);assert.equal(c.get().draft,'сохранить этот ответ');assert.equal(c.get().assisted,true);assert.equal(c.get().helpRevealed,1);assert.equal(c.get().recentAttempts.length,0);
 assert.match(c.w.document.getElementById('fresh-task-notice').textContent,/В следующих вариантах новых условий не нашлось/);assert.equal(c.w.document.querySelector('[data-action="new-task"]').disabled,true);c.dom.window.close();
});
test('prediction, observation comparison, and manual proof checks persist without awarding mathematical success',()=>{
 let c=lesson();assert.equal(c.w.document.getElementById('diagnosis-feedback').textContent,'');draft(c,'diagnosis','Мой первый контрпример');click(c,'[data-action="diagnosis"]');c=reload(c);
 assert.equal(c.w.document.getElementById('diagnosis').value,'Мой первый контрпример');assert.ok(c.w.document.getElementById('diagnosis-feedback').textContent.length>0);
 click(c,'[data-stage="1"]');draft(c,'observation','Мой вывод после перемещения');click(c,'[data-action="observation-compare"]');c=reload(c);
 assert.equal(c.w.document.getElementById('observation').value,'Мой вывод после перемещения');assert.ok(c.w.document.getElementById('observation-feedback').textContent.length>0);
 click(c,'[data-stage="5"]');click(c,'[data-proof-check="2"]');c=reload(c);assert.equal(c.w.document.querySelector('[data-proof-check="2"]').checked,true);assert.equal(c.get().independent,0);assert.equal(c.get().proof,false);assert.equal(c.get().complete,false);c.dom.window.close();
});
test('recent history is bounded and sanitized while old cumulative work stays intact',()=>{
 const s=S.clean({independent:7,assistedSolved:4,helpExplained:[0,0,99,-1,'1'],proofChecks:[2,2,99],recentAttempts:Array.from({length:25},(_,i)=>({seed:i,taskKey:'task'+i,question:'q',draft:'draft'+i,assisted:true,result:'helped',helpRevealed:2,helpExplained:[0]}))});
 assert.equal(s.recentAttempts.length,20);assert.equal(s.recentAttempts[0].draft,'draft5');assert.deepEqual(s.helpExplained,[0]);assert.deepEqual(s.proofChecks,[2]);assert.equal(s.independent,7);assert.equal(s.assistedSolved,4);
 const again=S.clean(s);assert.deepEqual(again.recentAttempts,s.recentAttempts);assert.equal(again.assistedSolved,4);
});
test('opening help after an earned success keeps earlier evidence and never awards it twice',()=>{
 const c=lesson();independent(c);submit(c,answer(c));click(c,'[data-action="show-solution"]');submit(c,answer(c));assert.equal(c.get().independent,1);assert.equal(c.get().assistedSolved,0);assert.match(c.w.document.getElementById('attempt-summary').textContent,/Сначала решено.*затем открыт разбор/);c.dom.window.close();
});
test('all 84 lessons expose progressive help without the authored explanation on the first click',()=>{
 const home=catalog(),ids=Array.from(home.w.CATALOG,u=>u.id);home.dom.window.close();assert.equal(ids.length,84);
 for(const id of ids){const c=lesson(id);independent(c);const t=c.w.GeoTasks.task(c.w.COURSE_CONFIG.unit.calc,c.get().seed);click(c,'[data-action="show-solution"]');assert.equal(c.w.document.querySelectorAll('[data-help-step]').length,1,id);assert.equal(c.w.document.querySelectorAll('[data-help-explanation]').length,0,id);assert.ok(!c.w.document.getElementById('hint-box').textContent.includes(t.steps[0].reason),id);assert.equal(c.get().assisted,true,id);c.dom.window.close();}
});

test('saved visible assistance cannot be cleaned into an unassisted attempt',()=>{
 const s=S.clean({attemptSchema:2,assisted:false,helpRevealed:1,helpExplained:[0],draft:'12'});assert.equal(s.assisted,true);assert.equal(S.recordAnswer(s,true),'helped');assert.equal(s.independent,0);
 const v=S.clean({stage:0,guidedDraft:'my step draft'});assert.equal(S.hasWork(v),true);
});
test('a wrong final answer is not diagnosed as a wrong guided substep when switching stages',()=>{
 const c=lesson();independent(c);submit(c,'0');assert.ok(c.w.document.querySelector('[data-action="error-advice"]'));click(c,'[data-stage="3"]');assert.equal(c.w.document.querySelector('[data-action="error-advice"]'),null);independent(c);assert.ok(c.w.document.querySelector('[data-action="error-advice"]'));c.dom.window.close();
});
