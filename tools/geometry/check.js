'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');const root=path.resolve(__dirname,'../..'),G=require(root+'/geometry-course/assets/geometry.js'),T=require(root+'/geometry-course/assets/tasks.js'),S=require(root+'/geometry-course/assets/store.js'),C=require(root+'/geometry-course/data/course.json'),P=require(root+'/geometry-course/data/proofs.json');let n=0;
function near(a,b,e=1e-7){assert.ok(Math.abs(a-b)<e,`${a} ≠ ${b}`);n++;}
assert.deepEqual(C.units.flatMap(u=>u.points).sort((a,b)=>a-b),Array.from({length:137},(_,i)=>i+1));
for(const u of C.units){assert.ok(P[u.proof]);assert.ok(fs.existsSync(root+'/geometry-course/atlas/'+u.id+'.html'));for(const r of u.requires)assert.ok(C.units.some(z=>z.id===r));const seen=new Set();for(const s of P[u.proof].steps){assert.ok(s.depends.every(x=>seen.has(x)));seen.add(s.id);}for(let seed=0;seed<200;seed++){const t=T.task(u.calc,seed);assert.ok(T.equal(T.format(t.answer),t.answer),u.id);for(const st of t.steps)assert.ok(T.equal(T.format(st.answer),st.answer));n+=t.steps.length+1;}}
for(const [v,a] of [['-2^2',-4],['(-2)^2',4],['2*pi',2*Math.PI],['sqrt(2)^2',2],['1/2+1/3',5/6],['-3--2',-1],['0,125',.125]])near(T.number(v),a);
for(const v of ['Infinity','NaN','1/0','sqrt(-1)','alert(1)','1+','2**3','(2','9^99'])assert.throws(()=>T.number(v));
for(const fig of ['triangle','iso','right','rectangle','square','rhombus','trapezoid'])for(let i=0;i<100;i++){const b=new G.Board(G.scene(fig));b.move('B',350+i,210+i*.8);const A=b.point('A'),B=b.point('B'),C=b.point('C'),D=b.point('D');if(fig==='iso')near(G.dist(A,C),G.dist(B,C));if(fig==='right')near(G.dot(G.sub(A,C),G.sub(B,C)),0,1e-6);if(['rectangle','square'].includes(fig))near(G.dot(G.sub(B,A),G.sub(D,A)),0,1e-6);if(['rhombus','square'].includes(fig))near(G.dist(A,B),G.dist(A,D));if(fig==='trapezoid')near(G.cross(G.sub(B,A),G.sub(C,D)),0,1e-6);}
for(let i=0;i<100;i++){const b=new G.Board(G.scene('triangle'));const m=b.make('midpoint',['A','B'])[0];b.move('A',50+i,150+i);near(G.dist(b.point('A'),b.point(m)),G.dist(b.point('B'),b.point(m)));assert.ok(b.goal('midpoint').ok);b.make('segment',['C',m]);assert.ok(b.goal('median').ok);b.make('perpendicular',['C','A','B']);assert.ok(b.goal('altitude').ok);const r=b.make('reflection',['C','A','B'])[0],h=G.foot(b.point('C'),b.point('A'),b.point('B'));near(G.dist(b.point('C'),h),G.dist(b.point(r),h));b.make('parallel',['C','A','B']);assert.ok(b.goal('parallel').ok);}
const b=new G.Board(G.scene('segment'));b.addPoint(320,235);assert.equal(b.goal('midpoint').ok,false);b.make('circle',['A','B']);b.make('circle',['B','A']);let os=b.objects.filter(o=>o.type==='circle');const pts=b.make('intersection',os.map(o=>o.id));b.make('line',pts);assert.ok(b.goal('perpbisector').ok);b.move('B',470,185);assert.ok(b.goal('perpbisector').ok);b.undo();assert.ok(!b.goal('perpbisector').ok);
assert.equal(G.intersections({type:'circle',o:{x:0,y:0},r:1},{type:'circle',o:{x:2,y:0},r:1}).length,1);assert.equal(G.intersections({type:'line',p:{x:0,y:0},q:{x:1,y:0}},{type:'line',p:{x:0,y:1},q:{x:1,y:1}}).length,0);
assert.equal(S.drawing({points:[],objects:[{id:'bad',type:'line',a:'A',b:'B'}]}),null);assert.throws(()=>S.validate({version:2,units:{}},[]));assert.equal(S.clean({written:'<script>x</script>'}).written,'<script>x</script>');
const key=T.fingerprint(T.task('segment',1));
assert.equal(key,T.fingerprint(T.task('segment',8)));
assert.notEqual(key,T.fingerprint(T.task('segment',2)));
assert.notEqual(T.fingerprint({question:'Same question',answer:1}),T.fingerprint({question:'Same question',answer:2}));
assert.deepEqual(S.clean({independent:12}).seenTasks,[]);assert.equal(S.clean({independent:12}).independent,12);
const remembered=S.clean({seenTasks:[key,key],currentTaskKey:key,repeatedTask:true,independent:12});
assert.deepEqual(remembered.seenTasks,[key]);assert.equal(remembered.currentTaskKey,key);assert.equal(remembered.repeatedTask,true);assert.equal(remembered.independent,12);
for(const u of C.units){const keys=new Set(Array.from({length:630},(_,seed)=>T.fingerprint(T.task(u.calc,seed))));assert.ok(keys.size<2048);assert.ok([...keys].every(k=>k.length<=1000));}
// A perpendicular to the wrong side must not pass the named construction.
for(const reverse of [false,true]){
 const b=new G.Board(G.scene('angle'));
 b.make('perpendicular',['A','B','C']);assert.equal(b.goal('perpendicular').ok,false);
 b.make('perpendicular',['C',...(reverse?['B','A']:['A','B'])]);assert.equal(b.goal('perpendicular').ok,true);
 b.move('A',480,320);assert.equal(b.goal('perpendicular').ok,true);
 const g=b.geometry(b.objects.at(-1));near(G.dist(b.point('C'),G.foot(b.point('C'),g.p,g.q)),0);
 near(G.dot(G.sub(g.q,g.p),G.sub(b.point('B'),b.point('A'))),0,1e-6);
 b.undo();assert.equal(b.goal('perpendicular').ok,false);
}
const onLine=new G.Board(G.scene('segment'));onLine.move('C',300,235);onLine.make('perpendicular',['C','A','B']);assert.equal(onLine.goal('perpendicular').ok,true);
const collapsed=new G.Board(G.scene('segment'));collapsed.make('perpendicular',['C','A','B']);collapsed.move('C',300,235);assert.equal(collapsed.goal('perpendicular').ok,false);
// Write denial must retain work for export, including later edits and imports.
const originalStorage=globalThis.localStorage;
try{
 for(const firstAction of ['put','import']){
  const disk=new Map([[S.KEY,JSON.stringify({version:1,units:{segments:{written:'Old work',updated:1}}})]]);
  let reads=0,writes=0;const warnings=[];
  globalThis.localStorage={getItem(k){if(k===S.KEY)reads++;return disk.get(k)||null;},setItem(k,v){if(k===S.KEY){writes++;throw Error('QuotaExceededError');}disk.set(k,v);}};
  const store=S.open(['segments','angles'],m=>warnings.push(m));
  if(firstAction==='put')store.put('segments',{written:'New work',drawing:JSON.parse(onLine.snapshot())},'written');
  else store.import({version:1,units:{segments:{written:'New work',updated:2,drawing:JSON.parse(onLine.snapshot())}}});
  const readsAtFailure=reads;
  assert.equal(store.get('segments').written,'New work');assert.equal(store.all().units.segments.written,'New work');
  assert.deepEqual(store.export().units.segments.drawing,S.drawing(JSON.parse(onLine.snapshot())));
  store.put('segments',{...store.get('segments'),written:'Further work'},'written');
  store.import({version:1,units:{segments:{written:'Older import',updated:1},angles:{written:'Imported work',updated:3}}});
  assert.equal(store.export().units.segments.written,'Further work');assert.equal(store.export().units.angles.written,'Imported work');
  assert.equal(JSON.parse(disk.get(S.KEY)).units.segments.written,'Old work');
  assert.equal(reads,readsAtFailure);assert.equal(writes,1);assert.ok(warnings.length);
 }
 // A read failure also falls back to the most recently read snapshot.
 let raw=JSON.stringify({version:1,units:{segments:{written:'Initial work',updated:1}}}),deny=false;
 globalThis.localStorage={getItem(){if(deny)throw Error('SecurityError');return raw;},setItem(){}};
 const store=S.open(['segments']);raw=JSON.stringify({version:1,units:{segments:{written:'Newer saved work',updated:2}}});
 assert.equal(store.get('segments').written,'Newer saved work');deny=true;assert.equal(store.export().units.segments.written,'Newer saved work');
}finally{if(originalStorage===undefined)delete globalThis.localStorage;else globalThis.localStorage=originalStorage;}
// Independent geometric residuals from the visible numerical conditions.
function nums(q){return (q.match(/-?\d+(?:\.\d+)?/g)||[]).map(Number);}
// Early exercises use the current topic, without later area/coordinate formulas.
for(let seed=0;seed<630;seed++){
 let t=T.task('isosceles',seed);near(t.answer,2*nums(t.question)[0]);
 t=T.task('inradius',seed);near(t.answer,3*nums(t.question)[0]);
 t=T.task('rectangle',seed);near(2*t.answer,nums(t.question)[0]);
 t=T.task('rhombus',seed);near(2*t.answer+nums(t.question)[0],180);
 t=T.task('reflection',seed);near(t.answer,2*nums(t.question)[0]);
 t=T.task('central',seed);near(2*t.answer,nums(t.question)[0]);
 t=T.task('vector',seed);const lengths=nums(t.question);assert.equal(t.answer,t.question.includes('сонаправлены')&&lengths[0]===lengths[1]?'да':'нет');
 t=T.task('vector-add',seed);const a=nums(t.question);near(t.answer,a[0]-a[1]);
 t=T.task('vector-scale',seed);const b=nums(t.question);near(t.answer,b[0]*b[1]);
}
for(let seed=0;seed<100;seed++){
 let t=T.task('pythagoras',seed),a=nums(t.question);near(a[0]**2,a[1]**2+t.answer**2);
 t=T.task('heron',seed);a=nums(t.question);const p=a.reduce((x,y)=>x+y)/2;near(t.answer**2,p*(p-a[0])*(p-a[1])*(p-a[2]),1e-5);
 t=T.task('area-parallelogram',seed);a=nums(t.question);assert.ok(a[2]>=a[1]);near(t.answer/a[0],a[1]);
 t=T.task('regular',seed);a=nums(t.question);near(a[0]/8,a[1]);near(t.answer,(a[0]/4)**2);
 t=T.task('trig',seed);a=nums(t.question);near(a[0]**2+a[1]**2,a[2]**2);near(t.answer*a[2],a[3]);
 t=T.task('trig-circle',seed);a=nums(t.question);near((a[0]/a[1])**2+t.answer**2,1);assert.ok(t.answer<0);
}
console.log(JSON.stringify({status:'PASS',units:63,points:137,proofs:Object.keys(P).length,assertions:n},null,2));
