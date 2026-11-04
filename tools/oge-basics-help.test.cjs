'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const {JSDOM}=require('jsdom');
const H=require('../trainers/oge-basics/basics-help.js');

function mount(t, contentId='percentages/percent-of-number-and-whole'){
  const dom=new JSDOM('<main><p id="task">Найди 30% от 90.</p><input id="parent" value="27"><div id="host"></div></main>',{url:'https://example.test/'});
  t.after(()=>dom.window.close());
  const d=dom.window.document, use=[];
  const original=d.getElementById('parent'),root=d.createElement('div');root.innerHTML='<p>30% — это три раза по 10%.</p>';
  const options={host:d.getElementById('host'),identity:'task-1:step-0',contentId,rootContent:root,onUse:()=>use.push('hint')};
  const h=H.create();h.update(options);
  return {d,h,use,options,original,root};
}
function click(f,selector){const b=f.d.querySelector('.bh-frame:not([hidden]) '+selector)||f.d.querySelector(selector);assert(b,selector);b.click();return b;}
function answer(f){return f.d.querySelector('.bh-frame:not([hidden]) .bh-answer');}
function child(f,id){click(f,'[data-bh-skill="'+id+'"]');assert.equal(f.h.getState().nodeId,id);}

test('six genuine prerequisite levels retain drafts, accepted actions, parent condition and original input',t=>{
  const f=mount(t),chain=['percent-part','divide','quotient','multiply','add','count'],inputs=[];
  assert.equal(f.h.isOpen(),false);assert.equal(f.d.querySelector('.bh-panel').hidden,true);f.h.open();
  for(const [i,id]of chain.entries()){child(f,id);const input=answer(f);input.value=String(100+i);inputs.push(input);}
  assert.equal(f.h.getState().depth,6);
  assert.equal(f.d.getElementById('parent'),f.original);assert.equal(f.original.value,'27');assert.equal(f.d.getElementById('task').textContent,'Найди 30% от 90.');
  click(f,'.bh-dot');assert.equal(f.d.querySelector('.bh-dot').getAttribute('aria-pressed'),'true');
  f.h.close();f.h.open();assert.equal(answer(f),inputs[5]);assert.equal(answer(f).value,'105');assert.equal(f.d.querySelector('.bh-dot').getAttribute('aria-pressed'),'true');
  for(let i=chain.length-2;i>=0;i--){click(f,'.bh-back');assert.equal(answer(f),inputs[i]);assert.equal(answer(f).value,String(100+i));}
  child(f,'divide');assert.equal(answer(f),inputs[1]);click(f,'.bh-model-action');
  const model=f.d.querySelector('.bh-frame:not([hidden]) .bh-model');assert.match(model.textContent,/Осталось разложить: 9/);
  click(f,'.bh-back');child(f,'divide');assert.equal(f.d.querySelector('.bh-frame:not([hidden]) .bh-model'),model);
  click(f,'.bh-root');assert.equal(f.h.getState().depth,0);assert.equal(f.original.value,'27');assert.equal(f.root.isConnected,true);
});

test('same-question renderer reattachment preserves children, but a new task resets the help stack',t=>{
  const f=mount(t);f.h.open();child(f,'percent-part');child(f,'divide');const input=answer(f);input.value='wrong draft';
  const fresh=f.d.createElement('div');fresh.textContent='Обновлённая подсказка к тому же действию.';
  const host=f.d.createElement('div');f.options.host.replaceWith(host);
  f.h.update({...f.options,host,rootContent:fresh});assert.equal(f.h.isOpen(),true);assert.equal(answer(f),input);assert.equal(input.value,'wrong draft');assert.equal(fresh.isConnected,true);
  f.h.update({...f.options,host,identity:'task-2:step-0',rootContent:f.root});assert.equal(f.h.isOpen(),false);assert.equal(f.h.getState().depth,0);assert.equal(input.isConnected,false);f.h.open();child(f,'percent-part');assert.equal(answer(f).value,'');
});

test('disclosure marks assistance before revealing anything; child checks never touch parent progress',t=>{
  const f=mount(t);let duringCallback=true;
  f.h.update({...f.options,onUse:()=>{duringCallback=f.d.querySelector('.bh-panel').hidden;f.use.push('hint');}});
  f.h.open();assert.equal(duringCallback,true);assert.equal(f.use.length,1);f.h.open();assert.equal(f.use.length,1);
  child(f,'percent-part');answer(f).value='999';click(f,'.bh-check');assert.match(f.d.querySelector('.bh-frame:not([hidden]) .bh-feedback').textContent,/Пока не совпало/);answer(f).value='20';click(f,'.bh-check');
  assert.equal(f.d.querySelector('.bh-frame:not([hidden])').dataset.bhSolved,'true');assert.equal(answer(f).readOnly,true);assert.equal(f.h.getState().nodeId,'percent-part');assert.equal(f.use.length,1);assert.equal(f.original.value,'27');assert.equal(f.d.defaultView.localStorage.length,0);
  f.h.close();f.h.open();assert.equal(f.use.length,2);assert.equal(f.h.getState().nodeId,'percent-part');
});

test('read-only mode cannot reveal help, operate child models or emit a help event',t=>{
  const f=mount(t);f.h.update({...f.options,disabled:true});assert.equal(f.h.open(),false);click(f,'.bh-toggle');assert.equal(f.use.length,0);assert.equal(f.h.isOpen(),false);
  f.h.update(f.options);f.h.open();child(f,'percent-part');child(f,'divide');const model=f.d.querySelector('.bh-frame:not([hidden]) .bh-model');
  f.h.update({...f.options,disabled:true});assert.equal(f.h.isOpen(),false);const before=model.textContent;model.querySelector('button').click();assert.equal(model.textContent,before);assert.equal(f.d.querySelector('.bh-toggle').disabled,true);
  for(const c of f.d.querySelectorAll('.bh-panel button,.bh-panel input'))assert.equal(c.disabled,true);
  f.h.update(f.options);f.h.open();model.querySelector('button').click();assert.match(model.textContent,/Осталось разложить: 9/);
});

test('curriculum is finite and acyclic and the quoted mathematical answers independently agree',()=>{
  const expected={'percent-meaning':25,'percent-part':80/4,'percent-change':50*20/100,proportion:240/3,'fraction-parts':3/4,'fraction-equivalent':4/2,'fraction-add':1/4+2/4,decimal:3/10,'decimal-add':3/10+2/10,rounding:Math.round(2.7),'decimal-shift':0.6*10,negative:-2+3,units:3*100,'area-units':3*3,order:3+4*2,'first-part':String(42).length,compare:6-4,bring:1*10+2,divide:12/3,quotient:Math.floor(29/6),'write-digit':26%10,'in-mind':Math.floor(26/10),multiply:4*3,subtract:12-5,add:7+5,count:8};
  assert.deepEqual(Object.keys(H.curriculum).sort(),Object.keys(expected).sort());
  for(const [id,value]of Object.entries(expected)){assert(H.accepts(id,String(value)),id);assert(!H.accepts(id,String(value+1)),id);for(const bad of ['',' ','Infinity','NaN','1/0','2foo','<script>','1e2','--1'])assert(!H.accepts(id,bad),id+':'+bad);}
  const visit=(id,trail=[])=>{assert(H.curriculum[id],id);assert(!trail.includes(id),trail.join(' -> '));for(const child of H.curriculum[id].children)visit(child,[...trail,id]);};Object.keys(H.curriculum).forEach(id=>visit(id));
  assert(H.accepts('fraction-parts','3/4'));assert(H.accepts('fraction-parts','6/8'));assert(H.accepts('decimal-add','0,5'));
});

test('content and actual step choose relevant prerequisites; unknown topics get a valid fallback',()=>{
  const cases=[['percentages/percent-of-number-and-whole','percent-part'],['percentages/proportion','proportion'],['fraction-common-denominator','fraction-equivalent'],['fraction-addition','fraction-add'],['decimal-add-subtract','decimal-add'],['decimal-place','decimal'],['decimal-place-value','decimal'],['decimal-multiply','multiply'],['decimal-division-natural','divide'],['decimal-divide','divide'],['units-area','area-units'],['negative-number-line','negative'],['rounding','rounding'],['multiplication-division/course-column-two-digit','multiply'],['multiplication-division/course-first-part','first-part']];
  for(const [id,skill]of cases)assert.equal(H.skillFor(id),skill);
  for(const [kind,skill]of Object.entries({digit:'quotient',product:'multiply',multiply:'multiply',add:'add',subtract:'subtract',bring:'bring',partial:'bring',start:'first-part','shift-count':'decimal-shift','shift-factor':'decimal-shift','shift-divisor':'decimal-shift','shift-dividend':'decimal-shift','remainder-check':'compare',comma:'decimal'}))assert.equal(H.skillFor('multiplication-division/course-decimal-divisor',{kind}),skill);
  assert(H.curriculum[H.skillFor('unknown')]);
});

test('column multiplication metadata chooses writing, in-mind, addition or multiplication before the shared digit kind',t=>{
  const id='multiplication-division/course-column-two-digit';
  for(const [event,phase,skill]of [['calculate','multiply','multiply'],['calculate','add','add'],['calculate','sum','add'],['add-carry','multiply','add'],['write','multiply','write-digit'],['write','add','write-digit'],['carry','multiply','in-mind'],['carry','add','in-mind']]){
    assert.equal(H.skillFor(id,{kind:'digit',question:{kind:'digit',multiplication:{event,phase}}}),skill,event+'/'+phase);
  }
  assert.equal(H.skillFor(id,{kind:'digit'}),'write-digit');
  assert.equal(H.skillFor('multiplication-division/course-digit-choice',{kind:'digit'}),'quotient');
  const f=mount(t,id);f.h.update({...f.options,context:{kind:'digit',question:{multiplication:{event:'write',phase:'multiply'}}}});f.h.open();child(f,'write-digit');
  answer(f).value='6';answer(f).dispatchEvent(new f.d.defaultView.Event('input',{bubbles:true}));
  assert.equal(f.d.querySelector('[data-bh-write-slot]').textContent,'6','chosen digit is written immediately, before checking');
  assert.equal(f.d.querySelector('.bh-frame:not([hidden])').dataset.bhSolved,undefined);
  click(f,'.bh-check');assert.equal(answer(f).readOnly,true);
});

test('fractions use a visible bar; keyboard checking and destroyed handles behave predictably',t=>{
  const f=mount(t,'fraction-meaning');f.h.open();child(f,'fraction-parts');assert(f.d.querySelector('.bh-frame:not([hidden]) .bh-fraction>span'));
  answer(f).value='3/4';answer(f).dispatchEvent(new f.d.defaultView.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));assert.equal(answer(f).readOnly,true);
  f.h.destroy();assert.equal(f.d.querySelector('.bh-help'),null);assert.equal(f.h.open(),false);assert.throws(()=>f.h.update(f.options),/destroyed/);
});
