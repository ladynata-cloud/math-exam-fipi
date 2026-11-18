'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const D=require('../ege-profil/learning/data'),R=require('../ege-profil/learning/route'),M=require('../ege-profil/circle/models').math;
const start=[...require('../ege-profil/start/geometry-data'),...require('../ege-profil/start/algebra-data')],circle=['preparation','chapter4','chapter5','chapter6a','chapter6b'].flatMap(n=>require('../ege-profil/circle/'+n));
assert.equal(R.ids(D.routes.homework).length,6);assert.deepEqual(R.ids(D.routes.lesson),R.ids(D.routes.homework));assert.equal(R.ids(D.routes.trigonometry).length,39);
assert.deepEqual(R.ids(D.routes.trigonometry).slice(0,33),circle.map(l=>l.id));
const visibleLegacy=start.filter(l=>l.group!=='trigonometry'&&!['algebra-cosine','algebra-double-angle'].includes(l.id));assert.equal(new Set([...visibleLegacy.map(l=>l.id),...D.routes.trigonometry.groups[4].ids]).size,18);
for(const [key,r]of Object.entries(D.routes))for(const id of R.ids(r)){
 const l=D.lessons[id],source=(l.engine==='start'?start:circle).find(x=>x.id===id);assert(source);
 for(const mode of ['lesson','guided','independent']){const url=new URL(R.link(key,id,mode),'https://mathexam.space');assert(fs.existsSync(path.join(__dirname,'..',url.pathname)));assert.equal(url.searchParams.get('route'),key);const parts=url.hash.slice(1).split('/');if(parts[0]==='task')assert(source.tasks.some(t=>t.id===parts[1]));}
 if(key==='homework'&&l.engine==='circle'){assert.notEqual(l.homeIndependent,l.guidedIds[0]);assert.notEqual(l.homeIndependent,l.homeGuided);}
}
const memory={},storage={getItem:k=>memory[k]||null,setItem(){throw Error('Report must be read-only');}};
assert(R.snapshot('homework',storage).rows.every(r=>!r.complete));
memory['mathexam.profileStart2027.v1']=JSON.stringify({version:1,records:{'geo-right':{guided:['geo-right-hypotenuse'],independent:[]}},sessions:{'geo-right:independent':{taskId:'geo-right-cosine',done:true,assisted:true}}});
let s=R.snapshot('homework',storage);assert(s.rows[0].guided);assert(s.rows[0].complete);assert(!s.rows[0].independent);
memory['mathexam.mordkovichCircle.v1']=JSON.stringify({version:1,records:{'prep-negative':{guided:true,practised:true}},sessions:{}});assert(!R.snapshot('homework',storage).rows[4].complete,'Teacher task does not complete homework');
memory['mathexam.mordkovichCircle.v1']=JSON.stringify({version:1,records:{'prep-radians':{guided:true,practised:true}},sessions:{}});assert(!R.snapshot('homework',storage).rows[4].complete,'Guided solution of assigned check is not an independent attempt');
// Recover an earlier corrected check and retain a fresh success on a different subpart.
const circleKey='mathexam.mordkovichCircle.v1', circleState=require('../ege-profil/circle/state');
const checkId='m5-6-b', transferId='m5-6-v';
memory[circleKey]=JSON.stringify({version:1,records:{[checkId]:{practised:true,guided:false,independent:false}},sessions:{}});
const historical=R.snapshot('trigonometry',storage).rows.find(r=>r.id==='m5-ordinate-slices');
assert(historical.complete && !historical.independent,'An older completed independent attempt survives loss of its session without inferring first-try success');
const old={version:1,seen:{[checkId]:1},records:{[checkId]:{guided:false,independent:false,practised:true}},sessions:{
 [checkId+':independent']:{taskId:checkId,mode:'independent',step:0,done:true,registered:true,wrong:true,assisted:true,familiar:false}}};
memory[circleKey]=JSON.stringify(old);
const writable={getItem:k=>memory[k]||null,setItem:(k,v)=>{memory[k]=v;}};
const progress=circleState.create(circle,writable);
const fresh=progress.start(transferId,'independent');progress.finish(fresh);
const block=()=>R.snapshot('trigonometry',storage).rows.find(r=>r.id==='m5-ordinate-slices');
const row=block();
assert.equal(row.independent,false,'A different success does not promote the assigned check');
assert(row.evidence.find(e=>e.title==='№5.6 (б)').afterError);
assert(row.evidence.find(e=>e.title==='№5.6 (в)').independent);
assert(!R.snapshot('lesson',storage).rows.some(r=>r.evidence),'The tutor route retains its original assignments');
assert(!R.snapshot('homework',storage).rows.some(r=>r.evidence),'Extra practice does not stand in for assigned homework');
progress.start(checkId,'independent',true);
assert(block().attempted,'Starting a repeat must not erase a completed check');
const restored=circleState.create(circle,writable);
restored.finish(restored.start(checkId,'independent'));
const repeated=block().evidence.find(e=>e.id===checkId);
assert(repeated.afterHelp && repeated.afterError && repeated.repeated && !repeated.independent);
assert(block().evidence.find(e=>e.id===transferId).independent);
// Each route credits only its own check, even if a completed attempt has been reopened.
for (const [route,assigned,other] of [['homework','prep-radians','prep-turns'],['lesson','prep-turns','prep-radians']]){
 const assignedRow=()=>R.snapshot(route,storage).rows.find(r=>r.id==='before-radians');
 memory[circleKey]=JSON.stringify({version:1,seen:{},records:{[other]:{practised:true,independent:true}},sessions:{}});
 assert(!assignedRow().attempted && !assignedRow().complete,'A neighbouring check cannot complete '+route);
 const attempts=circleState.create(circle,writable);
 attempts.finish(attempts.start(assigned,'guided'));
 assert(!assignedRow().attempted,'A guided solution alone cannot complete the assigned check');
 const correction=attempts.start(assigned,'independent');
 correction.wrong=true;attempts.finish(correction);
 attempts.start(assigned,'independent',true);
 const reopened=assignedRow();
 assert(reopened.attempted && reopened.complete && !reopened.independent,route+' retains the corrected assigned check');
 const refreshed=circleState.create(circle,writable);
 assert(!refreshed.start(assigned,'independent').done,'The repeated exercise itself is still open');
 const reloaded=assignedRow();
 assert(reloaded.attempted && reloaded.complete && !reloaded.independent,'Reload retains the recorded outcome');
}
memory['mathexam.mordkovichCircle.v1']='{broken';const before=JSON.stringify(memory);assert(R.snapshot('homework',storage).warning);assert.equal(JSON.stringify(memory),before);
for(const d of [4,6,12,180])for(let i=-2000;i<=2000;i++){const a=i*.03123456,snapped=M.snapAngle(a,d);assert(Math.abs(snapped-a)<=Math.PI/d/2+1e-10);assert(Math.abs(snapped/Math.PI*d-Math.round(snapped/Math.PI*d))<1e-9);}
assert.equal(M.snapAngle(.27,0),.27);assert.equal(M.radiansInput(M.snapAngle(.27,12)),'π/12');assert.equal(M.radiansInput(M.snapAngle(-.27,12)),'−π/12');
console.log(JSON.stringify({gate:'PROFILE_ROUTE_STRUCTURE_OK',homeworkBlocks:6,teacherBlocks:6,trigonometryBlocks:39,preservedLegacyThemes:18,readOnlyReport:true,snapCases:16004}));
