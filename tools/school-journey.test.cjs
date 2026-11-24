'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const m=require('../learning/school-journey.js'),registry=require('../learning/preparation-map.js');
const root=path.resolve(__dirname,'..');
function local(href){
  const u=new URL(href,'https://mathexam.space');
  assert.equal(u.origin,'https://mathexam.space');assert(!u.pathname.startsWith('/learning/'));
  const file=path.join(root,u.pathname.replace(/^\//,''),u.pathname.endsWith('/')?'index.html':'');
  assert(fs.statSync(file).isFile(),href);
}
test('subject graph is acyclic, goal paths are nonbinding and reuse public resources',()=>{
  assert(m.validate());assert.equal(m.nodes.length,22);assert.equal(m.goals.length,7);
  for(const n of m.nodes){
    if(n.source){assert(registry.get(n.source),n.source);assert(m.resource(n.id,registry),n.id);local(m.resource(n.id,registry));}
    n.extra.forEach(local);
    for(const id of n.before)assert(m.find(id));
  }
  m.goals.forEach(g=>local(g.href));assert.equal(m.next('algebra','linear').id,'modeling');
  assert.equal(m.next('geometry','fractions'),null);
});
test('two independent probes never become a mastery verdict',()=>{
  assert.equal(m.nodes.filter(n=>n.questions.length).length,13);
  for(const n of m.nodes){
    if(!n.questions.length){assert.equal(m.result(n.id,[]).kind,'not-tested');continue;}
    assert.deepEqual(m.result(n.id,n.questions.map(q=>q.answer)),{kind:'two-correct',correct:2});
    assert.equal(m.result(n.id,[n.questions[0].answer,'?']).kind,'check-again');
    assert.equal(m.result(n.id,['?','?']).kind,'practice');
    for(const bad of [[],[undefined,'?'],['9','0'],['0','0','0']])assert.equal(m.result(n.id,bad).kind,'incomplete');
  }
  assert.equal(m.resource('place',{get:()=>({publicUrl:'/learning/#secret'})}),null);
  assert.equal(m.resource('place',{get:()=>({publicUrl:'//external.test'})}),null);
  assert.deepEqual(m.selection({goal:'profile',node:'analysis'}),{goal:'profile',node:'analysis'});
  assert.deepEqual(m.selection({goal:'bad',node:'linear'}),{goal:'foundations',node:'place'});
});
test('authored diagnostic answers match independent arithmetic and semantic cases',()=>{
  const expected={
    place:[String(Math.floor(4050/100)%10),String(3*1000+7)],
    add:[String(402-185),String(168+57)],multiply:[String(7*8),String(42/6)],
    division:[String(306/3),String(29%6)],divisibility:[String(Array.from({length:48},(_,i)=>i+1).find(i=>i%6===0&&i%8===0)),'126'],
    'fraction-meaning':[String(12*3/4),'3/4'],fractions:['5/6','1/2'],decimals:['0,8',String(48/12)],
    signed:[String(-7+10),String(-4-(-6))],ratio:[String(20*2/5),String(12/3*5)],
    percent:[String(200*15/100),String(110*10/11)],expression:['2a + 6',String(3*4-4+2)],
    linear:[String((6-2)*3),String((-7-5)/(-3))]
  };
  for(const [id,answers] of Object.entries(expected))assert.deepEqual(m.find(id).questions.map(q=>q.choices[Number(q.answer)]),answers,id);
  assert.equal(2*6+1*3,5*3); // common-denominator equivalent numerators
  assert.equal(3*2*2,4*3); // 3/4 * 2/3 = 1/2
});
test('existing home remains accessible, public navigator is not duplicated',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.equal((html.match(/id="learning-journey"/g)||[]).length,1);
  assert.equal((html.match(/navigator-widget\.js/g)||[]).length,1);
  assert.equal((html.match(/navigator-data\.js/g)||[]).length,1);
  for(const href of ['/trainers/','/foundations/','/courses/','/oge/','/ege-baza/','/ege-profil/','/geometry-course/'])assert(html.includes('href="'+href+'"'),href);
  assert(html.includes('id="sj-details" hidden'));
  assert(!fs.readFileSync(path.join(root,'assets/school-journey-home.js'),'utf8').includes('fetch('));
});
