'use strict';
// Independent source regressions: Atanasyan 2024, III §2, theory32–34 and254–270.
// Source printed72–75,77–78 / PDF74–77,79–80; original PDF SHA256:
// bead97a383e438b32b9caaff72d61d27e8fa6cd20c6b86a5f234bc4cdb629770.
// CLI: node this-file.cjs [bundle.json], or PYRAMID_BUNDLE_PATH.
// require(...).run(arrayOrBundle) returns a result; requiring has no side effects.
// Geometry checks test displayed examples. Text guards protect required outcomes,
// not the truth of arbitrary prose; independent source/proof and visual reviews
// remain necessary. No card hash snapshot or publication status is required here.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const add=(a,b)=>a.map((x,i)=>x+b[i]),sub=(a,b)=>a.map((x,i)=>x-b[i]),mul=(a,t)=>a.map(x=>x*t);
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],norm=a=>Math.hypot(...a);
const near=(a,b,label='value')=>assert(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(a),Math.abs(b)),`${label}: ${a} != ${b}`);
const same=(a,b,label)=>{assert(a&&b,label);assert.equal(a.length,b.length);a.forEach((x,i)=>near(x,b[i],label));};
const vec=(p,a,b)=>sub(p[b],p[a]),dist=(p,a,b)=>norm(vec(p,a,b));
const cosine=(a,b)=>dot(a,b)/norm(a)/norm(b),perp=(a,b,label)=>near(cosine(a,b),0,label),parallel=(a,b,label)=>near(norm(cross(a,b))/norm(a)/norm(b),0,label);
const mid=(a,b)=>mul(add(a,b),.5),mean=ps=>mul(ps.reduce(add,[0,0,0]),1/ps.length);
const polygonVector=(p,b)=>b.slice(1,-1).reduce((s,a,i)=>add(s,cross(vec(p,b[0],a),vec(p,b[0],b[i+2]))),[0,0,0]);
const area=(p,b)=>norm(polygonVector(p,b))/2,normal=(p,b)=>{const n=polygonVector(p,b);assert(norm(n)>1e-9,'nonzero polygon normal');return mul(n,1/norm(n));};
const perimeter=(p,b)=>b.reduce((s,a,i)=>s+dist(p,a,b[(i+1)%b.length]),0);
const foot=(q,a,b)=>{const d=sub(b,a);return add(a,mul(d,dot(sub(q,a),d)/dot(d,d)));};
const parameter=(q,a,b)=>dot(sub(q,a),sub(b,a))/dot(sub(b,a),sub(b,a));
const projected=(p,b,apex)=>{const n=normal(p,b);return sub(p[apex],mul(n,dot(vec(p,b[0],apex),n)));};
const height=(p,b,apex)=>norm(sub(p[apex],projected(p,b,apex)));
const lateral=(p,b,apex)=>b.reduce((s,a,i)=>s+area(p,[apex,a,b[(i+1)%b.length]]),0);
const cyclekey=a=>[a,[...a].reverse()].flatMap(q=>q.map((_,i)=>q.slice(i).concat(q.slice(0,i)).join('|'))).sort()[0];
const equal=(xs,label)=>xs.forEach(x=>near(x,xs[0],label));
const narrative=l=>JSON.stringify([l.statement,l.steps,l.help,l.answer]).normalize('NFKC').replace(/\s+/g,'');
const contains=(l,regex,label)=>assert(regex.test(narrative(l)),l.id+' '+label);
const pts=l=>l.visualization.model.points;
function run(input){
 const lessons=Array.isArray(input)?input:input?.lessons;assert(Array.isArray(lessons),'expected lesson array or {lessons}');
 const get=id=>{const found=lessons.filter(l=>l.id===id);assert.equal(found.length,1,'one '+id);return found[0];};
 const ex=(n,s='')=>get('ex-main-'+String(n).padStart(4,'0')+(s?'-'+s:''));
 const parts={254:['а','б','в','г','д'],255:[''],256:['а','б','в','г'],257:[''],258:[''],259:[''],260:['а','б'],261:[''],262:[''],263:['а','б'],264:[''],265:[''],266:[''],267:[''],268:[''],269:[''],270:['']};
 const letters={'а':'a','б':'b','в':'c','г':'d','д':'e'};
 const theory={'theory-032':['32','definitions',[72,73]],'theory-033':['33','properties',[73,74]],'theory-033-area':['33','area',[74]],'theory-034':['34','definitions',[74,75]],'theory-034-regular':['34','regular',[75]],'theory-034-area':['34','area',[75]]};
 const ids=[...Object.keys(theory),...Object.entries(parts).flatMap(([n,ss])=>ss.map(s=>'ex-main-'+n.padStart(4,'0')+(s?'-'+letters[s]:'')))];
 const cards=ids.map(get),checks=[];
 const check=(name,fn)=>{try{fn();}catch(e){e.message=name+': '+e.message;throw e;}checks.push(name);};
 const exact=(l,answer)=>{assert.equal(l.answer.mode,'exact',l.id);assert.deepEqual([...new Set(l.answer.accepted)],[answer],l.id+' only independently derived accepted answer');};
 const regular=(l,b,apex='S')=>{const p=pts(l),o=mean(b.map(a=>p[a]));equal(b.map((a,i)=>dist(p,a,b[(i+1)%b.length])),l.id+' equal base sides');equal(b.map(a=>norm(sub(p[a],o))),l.id+' equal circumradii');same(projected(p,b,apex),o,l.id+' centered height');if(p.O)same(p.O,o,l.id+' displayed base center and height foot');equal(b.map(a=>dist(p,apex,a)),l.id+' equal lateral edges');assert(height(p,b,apex)>1e-6);return p;};
 const shape=l=>{
  if(l.id.startsWith('theory-'))return {b:['A1','A2','A3','A4'],apex:'P',top:l.source.point==='34'?['B1','B2','B3','B4']:null};
  const n=Number(l.source.exercise),b=[262,264].includes(n)?['A','B','C','D','E','F']:[256,258,259,263,266,267,268].includes(n)?['A','B','C','D']:['A','B','C'];
  return {b,apex:n===260?'D':n===263?'M':'S',top:n>=268?b.map(a=>a+'1'):null};
 };
 function simplePlanar(p,b,label){
  assert(b.length>=3&&new Set(b).size===b.length,label+' distinct polygon vertices');b.forEach(a=>assert(p[a],label+' missing point '+a));
  const n=normal(p,b);for(const a of b)near(dot(vec(p,b[0],a),n),0,label+' planar');
  // For nonadjacent edges, signed orientation detects crossings; projections
  // onto the polygon plane also detect touching/overlapping nonadjacent edges.
  const orient=(a,z,q)=>dot(cross(vec(p,a,z),vec(p,a,q)),n);
  const on=(a,z,q)=>Math.abs(orient(a,z,q))<1e-9&&parameter(p[q],p[a],p[z])>=-1e-9&&parameter(p[q],p[a],p[z])<=1+1e-9;
  for(let i=0;i<b.length;i++)for(let j=i+1;j<b.length;j++)if(j!==i+1&&!(i===0&&j===b.length-1)){
   const a=b[i],z=b[(i+1)%b.length],c=b[j],d=b[(j+1)%b.length],o=[orient(a,z,c),orient(a,z,d),orient(c,d,a),orient(c,d,z)];
   assert(!(o[0]*o[1]<0&&o[2]*o[3]<0)&&!on(a,z,c)&&!on(a,z,d)&&!on(c,d,a)&&!on(c,d,z),label+' simple cyclic polygon');
  }
 }
 check('exact32 source contracts, IDs, parts and original pages',()=>{
  const scoped=lessons.filter(l=>(l.source?.collection==='theory'&&['32','33','34'].includes(l.source.point))||(l.source?.collection==='main'&&Number(l.source.exercise)>=254&&Number(l.source.exercise)<=270));
  assert.deepEqual(scoped.map(l=>l.id).sort(),[...ids].sort(),'all and only source cards');
  for(const [id,[point,subpart,pages]] of Object.entries(theory)){const l=get(id);assert.equal(l.kind,'theory');assert.deepEqual(l.source,{bookId:'atanasyan-2024-10-11',collection:'theory',point,chapter:'III. Многогранники',printedPages:pages,pdfPages:pages.map(p=>p+2),subpart});}
  for(const [n,ss] of Object.entries(parts))for(const s of ss){const l=ex(Number(n),letters[s]||''),page=Number(n)<=264?77:78;assert.equal(l.kind,'exercise');assert.deepEqual(l.source,{bookId:'atanasyan-2024-10-11',collection:'main',exercise:n,chapter:'III. Многогранники',printedPages:[page],pdfPages:[page+2],...(s?{subpart:s}:{})});}
 });
 check('topology, simple planar views, reachable constructions and neutral givens',()=>{
  for(const l of cards){const m=l.visualization.model,p=pts(l),{b,apex,top}=shape(l);
   if(l.kind==='exercise'&&![265,266,270].includes(Number(l.source.exercise))){assert.equal(l.answer.mode,'manual',l.id+' symbolic/proof/multiple-output answer mode');assert.equal(l.answer.accepted,undefined,l.id+' no unverified exact answers');}
   for(const [name,q] of Object.entries(p)){assert.equal(q.length,3,l.id+' '+name);assert(q.every(Number.isFinite),l.id+' finite '+name);}
   if(!top)assert(height(p,b,apex)>1e-6,l.id+' nondegenerate pyramid');
   const faces=top?[b,top,...b.map((a,i)=>[a,b[(i+1)%b.length],top[(i+1)%b.length],top[i]])]:[b,...b.map((a,i)=>[apex,a,b[(i+1)%b.length]])];
   assert.deepEqual(m.faces.map(cyclekey).sort(),faces.map(cyclekey).sort(),l.id+' exact cyclic faces');
   const mandatory=top?b.flatMap((a,i)=>[[a,b[(i+1)%b.length]],[top[i],top[(i+1)%b.length]],[a,top[i]]]):b.flatMap((a,i)=>[[a,b[(i+1)%b.length]],[a,apex]]),edgeKeys=new Set(m.edges.map(e=>[...e].sort().join('|')));
   assert.equal(edgeKeys.size,m.edges.length,l.id+' no duplicate edges');for(const e of mandatory)assert(edgeKeys.has([...e].sort().join('|')),l.id+' missing solid edge');
   let allowed=[...b,...(top||[apex])];const n=Number(l.source.exercise);
   if(n===260)allowed.push('O');if(n===263)allowed.push('K','L','N');if(n===267)allowed.push('A1','B1','C1','D1');const visible=new Set(allowed);
   for(const a of [...m.labelNames,...m.neutralPoints,...m.edges.flat()])assert(visible.has(a),l.id+' premature construction '+a);
   const used=new Set(['neutral']);const hh=hs=>{for(const h of hs||[]){if(h.view)used.add(h.view);hh(h.children);}};hh(l.help);
   for(const s of l.steps){assert(s.explanation&&s.justifications?.length,l.id+' explained step');if(s.view)used.add(s.view);}
   assert.deepEqual([...used].sort(),Object.keys(m.views).sort(),l.id+' every view reachable');
   for(const f of m.faces)simplePlanar(p,f,l.id+' solid face');
   for(const [name,v] of Object.entries(m.views)){
    for(const e of v.segments||[]){assert.equal(e.length,2);assert(p[e[0]]&&p[e[1]],l.id+' segment points');assert(dist(p,...e)>1e-8,l.id+' nonzero segment');}
    for(const a of v.points||[])assert(p[a],l.id+' view point');if(v.polygon)simplePlanar(p,v.polygon,l.id+' '+name);
    if(name==='neutral')for(const a of [...(v.points||[]),...(v.segments||[]).flat(),...(v.polygon||[])])assert(visible.has(a),l.id+' neutral reveal '+a);
   }
  }
 });

 // Homothety is derived from corresponding base side lengths. The original
 // apex is reconstructed when the lesson correctly omits it from its model.
 function frustum(l,b,up,isRegular=false){
  const p=pts(l),k=dist(p,up[0],up[1])/dist(p,b[0],b[1]);assert(k>0&&k<1,l.id+' inner parallel cut');
  const apex=mul(sub(p[up[0]],mul(p[b[0]],k)),1/(1-k));
  b.forEach((a,i)=>same(p[up[i]],add(apex,mul(sub(p[a],apex),k)),l.id+' one finite homothety center'));
  parallel(normal(p,b),normal(p,up),l.id+' parallel base planes');assert(Math.abs(dot(sub(p[up[0]],p[b[0]]),normal(p,b)))>1e-6,l.id+' distinct planes');
  for(let i=0;i<b.length;i++){const j=(i+1)%b.length;parallel(vec(p,b[i],b[j]),vec(p,up[i],up[j]));assert(norm(cross(vec(p,b[i],up[i]),vec(p,b[j],up[j])))>1e-6,l.id+' exactly one parallel side pair');}
  if(p.P)same(p.P,apex,l.id+' displayed original apex');
  if(isRegular){const o=mean(b.map(a=>p[a])),o1=mean(up.map(a=>p[a]));equal(b.map((a,i)=>dist(p,a,b[(i+1)%b.length])));equal(b.map(a=>norm(sub(p[a],o))));perp(sub(o1,o),vec(p,b[0],b[1]));perp(sub(o1,o),vec(p,b[0],b[2]));parallel(sub(apex,o),normal(p,b));equal(b.map((a,i)=>dist(p,a,up[i])));}
  return {p,k,apex};
 }
 check('032: arbitrary pyramid, external normal foot, one base and tetrahedron',()=>{
  const l=get('theory-032'),p=pts(l),b=['A1','A2','A3','A4'];same(p.H,projected(p,b,'P'));assert(height(p,b,'P')>0);
  assert(Math.max(...b.map((a,i)=>dist(p,a,b[(i+1)%4])))-Math.min(...b.map((a,i)=>dist(p,a,b[(i+1)%4])))>1e-3,'definition does not silently impose a regular base');
  assert(b.some((a,i)=>dot(cross(vec(p,a,b[(i+1)%4]),vec(p,a,'H')),normal(p,b))<0),'H is genuinely outside the actual base');
  assert(!b.some(a=>dist(p,'H',a)<1e-6),'height not a lateral edge');
  const sideAreas=b.map((a,i)=>area(p,['P',a,b[(i+1)%4]]));assert(Math.max(...sideAreas)-Math.min(...sideAreas)>1e-3,'arbitrary faces need not be equal');
  near(l.visualization.model.faces.reduce((s,f)=>s+area(p,f),0),lateral(p,b,'P')+area(p,b));
  contains(l,/Sполн=Sбок\+Sосн/,'one-base full area');contains(l,/тетраэдр/,'triangular-pyramid terminology');contains(l,/n\+1гран/,'general face count');contains(l,/вне.*четырёхугольник/,'external-foot explanation');
 });
 check('033: centered regular pyramid, SSS faces, two different radii and equal apothems',()=>{
  const l=get('theory-033'),b=['A1','A2','A3','A4'],p=regular(l,b,'P'),h=height(p,b,'P');same(p.O,mean(b.map(a=>p[a])));perp(vec(p,'A1','A2'),vec(p,'A2','A3'));
  const R=dist(p,'O','A1');for(const a of b)near(dist(p,'P',a)**2,h*h+R*R);
  same(p.E,mid(p.A1,p.A2));same(p.F,mid(p.A2,p.A3));perp(vec(p,'P','E'),vec(p,'A1','A2'));perp(vec(p,'P','F'),vec(p,'A2','A3'));near(dist(p,'P','E'),dist(p,'P','F'));
  const r=dist(p,'O','E');assert(R>r&&r>0,'circumradius differs from inradius');near(dist(p,'P','E')**2,h*h+r*r);
  contains(l,/√\(h2\+R2\)/,'edge Pythagorean proof');contains(l,/трёмсторонам/,'SSS congruence proof');contains(l,/апофем/,'apothem defined');contains(l,/дв.*услов|Нужныдваусловия/,'regular-base AND centered-height definition');
 });
 check('033-area: actual triangle sum equals perimeter times apothem over2',()=>{
  const l=get('theory-033-area'),b=['A1','A2','A3','A4'],p=regular(l,b,'P');same(p.E,mid(p.A1,p.A2));same(p.F,mid(p.A2,p.A3));perp(vec(p,'P','E'),vec(p,'A1','A2'));perp(vec(p,'P','F'),vec(p,'A2','A3'));near(dist(p,'P','E'),dist(p,'P','F'));
  const d=dist(p,'P','E');assert(d>height(p,b,'P'));near(lateral(p,b,'P'),perimeter(p,b)*d/2);contains(l,/Sбок=Pосн·d\/2/,'lateral formula');contains(l,/сумм|Сложим/,'sum of all face areas');contains(l,/не.*высотаPO|апофемаd,аневысота/,'apothem versus body height');contains(l,/Sполн=Pосн·d\/2\+Sосн/,'one base in full surface');
 });
 check('034: general parallel cut, finite common apex, trapezoids and plane height',()=>{
  const l=get('theory-034'),b=['A1','A2','A3','A4'],up=['B1','B2','B3','B4'],{p}=frustum(l,b,up);
  same(p.H,sub(p.C,mul(normal(p,b),dot(vec(p,b[0],'C'),normal(p,b)))));near(dot(vec(p,up[0],'C'),normal(p,up)),0,'C in upper plane');
  const legs=b.map((a,i)=>dist(p,a,up[i]));assert(Math.max(...legs)-Math.min(...legs)>1e-3,'general frustum must not impose equal legs');
  contains(l,/пересекающиесявP/,'nonparallel legs proof');contains(l,/треть.*плоскост|плоскостьPA1A2/,'parallel-plane trace proof');contains(l,/независитотвыбораC/,'height between planes');contains(l,/необязанаиметьравнобедренные/,'no false regularity assumption');
 });
 check('034-regular: homothety proof, equal trapezoids and distinct body height/apothem',()=>{
  const l=get('theory-034-regular'),b=['A1','A2','A3','A4'],up=['B1','B2','B3','B4'],{p,k}=frustum(l,b,up,true);
  same(p.O,mean(b.map(a=>p[a])));same(p.O1,mean(up.map(a=>p[a])));same(p.E,mid(p.A1,p.A2));same(p.F,mid(p.B1,p.B2));same(p.G,mid(p.A2,p.A3));same(p.K,mid(p.B2,p.B3));
  same(p.F,add(p.P,mul(vec(p,'P','E'),k)));perp(vec(p,'E','F'),vec(p,'A1','A2'));perp(vec(p,'G','K'),vec(p,'A2','A3'));near(dist(p,'E','F'),dist(p,'G','K'));assert(dist(p,'E','F')>dist(p,'O','O1'));
  equal(b.map((a,i)=>area(p,[a,b[(i+1)%4],up[(i+1)%4],up[i]])));
  contains(l,/0<k<1/,'strict cut coefficient');contains(l,/гомотети/,'homothety proof');contains(l,/совмещ/,'congruence proof');contains(l,/себепоещё|самапосебеещё|Правильностьдвухмногоугольников/,'regular bases alone insufficient');
 });
 check('034-area: sum actual trapezoid areas and BOTH bases in full surface',()=>{
  const l=get('theory-034-area'),b=['A1','A2','A3','A4'],up=['B1','B2','B3','B4'],{p}=frustum(l,b,up,true);
  same(p.E,mid(p.A1,p.A2));same(p.F,mid(p.B1,p.B2));same(p.G,mid(p.A2,p.A3));same(p.K,mid(p.B2,p.B3));same(p.O,mean(b.map(a=>p[a])));same(p.O1,mean(up.map(a=>p[a])));perp(vec(p,'E','F'),vec(p,'A1','A2'));perp(vec(p,'G','K'),vec(p,'A2','A3'));near(dist(p,'E','F'),dist(p,'G','K'));const d=dist(p,'E','F'),side=b.reduce((s,a,i)=>s+area(p,[a,b[(i+1)%b.length],up[(i+1)%b.length],up[i]]),0);assert(d>dist(p,'O','O1'));
  near(side,(perimeter(p,b)+perimeter(p,up))*d/2);near(l.visualization.model.faces.reduce((s,f)=>s+area(p,f),0),side+area(p,b)+area(p,up));
  contains(l,/Sбок=\(Pниж\+Pверх\)·d\/2/,'sum-of-perimeters formula');contains(l,/Sполн=Sбок\+Sниж\+Sверх/,'two-base full formula');contains(l,/сумм|Сложим/,'proof by sum');
 });
 check('254: all five independent geometric quantities and interior dihedral',()=>{
  for(const s of ['a','b','c','d','e']){const l=ex(254,s),p=regular(l,['A','B','C']),a=dist(p,'A','B'),h=height(p,['A','B','C'],'S'),r=a/Math.sqrt(3);same(p.O,projected(p,['A','B','C'],'S'));near(dist(p,'O','A'),r);near(dist(p,'S','A'),Math.sqrt(h*h+a*a/3));
   const beta=Math.acos(cosine(vec(p,'S','A'),vec(p,'S','B')));near(beta,2*Math.asin(a/(2*Math.sqrt(h*h+a*a/3))));assert(beta>0&&beta<2*Math.PI/3);
   if(p.E)same(p.E,mid(p.A,p.B));
   if(s==='d'){perp(vec(p,'E','S'),vec(p,'A','B'));perp(vec(p,'E','O'),vec(p,'A','B'));near(dist(p,'O','E'),a/(2*Math.sqrt(3)));}
   if(s==='e'){same(p.T,foot(p.B,p.A,p.S));same(p.T,foot(p.C,p.A,p.S));near(cosine(vec(p,'T','B'),vec(p,'T','C')),(6*h*h-a*a)/(12*h*h+a*a));contains(l,/внутренн/,'interior dihedral');contains(l,/продолжени/,'extension allowed');contains(l,/60°<.*<180°/,'full dihedral range');}
  }
  contains(ex(254,'a'),/SA=√\(H2\+a2\/3\)/,'lateral edge outcome');contains(ex(254,'b'),/2arcsin\(a\/\(2√\(H2\+a2\/3\)\)\)/,'half apex angle outcome');contains(ex(254,'c'),/arctg\(√3H\/a\)/,'edge angle outcome');contains(ex(254,'d'),/arctg\(2√3H\/a\)/,'face angle outcome');contains(ex(254,'e'),/arccos\(\(6H2−a2\)\/\(12H2\+a2\)\)/,'interior dihedral outcome');
 });
 check('255: base8, height formula and120degree degeneracy',()=>{const l=ex(255),p=regular(l,['A','B','C']),b=Math.acos(cosine(vec(p,'S','A'),vec(p,'S','B')));same(p.E,mid(p.A,p.B));near(dist(p,'A','B'),8);near(height(p,['A','B','C'],'S'),4*Math.sqrt(1/Math.sin(b/2)**2-4/3));contains(l,/SO=4√\(1\/sin2\(φ\/2\)−4\/3\)/,'height outcome');contains(l,/0°<φ<120°/,'feasible phi');contains(l,/нулев/,'degenerate endpoint explained');});
 check('256: four outputs, square radius, apothem and obtuse lateral dihedral',()=>{
  for(const s of ['a','b','c','d']){const l=ex(256,s),p=regular(l,['A','B','C','D']),a=dist(p,'A','B'),alpha=Math.acos(cosine(vec(p,'S','A'),vec(p,'S','B')));perp(vec(p,'A','B'),vec(p,'B','C'));same(p.E,mid(p.A,p.B));near(dist(p,'S','A'),a/(2*Math.sin(alpha/2)));near(dist(p,'S','E'),a/(2*Math.tan(alpha/2)));near(height(p,['A','B','C','D'],'S'),a/2*Math.sqrt(1/Math.tan(alpha/2)**2-1));contains(l,/0°<α<90°/,'alpha feasibility');
   if(s==='c'){same(p.O,projected(p,['A','B','C','D'],'S'));near(cosine(vec(p,'E','S'),vec(p,'E','O')),Math.tan(alpha/2));contains(l,/arccos\(tg\(α\/2\)\)/,'face angle result');}
   if(s==='d'){same(p.T,foot(p.B,p.A,p.S));same(p.T,foot(p.D,p.A,p.S));near(cosine(vec(p,'T','B'),vec(p,'T','D')),-(Math.tan(alpha/2)**2));contains(l,/−tg2\(α\/2\)/,'negative dihedral cosine');contains(l,/90°<.*<180°/,'obtuse dihedral range');}
  }
  contains(ex(256,'a'),/SO=\(m\/2\)√\(ctg2\(α\/2\)−1\)/,'height outcome');contains(ex(256,'b'),/m\/\(2sin\(α\/2\)\)/,'lateral edge outcome');
 });
 check('257:45degree face angle and one base in full surface',()=>{const l=ex(257),p=regular(l,['A','B','C']),h=height(p,['A','B','C'],'S');same(p.E,mid(p.A,p.B));same(p.O,projected(p,['A','B','C'],'S'));near(cosine(vec(p,'E','S'),vec(p,'E','O')),Math.SQRT1_2);near(lateral(p,['A','B','C'],'S')+area(p,['A','B','C']),3*h*h*(Math.sqrt(6)+Math.sqrt(3)));contains(l,/Sполн/,'total outcome');});
 check('258: edge12 at60degrees, total72(1+sqrt7)',()=>{const l=ex(258),p=regular(l,['A','B','C','D']);same(p.O,projected(p,['A','B','C','D'],'S'));perp(vec(p,'A','B'),vec(p,'B','C'));same(p.E,mid(p.A,p.B));near(dist(p,'S','A'),12);near(cosine(vec(p,'A','S'),vec(p,'A','O')),.5);near(lateral(p,['A','B','C','D'],'S')+area(p,['A','B','C','D']),72*(1+Math.sqrt(7)));contains(l,/72\(1\+√7\)/,'total result');});
 check('259: base6,60degree face inclination and edge3sqrt5',()=>{const l=ex(259),p=regular(l,['A','B','C','D']);same(p.E,mid(p.A,p.B));same(p.O,projected(p,['A','B','C','D'],'S'));near(dist(p,'A','B'),6);near(cosine(vec(p,'E','S'),vec(p,'E','O')),.5);near(dist(p,'S','A'),3*Math.sqrt(5));contains(l,/3√5/,'edge result');});
 check('260: apothem-line foot beyond apex and two independent normal directions',()=>{
  for(const s of ['a','b']){const l=ex(260,s),p=regular(l,['A','B','C'],'D');same(p.E,mid(p.A,p.B));same(p.O,mean([p.A,p.B,p.C]));parallel(vec(p,'C','O'),vec(p,'C','E'));perp(vec(p,'A','B'),vec(p,'C','E'));perp(vec(p,'A','B'),vec(p,'D','E'));
   if(s==='b'){same(p.K,foot(p.C,p.E,p.D),'exact perpendicular foot');assert(parameter(p.K,p.E,p.D)>1,'chosen source edge-case: K beyond D');parallel(vec(p,'K','Q'),vec(p,'A','B'));near(dot(vec(p,'A','Q'),normal(p,['A','B','D'])),0,'Q in ADB');perp(vec(p,'C','K'),vec(p,'K','Q'));perp(vec(p,'C','K'),vec(p,'D','E'));contains(l,/продолжени/,'extension explicit');}
  }
 });
 check('261: all three opposite skew-edge pairs',()=>{const l=ex(261),p=regular(l,['A','B','C']);same(p.E,mid(p.A,p.B));same(p.F,mid(p.B,p.C));same(p.G,mid(p.C,p.A));for(const [a,b,c] of [['A','B','C'],['B','C','A'],['C','A','B']])perp(vec(p,a,b),vec(p,'S',c));contains(l,/AB⊥SC/,'first pair');contains(l,/BC⊥SA/,'second pair');contains(l,/CA⊥SB/,'third pair');contains(l,/направлен/,'skew-angle interpretation');});
 check('262: general regular-base proof, hexagon example, normal plane',()=>{const l=ex(262),p=regular(l,['A','B','C','D','E','F']);same(p.T,mid(p.A,p.B));same(p.O,projected(p,['A','B','C','D','E','F'],'S'));perp(vec(p,'A','B'),vec(p,'T','O'));perp(vec(p,'A','B'),vec(p,'T','S'));contains(l,/Ничислосторон|любогоn|правильноммногоугольнике/,'proof not limited to hexagon');});
 check('263: arbitrary interior t, complete trapezoid and strict parallel planes',()=>{
  for(const s of ['a','b']){const l=ex(263,s),p=regular(l,['A','B','C','D'],'M'),t=parameter(p.K,p.B,p.C);assert(t>0&&t<1,'interior t');assert(Math.abs(t-.5)>.05,'example must not silently assume midpoints');same(p.K,add(mul(p.B,1-t),mul(p.C,t)));same(p.L,add(mul(p.M,1-t),mul(p.C,t)));same(p.N,add(mul(p.A,1-t),mul(p.D,t)));parallel(vec(p,'K','N'),vec(p,'A','B'));parallel(vec(p,'K','L'),vec(p,'B','M'));const n=normal(p,['A','M','B']);perp(n,vec(p,'K','N'));perp(n,vec(p,'K','L'));assert(Math.abs(dot(n,vec(p,'A','K')))>1e-6,'distinct section plane');contains(l,/произвольн|любого0/,'arbitrary point explained');
   if(s==='a'){same(p.P,add(mul(p.M,1-t),mul(p.D,t)));near(dist(p,'L','P'),t*dist(p,'K','N'));near(dist(p,'K','L'),dist(p,'P','N'));assert.equal(cyclekey(l.visualization.model.views.section.polygon),cyclekey(['K','L','P','N']));contains(l,/подобн/,'leg-length proof');contains(l,/равнобедреннаятрапеци/,'section type');}
  }
 });
 check('264: ONE side face equals long-diagonal section; lateral3a²',()=>{const l=ex(264),b=['A','B','C','D','E','F'],p=regular(l,b),a=dist(p,'A','B');near(dist(p,'A','D'),2*a);near(area(p,['S','A','B']),area(p,['S','A','D']));same(p.T,mid(p.A,p.B));near(dist(p,'S','T'),a);near(height(p,b,'S'),a/2);near(lateral(p,b,'S'),3*a*a);contains(l,/Sбок=.*3a2/,'lateral result');});
 check('265: inward30degree section, edge60, P interior3/8 and area54',()=>{const l=ex(265),p=regular(l,['A','B','C']);near(dist(p,'A','B'),12);same(p.O,projected(p,['A','B','C'],'S'));same(p.E,mid(p.A,p.B));near(cosine(vec(p,'C','S'),vec(p,'C','O')),.5);near(cosine(vec(p,'E','P'),vec(p,'E','C')),Math.sqrt(3)/2);same(p.P,add(p.C,mul(vec(p,'C','S'),3/8)));perp(vec(p,'E','P'),vec(p,'A','B'));near(dist(p,'E','P'),9);near(area(p,['A','B','P']),54);exact(l,'54');contains(l,/внутр/,'inward plane');contains(l,/вырождает|толькореброAB/,'other orientation caveat');});
 check('266: rectangle6x8,height2,strict SB parallelism and area13',()=>{const l=ex(266),p=pts(l),b=['A','B','C','D'];same(mid(p.A,p.C),mid(p.B,p.D));perp(vec(p,'A','B'),vec(p,'B','C'));same([dist(p,'A','B'),dist(p,'B','C')].sort((a,b)=>a-b),[6,8]);equal(b.map(a=>dist(p,'S',a)));same(p.O,projected(p,b,'S'));same(p.O,mid(p.A,p.C));near(dist(p,'S','O'),2);same(p.K,mid(p.S,p.D));const n=normal(p,['A','C','K']);perp(n,vec(p,'S','B'));assert(Math.abs(dot(n,vec(p,'A','B')))>1e-6,'SB must be disjoint');same(p.E,foot(p.D,p.A,p.C));same(p.Q,mid(p.O,p.D));same(p.F,mid(p.O,p.E));perp(vec(p,'K','F'),vec(p,'A','C'));near(dist(p,'K','F'),13/5);near(area(p,['A','C','K']),13);assert.equal(cyclekey(l.visualization.model.views.section.polygon),cyclekey(['A','C','K']));exact(l,'13');contains(l,/SAиSC/,'incident-edge exclusion');contains(l,/строг/,'strict parallelism explicit');});
 check('267: arbitrary pyramid, exterior height foot and top/bottom ratio',()=>{const l=ex(267),p=pts(l),b=['A','B','C','D'],k=parameter(p.A1,p.S,p.A);assert(k>0&&k<1);for(const a of b)same(p[a+'1'],add(p.S,mul(vec(p,'S',a),k)));same(p.O,projected(p,b,'S'));same(p.T,add(p.S,mul(vec(p,'S','O'),k)));assert(b.some((a,i)=>dot(cross(vec(p,a,b[(i+1)%b.length]),vec(p,a,'O')),normal(p,b))<0),'example exterior foot');contains(l,/k\/\(1−k\)/,'requested ratio of parts');contains(l,/совпадаетсA/,'height coincident with edge case');});
 check('268: from-apex1:2,apothem4,total186 and height sqrt7',()=>{const l=ex(268),p=pts(l),b=['A','B','C','D'];same(p.Q,add(p.S,mul(vec(p,'S','O'),1/3)));near(dist(p,'S','Q')/dist(p,'Q','O'),.5);same(p.O,projected(p,b,'S'));for(const a of b)same(p[a+'1'],add(p.S,mul(vec(p,'S',a),1/3)));same(p.E,mid(p.A,p.B));same(p.F,mid(p.A1,p.B1));same(p.G,sub(p.F,mul(normal(p,b),dot(vec(p,'A','F'),normal(p,b)))));near(dist(p,'E','F'),4);near(l.visualization.model.faces.reduce((s,f)=>s+area(p,f),0),186);near(dist(p,'A','B'),9);near(dist(p,'A1','B1'),3);near(dist(p,'F','G'),Math.sqrt(7));contains(l,/√7/,'height result');contains(l,/a2\+b2/,'both bases in area equation');});
 check('269: source4/2/2 and BOTH height and apothem answers',()=>{const l=ex(269),p=pts(l),b=['A','B','C'],up=b.map(a=>a+'1'),o=mean(b.map(a=>p[a])),o1=mean(up.map(a=>p[a]));equal(b.map((a,i)=>dist(p,a,b[(i+1)%3])));equal(up.map((a,i)=>dist(p,a,up[(i+1)%3])));near(dist(p,'A','B'),4);near(dist(p,'A1','B1'),2);for(const a of b){near(dist(p,a,a+'1'),2);same(sub(p[a+'1'],o1),mul(sub(p[a],o),.5));}perp(sub(o1,o),vec(p,'A','B'));perp(sub(o1,o),vec(p,'A','C'));same(p.O,o);same(p.X,sub(p.A1,sub(o1,o)));same(p.G,sub(p.F,sub(o1,o)));same(p.E,mid(p.A,p.B));same(p.F,mid(p.A1,p.B1));near(dist(p,'A1','X'),2*Math.sqrt(6)/3);near(dist(p,'E','F'),Math.sqrt(3));const last=narrative({steps:[l.steps.at(-1)]});assert(/высотаh=2√6\/3/.test(last)&&/апофемаd=√3/.test(last),'both actual results in final step');assert(/высоту.*апофему/.test(l.answer.prompt),'answer requests both');});
 check('270: equilateral bases are NOT a regular frustum, face areas4/4/8',()=>{const l=ex(270),p=pts(l),b=['A','B','C'],up=b.map(a=>a+'1');equal(b.map((a,i)=>dist(p,a,b[(i+1)%3])));equal(up.map((a,i)=>dist(p,a,up[(i+1)%3])));near(dist(p,'A','B'),5);near(dist(p,'A1','B1'),3);near(dist(p,'A','A1'),1);perp(vec(p,'A','A1'),vec(p,'A','B'));perp(vec(p,'A','A1'),vec(p,'A','C'));for(const a of b)same(vec(p,'A1',a+'1'),mul(vec(p,'A',a),3/5));near(area(p,['A','B','B1','A1']),4);near(area(p,['A','C','C1','A1']),4);near(area(p,['B','C','C1','B1']),8);same(p.E,mid(p.B,p.C));same(p.F,mid(p.B1,p.C1));near(dist(p,'E','F'),2);same(p.X,sub(p.B1,vec(p,'A','A1')));assert(norm(cross(sub(mean(up.map(a=>p[a])),mean(b.map(a=>p[a]))),normal(p,b)))>1e-6,'centers do not share normal axis');exact(l,'16');contains(l,/ещёнезнач|ещёнеознач|неявляетсяправильной|неправильнаяусечённая|нельзяприменитьоднуобщуюапофему/,'regularity distinction');});
 return {status:'passed',cards:cards.length,theoryCards:6,exerciseCards:26,groups:checks.length,checks};
}
module.exports={run};
if(require.main===module){const file=process.argv[2]||process.env.PYRAMID_BUNDLE_PATH||path.join(__dirname,'../../stereo-course/textbook/data/course.json');const result=run(JSON.parse(fs.readFileSync(file,'utf8')));console.log(`ATANASYAN_PYRAMID_THEORY32_34_EX254_270_CONTENT_OK ${result.cards} cards, ${result.groups} source-derived regression groups`);}
