'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const G=require('../ege-profil/start/geometry-data.js'),A=require('../ege-profil/start/algebra-data.js'),D=[...G,...A],C=require('../ege-profil/start/checks.js'),S=require('../ege-profil/start/state.js'),root=path.resolve(__dirname,'..');
assert.equal(D.length,18);assert.equal(new Set(D.map(l=>l.id)).size,D.length);const ids=new Set();let steps=0;
for(const l of D){assert(l.intro&&l.summary&&l.prereq?.text&&l.model,l.id);assert(l.tasks.length>=6);assert.equal(new Set(l.tasks.map(t=>t.prompt)).size,l.tasks.length,l.id+' distinct prompts');
 for(const link of [...(l.links||[]),l.prereq].filter(x=>x?.href)){if(!/^https?:/.test(link.href)){let p=path.join(root,link.href.split(/[?#]/)[0]);if(fs.existsSync(p)&&fs.statSync(p).isDirectory())p=path.join(p,'index.html');assert(fs.existsSync(p),'broken lesson link '+link.href);}}
 for(const t of l.tasks){assert(!ids.has(t.id),t.id);ids.add(t.id);assert.equal(typeof t.answer,'number');assert(Number.isFinite(t.answer));assert(t.explanation&&t.steps.length>=2,t.id);assert(C.check(t.answer,String(t.answer)),t.id+' decimal key');assert(!C.check(t.answer,String(t.answer+1)),t.id+' wrong key');
  for(const s of t.steps){steps++;assert(s.prompt&&s.hint&&s.why,t.id+' step meaning');assert(C.check(s.answer,String(s.answer),s.choices),t.id+' step key');}
 }
}
for(const [a,v]of [['3/5',.6],['−4/5',-.8],['√2/2',Math.SQRT1_2],['sqrt(2)/2',Math.SQRT1_2],['2*pi',2*Math.PI],['0,75',.75],['(1+3)/5',.8],['-2^2',-4],['2^-3',.125]])assert(Math.abs(C.number(a)-v)<1e-10,a);
for(const a of ['','1/0','NaN','Infinity','alert(1)','1+','2foo','sqrt(-1)','1e9','document.cookie','1;2'])assert(Number.isNaN(C.number(a)),a);
const map=new Map([['legacy-progress','preserve']]),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};let st=S.create(D,storage),l=D[0];
let s=st.start(l.id,'guided');assert(s.assisted);st.finish(l.id,'guided',s);assert.equal(st.record(l.id).independent.length,0);
s=st.start(l.id,'independent');assert(!s.familiar);s.draft='3/5';st.persist();st=S.create(D,storage);assert.equal(st.start(l.id,'independent').draft,'3/5');s=st.start(l.id,'independent');st.finish(l.id,'independent',s);assert.equal(st.record(l.id).independent.length,1);st.finish(l.id,'independent',s);assert.equal(st.record(l.id).attempts,2);
s=st.start(l.id,'independent',true);s.assisted=true;st.finish(l.id,'independent',s);assert.equal(st.record(l.id).independent.length,1);
s=st.start(l.id,'independent',true);s.wrong=true;st.finish(l.id,'independent',s);assert.equal(st.record(l.id).independent.length,1);
s=st.start(l.id,'independent',true);assert(s.familiar);st.finish(l.id,'independent',s);assert.equal(st.record(l.id).independent.length,1);assert.equal(map.get('legacy-progress'),'preserve');
map.set(S.KEY,'{broken');const broken=S.create(D,storage);assert(broken.warning);broken.start(l.id,'guided');assert.equal(map.get(S.KEY),'{broken');assert.equal(broken.original,'{broken');assert.equal(broken.export().storage,'local-browser');
map.set(S.KEY,JSON.stringify({version:9,records:{},seen:{},sessions:{}}));const future=S.create(D,storage);future.persist();assert.equal(JSON.parse(map.get(S.KEY)).version,9);
map.delete(S.KEY);const tab1=S.create(D,storage),tab2=S.create(D,storage);const t1=tab1.start(l.id,'independent');tab1.finish(l.id,'independent',t1);const t2=tab2.start(l.id,'independent');assert.notEqual(t1.taskId,t2.taskId);tab2.finish(l.id,'independent',t2);tab1.persist();assert.equal(JSON.parse(map.get(S.KEY)).records[l.id].independent.length,2,'another tab success preserved');map.set(S.KEY,'{external-corruption');tab1.persist();assert.equal(map.get(S.KEY),'{external-corruption');
console.log(JSON.stringify({gate:'PROFILE_START_MATH_STATE_OK',lessons:D.length,tasks:ids.size,steps,oldKeysPreserved:true,independentFreshness:true,corruptionPreserved:true}));
