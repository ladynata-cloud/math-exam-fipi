'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const api=require('../trainers/task19-visual-models.js');
const data=require('../trainers/task19-visual-data.js');
const fixtures=[{"id":"parallel_lines_alternate_interior_equal","truth":true,"model":"sourceTransversal","params":{"case":"alternateParallel","angle":55,"separation":2.8,"orientation":0}},{"id":"isosceles_has_central_symmetry","truth":false,"model":"symmetryTransform","params":{"shape":"isosceles","transformation":"halfTurn","axisAngle":90,"axisOffset":0,"centerX":0,"centerY":0,"aspect":0.75,"pose":0}},{"id":"isosceles_has_axis_symmetry","truth":true,"model":"symmetryTransform","params":{"shape":"isosceles","transformation":"reflection","axisAngle":90,"axisOffset":0,"centerX":0,"centerY":0,"aspect":0.75,"pose":0}},{"id":"equilateral_has_central_symmetry","truth":false,"model":"symmetryTransform","params":{"shape":"equilateral","transformation":"halfTurn","axisAngle":90,"axisOffset":0,"centerX":0,"centerY":0,"aspect":0.75,"pose":0}},{"id":"unique_point_equidistant_segment_endpoints","truth":false,"model":"endpointLocus","params":{"position":2,"halfLength":3}},{"id":"equilateral_has_three_symmetry_axes","truth":true,"model":"symmetryTransform","params":{"shape":"equilateral","transformation":"reflection","axisAngle":90,"axisOffset":0,"centerX":0,"centerY":0,"aspect":0.75,"pose":0}},{"id":"equidistant_endpoints_point_on_perp_bisector","truth":true,"model":"endpointLocus","params":{"position":2,"halfLength":3}},{"id":"any_two_lines_exactly_one_common_point","truth":false,"model":"sourceIncidence","params":{"case":"parallelPair","orientation":0,"separation":2,"angle":55,"thirdAngle":45,"probe":0,"distance":4}},{"id":"alternate_interior_right_angles_imply_parallel","truth":true,"model":"sourceTransversal","params":{"case":"alternate90","angle":55,"separation":2.8,"orientation":0}},{"id":"vertical_angle_of_108_is_108","truth":true,"model":"sourceAnglePair","params":{"case":"vertical108","orientation":0}},{"id":"adjacent_angles_sum_90","truth":false,"model":"sourceAnglePair","params":{"case":"adjacent","orientation":0}},{"id":"adjacent_53_123","truth":false,"model":"sourceAnglePair","params":{"case":"adjacent53","orientation":0}},{"id":"equal_corresponding_angles_parallel","truth":true,"model":"sourceTransversal","params":{"case":"correspondingEqual","angle":55,"separation":2.8,"orientation":0}},{"id":"oblique_lt_perpendicular_3","truth":false,"model":"sourceOblique","params":{"offset":2,"orientation":0}},{"id":"adjacent_81_99","truth":true,"model":"sourceAnglePair","params":{"case":"adjacent81","orientation":0}},{"id":"same_side_sum90_parallel","truth":false,"model":"sourceTransversal","params":{"case":"sameSide90","angle":35,"separation":2.8,"orientation":0}},{"id":"corresponding_angles90_parallel","truth":true,"model":"sourceTransversal","params":{"case":"corresponding90","angle":55,"separation":2.8,"orientation":0}},{"id":"two_lines_at_most_one_common_point","truth":false,"model":"sourceIncidence","params":{"case":"coincidentPair","orientation":0,"separation":2,"angle":55,"thirdAngle":45,"probe":0,"distance":4}},{"id":"two_distinct_points_multiple_lines","truth":false,"model":"sourceIncidence","params":{"case":"twoPoints","orientation":0,"separation":2,"angle":55,"thirdAngle":45,"probe":0,"distance":4}},{"id":"three_lines_at_least_one_common_point","truth":false,"model":"sourceIncidence","params":{"case":"threeParallel","orientation":0,"separation":2,"angle":55,"thirdAngle":45,"probe":0,"distance":4}},{"id":"corresponding_angles67_parallel","truth":true,"model":"sourceTransversal","params":{"case":"corresponding67","angle":55,"separation":2.8,"orientation":0}},{"id":"any_two_lines_more_than_one_common_point","truth":false,"model":"sourceIncidence","params":{"case":"intersectingPair","orientation":0,"separation":2,"angle":55,"thirdAngle":45,"probe":0,"distance":4}},{"id":"two_distinct_points_at_most_one_line","truth":true,"model":"sourceIncidence","params":{"case":"twoPoints","orientation":0,"separation":2,"angle":55,"thirdAngle":45,"probe":0,"distance":4}},{"id":"three_lines_one_common_point","truth":false,"model":"sourceIncidence","params":{"case":"threeParallel","orientation":0,"separation":2,"angle":55,"thirdAngle":45,"probe":0,"distance":4}},{"id":"parallel_line_perpendicular_transfer","truth":true,"model":"sourceTransversal","params":{"case":"perpendicularTransfer","angle":55,"separation":2.8,"orientation":0}},{"id":"vertical_40_140","truth":false,"model":"sourceAnglePair","params":{"case":"vertical40","orientation":0}},{"id":"same_side50_110_parallel","truth":false,"model":"sourceTransversal","params":{"case":"sameSide50_110","angle":55,"separation":2.8,"orientation":0}},{"id":"adjacent_50_120","truth":false,"model":"sourceAnglePair","params":{"case":"adjacent50","orientation":0}},{"id":"same_side30_120_parallel","truth":false,"model":"sourceTransversal","params":{"case":"sameSide30_120","angle":55,"separation":2.8,"orientation":0}},{"id":"point_at_most_two_lines","truth":false,"model":"sourceIncidence","params":{"case":"threeConcurrent","orientation":0,"separation":2,"angle":55,"thirdAngle":45,"probe":0,"distance":4}},{"id":"circle_exactly_two_symmetry_axes","truth":false,"model":"symmetryTransform","params":{"shape":"circle","transformation":"reflection","axisAngle":45,"axisOffset":0,"centerX":0,"centerY":0,"aspect":0.75,"pose":0,"referenceAxes":true}},{"id":"line_no_symmetry_axes","truth":false,"model":"symmetryTransform","params":{"shape":"line","transformation":"reflection","axisAngle":90,"axisOffset":0,"centerX":0,"centerY":0,"aspect":0.75,"pose":0}},{"id":"regular_hexagon_six_symmetry_axes","truth":true,"model":"symmetryTransform","params":{"shape":"hexagon","transformation":"reflection","axisAngle":90,"axisOffset":0,"centerX":0,"centerY":0,"aspect":0.75,"pose":0}},{"id":"rectangle_no_symmetry_center","truth":false,"model":"symmetryTransform","params":{"shape":"rectangle","transformation":"halfTurn","axisAngle":90,"axisOffset":0,"centerX":0,"centerY":0,"aspect":0.75,"pose":0}},{"id":"circle_no_symmetry_center","truth":false,"model":"symmetryTransform","params":{"shape":"circle","transformation":"halfTurn","axisAngle":90,"axisOffset":0,"centerX":0,"centerY":0,"aspect":0.75,"pose":0}},{"id":"line_at_least_two_symmetry_axes","truth":true,"model":"symmetryTransform","params":{"shape":"line","transformation":"reflection","axisAngle":90,"axisOffset":0,"centerX":0,"centerY":0,"aspect":0.75,"pose":0}},{"id":"square_four_symmetry_axes","truth":true,"model":"symmetryTransform","params":{"shape":"square","transformation":"reflection","axisAngle":90,"axisOffset":0,"centerX":0,"centerY":0,"aspect":0.75,"pose":0}},{"id":"rhombus_symmetry_center_diagonals","truth":true,"model":"symmetryTransform","params":{"shape":"rhombus","transformation":"halfTurn","axisAngle":90,"axisOffset":0,"centerX":0,"centerY":0,"aspect":0.75,"pose":0,"anchor":"diagonals"}},{"id":"three_concurrent_lines_not_exist","truth":false,"model":"sourceIncidence","params":{"case":"threeConcurrent","orientation":0,"separation":2,"angle":55,"thirdAngle":45,"probe":0,"distance":4}}];
const RAD=Math.PI/180,sub=(a,b)=>[a[0]-b[0],a[1]-b[1]],cross=(a,b)=>a[0]*b[1]-a[1]*b[0],dot=(a,b)=>a[0]*b[0]+a[1]*b[1];
const length=(a,b)=>Math.hypot(...sub(a,b));
const angle=(a,o,b)=>Math.atan2(Math.abs(cross(sub(a,o),sub(b,o))),dot(sub(a,o),sub(b,o)))/RAD;
const distance=(p,a,b)=>Math.abs(cross(sub(p,a),sub(b,a)))/length(a,b);
const near=(a,b,message)=>assert(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-7,`${message}: ${a} != ${b}`);
const finite=v=>{if(typeof v==='number')assert(Number.isFinite(v));else if(v&&typeof v==='object')Object.values(v).forEach(finite);};
const statesFor=f=>api.controlsFor(f.model,f.params).reduce((states,c)=>states.flatMap(p=>[c.min,(c.min+c.max)/2,c.max].map(v=>({...p,[c.key]:v}))),[{...f.params}]);
const triangleArea=(a,b,c)=>Math.abs(cross(sub(b,a),sub(c,a)))/2;

function verify(s){
  finite(s.points);finite(s.metrics);
  const P=s.points,M=s.metrics,p=s.values;
  if(s.model==='sourceAnglePair'){
    near(angle(P.A,P.O,P.C),M.first,'first angle from rays');
    near(M.kind==='vertical'?angle(P.B,P.O,P.D):angle(P.C,P.O,P.B),M.second,'second angle from rays');
    near(cross(sub(P.A,P.O),sub(P.B,P.O)),0,'opposite first rays');
    assert(dot(sub(P.A,P.O),sub(P.B,P.O))<0);
    if(M.kind==='vertical'){near(cross(sub(P.C,P.O),sub(P.D,P.O)),0,'opposite second rays');assert(dot(sub(P.C,P.O),sub(P.D,P.O))<0);near(M.first,M.second,'vertical equality');}
    else near(M.first+M.second,180,'adjacent sum');
    const fixed={adjacent53:53,adjacent81:81,adjacent50:50,vertical108:108,vertical40:40};
    if(fixed[p.case]!==undefined)near(M.first,fixed[p.case],'immutable source angle');
  }
  if(s.model==='sourceTransversal'){
    const u=sub(P.R1,P.L1),v=sub(P.R2,P.L2);
    near(distance(P.P,P.L1,P.R1),0,'P lies on first line');near(distance(P.Q,P.L2,P.R2),0,'Q lies on second line');
    near(distance(P.P,P.S,P.T),0,'P lies on transversal');near(distance(P.Q,P.S,P.T),0,'Q lies on transversal');
    near(angle(P.R1,P.P,P.Q),M.first,'first transversal angle');
    const actual=M.kind==='alternate'?angle(P.L2,P.Q,P.P):M.kind==='sameSide'?angle(P.R2,P.Q,P.P):angle(P.R2,P.Q,P.T);
    near(actual,M.second,'second transversal angle');
    const between=Math.atan2(Math.abs(cross(u,v)),Math.abs(dot(u,v)))/RAD;
    near(between,M.lineAngle,'line angle derived independently');
    assert.equal(M.parallel,Math.abs(cross(u,v))<1e-7);
    if(p.case==='sameSide90'){near(M.sum,90,'given sum 90');assert(between>1);}
    else if(p.case==='sameSide50_110'){near(M.first,50,'given50');near(M.second,110,'given110');near(between,20,'nonparallel20');}
    else if(p.case==='sameSide30_120'){near(M.first,30,'given30');near(M.second,120,'given120');near(between,30,'nonparallel30');}
    else{near(between,0,'parallel conclusion follows from coordinates');near(M.first,M.second,'given equal angles');}
    if(['alternate90','corresponding90','perpendicularTransfer'].includes(p.case)){near(M.first,90,'givenright1');near(M.second,90,'givenright2');}
    if(p.case==='corresponding67'){near(M.first,67,'given67a');near(M.second,67,'given67b');}
    if(P.I){near(distance(P.I,P.L1,P.R1),0,'intersection lies on a');near(distance(P.I,P.L2,P.R2),0,'intersection lies on b');}
  }
  if(s.model==='sourceIncidence'){
    const pairs=Array.from({length:M.drawnLines},(_,i)=>[P['L'+(i+1)],P['R'+(i+1)]]);
    for(const [a,b]of pairs)assert(length(a,b)>1);
    if(p.case==='coincidentPair'){
      near(cross(sub(P.R1,P.L1),sub(P.R2,P.L2)),0,'coincident directions');
      near(distance(P.L2,P.L1,P.R1),0,'coincident location');
      for(const name of ['A','B','C'])for(const [a,b]of pairs)near(distance(P[name],a,b),0,'common marked point');
      assert(length(P.A,P.B)>0&&length(P.B,P.C)>0);assert.equal(M.markedCommonPoints,3);
    }
    if(p.case==='parallelPair'||p.case==='threeParallel')for(let i=0;i<pairs.length;i++)for(let j=i+1;j<pairs.length;j++){
      near(cross(sub(pairs[i][1],pairs[i][0]),sub(pairs[j][1],pairs[j][0])),0,'parallel directions');
      assert(distance(pairs[i][0],...pairs[j])>1,'distinct parallel locations');
    }
    if(p.case==='threeConcurrent'||p.case==='intersectingPair'){
      for(const pair of pairs)near(distance(P.O,...pair),0,'shared O');
      for(let i=0;i<pairs.length;i++)for(let j=i+1;j<pairs.length;j++)assert(Math.abs(cross(sub(pairs[i][1],pairs[i][0]),sub(pairs[j][1],pairs[j][0])))>1,'different directions');
    }
    if(p.case==='twoPoints'){
      assert(length(P.A,P.B)>=2-1e-7);near(distance(P.A,P.L1,P.R1),0,'base throughA');near(distance(P.B,P.L1,P.R1),0,'base throughB');near(distance(P.A,P.L2,P.R2),0,'probe throughA');
      near(distance(P.B,P.L2,P.R2),M.probeDistance,'probe distance');
      if(M.probeDistance<1e-7){near(cross(sub(P.R1,P.L1),sub(P.R2,P.L2)),0,'both-points lines coincide');near(distance(P.L2,P.L1,P.R1),0,'same line');}
      else assert(Math.abs(cross(sub(P.R1,P.L1),sub(P.R2,P.L2)))>1e-7,'different line misses B');
    }
  }
  if(s.model==='sourceOblique'){
    near(distance(P.A,P.L,P.R),3,'given distance 3');near(length(P.A,P.H),3,'fixed perpendicular');near(dot(sub(P.A,P.H),sub(P.R,P.L)),0,'right foot');
    near(length(P.A,P.B),M.oblique,'oblique length');assert(M.oblique>3,'counterexample preserved');near(length(P.H,P.B),p.offset,'editable projection');
  }
  if(s.model==='endpointLocus'){
    near(length(P.P,P.A),length(P.P,P.B),'P equidistant');near(length(P.Q,P.A),length(P.Q,P.B),'Q equidistant');assert(length(P.P,P.Q)>2,'distinct witnesses');
    near(length(P.A,P.M),length(P.M,P.B),'M midpoint');near(dot(sub(P.P,P.M),sub(P.B,P.A)),0,'perpendicular');
    for(const pair of ['PA','PB','QA','QB','AM','MB','PQ'])near(length(P[pair[0]],P[pair[1]]),M[pair],'distance '+pair);
  }
  if(s.model==='symmetryTransform'){
    const original=M.names.map(n=>P[n]),image=M.names.map(n=>P[n+'1']);
    // Independent normal-vector reflection, unlike the implementation's
    // tangential projection formula; midpoint equations check half-turns.
    const n=[-Math.sin(p.axisAngle*RAD),Math.cos(p.axisAngle*RAD)];
    original.forEach((q,i)=>{
      if(p.transformation==='halfTurn'){near((q[0]+image[i][0])/2,P.O[0],'turn midpoint x');near((q[1]+image[i][1])/2,P.O[1],'turn midpoint y');}
      else{const signed=dot(sub(q,P.K),n);near(image[i][0],q[0]-2*signed*n[0],'reflection x');near(image[i][1],q[1]-2*signed*n[1],'reflection y');}
    });
    for(let i=0;i<original.length;i++)for(let j=i+1;j<original.length;j++)near(length(original[i],original[j]),length(image[i],image[j]),'isometry preserves pair distance');
    let discrepancy;
    if(p.shape==='circle'){
      const r=length(P.Z,P.A);for(const v of ['A','B','C','D']){near(length(P.Z,P[v]),r,'source circle');near(length(P.Z1,P[v+'1']),r,'image circle');}
      discrepancy=length(P.Z,P.Z1);
      if(p.referenceAxes){assert(M.displayedAxes>=2);for(const entry of M.axisComparisons)near(entry.difference,2*Math.abs(entry.offset),'circle-center displacement for every tested axis');}
    }else if(p.shape==='line')discrepancy=Math.max(...image.map(q=>distance(q,...original)));
    else{
      discrepancy=Math.max(...original.map(a=>Math.min(...image.map(b=>length(a,b)))),...image.map(b=>Math.min(...original.map(a=>length(a,b)))));
      assert(triangleArea(original[0],original[1],original[2])>.1);
      const sides=original.map((a,i)=>length(a,original[(i+1)%original.length]));
      if(['equilateral','hexagon','square','rhombus'].includes(p.shape))sides.forEach(v=>near(v,sides[0],'equal sides of prescribed class'));
      if(p.shape==='isosceles')near(length(P.A,P.C),length(P.B,P.C),'isosceles class');
      if(['rectangle','square'].includes(p.shape))for(let i=0;i<4;i++)near(angle(original[(i+3)%4],original[i],original[(i+1)%4]),90,'rectangle class');
      if(p.anchor==='diagonals'){near((P.A[0]+P.C[0])/2,P.O[0],'center ACx');near((P.A[1]+P.C[1])/2,P.O[1],'center ACy');near((P.B[0]+P.D[0])/2,P.O[0],'center BDx');near((P.B[1]+P.D[1])/2,P.O[1],'center BDy');}
    }
    near(discrepancy,M.difference,'true geometric discrepancy');assert.equal(M.coincides,discrepancy<1e-7);
  }
}

test('39 approved line and symmetry cards use the intended models and immutable premises',()=>{
  assert.equal(fixtures.length,39);assert.equal(new Set(fixtures.map(f=>f.id)).size,39);
  for(const f of fixtures){const card=data.cards.find(c=>c.id===f.id);assert(card,`missing ${f.id}`);assert.equal(card.truth,f.truth);assert.equal(card.hint.model,f.model);assert.deepEqual(card.hint.params,f.params);assert.deepEqual(card.aliases,[f.id]);}
});

test('every new source experiment is valid at minima, midpoints and maxima of every control',()=>{
  for(const f of fixtures)for(const p of[f.params,...statesFor(f)]){
    const s=api.sample(f.model,p);verify(s);
    const out=api.render(f.model,p);assert(!/NaN|Infinity|undefined/.test(out.svg),`${f.id}: invalid SVG`);assert(out.readout.length>0);
    assert(!/NaN|Infinity|undefined/.test(JSON.stringify(out.readout)),`${f.id}: invalid measurement`);
  }
});

test('updates and hostile saved state cannot replace source numbers, cases or symmetry classes',()=>{
  const forbidden={case:'parallelPair',shape:'line',transformation:'reflection',anchor:'free',referenceAxes:false,angle:12,fixedAngle:12,distance:0,locked:[]};
  for(const f of fixtures){
    const initial=api.sample(f.model,f.params),controls=api.controlsFor(f.model,f.params),editable=new Set(controls.map(c=>c.key));
    for(const c of controls)for(const value of[c.min,(c.min+c.max)/2,c.max])verify(api.sample(f.model,api.updateModel(f.model,f.params,c.key,value)));
    for(const [key,value]of Object.entries(forbidden))if(!editable.has(key))assert.deepEqual(api.updateModel(f.model,f.params,key,value),initial.values,`${f.id}: illegal update ${key}`);
    const saved={...forbidden,...Object.fromEntries(controls.map(c=>[c.key,c.max+1000]))};
    const restored=api.restoreModel({model:f.model,params:f.params},{params:saved,measured:true});
    assert.equal(restored.measured,true);verify(api.sample(f.model,restored.params));
    for(const key of ['case','shape','transformation','anchor','referenceAxes'])if(Object.hasOwn(initial.values,key))assert.equal(restored.params[key],initial.values[key],`${f.id}: restored flag ${key}`);
    const invalid=api.restoreModel({model:f.model,params:f.params},{params:Object.fromEntries(controls.map(c=>[c.key,NaN]))});
    assert.deepEqual(invalid.params,initial.values,`${f.id}: invalid numeric restore`);
  }
});

test('all false statements start from actual counterexamples rather than a misleading special case',()=>{
  for(const f of fixtures.filter(f=>!f.truth)){
    const s=api.sample(f.model,f.params),P=s.points,M=s.metrics;
    if(f.model==='sourceAnglePair'){
      const alleged={adjacent_angles_sum_90:90,adjacent_53_123:123,vertical_40_140:140,adjacent_50_120:120}[f.id];
      assert(Math.abs((f.id==='adjacent_angles_sum_90'?M.sum:M.second)-alleged)>1);
    }else if(f.model==='sourceTransversal')assert(M.lineAngle>1);
    else if(f.model==='sourceOblique')assert(M.oblique>3);
    else if(f.model==='endpointLocus')assert(length(P.P,P.Q)>0&&Math.abs(M.PA-M.PB)<1e-7&&Math.abs(M.QA-M.QB)<1e-7);
    else if(f.model==='sourceIncidence'){
      const expected={any_two_lines_exactly_one_common_point:'parallel',two_lines_at_most_one_common_point:'coincident',two_distinct_points_multiple_lines:'coincident',three_lines_at_least_one_common_point:'parallel',any_two_lines_more_than_one_common_point:'one',three_lines_one_common_point:'parallel'}[f.id];
      if(expected)assert.equal(M.intersectionKind,expected,f.id);else assert.equal(M.drawnLines,3);
    }else if(f.model==='symmetryTransform'){
      if(['isosceles_has_central_symmetry','equilateral_has_central_symmetry'].includes(f.id))assert(M.difference>.1);
      else if(f.id==='circle_exactly_two_symmetry_axes')assert.equal(M.matchingDisplayedAxes,3);
      else near(M.difference,0,'witness of existing symmetry');
    }else assert.fail(`unreviewed false case ${f.id}`);
  }
});

test('reflection-axis counts are obtained by actual overlays; circles and lines are not finite point clouds',()=>{
  for(const [shape,count]of[['equilateral',3],['square',4],['hexagon',6]]){
    const matching=[];for(let a=0;a<180;a++)if(api.sample('symmetryTransform',{shape,transformation:'reflection',axisAngle:a,axisOffset:0}).metrics.difference<1e-7)matching.push(a);
    assert.equal(matching.length,count,`${shape}: ${matching}`);
  }
  for(const angleValue of[0,17,41,67,90,143,179]){
    near(api.sample('symmetryTransform',{shape:'circle',axisAngle:angleValue,axisOffset:0}).metrics.difference,0,'every circle diameter axis');
    near(api.sample('symmetryTransform',{shape:'circle',axisAngle:angleValue,axisOffset:1.2}).metrics.difference,2.4,'shifted reflection changes full circle');
  }
  for(const offset of[-1.5,-.7,0,.8,1.5])near(api.sample('symmetryTransform',{shape:'line',axisAngle:90,axisOffset:offset}).metrics.difference,0,'any perpendicular preserves infinite line');
  near(api.sample('symmetryTransform',{shape:'line',axisAngle:0,axisOffset:0}).metrics.difference,0,'line itself is an axis');
  assert(api.sample('symmetryTransform',{shape:'line',axisAngle:30,axisOffset:0}).metrics.difference>1);
  for(const shape of ['isosceles','equilateral'])for(const x of [-1.5,-.75,0,.75,1.5])for(const y of [-1.5,-.75,0,.75,1.5])assert(api.sample('symmetryTransform',{shape,transformation:'halfTurn',centerX:x,centerY:y}).metrics.difference>.1);
});

test('every attainable line-symmetry angle and offset visibly move the axis within a stationary world frame',()=>{
  const cards=fixtures.filter(f=>f.model==='symmetryTransform'&&f.params.shape==='line');assert.equal(cards.length,2);
  const coords=tag=>['x1','y1','x2','y2'].map(name=>Number(tag.match(new RegExp('\\b'+name+'="([^"]+)"'))[1]));
  let stationaryLine,scale,checked=0;
  for(let degrees=0;degrees<=180;degrees++){
    let previous;
    for(let step=0;step<=30;step++){
      const params={...cards[0].params,axisAngle:degrees,axisOffset:-1.5+step/10},output=api.render('symmetryTransform',params);
      verify(output.sample);
      const lines=[...output.svg.matchAll(/<line\b[^>]*\/>/g)].map(m=>coords(m[0]));assert.equal(lines.length,3,'both complete lines and the test axis');
      const source=lines[0];
      if(!stationaryLine)stationaryLine=source;
      source.forEach((value,i)=>near(value,stationaryLine[i],'source line stays fixed on screen'));
      const axisGroup=output.svg.match(/<g\b[^>]*data-geometry-group="transformation-axis"[^>]*>([\s\S]*?)<\/g>/);assert(axisGroup);
      const axis=coords(axisGroup[1]),a=axis.slice(0,2),b=axis.slice(2),center=[(a[0]+b[0])/2,(a[1]+b[1])/2],axisLength=length(a,b);
      if(!scale)scale=axisLength/8.6;
      near(axisLength/8.6,scale,'scale does not follow axis or image movement');
      assert(scale>10,'a control step causes visible screen movement');
      for(const point of[a,b])assert(point[0]>=60&&point[0]<=500&&point[1]>=64&&point[1]<=240,'whole axis remains in the reserved drawing window');
      near(Math.abs(cross(sub(b,a),[Math.cos(degrees*RAD),-Math.sin(degrees*RAD)])),0,'displayed axis has the actual direction');
      if(previous){
        near(length(center,previous),scale*.1,'each offset step visibly translates the axis');
        near(dot(sub(center,previous),sub(b,a)),0,'translation is perpendicular to the test axis');
      }
      previous=center;checked++;
    }
  }
  assert.equal(checked,181*31);
  for(const card of cards){
    const end=api.render(card.model,{...card.params,axisOffset:1.5}),start=api.render(card.model,{...card.params,axisOffset:-1.5});
    assert.notEqual(end.svg,start.svg,card.id+': perpendicular-axis movement remains visible');
    near(end.sample.metrics.difference,0,'translated perpendicular still preserves the infinite line');
    near(start.sample.metrics.difference,0,'opposite translated perpendicular also preserves the infinite line');
  }
});

test('symmetry legends stay readable and clear of the full figure and labels at every control boundary',()=>{
  const {JSDOM}=require('jsdom'),dom=new JSDOM('<!doctype html><div id="host"></div>'),host=dom.window.document.getElementById('host');
  const symmetry=fixtures.filter(f=>f.model==='symmetryTransform');assert.equal(symmetry.length,12);let checked=0;
  try{for(const f of symmetry)for(const params of[f.params,...statesFor(f)]){
    host.innerHTML=api.render(f.model,params).svg;
    const figure=host.querySelector('[data-symmetry-figure]'),legend=host.querySelector('[data-symmetry-legend]');
    assert(figure&&figure.children.length>0&&legend,`${f.id}: complete figure and separate legend`);
    const size=Number(legend.getAttribute('font-size')),legendY=Number(legend.getAttribute('y'));
    assert(size>=24,`${f.id}: legible legend type`);
    assert.match(legend.textContent,/Сплошная.*фигура.*пунктир.*образ/);
    const legendTop=legendY-.75*size;
    assert(legendY+.75*size<=340,`${f.id}: legend stays inside the SVG`);
    for(const label of figure.querySelectorAll('text')){
      // A conservative full glyph envelope, including the white outline of O,
      // detects the original collision without relying on JSDOM text metrics.
      const y=Number(label.getAttribute('y')),font=Number(label.getAttribute('font-size')),stroke=Number(label.getAttribute('stroke-width')||0);
      assert(Number.isFinite(y)&&font>0,`${f.id}: finite label`);
      assert(y+.75*font+stroke/2<=legendTop-4,`${f.id}: ${label.textContent} overlaps the legend strip`);
    }
    for(const shape of figure.querySelectorAll('polygon,line,circle')){
      let bottom;
      if(shape.tagName==='polygon')bottom=Math.max(...shape.getAttribute('points').trim().split(/\s+/).map(p=>Number(p.split(',')[1])));
      else if(shape.tagName==='line')bottom=Math.max(Number(shape.getAttribute('y1')),Number(shape.getAttribute('y2')));
      else bottom=Number(shape.getAttribute('cy'))+Number(shape.getAttribute('r'));
      bottom+=Number(shape.getAttribute('stroke-width')||0)/2;
      const clipped=shape.closest('[clip-path]');
      if(clipped){
        const id=clipped.getAttribute('clip-path').match(/^url\(#([^)]+)\)$/)?.[1],clip=host.querySelector('clipPath[id="'+id+'"] rect');
        assert(clip,`${f.id}: real line clipping region`);bottom=Math.min(bottom,Number(clip.getAttribute('y'))+Number(clip.getAttribute('height')));
      }
      assert(Number.isFinite(bottom)&&bottom<=250,`${f.id}: drawing intrudes into reserved label/legend area`);
    }
    checked++;
  }}finally{dom.window.close();}
  assert(checked>150,'all twelve initial states and Cartesian control boundaries are covered');
});

test('all historical line/polygon samples, controls and renders are byte-for-byte unchanged',()=>{
  const historical=['lineRelations','lineThroughPoint','bisectorDistance','detachedAngles','acuteAdjacent','squareMeasure','quadrilateralExplore','diagonalOverlay','polygonFan','coordinateMeasure','rhombusArea','equalPerimeters'];
  const hash=crypto.createHash('sha256');let count=0;
  for(const card of data.cards.slice(0,244).filter(c=>historical.includes(c.hint.model))){const h=card.hint,controls=api.controlsFor(h.model,h.params),states=controls.reduce((rows,c)=>rows.flatMap(p=>[c.min,c.max].map(v=>({...p,[c.key]:v}))),[{...h.params}]);
    for(const p of[h.params,...states]){hash.update(JSON.stringify([card.id,api.sample(h.model,p),api.controlsFor(h.model,p),api.render(h.model,p)]));count++;}
  }
  assert.equal(count,183);assert.equal(hash.digest('hex'),'4e0a99e99c711eb61d996d60ee2d8bc664b0fc82f0bad655d792953a0bde2c35');
});

test('all 39 mounted experiments keep measurements hidden until requested and draw full symmetry images',()=>{
  const {JSDOM}=require('jsdom'),dom=new JSDOM('<!doctype html><div id="host"></div>'),host=dom.window.document.getElementById('host');
  for(const f of fixtures){
    let saved;
    const cleanup=api.mount(host,{model:f.model,params:f.params,prompt:'Исследуй рисунок',observe:'Сравни измерения',preserve:'Условия сохранены'},{onChange:state=>{saved=state;}});
    assert.equal(host.querySelector('.t19-model-readout').hidden,true,f.id);
    assert.equal(host.querySelector('.t19-observe').hidden,true,f.id);
    assert.equal(host.querySelector('.t19-measure').getAttribute('aria-expanded'),'false',f.id);
    if(f.model==='symmetryTransform'){
      if(f.params.shape==='circle')assert(host.querySelectorAll('svg circle').length>=4,'both complete circles and their centers');
      else if(f.params.shape!=='line')assert.equal(host.querySelectorAll('svg polygon').length,2,'complete original and transformed polygons');
      else assert(host.querySelectorAll('svg line').length>=3,'both infinite lines plus reflection axis');
    }
    host.querySelector('.t19-measure').click();assert.equal(host.querySelector('.t19-model-readout').hidden,false);assert(saved.measured);
    for(const input of host.querySelectorAll('input[type="range"]')){
      input.value=input.max;input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
      verify(api.sample(f.model,api.restoreModel({model:f.model,params:f.params},saved).params));
    }
    cleanup();assert.equal(host.children.length,0);
  }
  dom.window.close();
});
