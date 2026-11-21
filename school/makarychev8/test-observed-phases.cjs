'use strict';
const assert=require('node:assert/strict');
const graphs=require('./task-graphs.js'),checker=require('./check.js'),models=require('./models.js');
const cards=require('./exercises-1097-1099.json');
assert.equal(cards.length,10);
for(const task of cards){
 assert(checker.check(task.answer,task),task.id);
 for(const step of task.steps)assert(checker.check(step.answer,step),task.id);
}
const speed={scenario:'speed'},ice={scenario:'ice'},water={scenario:'water'};
let comparisons=0;
for(let i=-40;i<=1700;i++){
 const t=i/100;const expectedSpeed=t<0||t>16?null:t<=6?5*t/6:t<=14?5:5*(16-t)/2;
 const expectedIce=t<0||t>16?null:t<=4?5*t/4-5:t<=10?0:(t-10)/2;
 for(const [g,expected] of [[speed,expectedSpeed],[ice,expectedIce]]){
  const observation=graphs.phaseReading(g,t);
  if(expected===null)assert.equal(observation,null);
  else assert(Math.abs(observation.y-expected)<1e-9);
  comparisons++;
 }
}
for(let i=1;i<=2800;i++){
 const t=i/100,y=graphs.phaseReading(water,t).y,previous=graphs.phaseReading(water,t-.01).y;
 assert(t<=13?y>=previous-1e-10:y<=previous+1e-10);
 assert(y<=100&&y>=20);comparisons++;
}
for(const [t,y]of [[0,20],[13,100],[28,70]])assert.equal(graphs.phaseReading(water,t).y,y);
for(const [i,right,open] of [[0,'0≤t≤6','(0;6)'],[1,'14≤t≤16','[6;14]'],[2,'6≤t≤14','(6;14)']]){
 assert(checker.check(right,cards[i]));assert(!checker.check(open,cards[i]));
}
for(let seed=1;seed<=160;seed++)for(let level=1;level<=3;level++){
 const task=models.practicePhases(seed,level),nodes=task.graph.nodes;
 const probe=nodes.slice(0,-1).map((point,i)=>(point[0]+nodes[i+1][0])/2);
 assert.deepEqual(probe.map(x=>graphs.phaseReading(task.graph,x).direction),[1,0,-1]);
 assert(checker.check(task.answer,task));comparisons+=4;
}
console.log('PASS '+comparisons+' independent graph readings, monotonicity samples and fresh function changes.');
