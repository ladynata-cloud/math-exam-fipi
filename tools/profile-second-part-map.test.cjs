'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),M=require('../ege-profil/start/second-part.js');
const storage=values=>({getItem(key){return Object.hasOwn(values,key)?JSON.stringify(values[key]):null;},setItem(){throw Error('read-only');},removeItem(){throw Error('read-only');}});
const rawStorage=raw=>({getItem(){return raw;},setItem(){throw Error('read-only');}});
const work=(solved,extra={})=>({schema:1,step:solved.length,solved,answers:{},helps:[],errors:0,...extra});

test('project 2027 has all seven second-part positions and explicit partial coverage',()=>{
 assert.deepEqual(M.items.map(x=>x.number),[14,15,16,17,18,19,20]);
 assert.deepEqual(M.items.map(x=>x.legacyNumber??null),[13,14,15,null,17,18,19]);
 assert.match(M.items.find(x=>x.number===17).coverage,/полный маршрут.*ещё не собран/);
 for(const x of M.items){assert.ok(x.title&&x.goal&&x.coverage&&x.href);assert.ok(Array.isArray(x.resources));}
});

test('every external destination exists and internal routes resolve to known topics',()=>{
 const ctx={};vm.createContext(ctx);
 for(const f of ['geometry-data.js','stereo-data.js','algebra-data.js','probability-data.js','equations-data.js','functions-data.js','applied-data.js','finance-data.js','readiness-data.js','calm-data.js'])vm.runInContext(fs.readFileSync(path.join(root,'ege-profil/start',f),'utf8'),ctx);
 const lessons=new Set(ctx.ProfileLessons.map(x=>x.id));
 for(const x of M.items)for(const href of [x.href,...x.resources.map(y=>y.href)]){
  if(href.startsWith('#lesson/'))assert.ok(lessons.has(href.slice(8)),href);
  else if(href.startsWith('#calm/'))assert.ok(ctx.ProfileCalmData.exams.some(x=>x.number===Number(href.slice(6))),href);
  else if(href.startsWith('#'))assert.equal(href,'#exam/16');
  else{assert.ok(href.startsWith('/'));assert.ok(fs.statSync(path.join(root,href.split('?')[0])).isFile(),href);}
 }
});

test('all readers are read-only and every number has explicit meaning',()=>{
 const s=storage({});
 for(const x of M.items){const result=M.progress(x,s);assert.ok(result.text);assert.ok(result.detail);assert.notEqual(result.kind,'mastered');if(result.done!==null){assert.equal(result.done,0);assert.ok(result.total>0);}}
 assert.equal(M.progress(17,s).done,null);
 assert.equal(M.progress(500,s).kind,'unknown');
});

test('guided, XP and key counters do not become independent mastery',()=>{
 const s=storage({'ep_progress_v1':{xp:{eq:8}},'mathExamStereo.v1':{version:1,units:{space:{guided:true},polyhedra:{guided:true},box:{independent:999},unknown:{guided:true}}},'mathExam.inequalities.rational-1.v1':work([0,1]),'mathExamCourseProgress.v1':{'planimetry-t17':{tasks:{p1:{proof:true,b:true},p2:{proof:true,b:false},p99:{proof:true,b:true}}},'parameters-t18':{keys:{z1:true,z2:false,z3:'true',alien:true}},'numbers-t19':{tasks:{p1:{a:true,b:true,c:false},p2:{a:'true'},alien:{a:true}}}}});
 assert.deepEqual([14,15,16,18,19,20].map(n=>M.progress(n,s).done),[8,2,1,1,1,2]);
 for(const n of [14,15,16,18,19,20])assert.equal(M.progress(n,s).kind,'practice');
 assert.match(M.progress(16,s).detail,/не число самостоятельных/);
});

test('malformed or blocked storage is unavailable, not zero or completed',()=>{
 for(const raw of ['{','[]','null','"x"'])for(const n of [14,15,16,18,19,20])assert.equal(M.progress(n,rawStorage(raw)).kind,'unavailable');
 for(const n of [14,15,16,18,19,20])assert.equal(M.progress(n,{getItem(){throw Error('blocked');}}).kind,'unavailable');
 const cases=[[14,{'ep_progress_v1':{xp:{eq:'8'}}}],[15,{'mathExamStereo.v1':{version:3,units:{}}}],[16,{'mathExam.inequalities.rational-1.v1':work([0,0])}],[16,{'mathExam.inequalities.rational-1.v1':work([],{errors:-1})}],[16,{'mathExam.inequalities.rational-1.v1':work([0,1],{step:3})}],[18,{'mathExamCourseProgress.v1':{'planimetry-t17':{tasks:[]}}}],[19,{'mathExamCourseProgress.v1':{'parameters-t18':{keys:[]}}}],[20,{'mathExamCourseProgress.v1':{'numbers-t19':false}}]];
 for(const [n,v]of cases)assert.equal(M.progress(n,storage(v)).kind,'unavailable');
});

test('inequality activity projection stays aligned with existing lesson bank',()=>{
 const lessons=require('../trainers/ege-profile/inequalities/lessons.js').lessons;
 assert.equal(lessons.length,M.progress(16,storage({})).total);
 for(const l of lessons){
  assert.equal(M.progress(16,storage({[l.storageKey]:work([0])})).done,1,l.id);
  assert.equal(M.progress(16,storage({[l.storageKey]:work(Array.from({length:l.steps.length},(_,i)=>i))})).done,1,l.id);
  assert.equal(M.progress(16,storage({[l.storageKey]:work(Array.from({length:l.steps.length+1},(_,i)=>i))})).kind,'unavailable',l.id);
 }
});

test('stereometry route denominator is the unique curriculum units, not visits',()=>{
 const source=fs.readFileSync(path.join(root,'ege-profil/atanasyan-10-11/course.js'),'utf8');
 const moduleText=source.slice(source.indexOf('const modules='),source.indexOf('const esc='));
 const ids=[...new Set([...moduleText.matchAll(/units:\[([^\]]+)\]/g)].flatMap(m=>[...m[1].matchAll(/'([^']+)'/g)].map(x=>x[1])))];
 assert.equal(ids.length,M.progress(15,storage({})).total);
 const units=Object.fromEntries(ids.map(id=>[id,{guided:true}]));
 assert.equal(M.progress(15,storage({'mathExamStereo.v1':{version:1,units}})).done,ids.length);
 assert.match(M.progress(15,storage({'mathExamStereo.v1':{version:1,units}})).detail,/с опорой/);
});
