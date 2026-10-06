'use strict';
// Independent geometric invariants for authored films, including figures that
// are revealed later in a proof. Equal marks may never imply a false equality.
const assert=require('node:assert/strict');
const modules=['grade7-geometry-core-videos','grade7-geometry-practice-videos'];
const near=(a,b,message)=>assert(Math.abs(a-b)<1e-6,`${message}: ${a} != ${b}`);
let topics=0,scenes=0,overlays=0,angleLabels=0;
for(const file of modules)for(const[id,lesson]of Object.entries(require('../video-lessons/'+file).items)){
 topics++;
 for(let preset=1;preset<=3;preset++){
  const sequence=lesson.scenes(preset);
  assert.equal(sequence.at(-1).id,'independent-task');
  assert.equal(sequence.at(-1).record,null,'The transfer question does not reveal its answer.');
  for(const scene of sequence){
   const m=scene.motion;if(!m)continue;
   const d=m.diagram,p=d.points,key=`${id}/${preset}/${scene.id}`;
   const len=(a,b)=>Math.hypot(p[a].x-p[b].x,p[a].y-p[b].y);
   const angle=a=>{const u=p[a.from],w=p[a.to],v=p[a.vertex];return Math.acos(Math.max(-1,Math.min(1,((u.x-v.x)*(w.x-v.x)+(u.y-v.y)*(w.y-v.y))/(len(a.from,a.vertex)*len(a.to,a.vertex)))))*180/Math.PI;};
   const sideMarks=new Map(),angleMarks=new Map();
   for(const s of d.segments){
    const length=len(s.from,s.to);assert(length>0,key+' nondegenerate segment');
    if(s.marks){if(sideMarks.has(s.marks))near(length,sideMarks.get(s.marks),key+' equal side marks '+s.id);else sideMarks.set(s.marks,length);}
   }
   for(const a of d.angles||[]){
    const degrees=angle(a);assert(degrees>0&&degrees<=180,key+' nondegenerate angle');
    if(a.right)near(degrees,90,key+' right-angle mark '+a.id);
    if(a.marks){if(angleMarks.has(a.marks))near(degrees,angleMarks.get(a.marks),key+' equal angle marks '+a.id);else angleMarks.set(a.marks,degrees);}
    if(/^\d+°$/.test(a.label||'')){near(degrees,parseFloat(a.label),key+' literal angle label '+a.id);angleLabels++;}
   }
   if(m.match){
    assert.notEqual(scene.id,'condition','Congruent overlay follows an explanation, not the initial question.');
    assert.equal(m.match.from.length,3);assert.equal(m.match.to.length,3);
    for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)near(len(m.match.from[i],m.match.from[j]),len(m.match.to[i],m.match.to[j]),key+' matched corresponding sides');
    overlays++;
   }
   scenes++;
  }
 }
}
assert.equal(topics,20);assert.equal(scenes,312);assert.equal(overlays,13);assert(angleLabels>0);
console.log(`GRADE7_GEOMETRY_VIDEO_MATH_OK: ${topics} topics / 60 examples, ${scenes} exact marked diagrams, ${angleLabels} literal angle labels, ${overlays} justified congruent overlays.`);
