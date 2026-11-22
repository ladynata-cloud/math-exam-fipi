'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('./check.js'),G=require('./task-graphs.js'),P=require('./models.js');
const world={window:{}};vm.runInNewContext(fs.readFileSync(__dirname+'/data.js','utf8'),world);
const lesson=world.window.MakarychevCourse.lessons.find(l=>l.id==='p46'),cards=require('./exercises-1137-1143.json');
assert.equal(cards.length,16);assert.equal(lesson.tasks.length,22);
const ordered=Array.from(lesson.studyOrder,i=>lesson.tasks[i]),school=ordered.filter(t=>t.source.type==='textbook');
assert.deepEqual(ordered.slice(-2).map(t=>t.id),['p46-t05','p46-t06']);
assert.equal(school.length,20);
const numbers=school.map(t=>Number(t.source.reference.match(/\d+/)[0]));
assert.deepEqual(numbers,[1137,1137,1137,1137,1138,1138,1138,1138,1138,1139,1139,1140,1140,1140,1141,1141,1142,1142,1142,1143]);
for(const [i,id] of ['p46-t01','p46-t02','p46-t03','p46-t04'].entries())assert.equal(lesson.tasks[i].id,id);
for(const card of school){assert.equal(card.source.page,256);assert(C.check(card.answer,card));}
const expected=['4','98','-3','0','1/9','0','17/100','3','π−3','-6','2/5','3/5'];
for(const [i,a]of expected.entries())assert(C.check(a,cards[i]));
for(const t of cards.filter(t=>t.kind==='floor-graph-piece')){
 const g=t.graph;
 for(let k=-13;k<=13;k++){
  const left=g.saw?0:k*g.outer,right=g.saw?g.outer:left;
  const f='('+k+'/'+g.inside+';'+left+'), ('+(k+1)+'/'+g.inside+';'+right+')';
  assert(C.check(f+' | [)',t));for(const ends of ['[]','(]','()'])assert(!C.check(f+' | '+ends,t));
  assert(!C.check('('+k+'/'+g.inside+';'+left+'), ('+(k+2)+'/'+g.inside+';'+right+') | [)',t));
 }
}
const variants={};
for(const id of ['floor-fraction-part','floor-graph-segments']){
 const prompts=new Set();
 for(let seed=0;seed<100;seed++)for(let level=1;level<=3;level++){
  const t=P.practiceFinalFunction(id,seed,level);assert(C.check(t.answer,t));prompts.add(t.prompt);
  if(t.kind==='number'){
   const [n,d]=t.graph.x.split('/').map(Number),floor=Math.floor(n/d),v=t.graph.mode==='floor'?floor:n/d-floor;
   const [a,b=1]=t.answer.split('/').map(Number);assert(Math.abs(a/b-v)<1e-12);
  }else assert.equal(G.floorPiece(t.graph,C,t.answer).status,'valid');
 }
 variants[id]=prompts.size;assert(prompts.size>=8);
}
console.log('PASS all 20 source subparts, old positions, mixed negatives, exact π remainder, arbitrary translated graph pieces, strict endpoints and 600 practice cases',variants);
