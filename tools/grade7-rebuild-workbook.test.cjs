'use strict';
const assert=require('node:assert/strict'),coverage=require('../docs/reports/GRADE7_GEOMETRY_WORKBOOK_COVERAGE.json');
const D=require('../ege-baza/path/data');
for(const name of ['base','foundations','triangles','relations'])require('../ege-baza/path/grade7-geometry-rebuild-'+name);
const old=D.geometryRebuild.families.map(m=>({id:m.id,tasks:Array.from({length:72},(_,n)=>JSON.stringify(D.task(m.id,n)))}));
require('../ege-baza/path/grade7-geometry-rebuild-workbook');
const added=D.geometryRebuild.families.slice(73),label=s=>s.choices?.find(c=>c.value===s.a)?.label,near=(a,b)=>assert(Math.abs(a-b)<1e-6*Math.max(1,Math.abs(b)),`${a} != ${b}`),length=(p,a,b)=>Math.hypot(p[a].x-p[b].x,p[a].y-p[b].y);
const angle=(p,o,a,b)=>{const u=[p[a].x-p[o].x,p[a].y-p[o].y],v=[p[b].x-p[o].x,p[b].y-p[o].y];return Math.acos(Math.max(-1,Math.min(1,(u[0]*v[0]+u[1]*v[1])/(Math.hypot(...u)*Math.hypot(...v)))))*180/Math.PI;};
const expectedTruth=['1001','1000','1011','0011','0100','1010','1010','1010','1010','1010','1001','1010','1000','0101','1011','1010','1010'];
assert.equal(added.length,33);let cases=0;
for(const m of added)for(let seed=0;seed<72;seed++){
 const t=D.task(m.id,seed),p=t.model.diagram.points,steps=t.steps,last=steps.at(-1),kind=t.params.kind;
 assert.equal(JSON.stringify(t),JSON.stringify(D.task(m.id,seed)),'determinism');
 for(const step of steps){assert(step.why);assert(D.correct(step,step.a));assert(!D.correct(step,'999999999'));if(step.choices){assert.equal(new Set(step.choices.map(c=>c.label)).size,step.choices.length);for(const choice of step.choices)assert.equal(D.correct(step,choice.value),choice.value===step.a);}}
 // Independent geometry: all equality marks must agree with coordinates.
 const sm=new Map(),am=new Map();
 for(const s of t.model.diagram.segments){if(!s.marks)continue;const value=length(p,s.from,s.to);if(sm.has(s.marks))near(value,sm.get(s.marks));else sm.set(s.marks,value);}
 for(const a of t.model.diagram.angles||[]){const value=angle(p,a.vertex,a.from,a.to);if(a.right)near(value,90);else if(a.marks){if(am.has(a.marks))near(value,am.get(a.marks));else am.set(a.marks,value);}}
 switch(kind){
 case 'symbol-language':assert.equal(label(last),['M ∈ AB','K ∉ AB','AB ∩ MK = M'][seed%3]);break;
 case 'segment-network':{
  const present=new Set();for(const a of Object.keys(p))for(const b of Object.keys(p))if(a<b){const actual=t.model.diagram.segments.some(s=>Math.abs(length(p,s.from,a)+length(p,a,b)+length(p,b,s.to)-length(p,s.from,s.to))<1e-6||Math.abs(length(p,s.from,b)+length(p,b,a)+length(p,a,s.to)-length(p,s.from,s.to))<1e-6);if(actual)present.add(a+b);}
  assert.deepEqual(label(last).split(', ').map(x=>[...x].sort().join('')).sort(),[...present].sort());break;
 }
 case 'construct-incidence':near(length(p,'A','M')+length(p,'M','B'),length(p,'A','B'));assert.equal(label(last),'AB');break;
 case 'ray-count':{
  const directions=new Set(['A','B','C','D'].map(id=>Math.atan2(p[id].y-p.O.y,p[id].x-p.O.x).toFixed(8)));assert.equal(Number(last.a),directions.size);break;
 }
 case 'angle-region':assert.equal(label(last),p.M.x<p.O.x?'Во внешней области.':p.M.y===p.O.y?'На стороне угла.':'Во внутренней области.');break;
 case 'angle-minutes':{const [,degrees,minutes]=t.q.match(/(\d+)° (\d+)′/);assert.equal(Number(last.a),60*Number(degrees)+Number(minutes));near(angle(p,'O','A','B'),Number(degrees)+Number(minutes)/60);break;}
 case 'construct-midpoint-bisector':if(p.O){near(angle(p,'O','A','M'),angle(p,'O','M','B'));assert(Math.abs(angle(p,'O','A','K')-45)>1);assert.equal(label(last),'OM');}else{near(length(p,'A','M'),length(p,'M','B'));assert.equal(label(last),'M');}break;
 case 'construct-triangle-lines':near(length(p,'B','M'),length(p,'M','C'));near(angle(p,'H','A','C'),90);near(angle(p,'A','B','L'),angle(p,'A','L','C'));assert.equal(label(last),['AM','AH','AL'][seed%3]);assert.deepEqual(t.params.requiredBuild,[label(last)]);break;
 case 'construct-secant':assert.deepEqual(t.params.requiredBuild,['PQ']);assert.equal(p.P.y,p.A.y);assert.equal(p.Q.y,p.C.y);assert.notEqual(p.P.y,p.Q.y);break;
 case 'construct-exterior':assert.deepEqual(t.params.requiredBuild,['AD']);near(angle(p,'A','B','D'),180);assert.equal(label(last),'CAD');break;
 case 'proof-builder':assert.equal(label(steps.at(-2)),['Первый: две стороны и угол между ними.','Второй: сторона и два прилежащих угла.','Третий: три стороны.'][t.params.criterion-1]);break;
 case 'section-review':{
  const section=Number(m.id.match(/review-(\d+)$/)[1]),truth=expectedTruth[section-1][seed%4]==='1';
  assert.equal(label(steps[0]),truth?'Верно.':'Неверно.',m.id+' seed '+seed);assert.equal(t.params.truth,truth);assert(!/внешнему виду|Любые фигуры одного вида/.test(label(last)));break;
 }
 case 'photo-proof':{
  const problem=Number(m.id.at(-1));assert.equal(t.params.criterion,problem===2?3:1);assert.equal(label(steps.at(-2)),problem===2?'Третьему: три стороны.':'Первому: две стороны и угол между ними.');
  if(problem===3){near(length(p,'D','F'),length(p,'F','H'));near(length(p,'E','F'),length(p,'F','G'));near(angle(p,'F','D','H'),180);near(angle(p,'F','E','G'),180);near(angle(p,'F','D','E'),angle(p,'F','H','G'));assert.equal(label(last),'ΔDFE = ΔHFG');}
  else{near(length(p,'B','C'),length(p,'C','D'));if(problem===2)near(length(p,'A','B'),length(p,'A','D'));else near(angle(p,'C','B','A'),angle(p,'C','A','D'));assert.equal(label(last),'ΔABC = ΔADC');}break;
 }
 default:throw Error('Missing independent oracle: '+kind);
 }
 for(const id of t.params.requiredBuild||[])assert(t.model.constructions.some(c=>c.id===id));cases++;
}
for(const m of old)for(let seed=0;seed<72;seed++)assert.equal(JSON.stringify(D.task(m.id,seed)),m.tasks[seed],m.id+' original task preserved');
assert.deepEqual(coverage.exercises.map(row=>row.exercise),Array.from({length:73},(_,n)=>n+1));
assert.deepEqual([...new Set(coverage.exercises.flatMap(row=>row.pages))].sort((a,b)=>a-b),Array.from({length:76},(_,n)=>n+5));
assert.equal(coverage.sections.length,17);
for(const row of coverage.exercises){assert(row.lessons.length);const section=coverage.sections.find(s=>s.section===row.section);assert(row.pages.every(p=>p>=section.pages[0]&&p<=section.pages[1]));for(const id of row.lessons)assert(D.meta.some(m=>m.id===id),'Coverage reference '+id);}
for(const s of coverage.sections)assert(D.meta.some(m=>m.id===s.selfCheck&&m.section===s.section));
assert.deepEqual(coverage.otherParts.find(x=>x.part==='answers').printedPages,[81,82,83,84,85]);
const route=require('../learning/route'),catalog=require('../learning/catalog');
for(const stage of route.geometryProofStages)for(const id of stage.items)assert(catalog.get(id));
const second=route.geometryProofStages.find(stage=>stage.title.startsWith('2.')),third=route.geometryProofStages.find(stage=>stage.title.startsWith('3.'));
assert(second.items.includes('path:grade7-r-photo-proof-1')&&second.items.includes('path:grade7-r-photo-proof-3'));assert(!second.items.includes('path:grade7-r-photo-proof-2'));assert(!second.items.includes('path:grade7-r-triangle-congruence-consequence'),'The SAS stage must not accidentally use an SSS task');assert(second.items.includes('path:grade7-g-practice-sas-common-side'));assert(third.items.includes('path:grade7-r-photo-proof-2'));
console.log(`GRADE7_WORKBOOK_PRACTICE_OK: ${cases} new variants; ${old.length*72} unchanged original tasks; all 73 exercise groups and 76 instructional pages mapped; 17 independent truth tables; source-photo SAS/SSS separation.`);
