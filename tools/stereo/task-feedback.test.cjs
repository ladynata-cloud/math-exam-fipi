'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),C=require(root+'/stereo-course/data/course.json'),T=require(root+'/stereo-course/assets/tasks.js'),A=require(root+'/stereo-course/assets/answer.js'),Store=require(root+'/stereo-course/assets/store.js');
const kinds=[...new Set(C.units.map(u=>u.task))];assert.deepEqual(Object.keys(T.feedbackPrompts).sort(),kinds.sort());
// Baseline from reviewed PR497 tasks at 6f92a799: sorted38families × seeds0..1023.
const bankHash=crypto.createHash('sha256');
let cases=0;
for(const kind of kinds){
 const cycle=new Set();for(let seed=0;seed<1024;seed++){
  const t=T.make(kind,seed);bankHash.update(JSON.stringify(t)+'\n');
  const answer=A.format(t.a);assert.equal(T.assess(kind,t,answer).kind,'correct',kind);assert.equal(T.assess(kind,t,'').kind,'empty');
  assert.equal(T.assess(kind,t,Array.isArray(t.a)?'1,2,3':typeof t.a==='string'?'пока не знаю':'1/').kind,'format');
  const bad=Array.isArray(t.a)?t.a.map(a=>a+137).join(';'):typeof t.a==='string'?(t.a==='да'?'нет':t.a==='нет'?'да':t.a==='эллипс'?'парабола':'эллипс'):String(t.a+137);
  const verdict=T.assess(kind,t,bad);assert.equal(verdict.kind,'wrong');assert.ok(verdict.message.length>40);assert.notEqual(verdict.code,'format');
  t.steps.forEach((s,i)=>{assert.equal(T.assess(kind,t,A.format(s.a),i).kind,'correct');const bad=typeof s.a==='string'?(s.a==='да'?'нет':s.a==='нет'?'да':s.a==='эллипс'?'парабола':'эллипс'):Array.isArray(s.a)?s.a.map(a=>a+113).join(';'):String(s.a+113);assert.equal(T.assess(kind,t,bad,i).kind,'wrong');});
  if(seed<512)cycle.add(T.key(t));else assert.ok(cycle.has(T.key(t)),kind+' all later conditions belong to known cycle');cases++;
 }
 const current=T.make(kind,1),fresh=T.fresh(kind,1,[T.key(current)]);if(cycle.size>1){assert.equal(fresh.repeated,false);assert.notEqual(T.key(T.make(kind,fresh.seed)),T.key(current));}else assert.equal(fresh.repeated,true);
 const exhausted=T.fresh(kind,7,[...cycle]);assert.equal(exhausted.repeated,true);assert.ok(cycle.has(T.key(T.make(kind,exhausted.seed))));
}
assert.equal(bankHash.digest('hex'),'75b1fe8207beeaa6c93c8c09a9eeaf7922f8bccdf6724686d5924e6e9decc60b','exact existing task conditions,answers,steps preserved');
for(const [kind,value,code] of [['projection',81,'intermediate'],['section',Math.sqrt(4.5),'length-instead-square'],['cylinder-volume',4*T.make('cylinder-volume',1).a,'diameter-radius'],['pyramid-volume',3*T.make('pyramid-volume',1).a,'intermediate'],['plane-distance',12,'intermediate']])assert.equal(T.assess(kind,T.make(kind,1),String(value)).code,code,kind);
for(let seed=0;seed<60;seed++){const t=T.make('sphere-cut',seed);assert.match(T.assess('sphere-cut',t,String(t.a*t.a)).message,/площад/);assert.notEqual(T.assess('sphere-cut',t,String(t.a*t.a)).code,'squared-length');assert.equal(T.assess('sphere-cut',t,String(t.a/Math.PI)).code,'circle-area-factor');const conic=T.make('conic',seed),wrong=typeof conic.a==='number'?String(conic.a+137):conic.a==='эллипс'?'парабола':'эллипс',message=T.assess('conic',conic,wrong).message;if(seed%6===5){assert.match(message,/цилиндр/);assert.doesNotMatch(message,/конус|вершин/);}if(seed%6===4)assert.match(message,/полной поверхности/);}
const sample={seed:11,written:'old proof',independent:7,taskFirst:{version:1,mainDraft:'1/',coach:{firstSubmitted:'1/',firstResponse:'18',errors:2,helpOpened:true,message:'Сверь радиус',kind:'wrong',steps:[{first:'2',last:'sqrt(9)',accepted:'sqrt(9)',errors:1,message:'верно',kind:'correct'}],log:[{mode:'final',answer:'18',kind:'wrong',code:'family'}]}},taskHistory:[{condition:'Old condition',seed:9,mainDraft:'18',stepDraft:'4',assisted:true,checked:true,coach:{firstResponse:'17'}}]};
const clean=Store.clean(sample);assert.equal(clean.independent,7);assert.equal(clean.written,'old proof');assert.equal(clean.taskFirst.coach.firstSubmitted,'1/');assert.equal(clean.taskFirst.coach.helpOpened,true);assert.equal(clean.taskHistory[0].stepDraft,'4');assert.equal(clean.taskHistory[0].coach.firstResponse,'17');
assert.equal(Store.clean({taskHistory:Array.from({length:100},()=>({condition:'task'}))}).taskHistory.length,40);
console.log('STEREO_TASK_FEEDBACK_MATH_OK:',C.units.length,'units,',kinds.length,'families,',cases,'unchanged conditions with authored feedback, formatting and exact generator-cycle checks');
