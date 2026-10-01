const assert=require('node:assert/strict');
const M=require('../school/math.js'),C=require('../school/curriculum.js'),S=require('../school/state.js');
const ids=C.lessons.map(x=>x.id),seen=new Set(),visiting=new Set();
function visit(id){assert(C.byId[id],id);assert(!visiting.has(id),'cycle '+id);if(seen.has(id))return;visiting.add(id);C.byId[id].requires.forEach(visit);visiting.delete(id);seen.add(id);}
ids.forEach(visit);assert.equal(seen.size,ids.length);
[...C.grade5,...C.grade6,...C.books.flatMap(x=>x.mapping.map(m=>m.skill))].forEach(id=>assert(C.byId[id]));
assert.equal(C.books[0].mapping.length,51);assert.equal(C.books[1].mapping.length,44);
assert.equal(C.books[0].mapping.find(m=>m.section===40).page,87);
for(const route of [C.grade5,C.grade6])for(const id of route)for(const p of C.byId[id].requires)if(route.includes(p))assert(route.indexOf(p)<route.indexOf(id),p+' before '+id);
assert(M.equal('2 1/3',M.q(7,3)));assert(M.equal('-2 1/3',M.q(-7,3)));assert(M.equal('0,25',M.q(1,4)));assert(M.equal('−3; 2',[-3,2]));assert(M.equal('-','−'));
['1/0','Infinity','1e999','<script>','1+2','2 5/3','NaN'].forEach(x=>assert.equal(M.parse(x),null,x));
ids.forEach(id=>{for(let seed=0;seed<100;seed++){const t=M.generate(id,seed);assert.equal(typeof t.prompt,'string');assert(t.prompt.trim().length>0);assert(t.steps.length>0);const fmt=x=>Array.isArray(x)?x.map(fmt).join(';'):typeof x==='object'?M.fmt(x):String(x);assert(M.equal(fmt(t.answer),t.answer),id);t.steps.forEach(s=>assert(M.equal(fmt(s.answer),s.answer),id));}});
function answerFor(t){if(t.answerFormat==='prime-factors')return t.answer.join(' * ');if(t.answerFormat==='decimal'){const v=typeof t.answer==='object'?t.answer.n/t.answer.d:t.answer;return Number.isInteger(v)?v+',0':String(v).replace('.',',');}return typeof t.answer==='object'?M.fmt(t.answer):String(t.answer);}
for(const id of ['decimal','mixed','reduce','factorization','decimaladd'])for(let seed=0;seed<150;seed++){const t=M.generate(id,seed);for(const target of [...t.steps,t])assert(M.accepts(answerFor(target),target),id+' correct format');}
const decimal=M.generate('decimal',0);assert(!M.accepts(decimal.prompt.match(/\d+\/100/)[0],decimal));assert(M.accepts('2',decimal.steps[0]));
const mixed=M.generate('mixed',0);assert(!M.accepts(mixed.prompt.match(/\d+ \d+\/\d+/)[0],mixed));assert(M.accepts(String(mixed.steps[0].answer),mixed.steps[0]));
assert(!M.accepts('0,5',{answer:M.q(1,2),answerFormat:'reduced-fraction'}));assert(!M.accepts('2/4',{answer:M.q(1,2),answerFormat:'reduced-fraction'}));
assert(M.accepts('3 × 2 * 2',{answer:[2,2,3],answerFormat:'prime-factors'}));assert(!M.accepts('4 * 3',{answer:[2,2,3],answerFormat:'prime-factors'}));
const factors=Array.from({length:150},(_,s)=>M.generate('factorization',s));assert(new Set(factors.map(t=>t.prompt)).size>100);assert(factors.some(t=>t.answerFormat==='prime-factors'));assert(factors.some(t=>t.answer==='да'));assert(factors.some(t=>t.answer==='нет'));
const trained=S.blank();for(let seed=0;seed<30;seed++)S.expose(trained,S.fingerprint('factorization',M.generate('factorization',seed)));
const fresh=S.selectTask(trained,'factorization',0,M.generate);assert(!trained.seen.includes(S.fingerprint('factorization',fresh.task)));assert.equal(fresh.task.prompt,M.generate('factorization',fresh.seed).prompt);
for(const id of ['decimalmul','decimaldiv']){const tasks=Array.from({length:40},(_,s)=>M.generate(id,s));assert(tasks.some(t=>/ [·:] \d+\.$/.test(t.prompt)),id+' natural operand');assert(tasks.some(t=>/ [·:] \d+,\d+\.$/.test(t.prompt)),id+' decimal operand');}
assert(M.generate('decimaladd',0).prompt.includes(' + '));assert(M.generate('decimaladd',1).prompt.includes(' − '));
const averages=Array.from({length:20},(_,s)=>M.generate('average',s));assert.deepEqual([...new Set(averages.map(t=>t.model.values.length))].sort(),[3,4,5]);assert(averages.some(t=>t.answer.d>1));assert(averages.some(t=>!t.model.values.includes(t.answer.n/t.answer.d)));
let st=S.blank(),time=1700000000000;
function result(mode,correct,assisted,attempt,exposed,fingerprint='test'){return S.result(st,{skill:'fraction',mode,correct,assisted,attempt,exposed,time,fingerprint});}
result('learn',true,false,1,false);assert.equal(st.skills.fraction.checks.length,0);
result('practice',true,false,1,false);assert.equal(st.skills.fraction.checks.length,0);
result('check',true,true,1,false,'help');result('check',true,false,2,false,'retry');result('check',true,false,1,true,'seen');
assert.equal(st.skills.fraction.checks.length,0);
result('check',true,false,1,false,'fresh1');result('check',true,false,1,false,'fresh2');assert.equal(st.skills.fraction.checks.length,2);
result('check',true,false,1,false,'fresh1');assert.equal(st.skills.fraction.checks.length,2);
assert.equal(S.due(st,ids,time).length,0);time+=S.DAY+1;assert(S.due(st,ids,time).includes('fraction'));
result('review',true,false,1,false,'fresh3');assert.equal(st.skills.fraction.reviews,1);assert.equal(st.skills.fraction.nextReview,time+3*S.DAY);
result('review',true,false,1,false,'fresh4');assert.equal(st.skills.fraction.reviews,1);
assert.deepEqual(S.validate(JSON.parse(JSON.stringify(st)),ids),st);
const corrupt=JSON.parse(JSON.stringify(st));corrupt.skills.fraction.checks={bad:1};assert.throws(()=>S.validate(corrupt,ids));
assert.throws(()=>S.validateAssignment({schema:'mathexam-assignment',version:1,id:'bad',title:'x',skills:['unknown'],seed:1},ids));
const a=S.validateAssignment({schema:'mathexam-assignment',version:1,id:'a-1',title:'Test',skills:['fraction'],seed:1},ids);
const report={schema:'mathexam-report',version:1,alias:'<img src=x>',assignmentId:a.id,createdAt:time,progress:st};assert.equal(S.validateReport(report,ids).alias,report.alias);
const teacher={schema:'mathexam-teacher',version:1,groups:[{id:'g-1',name:'group'}],assignments:[{groupId:'g-1',data:a}],reports:[{groupId:'g-1',data:report}]};assert.deepEqual(S.validateTeacher(teacher,ids),teacher);
teacher.reports[0].groupId='g-unknown';assert.throws(()=>S.validateTeacher(teacher,ids));
const badStore={getItem:()=>'{'};assert(S.load(badStore,ids).blocked);
console.log('Prerequisite DAG, 7,400 generated tasks/steps, grading, delayed retrieval, imports and malformed data: PASS');
