'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
const {corrections,restoreHistoricalBytes}=require('./oge-book-exam-corrections.cjs');
const root=path.resolve(__dirname,'..');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
for(const [file,rule]of Object.entries(corrections)){
 test(file+': exact inverse preserves the reviewed historical bytes',()=>{
  const current=fs.readFileSync(path.join(root,file),'utf8');
  assert.equal(sha(restoreHistoricalBytes(file,current)),rule.historicalSha256);
 });
 test(file+': negative controls reject changed adapter fragments and extra engine code',()=>{
  const current=fs.readFileSync(path.join(root,file),'utf8');
  for(const fragment of rule.fragments){
   const changed=fragment.after.slice(0,1)+'/* unreviewed */'+fragment.after.slice(1);
   assert.throws(()=>restoreHistoricalBytes(file,current.replace(fragment.after,changed)),/approved persistence fragment/);
  }
  assert.notEqual(sha(restoreHistoricalBytes(file,current.replace('</script>','\nvoid "unreviewed engine change";\n</script>'))),rule.historicalSha256);
 });
}
const files={6:'oge-task6-fractions.html',20:'oge-task20-equations.html',22:'oge-task22-functions-graphs.html'};
const keys={6:'mathExam.oge6.practice.v1',20:'mathExam.oge20.practice.v1',22:'mathExam.oge22.practice.v1'};
class Local extends ResourceLoader{fetch(url){const file=path.join(root,new URL(url).pathname);return file.startsWith(root+path.sep)&&fs.existsSync(file)?Promise.resolve(fs.readFileSync(file)):null;}}
async function boot(n,{saved,blocked=false}={}){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/Not implemented/.test(e.message))errors.push(e.message);});
 const dom=new JSDOM(fs.readFileSync(path.join(root,'trainers',files[n]),'utf8'),{url:'https://mathexam.test/trainers/'+files[n],runScripts:'dangerously',resources:new Local(),virtualConsole:vc,pretendToBeVisual:true,beforeParse(w){
  w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
  let state=91673;w.Math.random=()=>{state=(1664525*state+1013904223)>>>0;return state/4294967296;};
  // Malformed fixtures and a prior real UI-produced result exercise recovery.
  // No current exercise, checker or result counters are replaced during a test.
  if(saved!==undefined)w.localStorage.setItem(keys[n],saved);
  if(blocked)Object.defineProperty(w,'localStorage',{get(){throw Error('storage denied');}});
 }});
 await new Promise(resolve=>dom.window.addEventListener('load',resolve,{once:true}));
 await new Promise(resolve=>setTimeout(resolve,35));
 return {w:dom.window,d:dom.window.document,errors,close:()=>dom.window.close()};
}
const button=(host,label)=>{const found=[...host.querySelectorAll('button')].find(b=>b.textContent.trim()===label);assert(found,'Missing UI button '+label);return found;};
const nums=s=>(s.replace(/−/g,'-').match(/-?\d+(?:[,.]\d+)?/g)||[]).map(x=>Number(x.replace(',','.')));
function visibleOutcome(t,n){
 if(n===6)return t.d.getElementById('counter').textContent.replace(/\s+/g,' ').trim();
 if(n===20)return t.d.querySelector('#body .solved').textContent.replace(/\s+/g,' ').trim();
 return t.d.querySelector('.panel:not(.hidden) .mode-host[data-mode="marathon"] .score').textContent.replace(/\s+/g,' ').trim();
}
function solve(t,n){
 if(n===6){t.d.getElementById('ans').value='-31/50';t.d.getElementById('check').click();assert.match(t.d.getElementById('mark').textContent,/Верно/);return t.d.getElementById('check');}
 if(n===20){
  const host=t.d.querySelector('#body .qbox'),prompt=host.querySelector('.prompt');
  const c=nums(prompt.querySelector('b').textContent).at(-1),r=nums(prompt.querySelector('.frac .n,.frac>span:first-child').textContent).at(-1),k=Number(prompt.textContent.replace(/\s+/g,' ').split('=').at(-1));
  host.querySelector('.numin').value=String(r*(1-k)+c);const check=host.querySelector(':scope > .btns button');check.click();assert.match(host.querySelector(':scope > .fb').textContent,/Верно/);return check;
 }
 const host=t.d.querySelector('.panel:not(.hidden) .mode-host[data-mode="marathon"]');
 // Read-only source oracle here isolates persistence; independent mathematics
 // is documented separately from this boundary regression.
 for(const atom of host.__problem.atoms){
  button(host,atom.type==='point'?'+ отдельное значение':'+ промежуток').click();
  const row=[...host.querySelectorAll('.ab-row')].at(-1),values=atom.type==='point'?[atom.v]:[atom.lo,atom.hi];
  values.forEach((v,i)=>{if(Number(v.d)===1)row.querySelectorAll('.v-dec')[i].value=String(v.n);else{row.querySelectorAll('.v-tog')[i].click();row.querySelectorAll('.v-num')[i].value=String(v.n);row.querySelectorAll('.v-den')[i].value=String(v.d);}});
  if(atom.type==='interval'){row.querySelectorAll('select')[0].value=atom.loCl?'[':'(';row.querySelectorAll('select')[1].value=atom.hiCl?']':')';}
 }
 const check=host.querySelector('.btn-check');check.click();assert(check.disabled);assert.match(host.querySelector(':scope > .fb').textContent,/Верно|совпадает|правильно/i);return check;
}
for(const n of [6,20,22]){
 test(n+': UI result survives reload; repeat check does not award duplicate credit',async()=>{
  let t=await boot(n);let saved;
  try{
   const check=solve(t,n);saved=t.w.localStorage.getItem(keys[n]);assert(saved);
   if(n!==6){check.click();check.dispatchEvent(new t.w.Event('click',{bubbles:true}));assert.equal(t.w.localStorage.getItem(keys[n]),saved);}
   else{const before=JSON.parse(saved);assert.equal(Object.values(before.records).filter(r=>r.status==='solved-first').length,1);check.click();const jump=t.d.getElementById('taskJump');jump.value='0';jump.dispatchEvent(new t.w.Event('change'));const revisited=JSON.parse(t.w.localStorage.getItem(keys[n]));assert.equal(revisited.streak,before.streak);assert.deepEqual(revisited.records,before.records);saved=t.w.localStorage.getItem(keys[n]);}
   assert.deepEqual(t.errors,[]);
  }finally{t.close();}
  t=await boot(n,{saved});try{assert.deepEqual(JSON.parse(t.w.localStorage.getItem(keys[n])),JSON.parse(saved));assert.deepEqual(t.errors,[]);}finally{t.close();}
 });
 for(const fixture of ['{broken','null','[]','{"v":1,"cat":"bank","order":[0,0],"pos":-1,"records":{},"streak":-7}','{"A":{"solved":-5,"streak":"bad"},"piecewise":{"solved":-2,"tries":null}}']){
  test(n+': malformed saved data recovers and the earned result survives reload ('+fixture+')',async()=>{
   let t=await boot(n,{saved:fixture}),saved,outcome;
   try{
    solve(t,n);assert.deepEqual(t.errors,[]);saved=t.w.localStorage.getItem(keys[n]);
    const recovered=JSON.parse(saved);assert(recovered&&typeof recovered==='object'&&!Array.isArray(recovered));
    outcome=visibleOutcome(t,n);assert.match(outcome,n===6?/самостоятельно 1/:n===20?/решено 1/:/Решено: 1/);
   }finally{t.close();}
   t=await boot(n,{saved});try{
    assert.deepEqual(JSON.parse(t.w.localStorage.getItem(keys[n])),JSON.parse(saved));
    assert.equal(visibleOutcome(t,n),outcome,'The earned result, not just a nonempty key, must survive reload');
    assert.deepEqual(t.errors,[]);
   }finally{t.close();}
  });
 }
 test(n+': unavailable browser storage keeps the trainer usable',async()=>{const t=await boot(n,{blocked:true});try{solve(t,n);assert.deepEqual(t.errors,[]);}finally{t.close();}});
}
test('6: previous navigation is saved before reload without changing the earned result',async()=>{
 let t=await boot(6),saved,prompt,info;
 try{
  solve(t,6);t.d.getElementById('check').click();
  assert.match(t.d.getElementById('taskInfo').textContent,/Задача 2 из 81/);
  t.d.getElementById('previous').click();
  info=t.d.getElementById('taskInfo').textContent;assert.match(info,/Задача 1 из 81/);
  prompt=t.d.querySelector('#card > .expr').innerHTML;
  saved=t.w.localStorage.getItem(keys[6]);assert.equal(JSON.parse(saved).pos,0,'Previous must save the new position before reload');
  assert.match(visibleOutcome(t,6),/самостоятельно 1/);
 }finally{t.close();}
 t=await boot(6,{saved});try{
  assert.equal(t.d.getElementById('taskInfo').textContent,info);
  assert.equal(t.d.querySelector('#card > .expr').innerHTML,prompt);
  assert.match(visibleOutcome(t,6),/самостоятельно 1/);
  assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});
