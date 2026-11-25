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

test('invalid or missing resources and incomplete probe arrays fail closed',()=>{
  const invalid=["//external.test/","/\\external.test/","/learning","/learning?private=1","/learning#secret","/Learning/","/foo/../learning/","/foo/%2e%2e/learning/","/%2flearning/","/foo\n/bar","https://mathexam.space/foundations/","javascript:alert(1)"," /foundations/","/foo//bar","/./","/../"];
  for(const href of invalid){assert.equal(m.publicHref(href),null,href);assert.equal(m.resource('place',{get:()=>({publicUrl:href})}),null,href);}
  for(const href of ["/","/foundations/","/equations/linear-pilot/","/ege-baza/path/index.html#lesson=pre7-place-value","/ege-profil/trainers/probability-t45.html?topic=basic","/trainers/oge-basics/multiplication-division/arzhenikov-map.html#course-c-quotient"])assert.equal(m.publicHref(href),href);
  assert.equal(m.resource('missing',registry),null);
  assert.equal(m.resource('place',{}),null);
  assert.equal(m.resource('place',{get:()=>undefined}),null);
  assert.equal(m.resource('place',{get:()=>({kind:'managed',url:'/learning/'})}),null);
  assert.equal(m.result('missing',[]).kind,'not-tested');
  for(const answers of [Array(2),['0',,],['0',undefined],[0,1]])assert.equal(m.result('linear',answers).kind,'incomplete');
});

test('typed prerequisites are authored hypotheses and reuse the single source of edges',()=>{
 assert(m.validate(m.nodes,m.goals,registry));
 const edges=m.candidateEdges();
 assert.deepEqual(edges.map(e=>[e.from,e.to]),m.nodes.flatMap(n=>n.before.map(id=>[id,n.id])));
 assert.equal(new Set(edges.map(e=>e.from+':'+e.to)).size,edges.length);
 for(const e of edges){
  assert.equal(e.type,'candidate-prerequisite');
  assert.equal(e.status,'hypothesis');
  assert.equal(e.provenance,'school-journey-v1-authored');
  assert(m.find(e.from));assert(m.find(e.to));
 }
});
test('graph contract rejects broken sources, duplicate and sparse data, and circular prerequisites',()=>{
 const copy=x=>JSON.parse(JSON.stringify(x));
 const cases=[
  ['duplicate skill',(n,g)=>n.push(copy(n[0]))],
  ['duplicate goal',(n,g)=>g.push(copy(g[0]))],
  ['unknown prerequisite',(n,g)=>n[0].before.push('not-a-skill')],
  ['self edge',(n,g)=>n[0].before.push(n[0].id)],
  ['duplicate edge',(n,g)=>n[1].before.push(n[1].before[0])],
  ['cycle',(n,g)=>n[0].before.push(n[1].id)],
  ['missing source',(n,g)=>n[0].source='absent'],
  ['private route',(n,g)=>n[0].extra.push('/learning/#private')],
  ['duplicate route',(n,g)=>n[0].extra.push(n[0].extra[0])],
  ['unknown goal skill',(n,g)=>g[0].path.push('not-a-skill')],
  ['duplicate goal skill',(n,g)=>g[0].path.push(g[0].path[0])],
  ['unknown start',(n,g)=>g[0].start='not-a-skill'],
  ['blank prompt',(n,g)=>n[0].questions[0].prompt=' '],
  ['blank explanation',(n,g)=>n[0].questions[0].explain=''],
  ['blank choice',(n,g)=>n[0].questions[0].choices[0]=''],
  ['blank title',(n,g)=>n[0].title=' '],
  ['no resources',(n,g)=>{n[0].source=null;n[0].extra=[]}],
  ['sparse prerequisites',(n,g)=>n[0].before.length=1],
  ['sparse choices',(n,g)=>delete n[0].questions[0].choices[1]],
  ['sparse goal path',(n,g)=>delete g[0].path[1]]
 ];
 for(const [label,change] of cases){
  const n=copy(m.nodes),g=copy(m.goals);change(n,g);
  assert.throws(()=>m.validate(n,g,registry),undefined,label);
 }
 assert.throws(()=>m.validate(m.nodes,m.goals,{get:()=>({id:'different',publicUrl:'/foundations/'})}));
 assert.throws(()=>m.validate(m.nodes,m.goals,{get:id=>({id,kind:'managed',url:'/learning/#private'})}));
 const extraOnly=copy(m.nodes);extraOnly[0].source=null;
 assert(m.validate(extraOnly,m.goals,registry),'A valid public secondary route is sufficient');
});


test('school view includes the senior stage and existing cross-topic practice',()=>{
  assert.deepEqual(new Set(m.goal('school').path),new Set(m.nodes.map(n=>n.id)));
  assert.equal(m.next('school','probability').id,'trig');
  assert.equal(m.next('school','trig').id,'stereo');
  assert.equal(m.next('school','stereo').id,'analysis');
  assert.equal(m.next('school','analysis'),null);
  assert(m.goal('base').path.includes('stereo'));
  const published={expression:'/trainers/like-terms-factory.html',modeling:'/trainers/motion-grade6/',function:'/trainers/college-functions/',proof:'/trainers/oge-written-practice.html',probability:'/trainers/tyurin-statistics/'};
  for(const [id,url] of Object.entries(published)){assert(m.find(id).extra.includes(url),id);local(url);}
  assert(m.find('linear').extra.includes('/equations/linear-pilot/'));
});
