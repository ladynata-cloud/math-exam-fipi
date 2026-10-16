'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const D=require('../ege-baza/path/data');
for(const f of ['practice','equation-practice','grade7-algebra','grade7-geometry','grade7-foundations','pre7-arithmetic','pre7-applications','grade7-geometry-core','grade7-geometry-practice','grade7-geometry-rebuild-base','grade7-geometry-rebuild-foundations','grade7-geometry-rebuild-triangles','grade7-geometry-rebuild-relations','grade7-geometry-rebuild-workbook'])require('../ege-baza/path/'+f);
const drawing=require('../learning/assignment-geometry'),renderer=require('../ege-baza/path/grade7-geometry-core-models');
const copy=t=>JSON.parse(JSON.stringify(t)),close=(a,b)=>assert(Math.abs(a-b)<1e-7,`${a} != ${b}`),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const cosine=(a,v,b)=>((a.x-v.x)*(b.x-v.x)+(a.y-v.y)*(b.y-v.y))/(dist(a,v)*dist(b,v));
let moved=0,covered=0;
for(const meta of D.meta.filter(m=>m.geometryRebuild||/^grade7-g-(core|practice)-/.test(m.id))){
 for(const seed of [0,23,71]){
  const t=D.task(meta.id,seed);assert(drawing.supported(t));
  assert(!/NaN|Infinity|undefined/.test(renderer.svg(t)));covered++;
  if(!meta.id.includes('photo-proof'))assert.deepEqual(drawing.movable(t),[],'Never alter numerical problem givens');
 }
}
for(const problem of [1,2,3]){
 const saved=D.task('grade7-r-photo-proof-'+problem,23),before=JSON.stringify(saved);
 for(const id of drawing.movable(saved))for(let x=100;x<=490;x+=13)for(let y=35;y<=330;y+=17){
  const t=copy(saved),prior=JSON.stringify(t);
  if(!drawing.move(t,id,x,y)){assert.equal(JSON.stringify(t),prior);continue;}
  moved++;const p=t.model.diagram.points;
  if(problem===3){
   close(dist(p.D,p.F),dist(p.F,p.H));close(dist(p.E,p.F),dist(p.F,p.G));
   close(p.D.x+p.H.x,2*p.F.x);close(p.D.y+p.H.y,2*p.F.y);
   close(p.E.x+p.G.x,2*p.F.x);close(p.E.y+p.G.y,2*p.F.y);
   close(cosine(p.D,p.F,p.E),cosine(p.H,p.F,p.G));
  }else{
   close(dist(p.B,p.C),dist(p.C,p.D));close(dist(p.A,p.B),dist(p.A,p.D));
   close(cosine(p.B,p.C,p.A),cosine(p.A,p.C,p.D));
  }
  assert(!/NaN|Infinity|undefined/.test(renderer.svg(t)));
 }
 assert.equal(JSON.stringify(saved),before);
 const t=copy(saved),id=drawing.movable(t)[0];
 assert.equal(drawing.move(t,id,NaN,10),false);
 assert.equal(drawing.move(t,'foreign',100,100),false);
 const p=t.model.diagram.points,v=problem===3?p.F:p.A;
 assert.equal(drawing.move(t,id,v.x,v.y),false,'Reject collapsed triangles');
}
for(const t of [null,{}, {model:{kind:'other'}},{model:{kind:'grade7-construction',diagram:{points:{A:{x:NaN,y:2},B:{x:0,y:0}}}}}])assert(!drawing.supported(t));
assert.equal(drawing.mount(null,{}),null);
const read=p=>fs.readFileSync(require('node:path').join(__dirname,'..',p),'utf8');
const index=read('learning/index.html'),teaching=read('learning/teaching.js'),source=read('learning/assignment-geometry.js');
const order=['grade7-geometry-core-models.js','assignment-geometry.js','teaching.js'].map(s=>index.indexOf(s));
assert(order.every(n=>n>0)&&order[0]<order[1]&&order[1]<order[2]);
assert(teaching.includes('mount(geometryHost, attempt?.taskSpec?.task)'),'Use exact persisted variant');
assert(!/fetch\(|localStorage|sessionStorage|\.steps|\.answer|session\.changed/.test(source),'Exploration does not submit, reveal answers, or save state');
assert(source.includes("on(drawing,'pointercancel',release)"));
assert(teaching.includes('geometryCleanup?.();'));
assert(teaching.includes("gallery(taskPhotos, 'Письменное задание ещё не подготовлено.', true)"));
console.log(`ASSIGNMENT_GEOMETRY_OK: ${covered} saved-model variants; ${moved} independent equality checks; invalid moves, fallback and loader/state boundaries.`);
