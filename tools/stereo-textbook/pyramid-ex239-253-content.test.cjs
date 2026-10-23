'use strict';
// Private source-derived regression suite for Atanasyan 2024, III §2, 239–253.
// Original printed pp75–77 / PDF pp77–79, PDF SHA256:
// bead97a383e438b32b9caaff72d61d27e8fa6cd20c6b86a5f234bc4cdb629770.
// Run: node pyramid-ex239-253-content.test.cjs [bundle.json]
// Or set PYRAMID_BUNDLE_PATH. Accepts a lesson array or a {lessons} bundle;
// unrelated lessons are deliberately untouched and do not affect the count.
// Coordinate checks establish the displayed examples, not universal proofs.
// Text guards supplement geometry for source outcomes and interpretation warnings.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const add = (a,b) => a.map((x,i)=>x+b[i]);
const sub = (a,b) => a.map((x,i)=>x-b[i]);
const mul = (a,t) => a.map(x=>x*t);
const dot = (a,b) => a.reduce((s,x,i)=>s+x*b[i],0);
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm = a => Math.hypot(...a);
const near = (a,b,label='value') => assert(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(a),Math.abs(b)),`${label}: ${a} != ${b}`);
const same = (a,b,label) => {assert(a&&b,label);a.forEach((x,i)=>near(x,b[i],label));};
const vec = (p,a,b) => sub(p[b],p[a]);
const dist = (p,a,b) => norm(vec(p,a,b));
const perp = (a,b,label='perpendicular') => near(dot(a,b)/(norm(a)*norm(b)),0,label);
const parallel = (a,b,label='parallel') => near(norm(cross(a,b))/(norm(a)*norm(b)),0,label);
const mid = (a,b) => mul(add(a,b),0.5);
const angle = (u,v) => Math.acos(Math.max(-1,Math.min(1,dot(u,v)/norm(u)/norm(v))))*180/Math.PI;
const area = (p,names) => norm(names.slice(1,-1).reduce((sum,name,i)=>add(sum,cross(vec(p,names[0],name),vec(p,names[0],names[i+2]))),[0,0,0]))/2;
const perimeter = (p,b) => b.reduce((s,a,i)=>s+dist(p,a,b[(i+1)%b.length]),0);
const lateral = (p,b,apex='P') => b.reduce((s,a,i)=>s+area(p,[apex,a,b[(i+1)%b.length]]),0);
// Oriented polygon-area normal also works when the first corner is reflex.
const normal = (p,b) => {const n=b.slice(1,-1).reduce((sum,a,i)=>add(sum,cross(vec(p,b[0],a),vec(p,b[0],b[i+2]))),[0,0,0]);return mul(n,1/norm(n));};
const lineFoot = (h,a,b) => {const d=sub(b,a);return add(a,mul(d,dot(sub(h,a),d)/dot(d,d)));};
const lineDistance = (h,a,b) => norm(sub(h,lineFoot(h,a,b)));
const lineParameter = (h,a,b) => dot(sub(h,a),sub(b,a))/dot(sub(b,a),sub(b,a));
const signedDistances = (p,b,h) => {const n=normal(p,b);return b.map((a,i)=>dot(cross(vec(p,a,b[(i+1)%b.length]),sub(h,p[a])),n)/dist(p,a,b[(i+1)%b.length]));};
const height = (p,b,apex='P') => Math.abs(dot(vec(p,b[0],apex),normal(p,b)));
const projected = (p,b,apex='P') => {const n=normal(p,b);return sub(p[apex],mul(n,dot(vec(p,b[0],apex),n)));};
const equal = (values,label) => values.forEach(x=>near(x,values[0],label));
const text = l => JSON.stringify([l.statement,l.steps,l.help,l.answer]);
function run(input) {
  const lessons=Array.isArray(input)?input:input.lessons;
  assert(Array.isArray(lessons),'expected a lesson array or a bundle with lessons');
  const ex=(n,part='')=>{const id='ex-main-'+String(n).padStart(4,'0')+(part?'-'+part:'');const found=lessons.filter(l=>l.id===id);assert.equal(found.length,1,'one '+id);return found[0];};
  const pts=l=>l.visualization.model.points;
  const exact=(l,value)=>{
    assert.equal(l.answer.mode,'exact',l.id);assert(l.answer.accepted.includes(value),l.id+' answer '+value);
    // The current exact-answer contract allows the printed radical and its
    // sqrt(...) spelling. Requiring the correct answer alone would let an
    // additional false accepted answer, e.g. 0, silently pass this gate.
    const allowed=new Set([value,value.replace(/√(\d+)/g,'sqrt($1)')]);
    for(const accepted of l.answer.accepted)assert(allowed.has(accepted),l.id+' unverified accepted answer '+accepted);
  };
  const checkNames=[];
  function check(name,fn){try{fn();}catch(e){e.message=name+': '+e.message;throw e;}checkNames.push(name);}
  const parts={239:[''],240:[''],241:[''],242:['а','б'],243:[''],244:[''],245:[''],246:['а','б'],247:['а','б','в'],248:[''],249:['а','б'],250:[''],251:[''],252:[''],253:['']};
  const cards=lessons.filter(l=>l.source?.collection==='main'&&Number(l.source.exercise)>=239&&Number(l.source.exercise)<=253);
  const shape=n=>({base:[243,244,246,248,249,250,251,252].includes(n)?['A','B','C']:['A','B','C','D'],apex:[243,244,251,252].includes(n)?'D':'P'});
  check('all20 cards, every source subpart and source page',()=>{
    assert.equal(cards.length,20);
    for(const [n,expected] of Object.entries(parts)){
      const actual=cards.filter(l=>l.source.exercise===n);
      assert.deepEqual(actual.map(l=>l.source.subpart||'').sort(),[...expected].sort(),'parts '+n);
      for(const l of actual){
        const suffix={'а':'a','б':'b','в':'c'}[l.source.subpart];
        assert.equal(l.id,'ex-main-'+n.padStart(4,'0')+(suffix?'-'+suffix:''),'source bound to lesson ID');
        assert.equal(l.source.bookId,'atanasyan-2024-10-11');assert.equal(l.kind,'exercise');
        const page=Number(n)<=241?75:Number(n)<=252?76:77;
        assert.deepEqual(l.source.printedPages,[page]);assert.deepEqual(l.source.pdfPages,[page+2]);
      }
    }
  });
  check('actual pyramid topology, finite constructions, reachable views and neutral givens',()=>{
    const givenAux={239:['O'],240:['O'],241:['O'],246:['H'],250:['O'],252:['H']};
    for(const l of cards){
      const n=Number(l.source.exercise),{base:b,apex}=shape(n),m=l.visualization.model,p=pts(l);
      for(const [key,a] of Object.entries(p)){assert.equal(a.length,3);assert(a.every(Number.isFinite),l.id+' '+key);}
      const normalBase=normal(p,b);assert(height(p,b,apex)>1e-6,l.id+' nondegenerate pyramid');
      for(const a of b)near(dot(vec(p,b[0],a),normalBase),0,l.id+' planar base');
      const setkey=a=>[...a].sort().join('|');
      // A face is a cyclic polygon, not an unordered vertex set. Cyclic
      // shifts and reversal preserve it; the bow-tie A,C,B,D does not.
      const cyclekey=a=>[a,[...a].reverse()].flatMap(order=>order.map((_,i)=>order.slice(i).concat(order.slice(0,i)).join('|'))).sort()[0];
      const faces=new Set(m.faces.map(cyclekey));
      assert.equal(m.faces.length,b.length+1,l.id+' exact face count');
      assert.equal(faces.size,m.faces.length,l.id+' unique faces');
      assert(faces.has(cyclekey(b)),l.id+' cyclic base face');
      const edges=new Set(m.edges.map(setkey));
      b.forEach((a,i)=>{const z=b[(i+1)%b.length];assert(faces.has(cyclekey([apex,a,z])),l.id+' lateral face');assert(edges.has(setkey([a,z]))&&edges.has(setkey([apex,a])),l.id+' edges');});
      const allowed=new Set([...b,apex,...(givenAux[n]||[])]);
      for(const a of m.labelNames)assert(allowed.has(a),l.id+' premature label '+a);
      for(const a of m.neutralPoints)assert(allowed.has(a),l.id+' premature point '+a);
      for(const e of m.edges)for(const a of e)assert(allowed.has(a),l.id+' premature edge '+a);
      const referenced=new Set(['neutral']);
      const helps=hs=>{for(const h of hs||[]){if(h.view)referenced.add(h.view);helps(h.children);}};helps(l.help);
      assert(l.steps.length>=2,l.id+' incremental proof');
      for(const s of l.steps){assert(s.explanation&&s.justifications.length,l.id+' explained step');if(s.view)referenced.add(s.view);}
      assert.deepEqual([...referenced].sort(),Object.keys(m.views).sort(),l.id+' reachable views');
      for(const [name,v] of Object.entries(m.views)){
        for(const e of v.segments||[]){assert(p[e[0]]&&p[e[1]]);assert(dist(p,...e)>1e-8,l.id+' '+name+' nonzero construction');if(name==='neutral')e.forEach(a=>assert(allowed.has(a)));}
        for(const a of v.points||[])assert(p[a],l.id+' '+name+' point');
        if(v.polygon){assert(area(p,v.polygon)>1e-8,l.id+' '+name+' polygon');const pn=normal(p,v.polygon);for(const a of v.polygon)near(dot(vec(p,v.polygon[0],a),pn),0,l.id+' '+name+' planar');}
      }
    }
  });
  check('239: given rhombus and both distinct pairs of lateral edges',()=>{
    const l=ex(239),p=pts(l),b=['A','B','C','D'];b.forEach((a,i)=>near(dist(p,a,b[(i+1)%4]),5));
    same(p.O,mid(p.A,p.C));same(p.O,mid(p.B,p.D));near(dist(p,'A','C'),8);same(p.O,projected(p,b));near(dist(p,'P','O'),7);
    for(const a of ['A','C'])near(dist(p,'P',a),Math.sqrt(65));for(const a of ['B','D'])near(dist(p,'P',a),Math.sqrt(58));
    assert.match(text(l),/PA=PC=√65/);assert.match(text(l),/PB=PD=√58/);
  });
  check('240: diagonal center, two face altitudes and actual extension beyond D',()=>{
    const l=ex(240),p=pts(l),b=['A','B','C','D'];same(p.O,mid(p.A,p.C));same(p.O,mid(p.B,p.D));same(p.O,projected(p,b));
    near(dist(p,'A','B'),36);near(dist(p,'A','D'),20);near(area(p,b),360);near(dist(p,'P','O'),12);
    for(const [f,a,z,d,slant] of [['E','A','B',5,13],['F','A','D',9,15]]){same(p[f],lineFoot(p.O,p[a],p[z]),'orthogonal altitude foot');near(dist(p,'O',f),d);near(dist(p,'P',f),slant);perp(vec(p,'P',f),vec(p,a,z));}
    assert(lineParameter(p.F,p.A,p.D)>1,'F is on the extension beyond D, not clamped to finite AD');
    assert(l.visualization.model.views.face20.segments.some(e=>e.includes('D')&&e.includes('F')),'extension drawn in face20');
    near(lateral(p,b),768);exact(l,'768');assert.match(text(l),/продолжени/);
  });
  check('241: shorter diagonal and full rather than lateral area',()=>{
    const l=ex(241),p=pts(l),b=['A','B','C','D'];same(p.O,mid(p.A,p.C));same(p.O,mid(p.B,p.D));same(p.O,projected(p,b));
    near(dist(p,'A','B'),5);near(dist(p,'A','D'),4);near(dist(p,'B','D'),3);assert(dist(p,'B','D')<dist(p,'A','C'));near(height(p,b),2);near(area(p,b),12);
    same(p.E,lineFoot(p.O,p.A,p.B));perp(vec(p,'P','D'),vec(p,'A','D'));
    near(lateral(p,b)+area(p,b),22+2*Math.sqrt(34));exact(l,'22+2√34');
  });
  check('242: square, perpendicular edge, 45degree face and largest edge in both parts',()=>{
    for(const part of ['a','b']){
      const l=ex(242,part),p=pts(l),b=['A','B','C','D'];equal(b.map((a,i)=>dist(p,a,b[(i+1)%4])));perp(vec(p,'A','B'),vec(p,'A','D'));same(mid(p.A,p.C),mid(p.B,p.D));same(p.A,projected(p,b));
      near(dist(p,'P','C'),12);near(Math.max(...b.map(a=>dist(p,'P',a))),12);near(angle(vec(p,'B','P'),vec(p,'B','A')),45);
      near(height(p,b),4*Math.sqrt(3));near(lateral(p,b),48+48*Math.sqrt(2));exact(l,part==='a'?'4√3':'48+48√2');
    }
  });
  check('243: equal13 sides, altitude9 and actual height of third face',()=>{
    const l=ex(243),p=pts(l),b=['A','B','C'];near(dist(p,'A','B'),13);near(dist(p,'A','C'),13);near(dist(p,'B','C'),10);same(p.A,projected(p,b,'D'));near(dist(p,'D','A'),9);
    same(p.M,mid(p.B,p.C));perp(vec(p,'D','M'),vec(p,'B','C'));near(dist(p,'D','M'),15);near(lateral(p,b,'D'),192);exact(l,'192');
  });
  check('244: given hypotenuse29, cathetus21, height20 and third-face altitude',()=>{
    const l=ex(244),p=pts(l),b=['A','B','C'];near(dist(p,'A','B'),29);near(dist(p,'A','C'),21);perp(vec(p,'C','A'),vec(p,'C','B'));same(p.A,projected(p,b,'D'));near(dist(p,'D','A'),20);
    near(dist(p,'B','C'),20);perp(vec(p,'D','C'),vec(p,'B','C'));near(dist(p,'D','C'),29);near(lateral(p,b,'D'),790);exact(l,'790');
  });
  check('245: rectangular diagonal8, two vertical faces, remaining30/45 and full area',()=>{
    const l=ex(245),p=pts(l),b=['A','B','C','D'];same(mid(p.A,p.C),mid(p.B,p.D));perp(vec(p,'A','B'),vec(p,'A','D'));near(dist(p,'A','C'),8);same(p.A,projected(p,b));
    const angles=signedDistances(p,b,p.A).map(d=>Math.atan2(height(p,b),d)*180/Math.PI);[90,30,45,90].forEach((a,i)=>near(angles[i],a));
    near(lateral(p,b)+area(p,b),24+24*Math.sqrt(3)+8*Math.sqrt(6));exact(l,'24+24√3+8√6');
  });
  check('246: two genuine external-center pyramids satisfy40/41/42 with unequal areas',()=>{
    const areas=[];
    for(const part of ['a','b']){
      const l=ex(246,part),p=pts(l),b=['A','B','C'];same(p.H,projected(p,b));near(height(p,b),40);near(perimeter(p,b),42);
      const ds=signedDistances(p,b,p.H);assert(ds.some(x=>x<0)&&ds.some(x=>x>0),'H outside base');ds.forEach(d=>near(Math.abs(d),9));
      for(const [f,a,z] of [['E','A','B'],['F','B','C'],['K','C','A']]){same(p[f],lineFoot(p.H,p[a],p[z]));perp(vec(p,'P',f),vec(p,a,z));near(dist(p,'P',f),41);}
      const measured=area(p,b);near(measured,part==='a'?378/5:540/7);areas.push(measured);near(lateral(p,b),861);
    }
    assert(Math.abs(areas[0]-areas[1])>1,'literal conditions do not determine one area');
  });
  check('246: source caveat forbids an unconditional incenter claim or numeric189 answer',()=>{
    for(const part of ['a','b']){const l=ex(246,part);assert.equal(l.answer.mode,'manual');assert.match(text(l),/вневписан|внешн/);assert.match(text(l),/дополнител|внутри/);}
    const l=ex(246,'b'),t=text(l);const s=42/2,r=Math.sqrt(41**2-40**2),formal=s*r,maxArea=s*s/(3*Math.sqrt(3));
    near(formal,189);near(maxArea,49*Math.sqrt(3));assert(formal>maxArea,'only internal interpretation is impossible');
    assert.match(t,/189/);assert.match(t,/49√3/);assert.match(t,/378\/5/);assert.match(t,/540\/7/);assert.match(t,/разн|неоднознач|недостаточ|не определ/);
    assert(!l.answer.accepted?.includes('189'),'189 must not become an exact answer');
  });
  check('247: equal INTERNAL dihedrals, incenter and common slant height without regularity',()=>{
    for(const part of ['a','b','c']){
      const l=ex(247,part),p=pts(l),b=['A','B','C','D'];same(p.H,projected(p,b));const h=height(p,b),ds=signedDistances(p,b,p.H),deltas=ds.map(d=>Math.atan2(h,d));
      assert(ds.every(d=>d>0),'height foot inside every side half-plane');equal(ds);equal(deltas);assert(deltas.every(d=>d>0&&d<Math.PI/2));
      assert(Math.abs(dot(vec(p,'A','B'),vec(p,'A','D')))>0.1,'example must not assume regular square');
      const slants=[];for(const [f,a,z] of [['E','A','B'],['F','B','C'],['K','C','D'],['L','D','A']]){same(p[f],lineFoot(p.H,p[a],p[z]));assert(lineParameter(p[f],p[a],p[z])>0&&lineParameter(p[f],p[a],p[z])<1);slants.push(dist(p,'P',f));}
      equal(slants);near(slants[0],h/Math.sin(deltas[0]));near(lateral(p,b),perimeter(p,b)*slants[0]/2);near(area(p,b),perimeter(p,b)*ds[0]/2);assert.match(text(l),/внутренн/);
    }
    assert.match(text(ex(247,'a')),/луч/);assert.match(text(ex(247,'a')),/полуплоскост/);
    assert.match(text(ex(247,'b')),/sin/);assert.match(text(ex(247,'c')),/периметр/i);
  });
  check('247a: nonconvex counterexample limits the incenter claim but preserves b/c',()=>{
    // Independently supplied source counterexample, not copied from a lesson model.
    const r=Math.sqrt(2),p={A:[1,1,0],B:[r-1,1,0],C:[-1,r+1,0],D:[-1,-1,0],E:[1,-1,0],H:[0,0,0],P:[0,0,1]},b=['A','B','C','D','E'],n=normal(p,b);
    near(area(p,b),5);near(perimeter(p,b),10);same(p.H,projected(p,b));near(height(p,b),1);
    assert(b.some((a,i)=>dot(cross(vec(p,a,b[(i+1)%5]),vec(p,b[(i+1)%5],b[(i+2)%5])),n)<0),'nonconvex vertex');
    // No two nonadjacent segments properly cross; these coordinates have no
    // coincident or collinear nonadjacent edges, so this establishes simplicity.
    const orient=(a,z,q)=>dot(cross(vec(p,a,z),vec(p,a,q)),n);
    for(let i=0;i<5;i++)for(let j=i+1;j<5;j++)if(j!==i+1&&!(i===0&&j===4)){
      const a=b[i],z=b[(i+1)%5],c=b[j],d=b[(j+1)%5];
      assert(!(orient(a,z,c)*orient(a,z,d)<0&&orient(c,d,a)*orient(c,d,z)<0),'simple nonconvex polygon');
    }
    const ds=signedDistances(p,b,p.H);ds.forEach(d=>{near(d,1);near(Math.atan2(1,d)*180/Math.PI,45);});
    const feet=b.map((a,i)=>lineFoot(p.H,p[a],p[b[(i+1)%5]]));
    feet.forEach(f=>near(norm(sub(p.P,f)),Math.sqrt(2)));
    same(feet[0],[0,1,0]);same(feet[1],[1/r,1/r,0]);
    near(lineParameter(feet[0],p.A,p.B),1+r/2);near(lineParameter(feet[1],p.B,p.C),(1-r)/2);
    assert(lineParameter(feet[0],p.A,p.B)>1&&lineParameter(feet[1],p.B,p.C)<0,'two tangencies fall outside their segments');
    // Interior tangency to the opposite x=±1 sides forces x=0,radius=1;
    // tangency to the lower y=-1 side then forces y=0. No alternative center.
    near(p.C[0],-1);near(p.D[0],-1);near(p.E[0],1);near(p.A[0],1);near(p.D[1],-1);near(p.E[1],-1);
    near(lateral(p,b),5*Math.sqrt(2));near(lateral(p,b),perimeter(p,b)*Math.sqrt(2)/2);
    assert.match(JSON.stringify(ex(247,'a').statement),/выпукл/);
    assert.match(JSON.stringify(ex(247,'a').help),/невыпукл/);assert.match(JSON.stringify(ex(247,'a').help),/продолжени|за B/);
    assert.match(text(ex(247,'a')),/источник|напечатан/);assert.match(text(ex(247,'b')),/не используем вывод пункта а/);
  });
  check('248: explicit internal45degree model gives48sqrt2',()=>{
    const l=ex(248),p=pts(l),b=['A','B','C'];near(dist(p,'A','B'),10);near(dist(p,'A','C'),10);near(dist(p,'B','C'),12);same(p.H,projected(p,b));near(area(p,b),48);near(perimeter(p,b),32);
    const h=height(p,b);near(h,3);for(const d of signedDistances(p,b,p.H))near(Math.atan2(h,d)*180/Math.PI,45);near(lateral(p,b),48*Math.sqrt(2));
    assert.equal(l.answer.mode,'manual');assert.match(JSON.stringify(l.statement),/внутренн/);assert.match(text(l),/48√2/);
  });
  check('248: source-derived excenters really yield128sqrt2/192sqrt2 and internal135',()=>{
    const l=ex(248),p=pts(l),b=['A','B','C'],sides=b.map((_,i)=>dist(p,b[(i+1)%3],b[(i+2)%3])),s=perimeter(p,b)/2,baseArea=area(p,b),n=normal(p,b),areas=[];
    for(let i=0;i<3;i++){
      const weights=sides.map((a,j)=>i===j?-a:a),den=weights.reduce((a,b)=>a+b,0);
      const H=mul(b.reduce((sum,a,j)=>add(sum,mul(p[a],weights[j])),[0,0,0]),1/den),h=baseArea/(s-sides[i]);
      const q={...p,P:add(H,mul(n,h))},ds=signedDistances(q,b,H),internal=ds.map(d=>Math.atan2(h,d)*180/Math.PI).sort((a,b)=>a-b);
      ds.forEach(d=>{near(Math.abs(d),h);near(Math.atan2(h,Math.abs(d))*180/Math.PI,45);});
      [45,45,135].forEach((a,j)=>near(internal[j],a));near(lateral(q,b),s*Math.sqrt(2)*h);areas.push(lateral(q,b));
    }
    equal(areas.slice(1));near(areas[0],192*Math.sqrt(2));near(areas[1],128*Math.sqrt(2));
    assert.match(text(l),/128√2/);assert.match(text(l),/192√2/);assert.match(text(l),/135/);assert.match(text(l),/остр/);assert.match(text(l),/плоскост/);
  });
  check('249: equal lateral edges imply a circumcenter, which can be outside, and equal inclinations',()=>{
    for(const part of ['a','b']){
      const l=ex(249,part),p=pts(l),b=['A','B','C'];same(p.O,projected(p,b));const h=height(p,b),edges=b.map(a=>dist(p,'P',a)),radii=b.map(a=>dist(p,'O',a));equal(edges);equal(radii);assert(h>0&&radii[0]>0);
      radii.forEach(r=>near(r*r,edges[0]**2-h*h));assert(signedDistances(p,b,p.O).some(d=>d<0),'general proof must accommodate external circumcenter');
      const angles=b.map(a=>Math.asin(h/dist(p,'P',a)));equal(angles);
      assert.equal(l.answer.mode,'manual');assert.match(text(l),part==='a'?/описан/:/угл/);
    }
  });
  check('250: obtuse120degree base and angles measured against the height',()=>{
    const l=ex(250),p=pts(l),b=['A','B','C'];near(dist(p,'A','B'),dist(p,'A','C'));near(angle(vec(p,'A','B'),vec(p,'A','C')),120);same(p.O,projected(p,b));near(dist(p,'P','O'),16);
    for(const a of b){near(angle(vec(p,'P',a),vec(p,'P','O')),45);near(dist(p,'O',a),16);}assert(signedDistances(p,b,p.O).some(d=>d<0));near(area(p,b),64*Math.sqrt(3));exact(l,'64√3');
  });
  check('251: right-triangle circumcenter is midpoint of given hypotenuse',()=>{
    const l=ex(251),p=pts(l),b=['A','B','C'];perp(vec(p,'A','B'),vec(p,'A','C'));near(dist(p,'B','C'),10);same(p.O,mid(p.B,p.C));same(p.O,projected(p,b,'D'));near(dist(p,'D','O'),12);
    for(const a of b){near(dist(p,'O',a),5);near(dist(p,'D',a),13);}exact(l,'13');
  });
  check('252: distinguish base-altitude foot H from circumcenter O and pyramid height',()=>{
    const l=ex(252),p=pts(l),b=['A','B','C'];near(dist(p,'A','B'),dist(p,'A','C'));near(dist(p,'B','C'),6);same(p.H,mid(p.B,p.C));perp(vec(p,'A','H'),vec(p,'B','C'));near(dist(p,'A','H'),9);
    same(p.O,projected(p,b,'D'));near(norm(cross(vec(p,'H','O'),vec(p,'H','A'))),0);near(dist(p,'H','O'),4);near(dist(p,'A','O'),5);near(dist(p,'D','O'),12);
    for(const a of b){near(dist(p,'O',a),5);near(dist(p,'D',a),13);}exact(l,'12');
  });
  check('253: unequal trapezoid bases6 and4sqrt6, altitude5 and common-edge13',()=>{
    const l=ex(253),p=pts(l),b=['A','B','C','D'];parallel(vec(p,'A','B'),vec(p,'D','C'));near(dist(p,'A','B'),6);near(dist(p,'C','D'),4*Math.sqrt(6));near(dist(p,'A','D'),dist(p,'B','C'));
    same(p.M,mid(p.A,p.B));same(p.N,mid(p.C,p.D));perp(vec(p,'M','N'),vec(p,'A','B'));near(dist(p,'M','N'),5);same(p.O,projected(p,b));
    same(p.O,add(p.M,mul(vec(p,'M','N'),4/5)));for(const a of b){near(dist(p,'O',a),5);near(dist(p,'P',a),13);}near(height(p,b),12);exact(l,'12');
  });
  return {status:'passed',cards:cards.length,groups:checkNames.length,checks:checkNames};
}
module.exports={run};
if(require.main===module){
  const file=process.argv[2]||process.env.PYRAMID_BUNDLE_PATH||path.join(__dirname,'../../stereo-course/textbook/data/course.json');
  const result=run(JSON.parse(fs.readFileSync(file,'utf8')));
  console.log(`ATANASYAN_PYRAMID_EX239_253_CONTENT_OK ${result.cards} cards, ${result.groups} source-derived regression groups`);
}
