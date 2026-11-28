'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'../../geometry-pogorelov');
const {units}=require(path.join(root,'data/course.json'));
const G=require(path.join(root,'assets/geometry.js'));
require(path.join(root,'assets/topic-labs.js'));
global.GeoTasks=require(path.join(root,'assets/tasks.js'));
const T=require(path.join(root,'assets/extra-tasks.js'));
const store=require(path.join(root,'assets/store.js'));
const labs=global.PogorelovTopicLabs;
const revised=units.filter(u=>u.topicQuestion);
assert.deepEqual(revised.map(u=>u.points[0]),[16,20,39,61,62,67,80,98,112,127,131]);
for(const u of revised){
  const id=u.points[0],board=new G.Board(labs.scene(id));
  assert.ok(labs.measure(id,board).length);
  assert.match(labs.proofFigure(id),/<figcaption>/);
  const page=fs.readFileSync(path.join(root,'atlas',u.id+'.html'),'utf8');
  assert.ok(page.includes(JSON.stringify(u.topicQuestion))&&page.includes('src="../assets/topic-labs.js"'));
}
const near=(x,y)=>assert.ok(Math.abs(x-y)<1e-8,`${x} != ${y}`);
const perpendicular=new G.Board(labs.scene(16));
perpendicular.move('A',100,200);perpendicular.move('B',400,200);
perpendicular.move('C',250,100);
const [foot]=perpendicular.make('perpendicular',['C','A','B']);
perpendicular.move('C',250,200);
const loaded=new G.Board(store.drawing(JSON.parse(perpendicular.snapshot())));
for(const board of [perpendicular,loaded]){
  assert.equal(G.dist(board.point(foot),board.point('C')),0);
  for(const [cx,cy,bx,by] of [[250,200,400,200],[250,300,400,200],[250,250,400,300],[250,160,400,300]]){
    board.move('B',bx,by);board.move('C',cx,cy);
    assert.ok(board.goal('perpendicular').ok);
    assert.match(labs.measure(16,board).join(' '),/90°/);
    assert.ok(board.geometry(board.objects.at(-1)));
  }
  board.move('B',100,200);
  assert.equal(board.goal('perpendicular').ok,false);
  assert.match(labs.measure(16,board).join(' '),/совпали/);
}
const circle=new G.Board(labs.scene(80));
for(const [y,expected] of [[119,0],[120,1],[121,2],[220,2],[319,2],[320,1],[321,0]]){
  circle.move('C',190,y);
  assert.ok(labs.measure(80,circle).includes('Общих точек: '+expected));
}
const disk=new G.Board(labs.scene(131));
assert.ok(labs.measure(131,disk).includes('Радиус OA = 1'));
disk.move('A',420,220);
assert.ok(labs.measure(131,disk).includes('Радиус OA = 2'));
const equal=new G.Board(labs.scene(127));
const cosine=new G.Board(labs.scene(62));
for(const value of [115,180,305,450,570]){
  equal.move('D',value,45);
  const [,area1,area2]=labs.measure(127,equal);
  assert.equal(area1.split(' = ')[1],area2.split(' = ')[1]);
  cosine.move('C',value,200);
  const [,r1,r2]=labs.measure(62,cosine);
  assert.equal(r1.split(' = ')[1],r2.split(' = ')[1]);
}
const centroid=new G.Board(labs.scene(61));
const sas=new G.Board(labs.scene(20));
for(const x of [80,150,290,490]){
  centroid.move('C',x,110);sas.move('C',x,112);
  assert.deepEqual(labs.measure(61,centroid),['AG/GD = 2','BG/GE = 2']);
  const side=(a,b)=>G.dist(sas.point(a),sas.point(b));
  near(side('A','B'),side('D','E'));near(side('A','C'),side('D','F'));near(side('B','C'),side('E','F'));
}
const signs=new Set();
for(let seed=0;seed<420;seed++){
  const x=2+seed%7,y=3+seed*3%5,k=2+seed%4,v=seed%3;
  assert.equal(T.task('triangle-criteria',seed).answer,[x+k,35+x*k,'нет'][v]);
  assert.equal(T.task('triangle-centers',seed).answer,[2*x,x+k,x+k][v]);
  const count=T.task('line-circle',seed).answer;
  assert.equal(count,[2,1,0][v]);
  near(T.task('disk-area',seed).answer,v===2?k*k:Math.PI*x*x);
  assert.equal(T.task('circumradius',seed).answer,v===1?x:2*x);
  assert.equal(T.task('equal-base-height',seed).answer,[x*y,y,x][v]);
  const dot=T.task('coordinate-product',seed).answer;
  assert.equal(dot,[-1,0,1][v]*k*y);
  signs.add(Math.sign(dot));
  for(const kind of ['acute-sine','acute-cosine']){
    const task=T.task(kind,seed);
    const [,ac,bc,ab]=task.question.match(/AC=(\d+), BC=(\d+), AB=(\d+)/).map(Number);
    const [,name,angle]=task.question.match(/Найди (\w+) ([AB])/);
    const opp=angle==='A'?bc:ac,adj=angle==='A'?ac:bc;
    near(task.answer,{sin:opp/ab,cos:adj/ab,tg:opp/adj,ctg:adj/opp}[name]);
  }
  const other=T.task('opposite-sides',seed);
  if(v===0)assert.ok(90-2*x>50+x);
  assert.equal(other.answer,[k+x,35+x,95-2*x][v]);
}
assert.equal(signs.size,3);
// Importing an old topic adds its original work to the archive. It never
// supersedes an active revision just because the imported file is newer.
const db=new Map();
global.localStorage={getItem:key=>db.get(key)||null,setItem:(key,value)=>db.set(key,value)};
const id=revised.find(x=>x.points[0]===127).id;
const legacy=(note,time)=>({version:1,units:{[id]:{updated:time,written:note,independent:3,proofDone:['s1','s2'],seed:9,drawing:new G.Board(G.scene('triangle')).spec}}});
const old=legacy('По формуле Герона',12);
db.set(store.KEY,JSON.stringify(old));
let s=store.open([id]);
assert.equal(s.get(id).independent,0);
assert.equal(s.get(id).previousEdition.independent,3);
assert.deepEqual(s.get(id).proofDone,[]);
s.put(id,{...s.get(id),written:'Площадь равна половине основания на высоту.',forecast:'Площадь сохранится.'});
s.import(legacy('Последняя запись по Герону',Date.now()+10000));
const recovered=s.get(id);
assert.match(recovered.written,/основания/);
assert.equal(recovered.forecast,'Площадь сохранится.');
assert.equal(recovered.previousEdition.written,'Последняя запись по Герону');
assert.deepEqual(recovered.previousEdition.proofDone,['s1','s2']);
const saved=s.export();
db.clear();
s=store.open([id]);
s.import(saved);s.import(old);
assert.deepEqual(s.get(id),recovered);
console.log('POGORELOV_TOPIC_ALIGNMENT_OK',revised.length,'revised topics, 420 seeds, geometry and stored work');
