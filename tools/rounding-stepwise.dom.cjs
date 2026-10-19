'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),test=require('node:test');
const {JSDOM,VirtualConsole}=require('jsdom');
const html=fs.readFileSync(path.resolve(__dirname,'../trainers/rounding-stepwise.html'),'utf8');
const KEY='mathExamCourseProgress.v1';
function mount(t,{query='',storage,blocked=false,constantRandom=false}={}){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',error=>errors.push(error));
 const dom=new JSDOM(html,{url:'https://example.test/trainers/rounding-stepwise.html'+query,runScripts:'outside-only',virtualConsole:vc}),w=dom.window,d=w.document;
 let random=1729;w.Math.random=constantRandom?()=>0.5:()=>{random=(Math.imul(random,1664525)+1013904223)>>>0;return random/4294967296;};
 if(storage!==undefined)w.localStorage.setItem(KEY,storage);
 if(blocked)w.Storage.prototype.setItem=function(){throw new w.DOMException('Full','QuotaExceededError')};
 for(const script of d.scripts)if(!script.src&&script.textContent.trim())w.eval(script.textContent);
 assert.deepEqual(errors,[]);t.after(()=>w.close());return {w,d,errors};
}
function exact(display,p){
 const [whole,fraction='']=display.replace(',','.').split('.'),raw=BigInt(whole+fraction),cut=fraction.length+p;
 const base=10n**BigInt(Math.abs(cut)),rounded=cut>0?(raw+base/2n)/base:raw*base;
 if(p>=0)return String(rounded*10n**BigInt(p));
 const digits=String(rounded).padStart(1-p,'0');return digits.slice(0,p)+','+digits.slice(p);
}
function select(f,p){f.d.querySelector('#place').value=String(p);f.d.querySelector('#place').dispatchEvent(new f.w.Event('change'))}
function toAnswer(f){
 const text=f.d.querySelector('#prompt').textContent,display=text.match(/число ([\d,]+)/)[1],p=f.w.task.p;
 const comma=display.includes(',')?display.indexOf(','):display.length,target=comma-1-p+(p<0?1:0),look=target+1+(display[target+1]===','?1:0);
 f.d.querySelector('.digit[data-i="'+target+'"]').click();f.d.querySelector('.digit[data-i="'+look+'"]').click();
 f.d.querySelector(Number(display[look])>=5?'#up':'#keep').click();
 assert.equal(f.w.step,'answer');return {display,p,answer:exact(display,p)};
}
function submit(f,value){f.d.querySelector('#ans').value=value;f.d.querySelector('#check').click()}

test('exact rounding handles halfway decimals, zero and carry chains',t=>{
 const f=mount(t);
 for(const [display,p,expected] of [['1,005',-2,'1,01'],['1,015',-2,'1,02'],['9,995',-2,'10,00'],['12,450',-1,'12,5'],['0,004',-2,'0,00'],['99,5',0,'100'],['995',1,'1000'],['995',2,'1000'],['9999999',6,'10000000'],['1000000',6,'1000000']])assert.equal(f.w.roundText(display,p),expected);
 for(let n=1000;n<100000;n++){const display=String(Math.floor(n/1000))+','+String(n%1000).padStart(3,'0');for(const p of [-2,-1,0])assert.equal(f.w.roundText(display,p),exact(display,p),display+' at '+p)}
});

test('all selected places generate correct, varied unlimited attempts without adjacent repeats',t=>{
 const f=mount(t,{query:'?place=1&from=division'});assert.equal(f.d.querySelector('#place').value,'1');
 for(const level of ['easy','med']){f.d.querySelector('#'+level).click();for(const p of [1,2,3,4,5,6,0,-1,-2]){
  select(f,p);const seen=new Set();let previous='';
  for(let i=0;i<150;i++){const q=f.w.task;assert.equal(q.p,p);assert.equal(q.ansText,exact(q.display,p));assert.notEqual(q.display,previous);assert(q.ti>=0&&q.li>q.ti);seen.add(q.display);previous=q.display;f.d.querySelector('#next').click()}
  assert(seen.size>35,'Varied conditions for '+level+' '+p);
 }}
 select(f,'mixed');const mixed=new Set();for(let i=0;i<80;i++){mixed.add(f.w.task.p);f.d.querySelector('#next').click()}assert.deepEqual([...mixed].sort((a,b)=>a-b),[-2,-1,0,1,2]);
 assert.deepEqual(f.errors,[]);
});

test('a constant random source still cannot repeat the adjacent condition',t=>{
 const f=mount(t,{constantRandom:true});for(const p of [1,2,3,4,5,6,0,-1,-2]){select(f,p);let previous=f.w.task.display;for(let i=0;i<12;i++){f.d.querySelector('#next').click();assert.notEqual(f.w.task.display,previous);assert.equal(f.w.task.ansText,exact(f.w.task.display,p));previous=f.w.task.display}}
});

test('four click steps remain, wrong final answer can be corrected without revealing it',t=>{
 const f=mount(t),q=toAnswer(f),prompt=f.d.querySelector('#prompt').textContent;
 submit(f,String(Number(q.answer.replace(',','.'))+1));assert.equal(f.w.solved,false);assert.equal(f.w.stats.total,0);assert.equal(f.w.step,'answer');assert.equal(f.d.querySelector('#prompt').textContent,prompt);assert(!f.d.querySelector('#fb').textContent.includes(q.answer));
 submit(f,q.answer);assert.equal(f.w.solved,true);assert.equal(f.w.stats.total,1);assert.equal(f.w.stats.right,0);assert.match(f.d.querySelector('#fb').textContent,/исправил/);
 submit(f,q.answer);assert.equal(f.w.stats.total,1,'Repeated check does not double-count');
 f.d.querySelector('#next').click();const next=toAnswer(f);submit(f,next.answer);assert.equal(f.w.stats.total,2);assert.equal(f.w.stats.right,1);
});

test('hints highlight one action without full answer; explicit solution is not independent success',t=>{
 const f=mount(t);f.d.querySelector('#hint').click();assert(f.d.querySelector('.digit.target'));assert.match(f.d.querySelector('#fb').textContent,/Нажми на синюю/);
 const q=toAnswer(f);f.d.querySelector('#hint').click();assert(!f.d.querySelector('#fb').textContent.includes(q.answer));assert.equal(f.d.querySelector('#ans').value,'');
 f.d.querySelector('#solution').click();assert.equal(f.d.querySelector('#ans').value,q.answer);assert(f.d.querySelector('#fb').textContent.includes(q.answer));f.d.querySelector('#check').click();assert.equal(f.w.stats.total,1);assert.equal(f.w.stats.right,0);assert.match(f.d.querySelector('#fb').textContent,/помощью/);
});

test('a corrected digit or rounding decision does not count as correct first try',t=>{
 for(const mistake of ['target','look','decision']){
  const f=mount(t),q=f.w.task;
  if(mistake==='target')f.d.querySelector('.digit[data-i="'+q.li+'"]').click();
  f.d.querySelector('.digit[data-i="'+q.ti+'"]').click();
  if(mistake==='look')f.d.querySelector('.digit[data-i="'+q.ti+'"]').click();
  f.d.querySelector('.digit[data-i="'+q.li+'"]').click();
  if(mistake==='decision')f.d.querySelector(q.decision==='up'?'#keep':'#up').click();
  f.d.querySelector('#'+q.decision).click();submit(f,exact(q.display,q.p));assert.equal(f.w.stats.total,1);assert.equal(f.w.stats.right,0);
 }
});

test('legacy topic statistics load and saving preserves other topics and metadata',t=>{
 const legacy={version:1,metadata:{keep:true},topics:{other:{private:'unchanged'},roundingStepwise:{total:4,right:3,streak:1,best:2,date:'18.10',history:[{text:'Старый пример'}]}}};
 const f=mount(t,{storage:JSON.stringify(legacy)});assert.equal(f.d.querySelector('#total').textContent,'4');assert.match(f.d.querySelector('#history').textContent,/Старый пример/);
 const q=toAnswer(f);submit(f,q.answer);const saved=JSON.parse(f.w.localStorage.getItem(KEY));assert.deepEqual(saved.topics.other,legacy.topics.other);assert.deepEqual(saved.metadata,legacy.metadata);assert.equal(saved.topics.roundingStepwise.total,5);assert.equal(saved.topics.roundingStepwise.right,4);
});

test('malformed or unsupported shared storage stays unchanged through solving and reset',t=>{
 for(const raw of ['{broken','null','[]',JSON.stringify({topics:[]}),JSON.stringify({version:2,topics:{}}),JSON.stringify({schemaVersion:2,topics:{}}),JSON.stringify({topics:{roundingStepwise:{version:2,total:0,right:0,streak:0}}}),JSON.stringify({topics:{roundingStepwise:{total:'4',right:0,streak:0}}}),JSON.stringify({topics:{roundingStepwise:{total:1,right:1,streak:0,history:{text:'bad'}}}})]){
  const f=mount(t,{storage:raw});assert.equal(f.d.querySelector('#save-warning').hidden,false);const q=toAnswer(f);submit(f,q.answer);f.d.querySelector('#next').click();f.d.querySelector('#reset').click();assert.equal(f.w.localStorage.getItem(KEY),raw);assert.deepEqual(f.errors,[]);
 }
});

test('storage quota failure keeps the old bytes and lets practice continue honestly',t=>{
 const raw=JSON.stringify({topics:{other:{keep:1}}}),f=mount(t,{storage:raw,blocked:true});const q=toAnswer(f);submit(f,q.answer);
 assert.equal(f.w.localStorage.getItem(KEY),raw);assert.equal(f.d.querySelector('#save-warning').hidden,false);assert.doesNotMatch(f.d.querySelector('#fb').textContent,/сохранён/);f.d.querySelector('#next').click();assert.equal(f.w.solved,false);assert.deepEqual(f.errors,[]);
});

test('deep links select only known places and mobile labels remain unambiguous',t=>{
 for(const p of [2,3,4,5,6,0,-1,-2]){const f=mount(t,{query:'?place='+p});assert.equal(f.w.task.p,p)}
 for(const p of ['constructor','__proto__','99','']){const f=mount(t,{query:'?place='+p});assert.equal(f.w.task.p,1)}
 const f=mount(t);assert.equal(f.w.placeLabel(3),'тыс.');assert.equal(f.w.placeLabel(-3),'тысячные');assert.equal(f.d.querySelector('#ans').getAttribute('inputmode'),'decimal');assert.equal(f.d.querySelector('#fb').getAttribute('aria-live'),'polite');
});
