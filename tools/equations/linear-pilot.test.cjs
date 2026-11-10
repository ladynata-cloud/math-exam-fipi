'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'../..'),p=path.join(root,'equations/linear-pilot'),{create}=require(p+'/store.js');
const memory=()=>{const m=new Map();return {get length(){return m.size},key:i=>[...m.keys()][i],getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)};};
function world(storage=memory(),now=Date.now()) {const dom=new JSDOM(fs.readFileSync(p+'/index.html','utf8'),{runScripts:'outside-only',url:'https://mathexam.space/equations/linear-pilot/'}),w=dom.window;Object.defineProperty(w,'localStorage',{value:storage});w.Date.now=()=>now;w.HTMLElement.prototype.scrollIntoView=()=>{};for(const f of ['data.js','store.js','app.js'])w.eval(fs.readFileSync(p+'/'+f,'utf8'));return {w,d:w.document,dom,storage};}
function fill(x,selector,value){const el=x.d.querySelector(selector);el.value=value;el.dispatchEvent(new x.w.Event('input',{bubbles:true}));}
function click(x,action){x.d.querySelector(`[data-action="${action}"]`).click();}
function submit(x){x.d.querySelector('form').dispatchEvent(new x.w.Event('submit',{bubbles:true,cancelable:true}));}
function check(x,stage){for(let j=0;j<3;j++){fill(x,`#c${stage}a${j}`,String(x.w.LinearPilotData.forms[stage][j][2]));fill(x,`#c${stage}w${j}`,'Выполняю одинаковое действие с обеими частями.');}if(stage===0)for(let j=0;j<3;j++)fill(x,`#c0p${j}`,String(x.w.LinearPilotData.probes[j][1]));submit(x);}
function solve(x,wrong=false){const f=x.d.querySelector('form'),n=Number(f.dataset.task),stage=Number(x.d.querySelector('[aria-current="step"]').dataset.stage),t=x.w.LinearPilotTest.task(stage,n),k=`l${stage}t${n}`;const el=x.d.querySelector(`input[name="choice"][value="${t[3][0]}"]`);el.checked=true;el.dispatchEvent(new x.w.Event('input',{bubbles:true}));fill(x,'#'+k+'answer',String(t[4]+(wrong?1:0)));fill(x,'#'+k+'work','Прибавляю одно число к обеим частям: равенство сохранится.');submit(x);}
test('append-only events retain concurrent tab attempts and draft versions',()=>{const s=memory(),a=create(s,()=>100,()=> 'a'+Math.random()),b=create(s,()=>100,()=> 'b'+Math.random());a.append('draft',{key:'x',value:'first'});b.append('attempt',{stage:1,task:0,answer:'5',choice:0,work:'step',correct:true,feedback:''});a.append('draft',{key:'x',value:'second'});assert.equal(b.state().events.length,3);assert.equal(b.state().lessons[1].tasks[0].attempts.length,1);assert.equal(b.state().drafts.x,'second');});
test('storage denied retains downloadable state in memory',()=>{const s=create({get length(){throw Error()},setItem(){throw Error()}},()=>1,()=> 'id');s.append('draft',{key:'x',value:'kept'});assert.equal(s.state().drafts.x,'kept');assert(s.error());});
test('draft restore, incomplete submission, all four lessons, final and controlled five-day repeat',()=>{let x=world();fill(x,'#c0w0','Моя незавершённая запись');submit(x);assert(x.d.querySelector('form'));x=world(x.storage);assert.equal(x.d.querySelector('#c0w0').value,'Моя незавершённая запись');check(x,0);click(x,'go'); // nav entry; explicit next below
x.d.querySelector('[data-stage="1"]').click();for(let i=1;i<=4;i++){solve(x);click(x,'finish');}assert(x.d.querySelector('#c5a0'));check(x,5);x.d.querySelector('[data-stage="6"]').click();assert(!x.d.querySelector('form'));const at=create(x.storage).state().events.find(e=>e.type==='check'&&e.payload.stage===5).at;
x=world(x.storage,at+5*86400000);assert(x.d.querySelector('#c6a0'));check(x,6);assert.match(x.w.LinearPilotTest.report(),/Повтор/);x.d.querySelector('[data-stage="1"]').click();assert.match(x.d.querySelector('#screen').textContent,/Занятие пройдено/);});
test('help requires fresh example, first mistake and explanation stay in report',()=>{const x=world();check(x,0);x.d.querySelector('[data-stage="1"]').click();solve(x,true);solve(x,true);click(x,'solution');assert(!x.d.querySelector('[data-action="finish"]'));click(x,'new');solve(x);assert(x.d.querySelector('[data-action="finish"]'));assert.match(x.w.LinearPilotTest.report(),/Попытка 1: ошибка/);assert.match(x.w.LinearPilotTest.report(),/solution/);});
test('stale task submission is attributed to its displayed task',()=>{const s=memory(),x=world(s);check(x,0);x.d.querySelector('[data-stage="1"]').click();const y=world(s);solve(x);click(x,'new');solve(y);const st=create(s).state();assert.equal(st.lessons[1].tasks[0].attempts.length,1);assert.equal(st.lessons[1].tasks[1]?.attempts?.length||0,0);});
test('independent substitution checks fixed and generated equations, alternatives and transfer forms',()=>{const x=world();function evaluate(expr,v){const text=expr.replace(/−/g,'-').replace(/x/g,'('+v+')').replace(/(\d|\))\(/g,'$1*(');assert.match(text,/^[\d+*() .-]+$/);return Function('return ('+text+')')();}function balanced(eq,v){const [a,b]=eq.split('=');return evaluate(a,v)===evaluate(b,v);}
for(let i=1;i<=4;i++)for(let n=0;n<202;n++){const t=x.w.LinearPilotTest.task(i,n);if(i<4)assert(balanced(t[0],t[4]),t[0]);for(const j of t[3])if(t[2][j].includes('='))assert(balanced(t[2][j],t[4]),t[2][j]);}
for(const form of Object.values(x.w.LinearPilotData.forms)){assert(balanced(form[0][1],form[0][2]));assert(balanced(form[1][1].split('→')[0].trim(),form[1][2]));assert(balanced(form[2][3].split(',')[0],form[2][2]));}assert.equal(x.w.LinearPilotTest.number(''),null);assert.equal(x.w.LinearPilotTest.number('−2,5'),-2.5);});
test('transient write failure remains pending and is flushed on next action',()=>{const base=memory();let fail=true;const storage={get length(){return base.length},key:base.key,getItem:base.getItem,setItem:(k,v)=>{if(fail)throw Error();base.setItem(k,v);}},s=create(storage,()=>1,()=>String(Math.random()));s.append('check',{stage:5,answers:[1,2,3].map(()=>({answer:'?',work:'?'})),probes:[]});assert(s.error());fail=false;s.append('go',{stage:6});assert.equal(s.error(),'');assert(create(base).state().checks[5]);});
test('compact draft deltas restore long text and concurrent versions',()=>{const base=memory(),s=create(base,()=>1,()=>String(Math.random()));let text='';for(let i=0;i<1600;i++){text+='а';s.append('draft',{key:'w',value:text});}assert.equal(create(base).state().drafts.w,text);let bytes=0;for(let i=0;i<base.length;i++)bytes+=base.getItem(base.key(i)).length;assert(bytes<500000);s.append('draft',{key:'w',value:'новая запись'});assert.equal(create(base).state().drafts.w,'новая запись');});
test('unknown attempt opens help immediately; declaring external help after success prevents finish',()=>{const x=world();check(x,0);x.d.querySelector('[data-stage="1"]').click();fill(x,'#l1t0answer','?');fill(x,'#l1t0work','?');submit(x);assert(x.d.querySelector('[data-action="hint"]'));click(x,'hint');click(x,'new');solve(x);const external=x.d.querySelector('input[name="external"]');external.checked=true;external.dispatchEvent(new x.w.Event('input',{bubbles:true}));assert(!x.d.querySelector('[data-action="finish"]'));assert.match(x.w.LinearPilotTest.report(),/external/);});
test('help in stale displayed task attaches to that task after another tab advances',()=>{const base=memory(),x=world(base);check(x,0);x.d.querySelector('[data-stage="1"]').click();const y=world(base);solve(x);click(x,'new');fill(y,'#l1t0work','draft refreshes store');const gap=y.d.querySelector('[data-gap]');gap.addEventListener('click',e=>e.preventDefault());gap.dispatchEvent(new y.w.MouseEvent('click',{bubbles:true,cancelable:true}));const st=create(base).state();assert(st.lessons[1].tasks[0].help.includes('gap'));assert(!st.lessons[1].tasks[1]?.help.includes('gap'));});
test('solved display uses immutable choice, answer and work despite stale draft edits',()=>{const base=memory(),x=world(base);check(x,0);x.d.querySelector('[data-stage="1"]').click();solve(x);const s=create(base);s.append('draft',{key:'l1t0choice',value:'2'});s.append('draft',{key:'l1t0answer',value:'999'});s.append('draft',{key:'l1t0work',value:'changed'});const y=world(base);assert.equal(y.d.querySelector('input[name="choice"]:checked').value,'0');assert.equal(y.d.querySelector('#l1t0answer').value,'5');assert.notEqual(y.d.querySelector('#l1t0work').value,'changed');assert(y.d.querySelector('#l1t0answer').disabled);});
test('late help from stale tab invalidates qualification without deleting finished evidence',()=>{const x=world();check(x,0);x.d.querySelector('[data-stage="1"]').click();solve(x);click(x,'finish');assert(create(x.storage).state().lessons[1].done);create(x.storage).append('help',{stage:1,task:0,kind:'external'});const st=create(x.storage).state();assert.equal(st.lessons[1].done,false);assert(st.lessons[1].tasks[0].finished);const y=world(x.storage);assert.match(y.d.querySelector('#position').textContent,/Равенство/);assert(!y.d.querySelector('[data-action="finish"]'));assert(y.d.querySelector('[data-action="new"]'));});
test('malformed persisted payload cannot crash route and is not deleted',()=>{const s=memory();s.setItem('mathexam.linearPilot.events.v1.bad',JSON.stringify({id:'bad',at:1,type:'check',payload:{stage:0}}));const x=world(s);assert(x.d.querySelector('#c0w0'));assert.match(x.d.querySelector('#notice').textContent,/повреждённые/);assert(s.getItem('mathexam.linearPilot.events.v1.bad'));});
test('revisiting example after finishing does not erase valid prior completion',()=>{const x=world();check(x,0);x.d.querySelector('[data-stage="1"]').click();solve(x);click(x,'finish');create(x.storage).append('help',{stage:1,task:0,kind:'example'});assert(create(x.storage).state().lessons[1].done);});
test('opening example and immediately submitting before toggle registers help synchronously',()=>{const x=world();check(x,0);x.d.querySelector('[data-stage="1"]').click();x.d.querySelector('details[data-help="example"]').open=true;solve(x);assert(!x.d.querySelector('[data-action="finish"]'));assert(create(x.storage).state().lessons[1].tasks[0].help.includes('example'));});
test('finish checks open help even before queued toggle event',()=>{const x=world();check(x,0);x.d.querySelector('[data-stage="1"]').click();solve(x);x.d.querySelector('details[data-help="example"]').open=true;click(x,'finish');assert.equal(create(x.storage).state().lessons[1].done,false);assert(create(x.storage).state().lessons[1].tasks[0].help.includes('example'));});
test('navigation captures opened help before queued toggle',()=>{const x=world();check(x,0);x.d.querySelector('[data-stage="1"]').click();x.d.querySelector('details[data-help="example"]').open=true;x.d.querySelector('[data-stage="0"]').click();assert(create(x.storage).state().lessons[1].tasks[0].help.includes('example'));});

test('equality model follows actual conditions, saves first forecast and exact parameter',()=>{
  let x=world(); check(x,0); x.d.querySelector('[data-stage="1"]').click();
  const details=x.d.querySelector('details[data-help="model"]'); details.open=true;
  assert.match(details.textContent,/Для 4x − 7 = 13/);
  assert(x.d.querySelector('#model-controls').hidden);
  click(x,'prediction'); assert.equal(create(x.storage).state().lessons[1]?.tasks[0]?.prediction,undefined);
  fill(x,'#l1t0prediction','Корень 5; прибавление 7 его не меняет.'); click(x,'prediction');
  assert.equal(x.d.querySelector('#model-controls').hidden,false);
  fill(x,'#parameter-exact','5'); assert.match(x.d.querySelector('#model-value').textContent,/Части: 13 и 13/);
  assert.match(x.d.querySelector('#model-value').textContent,/После прибавления 7: 20 и 20/);
  create(x.storage).append('prediction',{stage:1,task:0,value:'поздний прогноз'});
  x=world(x.storage); assert.equal(x.d.querySelector('#parameter-exact').value,'5');
  assert.equal(x.d.querySelector('#l1t0prediction').value,'Корень 5; прибавление 7 его не меняет.');
  assert.match(x.w.LinearPilotTest.report(),/Первая догадка о модели: Корень 5/);
  click(x,'new'); const next=x.d.querySelector('details[data-help="model"]'); next.open=true;
  assert.match(next.textContent,/Для 5x \+ 8 = 38/);
  fill(x,'#l1t1prediction','?'); click(x,'prediction'); fill(x,'#parameter-exact','6');
  assert.match(x.d.querySelector('#model-value').textContent,/Части: 38 и 38/);
  assert.match(x.d.querySelector('#model-value').textContent,/После вычитания 8: 30 и 30/);
});

test('every equality-model parameter set agrees with displayed equation and preserves the difference',()=>{
  const x=world();
  assert.equal(x.w.LinearPilotTest.number('9'.repeat(400)),null);
  function evalAt(expr,v){const text=expr.replace(/−/g,'-').replace(/x/g,'('+v+')').replace(/(\d|\))\(/g,'$1*(');return Function('return ('+text+')')();}
  for(let n=0;n<202;n++){
    const t=x.w.LinearPilotTest.task(1,n),m=t[7],sides=t[0].split('=');
    for(const v of [-2,0,0.5,t[4],t[4]+1]){
      assert.equal(m.a*v+m.b,evalAt(sides[0],v)); assert.equal(m.c,evalAt(sides[1],v));
      assert.equal(m.a*v+m.b-m.c,m.a*v-(m.c-m.b));
    }
  }
});
