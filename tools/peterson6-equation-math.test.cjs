'use strict';
// Independent oracle reads the learner's condition, not task.calculation or
// the production parser. It checks modeled quantities and every intermediate
// across the three percentage families, levels and deterministic seeds.
const assert = require('node:assert/strict');
const M = require('../school/peterson6/math.js');
const legacyPercentDescriptions={
  'percent-part':'Находим одну сотую и нужное число сотых.',
  'percent-whole':'Из известной части восстанавливаем 100%.',
  'percent-ratio':'Часть делим на целое и умножаем на 100.'
};
assert.equal(M.skills.length,20);
assert.equal(M.equationSkills.length,20);
for(const [id,description] of Object.entries(legacyPercentDescriptions)){
  assert.equal(M.skills.find(s=>s.id===id).description,description,id+' shared skill description must remain legacy');
  const revised=M.equationSkills.find(s=>s.id===id);
  assert(revised&&revised.description!==description,id+' separate equation skill description');
}
for(const skill of M.skills.filter(s=>!s.id.startsWith('percent-')))assert.deepEqual(M.equationSkills.find(s=>s.id===skill.id),skill,skill.id+' arithmetic description changed');

function gcd(a,b){a=a<0n?-a:a;b=b<0n?-b:b;while(b)[a,b]=[b,a%b];return a;}
function norm(n,d=1n){assert.notEqual(d,0n);if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return[n/g,d/g];}
function q(value){
  if(Array.isArray(value))return value;
  let s=String(value).trim().replaceAll(',','.').replaceAll('−','-');
  if(s.includes('/')){const p=s.split('/');assert.equal(p.length,2);return divide(q(p[0]),q(p[1]));}
  assert.match(s,/^[+-]?\d+(?:\.\d+)?$/);
  const neg=s.startsWith('-');s=s.replace(/^[+-]/,'');const [whole,decimal='']=s.split('.');
  return norm((neg?-1n:1n)*BigInt(whole+decimal),10n**BigInt(decimal.length));
}
function add(a,b){a=q(a);b=q(b);return norm(a[0]*b[1]+b[0]*a[1],a[1]*b[1]);}
function subtract(a,b){b=q(b);return add(a,[-b[0],b[1]]);}
function multiply(a,b){a=q(a);b=q(b);return norm(a[0]*b[0],a[1]*b[1]);}
function divide(a,b){a=q(a);b=q(b);return norm(a[0]*b[1],a[1]*b[0]);}
function same(a,b){a=q(a);b=q(b);return a[0]===b[0]&&a[1]===b[1];}
function assertQ(actual,expected,message){assert(same(actual,expected),message+': '+actual+' != '+expected.join('/'));}

function modelFromPrompt(skill,prompt){
  let match,pct,whole,part;
  if(skill==='percent-part'){
    match=/^Найди ([\d,]+)% от (\d+)\./.exec(prompt);assert(match,prompt);
    pct=q(match[1]);whole=q(match[2]);part=divide(multiply(whole,pct),100);
  }else if(skill==='percent-whole'){
    match=/^([\d,]+) составляет ([\d,]+)% числа\./.exec(prompt);assert(match,prompt);
    part=q(match[1]);pct=q(match[2]);whole=divide(multiply(part,100),pct);
  }else{
    match=/^Сколько процентов число ([\d,]+) составляет от (\d+)\?/.exec(prompt);assert(match,prompt);
    part=q(match[1]);whole=q(match[2]);pct=divide(multiply(part,100),whole);
  }
  return{pct,whole,part,rate:divide(pct,100),unknown:skill==='percent-part'?part:skill==='percent-whole'?whole:pct};
}

function expression(source,x){
  source=source.replace(/\{\{frac:([^:{}]+):([^:{}]+)\}\}/g,'(($1)/($2))').replaceAll('−','-').replaceAll('·','*').replaceAll(':','/').replaceAll(',','.').replace(/\s/g,'');
  const raw=source.match(/\d+(?:\.\d+)?|x|[()+\-*/]/g)||[];
  assert.equal(raw.join(''),source,'unsupported equation text: '+source);
  const tokens=[];
  for(const token of raw){const prev=tokens.at(-1);if(prev&&/^(?:\d+(?:\.\d+)?|x|\))$/.test(prev)&&/^(?:x|\()$/.test(token))tokens.push('*');tokens.push(token);}
  let i=0;
  function factor(){
    const t=tokens[i++];
    if(t==='+')return factor();
    if(t==='-')return subtract(0,factor());
    if(t==='x')return x;
    if(t==='('){const v=sum();assert.equal(tokens[i++],')');return v;}
    assert(t!==undefined,'unexpected end: '+source);return q(t);
  }
  function term(){let v=factor();while(tokens[i]==='*'||tokens[i]==='/'){const op=tokens[i++],b=factor();v=op==='*'?multiply(v,b):divide(v,b);}return v;}
  function sum(){let v=term();while(tokens[i]==='+'||tokens[i]==='-'){const op=tokens[i++],b=term();v=op==='+'?add(v,b):subtract(v,b);}return v;}
  const result=sum();assert.equal(i,tokens.length,'unconsumed equation text: '+source);return result;
}
function relation(equation,x){const pieces=equation.split('=');assert.equal(pieces.length,2);return same(expression(pieces[0],x),expression(pieces[1],x));}

const errors=[],positions=new Set();let cases=0,numeric=0,equations=0,unchanged=0;
for(const skill of ['percent-part','percent-whole','percent-ratio'])for(let level=1;level<=3;level++)for(let seed=1;seed<=100;seed++){
  const label=`${skill} level=${level} seed=${seed}`;
  try{
    const legacy=M.generateLegacy(skill,seed,level),current=M.generate(skill,seed,level,2),f=modelFromPrompt(skill,current.prompt);
    assert.deepEqual(M.generate(skill,seed,level,1),legacy,label+' explicit legacy');
    assert.deepEqual(M.generate(skill,seed,level),legacy,label+' shared default must remain legacy');
    for(const key of ['id','title','prompt','kind','answer','answerFormat','finalLabel','source','calculation','skills'])assert.deepEqual(current[key],legacy[key],label+' retained '+key);
    assert.equal(current.methodVersion,2);
    assertQ(current.answer,f.unknown,label+' final answer');
    assert.deepEqual(current,M.generate(skill,seed,level,2),label+' reproducibility');
    const byId=Object.fromEntries(current.steps.map(s=>[s.id,s]));
    assert.equal(current.steps.length,5);assert.equal(Object.keys(byId).length,5);
    for(const id of ['unknown','equation']){
      const step=byId[id];assert.equal(step.kind,'choice');assert.equal(step.choices.length,3);assert.equal(new Set(step.choices).size,3);assert.equal(step.choices.filter(s=>s===step.answer).length,1);
      positions.add(step.choices.indexOf(step.answer));assert(step.hint&&step.explanation);
    }
    const meanings={'percent-part':'искомая часть числа','percent-whole':'всё число, принятое за 100%','percent-ratio':'искомое число процентов'};
    assert.equal(byId.unknown.answer,meanings[skill],label+' unknown meaning');
    const truths=byId.equation.choices.map(option=>relation(option,f.unknown));
    assert.equal(truths.filter(Boolean).length,1,label+' equation choices must have exactly one valid model: '+JSON.stringify(byId.equation.choices));
    assert(truths[byId.equation.choices.indexOf(byId.equation.answer)],label+' designated equation');
    equations++;
    const expected={rate:skill==='percent-ratio'?f.whole:f.rate,root:f.unknown,check:skill==='percent-part'?f.pct:f.part};
    for(const [id,value] of Object.entries(expected)){assert.equal(byId[id].kind,'number');assertQ(byId[id].answer,value,label+' step '+id);assert(byId[id].hint&&byId[id].explanation);numeric++;}
    if(skill==='percent-ratio')assert(!/найденного целого/.test(byId.check.prompt),label+' whole was given, not found');
    cases++;
  }catch(error){errors.push({case:label,error:error.message});}
}
// Arithmetic detours must not silently receive the new teaching semantics.
for(const skill of M.skills.filter(s=>!s.id.startsWith('percent-')))for(let level=1;level<=3;level++)for(let seed=1;seed<=20;seed++){
  assert.deepEqual(M.generate(skill.id,seed,level),M.generateLegacy(skill.id,seed,level),skill.id+' shared numeric practice changed');
  assert.deepEqual(M.generate(skill.id,seed,level,2),M.generateLegacy(skill.id,seed,level),skill.id+' equation-mode numeric practice changed');unchanged++;
}
assert.equal(errors.length,0,`${errors.length} generated-case failures; first findings: ${JSON.stringify(errors.slice(0,15))}`);
assert.deepEqual([...positions].sort(),[0,1,2]);
assert.equal(cases,900);assert.equal(numeric,2700);assert.equal(equations,900);
console.log(JSON.stringify({ok:true,cases,numericSteps:numeric,equations,distractors:equations*2,legacyIdentityCases:cases,unchangedArithmeticCases:unchanged,gate:'PETERSON6_EQUATION_GENERATOR_OK'}));
