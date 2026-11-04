'use strict';
// Source-specific regressions for chapter III §1. These check the actual model
// incidences, measured areas and task completeness, independently of proof text.
const assert = require('node:assert/strict');
const {lessons} = require('../../stereo-course/textbook/data/course.json');
const index = require('../../stereo-course/textbook/source-index.json');
const lesson = id => { const l=lessons.find(x=>x.id===id); assert(l,'missing '+id); return l; };
const ex = (n,part='') => lesson('ex-main-'+String(n).padStart(4,'0')+(part?'-'+part:''));
const points = l => l.visualization.model.points;
const sub=(a,b)=>a.map((x,i)=>x-b[i]);
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm=a=>Math.hypot(...a);
const near=(a,b,label='value')=>assert(Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(a),Math.abs(b)),`${label}: ${a} != ${b}`);
const vec=(p,a,b)=>sub(p[b],p[a]);
const distance=(p,a,b)=>norm(vec(p,a,b));
const perpendicular=(u,v,label)=>near(dot(u,v),0,label);
const area=(p,names)=>{
  const origin=p[names[0]],sum=[0,0,0];
  for(let i=1;i<names.length-1;i++) cross(sub(p[names[i]],origin),sub(p[names[i+1]],origin)).forEach((x,j)=>sum[j]+=x);
  return norm(sum)/2;
};
let checks=0;
function check(name,fn){fn();checks++;}
function prism(l,names,right){
  const p=points(l),v=vec(p,names[0],names[0]+'1');
  for(const name of names) vec(p,name,name+'1').forEach((x,i)=>near(x,v[i],l.id+' parallel equal edges'));
  if(right) for(let i=0;i<names.length;i++)perpendicular(v,vec(p,names[i],names[(i+1)%names.length]),l.id+' right edge');
  return p;
}
function exact(l,value){assert.equal(l.answer.mode,'exact');assert(l.answer.accepted.includes(value),l.id+' independently computed answer');}
function constructed(l,names){
  const m=l.visualization.model;
  for(const name of names){assert(!m.labelNames.includes(name),l.id+' premature label '+name);assert(!m.edges.some(e=>e.includes(name)),l.id+' premature edge '+name);}
}

check('complete source-part contracts for all21 exercises',()=>{
  for(let n=218;n<=238;n++){
    const entry=index.entries.find(e=>e.source.collection==='main'&&e.source.exercise===String(n));
    const expected=n===218||n===227?['а','б']:n===229?['а','б','в','г']:[null];
    assert.deepEqual(entry.requiredParts,expected,'source completeness '+n);
    const cards=lessons.filter(l=>l.source.collection==='main'&&l.source.exercise===String(n));
    assert.deepEqual(cards.map(l=>l.source.subpart??null).sort(),[...expected].sort(),'all and only source parts '+n);
  }
});
check('218: arbitrary right prism and genuinely regular triangular prism',()=>{
  const a=prism(ex(218,'a'),['A','B','C','D'],true);
  assert(Math.abs(distance(a,'A','B')-distance(a,'B','C'))>0.1,'arbitrary right prism need not have equal faces');
  const b=prism(ex(218,'b'),['A','B','C'],true);
  near(distance(b,'A','B'),distance(b,'B','C'));near(distance(b,'B','C'),distance(b,'C','A'));
});
check('219: diagonal projection and45°',()=>{
  const l=ex(219),p=prism(l,['A','B','C','D'],true);
  near(distance(p,'A','B'),12);near(distance(p,'A','D'),5);
  near(distance(p,'A','C'),distance(p,'C','C1'));exact(l,'13');
});
check('220: rhombus is not silently replaced by a rectangle',()=>{
  const l=ex(220),p=prism(l,['A','B','C','D'],true);
  for(const [a,b] of [['A','B'],['B','C'],['C','D'],['D','A']])near(distance(p,a,b),13);
  near(distance(p,'A','C'),24);near(distance(p,'B','D'),10);near(distance(p,'A','A1'),10);
  near(distance(p,'A','C1'),26);assert(distance(p,'A','C1')>distance(p,'B','D1'));exact(l,'26');
});
check('221: actual triangular section, not a lateral face',()=>{
  const l=ex(221),p=prism(l,['A','B','C'],true);
  near(distance(p,'A','B'),8);near(distance(p,'B','C'),8);near(distance(p,'C','A'),8);near(distance(p,'A','A1'),6);
  near(area(p,['A1','B1','C']),8*Math.sqrt(21));exact(l,'8√21');constructed(l,['M','N']);
});
check('222: both acute and obtuse dihedral-angle pairs',()=>{
  const p=prism(ex(222),['A','B','C','D'],true);
  near(distance(p,'A','B'),25);near(distance(p,'C','D'),9);near(distance(p,'D','M'),8);
  for(const [a,b,c,angle] of [['D','A','B',45],['A','B','C',45],['B','C','D',135],['C','D','A',135]]){
    const u=vec(p,b,a),v=vec(p,b,c);near(Math.acos(dot(u,v)/norm(u)/norm(v))*180/Math.PI,angle);
  }
});
check('223: given section area and both requested lengths',()=>{
  const l=ex(223),p=prism(l,['A','B','C','D'],true);
  near(area(p,['A','C','C1','A1']),64*Math.sqrt(2));near(distance(p,'A','B'),8);near(distance(p,'A','C1'),8*Math.sqrt(3));
  assert.match(l.answer.prompt,/ребро/);assert.match(l.answer.prompt,/диагональ/);assert.match(l.steps.at(-1).explanation,/8√3/);
});
check('224: angle belongs to the space diagonal',()=>{
  const l=ex(224),p=prism(l,['A','B','C','D'],true);
  near(distance(p,'A','B'),distance(p,'A','D'));perpendicular(vec(p,'A','B'),vec(p,'A','D'));
  near(distance(p,'A','C'),4*Math.sqrt(2));near(distance(p,'C','C1')/distance(p,'A','C'),Math.sqrt(3));
  near(area(p,['A','B','C1','D1']),16*Math.sqrt(7));exact(l,'16√7');
});
check('225: different projections of the same space diagonal',()=>{
  const l=ex(225),p=prism(l,['A','B','C','D'],true),d=distance(p,'A','C1');
  near(distance(p,'A','B'),distance(p,'A','D'));perpendicular(vec(p,'A','B'),vec(p,'A','D'));
  near(distance(p,'A','B')/d,0.5);near(distance(p,'C','C1')/d,1/Math.sqrt(2));exact(l,'45');
});
check('226: strict line-plane parallelism and all section vertices',()=>{
  const l=ex(226),p=prism(l,['A','B','C','D'],true),normal=cross(vec(p,'A','C'),vec(p,'A','M'));
  near(distance(p,'A','B'),distance(p,'A','D'));perpendicular(vec(p,'A','B'),vec(p,'A','D'));
  near(distance(p,'A','B'),2);near(distance(p,'A','A1'),4);
  perpendicular(normal,vec(p,'B','D1'),'diagonal parallel to section');
  assert(Math.abs(dot(normal,vec(p,'A','B')))>1,'diagonal must not lie in section plane');
  near(distance(p,'D','M'),distance(p,'M','D1'));
  near(area(p,['A','C','M']),2*Math.sqrt(3));exact(l,'2√3');constructed(l,['O','M']);
  assert.deepEqual(l.visualization.model.views.section.polygon,['A','C','M']);
});
check('227: equal common-vertex ray angles in an oblique prism',()=>{
  for(const part of ['a','b']){
    const l=ex(227,part),p=prism(l,['A','B','C'],false),u=vec(p,'A','A1');
    near(distance(p,'A','B'),distance(p,'A','C'));
    near(distance(p,'A','B'),distance(p,'B','C'));
    near(dot(u,vec(p,'A','B'))/distance(p,'A','B'),dot(u,vec(p,'A','C'))/distance(p,'A','C'));
    perpendicular(u,vec(p,'B','C'));assert(norm(u.slice(0,2))>0.1,'must not assume a right prism');
    constructed(l,['M']);
  }
});
check('228: centroid, oblique edge and rectangular lateral face',()=>{
  const l=ex(228),p=prism(l,['A','B','C'],false);
  near(distance(p,'A','B'),13);near(distance(p,'A','C'),13);near(distance(p,'B','C'),10);
  p.G.forEach((x,i)=>near(x,(p.A[i]+p.B[i]+p.C[i])/3,'centroid coordinate'));
  perpendicular(vec(p,'G','A1'),vec(p,'A','B'));perpendicular(vec(p,'G','A1'),vec(p,'A','C'));
  near(distance(p,'A','G')/distance(p,'G','M'),2);near(distance(p,'A1','G'),distance(p,'A','G'));
  perpendicular(vec(p,'B','C'),vec(p,'A','A1'));
  near(area(p,['B','C','C1','B1']),80*Math.sqrt(2));exact(l,'80√2');constructed(l,['M']);
});

check('229: four regular bases, mixed units, both areas in every part',()=>{
  const cases=[['a','ABC',10,15,450,450+50*Math.sqrt(3)],['b','ABCD',12,8,384,672],
    ['c','ABCDEF',23,50,6900,6900+1587*Math.sqrt(3)],['d','ABCDE',4,1,20,20+40/Math.tan(Math.PI/5)]];
  for(const [part,letters,a,h,lateral,total] of cases){
    const l=ex(229,part),names=[...letters],p=prism(l,names,true);
    let measured=0;
    for(let i=0;i<names.length;i++){
      const x=names[i],y=names[(i+1)%names.length];near(distance(p,x,y),a);
      measured+=area(p,[x,y,y+'1',x+'1']);
    }
    near(distance(p,'A','A1'),h);near(measured,lateral);near(measured+2*area(p,names),total);
    assert.match(l.answer.prompt,/боковой и полной/);
    assert(l.steps.some(s=>/Sбок/.test(s.explanation))&&l.steps.some(s=>/Sполн/.test(s.explanation)),l.id+' both outputs');
  }
});
check('230: largest single face determines the common height',()=>{
  const l=ex(230),p=prism(l,['A','B','C'],true);
  near(distance(p,'A','B'),5);near(distance(p,'A','C'),3);
  near(dot(vec(p,'A','B'),vec(p,'A','C'))/15,-0.5);
  near(area(p,['B','C','C1','B1']),35);
  near(['AB','BC','CA'].reduce((s,[a,b])=>s+area(p,[a,b,b+'1',a+'1']),0),75);exact(l,'75');
});
check('231: smaller diagonal section and two nonrectangular bases',()=>{
  const p=prism(ex(231),['A','B','C','D'],true);
  near(distance(p,'A','B'),15);near(distance(p,'A','D'),8);
  near(dot(vec(p,'A','B'),vec(p,'A','D'))/120,0.5);
  near(area(p,['B','D','D1','B1']),130);
  assert(distance(p,'B','D')<distance(p,'A','C'));
  near(['AB','BC','CD','DA'].reduce((s,[a,b])=>s+area(p,[a,b,b+'1',a+'1']),0)+2*area(p,['A','B','C','D']),460+120*Math.sqrt(3));
});
check('232: feasible angles and correct symbolic area on actual model',()=>{
  const p=prism(ex(232),['A','B','C','D'],true),d=distance(p,'A','C1');
  const sinPhi=distance(p,'C','C1')/d,sinAlpha=distance(p,'B1','C1')/d;
  assert(sinPhi>0&&sinAlpha>0&&sinPhi*sinPhi+sinAlpha*sinAlpha<1);
  const formula=2*d*d*sinPhi*(sinAlpha+Math.sqrt(1-sinPhi*sinPhi-sinAlpha*sinAlpha));
  near(formula,['AB','BC','CD','DA'].reduce((s,[a,b])=>s+area(p,[a,b,b+'1',a+'1']),0));
});
check('233: altitude foot lies on the hypotenuse, not at a cathetus endpoint',()=>{
  const l=ex(233),p=prism(l,['A','B','C'],true);
  perpendicular(vec(p,'B','A'),vec(p,'B','C'));near(distance(p,'A','D'),27);near(distance(p,'D','C'),12);
  near(distance(p,'A','D')+distance(p,'D','C'),distance(p,'A','C'));
  perpendicular(vec(p,'B','D'),vec(p,'A','C'));
  near(area(p,['B','B1','D1','D']),180);exact(l,'180');
});
check('234: midpoint-perpendicular trace reaches the correct cathetus',()=>{
  const l=ex(234),p=prism(l,['A','B','C'],true);
  near(distance(p,'A','B'),20);near(distance(p,'B','C'),21);near(distance(p,'A','A1'),42);
  near(distance(p,'A','M'),distance(p,'M','C'));
  near(distance(p,'A','M')+distance(p,'M','C'),distance(p,'A','C'));
  near(distance(p,'B','N')+distance(p,'N','C'),distance(p,'B','C'));
  perpendicular(vec(p,'M','N'),vec(p,'A','C'));
  assert(distance(p,'B','N')>0,'trace is not the median from the right-angle vertex');
  near(area(p,['M','N','N1','M1']),580);exact(l,'580');constructed(l,['N','M1','N1']);
});
check('235: explicit opposite-base interpretation and nondegenerate ratio',()=>{
  const l=ex(235),p=prism(l,['A','B','C'],true);
  const a=distance(p,'B','C'),b=distance(p,'A','B'),c=distance(p,'A','C'),h=distance(p,'A','A1');
  perpendicular(vec(p,'B','A'),vec(p,'B','C'));
  const ratio=(a+b+c)*h/area(p,['B','C','A1']);
  const sinTheta=h/Math.hypot(b,h),sinPhi=a/c,cosPhi=b/c;
  near(ratio,2*sinTheta*(1+cosPhi/sinPhi+1/sinPhi));
  const caveat=JSON.stringify([l.statement,l.help,l.steps]);
  assert.match(caveat,/другого основания/);assert.match(caveat,/θ=0/);
});
function perpendicularSection(l,base,section){
  const p=prism(l,base,false),v=vec(p,base[0],base[0]+'1');
  for(let i=0;i<section.length;i++){
    const w=vec(p,base[i],section[i]),t=dot(w,v)/dot(v,v);
    near(norm(cross(w,v)),0,l.id+' section vertex on lateral edge');
    assert(t>0&&t<1,l.id+' section intersects finite edge internally');
    perpendicular(v,vec(p,section[i],section[(i+1)%section.length]),l.id+' perpendicular section');
  }
  const perimeter=section.reduce((s,x,i)=>s+distance(p,x,section[(i+1)%section.length]),0);
  const measured=base.reduce((s,x,i)=>{const y=base[(i+1)%base.length];return s+area(p,[x,y,y+'1',x+'1']);},0);
  near(measured,perimeter*norm(v),l.id+' actual lateral surface');
  assert(norm(v.slice(0,2))>0.1,l.id+' oblique prism');
  return {p,perimeter,measured};
}
check('236: perpendicular section through all finite lateral edges',()=>{
  const l=ex(236);perpendicularSection(l,['A','B','C','D'],['K','L','M','N']);constructed(l,['K','L','M','N']);
});
check('237: rhombus belongs to perpendicular section, not base',()=>{
  const l=ex(237),{p,perimeter,measured}=perpendicularSection(l,['A','B','C','D'],['K','L','M','N']);
  for(const [a,b] of ['KL','LM','MN','NK'])near(distance(p,a,b),5);
  near(distance(p,'A','A1'),12);near(perimeter,20);near(measured,240);exact(l,'240');
  assert(Math.abs(distance(p,'A','A1')-(p.A1[2]-p.A[2]))>1,'edge is not prism height');
});
check('238: given distances are measured perpendicular to lateral edges',()=>{
  const l=ex(238),{p,perimeter,measured}=perpendicularSection(l,['A','B','C'],['K','L','M']);
  near(distance(p,'K','L'),12);near(distance(p,'K','M'),35);near(distance(p,'L','M'),37);
  perpendicular(vec(p,'K','L'),vec(p,'K','M'));near(distance(p,'A','A1'),24);
  near(perimeter,84);near(measured,2016);exact(l,'2016');constructed(l,['K','L','M']);
});

check('27–31: every theory component has an explicit completeness contract',()=>{
  const contracts={27:['elements','convex'],28:[null],29:[null],30:['definitions','area'],31:['projection-a','projection-b','projection-general','de-gua']};
  for(const [n,parts] of Object.entries(contracts)){
    const entry=index.entries.find(e=>e.source.collection==='theory'&&e.source.point===n);
    assert.deepEqual(entry.requiredParts,parts,'theory contract '+n);
    assert.deepEqual(lessons.filter(l=>l.source.collection==='theory'&&l.source.point===n).map(l=>l.source.subpart??null).sort(),[...parts].sort());
  }
});
check('27: actual counterexample to convexity crosses a face plane',()=>{
  const p=points(lesson('theory-027-convex')),n=cross(vec(p,'C','D'),vec(p,'C','C1'));
  assert(dot(n,vec(p,'C','B'))*dot(n,vec(p,'C','E'))<0);
});
check('31: all three projection models satisfy the area relation',()=>{
  for(const id of ['theory-031-projection-a','theory-031-projection-b','theory-031-projection-general']){
    const l=lesson(id),p=points(l),original=['A','B','C'];
    const projected=id.endsWith('-a')?['A','B','C1']:['A1','B1','C1'];
    original.forEach((name,i)=>{near(p[name][0],p[projected[i]][0]);near(p[name][1],p[projected[i]][1]);near(p[projected[i]][2],0);});
    const normal=cross(vec(p,'A','B'),vec(p,'A','C'));
    near(area(p,projected)/area(p,original),Math.abs(normal[2])/norm(normal));
    if(id.endsWith('-b')){
      near(p.C2[2],p.A[2]);
      for(const [x,y,u,v] of [['A','B','A1','B1'],['A','C2','A1','C1'],['B','C2','B1','C1']])near(distance(p,x,y),distance(p,u,v));
    }
    if(id.endsWith('-general')){
      assert(p.A[2]<p.B[2]&&p.B[2]<p.C[2],'middle signed height');near(p.B[2],p.K[2]);
      near(distance(p,'A','K')+distance(p,'K','C'),distance(p,'A','C'));
      near(area(p,['A','B','K'])+area(p,['B','C','K']),area(p,original));
      near(area(p,['A1','B1','K1'])+area(p,['B1','C1','K1']),area(p,projected));
    }
  }
});
check('31: De Gua is a theorem about face areas and both projections',()=>{
  const l=lesson('theory-031'),p=points(l);
  for(const [a,b] of [['A','B'],['B','C'],['C','A']])perpendicular(vec(p,'O',a),vec(p,'O',b));
  near(distance(p,'A','H')+distance(p,'H','B'),distance(p,'A','B'));perpendicular(vec(p,'O','H'),vec(p,'A','B'));
  for(const edge of [['A','B'],['B','C']])perpendicular(vec(p,'O','D'),vec(p,...edge));
  const normal=cross(vec(p,'A','B'),vec(p,'A','C'));near(dot(normal,vec(p,'A','D')),0);
  const total=area(p,['A','B','C']),parts=[['O','A','B'],['O','B','C'],['O','C','A']].map(names=>area(p,names));
  near(total*total,parts.reduce((s,a)=>s+a*a,0));
  near(area(p,['D','A','B'])+area(p,['D','B','C'])+area(p,['D','C','A']),total);
  for(const [i,names] of [['A','B'],['B','C'],['C','A']].entries())near(area(p,['D',...names]),parts[i]*parts[i]/total);
  constructed(l,['H','D']);
});

console.log(`ATANASYAN_PRISM_CONTENT_OK ${checks} source-specific checks`);
