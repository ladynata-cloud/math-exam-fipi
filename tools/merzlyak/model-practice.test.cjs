'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const coursePath = path.resolve(__dirname, '../../geometry-merzlyak');
const math = require(coursePath + '/assets/geometry.js');
const store = require(coursePath + '/assets/store.js');
global.GeoTasks = require(coursePath + '/assets/tasks.js');
const tasks = require(coursePath + '/assets/extra-tasks.js');

const point = (id, x, y) => ({id, kind:'free', x, y});
const line = (id, a, b, extent) => ({id, a, b, type:'line', extent});
function crossing(extent) {
 return new math.Board({
  points:[point('A',100,100),point('B',200,100),point('C',250,60),point('D',250,200)],
  objects:[line('AB','A','B',extent),line('CD','C','D','line')]
 });
}

test('a segment or ray meets a line only on the selected objects', () => {
 const segment = crossing('segment');
 assert.throws(() => segment.make('intersection',['AB','CD']));
 assert.deepEqual(math.nearestOnObject({x:250,y:104},segment.geometry('AB')),{x:200,y:100});
 const [extension] = segment.make('line',['A','B']);
 const [p] = segment.make('intersection',[extension,'CD']);
 assert.equal(segment.point(p).x,250);
 const ray = crossing('ray');
 const [q] = ray.make('intersection',['AB','CD']);
 assert.equal(ray.point(q).x,250);
 ray.move('C',70,60); ray.move('D',70,200);
 assert.equal(ray.point(q).valid,false);
 assert.throws(() => ray.make('intersection',['AB','CD']));
 ray.move('C',100,60); ray.move('D',100,200);
 assert.equal(ray.point(q).valid,true);
 assert.equal(ray.point(q).x,100);
});

test('a segment-circle intersection keeps its root through movement and saved reload', () => {
 const board = new math.Board({
  points:[point('A',70,100),point('B',150,100),point('O',150,100),point('R',190,100)],
  objects:[line('AB','A','B','segment'),{id:'circle',type:'circle',a:'O',b:'R'}]
 });
 const ids = board.make('intersection',['AB','circle']);
 assert.equal(ids.length,1);
 const p = board.point(ids[0]);
 assert.equal(p.branch,1);
 assert.equal(p.x,110);
 board.move('B',210,100);
 assert.equal(p.x,110);
 const restored = new math.Board(store.drawing(JSON.parse(board.snapshot())));
 restored.move('A',130,100);
 assert.equal(restored.point(p.id).valid,false);
 restored.move('A',70,100);
 assert.equal(restored.point(p.id).x,110);
 assert.equal(restored.point(p.id).valid,true);
 const legacy = JSON.parse(board.snapshot());
 delete legacy.points.at(-1).bounded;
 const prior = new math.Board(store.drawing(legacy));
 prior.move('A',130,100);
 assert.equal(prior.point(p.id).valid,true);
 assert.equal(prior.point(p.id).x,110);
});

test('lesson 7 §8 uses both congruence criteria and two counterexamples', () => {
 const course = require(coursePath + '/data/course.json');
 const unit = course.units.find(u => u.id === 'merzlyak-base-7-8');
 const html = fs.readFileSync(path.join(coursePath,'atlas',unit.id+'.html'),'utf8');
 const config = JSON.parse(html.match(/window\.COURSE_CONFIG=(.*?);<\/script>/s)[1]);
 assert.deepEqual(config.unit,unit);
 assert.equal(config.investigation,unit.investigation);
 const old = {contentVersion:1,stage:4,seed:7,draft:'Периметр равен 36',independent:3,written:'Моё решение'};
 const migrated = store.validate({version:1,units:{[unit.id]:old}},[unit.id]).units[unit.id];
 assert.equal(migrated.previousContent.draft,old.draft);
 assert.equal(migrated.previousContent.independent,3);
 assert.equal(migrated.previousContent.written,old.written);
 assert.equal(migrated.independent,0);
 assert.equal(migrated.contentVersion,unit.contentVersion);
 for (let seed=0; seed<32; seed++) {
  const task = tasks.task(unit.calc,seed);
  for(const [i,step] of task.steps.entries()) assert.ok(tasks.equalTask(task,tasks.format(step.answer),i));
  switch(seed%4){
  case 0:
   assert.match(task.question,/AB=DF=.*AC=DE=.*∠BAC=∠FDE/);
   assert.ok(tasks.equalTask(task,'F'));
   assert.ok(tasks.equalTask(task,'а',0));
   assert.ok(!tasks.equalTask(task,'D'));
   break;
  case 1: {
   assert.match(task.question,/AB=FD, ∠A=∠F=.*∠B=∠D/);
   assert.ok(tasks.equalTask(task,'Е',1));
   const bc=Number(task.question.match(/BC=(\d+)/)[1]);
   assert.ok(tasks.equalTask(task,String(bc)));
   break;
  }
  case 2: {
   // Choose B=(0,0), A=(AB,0), C=t(cos30°,sin30°). Both distinct
   // positive roots of |C-A|=AC yield the same supplied measurements.
   const ab=Number(task.question.match(/AB=DE=(\d+)/)[1]);
   const ac=Number(task.question.match(/AC=DF=(\d+)/)[1]);
   const projection=ab*Math.cos(Math.PI/6),halfChord=Math.sqrt(ac*ac-(ab/2)**2);
   assert.ok(projection-halfChord>0 && halfChord>0);
   assert.ok(tasks.equalTask(task,'нет'));
   break;
  }
  default: {
   const angles=[...task.question.matchAll(/(\d+)°/g)].map(m=>Number(m[1]));
   assert.equal(angles.reduce((x,y)=>x+y,0),180);
   assert.ok(tasks.equalTask(task,'нет'));
  }
  }
 }
});

test('collinear objects intersect only if precisely one point is common', () => {
 const board=(c,d,abType='segment',cdType='segment')=>new math.Board({
  points:[point('A',100,100),point('B',200,100),point('C',c,100),point('D',d,100)],
  objects:[line('AB','A','B',abType),line('CD','C','D',cdType)]
 });
 for(const [c,d,a,b,x] of [
  [200,300,'segment','segment',200],[300,200,'segment','segment',200],
  [100,50,'ray','ray',100],[200,250,'segment','ray',200]
 ]){
  const current=board(c,d,a,b);
  const [id]=current.make('intersection',['AB','CD']);
  assert.equal(current.point(id).x,x);
  assert.equal(current.point(id).y,100);
 }
 for(const args of [[140,260],[240,300],[100,200,'line','line'],[100,300,'ray','ray']]){
  assert.throws(()=>board(...args).make('intersection',['AB','CD']));
 }
});

test('first incidence and SSS lessons require the named constructions and preserve older work', () => {
 const units=require(coursePath+'/data/course.json').units;
 for(const [suffix,expected] of [['1',[1,'нет',1,3]],['11',['M',3,'нет','нет']]]){
  const id='merzlyak-base-7-'+suffix;
  const u=units.find(u=>u.id===id);
  const html=fs.readFileSync(path.join(coursePath,'atlas',id+'.html'),'utf8');
  const cfg=JSON.parse(html.match(/window\.COURSE_CONFIG=(.*?);<\/script>/s)[1]);
  assert.deepEqual(cfg.unit,u);
  assert.deepEqual(cfg.proof,require(coursePath+'/data/proofs.json')[u.proof]);
  for(let seed=0;seed<32;seed++){
   const task=tasks.task(u.calc,seed);
   assert.equal(task.answer,expected[seed%4]);
   if(suffix==='11' && seed%4===0){
    assert.ok(tasks.equalTask(task,'м'));
    assert.ok(tasks.equalTask(task,'М',2));
    assert.ok(!tasks.equalTask(task,'Л'));
   }
   if(suffix==='11' && seed%4===2){
    const numbers=[...task.question.matchAll(/\d+/g)].map(m=>Number(m[0]));
    assert.ok(numbers[0]+numbers[1]>numbers[3]);
    assert.notEqual(numbers[2],numbers[3]);
   }
  }
  const old={contentVersion:1,stage:4,draft:'Прежнее задание',independent:2};
  const migrated=store.validate({version:1,units:{[id]:old}},[id]).units[id];
  assert.equal(migrated.previousContent.draft,old.draft);
  assert.equal(migrated.independent,0);
  const board=new math.Board(math.scene(u.figure));
  if(suffix==='1'){
   board.make('segment',['A','B']);assert.equal(board.goal(u.goal).ok,false);
   board.make('line',['B','A']);assert.equal(board.goal(u.goal).ok,true);
   board.move('B',board.point('A').x,board.point('A').y);
   assert.equal(board.goal(u.goal).ok,false);
  }else{
   const [a]=board.make('circle',['A','C']),[b]=board.make('circle',['B','C']);
   const rp=board.make('intersection',[a,b]).map(id=>board.point(id)).find(p=>math.dist(p,board.point('C'))>1);
   assert.ok(rp.y>=30 && rp.y<=385);
   assert.equal(board.goal(u.goal).ok,false);
   board.make('segment',['A',rp.id]);board.make('segment',['B',rp.id]);
   assert.equal(board.goal(u.goal).ok,true);
   for(const endpoint of ['A','B']) assert.ok(Math.abs(math.dist(board.point(endpoint),rp)-math.dist(board.point(endpoint),board.point('C')))<1e-8);
   board.undo();
   assert.equal(board.goal(u.goal).ok,false);
  }
 }
});

test('perpendicular lines require a right angle even after rotating the original line', () => {
 const unit = require(coursePath+'/data/course.json').units.find(u=>u.id==='merzlyak-base-7-5');
 const config=JSON.parse(fs.readFileSync(path.join(coursePath,'atlas',unit.id+'.html'),'utf8').match(/window\.COURSE_CONFIG=(.*?);<\/script>/s)[1]);
 assert.deepEqual(config.unit,unit);
 assert.equal(config.proof.id, 'perpendicular-angles');
 const b=new math.Board(math.scene(unit.figure));
 assert.equal(b.objects[0].extent,'line');
 assert.equal(b.goal(unit.goal).ok,false);
 const [id]=b.make('perpendicular',['C','A','B']);
 for(const [x,y] of [[400,180],[160,100],[200,330]]){
  b.move('B',x,y);
  assert.equal(b.goal(unit.goal).ok,true);
  assert.ok(Math.abs(math.dot(math.sub(b.point('B'),b.point('A')),math.sub(b.point(id),b.point('C'))))<1e-6);
 }
 // Keep the actual foot coincident with C and the full line available at the boundary.
 b.move('A',100,200);b.move('B',400,200);b.move('C',250,200);
 const restoredBoard=new math.Board(store.drawing(JSON.parse(b.snapshot())));
 for(const board of [b,restoredBoard]){
  assert.equal(math.dist(board.point(id),board.point('C')),0);
  for(const [cx,cy,bx,by] of [[250,200,400,200],[250,260,400,200],[250,250,400,300],[250,100,400,300]]){
   board.move('B',bx,by);board.move('C',cx,cy);
   assert.equal(board.goal(unit.goal).ok,true);
   const line=board.geometry(board.objects.at(-1));
   assert.ok(math.dist(line.p,line.q)>1);
   assert.ok(Math.abs(math.dot(math.sub(line.p,line.q),math.sub(board.point('A'),board.point('B'))))<1e-6);
  }
  board.move('B',100,200);
  assert.equal(board.goal(unit.goal).ok,false);
 }
 for(let seed=0;seed<48;seed++){
  const task=tasks.task(unit.calc,seed);
  if(seed%4===0){
   const [,given]=task.question.match(/AOE равен (\d+)°/);
   assert.equal(task.answer+Number(given),90);
  }else assert.equal(task.answer,seed%4===1?2:'нет');
 }
 const legacy={seed:4,stage:4,draft:'155',independent:1};
 const restored=store.validate({version:1,units:{[unit.id]:legacy}},[unit.id]).units[unit.id];
 assert.equal(restored.independent,0);
 assert.equal(restored.previousContent.draft,'155');
 assert.equal(restored.previousContent.independent,1);
});

test('coordinate differences, opposite vectors, translation and revised saved work in 9 §13', () => {
 const id='merzlyak-base-9-13';
 const u=require(coursePath+'/data/course.json').units.find(u=>u.id===id);
 const html=fs.readFileSync(path.join(coursePath,'atlas',id+'.html'),'utf8');
 assert.deepEqual(JSON.parse(html.match(/window\.COURSE_CONFIG=(.*?);<\/script>/s)[1]).unit,u);
 assert.ok(html.indexOf('assets/vector-components.js')<html.indexOf('assets/lab.js'));
 const w={GeoMath:math};
 require('node:vm').runInNewContext(fs.readFileSync(coursePath+'/assets/vector-components.js','utf8'),{window:w});
 const board=new w.GeoVectorComponents.VectorBoard();
 assert.equal(board.goal().ok,false);
 assert.ok(board.setCoordinates('D',2,4));assert.equal(board.goal().ok,true);
 assert.ok(board.setCoordinates('A',1,1));assert.equal(board.goal().ok,false);
 assert.ok(board.setCoordinates('D',-1,2));assert.equal(board.goal().ok,true);
 assert.ok(board.undo());assert.equal(board.goal().ok,false);
 assert.equal(board.setCoordinates('A',4,0),false);
 const observed=new Set();
 for(let seed=0;seed<35;seed++){
  const task=tasks.task(u.calc,seed);
  const pts=[...task.question.matchAll(/([ABCD])\((-?\d+); (-?\d+)\)/g)].map(m=>m.slice(2).map(Number));
  const [a,b,c,d]=pts;
  const sub=(end,start)=>end.map((v,i)=>v-start[i]);
  const delta=sub(b,a);observed.add(delta.join(';'));
  if(seed%5===0)assert.deepEqual(task.answer,delta);
  if(seed%5===1)assert.deepEqual(task.answer,sub(a,b));
  if(seed%5===2)assert.deepEqual(sub(task.answer,c),delta);
  if(seed%5>=3)assert.equal(task.answer,sub(d,c).every((v,i)=>delta[i]===v)?'да':'нет');
 }
 assert.ok(observed.has('0;0'));
 assert.ok([...observed].some(v=>v.startsWith('0;')&&v!=='0;0'));
 const migrated=store.validate({version:1,units:{[id]:{stage:4,draft:'Базис',independent:2}}},[id]).units[id];
 assert.equal(migrated.previousContent.draft,'Базис');
 assert.equal(migrated.independent,0);
});
