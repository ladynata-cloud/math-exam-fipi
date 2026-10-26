'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require('jsdom');
const dir=path.resolve(__dirname,'../../geometry-pogorelov/textbook');
const markup=fs.readFileSync(path.join(dir,'index.html'),'utf8').replace(/<script src="([^"]+)"><\/script>/g,(_,f)=>'<script>'+fs.readFileSync(path.join(dir,f),'utf8')+'</script>');
let failures=[];
function make(saved={},hash=''){
  const vc=new VirtualConsole();vc.on('jsdomError',e=>failures.push(e.message));
  return new JSDOM(markup,{url:'https://example.test/'+hash,runScripts:'dangerously',virtualConsole:vc,beforeParse(w){
    w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
    Object.entries(saved).forEach(([k,v])=>w.localStorage.setItem(k,v));
  }});
}
const dom=make(),w=dom.window,d=w.document,C=w.POGORELOV_COURSE,M=w.PogorelovCore;
const key=t=>'mathexam:pogorelov:2022:companion:v1:'+t.id;
const click=s=>{const el=d.querySelector(s);assert.ok(el,'missing '+s);el.click();};
const type=(s,v)=>{const el=d.querySelector(s);assert.ok(el,s);el.value=v;el.dispatchEvent(new w.Event('input',{bubbles:true}));};
const submit=s=>d.querySelector(s).dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
const nav=id=>{w.location.hash='#task/'+id;w.dispatchEvent(new w.HashChangeEvent('hashchange'));};
let journeys=0,steps=0;
for(const u of C.units)for(const t of u.tasks){
  nav(t.id);assert.ok(d.querySelector('.source').textContent.includes('§ '+u.id+' · № '+t.number));
  assert.ok(d.querySelector('#drawing svg'));assert.ok(!/NaN|Infinity|undefined/.test(d.querySelector('#drawing').innerHTML),t.id);
  if(t.answers){
    t.answers.forEach((a,i)=>type('#answer-'+i,String(a.value)));
    submit('#answer-form');assert.ok(d.querySelector('.badge')?.textContent.includes('без подсказок'),t.id+' independent');
    type('#answer-0','0');assert.ok(!d.querySelector('#final-answer .badge'));assert.equal(d.querySelector('#final-answer .feedback').textContent,'');
    type('#answer-0',String(t.answers[0].value));submit('#answer-form');
  }else{
    type('#proof-notes','Моё рассуждение <img src=x onerror=alert(1)>');click('#save-proof');
    assert.ok(d.querySelector('.manual .badge'));assert.equal(d.querySelectorAll('img').length,0);assert.ok(!d.querySelector('.manual').textContent.includes('правильный ответ'));
    type('#proof-notes','Уточнённое рассуждение');assert.ok(!d.querySelector('.manual .badge'));assert.equal(d.querySelector('.manual .feedback').textContent,'');click('#save-proof');
  }
  click('#guided');
  for(let i=0;i<t.steps.length;i++){
    const s=t.steps[i];
    assert.equal(d.querySelectorAll('.step.done').length,i,t.id+' retained steps');
    click('#hint');assert.ok(d.querySelector('.hint'));click('#hint');
    if(s.options)click('[data-choice="'+s.options.indexOf(s.value)+'"]');else{type('[data-step="'+i+'"]',String(s.value));submit('#step-form');}
    assert.equal(d.querySelectorAll('.step.done').length,i+1,t.id+' step accepted');steps++;
  }
  assert.ok(d.querySelector('.complete'),t.id+' guided complete');
  if(t.answers){submit('#answer-form');assert.ok(d.querySelector('#final-answer .badge').textContent.includes('с помощью'));}
  const p=JSON.parse(w.localStorage.getItem(key(t)));assert.equal(p.done,t.steps.length);assert.ok(p.assisted);
  const restored=M.restore(JSON.stringify(p),t);assert.equal(restored.done,t.steps.length);
  journeys++;
}
// A wrong choice never advances, and a revealed step always records assistance.
nav('p3-n2');
click('.skip');assert.equal(w.location.hash,'#task/p3-n2');assert.equal(d.activeElement.id,'main');
const fresh=make({},'#task/p3-n2'),fw=fresh.window,fd=fw.document;
fd.querySelector('#guided').click();
const wrong=[...fd.querySelectorAll('[data-choice]')].find(b=>b.textContent==='AO = OX');wrong.click();
assert.equal(fd.querySelectorAll('.step.done').length,0);assert.ok(fd.querySelector('.feedback').textContent.includes('Пока'));
fd.querySelector('#hint').click();fd.querySelector('#reveal').click();fd.querySelector('#advance-shown').click();
assert.equal(fd.querySelectorAll('.step.done').length,1);assert.ok(JSON.parse(fw.localStorage.getItem(key({id:'p3-n2'}))).assisted);
fresh.window.close();
// Preserve an unfinished expression through hint opening, view switches and reload.
const retain=make({},'#task/p7-n2-2'),rw=retain.window,rd=rw.document;
rd.querySelector('#answer-0').value='sqrt(';rd.querySelector('#answer-0').dispatchEvent(new rw.Event('input',{bubbles:true}));
rd.querySelector('#guided').click();rd.querySelector('#hint').click();rd.querySelector('#independent').click();assert.equal(rd.querySelector('#answer-0').value,'sqrt(');
const saved=Object.fromEntries(Array.from({length:rw.localStorage.length},(_,i)=>{const k=rw.localStorage.key(i);return [k,rw.localStorage.getItem(k)];}));
const reloaded=make(saved,'#task/p7-n2-2');assert.equal(reloaded.window.document.querySelector('#answer-0').value,'sqrt(');
assert.ok(JSON.parse(reloaded.window.localStorage.getItem(key({id:'p7-n2-2'}))).assisted);retain.window.close();reloaded.window.close();
// Exact paragraph/number search, not substring collisions with other pages.
w.location.hash='';w.dispatchEvent(new w.HashChangeEvent('hashchange'));type('#search','§ 3 № 2');assert.equal(d.querySelectorAll('.task-card').length,1);assert.ok(d.querySelector('.task-card').href.endsWith('p3-n2'));
type('#search','№ 7');assert.ok([...d.querySelectorAll('.task-card')].every(a=>/\bn7(?:-|$)/.test(a.href)));
// A corrupted saved record is retained, and other course keys are untouched.
const corruptKey=key({id:'p1-n7-1'}),broken=make({[corruptKey]:'{broken','older-course':'keep'},'#task/p1-n7-1');
assert.ok(broken.window.document.querySelector('.alert'));broken.window.document.querySelector('#guided').click();assert.equal(broken.window.localStorage.getItem(corruptKey),'{broken');assert.equal(broken.window.localStorage.getItem('older-course'),'keep');broken.window.close();
// Concurrent tab writes must never be silently overwritten.
nav('p1-n7-1');const before=w.localStorage.getItem(corruptKey);w.localStorage.setItem(corruptKey,'{"schema":1,"notes":"other tab"}');type('#answer-0','111');assert.notEqual(w.localStorage.getItem(corruptKey),before);assert.equal(JSON.parse(w.localStorage.getItem(corruptKey)).notes,'other tab');
assert.equal(failures.length,0,failures.join('\n'));dom.window.close();
console.log(`POGORELOV_RUNTIME_OK: ${journeys} full guided journeys, ${steps} steps, independent/manual checking, hint/input/reload retention, safe text, exact search, malformed and concurrent-storage guards.`);
