'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const {JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'trainers/oge-1-5-trainers');
const fallback=process.env.OGE_SOURCE_ROOT||root;
const files=fs.readdirSync(dir).filter(n=>n.endsWith('.html')&&n!=='index.html');
const tick=()=>new Promise(r=>setTimeout(r,25));
function inline(html){return [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(m=>! /\bsrc\s*=/.test(m[1])).map(m=>m[2]);}
function normalize(name,text){
 text=text.replace(/^  if\(window\.PracticalMinimal\) PracticalMinimal\.mountHint[^\n]*\n/gm,'')
  .replace(/^  if\(mode==='practice' && window\.PracticalMinimal\) PracticalMinimal\.mountHint[^\n]*\n/gm,'');
 if(name.includes('roads-grid'))text=text.replace("loadStoredSession()||catalogSession(0,0,'practice','off')","loadStoredSession()||catalogSession(0,0,'learn','off')").replace('id="hint-btn">Хочешь подсказку?','id="hint-btn">Подсказка');
 if(name.includes('stoves'))text=text.replace("mode: 'practice'","mode: 'learn'").replace("  card.classList.remove('hint-open','revealed');\n",'').replace('id="hint-btn">Хочешь подсказку?','id="hint-btn">Подсказка');
 if(name.includes('paper-sheets'))text=text.replace("mode:'practice', inst:null","mode:'learn', inst:null").replace('id="hintBtn">Хочешь подсказку?','id="hintBtn">Подсказка');
 if(name.includes('apartments'))text=text.replace("mode:'practice',solved:","mode:'learn',solved:").replace('id="bHint">Хочешь подсказку?','id="bHint">Подсказка');
 if(name.includes('tires'))text=text.replace("let state={ variantIdx:0, mode:'practice' };","let state={ variantIdx:0, mode:'learn' };").replace('Хочешь подсказку?</button>','показать подсказку</button>');
 if(name.includes('roads-schema'))text=text.replace("let mode='practice';","let mode='learn';");
 if(name.includes('percent-table'))text=text.replace("setView('practice');\n})();","setView('home');\n})();").replace("const hintLabels=['Хочешь подсказку?'","const hintLabels=['Подсказка 1: найти 100%'");
 if(name.includes('plan-reading'))text=text.replace("  start();\n  $('again').addEventListener","  $('again').addEventListener");
 return text;
}
// Hashes of inline engines at base 4b56350. Only the explicitly normalized UI edits above are allowed.
const ENGINE_HASHES={
  "practice-1-5-entry-diagnostic-2026.html": "1efda818d5d8a6baae36b308f2a4228b6f5efd36c79ad9c12660d2e7b4d0f34f",
  "practice-1-5-tariffs.html": "49a0f0eb1f6231f436add9a99ff99f436e9e052dab718d811b027f8e07c30fe9",
  "practice-1-5-plan-reading.html": "06e0c08bf82f9592706aa85bb246d850025faddf999a2beaa8bc01cd68e3e864",
  "practice-1-5-roads-grid.html": "0a8b72fc4c1a3554291e7d31569fc941982a558d9d5441d11b325774b4f17256",
  "practice-1-5-paper-sheets.html": "1dc2522bb435b4b8c9e43d8427166c21debf20e293ce4e9385ec3266a405ff5e",
  "practice-1-5-land-plots.html": "a4a70b458adb563bfb7fe465e533ba957903e2d6d2592a09bee8956207e6d84c",
  "practice-1-5-roads-schema.html": "ae543168de89d7ff5caa68ed4a58e6d7e600954399ef28a74cfec3b50e6c51b1",
  "practice-1-5-map.html": "92a021c3a3a7c177f7efd9a6b439bd5e09139171758635b3bcb40b639bb2d903",
  "practice-1-5-tires.html": "3a4850a9be1617464a7682aba1fcd3ddf76be83d0737d21069c6d0f8c8645e99",
  "percent-table-trainer.html": "896805b28591f1bffc08163b2a789443ab27b61d90252255c0ea9d337159e269",
  "practice-1-5-apartments.html": "af9db14b53e6b45755b9efc5a34eb540d5f7378359fed25d64b4cc95e6188cf4",
  "practice-1-5-stoves.html": "76dc7a58e0d1b96815dfc3d9af8577e334384f9d67c0f486d821eca50ef0068b",
  "practice-1-5-routes-checkpoint-2026.html": "31eb349079b5af06df5df88f2d8c88c3836b59997bcaefcb7c5ca7d631dc6c85"
};
test('all original banks, generators, checkers and progress code are unchanged outside explicit UI edits',()=>{
 for(const name of files){const scripts=inline(fs.readFileSync(path.join(dir,name),'utf8'));scripts.forEach((s,i)=>new vm.Script(s,{filename:name+':'+i}));const normalized=normalize(name,scripts.join('\n'));assert.equal(crypto.createHash('sha256').update(normalized).digest('hex'),ENGINE_HASHES[name],name);}
 new vm.Script(fs.readFileSync(path.join(dir,'practical-minimal.js'),'utf8'));
});
class Local extends ResourceLoader{fetch(url){const u=new URL(url);if(u.origin!=='https://mathexam.space')return null;for(const base of [root,fallback]){const f=path.join(base,u.pathname);if(fs.existsSync(f)&&fs.statSync(f).isFile())return Promise.resolve(fs.readFileSync(f));}return null;}}
async function open(name){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/scrollTo|navigation|HTMLCanvasElement.prototype.getContext/.test(e.message))errors.push(e.message);});
 const dom=new JSDOM(fs.readFileSync(path.join(dir,name),'utf8'),{url:'https://mathexam.space/trainers/oge-1-5-trainers/'+name,resources:new Local(),runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{};w.confirm=()=>true;w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});w.requestAnimationFrame=()=>1;w.cancelAnimationFrame=()=>{};}});
 await new Promise(r=>dom.window.addEventListener('load',r));await tick();assert.deepEqual(errors,[],name);return{dom,doc:dom.window.document,errors};
}
function shown(el){if(!el)return false;for(let n=el;n&&n.nodeType===1;n=n.parentElement){if(n.hidden)return false;if(n.tagName==='DETAILS'&&!n.open&&el!==n.querySelector(':scope > summary'))return false;const s=n.ownerDocument.defaultView.getComputedStyle(n);if(s.display==='none'||s.visibility==='hidden')return false;}return true;}
function click(doc,selector){const el=doc.querySelector(selector);assert.ok(el,selector);el.click();return el;}
const tasks={
 'practice-1-5-roads-grid.html':['#task-card .task-question','#task-card select,#answer-input'],
 'practice-1-5-roads-schema.html':['#app .qtext','#ans'],
 'practice-1-5-tires.html':['#quiz-B .quiz-q','#quiz-B .quiz-opt'],
 'practice-1-5-stoves.html':['#task-card .task-question','#task-card select,#answer-input'],
 'practice-1-5-land-plots.html':['#task-q','#in'],
 'practice-1-5-apartments.html':['#taskBody .question,#taskBody .q,#taskBody p','#taskBody input,#taskBody select'],
 'practice-1-5-tariffs.html':['#task-q','#in'],
 'practice-1-5-paper-sheets.html':['#taskCard .task-q','#matchAns'],
 'practice-1-5-plan-reading.html':['#question','#answer-area button'],
 'percent-table-trainer.html':['#practice-question','#practice-input']
};
for(const name of files)test('boots with optional controls and retained exercise: '+name,async()=>{const{dom,doc,errors}=await open(name);try{
 assert.equal(doc.documentElement.dataset.practicalMinimal,'ready');assert.ok(doc.querySelector('.pm-details'));
 if(tasks[name])for(const s of tasks[name])assert.ok(shown(doc.querySelector(s)),name+': '+s);
 if(!/diagnostic|checkpoint|map/.test(name))assert.ok([...doc.querySelectorAll('button,summary')].some(x=>x.textContent.trim()==='Хочешь подсказку?'),name+' hint action');
 assert.deepEqual(errors,[]);
}finally{dom.window.close();}});
for(const name of ['practice-1-5-land-plots.html','practice-1-5-tariffs.html','practice-1-5-roads-schema.html'])test('hint is contextual, optional and reset on next task: '+name,async()=>{const{dom,doc}=await open(name);try{
 const input=doc.querySelector('#in,#ans');input.value='123';const before=dom.window.localStorage.getItem('mathExamCourseProgress.v1');
 const b=click(doc,'.pm-context-hint button');assert.equal(b.getAttribute('aria-expanded'),'true');assert.equal(doc.querySelector('.pm-context-hint section').hidden,false);assert.equal(input.value,'123');assert.equal(dom.window.localStorage.getItem('mathExamCourseProgress.v1'),before);
 assert.ok(doc.querySelector('.pm-context-hint svg,.pm-context-hint .pm-model-step'));
 click(doc,name.includes('roads-schema')?'#next':'#task-tabs button:nth-child(2)');await tick();assert.equal(doc.querySelector('.pm-context-hint section').hidden,true);assert.equal(doc.querySelector('.pm-context-hint button').getAttribute('aria-expanded'),'false');
 assert.ok(shown(doc.querySelector(name.includes('tariffs')?'#graph':name.includes('land-plots')?'#plan':'#app svg')),'required problem diagram remains visible');
}finally{dom.window.close();}});
test('stoves clears explicit help and full answer on a new task',async()=>{const{dom,doc}=await open('practice-1-5-stoves.html');try{click(doc,'#hint-btn');click(doc,'#show-btn');assert.ok(doc.querySelector('#task-card').classList.contains('revealed'));click(doc,'#next-btn');await tick();assert.ok(!doc.querySelector('#task-card').classList.contains('hint-open'));assert.ok(!doc.querySelector('#task-card').classList.contains('revealed'));assert.equal(doc.querySelector('#hint-btn').getAttribute('aria-expanded'),'false');}finally{dom.window.close();}});
test('paper model is optional and closes for new numbers',async()=>{const{dom,doc}=await open('practice-1-5-paper-sheets.html');try{const model=doc.querySelector('#paper').closest('details');assert.equal(model.open,false);click(doc,'#hintBtn');assert.equal(model.open,true);click(doc,'#newBtn');await tick();assert.equal(model.open,false);assert.equal(doc.querySelector('#hintBtn').getAttribute('aria-expanded'),'false');}finally{dom.window.close();}});
test('percent help retains supported credit and resets aria state on next task',async()=>{const{dom,doc}=await open('percent-table-trainer.html');try{
 assert.equal(doc.querySelector('#view-practice').hidden,false);assert.equal(doc.querySelector('#hint-stack').children.length,0);click(doc,'#hint-btn');await tick();assert.equal(doc.querySelector('#hint-stack').children.length,1);assert.equal(doc.querySelector('#hint-btn').getAttribute('aria-expanded'),'true');
 click(doc,'#solution-btn');await tick();assert.match(doc.querySelector('#outcome-line').textContent,/разобран|решени/i);click(doc,'#next-task');await tick();assert.equal(doc.querySelector('#hint-stack').children.length,0);assert.equal(doc.querySelector('#hint-btn').getAttribute('aria-expanded'),'false');
}finally{dom.window.close();}});
for(const name of ['practice-1-5-entry-diagnostic-2026.html','practice-1-5-routes-checkpoint-2026.html'])test('assessment keeps explicit start, question navigation and private answers: '+name,async()=>{const{dom,doc}=await open(name);try{
 assert.equal(doc.querySelector('#intro').hidden,false);const diagnostic=name.includes('diagnostic');click(doc,diagnostic?'#start-btn':'#start');await tick();assert.ok(shown(doc.querySelector(diagnostic?'#question-text':'#question')));assert.ok(shown(doc.querySelector(diagnostic?'#question-visual':'#visual')));assert.equal(doc.querySelectorAll('.pm-context-hint').length,0);assert.ok(!shown(doc.querySelector(diagnostic?'#review-box':'#teacher-answer')));if(diagnostic){
  const total=doc.querySelectorAll('#stepper button').length;assert.equal(total,10);
  for(let number=1;number<=total;number++){assert.equal(doc.querySelector('#current-num').textContent,String(number));assert.equal(shown(doc.querySelector('#finish-btn')),number===total);assert.ok(!shown(doc.querySelector('#review-box')));assert.ok(shown(doc.querySelector('#question-text')));if(number<total){assert.ok(shown(doc.querySelector('#skip-btn')));click(doc,'#skip-btn');await tick();}}
 }else{click(doc,'#next');await tick();assert.ok(shown(doc.querySelector('#question')));}
 assert.ok(shown(doc.querySelector(diagnostic?'#finish-btn':'#finish')));click(doc,diagnostic?'#finish-btn':'#finish');await tick();assert.equal(doc.querySelector('#result').hidden,false);assert.ok(dom.window.localStorage.getItem('mathExamCourseProgress.v1'));
}finally{dom.window.close();}});
test('all twelve map routes and topic IDs remain available',async()=>{const{dom,doc}=await open('practice-1-5-map.html');try{const cards=[...doc.querySelectorAll('a[data-topic]')];assert.equal(cards.length,12);assert.equal(new Set(cards.map(x=>x.dataset.topic)).size,12);for(const card of cards){assert.ok(shown(card));assert.ok(fs.existsSync(path.join(dir,card.getAttribute('href'))));}}finally{dom.window.close();}});
test('inverse tariff percentages restore the original base, and month matching follows the question',async()=>{const{dom,doc}=await open('practice-1-5-tariffs.html');try{
 const host=doc.querySelector('#task-q'), mount=dom.window.PracticalMinimal.mountHint;
 for(const [word,sign,other] of [['выросла','+','−'],['снизилась','−','+']]){
  mount(host,'tariffs','percent','В 2019 году абонплата (350 ₽) '+word+' на 50% по сравнению с 2018 годом. Сколько рублей она составляла в 2018 году?');
  const panel=doc.querySelector('.pm-context-hint section');assert.equal(panel.hidden,true);click(doc,'.pm-context-hint button');
  assert.match(panel.textContent,/восстановить прежнюю плату/);assert.ok(panel.textContent.includes('1 '+sign+' p : 100'));assert.ok(!panel.textContent.includes('1 '+other+' p : 100'));assert.doesNotMatch(panel.textContent,/700|175|233/);assert.equal(doc.querySelector('#in').value,'');
 }
 mount(host,'tariffs','match','По графику определите, какие месяцы соответствуют указанному трафику.');assert.match(doc.querySelector('.pm-model').textContent,/Для каждого значения из таблицы/);assert.match(doc.querySelector('.pm-model').textContent,/порядке столбцов/);
 mount(host,'tariffs','switch','Укажите ежемесячную абонплату выбранного тарифа.');assert.match(doc.querySelector('.pm-model').textContent,/12 месячных/);assert.match(doc.querySelector('.pm-model').textContent,/В ответ запиши ежемесячную абонплату/);
}finally{dom.window.close();}});
test('land economics distinguishes paint purchase from heating payback',async()=>{const{dom,doc}=await open('practice-1-5-land-plots.html');try{
 const host=doc.querySelector('#task-q'),mount=dom.window.PracticalMinimal.mountHint;
 mount(host,'land','econ','Нужно покрасить забор. Краску можно купить в одном из двух магазинов.');const paint=doc.querySelector('.pm-model').textContent;
 assert.match(paint,/площадь забора на расход краски/);assert.match(paint,/количество банок вверх/);assert.match(paint,/прибавь доставку/);assert.doesNotMatch(paint,/период|промежутке времени|окупаемост/);
 mount(host,'land','econ','Через сколько часов экономия от газа компенсирует разницу покупки и установки?');const heat=doc.querySelector('.pm-model').textContent;assert.match(heat,/разницу начальных расходов на экономию за один час/);assert.doesNotMatch(heat,/банок|краск/);
}finally{dom.window.close();}});
test('percentage comparison model supports increases greater than 100 percent',async()=>{const{dom,doc}=await open('practice-1-5-land-plots.html');try{
 dom.window.PracticalMinimal.mountHint(doc.querySelector('#task-q'),'land','percent','На сколько процентов площадь огорода больше площади сарая?');click(doc,'.pm-context-hint button');const input=doc.querySelector('.pm-model input[type=range]');assert.ok(Number(input.max)>=400);input.value='400';input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));assert.match(doc.querySelector('.pm-model output').textContent,/400%/);assert.match(doc.querySelector('.pm-model').textContent,/разность площадей/);assert.equal(doc.querySelector('#in').value,'');
}finally{dom.window.close();}});
test('paper source data stays visible for every problem type without revealing ratios or areas',async()=>{const{dom,doc}=await open('practice-1-5-paper-sheets.html');try{
 const condition=doc.querySelector('.pm-paper-condition');assert.ok(shown(condition));assert.equal(condition.nextElementSibling,doc.querySelector('#taskCard'));assert.match(condition.textContent,/1 м²/);assert.match(condition.textContent,/1189 × 841 мм/);assert.match(condition.textContent,/пополам/);assert.match(condition.textContent,/подобны/);assert.doesNotMatch(condition.textContent,/√2|0,7|1,4/);
 for(const button of doc.querySelectorAll('#typeChips .step')){button.click();await tick();assert.ok(shown(condition));assert.ok(shown(doc.querySelector('#taskCard .task-q')));assert.equal(doc.querySelector('#paper').closest('details').open,false);assert.ok(!shown(doc.querySelector('#solution')));}
}finally{dom.window.close();}});

test('small-screen diagrams can be enlarged without cloning data or changing answers',async()=>{
 for(const [name,selector] of [['practice-1-5-roads-grid.html','#map'],['practice-1-5-apartments.html','#plan'],['practice-1-5-tariffs.html','#graph']]){
  const{dom,doc}=await open(name);try{const svg=doc.querySelector(selector),markup=svg.innerHTML,wrap=svg.closest('.pm-figure-scroll'),button=doc.querySelector('.pm-zoom-button');assert.ok(wrap);assert.equal(wrap.tabIndex,0);assert.equal(button.getAttribute('aria-pressed'),'false');button.click();assert.equal(button.getAttribute('aria-pressed'),'true');assert.ok(parseFloat(svg.style.width)>=600);assert.equal(svg.innerHTML,markup);assert.equal(doc.querySelectorAll(selector).length,1);assert.ok(shown(doc.querySelector('.pm-zoom-note')));button.click();assert.equal(button.getAttribute('aria-pressed'),'false');assert.equal(svg.style.width,'');assert.ok(!shown(doc.querySelector('.pm-zoom-note')));}finally{dom.window.close();}
 }
});
test('visible labels follow the actual practice mode and relocated stove data',async()=>{
 const apartment=await open('practice-1-5-apartments.html');try{assert.equal(apartment.doc.querySelector('#modeName').textContent,'тренировка');assert.ok(!shown(apartment.doc.querySelector('#bSol')));const teacher=apartment.doc.querySelector('[data-mode="teacher"]');teacher.click();await tick();assert.equal(apartment.doc.querySelector('#modeName').textContent,'учитель');}finally{apartment.dom.window.close();}
 const stoves=await open('practice-1-5-stoves.html');try{assert.match(stoves.doc.querySelector('.task-question').textContent,/карточках печей ниже/);}finally{stoves.dom.window.close();}
});

test('single-column road diagram stays in normal flow above task controls',async()=>{const{dom,doc}=await open('practice-1-5-roads-schema.html');try{const map=doc.querySelector('.mapwrap');assert.ok(map);assert.equal(dom.window.getComputedStyle(map).position,'static');click(doc,'.pm-context-hint button');await tick();assert.equal(dom.window.getComputedStyle(map).position,'static');assert.ok(shown(doc.querySelector('#next')));click(doc,'#next');await tick();assert.equal(dom.window.getComputedStyle(doc.querySelector('.mapwrap')).position,'static');}finally{dom.window.close();}});
