// Author verification with independent answer calculations; not external review.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const read=p=>fs.readFileSync(p,'utf8');
const ctx=vm.createContext({TextEncoder});
const scripts=['registry','foundation-reference','data-reference','course-definitions','course-state','backup'];
for(const name of scripts)vm.runInContext(read(`ege-baza/${name}.js`),ctx);
vm.runInContext(read('trainers/ege-baza/data-course/content.js'),ctx);
const {SKILLS,TASKS}=ctx.EgeBazaDataContent;
let checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks++;};
const eq=(a,b,m)=>{assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)),m);checks++;};
// Each boolean list evaluates the numbered statements in its corresponding task.
const digits=truths=>Number(truths.flatMap((v,i)=>v?[i+1]:[]).join(''));
// A=>B: enumerate membership assignments to distinguish a consequence from a converse.
const assignments=[[false,false],[false,true],[true,true]];
const consequence=predicate=>assignments.every(([a,b])=>predicate(a,b));
const logical=[
 digits([3>1,1>3,2<3,2<1]),
 digits([consequence((a,b)=>!a||b),consequence((a,b)=>!b||a),consequence((a,b)=>b||!a)]),
 digits([4%2===0,false,false,consequence((a,b)=>b||!a)]),
 digits([3+2===5,0>5,2<5,5===0]),
 digits([3>1,1>3,2<3]),
 digits([2===3,90*4===360,2===3,4===4]),
 digits([4+3===7,0>3,3<7,7===0]),
 digits([consequence((a,b)=>!b||a),consequence((a,b)=>!a||b),false,consequence((a,b)=>b||!a)]),
 digits([1>3,3>1,2<3,3===1]),
 digits([10%5===0,false,15%10===0,consequence((a,b)=>b||!a)])
];
const oracle={
 data:[3,30-24,5-(-3),28+35+22,45,2530-2400,72*1000,6-(-4),2,42+35+39],
 probability:[4/(4+6),1-8/200,3/6,4/20,3/(3+9),1-.3,1-15/500,6/40,12/(8+12),1-.08],
 graphs:[6,4-(-2),(5-1)/(2-0),312,8,(0-4)/(2-0),6-(-3),(0-6)/(2-0),3-1,(3-1)/(4-0)],
 logic:logical
};
eq(SKILLS.length,4);eq(TASKS.length,40);eq(new Set(TASKS.map(t=>t.id)).size,40);
eq(new Set(TASKS.map(t=>t.text)).size,40,'Separate assessment wording');
for(const skill of SKILLS){
 const rows=TASKS.filter(t=>t.skill===skill.id);
 eq(rows.length,10);rows.forEach((t,i)=>{ok(Math.abs(t.answer-oracle[skill.id][i])<1e-9,t.id+' independent answer');ok(t.solution.length>10,t.id+' explanation');if(t.phase==='practice')ok(t.hint.length>10,t.id+' hint');});
 eq(rows.filter(t=>t.phase==='practice').length,4);
 for(const p of ['diagnostic','checkpoint','repeat'])eq(rows.filter(t=>t.phase===p).length,2);
 ok(fs.existsSync(path.resolve('trainers/ege-baza/data-course',skill.link)),skill.id+' prerequisite exists');
}
// Compute chart/table answers from the actual stimulus, independently of stored answer.
const range=a=>Math.max(...a)-Math.min(...a);
const sum=a=>a.reduce((x,y)=>x+y,0);
const slope=v=>(v.values.at(-1)-v.values[0])/(v.xs.at(-1)-v.xs[0]);
const chartOracle={
 data:[v=>Number(v.labels[v.values.indexOf(Math.max(...v.values))]),v=>v.rows[2][1]-v.rows[0][1],v=>range(v.values),v=>sum(v.rows.map(r=>r[1])),v=>Math.max(...v.values),v=>v.rows[1][1]-v.rows[0][1],v=>Math.max(...v.values)*1000,v=>range(v.values),v=>Number(v.labels[v.values.indexOf(Math.min(...v.values))]),v=>sum(v.rows.map(r=>r[1]))],
 graphs:[v=>v.values[v.xs.indexOf(3)],v=>v.values[3]-v.values[1],slope,v=>Number(v.rows.map(r=>r[2]>r[1]?3:r[2]<r[1]?1:2).join('')),v=>v.values[2],slope,v=>v.values[3]-v.values[0],slope,v=>sum(v.xs.slice(1).map((x,i)=>v.values[i+1]===v.values[i]?x-v.xs[i]:0)),slope]
};
for(const [id,functions] of Object.entries(chartOracle))TASKS.filter(t=>t.skill===id).forEach((t,i)=>{
 const v=t.visual;ok(!!v,t.id+' needs stimulus');ok(Math.abs(functions[i](v)-t.answer)<1e-9,t.id+' stimulus agrees');
 if(v.kind==='table')ok(v.rows.every(r=>r.length===v.headers.length),t.id+' columns');
 else {ok(v.values.every(Number.isFinite),t.id+' finite data');eq((v.xs||v.labels).length,v.values.length,t.id+' paired values');if(v.xs)ok(v.xs.every((x,j)=>j===0||x>v.xs[j-1]),t.id+' ordered x');}
});
eq(ctx.EgeBazaDataReference,{skills:SKILLS.map(s=>s.id),tasks:TASKS.map(({id,skill,phase,answer})=>({id,skill,phase,answer}))},'Canonical bank parity');
eq(ctx.EgeBazaRegistry.modules.flatMap(m=>m.lessons).filter(l=>l.href).length,32);
const root=ctx.EgeBazaCourseState,one=root.forModule('m01'),two=root.forModule('m02'),b1=ctx.EgeBazaBackup,b2=b1.forModule('m02');
ok(one.KEY!==two.KEY,'Separate keys');eq(root.forModule('m03'),null,'New module uses separate state, no fabricated legacy state');
const time=2000000000000,empty=()=>({v:1,practice:{},runs:{}}),raw=empty();
const fullRun=p=>({answers:Object.fromEntries(TASKS.filter(t=>t.phase===p).map(t=>[t.id,String(t.answer)])),finishedAt:time,helped:false});
raw.runs.diagnostic=fullRun('diagnostic');
eq(two.snapshot(JSON.stringify(raw),time).runs.diagnostic.correct,8);
for(const t of TASKS.filter(t=>t.phase==='practice'))raw.practice[t.id]={answer:String(t.answer),done:true,tries:1,hints:false,solution:false};
let snap=two.snapshot(JSON.stringify(raw),time);eq(snap.solved,16);eq(snap.independent,16);eq(two.recommend(snap).kind,'checkpoint');
raw.runs.checkpoint=fullRun('checkpoint');snap=two.snapshot(JSON.stringify(raw),time);eq(snap.confirmed,4);eq(two.recommend(snap).kind,'wait');
ok(!two.snapshot(JSON.stringify(raw),time+two.DAY-1).repeatReady,'Repeat locked');ok(two.snapshot(JSON.stringify(raw),time+two.DAY).repeatReady,'Repeat exact boundary');
raw.runs.repeat=fullRun('repeat');raw.runs.repeat.finishedAt=time+two.DAY;
eq(two.snapshot(JSON.stringify(raw),time+two.DAY).skills.map(s=>s.level),[4,4,4,4]);
raw.practice['data-practice-1'].hints=true;raw.practice['data-practice-2'].tries=2;
const values=new Map([[one.KEY,JSON.stringify(empty())],[two.KEY,JSON.stringify(raw)],['other-course','keep']]),writes=[];
const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>{writes.push(k);values.set(k,v);}};
const export1=b1.exportBackup(storage),export2=b2.exportBackup(storage);
eq(Object.keys(JSON.parse(export1).modules),['m01']);eq(Object.keys(JSON.parse(export2).modules),['m02']);
eq(b1.decode(export1).modules.m01.state,empty(),'Existing version-1 m01 envelope accepted');
assert.throws(()=>b2.preview(export1,storage));checks++;assert.throws(()=>b1.preview(export2,storage));checks++;
values.set(two.KEY,JSON.stringify(empty()));const preview=b2.preview(export2,storage);
eq(preview.incoming.independent,14,'Assistance/tries retained in preview');
b2.restore(preview,storage);eq(writes,[two.KEY]);eq(values.get(one.KEY),JSON.stringify(empty()));eq(values.get('other-course'),'keep');
eq(JSON.parse(values.get(two.KEY)),raw,'All m02 state preserved');
const stale=b2.preview(export2,storage);values.set(two.KEY,JSON.stringify(empty()));assert.throws(()=>b2.restore(stale,storage));checks++;
for(const file of ['content.js','visuals.js'])new vm.Script(read('trainers/ege-baza/data-course/'+file));
for(const match of read('trainers/ege-baza/data-course/index.html').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
console.log(`EGE_BAZA_DATA_OK: ${checks} math/stimulus/parity/isolation checks; 40 independent answer calculations.`);
