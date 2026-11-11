'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const {JSDOM}=require('jsdom'),P=require('./atanasyan-active-practice.runtime.js');
const {assertCoreIdentity}=require('./atanasyan-legacy-audit.core.cjs');
const tasks=[
 {id:'a',prompt:'Два угла треугольника равны 60° и 70°. Найди третий угол.',answer:{kind:'number',value:50,unit:'°'},hint:'Сумма углов треугольника равна 180°.',solution:'180 − 60 − 70 = 50°.',errors:[{value:130,feedback:'Это сумма двух данных углов. Нужен оставшийся угол.'}]},
 {id:'b',prompt:'Два угла треугольника равны 50° и 70°. Найди третий угол.',answer:{kind:'number',value:60,unit:'°'},hint:'Найди, сколько не хватает до 180°.',solution:'180 − 50 − 70 = 60°.',errors:[]},
 {id:'c',prompt:'Какую линию определяет середина противоположной стороны?',answer:{kind:'choice',value:'median',options:[{value:'median',label:'Медиану'},{value:'altitude',label:'Высоту'}]},hint:'Медиана соединяет вершину с серединой стороны.',solution:'Это медиана.',errors:[{value:'altitude',feedback:'Высоту определяет прямой угол с прямой стороны.'}]},
 {id:'d',prompt:'Найди половину числа 1.',answer:{kind:'number',value:.5},hint:'Раздели 1 на 2.',solution:'1/2 = 0,5.',errors:[]}
];
const config={id:'fixture',topic:'Самостоятельная проверка',tasks};let checks=0;
function ok(value,message){assert.ok(value,message);checks++;}
for(const raw of ['', '  ','abc','3/0','2**3','1 2','NaN','Infinity']){const s=P.freshState();const r=P.submit(s,tasks[0],raw);assert.equal(r.kind,'format');assert.equal(s.records[s.active].attempts,0);assert.equal(s.records[s.active].errors,0);checks+=3;}
for(const raw of ['0,5','.5','1/2',' 1 / 2 ']){const s=P.freshState();assert.equal(P.submit(s,tasks[3],raw).kind,'independent');assert.equal(s.credits.length,1);checks+=2;}
{
 const s=P.freshState();assert.equal(P.help(s,tasks[0],'hint'),false);P.submit(s,tasks[0],'130');assert.equal(s.records[s.active].firstAnswer,'130');assert.match(s.records[s.active].feedback,/сумма двух/);assert.equal(P.help(s,tasks[0],'hint'),false);P.submit(s,tasks[0],'140');assert.equal(P.help(s,tasks[0],'hint'),true);assert.equal(P.submit(s,tasks[0],'50°').kind,'assisted');assert.equal(s.credits.length,0);checks+=7;
 assert.equal(P.nextUnseen(s,tasks).id,'b');P.select(s,tasks[1]).draft='60';P.select(s,tasks[0]);assert.equal(s.records[P.fingerprint(tasks[1])].draft,'60');checks+=2;
 P.submit(s,tasks[1],'60');assert.equal(s.credits.length,1);assert.equal(P.submit(s,tasks[1],'60').kind,'complete');assert.equal(s.credits.length,1);checks+=3;
 P.help(s,tasks[1],'solution');assert.equal(s.credits.length,1,'post-success explanation does not erase historical success');ok(P.repeat(s,tasks[1]),'explicit known repeat');assert.equal(P.submit(s,tasks[1],'60').kind,'repeated');assert.equal(s.credits.length,1);checks+=3;
 const restored=P.readState(JSON.stringify(s));assert.equal(restored.records[P.fingerprint(tasks[0])].hint,true);assert.equal(restored.records[P.fingerprint(tasks[0])].firstOutcome,'wrong');assert.equal(restored.archive.length,1);checks+=3;
 const choice=tasks[2],shuffled={...choice,answer:{...choice.answer,options:[...choice.answer.options].reverse()}};assert.equal(P.fingerprint(choice),P.fingerprint(shuffled),'option order is presentation');const renamed={...choice,answer:{...choice.answer,value:'v0',options:choice.answer.options.map((o,i)=>({...o,value:'v'+i}))}};assert.equal(P.fingerprint(choice),P.fingerprint(renamed),'choice option IDs are bookkeeping');P.select(s,choice);assert.equal(P.nextUnseen(s,[shuffled,renamed]),null,'choice reshuffling cannot create a fresh problem');checks+=3;
 const identical={...tasks[1],id:'renamed'};assert.equal(P.nextUnseen(s,[identical]),null,'renaming cannot create a mathematically fresh condition');checks++;
}
{
 const s=P.freshState();P.submit(s,tasks[0],'40');assert.equal(P.submit(s,tasks[0],'50').kind,'corrected');assert.equal(s.credits.length,0);checks+=2;
 P.submit(s,tasks[2],'');assert.equal(s.records[s.active].attempts,0);P.submit(s,tasks[2],'not-an-option');assert.equal(s.records[s.active].attempts,0);P.submit(s,tasks[2],'median');assert.equal(s.credits.length,1);checks+=3;
 for(const task of tasks)P.select(s,task);assert.equal(P.nextUnseen(s,tasks),null);checks++;
}
function mount(raw){const dom=new JSDOM('<div class="bar"></div>',{url:'https://mathexam.space/geometry-course/trainers/fixture.html'}),w=dom.window,motions={scroll:[],focus:[]};w.HTMLElement.prototype.scrollIntoView=function(options){motions.scroll.push({id:this.id,options});};const originalFocus=w.HTMLElement.prototype.focus;w.HTMLElement.prototype.focus=function(options){motions.focus.push({tag:this.tagName,options});return originalFocus.call(this,options);};const old='{"fixture":{"passed":true,"best":100}}';w.localStorage.setItem('mathExamCourseProgress.v1',old);if(raw!==undefined)w.localStorage.setItem('mathExamGeometryTransfer.v1.fixture',raw);const app=P.mount(w,w.document,config);return {dom,w,app,old,motions};}
function input(ctx,value){const field=ctx.app.panel.querySelector('#ap-answer');field.value=value;field.dispatchEvent(new ctx.w.Event('input',{bubbles:true}));}
function click(ctx,selector){ctx.app.panel.querySelector(selector).click();}
function submit(ctx){ctx.app.panel.querySelector('[data-practice-form]').dispatchEvent(new ctx.w.Event('submit',{bubbles:true,cancelable:true}));}
{
 const ctx=mount();input(ctx,'130');submit(ctx);input(ctx,'bad');submit(ctx);let state=ctx.app.state();assert.equal(state.records[state.active].errors,1);assert.equal(ctx.app.panel.querySelector('[data-practice-hint]').disabled,true);checks+=2;
 input(ctx,'140');submit(ctx);click(ctx,'[data-practice-hint]');input(ctx,'50');submit(ctx);state=ctx.app.state();assert.equal(state.records[state.active].outcome,'assisted');assert.equal(state.credits.length,0);checks+=2;
 click(ctx,'[data-practice-next]');assert.match(ctx.app.panel.querySelector('.ap-problem').textContent,/50° и 70°/);input(ctx,'60');submit(ctx);state=ctx.app.state();assert.equal(state.credits.length,1);assert.equal(ctx.w.localStorage.getItem('mathExamCourseProgress.v1'),ctx.old);checks+=3;
 const restored=mount(ctx.w.localStorage.getItem(ctx.app.key));assert.equal(restored.app.panel.querySelector('#ap-answer').value,'60');assert.equal(restored.app.state().credits.length,1);checks+=2;ctx.dom.window.close();restored.dom.window.close();
}
{
 const ctx=mount();input(ctx,'35');const fresh=P.freshState();P.select(fresh,tasks[1]).draft='Новая работа';ctx.w.localStorage.setItem(ctx.app.key,JSON.stringify(fresh));input(ctx,'Сохранить этот черновик');
 assert.equal(ctx.w.localStorage.getItem(ctx.app.key),JSON.stringify(fresh));ok(ctx.app.panel.querySelector('#ap-answer').disabled,'stale attempt suspended');click(ctx,'[data-practice-latest]');assert.equal(ctx.app.panel.querySelector('#ap-answer').value,'Новая работа');assert.equal(ctx.app.panel.querySelector('[data-practice-recovery] textarea').value,'Сохранить этот черновик');checks+=3;ctx.dom.window.close();
}
{
 const ctx=mount('malformed');input(ctx,'Запись после ошибки');assert.equal(ctx.w.localStorage.getItem(ctx.app.key),'malformed');assert.match(ctx.app.panel.querySelector('[data-practice-status]').textContent,/скачай/);checks+=2;ctx.dom.window.close();
 const dom=new JSDOM('<div class="bar"></div>',{url:'https://mathexam.space/?g7-board=1'});assert.equal(P.mount(dom.window,dom.window.document,config),null);assert.equal(dom.window.document.querySelector('.bar').children.length,0);checks+=2;dom.window.close();
}
// Changing the condition must bring the new problem back into view; ordinary work stays put.
{
 const ctx=mount();input(ctx,'130');submit(ctx);input(ctx,'140');submit(ctx);click(ctx,'[data-practice-hint]');
 assert.equal(ctx.motions.scroll.length,0,'input, answer and hint never jump to the top');assert.equal(ctx.motions.focus.length,0,'ordinary work never steals keyboard focus');checks+=2;
 const firstKey=ctx.app.state().active;click(ctx,'[data-practice-next]');
 assert.deepEqual(ctx.motions.scroll.at(-1),{id:'atanasyan-active-practice',options:{block:'start'}},'next condition scrolls the practice panel into view');assert.deepEqual(ctx.motions.focus.at(-1),{tag:'H2',options:{preventScroll:true}},'new heading receives accessible focus without a second scroll');assert.equal(ctx.w.document.activeElement.tagName,'H2');assert.equal(ctx.app.state().records[firstKey].draft,'140','changing condition preserves previous draft');checks+=4;
 input(ctx,'60');submit(ctx);assert.equal(ctx.motions.scroll.length,1,'successful answer does not reset viewport');assert.equal(ctx.motions.focus.length,1,'successful answer does not move focus');checks+=2;
 click(ctx,'[data-practice-repeat]');assert.equal(ctx.motions.scroll.length,2,'known repeat shows its condition');assert.equal(ctx.motions.focus.length,2);assert.deepEqual(ctx.motions.scroll.at(-1).options,{block:'start'});assert.deepEqual(ctx.motions.focus.at(-1).options,{preventScroll:true});checks+=4;
 const selector=ctx.app.panel.querySelector('[data-practice-select]');selector.value=tasks[0].id;selector.dispatchEvent(new ctx.w.Event('change',{bubbles:true}));
 assert.equal(ctx.motions.scroll.length,3,'resumed condition is brought into view');assert.equal(ctx.motions.focus.length,3);assert.equal(ctx.app.panel.querySelector('#ap-answer').value,'140','resumed condition retains the saved answer');assert.equal(ctx.app.state().records[firstKey].hint,true,'resumed help remains recorded');checks+=4;
 ctx.dom.window.close();
}
// Exact embedded source, all 70 banks, retained-core identity, and composition.
const root=path.resolve(__dirname,'..'),dir=path.join(root,'geometry-course/trainers');
const bankFiles=['active-practice-ch12.json','active-practice-ch34.json'];
assert.ok(bankFiles.every(name=>fs.existsSync(path.join(root,'geometry-course/data',name))),'Both authored banks are required');
{
 const banks=bankFiles.flatMap(name=>JSON.parse(fs.readFileSync(path.join(root,'geometry-course/data',name))));assert.equal(banks.length,70);checks++;
 const byId=new Map(banks.map(bank=>[bank.id,bank]));assert.equal(byId.size,70);checks++;
 const baseline=require('./atanasyan-legacy-audit.baseline.json'),runtime=fs.readFileSync(path.join(__dirname,'atanasyan-active-practice.runtime.js'),'utf8');
 for(const file of Object.keys(baseline.files)){
  const content=fs.readFileSync(path.join(dir,file),'utf8'),bank=byId.get(file.slice(0,-5));ok(bank,'bank for '+file);ok(bank.tasks.length>=3,'three task variants '+file);assert.equal(new Set(bank.tasks.map(P.fingerprint)).size,bank.tasks.length);checks++;
  const snippet=content.match(/<!-- atanasyan-active-practice:start -->[\s\S]*?<!-- atanasyan-active-practice:end -->\n/);ok(snippet,'embedded '+file);
  const embedded=JSON.parse(snippet[0].match(/id="atanasyan-active-practice-config">([\s\S]*?)<\/script>/)[1]);assert.deepEqual(embedded,bank,'exact reviewed authored bank '+file);const rawConfig=snippet[0].match(/id="atanasyan-active-practice-config">([\s\S]*?)<\/script>/)[1];assert.equal(snippet[0],'<!-- atanasyan-active-practice:start -->\n<script type="application/json" id="atanasyan-active-practice-config">'+rawConfig+'</script>\n<script>\n'+runtime.replaceAll('</script','<\\/script')+'</script>\n<!-- atanasyan-active-practice:end -->\n','exact active block, no extra scripts '+file);checks++;
  const core=content.replace(snippet[0],'').replace(/<!-- atanasyan-personal-notebook:start -->[\s\S]*?<!-- atanasyan-personal-notebook:end -->\n/,'');assertCoreIdentity(core,file);checks++;
 }
 const negative=fs.readFileSync(path.join(dir,Object.keys(baseline.files)[0]),'utf8'),changed=negative.replace('<title>','<title>UNREVIEWED');
 assert.throws(()=>assertCoreIdentity(changed.replace(/<!-- atanasyan-active-practice:start -->[\s\S]*?<!-- atanasyan-active-practice:end -->\n/,'').replace(/<!-- atanasyan-personal-notebook:start -->[\s\S]*?<!-- atanasyan-personal-notebook:end -->\n/,''),Object.keys(baseline.files)[0]),assert.AssertionError,'arbitrary retained core edit is never hidden by known block stripping');checks++;
 const before=Object.fromEntries([...byId.keys()].map(id=>[id,fs.readFileSync(path.join(dir,id+'.html'))]));
 for(const script of ['atanasyan-legacy-audit.build.py','atanasyan-active-practice.build.py','atanasyan-legacy-audit.build.py','atanasyan-active-practice.build.py'])cp.execFileSync('python3',[path.join(__dirname,script)],{stdio:'pipe'});
 for(const [id,buffer] of Object.entries(before)){assert.deepEqual(fs.readFileSync(path.join(dir,id+'.html')),buffer,'builders compose idempotently '+id);checks++;}
}
console.log('Atanasyan active transfer PASS: '+checks+' checks');
