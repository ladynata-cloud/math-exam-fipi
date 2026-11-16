'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const root=process.env.TASK19_TEST_ROOT||path.resolve(__dirname,'..');
const api=require(path.join(root,'trainers/task19-visual-models.js'));
const data=require(path.join(root,'trainers/task19-visual-data.js'));
const ids=['rectangle_diagonal_pythagoras','nonrectangle_parallelogram_exists','rectangle_diagonals_squares_sum_equals_sides','trapezoid_area_midline_times_height','orthodiagonal_quadrilateral_is_rhombus','no_rectangle_perpendicular_diagonals','nonparallelogram_rectangle_exists','nonsquare_rhombus_exists','square_diagonals_bisect','nonrhombus_square_exists','rectangle_all_angles_equal','trapezoid_perpendicular_diagonals_exists','parallelogram_opposite_angles_equal','rectangle_not_square_exists','convex_quadrilateral_angle_sum_180','parallelogram_adjacent_angles_sum_180','rhombus_all_sides_parallel','rhombus_opposite80_100','trapezoid_equal_diagonals_isosceles','quadrilateral_opposite_pair_equal_parallel','quadrilateral_two_equal_angles_parallelogram','convex_quad_three_sum220_fourth130','all_rhombi_cyclic','any_trapezoid_two_equal_angles','trapezoid_midline_equal_areas','cyclic_quadrilateral_opposite_side_sums_equal','tangential_quadrilateral_opposite_side_sums_equal','parallelogram_diagonals_square_sum'];
const cards=ids.map(id=>data.cards.find(c=>c.id===id));
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1],cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
const length=v=>Math.hypot(...v),distance=(a,b)=>length(sub(a,b));
const near=(a,b,label)=>assert(Math.abs(a-b)<1e-7*Math.max(1,Math.abs(a),Math.abs(b)),`${label}: ${a} ≈ ${b}`);
const angle=(a,v,b)=>Math.atan2(Math.abs(cross(sub(a,v),sub(b,v))),dot(sub(a,v),sub(b,v)))*180/Math.PI;
const area=pts=>Math.abs(pts.reduce((s,p,i)=>s+cross(p,pts[(i+1)%pts.length]),0))/2;
const parallel=(a,b,c,d)=>near(cross(sub(b,a),sub(d,c))/(distance(a,b)*distance(c,d)),0,'parallel');
const perpendicular=(a,b,c,d)=>near(dot(sub(b,a),sub(d,c))/(distance(a,b)*distance(c,d)),0,'perpendicular');
const names=['A','B','C','D'];
function checkCoordinates(s){
 const {points:P,metrics:M,values:p}=s,vertices=names.map(n=>P[n]);
 for(const n of Object.values(P))assert(n.length===2&&n.every(Number.isFinite),'finite point');
 const turns=vertices.map((a,i)=>cross(sub(vertices[(i+1)%4],a),sub(vertices[(i+2)%4],vertices[(i+1)%4])));
 assert(turns.every(t=>t>1e-6)||turns.every(t=>t< -1e-6),'strictly convex, simple quadrilateral');
 names.forEach((n,i)=>{near(M[n+names[(i+1)%4]],distance(P[n],P[names[(i+1)%4]]),'side');near(M.angles[i],angle(P[names[(i+3)%4]],P[n],P[names[(i+1)%4]]),'angle');near(M[n+'J'],distance(P[n],P.J),'diagonal part');});
 near(M.AC,distance(P.A,P.C),'AC');near(M.BD,distance(P.B,P.D),'BD');near(M.area,area(vertices),'area');
 near(cross(sub(P.J,P.A),sub(P.C,P.A)),0,'J on AC');near(cross(sub(P.J,P.B),sub(P.D,P.B)),0,'J on BD');
 near(M.AJ+M.CJ,M.AC,'J inside AC');near(M.BJ+M.DJ,M.BD,'J inside BD');near(M.angleSum,360,'angle sum');
 if(['parallelogram','rectangle','rhombus'].includes(p.kind)){parallel(P.A,P.B,P.D,P.C);parallel(P.A,P.D,P.B,P.C);near(M.AJ,M.CJ,'diagonal bisects AC');near(M.BJ,M.DJ,'diagonal bisects BD');near(M.diagonalSquareSum,M.sideSquareSum,'parallelogram identity');}
 if(p.kind==='rectangle')M.angles.forEach(a=>near(a,90,'rectangle right angles'));
 if(p.kind==='rhombus'||p.constraint==='square')for(const side of ['BC','CD','DA'])near(M.AB,M[side],'equal sides');
 if(p.constraint==='angle80')near(M.angles[0],80,'fixed 80-degree premise');
 if(p.constraint==='three-angles-220')near(M.angles.slice(0,3).reduce((a,b)=>a+b,0),220,'fixed sum 220-degree premise');
 if(p.kind==='orthodiagonal')perpendicular(P.A,P.C,P.B,P.D);
 if(p.kind==='trapezoid'){
  parallel(P.A,P.B,P.D,P.C);assert(Math.abs(M.AB-M.CD)>.99,'exactly one parallel pair');
  for(let i=0;i<2;i++){near(P.E[i],(P.A[i]+P.D[i])/2,'E midpoint');near(P.F[i],(P.B[i]+P.C[i])/2,'F midpoint');}
  near(M.midline,distance(P.E,P.F),'midline');near(M.height,distance(P.D,P.H),'height');perpendicular(P.D,P.H,P.A,P.B);
  near(M.area,M.midline*M.height,'midline area');near(M.lowerArea,area([P.A,P.B,P.F,P.E]),'lower polygon area');near(M.upperArea,area([P.E,P.F,P.C,P.D]),'upper polygon area');near(M.lowerArea+M.upperArea,M.area,'parts partition area');
  if(p.constraint==='equal-diagonals'){near(distance(P.A,P.C),distance(P.B,P.D),'equal diagonals premise');near(M.AD,M.BC,'isosceles conclusion');}
  if(p.constraint==='equal-base-angles')near(M.angles[0],M.angles[1],'two equal angles premise');
  if(p.constraint==='perpendicular-diagonals')perpendicular(P.A,P.C,P.B,P.D);
 }
 if(p.kind==='cyclic')for(const n of names)near(distance(P.O,P[n]),p.radius,'all four vertices on circle');
 if(p.kind==='tangential')for(let i=0;i<4;i++){
  const a=vertices[i],b=vertices[(i+1)%4],v=sub(b,a),t=dot(sub(P.O,a),v)/dot(v,v),foot=[a[0]+t*v[0],a[1]+t*v[1]];
  assert(t>0&&t<1,'tangency point belongs to side segment');near(distance(P.O,foot),p.radius,'each side tangent to same internal circle');
 }
 if(p.kind==='tangential')near(M.AB+M.CD,M.BC+M.DA,'equal opposite side sums');
 if(p.focus==='circumcircle'){for(const n of ['A','B','D'])near(distance(P.O,P[n]),M.radius,'three vertices define circle');}
}
function states(card){
 const h=card.hint,base=api.sample(h.model,h.params).values,controls=api.controlsFor(h.model,base),out=[base];
 for(const c of controls)for(const v of [c.min,(c.min+c.max)/2,c.max])out.push(api.updateModel(h.model,base,c.key,v));
 for(let mask=0;mask<2**controls.length;mask++){let p=base;controls.forEach((c,i)=>{p=api.updateModel(h.model,p,c.key,mask&(1<<i)?c.max:c.min);});out.push(p);}
 const hostile={params:{kind:'rectangle',constraint:'',focus:'sides',angle:90,side:0,width:0,height:0,radius:-100,rotation:Infinity,bearingB:NaN,bearingC:999,bearingD:-999,left:-10,right:999,up:999,down:-999,offset:99,top:999},measured:true};
 out.push(api.restoreModel(h,hostile).params);
 return out;
}
test('all 28 approved quadrilateral cards have the exact constrained model',()=>{
 assert.equal(cards.filter(Boolean).length,28);assert.equal(new Set(cards.map(c=>c.id)).size,28);
 cards.forEach(c=>assert.equal(c.hint.model,'examQuadrilateral',c.id));
});
test('independent coordinates preserve all premises through endpoints, corners, updates and hostile restore',()=>{
 for(const card of cards){assert(card);for(const p of states(card)){const s=api.sample(card.hint.model,p);checkCoordinates(s);const r=api.render(card.hint.model,p);assert(!/NaN|Infinity|undefined/.test(r.svg),card.id);assert(r.readout.length>0,card.id);}}
});
test('every editable quadrilateral control changes the actual drawing',()=>{
 for(const card of cards){const h=card.hint,before=api.render(h.model,h.params).svg,controls=api.controlsFor(h.model,h.params);assert(controls.length>0,card.id);for(const c of controls){const v=c.value===c.max?c.min:c.max;assert.notEqual(api.render(h.model,api.updateModel(h.model,h.params,c.key,v)).svg,before,`${card.id}: ${c.key}`);}}
});
test('every named endpoint of the orthodiagonal length controls is labelled on the drawing',()=>{
 const card=cards.find(c=>c.id==='orthodiagonal_quadrilateral_is_rhombus');
 for(const p of states(card)){
  const rendered=api.render(card.hint.model,p),labels=[...rendered.svg.matchAll(/<text\b[^>]*>([^<]+)<\/text>/g)].map(m=>m[1]);
  const parts=api.controlsFor(card.hint.model,p).map(c=>c.label.match(/^Отрезок ([ABCDJ]{2})$/)?.[1]).filter(Boolean);
  assert.deepEqual(parts,['AJ','JC','BJ','JD']);
  for(const name of new Set(parts.join('')))assert.equal(labels.filter(label=>label===name).length,1,`${name}: one visible endpoint label`);
 }
});
test('false claims start with counterexamples and existential true claims start with witnesses',()=>{
 const sample=id=>{const c=cards.find(c=>c.id===id);return api.sample(c.hint.model,c.hint.params);};
 const m=id=>sample(id).metrics,notEqualSides=M=>new Set(['AB','BC','CD','DA'].map(k=>M[k].toFixed(6))).size>1;
 assert(notEqualSides(m('orthodiagonal_quadrilateral_is_rhombus')));
 near(m('no_rectangle_perpendicular_diagonals').diagonalAngle,90,'rectangle counterexample');
 assert(!m('nonrectangle_parallelogram_exists').angles.every(x=>Math.abs(x-90)<1e-7));
 assert(!m('nonsquare_rhombus_exists').angles.every(x=>Math.abs(x-90)<1e-7));
 assert(notEqualSides(m('rectangle_not_square_exists')));
 near(m('trapezoid_perpendicular_diagonals_exists').diagonalAngle,90,'trapezoid witness');
 near(m('convex_quadrilateral_angle_sum_180').angleSum,360,'wrong 180');
 near(m('rhombus_opposite80_100').angles[2],80,'opposite angle is not 100');
 assert(Math.abs(m('quadrilateral_two_equal_angles_parallelogram').parallelADBC)>.1);
 near(m('convex_quad_three_sum220_fourth130').angles[3],140,'fourth angle is not 130');
 const cyclic=m('all_rhombi_cyclic');assert(Math.abs(cyclic.centerDistances[2]-cyclic.radius)>1);
 assert.equal(new Set(m('any_trapezoid_two_equal_angles').angles.map(x=>x.toFixed(6))).size,4);
 const parts=m('trapezoid_midline_equal_areas');near(parts.lowerArea,9,'lower example area');near(parts.upperArea,6,'upper example area');
 const sums=m('cyclic_quadrilateral_opposite_side_sums_equal');assert(Math.abs(sums.oppositeSum1-sums.oppositeSum2)>.1);
});

test('angle arcs and segment ticks express actual equalities, including diagonal halves versus sides',()=>{
 for(const card of cards){
  const svg=api.render(card.hint.model,card.hint.params).svg;
  const arcs=[...svg.matchAll(/<g data-geometry-mark="angle" data-angle="([^"]+)">([\s\S]*?)<\/g>/g)].map(m=>({angle:Number(m[1]),style:(m[2].match(/<path/g)||[]).length+'|'+[...m[2].matchAll(/stroke="([^"]+)"/g)].map(x=>x[1]).join(',')}));
  for(let i=0;i<arcs.length;i++)for(let j=i+1;j<arcs.length;j++)assert.equal(arcs[i].style===arcs[j].style,Math.abs(arcs[i].angle-arcs[j].angle)<1e-7,card.id+': arc symbols agree exactly for equal angles');
 }
 const card=cards.find(c=>c.id==='square_diagonals_bisect'),svg=api.render(card.hint.model,card.hint.params).svg;
 const ticks=[...svg.matchAll(/<g data-geometry-mark="equal-segment">([\s\S]*?)<\/g>/g)].map(m=>(m[1].match(/<line/g)||[]).length+'|'+[...m[1].matchAll(/stroke="([^"]+)"/g)].map(x=>x[1]).join(','));
 assert.equal(ticks.length,8);assert.equal(new Set(ticks.slice(0,4)).size,1,'all four square sides share a mark');assert.equal(new Set(ticks.slice(4)).size,1,'all four half-diagonals share a mark');assert.notEqual(ticks[0],ticks[4],'a square side is not a half-diagonal');
});
