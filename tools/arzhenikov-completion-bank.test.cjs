'use strict';
const assert = require('node:assert/strict');
const {test} = require('node:test');
const path = require('node:path');
const directory = path.resolve(__dirname,'../trainers/oge-basics/multiplication-division');
const bank = require(path.join(directory,'arzhenikov-completion-bank.js'));
const engine = require(path.join(directory,'arzhenikov-completion-engine.js'));
const course = require(path.join(directory,'arzhenikov-course-engine.js'));
const tracks = ['arithmetic','written','fractions','decimals','connections','algebra','geometry']
  .map(name=>require(path.join(directory,'arzhenikov-course-'+name+'.js')));
const lessons = tracks.flatMap(track=>track.lessons);
const clone = value=>JSON.parse(JSON.stringify(value));

// Independent BigInt arithmetic. No production parser, authored answer or
// calculation metadata is used when deriving a result from the story below.
const abs = value=>value < 0n ? -value : value;
function gcd(a,b) { a=abs(a);b=abs(b);while(b) [a,b]=[b,a%b];return a || 1n; }
function rational(n,d=1n) {
  assert.notEqual(d,0n,'nonzero denominator');
  if(d<0n) {n=-n;d=-d;} const g=gcd(n,d);return {n:n/g,d:d/g};
}
function exact(value) {
  const input=String(value).trim().replaceAll(',','.').replaceAll('−','-');
  let m=input.match(/^(-?)(\d+)\s+(\d+)\/(\d+)$/);
  if(m) return rational((BigInt(m[2])*BigInt(m[4])+BigInt(m[3]))*(m[1]?-1n:1n),BigInt(m[4]));
  m=input.match(/^(-?\d+)\/(\d+)$/);
  if(m) return rational(BigInt(m[1]),BigInt(m[2]));
  m=input.match(/^(-?)(\d+)(?:\.(\d+))?$/);
  assert(m,'a literal exact rational number: '+input);
  return rational(BigInt(m[2]+(m[3]||''))*(m[1]?-1n:1n),10n**BigInt((m[3]||'').length));
}
const add=(a,b)=>rational(a.n*b.d+b.n*a.d,a.d*b.d);
const sub=(a,b)=>rational(a.n*b.d-b.n*a.d,a.d*b.d);
const mul=(a,b)=>rational(a.n*b.n,a.d*b.d);
const div=(a,b)=>rational(a.n*b.d,a.d*b.n);
const floor=a=>rational(a.n/a.d-(a.n<0n&&a.n%a.d?1n:0n));
const ceil=a=>rational(a.n/a.d+(a.n>0n&&a.n%a.d?1n:0n));
function operation(op,args) {
  switch(op) {
    case 'r-value': assert.equal(args.length,1);return args[0];
    case 'r-add': return args.reduce(add,rational(0n));
    case 'r-sub': assert.equal(args.length,2);return sub(...args);
    case 'r-mul': return args.reduce(mul,rational(1n));
    case 'r-div': assert.equal(args.length,2);return div(...args);
    case 'r-floor': assert.equal(args.length,2);return floor(div(...args));
    case 'r-ceil': assert.equal(args.length,2);return ceil(div(...args));
    default: assert.fail('unreviewed operation '+op);
  }
}
function astValue(node) {
  assert(node && ['value','operation'].includes(node.type),'typed arithmetic AST');
  if(node.type==='value') { assert.equal(typeof node.value,'string');return exact(node.value); }
  assert(['r-add','r-sub','r-mul','r-div'].includes(node.op));
  assert(Array.isArray(node.args) && node.args.length>=2);
  return operation(node.op,node.args.map(astValue));
}
function metadataValue(item) {
  const c=item.calculation;
  assert(c && Array.isArray(c.args),item.id+': explicit arithmetic operands');
  if(c.op==='r-expression') { assert.deepEqual(c.args,[]);return astValue(c.ast); }
  return operation(c.op,c.args.map(exact));
}
function fromStory(item) {
  const literals=item.prompt.match(/\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[,.]\d+)?/g) || [];
  const [a,b,c]=literals.map(exact);
  const size=item.skill==='units'||item.skill==='mixed-actions'?3:2;
  assert.equal(literals.length,size,item.id+': reviewed quantities in the actual condition');
  switch(item.skill) {
    case 'groups': return mul(a,b);
    case 'share': return item.pool==='final'?div(b,a):div(a,b);
    case 'capacity': return ceil(div(a,b));
    case 'written': return item.pool==='placement'?div(a,b):div(b,a);
    case 'common': return div(a,b);
    case 'fraction-add': return add(a,b);
    case 'mixed': return item.pool==='final'?floor(a):div(a,b);
    case 'fraction-product': return mul(a,b);
    case 'fraction-division': return div(a,b);
    case 'whole': return div(a,b);
    case 'decimal-total': return add(a,b);
    case 'decimal-product': return mul(a,b);
    case 'decimal-division': return div(a,b);
    case 'units':
      if(item.pool==='placement') return add(add(mul(a,exact(60)),b),c);
      if(item.pool==='review') return add(add(a,div(b,exact(100))),c);
      return div(add(add(mul(a,exact(60)),b),c),exact(60));
    case 'percent':
      if(item.pool==='placement') return div(mul(a,b),exact(100));
      if(item.pool==='review') return mul(div(b,a),exact(100));
      return div(a,div(b,exact(100)));
    case 'mixed-actions': return div(item.pool==='final'?add(a,b):sub(a,b),c);
    default: assert.fail('unreviewed story family '+item.skill);
  }
}

test('48 original transfer conditions have complete, separate placement/review/final metadata',()=>{
  assert.equal(bank.items.length,48);
  assert.equal(new Set(bank.items.map(item=>item.id)).size,48);
  assert.equal(new Set(bank.items.map(item=>item.prompt)).size,48);
  assert.equal(new Set(bank.items.map(item=>item.skill)).size,16);
  const oldPrompts=new Set(lessons.flatMap(lesson=>lesson.tasks.map(task=>task.prompt.trim())));
  const lessonIds=new Set(lessons.map(lesson=>lesson.id));
  for(const pool of ['placement','review','final']) assert.equal(bank.items.filter(item=>item.pool===pool).length,16);
  for(const skill of new Set(bank.items.map(item=>item.skill))) {
    const family=bank.items.filter(item=>item.skill===skill);
    assert.deepEqual(new Set(family.map(item=>item.pool)),new Set(['placement','review','final']));
    assert.equal(new Set(family.map(item=>item.prompt)).size,3);
  }
  for(const item of bank.items) {
    assert(lessonIds.has(item.lessonId),item.id+': existing return destination');
    assert(!oldPrompts.has(item.prompt.trim()),item.id+': independent condition, not a relabelled lesson exercise');
    for(const field of ['prompt','hint','explanation']) assert(typeof item[field]==='string'&&item[field].length>12,item.id+'.'+field);
    assert.equal(typeof item.unit,'string');
    assert(['integer','fraction','decimal','mixed'].includes(item.answerFormat));
    for(const field of ['steps','model','written','worked','sourceTaskId']) assert.equal(item[field],undefined,item.id+': no compulsory plan or displayed worked answer');
    assert(!/\d\s*[+×÷=]/.test(item.prompt),item.id+': the initial story does not supply its calculation');
    if(item.reason) {
      assert.equal(item.reason.options.length,3);
      assert.equal(new Set(item.reason.options.map(option=>option.id)).size,3);
      assert.equal(new Set(item.reason.options.map(option=>option.text)).size,3);
      assert.equal(item.reason.options.filter(option=>option.id===item.reason.answer).length,1);
      assert(item.reason.prompt.length>10&&item.reason.explanation.length>15);
    }
  }
  const placement=engine.selectItems('placement',bank);
  assert.equal(placement.length,8);
  assert.deepEqual(placement.map(id=>bank.items.find(item=>item.id===id).placementOrder),[0,1,2,3,4,5,6,7]);
  assert.equal(engine.selectItems('final',bank).length,16);
});

test('every new answer agrees with its actual story and a separate exact metadata oracle',()=>{
  for(const item of bank.items) {
    const story=fromStory(item);
    assert.deepEqual(exact(item.answer),story,item.id+': answer derived from the condition');
    assert.deepEqual(metadataValue(item),story,item.id+': metadata agrees with the whole story');
    assert.equal(course.checkAnswer(item,String(item.answer)).kind,'correct',item.id+': production checker accepts the independently verified value');
    assert.equal(course.checkAnswer(item,'9999').kind,'wrong',item.id+': a false answer is rejected');
    if(item.answerFormat==='decimal') {
      let denominator=story.d; while(denominator%2n===0n) denominator/=2n; while(denominator%5n===0n) denominator/=5n;
      assert.equal(denominator,1n,item.id+': authored decimal is terminating');
      assert.equal(course.checkAnswer(item,String(item.answer).replace('.',',')).kind,'correct');
    }
  }
});

test('fraction transfer conditions change the calculation, not only the story or operand order',()=>{
  // A renamed story, a reversed sum or an equivalent fraction spelling must
  // not turn a practised calculation into a fresh transfer condition.
  const aliases={sum:'r-add',difference:'r-sub',product:'r-mul',quotient:'r-div'};
  function signature(calculation) {
    if(!calculation || calculation.op==='r-expression') return null;
    const op=aliases[calculation.op] || calculation.op;
    const args=calculation.args.map(value=>{const q=exact(value);return q.n+'/'+q.d;});
    if(['r-add','r-mul'].includes(op)) args.sort();
    return JSON.stringify([op,args]);
  }
  const lessonTasks=lessons.flatMap(lesson=>lesson.tasks);
  const taught=new Map(lessonTasks.map(item=>[signature(item.calculation),item.id]));
  const transferSkills=new Set(['fraction-add','mixed','whole']);
  for(const item of bank.items.filter(item=>transferSkills.has(item.skill))) {
    const key=signature(item.calculation);
    assert(key,item.id+': explicit operation and original quantities');
    assert(!taught.has(key),item.id+': repeats the calculation in '+taught.get(key));
  }
  const lessonById=new Map(lessonTasks.map(item=>[item.id,item]));
  for(const [lessonId,calculation] of [
    ['c-common-2',{op:'r-add',args:['1/6','2/8']}],
    ['c-mixed-1',{op:'r-div',args:['7/3','1/3']}],
    ['d-divide-decimal-7',{op:'r-div',args:['3 3/4','1/4']}],
    ['f-whole-from-part-4',{op:'r-div',args:[15,'10/16']}]
  ]) assert.equal(signature(calculation),signature(lessonById.get(lessonId).calculation),
    lessonId+': changed notation and wording cannot hide the previously taught calculation');
});

test('hand-worked boundary fixtures catch reversed whole/part, remainder, time and mixed-operation mistakes',()=>{
  const expected={
    'transfer-capacity-placement':'5','transfer-capacity-review':'5','transfer-capacity-final':'5',
    'transfer-written-placement':'402','transfer-written-review':'406','transfer-written-final':'504',
    'transfer-common-placement':'3/5','transfer-common-review':'3/5','transfer-common-final':'2/3',
    'transfer-fraction-add-placement':'9/20',
    'transfer-mixed-placement':'11','transfer-mixed-review':'13','transfer-mixed-final':'3',
    'transfer-whole-placement':'20','transfer-whole-review':'42','transfer-whole-final':'18',
    'transfer-units-placement':'135','transfer-units-review':'3.25','transfer-units-final':'2.5',
    'transfer-percent-placement':'20','transfer-percent-review':'25','transfer-percent-final':'60',
    'transfer-mixed-actions-placement':'0.5','transfer-mixed-actions-review':'0.25','transfer-mixed-actions-final':'0.3'
  };
  for(const [id,value] of Object.entries(expected)) assert.deepEqual(exact(bank.items.find(item=>item.id===id).answer),exact(value),id);
  const byId=new Map(bank.items.map(item=>[item.id,item]));
  assert.equal(course.checkAnswer(byId.get('transfer-common-placement'),'18/30').kind,'format','equal value still has to be reduced');
  assert.equal(course.checkAnswer(byId.get('transfer-fraction-add-placement'),'18/40').kind,'correct','a valid non-minimal common denominator is accepted');
  assert.equal(course.checkAnswer(byId.get('transfer-units-final'),'2,30').kind,'wrong','2 h 30 min is 2.5 h, not 2.30 h');
  assert.equal(byId.get('transfer-share-final').lessonId,'a-pack','packing returns to the packing lesson, not distribution among a given number of people');
  for(const pool of ['placement','review','final']) {
    const item=byId.get('transfer-mixed-actions-'+pool), calculation=item.calculation;
    assert.equal(calculation.op,'r-expression','metadata retains the first operation instead of a precomputed remainder');
    const ast=calculation.ast;
    assert.equal(ast?.type,'operation');assert.equal(ast.op,'r-div');
    assert.equal(ast.args[0]?.type,'operation');
    assert.equal(ast.args[0].op,pool==='final'?'r-add':'r-sub');
    assert.equal(ast.args[1]?.type,'value');
    const quantities=item.prompt.match(/\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[,.]\d+)?/g).map(exact);
    assert.deepEqual([...ast.args[0].args,ast.args[1]].map(node=>{
      assert.equal(node.type,'value');return exact(node.value);
    }),quantities,item.id+': original story quantities remain visible in the arithmetic tree');
  }
});

test('every one of the 82 lessons has two traceable practice fallbacks without mutating its source data',()=>{
  assert.equal(lessons.length,82);
  const before=JSON.stringify(lessons);
  const extended=bank.withLessons(lessons);
  assert.equal(extended.items.length,48+82*2);
  assert.equal(new Set(extended.items.map(item=>item.id)).size,extended.items.length);
  for(const lesson of lessons) {
    const choices=extended.items.filter(item=>item.sourceTaskId&&item.lessonId===lesson.id);
    assert.equal(choices.length,2,lesson.id+': full review coverage');
    assert.deepEqual(choices.map(item=>item.sourceTaskId),lesson.tasks.slice(6,8).map(task=>task.id));
    for(const item of choices) {
      const source=lesson.tasks.find(task=>task.id===item.sourceTaskId);
      for(const field of ['prompt','answer','answerFormat','hint','explanation']) assert.deepEqual(item[field],source[field],item.id+': preserved '+field);
      assert.equal(item.pool,'review');
      assert.equal(item.family,lesson.id);
      assert.equal(item.familiarPractice,true,'existing lesson conditions are labelled as practice');
      assert.equal(item.steps,undefined);assert.equal(item.model,undefined);assert.equal(item.written,undefined);
      assert.equal(course.checkAnswer(item,String(item.answer)).kind,'correct',item.id+': usable without removed compulsory steps');
    }
    const courseState={lessons:{[lesson.id]:{visits:1,tasks:{}}}};
    const selected=engine.selectItems('review',extended,{courseState});
    assert.equal(selected.length,1,lesson.id+': only one visited family is returned');
    assert.equal(extended.items.find(item=>item.id===selected[0]).lessonId,lesson.id);
  }
  assert.deepEqual(engine.selectItems('review',extended,{courseState:{lessons:{}}}),[]);
  assert.equal(JSON.stringify(lessons),before,'fallbacks do not modify course prompts, models or saved-work contracts');
});

test('previously seen lesson checks remain familiar even when replayed through the assessment UI',()=>{
  const lesson=lessons.find(item=>item.id==='f-add'), source=lesson.tasks[6];
  const courseState={lessons:{[lesson.id]:{visits:1,tasks:{[source.id]:{input:'7/12',attempts:1,everSolved:true,helpUsed:false}}}}};
  const before=JSON.stringify(courseState), extended=bank.withLessons(lessons,courseState);
  const item=extended.items.find(item=>item.sourceTaskId===source.id);
  assert.equal(item.previouslySeen,true);
  const state=engine.fresh();engine.start(state,{mode:'review',itemIds:[item.id],now:1},extended);
  engine.setInput(state,String(item.answer));engine.submit(state,extended,course.checkAnswer);
  assert.equal(engine.summary(state,extended).independent,0);
  assert.equal(engine.summary(state,extended).familiar,1);
  assert.equal(JSON.stringify(courseState),before,'assessment never writes into the source lesson progress');
});

test('different session modes cannot reuse the same authored condition as new transfer',()=>{
  const pools=['placement','review','final'].map(pool=>new Set(bank.items.filter(item=>item.pool===pool).map(item=>item.prompt)));
  for(let i=0;i<pools.length;i++) for(let j=i+1;j<pools.length;j++) assert([...pools[i]].every(prompt=>!pools[j].has(prompt)));
  const item=bank.items.find(item=>item.id==='transfer-fraction-add-review'), state=engine.fresh();
  engine.start(state,{mode:'review',itemIds:[item.id],now:1},bank);
  engine.setInput(state,String(item.answer));engine.submit(state,bank,course.checkAnswer);engine.next(state,bank,2);
  assert.equal(engine.summary(state,bank).independent,1);
  const saved=engine.normalize(clone(state),bank,course.checkAnswer);
  engine.start(saved,{mode:'review',itemIds:[item.id],now:3},bank);
  engine.setInput(saved,String(item.answer));engine.submit(saved,bank,course.checkAnswer);
  assert.equal(engine.summary(saved,bank).independent,0);
  assert.equal(engine.summary(saved,bank).familiar,1);
});
