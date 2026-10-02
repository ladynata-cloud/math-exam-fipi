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
memory['mathexam.mordkovichCircle.v1']='{broken';const before=JSON.stringify(memory);assert(R.snapshot('homework',storage).warning);assert.equal(JSON.stringify(memory),before);
for(const d of [4,6,12,180])for(let i=-2000;i<=2000;i++){const a=i*.03123456,snapped=M.snapAngle(a,d);assert(Math.abs(snapped-a)<=Math.PI/d/2+1e-10);assert(Math.abs(snapped/Math.PI*d-Math.round(snapped/Math.PI*d))<1e-9);}
assert.equal(M.snapAngle(.27,0),.27);assert.equal(M.radiansInput(M.snapAngle(.27,12)),'π/12');assert.equal(M.radiansInput(M.snapAngle(-.27,12)),'−π/12');
console.log(JSON.stringify({gate:'PROFILE_ROUTE_STRUCTURE_OK',homeworkBlocks:6,teacherBlocks:6,trigonometryBlocks:39,preservedLegacyThemes:18,readOnlyReport:true,snapCases:16004}));
