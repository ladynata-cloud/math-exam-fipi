'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),S=require(root+'/stereo-course/assets/space.js'),I=require(root+'/stereo-course/assets/investigations.js'),V=require(root+'/stereo-course/assets/task-scene-viewer.js'),Store=require(root+'/stereo-course/assets/store.js');
let assertions=0;const near=(a,b)=>{assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);assertions++;};
for(const [t,n] of [[-.25,0],[0,1],[.5,3],[1,3],[1.5,6],[2,3],[2.5,3],[3,1],[3.25,0]]){
 const d=I.model('cube',t);assert.equal(d.facts.vertices,n);assertions++;
 for(const p of d.facts.cut){near(p.reduce((a,b)=>a+b,0),t);assert.ok(p.every(x=>x>=-1e-8&&x<=1+1e-8));assertions++;}
 assert.equal(new Set(d.facts.cut.map(p=>p.join(','))).size,n,'coincident edge intersections are deduplicated');
 if(n>2){const cut=d.facts.cut;for(let i=0;i<n;i++){const p=cut[i],q=cut[(i+1)%n];assert.ok(p.some((x,j)=>(Math.abs(x)<1e-8||Math.abs(x-1)<1e-8)&&Math.abs(x-q[j])<1e-8),'cyclic neighbours share a cube face');assertions++;}}
 V.prepare(d.scene);
}
near(I.model('cube',.5).facts.area,Math.sqrt(3)/8);near(I.model('cube',1.5).facts.area,3*Math.sqrt(3)/4);
for(let p=0;p<=8;p+=.25){const d=I.model('projection',p);near(d.facts.length*d.facts.length,16+p*p);near(d.facts.angle,S.linePlaneAngle([p,0,-4],{n:[0,0,1],d:0}));V.prepare(d.scene);}
for(const d of [0,3,4,5,6]){const x=I.model('sphere',d);assert.equal(x.facts.kind,d<5?'circle':d===5?'point':'empty');near(x.facts.radius,d<5?Math.sqrt(25-d*d):0);V.prepare(x.scene);}
for(const kind of Object.keys(I.specs))for(const body of [true,false])for(const aux of [true,false])for(const section of [true,false])V.prepare(I.model(kind,I.specs[kind].initial,{body,aux,section}).scene);
for(const kind of Object.keys(I.specs)){
 const s=I.clean(null,kind);I.startCheck(s);s.draft=String(I.questions(kind)[s.question].answer);assert.equal(I.check(s).independent,true);assert.equal(s.independent,1);I.check(s);assert.equal(s.independent,1,'duplicate submit');
 I.startCheck(s);s.helped=true;s.draft=String(I.questions(kind)[s.question].answer);assert.equal(I.check(s).independent,false);assert.equal(s.independent,1);
 I.startCheck(s);s.draft='1234';assert.equal(I.check(s).ok,false);s.draft=String(I.questions(kind)[s.question].answer);assert.equal(I.check(s).independent,false);assert.equal(s.independent,1);
 s.visited=I.questions(kind).map((q,i)=>i);I.startCheck(s);assert.equal(s.repeated,true);s.draft=String(I.questions(kind)[s.question].answer);assert.equal(I.check(s).independent,false);
 const round=Store.clean({...Store.clean({seed:9,independent:7,written:'old proof'}),investigation:s});assert.equal(round.seed,9);assert.equal(round.independent,7);assert.equal(round.written,'old proof');assert.deepEqual(round.investigation,I.clean(s,kind));assertions+=11;
}
const sphere=I.clean({seen:[3,4]},'sphere');I.startCheck(sphere);assert.equal(sphere.question,2,'a model condition already explored is not a fresh test');
const cube=I.clean({seen:I.questions('cube').map(q=>q.value)},'cube');I.startCheck(cube);assert.equal(cube.repeated,true);
assert.equal(I.clean({},'__proto__'),null);assert.equal(Store.clean({investigation:{kind:'__proto__'}}).investigation,null);
console.log('STEREO_INVESTIGATIONS_MATH_OK:',assertions,'assertions, exact boundaries, layer combinations, fresh/assisted/repeat separation, old-state preservation');
