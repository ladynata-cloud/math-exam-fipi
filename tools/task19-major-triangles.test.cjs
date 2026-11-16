'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=process.env.TASK19_TEST_ROOT||path.resolve(__dirname,'..');
const V=require(path.join(root,'trainers/task19-visual-models.js'));
const allCards=require(path.join(root,'trainers/task19-visual-data.js')).cards;
// A staging file is useful while the independently owned data module is being assembled.
// The normal repository gate reads the actual integrated bank.
const sourceCards=process.env.TASK19_TRIANGLE_CARDS_FILE?JSON.parse(fs.readFileSync(process.env.TASK19_TRIANGLE_CARDS_FILE,'utf8')):allCards;
const IDS=[
'isosceles_all_altitudes_are_bisectors','isosceles_incenter_circumcenter_coincide','triangle_larger_side_smaller_opposite_angle','triangle_always_has_incircle','right_triangles_hypotenuse_acute_angle_congruent','triangle_sas_similarity','isosceles_all_medians_are_bisectors','obtuse_triangle_angles_sum_180','triangle_area_not_exceed_product_two_sides','isosceles_base_median_is_altitude','isosceles_base_median_is_bisector','triangle_40_70_70_is_isosceles','isosceles_apex_bisector_bisects_base','isosceles_all_altitudes_medians','isosceles_lateral_median_altitude','triangle_side_opposite_angle_congruence','triangle_angle_strictly_gt60_exists','triangle_bisector_equal_areas','circumcenter_is_bisectors_intersection','incenter_vertex_distance_radius','circumcenter_side_distance_radius','isosceles_all_medians_equal','isosceles_base_altitude_gt_lateral','triangle_congruence_sss','triangle_circumcircle_at_most_one','equidistant_two_vertices_on_third_altitude','incenter_equidistant_vertices','three_distinct_points_at_most_one_circle','isosceles_circumcenter_midpoint_altitude','circumcenter_equidistant_sides','triangle_5_12_13_circumcenter_on_side','equilateral_circumcenter_bisectors','triangle_20_21_29_circumcenter_on_side','obtuse_circumcenter_on_side','triangle_4_5_9_exists','right_triangle_area_hypotenuse_times_altitude','triangle_6_8_2_not_exist','sin_hypotenuse_over_opposite'];
const cards=IDS.map(id=>sourceCards.find(c=>c.id===id));
const near=(a,b,msg)=>assert(Math.abs(a-b)<=1e-7*Math.max(1,Math.abs(a),Math.abs(b)),msg||`${a} != ${b}`);
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1];
const angle=(a,b,c)=>{const u=sub(a,b),v=sub(c,b);return Math.acos(Math.max(-1,Math.min(1,dot(u,v)/(Math.hypot(...u)*Math.hypot(...v)))))*180/Math.PI;};
const area=(a,b,c)=>Math.abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))/2;
const lineDistance=(p,a,b)=>Math.abs((p[0]-a[0])*(b[1]-a[1])-(p[1]-a[1])*(b[0]-a[0]))/dist(a,b);
const spread=xs=>Math.max(...xs)-Math.min(...xs);
const finite=value=>{if(typeof value==='number')assert(Number.isFinite(value));else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
const legacyNames=['triangleExplore','triangleConstructions','triangleCenters','triangleMedianCircle','triangleLinkage','triangleCongruence','triangleAreaPair','triangleSimilarity'];
const NEW=['triangleSourceLines','triangleSourcePair','triangleSourceMetrics','triangleSourceCenters','triangleCircleCandidate','triangleVertexEquidistance'];
function validateGeometry(c,s){
 const P=s.points,M=s.metrics,p=s.values,model=c.hint.model;finite(P);finite(M);
 if(['triangleSourceLines','triangleSourceMetrics','triangleSourceCenters'].includes(model)){
  near(M.AB,dist(P.A,P.B));near(M.AC,dist(P.A,P.C));near(M.BC,dist(P.B,P.C));near(M.area,area(P.A,P.B,P.C));assert(M.area>0);
  if(p.shape==='iso')near(dist(P.A,P.C),dist(P.B,P.C));
  if(p.shape==='equilateral'){near(M.AB,M.AC);near(M.AB,M.BC);}
  if(p.shape==='right')near(angle(P.B,P.A,P.C),90);
  if(p.shape==='obtuse')assert(angle(P.B,P.A,P.C)>90,'obtuse premise');
  if(p.shape==='angles407070'){near(angle(P.B,P.A,P.C),40);near(angle(P.A,P.B,P.C),70);near(angle(P.A,P.C,P.B),70);}
  if(p.shape==='sides51213'){near(M.AB,12);near(M.AC,5);near(M.BC,13);}
  if(p.shape==='sides202129'){near(M.AB,21);near(M.AC,20);near(M.BC,29);}
 }
 if(model==='triangleSourceLines'){
  const [v,u,w]=[['C','A','B'],['A','B','C'],['B','A','C']][p.from];near(dot(sub(P[v],P.H),sub(P[w],P[u])),0);near(dist(P[u],P.M),dist(P.M,P[w]));near(angle(P[u],P[v],P.D),angle(P.D,P[v],P[w]));near(M.bisectorAreaLeft,area(P[v],P[u],P.D));near(M.bisectorAreaRight,area(P[v],P.D,P[w]));near(M.bisectorAreaLeft+M.bisectorAreaRight,M.area);
  for(const [n,u,w]of[['A','B','C'],['B','A','C'],['C','A','B']]){near(dist(P[u],P['M'+n]),dist(P[w],P['M'+n]));near(M['m'+n],dist(P[n],P['M'+n]));}
 }
 if(model==='triangleSourcePair'){
  const A=P.first,B=P.second,len=Q=>[dist(Q[0],Q[1]),dist(Q[0],Q[2]),dist(Q[1],Q[2])],a=len(A),b=len(B);assert(area(...A)>0&&area(...B)>0);
  a.forEach((x,i)=>near(M.sides1[i],x));b.forEach((x,i)=>near(M.sides2[i],x));
  if(p.kind==='sss'){a.forEach((x,i)=>near(x,b[i]));near(a[0],p.ab);near(a[1],p.ac);near(a[2],p.bc);}
  if(p.kind==='sasSimilarity'){near(a[0],p.ab);near(a[1],p.ac);near(angle(A[1],A[0],A[2]),p.angle);near(angle(B[1],B[0],B[2]),p.angle);a.forEach((x,i)=>near(b[i]/x,p.factor));}
  if(p.kind==='hypotenuseAngle'){near(angle(A[1],A[0],A[2]),90);near(angle(B[1],B[0],B[2]),90);near(a[2],p.hypotenuse);near(b[2],p.hypotenuse);near(angle(A[0],A[1],A[2]),p.angle);near(angle(B[0],B[1],B[2]),p.angle);}
  if(p.kind==='sideOpposite'){near(a[2],p.opposite);near(b[2],p.opposite);near(angle(A[1],A[0],A[2]),p.angle);near(angle(B[1],B[0],B[2]),p.angle);}
 }
 if(model==='triangleSourceMetrics'){
  near(M.sideProduct,dist(P.A,P.B)*dist(P.A,P.C));near(M.hypotenuseHeight,lineDistance(P.A,P.B,P.C));near(M.hypotenuseHeightProduct,dist(P.B,P.C)*lineDistance(P.A,P.B,P.C));near(M.sinB,Math.sin(angle(P.A,P.B,P.C)*Math.PI/180));
  if(p.shape==='right'){near(M.sinB,dist(P.A,P.C)/dist(P.B,P.C));near(M.hypotenuseHeightProduct,2*area(P.A,P.B,P.C));}
 }
 if(model==='triangleSourceCenters'){
  for(const n of['A','B','C']){near(dist(P.O,P[n]),M.radius);near(M['I'+n],dist(P.I,P[n]));}
  for(const [n,a,b]of[['X','A','B'],['Y','B','C'],['Z','C','A']]){near(M['O'+n],lineDistance(P.O,P[a],P[b]));near(M['I'+n],lineDistance(P.I,P[a],P[b]));near(M['I'+n],M.inradius);near(dot(sub(P.O,P['O'+n]),sub(P[b],P[a])),0);}
  near(M.OI,dist(P.O,P.I));near(M.ON,dist(P.O,P.N));near(dist(P.C,P.N),dist(P.N,P.H));
  if(p.shape.startsWith('sides')){near(lineDistance(P.O,P.B,P.C),0);near(dist(P.O,P.B),dist(P.O,P.C));}
 }
 if(model==='triangleCircleCandidate'){
  near(dist(P.P,P.A),dist(P.P,P.B));near(M.PA,dist(P.P,P.A));near(M.PC,dist(P.P,P.C));near(M.thirdDifference,M.PC-M.PA);assert(dist(P.A,P.C)>0&&dist(P.B,P.C)>0);if(!p.threePoints)assert(area(P.A,P.B,P.C)>0);
 }
 if(model==='triangleVertexEquidistance'){near(dist(P.P,P.A),dist(P.P,P.B));near(dot(sub(P.C,P.H),sub(P.B,P.A)),0);near(M.distanceToAltitude,lineDistance(P.P,P.C,P.H));}
 // Shared legacy models retain the premise selected for the added card.
 if(p.mode==='iso'&&P.A&&P.C&&P.B)near(dist(P.A,P.C),dist(P.B,P.C));
 if(p.mode==='obtuse'&&P.A&&P.B&&P.C)assert(angle(P.B,P.A,P.C)>90);
 if(p.mode==='equilateral'&&P.A&&P.B&&P.C){near(dist(P.A,P.B),dist(P.A,P.C));near(dist(P.A,P.B),dist(P.B,P.C));}
 if(model==='triangleLinkage'){near(dist(P.A,P.C),p.a);near(dist(P.B,P.D),p.b);near(dist(P.A,P.B),p.c);assert.equal(M.possible,false);}
}

test('all 38 approved triangular assertions have complete cards and real controls',()=>{
 assert.equal(cards.length,38);assert.equal(new Set(IDS).size,38);
 for(let i=0;i<IDS.length;i++){const c=cards[i];assert(c,IDS[i]);assert.deepEqual(c.aliases,[c.id]);for(const key of['text','theme','explanation'])assert(typeof c[key]==='string'&&c[key].length>5,c.id+' '+key);for(const key of['prompt','observe','preserve'])assert(c.hint[key].length>15,c.id+' '+key);assert(V.modelNames.includes(c.hint.model));assert(V.controlsFor(c.hint.model,c.hint.params).length>0,c.id);}
 NEW.forEach(n=>assert(V.modelNames.includes(n),n));
});

test('legacy triangle source and all 484 historical sample/render/control outputs are unchanged',()=>{
 const source=fs.readFileSync(path.join(root,'trainers/task19-models-triangles.js'),'utf8'),prefix=source.split('  // Source expansion: additive models.')[0];
 assert.equal(crypto.createHash('sha256').update(prefix).digest('hex'),'2d946d04d9102f9db90cd3c39bb4c971740bb06e9dec1ab089751b97fa408fa3');
 const evidence=[];
 for(const c of allCards.slice(0,244).filter(c=>legacyNames.includes(c.hint.model))){const h=c.hint,add=p=>{const r=V.render(h.model,p);evidence.push({id:c.id,sample:r.sample,svg:r.svg,readout:r.readout,controls:V.controlsFor(h.model,p)});};add(h.params);for(const ctl of V.controlsFor(h.model,h.params))for(const x of[ctl.min,ctl.max])add(V.updateModel(h.model,h.params,ctl.key,x));}
 assert.equal(evidence.length,484);assert.equal(crypto.createHash('sha256').update(JSON.stringify(evidence)).digest('hex'),'0c36a554b1b7a4ae8faba2d23a8f1379ca75695c34f37895fd88120fdff6f199');
});

test('every new card survives every endpoint, midpoint, update and hostile saved-state restoration',()=>{
 for(const c of cards){assert(c);const h=c.hint,states=[V.sample(h.model,h.params).values],controls=V.controlsFor(h.model,h.params);
  for(const ctl of controls)for(const value of[ctl.min,(ctl.min+ctl.max)/2,ctl.max])states.push(V.updateModel(h.model,h.params,ctl.key,value));
  let p=states[0];for(const ctl of controls){p=V.updateModel(h.model,p,ctl.key,ctl.max);states.push(p);}for(const ctl of [...controls].reverse()){p=V.updateModel(h.model,p,ctl.key,ctl.min);states.push(p);}
  for(const params of states){const s=V.sample(h.model,params);validateGeometry(c,s);const r=V.render(h.model,params);assert(!/NaN|Infinity|undefined/.test(r.svg),c.id);assert(!r.readout.some(x=>/\b(?:true|false)\b|неверно|утверждение верно|поэтому|значит,/i.test(typeof x==='string'?x:x.text)),c.id+' neutral readings');
   const saved={params:{...params,shape:'free',kind:'twoSides',mode:'free',view:'wrong',threePoints:true,fixedLengths:false,a:NaN,size:Infinity},measured:true};
   const restored=V.restoreModel(h,saved);validateGeometry(c,V.sample(h.model,restored.params));assert(restored.measured);for(const key of['shape','kind','mode','view','threePoints','fixedLengths'])if(Object.hasOwn(h.params,key))assert.equal(restored.params[key],h.params[key],c.id+' keeps '+key);
  }
 }
});

test('every false assertion starts with an actual counterexample',()=>{
 const predicates={
 isosceles_all_altitudes_are_bisectors:s=>Math.abs(s.metrics.heightLeft-s.metrics.heightRight)>1,
 isosceles_incenter_circumcenter_coincide:s=>s.metrics.OI>.1,
 triangle_larger_side_smaller_opposite_angle:s=>{const P=s.points,a=[angle(P.B,P.A,P.C),angle(P.A,P.B,P.C),angle(P.A,P.C,P.B)],b=[dist(P.B,P.C),dist(P.A,P.C),dist(P.A,P.B)];return a.indexOf(Math.max(...a))===b.indexOf(Math.max(...b))&&spread(a)>1;},
 isosceles_all_medians_are_bisectors:s=>Math.abs(s.metrics.medianLeft-s.metrics.medianRight)>1,
 isosceles_all_altitudes_medians:s=>Math.abs(s.metrics.UH-s.metrics.HW)>.1,
 isosceles_lateral_median_altitude:s=>s.metrics.HM>.1,
 triangle_side_opposite_angle_congruence:s=>s.metrics.sides1.some((v,i)=>Math.abs(v-s.metrics.sides2[i])>.1),
 triangle_angle_strictly_gt60_exists:s=>[s.metrics.a,s.metrics.b,s.metrics.c].every(x=>Math.abs(x-60)<1e-7),
 triangle_bisector_equal_areas:s=>Math.abs(s.metrics.bisectorAreaLeft-s.metrics.bisectorAreaRight)>.1,
 circumcenter_is_bisectors_intersection:s=>s.metrics.OI>.1,
 incenter_vertex_distance_radius:s=>Math.abs(s.metrics.IA-s.metrics.inradius)>.1,
 circumcenter_side_distance_radius:s=>['OX','OY','OZ'].some(n=>Math.abs(s.metrics[n]-s.metrics.radius)>.1),
 isosceles_all_medians_equal:s=>spread([s.metrics.mA,s.metrics.mB,s.metrics.mC])>.1,
 isosceles_base_altitude_gt_lateral:s=>s.metrics.hC<s.metrics.hA-.1,
 equidistant_two_vertices_on_third_altitude:s=>s.metrics.distanceToAltitude>.1,
 incenter_equidistant_vertices:s=>spread([s.metrics.IA,s.metrics.IB,s.metrics.IC])>.1,
 isosceles_circumcenter_midpoint_altitude:s=>s.metrics.ON>.1,
 circumcenter_equidistant_sides:s=>spread([s.metrics.OX,s.metrics.OY,s.metrics.OZ])>.1,
 obtuse_circumcenter_on_side:s=>{const P=s.points;return[[P.A,P.B],[P.B,P.C],[P.C,P.A]].every(([a,b])=>lineDistance(P.O,a,b)>.1);},
 triangle_4_5_9_exists:s=>!s.metrics.possible&&Math.abs(s.metrics.height)<1e-8&&Math.abs(s.metrics.gap)<1e-8,
 right_triangle_area_hypotenuse_times_altitude:s=>Math.abs(s.metrics.area-s.metrics.hypotenuseHeightProduct)>1,
 sin_hypotenuse_over_opposite:s=>Math.abs(s.metrics.sinB-s.metrics.reciprocalRatio)>.1
 };
 const falseCards=cards.filter(c=>!c.truth);assert.deepEqual(Object.keys(predicates).sort(),falseCards.map(c=>c.id).sort());for(const c of falseCards)assert(predicates[c.id](V.sample(c.hint.model,c.hint.params)),c.id);
});

test('circumcircle search has an attainable unique center, also handles three collinear points',()=>{
 const hint={model:'triangleCircleCandidate',params:{threePoints:false,cx:1,cy:3,centerY:0}};
 const p=V.updateModel(hint.model,hint.params,'centerY',.1),s=V.sample(hint.model,p);near(s.metrics.PA,s.metrics.PC);near(p.centerY,1/6);
 const moved=V.updateModel(hint.model,p,'centerY',.3);assert(Math.abs(moved.centerY-p.centerY)>.01,'can leave a snapped center');
 for(const centerY of[-5,-1,0,2,5]){const q=V.sample('triangleCircleCandidate',{threePoints:true,cx:1,cy:0,centerY});assert(q.metrics.collinear);assert(q.metrics.PA>q.metrics.PC);near(q.metrics.PA*q.metrics.PA-q.metrics.PC*q.metrics.PC,8);}
});

test('advertised bounds of every added triangle control are actually reachable',()=>{
 const hints=cards.filter(c=>NEW.includes(c.hint.model)).map(c=>c.hint);
 hints.push({model:'triangleSourceMetrics',params:{shape:'obtuse',view:'areaProduct',a:110,b:30}});
 for(const h of hints)for(const c of V.controlsFor(h.model,h.params))for(const value of[c.min,c.max]){
  const p=V.updateModel(h.model,h.params,c.key,value),after=V.controlsFor(h.model,p).find(x=>x.key===c.key);
  near(p[c.key],value,`${h.model}/${h.params.shape||h.params.kind||''}/${c.key}: advertised endpoint`);
  near(after.value,value,'displayed control value reaches endpoint');
  const s=V.sample(h.model,p);finite(s.points);finite(s.metrics);
  if(h.params.shape==='right'&&c.key==='b'){near(angle(s.points.A,s.points.B,s.points.C),value);near(angle(s.points.B,s.points.A,s.points.C),90);}
  if(h.params.shape==='obtuse'&&c.key==='a')near(angle(s.points.B,s.points.A,s.points.C),value);
 }
});

test('sequential Home and End use the current bounds after every preceding control change',()=>{
 for(const c of cards){
  const h=c.hint,keys=V.controlsFor(h.model,h.params).map(x=>x.key);let p=V.sample(h.model,h.params).values;
  for(const order of[keys,[...keys].reverse(),keys])for(const key of order)for(const edge of['min','max']){
   const control=V.controlsFor(h.model,p).find(x=>x.key===key);assert(control,`${c.id}: control survives sequence`);
   const requested=control[edge];p=V.updateModel(h.model,p,key,requested);
   const after=V.controlsFor(h.model,p).find(x=>x.key===key);
   near(after.value,requested,`${c.id}: ${key} ${edge} after preceding Home/End operations`);
   validateGeometry(c,V.sample(h.model,p));
   const restored=V.restoreModel(h,{params:p,measured:true});validateGeometry(c,V.sample(h.model,restored.params));
  }
 }
 for(const id of['obtuse_triangle_angles_sum_180','obtuse_circumcenter_on_side']){
  const c=cards.find(x=>x.id===id),h=c.hint;assert(['triangleSourceMetrics','triangleSourceCenters'].includes(h.model),'new obtuse cards do not inherit legacy bound mismatch');
  let p=V.updateModel(h.model,h.params,'a',135),control=V.controlsFor(h.model,p).find(x=>x.key==='b');near(control.max,30);p=V.updateModel(h.model,p,'b',control.max);near(p.b,30);
  const q=V.sample(h.model,p);near(angle(q.points.B,q.points.A,q.points.C),135);near(angle(q.points.A,q.points.B,q.points.C),30);
 }
});

test('every allowed noncollinear three-point configuration has a reachable circumcenter',()=>{
 const model='triangleCircleCandidate';
 const check=params=>{
  const s=V.sample(model,params),P=s.points,p=s.values,c=V.controlsFor(model,p).find(x=>x.key==='centerY');
  assert(c.min>=-19&&c.max<=19,'bounded view and center search');
  if(p.cy===0){
   for(const centerY of[c.min,0,c.max]){const q=V.sample(model,{...p,centerY});assert(q.metrics.collinear);assert(q.metrics.PA>q.metrics.PC);near(q.metrics.PA**2-q.metrics.PC**2,9-p.cx**2);}
   return;
  }
  // Independently solve the two linear equations for equal squared distances.
  const u=sub(P.B,P.A),v=sub(P.C,P.A),rhs1=(dot(P.B,P.B)-dot(P.A,P.A))/2,rhs2=(dot(P.C,P.C)-dot(P.A,P.A))/2,det=u[0]*v[1]-u[1]*v[0];
  const O=[(rhs1*v[1]-rhs2*u[1])/det,(u[0]*rhs2-v[0]*rhs1)/det];
  assert(O[1]>=c.min&&O[1]<=c.max,'true center lies inside the offered control range');
  const nearest=c.min+Math.round((O[1]-c.min)/c.step)*c.step,start=V.updateModel(model,p,'centerY',c.max),found=V.updateModel(model,start,'centerY',nearest),q=V.sample(model,found);
  near(q.points.P[0],O[0]);near(q.points.P[1],O[1]);near(q.metrics.PA,q.metrics.PB);near(q.metrics.PA,q.metrics.PC);
  const away=V.updateModel(model,found,'centerY',found.centerY+.2);assert(Math.abs(away.centerY-found.centerY)>.1,'can leave the attained center');
  const restored=V.restoreModel({model,params:{threePoints:p.threePoints,cx:1,cy:3,centerY:0}},{params:found});
  const r=V.sample(model,restored.params);near(r.points.P[1],O[1]);near(r.metrics.PA,r.metrics.PC);
 };
 for(let ix=0;ix<=40;ix++)for(let iy=-16;iy<=16;iy++)check({threePoints:true,cx:-2+ix/10,cy:iy/4,centerY:0});
 for(const cx of[-2,0,2])for(const cy of[1,2.5,4])check({threePoints:false,cx,cy,centerY:0});
 for(const cy of[-.251,-.249,-.126,-.124,-1e-12,0,1e-12,.124,.126,.249,.251]){
  const restored=V.restoreModel({model,params:{threePoints:true,cx:0,cy:3,centerY:0}},{params:{cy}}).params;
  assert(restored.cy===0||Math.abs(restored.cy)>=.25,'no invisible near-zero singularity');check(restored);
 }
 for(const cy of[-4,-.25,0,.25,4]){
  const p=V.sample(model,{threePoints:true,cx:0,cy,centerY:0}).values,c=V.controlsFor(model,p).find(x=>x.key==='centerY');
  for(const centerY of[c.min,c.max]){
   const out=V.render(model,{...p,centerY});assert(!/NaN|Infinity|undefined/.test(out.svg));
   const match=out.svg.match(/<circle cx="([^"]+)" cy="([^"]+)" r="([^"]+)"/);assert(match);const [x,y,r]=match.slice(1).map(Number);
   assert(x-r>=0&&x+r<=560&&y-r>=0&&y+r<=340,'entire candidate circle fits in the view');
  }
 }
});

test('fixed numerical geometry changes orientation/size visibly without changing the data',()=>{
 for(const id of['triangle_5_12_13_circumcenter_on_side','triangle_20_21_29_circumcenter_on_side','triangle_40_70_70_is_isosceles']){const c=cards.find(c=>c.id===id),h=c.hint,a=V.render(h.model,h.params),b=V.render(h.model,{...h.params,rotation:35});assert.notEqual(a.svg,b.svg,id);validateGeometry(c,b.sample);}
 const c=cards.find(c=>c.id==='triangle_40_70_70_is_isosceles'),h=c.hint,small=V.render(h.model,{...h.params,size:3}),large=V.render(h.model,{...h.params,size:6});
 const width=svg=>{const m=svg.match(/<polygon\b[^>]*points="([^"]+)"/),xs=m[1].split(/\s+/).map(p=>Number(p.split(',')[0]));return Math.max(...xs)-Math.min(...xs);};near(width(large.svg)/width(small.svg),2,'size control visibly doubles the triangle');
});

test('source center view uses readable bounds with an equal scale on both axes',()=>{
 const polygon=svg=>svg.match(/<polygon\b[^>]*points="([^"]+)"/)[1].split(/\s+/).map(p=>p.split(',').map(Number));
 const circle=svg=>{const m=svg.match(/<circle cx="([^"]+)" cy="([^"]+)" r="([^"]+)" fill="none"/);assert(m);return m.slice(1).map(Number);};
 const centerCards=cards.filter(c=>c.hint.model==='triangleSourceCenters');
 for(const c of centerCards){
  const h=c.hint,initial=V.sample(h.model,h.params).values,states=[initial];let p=initial;
  for(const key of V.controlsFor(h.model,p).map(x=>x.key))for(const edge of ['min','max']){const ctl=V.controlsFor(h.model,p).find(x=>x.key===key);p=V.updateModel(h.model,p,key,ctl[edge]);states.push(p);}
  for(const params of states){
   const out=V.render(h.model,params),s=out.sample,Q=polygon(out.svg),P=['A','B','C'].map(n=>s.points[n]),scales=Q.map((q,i)=>dist(q,Q[(i+1)%3])/dist(P[i],P[(i+1)%3]));
   near(scales[0],scales[1],'no horizontal/vertical distortion');near(scales[1],scales[2],'uniform geometry scale');
   const [x,y,r]=circle(out.svg),actualRadius=params.view==='incenterVertices'?s.metrics.inradius:s.metrics.radius;near(r/actualRadius,scales[0],'circle and triangle share one scale');
   assert(x-r>=0&&x+r<=560&&y-r>=0&&y+r<=340,'complete circle remains within the SVG');validateGeometry(c,s);
  }
  if(!initial.shape.startsWith('sides')){
   const small=V.render(h.model,{...initial,size:3}),large=V.render(h.model,{...initial,size:6});near(circle(large.svg)[2]/circle(small.svg)[2],2,'size control visibly doubles the circle');
  }
 }
 const h=cards.find(c=>c.id==='obtuse_circumcenter_on_side').hint,out=V.render(h.model,h.params),diameterAt300px=2*circle(out.svg)[2]*300/560;
 assert(diameterAt300px>=90&&diameterAt300px<=120,'initial mobile circumcircle stays legible, without clipping');
});
