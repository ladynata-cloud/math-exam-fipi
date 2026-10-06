'use strict';
const assert=require('node:assert/strict');
const D=require('../ege-baza/path/data.js');require('../ege-baza/path/practice.js');require('../ege-baza/path/equation-practice.js');require('../ege-baza/path/grade7-geometry.js');
const oldSeeds=[0,1,17,71,72,143,144,215,-1,100003],old=D.meta.map(f=>({id:f.id,tasks:oldSeeds.map(s=>JSON.stringify(D.task(f.id,s)))}));
require('../ege-baza/path/grade7-geometry-core.js');
const near=(actual,expected,message)=>assert(Math.abs(actual-expected)<1e-7*Math.max(1,Math.abs(expected)),`${message}: ${actual} vs ${expected}`);
const len=(p,a,b)=>Math.hypot(p[a].x-p[b].x,p[a].y-p[b].y);
function degrees(p,vertex,from,to){const a={x:p[from].x-p[vertex].x,y:p[from].y-p[vertex].y},b={x:p[to].x-p[vertex].x,y:p[to].y-p[vertex].y};return Math.acos(Math.max(-1,Math.min(1,(a.x*b.x+a.y*b.y)/Math.hypot(a.x,a.y)/Math.hypot(b.x,b.y))))*180/Math.PI;}
let stepsChecked=0,constructionsChecked=0,marksChecked=0,obtuse=0;
function numeric(s,x){assert.equal(Number(s.a),x,s.q);assert(D.correct(s,String(x)));assert(!D.correct(s,String(x+1)));}
function labelled(s,label){const chosen=s.choices?.find(c=>String(c.value)===String(s.a));assert(chosen,s.q);assert.equal(chosen.label,label,s.q);assert.equal(new Set(s.choices.map(c=>c.label)).size,s.choices.length);for(const c of s.choices)assert.equal(D.correct(s,c.value),c===chosen,s.q);return Number(chosen.value);}
function sequence(steps,answers){assert.equal(steps.length,answers.length);steps.forEach((s,i)=>typeof answers[i]==='string'?labelled(s,answers[i]):numeric(s,answers[i]));}
function oracle(t){
 const p=t.params,m=p.mode,n=p.n,s=t.steps,d=t.model.diagram,points=d.points,key=t.id.slice('grade7-g-core-'.length);
 switch(key){
 case 'point-line-ray':{
  numeric(s[0],[2,1,0][m]);if(m===1){const first=t.q.match(/начинается в (\w)/)[1];labelled(s[1],first);}
  const answer=labelled(s.at(-1),['Отрезок','Луч','Прямая'][m]);
  assert.equal(d.segments.length,1);if(m>0){assert.equal(points.X.label,false);assert.equal(points.X.marker,false);}if(m===2){assert.equal(points.Y.label,false);assert.equal(points.Y.marker,false);}return answer;
 }
 case 'perpendicular':{
  near(degrees(points,'O','A','C'),90,'perpendicular diagram');
  if(m===0){sequence(s,[90,90]);return 90;}
  if(m===1){const given=Number(t.q.match(/AOE равен (\d+)°/)[1]);sequence(s,[90,90-given]);near(degrees(points,'O','A','E'),given,'given part of right angle');near(degrees(points,'O','E','C'),90-given,'remaining part of right angle');return 90-given;}
  sequence(s,[90,90,180]);near(degrees(points,'O','A','B'),180,'straight pair');return 180;
 }
 case 'angle-measure':{
  const actual=degrees(points,'O','A','B');near(actual,p.alpha,'drawn protractor angle');
  if(m===0){sequence(s,['С нуля справа',p.alpha]);assert(p.alpha<90);}
  else if(m===1){sequence(s,['С нуля слева',p.alpha]);assert(p.alpha>90);near(180-p.end,p.alpha,'left-zero scale');}
  else{sequence(s,[p.zero,p.end,p.end-p.zero]);assert.notEqual(p.zero,0);}
  assert(d.protractor&&d.protractor.center==='O');assert.equal(d.protractor.readings.length,2);return p.alpha;
 }
 case 'triangle-elements':{
  numeric(s[0],3);const target=p.target,opposite=['A','B','C'].filter(x=>x!==target).join('');assert.equal(opposite,p.opposite);
  return labelled(s[1],m===0?opposite:m===1?target:'∠'+target);
 }
 case 'triangle-perimeter':{
  const {ab,ac,bc}=p,perimeter=ab+ac+bc;assert(ab+ac>bc&&ab+bc>ac&&ac+bc>ab);
  near(len(points,'A','B')/len(points,'A','C'),ab/ac,'two side lengths ratio');near(len(points,'A','B')/len(points,'B','C'),ab/bc,'base length ratio');
  if(m===0){sequence(s,[3,ab+ac,perimeter]);return perimeter;}
  if(m===1){sequence(s,[ac+bc,perimeter-ac-bc]);return perimeter-ac-bc;}
  const other=Number(t.q.match(/другого треугольника (\d+) см/)[1]);sequence(s,[perimeter,other-perimeter]);return other-perimeter;
 }
 case 'sas':{
  near(len(points,'A','B'),len(points,'D','E'),'first side pair');near(len(points,'A','C'),len(points,'D','F'),'second side pair');near(len(points,'A','B')/len(points,'A','C'),p.ab/p.ac,'actual SAS side proportions');near(degrees(points,'A','B','C'),p.theta,'actual included angle');
  if(m===0){sequence(s,['A','∠BAC и ∠EDF']);return Number(s[1].a);}
  if(m===1){sequence(s,[p.ab,'∠BAC и ∠EDF','Две стороны и угол между ними соответственно равны']);return Number(s.at(-1).a);}
  sequence(s,['BA и BC','Нет: данный угол не между указанными сторонами']);assert(!['BA','BC'].includes('AC'));return Number(s[1].a);
 }
 case 'median':{
  const b=Number(t.q.match(/(?:BC|BM|MC) = (\d+) см/)[1]),answer=m===0?b/2:m===1?b*2:b;
  sequence(s,['Середину M',m===1?b:2,answer]);near(len(points,'B','M'),len(points,'M','C'),'median has equal base halves');assert(Math.abs(degrees(points,'M','A','C')-90)>1,'generic median is not altitude');return answer;
 }
 case 'bisector':{
  const given=Number(t.q.match(/= (\d+)°/)[1]),answer=m===0?given/2:m===1?2*given:given;
  sequence(s,['Угол BAC',m===1?given:2,answer]);near(degrees(points,'A','B','D'),degrees(points,'A','D','C'),'bisector angle halves');near(degrees(points,'A','B','C'),p.total,'full vertex angle');assert(Math.abs(len(points,'B','D')-len(points,'D','C'))>1,'bisector is not generally a median');near(len(points,'B','M'),len(points,'M','C'),'comparison median exact');return answer;
 }
 case 'altitude':{
  sequence(s,[`A${p.foot}`,m===0?'Внутри стороны BC':m===1?'В вершине B':'На продолжении BC за B',90]);near(degrees(points,p.foot,'A','C'),90,'altitude right foot');
  const w=p.world;if(m===2){assert(w.H.x<w.B.x&&w.B.x<w.C.x,'obtuse foot beyond B');assert(degrees(w,'B','A','C')>90,'triangle truly obtuse at B');obtuse++;}else if(m===1){assert.equal(p.foot,'B');near(degrees(w,'B','A','C'),90,'right triangle');}else assert(w.H.x>w.B.x&&w.H.x<w.C.x);return 90;
 }
 case 'isosceles-elements':{
  near(len(points,'A','B'),len(points,'A','C'),'equal side marks justified');assert(p.base<2*p.side);near(len(points,'A','B')/len(points,'B','C'),p.side/p.base,'isosceles length ratio');
  if(m===0){sequence(s,['AB и AC','BC']);return Number(s[1].a);}
  if(m===1){sequence(s,[p.total-p.base,2,(p.total-p.base)/2]);return (p.total-p.base)/2;}
  sequence(s,[2*p.side,p.total-2*p.side]);return p.total-2*p.side;
 }
 case 'isosceles-base-angles':{
  near(len(points,'A','B'),len(points,'A','C'),'base-angle theorem premise');near(degrees(points,'B','A','C'),p.angle,'given base angle');near(degrees(points,'C','B','A'),p.angle,'equal base angle');
  sequence(s,m===2?['BC',p.angle,p.angle-p.offset]:['BC',p.angle]);return m===2?p.angle-p.offset:p.angle;
 }
 case 'isosceles-vertex-line':{
  const answer=m===0?90:m===1?p.baseHalf:p.halfAngle;
  sequence(s,['Она проведена из вершины между равными сторонами к основанию',m===0?90:2,answer]);near(len(points,'A','B'),len(points,'A','C'),'vertex-line isosceles premise');near(len(points,'B','D'),len(points,'D','C'),'vertex-line median');near(degrees(points,'D','A','C'),90,'vertex-line altitude');near(degrees(points,'A','B','D'),p.halfAngle,'vertex-line bisector');near(degrees(points,'A','D','C'),p.halfAngle,'vertex-line second half');return answer;
 }
 default:throw Error(key);
 }
}
assert.equal(D.grade7GeometryCore.families.length,12);assert.equal(D.grade7GeometryCore.count,216);assert.equal(new Set(D.meta.map(m=>m.id)).size,D.meta.length);
let tasks=0;const unique={};
for(const family of D.grade7GeometryCore.families){
 const meta=D.meta.find(f=>f.id===family.id);for(const flag of ['grade7','geometryCore','trainingOnly','expanded'])assert.equal(meta[flag],true);assert.equal(meta.subject,'geometry');assert.equal(meta.pos,null);unique[family.id]=new Set();
 for(let seed=0;seed<216;seed++){
  const t=D.task(family.id,seed),answer=oracle(t),m=t.model,d=m.diagram;unique[family.id].add(t.q);assert.equal(t.params.mode,Math.floor(seed/72));assert.equal(Number(t.a),answer);assert.equal(t.answer,answer);assert.equal(Number(t.answerExact),answer);assert(D.correct(t,D.answerText(t)));assert(!D.correct(t,String(answer+1)));assert.equal(t.pos,null);assert(t.geometryCore&&t.grade7&&t.trainingOnly);
  const final=t.steps.at(-1);if(final.choices&&String(final.a)===String(answer))assert.deepEqual(t.choices,final.choices,'Standalone choices expose labelled answer');
  for(const s of t.steps){assert(s.q&&s.why&&s.strict);assert(D.correct(s,D.answerText(s)));assert(!D.correct(s,String(Number(s.a)+1)));for(const wrong of ['', 'abc','1/0'])assert(!D.correct(s,wrong));stepsChecked++;}
  assert.equal(m.kind,'grade7-construction');assert(m.elements.length>=2&&d.description.length>20);const elementIds=m.elements.map(e=>e.id),constructionIds=m.constructions.map(c=>c.id);assert.equal(new Set(elementIds).size,elementIds.length);assert.equal(new Set(constructionIds).size,constructionIds.length);
  const visibleIds=new Set([...Object.keys(d.points),...d.segments.map(s=>s.id),...d.angles.map(a=>a.id)]);for(const e of m.elements){assert(visibleIds.has(e.id),family.id+' unmatched element '+e.id);assert(e.label&&e.description);}
  for(const point of Object.values(d.points))assert(Number.isFinite(point.x)&&Number.isFinite(point.y));
  const sideMarks=new Map(),angleMarks=new Map();
  for(const s of d.segments){assert(d.points[s.from]&&d.points[s.to]);const length=len(d.points,s.from,s.to);assert(length>1e-6);if(s.construction)assert(constructionIds.includes(s.construction));if(s.marks){if(sideMarks.has(s.marks))near(length,sideMarks.get(s.marks),'equal side marks');else sideMarks.set(s.marks,length);marksChecked++;}}
  for(const a of d.angles){assert(d.points[a.vertex]&&d.points[a.from]&&d.points[a.to]);const angle=degrees(d.points,a.vertex,a.from,a.to);assert(angle>0&&angle<=180);if(a.right)near(angle,90,'right square justified');if(a.construction)assert(constructionIds.includes(a.construction));if(a.marks){if(angleMarks.has(a.marks))near(angle,angleMarks.get(a.marks),'equal angle marks');else angleMarks.set(a.marks,angle);marksChecked++;}}
  for(const c of m.constructions){assert(d.points[c.from]&&d.points[c.to]);assert(c.label&&c.description);assert([...d.segments,...d.angles].some(s=>s.construction===c.id),'construction reveals something');constructionsChecked++;}
  assert.deepEqual(D.task(family.id,seed),t);assert.equal(D.task(family.id,seed+216).q,t.q);assert.equal(D.task(family.id,seed-216).q,t.q);tasks++;
 }
 for(const seed of [NaN,Infinity,-Infinity,'bad'])assert.equal(D.task(family.id,seed).q,D.task(family.id,0).q);
}
assert.equal(obtuse,72);for(const before of old)assert.deepEqual(oldSeeds.map(s=>JSON.stringify(D.task(before.id,s))),before.tasks,before.id+' legacy unchanged');
console.log(`GRADE7_GEOMETRY_CORE_OK: ${tasks} seed cases, ${stepsChecked} exact labelled/numeric steps, ${constructionsChecked} valid constructions, ${marksChecked} justified equality marks, 72 true obtuse exterior heights; legacy ${old.length*oldSeeds.length} unchanged`);
console.log('Distinct statements by family:',Object.fromEntries(Object.entries(unique).map(([id,set])=>[id,set.size])));
