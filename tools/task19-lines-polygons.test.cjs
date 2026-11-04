'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const stage=fs.existsSync(path.join(__dirname,'task19-models-lines-polygons.js'));
const source=stage?path.join(__dirname,'task19-models-lines-polygons.js'):path.join(__dirname,'../trainers/task19-models-lines-polygons.js');
const RAD=Math.PI/180,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),sub=(p,q)=>[p[0]-q[0],p[1]-q[1]],cross=(p,q)=>p[0]*q[1]-p[1]*q[0],dot=(p,q)=>p[0]*q[0]+p[1]*q[1],length=(p,q)=>Math.hypot(...sub(p,q));
const angle=(a,o,b)=>Math.atan2(Math.abs(cross(sub(a,o),sub(b,o))),dot(sub(a,o),sub(b,o)))/RAD;
const area=ps=>Math.abs(ps.reduce((a,p,i)=>a+cross(p,ps[(i+1)%ps.length]),0))/2;
const defs=require(source)({RAD,clamp,hypot:length,mid:(p,q)=>[(p[0]+q[0])/2,(p[1]+q[1])/2],angleAt:angle});
const hints=stage?require('./polygon-hints.json'):Object.fromEntries(require('../trainers/task19-visual-data.js').cards.filter(c=>Object.hasOwn(defs,c.hint.model)).map(c=>[c.id,c.hint]));
const near=(a,b,label)=>assert(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-7,`${label}: ${a} vs ${b}`);
function sample(model,params){const def=defs[model];let p={...def.values,...params};for(const[k,,lo,hi]of(def.controlsFor?.(p)||def.controls))p[k]=clamp(p[k],lo,hi);if(def.normalize)p=def.normalize(p);return{...def.sample(p),values:p};}
function finite(s){for(const v of Object.values(s.points))for(const n of v)assert(Number.isFinite(n));const check=v=>{if(typeof v==='number')assert(Number.isFinite(v));else if(v&&typeof v==='object')Object.values(v).forEach(check);};check(s.metrics);}
function measure(s,model){const P=s.points,M=s.metrics,V=s.values;finite(s);
 if(model==='squareMeasure'){near(area([P.A,P.B,P.C,P.D]),M.area,'square area');near(length(P.A,P.B),length(P.B,P.C),'square sides');near(angle(P.A,P.B,P.C),90,'square angle');near(length(P.A,P.C),M.diagonal,'square diagonal');}
 if(model==='quadrilateralExplore'){const ps=[P.A,P.B,P.C,P.D],turns=ps.map((p,i)=>cross(sub(ps[(i+1)%4],p),sub(ps[(i+2)%4],ps[(i+1)%4])));assert(turns.every(v=>v>0)||turns.every(v=>v<0),'convex quadrilateral');near(area(ps),M.area,'quad area');if(V.mode==='orthodiagonal'){near(length(P.A,P.C),length(P.B,P.D),'equal diagonals');near(dot(sub(P.C,P.A),sub(P.D,P.B)),0,'perpendicular diagonals');}if(V.mode==='hinge'||V.mode==='cyclic'){near(length(P.A,P.B),6,'fixed base');near(length(P.A,P.D),4,'fixed side');}if(V.mode==='cyclic'){for(const n of['A','B','D'])near(length(P.O,P[n]),M.radius,'circle through vertices');near(length(P.O,P.C),M.OC,'fourth vertex radius');}}
 if(model==='diagonalOverlay'){near(length(P.A,P.B),length(P.E,P.F),'rotation preserves first side');near(length(P.B,P.C),length(P.F,P.G),'rotation preserves second side');near(area([P.E,P.F,P.G]),area([P.A,P.C,P.D]),'two equal areas');if(V.turn===1){near(length(P.E,P.C),0,'A overlays C');near(length(P.F,P.D),0,'B overlays D');near(length(P.G,P.A),0,'C overlays A');}}
 if(model==='polygonFan'){const ps=Object.values(P);near(M.sum,(ps.length-2)*180,'polygon angles from coordinates');if(V.mode==='regular')for(let i=1;i<ps.length;i++)near(length(ps[i],ps[(i+1)%ps.length]),length(ps[0],ps[1]),'regular sides');}
 if(model==='rhombusArea'){near(area([P.A,P.B,P.C,P.D]),M.area,'rhombus area');near(length(P.A,P.B),length(P.B,P.C),'rhombus sides');near(dot(sub(P.C,P.A),sub(P.D,P.B)),0,'rhombus diagonals');}
 if(model==='equalPerimeters'){near(length(P.A,P.B)+length(P.B,P.C)+length(P.C,P.D)+length(P.D,P.A),24,'fixed perimeter');near(area([P.A,P.B,P.C,P.D]),M.area,'changing area');}
 if(model==='bisectorDistance'){if(V.mode==='angle'){near(angle(P.A,P.O,P.P),angle(P.P,P.O,P.B),'angle bisected');near(dot(sub(P.P,P.H),sub(P.A,P.O)),0,'first perpendicular');near(dot(sub(P.P,P.K),sub(P.B,P.O)),0,'second perpendicular');near(length(P.P,P.H),length(P.P,P.K),'two distances');}else{near(length(P.A,P.M),length(P.M,P.B),'midpoint');near(dot(sub(P.P,P.M),sub(P.B,P.A)),0,'perpendicular bisector');near(length(P.P,P.A),length(P.P,P.B),'endpoint distances');}}
 if(model==='coordinateMeasure'){near(length(P.A,P.B),M.length,'measured distance');near(length(P.A,P.M),length(P.M,P.B),'midpoint distances');}
 if(model==='lineThroughPoint'){near(Math.abs(cross(sub(P.B,P.U),sub(P.V,P.U)))/length(P.U,P.V),M.distance,'point to rotating line');near(cross(sub(P.P,P.U),sub(P.V,P.U)),0,'line through P');}
 if(model==='detachedAngles'){near(angle(P.A,P.O,P.B),M.first,'first detached angle');near(angle(P.C,P.P,P.D),M.second,'second detached angle');assert(length(P.O,P.P)>0);}
 if(model==='acuteAdjacent'){assert(angle(P.B,P.O,P.C)<90);near(angle(P.B,P.O,P.C),M.alpha,'acute angle');near(angle(P.C,P.O,P.A),M.beta,'adjacent angle');}
}

test('all assigned new families preserve their hypotheses at every control corner',()=>{
 const exercised=new Set();for(const h of Object.values(hints)){if(!defs[h.model])continue;exercised.add(h.model);const initial=sample(h.model,h.params),d=defs[h.model],controls=d.controlsFor?.(initial.values)||d.controls;const variants=controls.reduce((list,[k,,lo,hi])=>list.flatMap(p=>[{...p,[k]:lo},{...p,[k]:hi}]),[{...h.params}]);for(const p of[h.params,...variants])measure(sample(h.model,p),h.model);}
 assert.equal(exercised.size,Object.keys(defs).length);
});

test('fixed equal diagonals can be perpendicular without making a square',()=>{
 const {points:P}=sample('quadrilateralExplore',{mode:'orthodiagonal',a:3,b:5});assert(Math.abs(length(P.A,P.B)-length(P.B,P.C))>.1);
});

test('one perimeter produces unequal areas and square controls change real size',()=>{
 const a=sample('equalPerimeters',{width:6}),b=sample('equalPerimeters',{width:9});near(a.metrics.perimeter,b.metrics.perimeter,'same perimeter');assert.notEqual(a.metrics.area,b.metrics.area);
 const small=sample('squareMeasure',{side:2}),large=sample('squareMeasure',{side:6});assert.notEqual(length(small.points.A,small.points.B),length(large.points.A,large.points.B));
});
