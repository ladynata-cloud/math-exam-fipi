'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.join(__dirname,'..'),book=path.join(root,'school/peterson6/textbook'),E=require(path.join(book,'engine.js')),G=require(path.join(root,'trainers/peterson6-workshop/generators.js')),S=require(path.join(root,'trainers/peterson6-workshop/state.js'));
const source=JSON.parse(fs.readFileSync(path.join(book,'source-index.json'))),banks=['001-175','176-339','340-497'].map(f=>JSON.parse(fs.readFileSync(path.join(book,'content',f+'.json')))),exercises=banks.flatMap(b=>b.exercises),parts=exercises.flatMap(e=>e.parts);
test('all 497 original conditions and source assets are present, bounded and intact',()=>{assert.deepEqual(source.exercises.map(e=>e.number),Array.from({length:497},(_,i)=>i+1));const pageMap=new Map(source.pages.map(p=>[p.page,p]));for(const p of source.pages){const bytes=fs.readFileSync(path.join(book,p.path));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),p.sha256);}for(const ex of source.exercises){assert(ex.regions.length);for(const r of ex.regions){const p=pageMap.get(r.page);assert(p);assert(r.x>=0&&r.y>=0&&r.width>0&&r.height>0);assert(r.x+r.width<=p.width+1&&r.y+r.height<=p.height+1);}}});
test('complete numbered/subpart inventory is explicit and every kind has a real answer mode',()=>{assert.deepEqual(exercises.map(e=>e.number),Array.from({length:497},(_,i)=>i+1));const ids=new Set(),skills=new Set(G.skills.map(s=>s.id));for(const b of banks){assert.equal(b.coverage.complete,true);assert.equal((b.coverage.missingExercises||[]).length,0);}for(const ex of exercises){assert.equal(ex.coverage.sourceVerified,true,'source '+ex.number);assert.equal(ex.coverage.subpartsComplete,true,'subparts '+ex.number);assert(ex.parts.length);for(const p of ex.parts){assert.match(p.id,/^[a-zA-Z0-9_-]+$/);assert(!ids.has(p.id),'duplicate '+p.id);ids.add(p.id);if(p.skill!==undefined)assert(skills.has(p.skill),p.id+' unknown practice skill');assert(['numeric','choice','expression','written'].includes(p.kind),p.id);assert(E.steps(p).length>0,p.id+' no solution');if(p.kind==='written'){assert(p.answer&&p.criteria?.length,p.id+' missing human criteria');assert.equal(E.check(p,p.answer),false);}else{assert(E.check(p,p.answer),p.id+' cannot accept own valid answer');if(p.kind==='choice')assert(p.choices.length>=2&&new Set(p.choices).size===p.choices.length,p.id);}}}});
test('complex order, mixed numbers and exact rounding have independent fixed results',()=>{const n=(op,left,right)=>({op,left,right});const expression=n('subtract',n('multiply',n('subtract',n('divide','1.5','1/3'),n('divide','3/8','.25')),'3.2'),n('multiply','3.2','5/8'));assert(E.M.equal(E.exact(expression),'7.6'));assert.equal(E.expressionSteps(expression).length,6);for(const [input,places,output] of [['1.245',2,'1.25'],['1.244',2,'1.24'],['1245',-1,'1250'],['-1.245',2,'-1.25']])assert(E.M.equal(E.rounded(input,places),output));assert.throws(()=>E.exact({op:'eval',left:'1',right:'2'}));assert.throws(()=>E.exact(n('divide','1','0')));});
test('assistance and wrong attempts survive reload and imports; written work is never auto graded',()=>{const p=G.generate('percent-to-number',3,813),w=E.blank(p);E.submit(p,w,'0');E.assist(w);E.submit(p,w,p.answer);const back=E.sanitize(p,JSON.parse(JSON.stringify(w)));assert(back.correct);assert(!back.independent);assert(back.errors>0);const clean=E.blank(p);E.submit(p,clean,p.answer);const merged=E.mergeState({parts:{[p.id]:back}},{parts:{[p.id]:clean}},[p]);assert(merged.parts[p.id].assisted);assert(!merged.parts[p.id].independent);const written=parts.find(p=>p.kind==='written'),manual=E.blank(written);const result=E.submit(written,manual,'Мой ответ');assert(result.manual);assert(manual.submitted);assert(!manual.correct);assert(!E.check(written,written.answer));});
test('microsteps are for the current operation and never submit the main answer',()=>{const p=G.generate('river-roundtrip',2,17),w=E.blank(p),step=E.steps(p).find(s=>s.calculation),micro=E.microSteps(step.calculation);assert(micro.length>=3);for(const m of micro)assert(E.checkStep(m,m.answer));assert.equal(w.correct,false);assert.equal(w.draft,'');const div=E.microSteps({op:'divide',left:'2.4',right:'3.6'});assert(E.M.equal(div.at(-1).answer,'2/3'));const add=E.microSteps({op:'subtract',left:'5/18',right:'1/9'});assert(E.M.equal(add.at(-1).answer,'1/6'));});
test('new examples have stable identity, distinct-topic progress and first-completion accounting',()=>{const state=S.blank();for(let seed=1;seed<=5;seed++){const p=G.generate('meeting',2,seed),r=S.record(p);if(seed>3)E.assist(r.work);E.submit(p,r.work,p.answer);assert(S.complete(p,r));assert(!S.complete(p,r));state.records[S.key(p)]=r;}const s=S.stats(state,'meeting');assert.deepEqual(s,{solved:5,independent:3,assisted:2,ready:true});assert.equal(S.stats(state,'chase').solved,0);const reloaded=S.sanitize(JSON.parse(JSON.stringify(state)));assert.deepEqual(S.stats(reloaded,'meeting'),s);const [key,r]=Object.entries(state.records)[0];const p=G.generate(r.skill,r.level,r.seed);E.assist(r.work);assert.equal(S.stats(state,'meeting').independent,3,'review after first completion does not erase the recorded first completion');const altered=JSON.parse(JSON.stringify(state));altered.records[key].seed=999;assert.throws(()=>S.sanitize(altered));});
test('earlier help on abandoned practice cannot be erased by incoming successful attempt',()=>{const p=G.generate('chase',1,88),a=S.blank(),b=S.blank(),ra=S.record(p),rb=S.record(p);E.assist(ra.work);ra.work.note='Не удалять';E.submit(p,rb.work,p.answer);S.complete(p,rb);a.records[S.key(p)]=ra;b.records[S.key(p)]=rb;const merged=S.merge(a,b),r=merged.records[S.key(p)];assert(r.completion.work.assisted);assert.equal(S.stats(merged,'chase').independent,0);});
test('all 37 generators support all three levels; every generated step and answer is accepted exactly',()=>{assert.equal(G.skills.length,37);for(const skill of G.skills)for(let level=1;level<=3;level++)for(let seed=1;seed<=30;seed++){const p=G.generate(skill.id,level,seed),copy=G.generate(skill.id,level,seed);assert.deepEqual(p,copy);assert(E.check(p,p.answer),p.id);for(const s of E.steps(p)){if(s.kind==='numeric'||s.kind==='choice')assert(E.checkStep(s,s.answer),p.id+' step');if(s.calculation){const v=E.M.operation(s.calculation.op,s.calculation.left,s.calculation.right);assert(E.M.equal(v,s.answer),p.id+' calculation');}}if(p.kind!=='choice')assert(!E.check(p,E.M.answer(E.M.operation('add',p.answer,1))),p.id+' accepts wrong answer');}});
test('malformed, foreign or excessive state cannot overwrite legitimate progress',()=>{const p=parts[0],raw={schema:1,source:source.source.sha256,parts:{unknown:{}}};assert.throws(()=>E.importState(raw,parts,source.source.sha256));assert.throws(()=>E.importState({...raw,source:'foreign'},parts,source.source.sha256));const w=E.blank(p);w.signature='changed';w.correct=true;w.independent=true;const clean=E.sanitize(p,w);assert(!clean.correct&&!clean.independent);assert.throws(()=>S.sanitize({schema:1,version:'old',records:{}}));});

test('shuffled choices for the same question retain one completion after merge and reload',()=>{
 const p=G.generate('logic-negation',1,4),q=G.generate('logic-negation',1,7);
 assert.equal(p.prompt,q.prompt);assert.equal(S.key(p),S.key(q));assert.notDeepEqual(p.choices,q.choices);
 const a=S.blank(),b=S.blank(),ra=S.record(p),rb=S.record(q);ra.work.updated=1;
 E.submit(q,rb.work,q.answer);assert(S.complete(q,rb));
 a.records[S.key(p)]=ra;b.records[S.key(q)]=rb;
 const merged=S.merge(a,b),back=S.sanitize(JSON.parse(JSON.stringify(merged)));
 for(const state of [merged,back]){
  assert.equal(Object.keys(state.records).length,1);
  assert.deepEqual(S.stats(state,'logic-negation'),{solved:1,independent:1,assisted:0,ready:false});
  assert(state.records[S.key(p)].completion.work.correct);
 }
});

test('imported completion is checked from its work snapshot, not asserted success flags',()=>{
 const p=G.generate('meeting',1,123),state=S.blank(),r=S.record(p);r.work.guided=true;E.assist(r.work);
 E.submit(p,r.work,p.answer);assert(S.complete(p,r));state.records[S.key(p)]=r;
 const copy=()=>JSON.parse(JSON.stringify(state));
 const forged=copy(),completion=forged.records[S.key(p)].completion;
 completion.assisted=false;completion.errors=0;completion.independent=true;
 completion.work.assisted=false;completion.work.independent=true;
 assert.deepEqual(S.stats(S.sanitize(forged),'meeting'),{solved:1,independent:0,assisted:1,ready:false});
 for(const mutate of [
  rec=>{rec.completion={at:1,independent:true,assisted:false,errors:0};},
  rec=>{rec.completion={at:1,work:{...E.blank(p),correct:true,independent:true}};},
  rec=>{rec.completion={at:1,work:{...E.blank(p),draft:'0',correct:true,independent:true}};}
 ]){
  const raw=copy();mutate(raw.records[S.key(p)]);
  const restored=S.sanitize(raw);assert.equal(restored.records[S.key(p)].completion,null);
  assert.equal(S.stats(restored,'meeting').solved,0);
 }
});

test('oversized union is refused before either input can be mutated',()=>{
 const a=S.blank(),b=S.blank();
 // Only the size guard is under test; it must run before inspecting records.
 for(let i=0;i<S.LIMIT;i++)a.records['fixture-'+i]={marker:i};
 b.records['fixture-extra']={marker:S.LIMIT};
 const beforeA=JSON.stringify(a),beforeB=JSON.stringify(b);
 assert.equal(Object.keys(a.records).length,4000);assert.throws(()=>S.merge(a,b),/слишком много/);
 assert.equal(JSON.stringify(a),beforeA);assert.equal(JSON.stringify(b),beforeB);
});

test('explicit decimal and reduced-fraction instructions reject equivalent answers in the wrong form',()=>{
 const selected=exercises.filter(e=>[188,313,329,331].includes(e.number)).flatMap(e=>e.parts)
  .filter(p=>['decimal','reduced-fraction'].includes(p.answerFormat));
 assert.equal(selected.length,60);assert.equal(selected.filter(p=>p.answerFormat==='decimal').length,29);
 for(const p of selected){
  const r=E.M.parse(p.answer),wrong=p.answerFormat==='decimal'?r.n+'/'+r.d:(r.n*2)+'/'+(r.d*2);
  assert(E.M.equal(p.answer,wrong),p.id+' fixture must be numerically equivalent');
  assert(E.check(p,p.answer),p.id+' valid requested form');assert.equal(E.check(p,wrong),false,p.id+' wrong requested form');
 }
});

test('user-supplied percentage examples keep their independently calculated answers',()=>{
 const expected={
  '340-1-a':'3/100','340-1-b':'9/50','340-1-c':'3/40','340-1-d':'2/17','340-1-e':'3/2','340-1-f':'132/25',
  '340-2-a':'5','340-2-b':'28','340-2-c':'90','340-2-d':'9/2','340-2-e':'12','340-2-f':'180','340-2-g':'400',
  '344-1-a':'140','344-1-b':'175','344-2-a':'20','344-2-b':'25','497-a':'6200','497-b':'6298.56'
 };
 assert.equal(Object.keys(expected).length,19);
 for(const [id,answer] of Object.entries(expected)){
  const p=parts.find(p=>p.id===id);assert(p,id+' exists');assert(E.M.equal(E.finalAnswer(p),answer),id);assert(E.check(p,answer),id);
 }
 assert.equal(E.check(parts.find(p=>p.id==='340-1-d'),'200/17'),false,'mixed percent must also be divided by 100');
});

test('ordinary-fraction instructions in number 331 permit unreduced fractions but reject other notation',()=>{
 const selected=parts.filter(p=>/^331-[123]-fraction$/.test(p.id));assert.equal(selected.length,3);
 for(const p of selected){
  assert.equal(p.answerFormat,'fraction',p.id);const r=E.M.parse(p.answer);
  const unreduced=(r.n*2)+'/'+(r.d*2),decimal=E.M.decimal(r),mixed='0 '+r.n+'/'+r.d;
  assert(E.M.equal(p.answer,decimal));assert(E.M.equal(p.answer,mixed));
  assert(E.check(p,p.answer));assert(E.check(p,unreduced),p.id+' does not require reduction');
  assert.equal(E.check(p,decimal),false,p.id+' rejects decimal');assert.equal(E.check(p,mixed),false,p.id+' rejects mixed form');
 }
});
