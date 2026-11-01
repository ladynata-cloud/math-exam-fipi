'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const {unit}=require('../ege-profil/start/task-first.js');
const start=path.resolve(__dirname,'../ege-profil/start');
const html=fs.readFileSync(path.join(start,'index.html'),'utf8');
const scripts=[...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m=>fs.readFileSync(path.resolve(start,m[1].split(/[?#]/)[0]),'utf8'));
const geometry=[...require('../ege-profil/start/geometry-data.js'),...require('../ege-profil/start/stereo-data.js')];
const KEY='mathexam.profileStart2027.v1';
function page(hash,initial){
  const dom=new JSDOM(html,{url:'https://mathexam.space/ege-profil/start/index.html'+hash,runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
  if(initial)w.localStorage.setItem(KEY,JSON.stringify(initial));
  for(const script of scripts)w.eval(script);
  return dom;
}
function saved(w,id){return JSON.parse(w.localStorage.getItem(KEY)).sessions[id+':independent'];}
function retained(s){return JSON.stringify({taskId:s.taskId,step:s.step,draft:s.draft,answers:s.answers,wrong:s.wrong,done:s.done,started:s.started});}

test('All geometry lessons keep the drawing before requested help, with draft and model identity intact',()=>{
  assert.equal(geometry.length,18);
  for(const l of geometry){
    const dom=page('#practice/'+l.id+'/independent'),w=dom.window,d=w.document;
    try{
      const model=d.getElementById('task-model'),hint=d.getElementById('hint'),help=d.getElementById('hint-box'),input=d.getElementById('answer');
      assert(model?.querySelector('svg'),l.id+': current diagram exists');
      assert.equal(help.hidden,true,l.id+': reference hidden initially');
      assert(model.compareDocumentPosition(hint)&w.Node.DOCUMENT_POSITION_FOLLOWING,l.id+': diagram before help');
      assert(!/NaN|Infinity/.test(model.querySelector('svg').outerHTML),l.id+': finite diagram');
      input.value='31/7';input.dispatchEvent(new w.Event('input',{bubbles:true}));
      const before=retained(saved(w,l.id)),drawing=model.querySelector('svg');
      hint.click();assert.equal(help.hidden,false);assert.equal(saved(w,l.id).assisted,true);
      help.querySelector('.task-foundation>summary').click();
      assert.equal(help.querySelector('.task-foundation').open,true);
      hint.click();assert.equal(help.hidden,true);
      assert.equal(d.getElementById('task-model'),model);assert.equal(model.querySelector('svg'),drawing);
      assert.equal(d.getElementById('answer'),input);assert.equal(input.value,'31/7');
      assert.equal(retained(saved(w,l.id)),before,l.id+': no lost work');
      hint.click();assert.equal(help.querySelector('.task-foundation').open,true,l.id+': requested section remains open');
    }finally{w.close();}
  }
});

test('Catalogue guidance and lesson references start closed, construction stays interactive when requested',()=>{
  for(const number of [1,2,3]){
    const dom=page('#calm/'+number),d=dom.window.document;
    try{
      assert.equal(d.querySelector('.calm-start-help').open,false);
      assert.equal(d.querySelector('.calm-number-foundations').open,false);
      assert(d.querySelector('[data-exam-start="'+number+'"]'));
    }finally{dom.window.close();}
  }
  const dom=page('#lesson/geo-quadrilaterals'),w=dom.window,d=w.document;
  try{
    assert.equal(d.querySelector('details.theory').open,false);
    const lab=d.querySelector('#explore-lab');assert.equal(lab.open,false);lab.querySelector('summary').click();
    const input=d.querySelector('[name="prof-construction-height"]'),select=d.querySelector('#lab select');
    input.value='5.75';input.dispatchEvent(new w.Event('input',{bubbles:true}));
    select.value='diagonal';select.dispatchEvent(new w.Event('change',{bubbles:true}));
    const button=[...d.querySelectorAll('#lab button')].find(n=>n.textContent==='Провести диагональ');
    button.click();assert.equal(button.getAttribute('aria-pressed'),'true');
    const diagram=d.querySelector('#lab svg').innerHTML;
    lab.querySelector('summary').click();lab.querySelector('summary').click();
    assert.equal(input.value,'5.75');assert.equal(select.value,'diagonal');
    assert.equal(d.querySelector('#lab svg').innerHTML,diagram);assert.equal(button.getAttribute('aria-pressed'),'true');
  }finally{w.close();}
});

test('Final applied units reuse authored targets without assigning final units to intermediate calculations',()=>{
  const tasks=require('../ege-profil/start/applied-data.js').flatMap(l=>l.tasks);
  assert.equal(tasks.length,48);
  for(const t of tasks){
    const expected=t.diagram.target.split(',').at(-1).trim();
    assert.equal(unit(t),expected,t.id);
    for(const step of t.steps)assert.equal(unit(step),step.unit||'',t.id+': do not infer a step unit from the final result');
  }
  assert.equal(unit({id:'applied-test',unit:'тыс. руб.',diagram:{target:'Сумма, руб.'}}),'тыс. руб.');
  assert.equal(unit({id:'unrelated',diagram:{target:'Сумма, руб.'}}),'');
  assert.equal(unit({id:'applied-test',diagram:{target:'Некоторая величина'}}),'');
});

test('A recovered theme is labelled separately and never counted as two new independent successes',()=>{
  const l=geometry.find(l=>l.id==='geo-right'),ids=l.tasks.slice(-3).map(t=>t.id);
  const initial={version:1,records:{[l.id]:{guided:[],independent:[],recovered:ids.slice(0,2),attempts:3}},sessions:{},seen:Object.fromEntries(ids.map(id=>[id,1]))};
  const dom=page('#calm',initial),d=dom.window.document;
  try{
    const card=d.querySelector('[data-calm-exam="1"]');
    assert.match(card.textContent,/0 из 6 тем: два новых самостоятельных условия/);
    assert.match(card.textContent,/Закреплено на знакомых задачах: 1/);
    assert.equal(card.querySelector('[data-exam-start]').textContent,'Повторить без подсказок');
  }finally{dom.window.close();}
});
