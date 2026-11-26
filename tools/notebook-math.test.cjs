'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const context=vm.createContext({});
for(const p of ['data','models','app'])vm.runInContext(read('trainers/notebook-math-'+p+'.js'),context);
const D=context.NotebookMathData,C=context.NotebookMathCore,M=context.NotebookModels;
test('All authored lessons and exercises, distinct IDs, usable answer keys',()=>{
 assert.equal(D.length,50);assert.equal(D.reduce((n,l)=>n+l[6].length,0),142);
 assert.equal(new Set(D.map(l=>l[0])).size,D.length);
 assert.equal(new Set(D.map(l=>l[1])).size,8);
 for(const l of D){
  assert(l[3]&&l[4]&&l[5].length>=2&&l[6].length>=2,l[0]);
  for(const t of l[6]){assert(t.slice(0,4).every(s=>typeof s==='string'&&s.trim()),l[0]);assert(C.matches(t[1].split('|')[0],t[1],t[0]),l[0]);assert(!C.matches('',t[1]),l[0]);if(t[4])assert.equal(t[4].filter(s=>C.matches(s,t[1],t[0])).length,1,l[0]);}
 }
});
test('Exact fractions, signed values, interval notation and ordered coordinates',()=>{
 assert(C.matches('0,5','1/2'));assert(!C.matches('0,75','2/3'));assert(C.matches('−1;2','-1;2'));assert(C.matches('[2;∞)','[2;+∞)'));assert(!C.matches('(2;∞)','[2;+∞)'));
 assert(C.matches('6;2','2;6','Найди A∩B; элементы через ;.'));assert(!C.matches('2;3','3;2','Ответ x;y.'));
 assert(C.matches('3;−1','3;-1'));assert(!C.matches('0',''));assert(!C.matches('1/0','1'));
});
test('Board snapshot is bounded and serializable for every model',()=>{
 for(const l of D){
  const s=C.cleanState({lesson:l[0],mode:'practice',task:999,step:999,answer:'x'.repeat(1000),feedback:'correct',model:{angle:Infinity,mask:99,cells:[-1,0,0,36,1],a:NaN}});
  assert.equal(s.lesson,l[0]);assert.equal(s.task,l[6].length-1);assert.equal(s.step,l[5].length);assert.equal(s.answer.length,220);assert.equal(s.feedback,'idle');
  assert(JSON.stringify(s).length<4096);assert.deepEqual(JSON.parse(JSON.stringify(C.cleanState(s))),JSON.parse(JSON.stringify(s)));
 }
});
test('Plane intersections stay in the cube and match the declared plane',()=>{
 assert.deepEqual(Array.from(M.planes,p=>M.sectionPoints(p.n,p.d).length),[3,4,6,4]);
 for(const p of M.planes)for(const a of M.sectionPoints(p.n,p.d)){assert(a.every(v=>Math.abs(v)<=1+1e-8));assert(a.filter(v=>Math.abs(Math.abs(v)-1)<1e-8).length>=2);assert(Math.abs(a.reduce((s,v,i)=>s+v*p.n[i],0)-p.d)<1e-8);}
});
test('Specific notebook errors corrected, not reproduced as rules',()=>{
 const L=id=>D.find(l=>l[0]===id);
 assert.equal(L('rational-equation')[6][0][1],'-1');
 assert.equal(L('arrangements')[6][1][1],'1680');
 assert.equal(L('det2')[6][0][1],'6');
 assert.equal(L('rational-high')[6][0][1],'0');
 assert(L('discriminant')[5].join(' ').includes('2/3'));
 assert(L('factorial')[5].join(' ').includes('3/182'));
 assert(L('grouping')[5].join(' ').includes('Корень 0'));
});
test('Existing board registry and reachable picker declare exact bridge contract',()=>{
 const manifest=JSON.parse(read('trainers/board-compat.json')),picker=JSON.parse(read('trainers/board-picker-data.json'));
 const row=manifest.trainers.filter(x=>x.trainerId==='notebook-math');
 assert.equal(row.length,1);assert.equal(row[0].file,'trainers/notebook-math.html');assert.equal(row[0].boardCompatibility,'board-mirror');assert.equal(row[0].version,'1.0.0');assert.equal(row[0].stateSchemaVersion,1);assert.equal(row[0].bridgeProtocolVersion,1);assert.equal(row[0].allowLegacyHtml,false);
 assert.equal(picker.entries.filter(x=>x.href==='/trainers/notebook-math.html').length,1);
 const html=read('trainers/notebook-math.html'),app=read('trainers/notebook-math-app.js');
 assert(html.includes('trainer-board.html?trainer=%2Ftrainers%2Fnotebook-math.html'));
 assert(html.includes('board-bridge.js'));assert(app.includes("id:'notebook-math',version:'1.0.0',stateSchemaVersion:1,parentOrigin:location.origin"));assert(app.includes('if(!framed&&state.feedback'));
});

test('All 142 independent solutions satisfy their own task and format',()=>{
 const solutions=require('./notebook-math-answers.cjs');
 assert.equal(Object.keys(solutions).length,D.length);
 for(const [id,,,,,,tasks] of D){
  assert.equal(solutions[id].length,tasks.length,id);
  tasks.forEach(([question,key],i)=>assert(C.matches(solutions[id][i],key,question),id+' '+question));
 }
 for(const [id,index,wrong] of [
  ['fractions',0,'18/27'],['fractions',1,'7/8'],['fractions',2,'1*2'],
  ['fractions',2,'1 2'],['discriminant',2,'0.33333333333'],
  ['incomplete',0,'4;0'],['gauss',0,'3;2;1'],['setops',0,'6;6'],
  ['rational-ineq',0,'(-∞;-1]∪[4;∞)'],['domain',2,'[3;∞)']
 ]){
  const [q,key]=D.find(l=>l[0]===id)[6][index];
  assert.equal(C.matches(wrong,key,q),false,id+' accepted '+wrong);
 }
});
