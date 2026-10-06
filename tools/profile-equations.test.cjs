'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const lessons=require('../ege-profil/start/equations-data.js');
const state=require('../ege-profil/start/state.js');
const models=require('../ege-profil/start/equations-tasks.js');
const root=path.resolve(__dirname,'..');
const tasks=lessons.flatMap(l=>l.tasks);
const near=(actual,expected,label)=>assert.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<1e-9,`${label}: expected ${expected}, got ${actual}`);
const term=(offset)=>'x'+(offset<0?' − ':' + ')+Math.abs(offset);
// Formulae recompute all answers from the givens; no authored solution or
// authored intermediate answer is used as an oracle input.
function expected(m){
  switch(m.kind){
    case 'linear-equation':return{steps:[m.a-m.c,m.d-m.b,(m.d-m.b)/(m.a-m.c)],final:(m.d-m.b)/(m.a-m.c)};
    case 'rational-equation':{const denominator=m.numerator/m.rhs,ax=denominator-m.b;return{steps:[-m.b/m.a,denominator,ax,ax/m.a],final:ax/m.a};}
    case 'quadratic-equation':{
      const D=m.b*m.b-4*m.c,s=Math.sqrt(D),numerator=-m.b+(m.which==='larger'?s:-s);
      return{steps:[D,s,numerator,numerator/2],final:numerator/2};
    }
    case 'root-equation':return{steps:[-m.b/m.a,m.a>0?'≥':'≤',m.rhs*m.rhs,m.rhs*m.rhs-m.b,(m.rhs*m.rhs-m.b)/m.a],final:(m.rhs*m.rhs-m.b)/m.a};
    case 'power-expression':return{steps:[m.p+m.q,m.p+m.q-m.r,Math.pow(m.base,m.p+m.q-m.r)],final:Math.pow(m.base,m.p)*Math.pow(m.base,m.q)/Math.pow(m.base,m.r)};
    case 'root-expression':{
      if(m.operation==='square')return{steps:[m.a*m.a,Math.abs(m.a),Math.abs(m.a)-m.a],final:Math.sqrt(m.a*m.a)-m.a};
      const under=m.operation==='product'?m.a*m.b:m.a/m.b;
      return{steps:[under,Math.sqrt(under)],final:m.operation==='product'?Math.sqrt(m.a)*Math.sqrt(m.b):Math.sqrt(m.a)/Math.sqrt(m.b)};
    }
    case 'fraction-expression':return{steps:[-m.denSign*m.k,term(-m.denSign*m.k),m.x-m.denSign*m.k],final:(m.x*m.x-m.k*m.k)/(m.x+m.denSign*m.k)};
    case 'log-expression':{
      const p=Math.log(m.a)/Math.log(m.base),q=Math.log(m.b)/Math.log(m.base);
      const answer=m.operation==='sum'?p+q:m.operation==='difference'?p-q:p/q;
      return{steps:[p,q,answer],final:answer};
    }
    default:throw new Error('Missing independent oracle: '+m.kind);
  }
}
test('8 complementary themes, 48 distinct author-written tasks, and final guided step is the answer',()=>{
  assert.equal(lessons.length,8);assert.equal(tasks.length,48);
  const old=require('../ege-profil/start/algebra-data.js');
  const allIds=new Set(old.flatMap(l=>[l.id,...l.tasks.map(t=>t.id)]));
  const prompts=new Set();let intermediate=0;
  for(const l of lessons){
    assert.equal(l.group,'algebra');assert.ok([7,8].includes(l.position));assert.equal(l.tasks.length,6);
    assert.ok(!allIds.has(l.id));allIds.add(l.id);
    for(const t of l.tasks){
      assert.ok(!allIds.has(t.id));allIds.add(t.id);assert.ok(!prompts.has(t.prompt),t.id);prompts.add(t.prompt);
      assert.ok(t.steps.length>=2&&t.steps.length<=5,t.id);assert.equal(t.diagram.stages.length,t.steps.length);
      assert.ok(t.prompt&&t.explanation&&t.meta&&t.diagram.parts.length);
      const oracle=expected(t.meta);near(t.answer,oracle.final,t.id);
      assert.equal(t.steps.length,oracle.steps.length,t.id);
      t.steps.forEach((s,i)=>{
        assert.ok(s.prompt&&s.hint&&s.why,t.id+' step '+i);
        if(typeof oracle.steps[i]==='number')near(s.answer,oracle.steps[i],t.id+' step '+i);
        else assert.equal(s.answer,oracle.steps[i],t.id+' step '+i);
        if(s.choices)assert.ok(s.choices.includes(s.answer),t.id);
        intermediate++;
      });
      near(t.steps.at(-1).answer,t.answer,t.id+' final step');
    }
  }
  assert.equal(intermediate,164);
});
test('every equation root satisfies the original equation and each domain excludes exactly the forbidden values',()=>{
  for(const t of tasks){
    const m=t.meta,x=t.answer;
    switch(m.kind){
      case 'linear-equation':assert.notEqual(m.a,m.c);near(m.a*x+m.b,m.c*x+m.d,t.id);break;
      case 'rational-equation':{
        assert.notEqual(m.a,0);assert.notEqual(m.a*x+m.b,0);near(m.numerator/(m.a*x+m.b),m.rhs,t.id);
        assert.equal(t.diagram.domains[0].relation,'≠');near(m.a*t.diagram.domains[0].boundary+m.b,0,t.id+' forbidden pole');break;
      }
      case 'quadratic-equation':{
        near(x*x+m.b*x+m.c,0,t.id);
        const candidates=Array.from({length:101},(_,i)=>i-50).filter(r=>r*r+m.b*r+m.c===0);
        assert.equal(candidates.length,2,t.id+' exact roots');assert.equal(x,m.which==='larger'?Math.max(...candidates):Math.min(...candidates));break;
      }
      case 'root-equation':{
        assert.ok(m.rhs>=0);assert.ok(m.a*x+m.b>=-1e-9);near(Math.sqrt(Math.max(0,m.a*x+m.b)),m.rhs,t.id);
        const domain=t.diagram.domains[0];near(m.a*domain.boundary+m.b,0,t.id+' boundary');
        assert.equal(domain.relation,m.a>0?'≥':'≤');assert.ok(m.a*(domain.boundary+(m.a>0?1:-1))+m.b>0);break;
      }
      case 'power-expression':assert.ok(m.base>0&&m.base!==1);break;
      case 'root-expression':if(m.operation!=='square'){assert.ok(m.a>=0&&m.b>0);}break;
      case 'fraction-expression':assert.notEqual(m.x+m.denSign*m.k,0);assert.equal(t.diagram.domains[0].boundary,-m.denSign*m.k);break;
      case 'log-expression':assert.ok(m.base>0&&m.base!==1&&m.a>0&&m.b>0);if(m.operation==='quotient')assert.notEqual(m.b,1);break;
    }
  }
});
test('all prerequisite links exist; new lessons and models register beside existing algebra without replacing them',()=>{
  const tree=new Set(execFileSync('git',['ls-tree','-r','--name-only','HEAD'],{cwd:root,encoding:'utf8'}).trim().split('\n'));
  for(const l of lessons)for(const link of[l.prereq,...l.links]){
    let local=link.href.replace(/^\//,'').split(/[?#]/)[0];if(local.endsWith('/'))local+='index.html';
    assert.ok(tree.has(local)||fs.existsSync(path.join(root,local)),l.id+': '+local);
  }
  const context=vm.createContext({ProfileModels:{old(){}}});
  for(const file of ['algebra-data.js','equations-data.js','equations-tasks.js'])vm.runInContext(fs.readFileSync(path.join(root,'ege-profil/start',file),'utf8'),context);
  assert.equal(context.ProfileLessons.length,16);assert.equal(typeof context.ProfileModels.old,'function');
  for(const l of lessons){assert.equal(typeof context.ProfileModels[l.model],'function');for(const t of l.tasks)assert.equal(typeof context.ProfileTaskModels[t.id],'function');}
});
test('24 independent tasks remain separate from the 24 guided examples',()=>{
  for(const lesson of lessons){
    const store=new Map(),app=state.create([lesson],{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)});
    const guided=new Set();for(let i=0;i<3;i++){const s=app.start(lesson.id,'guided',true);guided.add(s.taskId);app.finish(lesson.id,'guided',s);}
    assert.equal(guided.size,3);
    for(let i=0;i<3;i++){const s=app.start(lesson.id,'independent',true);assert.ok(!guided.has(s.taskId));assert.equal(s.familiar,false);app.finish(lesson.id,'independent',s);}
    assert.equal(app.record(lesson.id).independent.length,3);
  }
});
test('48 finite task SVGs; only earned transformations and domains appear; controls dispose',()=>{
  const{JSDOM}=require('jsdom');
  const dom=new JSDOM('<!doctype html><div id="model"></div>',{runScripts:'outside-only'});
  const w=dom.window,c=w.document.getElementById('model');
  for(const file of ['equations-data.js','equations-tasks.js'])w.eval(fs.readFileSync(path.join(root,'ege-profil/start',file),'utf8'));
  for(const t of tasks){
    let dispose=w.ProfileTaskModels[t.id](c,t,{mode:'independent',step:0,solved:false,completed:0});
    assert.ok(c.querySelector('svg[data-equation-view]'),t.id);assert.doesNotMatch(c.innerHTML,/NaN|Infinity|undefined/);
    assert.equal(c.querySelector('[data-current-expression]').textContent,t.diagram.left+(t.diagram.right!==null?' = '+t.diagram.right:''));
    assert.equal(c.querySelector('[data-domain-boundary]'),null,t.id+' initial domain must be derived first');
    assert.equal(c.querySelector('[data-expression-parts]').hidden,true);
    const button=c.querySelector('button');button.click();assert.equal(button.getAttribute('aria-pressed'),'true');assert.equal(c.querySelector('[data-expression-parts]').hidden,false);
    dispose();button.click();assert.equal(button.getAttribute('aria-pressed'),'true',t.id+' disposed control');
    for(let completed=0;completed<=t.steps.length;completed++){
      dispose=w.ProfileTaskModels[t.id](c,t,{mode:'guided',step:Math.max(0,completed-1),solved:completed>0,completed});
      const scene=models.sceneFor(t,{mode:'guided',completed});
      const expectedStage=completed?t.diagram.stages[completed-1]:[t.diagram.left,t.diagram.right];
      assert.equal(scene.left,expectedStage[0]);assert.equal(scene.right,expectedStage[1]);
      assert.equal(c.querySelector('[data-current-expression]').textContent,expectedStage[0]+(expectedStage[1]!==null?' = '+expectedStage[1]:''));
      assert.doesNotMatch(c.innerHTML,/NaN|Infinity|undefined/);
      assert.equal(!!c.querySelector('[data-domain-boundary]'),!!scene.domain);dispose();
    }
    assert.equal(models.sceneFor(t,{mode:'independent',solved:false,completed:99}).earned,0,t.id+' independent must not expose derived steps');
    assert.equal(models.sceneFor(t,{mode:'independent',solved:true}).earned,t.steps.length);
  }
  for(const l of lessons){const dispose=w.ProfileModels[l.model](c);assert.ok(c.querySelector('svg'));dispose();}
  dom.window.close();
});
