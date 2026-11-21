'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const C=require('../../stereo-course/data/course.json'),S=require('../../stereo-course/assets/space.js'),M=require('../../stereo-course/assets/investigation-models.js'),I=require('../../stereo-course/assets/investigations.js'),P=require('../../stereo-course/assets/practice.js'),T=require('../../stereo-course/assets/tasks.js'),A=require('../../stereo-course/assets/answer.js');
let checks=0,models=0,practices=0;
const ok=(x,message)=>{assert.ok(x,message);checks++;},eq=(a,b,message)=>{assert.deepEqual(a,b,message);checks++;},near=(a,b,message,eps=1e-7)=>ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=eps*(1+Math.abs(b)),message||`${a} != ${b}`);
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),sub=(a,b)=>a.map((v,i)=>v-b[i]),length=a=>Math.hypot(...a),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const data=(id,p)=>M.build(id,p),facts=(id,p)=>data(id,p).facts;
function finiteModel(model,name){
 ok(Object.keys(model.points).length>1,name+' geometry');
 for(const [key,p]of Object.entries(model.points)){ok(Array.isArray(p)&&p.length===3,name+' coordinate '+key);ok(p.every(Number.isFinite),name+' finite '+key);}
 for(const refs of [...model.edges,...model.faces,...model.arrows,...Object.values(model.views).flatMap(v=>[...(v.segments||[]),v.polygon||[],v.points||[]])])for(const key of refs)ok(Object.hasOwn(model.points,key),name+' defined reference '+key);
 for(const key of model.labelNames)ok(Object.hasOwn(model.points,key)&&typeof model.labels[key]==='string',name+' defined label');
 for(const sphere of model.spheres||[])ok(Number.isFinite(sphere.radius)&&sphere.radius>0&&sphere.center.every(Number.isFinite),name+' sphere');
}
eq(Object.keys(M.controls).sort(),C.units.map(u=>u.id).sort(),'one geometric contract for each ID');
eq(Object.keys(I.specs).sort(),C.units.map(u=>u.id).sort(),'one authored scenario for each ID');
for(const u of C.units){
 const spec=I.specs[u.id];for(const k of ['title','prediction','question','reason','boundary'])ok(spec[k].length>15,u.id+' meaningful '+k);
 ok(new Set(spec.choices).size>=3&&new Set(spec.answers).size>=3,u.id+' distinct alternatives');ok(spec.choices[spec.correct]&&spec.answers[spec.answer],u.id+' answer indices');
 const defaults=M.values(u.id),initial=JSON.stringify(M.build(u.id).model);let mutations=0;
 const samples=[defaults,...M.controls[u.id].flatMap(c=>[c.min,c.max,(c.min+c.max)/2].map(value=>({...defaults,[c.key]:value}))),Object.fromEntries(M.controls[u.id].map(c=>[c.key,c.min])),Object.fromEntries(M.controls[u.id].map(c=>[c.key,c.max]))];
 for(const p of samples){const d=data(u.id,p);finiteModel(d.model,u.id);ok(d.summary.length>25,u.id+' observed relation');models++;if(JSON.stringify(d.model)!==initial)mutations++;}
 ok(mutations>0,u.id+' changes mathematical object, not just its camera');
 const state=I.clean(u.id,null);eq(I.check(state).kind,'empty');eq(state.attempts,0);state.answer=spec.answer;eq(I.check(state).kind,'change');eq(state.attempts,0);state.changed=true;state.answer=(spec.answer+1)%spec.answers.length;eq(I.check(state).kind,'wrong');eq(state.completed,false);state.answer=spec.answer;eq(I.check(state).kind,'correct');eq(state.attempts,2);eq(state.completed,true);
}
// Independent, topic-specific invariants: these are not comparisons of a model with itself.
eq(facts('space',{t:0}).unique,false);eq(facts('space',{t:1}).unique,true);
eq([0,1,2].map(mode=>facts('parallel',{mode}).relation),['contained','parallel','intersecting']);
eq([0,1,2].map(mode=>facts('skew',{mode}).relation),['skew','intersecting','parallel']);near(facts('skew',{mode:0}).angle,90);
eq(facts('parallel-planes',{h:0}).distinct,false);near(facts('parallel-planes',{h:3,t:1}).distance,3);
for(const mode of [0,1]){const d=data('polyhedra',{mode,t:.5});ok(d.facts.section.length>=3);for(const q of d.facts.section)near(q[2],2);if(mode===0)eq(d.facts.section.length,3);else eq(d.facts.section.length,4);}
for(const [t,count]of [[0,1],[.5,3],[1,3],[1.5,6],[2,3],[2.5,3],[3,1]]){const d=data('sections',{t,a:1,b:1});eq(d.facts.count,count);for(const q of d.facts.section){near(q[0]+q[1]+q[2],t);ok(q.every(x=>x>=-1e-8&&x<=1+1e-8));}}
for(const [a,b]of [[.5,1.5],[1.5,.5],[1,1]]){const d=data('sections',{t:1.5,a,b});for(const name of ['P','Q','R'])near(dot(d.facts.plane.n,d.model.points[name]),1.5);for(const q of d.facts.section)near(dot(d.facts.plane.n,q),1.5);}
eq(facts('perpendicular',{t:0}).perpendicular,true);eq(facts('perpendicular',{t:1}).perpendicular,false);near(facts('perpendicular',{t:1}).dotA,0);near(facts('perpendicular',{t:1}).dotB,3);
near(facts('projection',{t:3}).slant,5);near(facts('projection',{t:0}).angle,90);ok(facts('projection',{t:2}).angle>facts('projection',{t:4}).angle);near(facts('projection',{t:7}).dot,0);
near(facts('dihedral',{a:120,t:0}).oblique,120);ok(facts('dihedral',{a:120,t:3}).oblique<120);near(facts('dihedral',{a:120,t:3}).linear,120);
near(facts('box',{a:3,b:4,h:2}).baseDiagonal,5);near(facts('box',{a:3,b:4,h:2}).diagonal,Math.sqrt(29));
for(const a of [0,60,120,130]){const d=data('solid-angle',{a});eq(d.facts.realisable,a>0&&a<120);eq(d.facts.degenerate,a===0||a===120);if(a===130)ok(!d.model.points.C,'impossible angle must not fake a third ray');if(a===60){near(dot(d.model.points.A,d.model.points.C)/9,.5);near(dot(d.model.points.B,d.model.points.C)/9,.5);}}
eq([0,1,2].map(mode=>{const f=facts('euler',{mode});return[f.vertices,f.edges,f.faces,f.euler];}),[[8,12,6,2],[8,13,7,2],[9,13,6,2]]);
{const d=data('prism',{t:2,h:3});near(d.facts.height,3);near(d.facts.edge,Math.sqrt(13));for(const q of d.facts.section)near(dot(d.facts.normal,q),6.5);}
eq(facts('pyramid',{t:0}).regular,true);eq(facts('pyramid',{t:1}).regular,false);near(facts('pyramid',{t:0,h:3}).faceHeights[0],Math.sqrt(13));
near(facts('pyramid-frustum',{t:.5}).areaRatio,.25);near(facts('pyramid-frustum',{t:.5}).volumeRatio,.125);near(facts('pyramid-frustum',{t:0}).volumeRatio,0);near(facts('pyramid-frustum',{t:1}).volumeRatio,1);
eq(facts('symmetry',{mode:0,a:45}).matches,false);eq(facts('symmetry',{mode:0,a:90}).matches,true);eq(facts('symmetry',{mode:1}).matches,true);
for(const t of [0,.5,1]){const f=facts('cylinder',{a:2,h:3,t});near(f.width,4*Math.PI);near(f.area,12*Math.PI);}
{const d=data('cylinder',{a:2,h:3,t:1});near(length(sub(d.model.points.L48,d.model.points.L0)),4*Math.PI);near(length(sub(d.model.points.U0,d.model.points.L0)),3);}
near(facts('cone',{a:3,h:4}).slant,5);near(facts('cone-frustum',{a:5,b:2,h:4}).slant,5);near(facts('cone-frustum',{a:5,b:2,h:4}).difference,3);
eq([3,5,6].map(t=>facts('sphere',{t}).kind),['circle','point','empty']);near(facts('sphere',{t:3}).radius,4);eq(facts('sphere',{t:6}).radius,null);
for(const a of [1,3,5])for(const h of [1,4,6]){const f=facts('inscribed-sphere',{a,h});near(f.rho,a*(h-f.rho)/Math.hypot(a,h));near(f.sideDistance,f.rho);ok(f.rho>0&&f.rho<h/2);}
for(const [a,kind]of [[15,'hyperbola'],[45,'parabola'],[60,'ellipse'],[90,'ellipse']]){const d=data('conic-sections',{a,t:1});eq(d.facts.kind,kind);ok(d.facts.section.length>5);for(const q of d.facts.section){near(q[0]**2+q[1]**2,q[2]**2);near(dot(d.facts.plane.n,q),1);}}
eq([30,45,60].map(a=>facts('conic-sections',{a,t:0}).kind),['two-lines','line','point']);
near(facts('box-volume',{a:2,b:3,h:4}).volume,24);near(facts('box-volume',{a:2,b:3,h:4}).perLayer,6);near(facts('box-volume',{a:2,b:3,h:4}).layers,4);
for(const t of [0,1,3])near(facts('prism-volume',{h:4,t}).volume,36);
for(const t of [0,.5,1]){eq(facts('slices',{t,a:3}).sectionAreas,[9,9]);eq(facts('slices',{t,a:3}).volumes,[36,36]);}
for(const h of [1,4,6]){const f=facts('pyramid-volume',{h,t:.5});near(f.prismVolume/f.pyramidVolume,3);near(f.sectionArea,4);}
near(facts('sphere-volume',{a:-5,b:5}).volume,500*Math.PI/3);near(facts('sphere-volume',{a:3,b:3}).volume,0);eq(facts('sphere-volume',{a:4,b:2}).volume,null);near(facts('sphere-volume',{a:0,b:5}).volume,250*Math.PI/3);
eq(facts('vectors',{t:-3,h:2}).translated,[2,1,2]);near(facts('vectors',{t:-3,h:2}).length,3);
eq(facts('vector-operations',{mode:0}).result,[2,2,2]);eq(facts('vector-operations',{mode:1}).result,[2,2,2]);eq(facts('vector-operations',{mode:2}).result,[2,-2,0]);
eq(facts('basis',{t:0,h:1}).representable,false);eq(facts('basis',{t:0,h:0}).representable,true);eq(facts('basis',{t:0,h:0}).unique,false);eq(facts('basis',{t:1,h:1}).coefficients,[1,2,1]);
near(facts('coordinates',{a:3,b:4,h:2}).distance,Math.sqrt(29));eq(facts('coordinates',{a:3,b:4,h:2}).midpoint,[1.5,2,1]);near(facts('coordinates',{a:0,b:0,h:0}).distance,0);
eq([2,3,4].map(t=>facts('sphere-equation',{t}).region),['inside','surface','outside']);near(facts('sphere-equation',{t:3}).distanceSquared,9);
for(const a of [0,60,90,120,180]){const f=facts('dot',{a,b:2,h:3});near(f.dot,6*Math.cos(a*Math.PI/180));near(dot(f.u,f.v),f.dot);}
for(const b of [.5,1,2]){const f=facts('plane-equation',{t:1,h:2,a:0,b});eq(f.belongs,true);near(f.distance,0);near(f.normal[2],b);const outside=facts('plane-equation',{t:1,h:2,a:1,b});eq(outside.belongs,false);near(outside.distance,1/Math.sqrt(2));}
near(facts('transformations',{t:2,a:90,h:3}).lengthRatio,2);near(facts('transformations',{t:2,a:90,h:3}).areaRatio,4);near(facts('transformations',{t:2,a:90,h:3}).volumeRatio,8);
for(const a of [15,90,165]){const d=data('circle-bridge',{mode:0,t:.4,a}),p=d.model.points;near(length(sub(p.P,p.A))*length(sub(p.P,p.B)),length(sub(p.P,p.C))*length(sub(p.P,p.D)));near(length(p.C),3);near(length(p.D),3);}
{const d=data('circle-bridge',{mode:1,t:.4});near(d.facts.products[0],d.facts.products[1]);near(d.facts.tangentDot,0);}
for(const t of [-2,0,1]){const d=data('triangle-bridge',{t,h:3,mode:3}),p=d.model.points;near(d.facts.bisectorRatio,d.facts.ab/d.facts.ac);near(length(sub(p.O,p.A)),length(sub(p.O,p.B)));near(length(sub(p.O,p.B)),length(sub(p.O,p.C)));near(p.G[0],t/3);near(p.I[1],Math.abs(cross(sub(p.I,p.B),sub(p.A,p.B))[2])/length(sub(p.A,p.B)));}
for(const mode of [0,1])for(const t of [.3,1,2])for(const a of [.5,1,1.5]){const d=data('ceva-menelaus',{mode,t,a}),p=d.model.points;const actual=length(sub(p.B,p.D))/length(sub(p.D,p.C))*length(sub(p.C,p.E))/length(sub(p.E,p.A))*length(sub(p.A,p.F))/length(sub(p.F,p.B));near(actual,a);eq(d.facts.valid,a===1);if(mode===1)eq(Math.abs(cross(sub(p.D,p.E),sub(p.F,p.E))[2])<1e-7,a===1);else{const ad=sub(p.D,p.A),be=sub(p.E,p.B),den=cross(ad,be)[2],q=cross(sub(p.B,p.A),be)[2]/den,x=p.A.map((v,i)=>v+q*ad[i]);eq(Math.abs(cross(sub(x,p.C),sub(p.F,p.C))[2])<1e-7,a===1);}}
for(const mode of [0,1,2])for(const t of [-1.5,0,1.5]){const f=facts('conics-plane',{mode,t});near(f.invariant,mode===0?6:mode===1?4:0);}
// The exact old seeds remain a stable contract for saved work.
const legacy=C.units.map(u=>Array.from({length:200},(_,seed)=>T.make(u.task,seed)));
eq(crypto.createHash('sha256').update(JSON.stringify(legacy)).digest('hex'),'7717d4a56015c73b99ee28ad46fcba231156d6ae227a029a7fd5c38754c2bc05');
for(const kind of ['incidence','parallel','frustum']){const old=T.make(kind,0,1);eq(T.make(kind,4,2).legacyKeys,[JSON.stringify([old.q,old.a])],'rewording an old condition is still a repeat');}
eq(T.make('euler',1,2,'polyhedra').practiceData.kind,'polyhedra','the polyhedra unit practices faces and sections');eq(T.make('euler',1,1,'polyhedra'),T.make('euler',1,1),'old polyhedra conditions remain reproducible');
for(const family of P.families){const cases=new Set();for(let seed=0;seed<80;seed++){
 const t=T.make(family,seed,2),scene=P.scene(t);cases.add(t.practiceData.variant);finiteModel(scene.model,'practice '+family);ok(A.equal(A.format(t.a),t.a),family+' accepted final');for(const step of t.steps)ok(A.equal(A.format(step.a),step.a),family+' accepted step');practices++;
 if(family==='dot'){const {u,v,variant}=t.practiceData;const expected=variant===3?dot(u,v):Math.acos(dot(u,v)/length(u)/length(v))*180/Math.PI;near(t.a,expected);}
 if(family==='dihedral'){const d=t.practiceData,ratio=d.height/(d.base/2);near(t.a,d.variant===0?Math.atan(ratio)*180/Math.PI:d.variant===3?d.height:ratio);ok(!Object.values(scene.model.labels).includes('h = '+t.a)||d.variant!==3,'unknown height is not printed');}
 if(family==='regular'&&t.practiceData.variant===2){const lengths=scene.model.edges.map(([a,b])=>length(sub(scene.model.points[a],scene.model.points[b])));for(const x of lengths)near(x,lengths[0],'regular tetrahedron has equal edges');}
 }eq(cases.size,4,family+' four distinct authored situations');}
for(const s of ['(1/0)^0','sqrt(-4)^0','1/(1/0)','0^0','0^(-1)','0^-1','(-4)^(1/2)']){const v=A.inspect(s,1);eq(v.kind,'invalid');eq(v.reason,'domain');ok(!A.equal(s,1));}
for(const s of ['1+','sqrt(','(','2^','sqrt','1/'])eq(A.inspect(s,1).reason,'incomplete');
eq(A.inspect('',1).kind,'empty');eq(A.inspect('3',4).kind,'wrong');eq(A.inspect('abc',1).reason,'syntax');eq(A.inspect('1;', [1,2]).reason,'incomplete');
for(const s of ['7/2','14/4','3,5','3.5'])eq(A.inspect(s,3.5).kind,'correct');near(A.number('2^3^2'),512);near(A.number('-2^2'),-4);near(A.number('(-2)^2'),4);ok(A.equal('sqrt(2); pi; 1/3',[Math.sqrt(2),Math.PI,1/3]));
console.log(`STEREO_HARMONIZATION_MODELS_OK: ${C.units.length} topics, ${models} research configurations, ${practices} practice scenes, ${checks} assertions, 7800 legacy tasks unchanged`);
