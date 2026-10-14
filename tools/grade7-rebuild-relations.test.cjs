'use strict';
const assert=require('node:assert/strict');
const D=require('../ege-baza/path/data.js');require('../ege-baza/path/grade7-geometry-rebuild-base.js');
const before=D.meta.length;require('../ege-baza/path/grade7-geometry-rebuild-relations.js');const families=D.meta.slice(before);
const EPS=1e-6,near=(a,b,msg)=>assert(Math.abs(a-b)<EPS*Math.max(1,Math.abs(b)),`${msg}: ${a} vs ${b}`);
const length=(p,a,b)=>Math.hypot(p[a].x-p[b].x,p[a].y-p[b].y);
const angle=(p,o,a,b)=>{const x=[p[a].x-p[o].x,p[a].y-p[o].y],y=[p[b].x-p[o].x,p[b].y-p[o].y];return Math.acos(Math.max(-1,Math.min(1,(x[0]*y[0]+x[1]*y[1])/Math.hypot(...x)/Math.hypot(...y))))*180/Math.PI;};
const chosen=s=>s.choices.find(c=>String(c.value)===String(s.a)).label;
function numeric(s,a){near(Number(s.a),a,s.q);assert(!s.choices);}
function choice(s,a){assert.equal(chosen(s),a,s.q);}
const types=['Накрест лежащие внутренние','Соответственные','Односторонние внутренние'];
const criterionNames=['По двум катетам','По катету и прилежащему острому углу','По гипотенузе и острому углу','По гипотенузе и катету'];
let tasks=0,steps=0,marked=0,labels=0,ties=0,boundaries=0,inverseMedians=0;
const results=new Map();
function oracle(t){
 const p=t.params,s=t.steps,d=t.model.diagram,ps=d.points,final=s.at(-1);
 switch(p.kind){
 case 'pairs': choice(s[0],'EF');choice(final,types[p.variant%3]);break;
 case 'criterion':{const target=d.angles.find(a=>a.id==='target'),actual=angle(ps,target.vertex,target.from,target.to);numeric(final,actual-(p.mode=== 2?p.offset:0));choice(s[p.mode===1?1:0],types[p.type]);choice(s[p.mode===1?2:1],p.type=== 2?'Сумма углов равна 180°':'Углы равны');if(p.mode===1)numeric(s[0],180-p.given);break;}
 case 'parallel-equal':numeric(final,p.mode===1?180-p.given:p.given);choice(s[0],'Свойство параллельных прямых');break;
 case 'parallel-supplement':numeric(final,180-p.alpha);break;
 case 'angle-directions':{numeric(final,p.obtuse?180-p.alpha:p.alpha);near(angle(ps,'O','X','Y'),p.alpha,'first direction angle');near(angle(ps,'P','U','V'),Number(final.a),'second direction angle');for(const [a,b]of[['X','U'],['Y','V']]){const v=[ps[a].x-ps.O.x,ps[a].y-ps.O.y],w=[ps[b].x-ps.P.x,ps[b].y-ps.P.y],norm=Math.hypot(...v)*Math.hypot(...w);near((p.perp?v[0]*w[0]+v[1]*w[1]:v[0]*w[1]-v[1]*w[0])/norm,0,'both direction pairs satisfy relation');if(!p.perp)assert(Math.abs(v[0]*(ps.P.y-ps.O.y)-v[1]*(ps.P.x-ps.O.x))>EPS,'parallel supporting lines are distinct, not coincident');}break;}
 case 'triangle-sum': numeric(final,180-p.alpha-p.beta);numeric(s.at(-2),p.alpha+p.beta);if(p.mode)numeric(s[0],p.mode===1?180-p.given:p.given);break;
 case 'triangle-type':{const values=['A','B','C'].map(v=>angle(ps,v,...['A','B','C'].filter(x=>x!==v))),max=Math.max(...values),expected=Math.abs(max-90)<EPS?'Прямоугольный':max<90?'Остроугольный':'Тупоугольный';numeric(s[0],values[2]);numeric(s[1],max);choice(final,expected);break;}
 case 'isosceles-angles':near(length(ps,'C','A'),length(ps,'C','B'),'equal isosceles sides');numeric(final,p.mode===1?(180-p.vertex)/2:180-2*p.base);choice(s[0],'Углы A и B');break;
 case 'exterior':numeric(final,p.mode===0?p.alpha+p.beta:p.mode===1?p.outer-p.alpha:180-p.outer);choice(s[0],'A и B');near(angle(ps,'C','A','D'),p.alpha+p.beta,'actual exterior angle');break;
 case 'order':{const sides=['BC','CA','AB'],vertices=['A','B','C'],values=p.mode===0?sides.map(v=>length(ps,...v)):vertices.map(v=>angle(ps,v,...vertices.filter(x=>x!==v))),max=Math.max(...values),indices=values.flatMap((x,i)=>Math.abs(x-max)<EPS?[i]:[]),expected=indices.map(i=>p.mode===0?'∠'+vertices[i]:sides[i]).join(' и ');choice(final,expected);if(indices.length>1)ties++;numeric(s.at(-2),Math.max(...p.values));break;}
 case 'inequality':{const v=[...p.values].sort((a,b)=>a-b),sum=v[0]+v[1],valid=v.every(x=>x>0)&&sum>v[2]+EPS;numeric(s[0],sum);choice(final,valid?'Да':'Нет');if(Math.abs(sum-v[2])<EPS){choice(s[1],'Сумма равна');boundaries++;}break;}
 case 'third-side':{numeric(s[0],Math.abs(p.a-p.b));numeric(s[1],p.a+p.b);const possible=Array.from({length:p.a+p.b+1},(_,i)=>i).filter(c=>c>0&&p.a+p.b>c&&p.a+c>p.b&&p.b+c>p.a);if(p.mode<2)numeric(final,p.mode===0?Math.min(...possible):Math.max(...possible));else{const value=Number(chosen(final).split(' ')[0]);assert(possible.includes(value));for(const c of final.choices)assert.equal(possible.includes(Number(c.label.split(' ')[0])),c.value===final.a);}break;}
 case 'right-angles':numeric(final,90-p.alpha);near(angle(ps,'A','B','C'),p.alpha,'right alpha');if(p.mode=== 2){near(p.alpha/(90-p.alpha),p.ratio[0]/p.ratio[1],'given acute angle ratio');numeric(s[1],90/(p.ratio[0]+p.ratio[1]));}break;
 case 'right-thirty':{numeric(final,p.mode=== 2?30:p.mode===1?2*p.leg:p.h/2);near(length(ps,'B','C')/length(ps,'A','B'),.5,'thirty opposite leg half hypotenuse');near(angle(ps,'A','B','C'),30,'actual thirty angle');choice(s[p.mode===3?1:0],'BC');break;}
 case 'right-median':{numeric(final,p.mode===3?90:p.mode===1?2*p.median:p.h/2);if(p.mode===3){inverseMedians++;assert(!d.angles.some(a=>a.right),'inverse premise does not assume a right angle');assert.equal(d.description,'M — середина AB; AM = MB = CM. Угол ACB нужно найти.');assert(!/прям(?:ой|ого|ым)|гипотенуз|90\s*°/i.test(d.description),'inverse caption does not disclose the right angle or hypotenuse');choice(s[0],'∠A = ∠ACM и ∠B = ∠MCB');choice(s[1],'∠C = ∠A + ∠B');}near(length(ps,'A','M'),length(ps,'M','B'),'true midpoint');near(length(ps,'C','M'),length(ps,'A','B')/2,'median half hypotenuse');break;}
 case 'right-congruence':{numeric(final,p.value);choice(s[0],'AB и DE');choice(s.at(-3),criterionNames[p.family]);choice(s.at(-2),p.known);for(const [a,b]of[['AB','DE'],['BC','EF'],['CA','FD']])near(length(ps,...a),length(ps,...b),'actual congruent side correspondence');const scale=p.value/length(ps,...p.known);near(length(ps,...p.target)*scale,p.value,'transferred unknown length');break;}
 default:throw Error('Missing independent oracle '+p.kind);
 }
}
assert.equal(families.length,21);
for(const f of families){const questions=new Set(),semanticVariants=new Set();assert(f.sourcePages[0]>=54&&f.sourcePages[1]<=80);assert(f.section>=12&&f.section<=17);
 for(let seed=0;seed<72;seed++){
  const t=D.task(f.id,seed),d=t.model.diagram,p=d.points;questions.add(t.q);semanticVariants.add(JSON.stringify({question:t.q,diagram:d}));assert(t.steps.length>= 2);oracle(t);assert.equal(t.answer,Number(t.steps.at(-1).a));assert.equal(t.a,t.steps.at(-1).a);assert(D.correct(t,t.a));
  const pointValues=Object.values(p);assert(pointValues.every(x=>Number.isFinite(x.x)&&Number.isFinite(x.y)));const ids=[...Object.keys(p),...d.segments.map(x=>x.id),...d.angles.map(x=>x.id)];assert.equal(new Set(ids).size,ids.length,'unique figure ids');assert.equal(new Set(t.model.elements.map(x=>x.id)).size,t.model.elements.length);
  const segmentMarks=new Map(),angleMarks=new Map();let lengthScale=null;
  for(const x of d.segments){const len=length(p,x.from,x.to);assert(len>EPS);if(x.marks){if(segmentMarks.has(x.marks))near(len,segmentMarks.get(x.marks),'equal segment marks');else segmentMarks.set(x.marks,len);marked++;}const m=x.label?.match(/(?:= )?([0-9.]+) см$/);if(m){const scale=Number(m[1])/len;if(lengthScale===null)lengthScale=scale;else near(scale,lengthScale,'all given segment lengths share exact scale');labels++;}}
  for(const a of d.angles){const val=angle(p,a.vertex,a.from,a.to);assert(val>EPS&&val<180-EPS);if(a.right)near(val,90,'right angle mark');if(a.marks){if(angleMarks.has(a.marks))near(val,angleMarks.get(a.marks),'equal angle marks');else angleMarks.set(a.marks,val);marked++;}if(/^\d+(?:\.\d+)?°$/.test(a.label)){near(val,Number(a.label.slice(0,-1)),'numeric angle label matches geometry');labels++;}}
  for(const s of t.steps){assert(s.q&&s.why&&s.strict);assert(D.correct(s,s.a));assert(!D.correct(s,'not a number'));if(s.choices){assert.equal(new Set(s.choices.map(x=>x.label)).size,s.choices.length);for(const c of s.choices){assert.equal(D.correct(s,c.value),c.value===s.a);if(c.value!==s.a)assert(s.feedback?.[c.value]?.length>20,'subject-specific feedback');}}steps++;}
  assert.deepEqual(D.task(f.id,seed+72),{...t,seed:seed+72});tasks++;
 }
 assert(semanticVariants.size>=24,`${f.id}: question/geometry variants ${semanticVariants.size}`);results.set(f.id,{questions:questions.size,geometry:semanticVariants.size});
}
assert(ties>= 24,'include tied maximum sides/angles');assert(boundaries>=18,'strict triangle-inequality equality boundaries');
console.log(`GRADE7_REBUILD_RELATIONS_OK: ${families.length} families, ${tasks} variants, ${steps} reasoning steps, ${marked} verified equality marks, ${labels} exact numeric diagram labels, ${ties} tied maxima, ${boundaries} degenerate boundaries`);
console.log(JSON.stringify(Object.fromEntries(results)));
