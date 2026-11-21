'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const lessons=require('../ege-profil/part-two/content-algebra.js');
const checker=require('../ege-profil/start/checks.js');
const tasks=lessons.flatMap(lesson=>lesson.tasks);
const family=kind=>tasks.filter(task=>task.meta.kind===kind);
const near=(actual,expected,label)=>assert.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<1e-8,label+': '+actual+' != '+expected);
const at=(expression,x)=>checker.number(expression.replace(/\bx\b/g,'('+x+')').replace(/²/g,'^2'));
const samples=[-7,-1,0,2,7];

test('all 72 algebra conditions use concrete expressions in their steps and help',()=>{
 assert.equal(tasks.length,72);
 for(const task of tasks){
  const content=[...task.steps.flatMap(step=>[step.prompt,step.hint,step.explanation]),...task.solution].join('\n');
  assert.doesNotMatch(content,/\b[abc]\b|k\/2|x\s*\+\s*-\d|−\s*−|undefined|NaN/,task.id);
  for(const step of task.steps)assert.ok(step.hint.length<=180,task.id+': keep help short');
 }
});

test('Vieta help gives the opposite of the signed linear coefficient, for all six equations',()=>{
 for(const task of family('exponential-equation')){
  const text=task.steps[1].hint;
  const values=text.match(/с суммой ([\d/.-]+) и произведением ([\d/.-]+)/);
  assert.ok(values,task.id);
  const [sum,product]=values.slice(1).map(checker.number);
  // Read the displayed polynomial; do not use the generator's meta.sum.
  const polynomial=task.prompt.match(/<sup>2x<\/sup> − \(([^)]+)\).*? \+ ([\d/.-]+) = 0/);
  assert.ok(polynomial,task.id);
  near(sum,checker.number(polynomial[1]),task.id+' root sum');
  near(product,checker.number(polynomial[2]),task.id+' root product');
  assert.match(text,/Сумма противоположна коэффициенту/,task.id);
  const [u,v]=task.steps.slice(1,3).map(step=>checker.number(String(step.answers[0])));
  near(u+v,sum,task.id+' supplied roots');
  near(u*v,product,task.id+' supplied roots');
 }
});

test('fixed-log help agrees with the actual base and directs the comparison correctly',()=>{
 for(const task of family('fixed-log-inequality')){
  const baseText=task.prompt.match(/log<sub>([^<]+)<\/sub>/)[1];
  const base=checker.number(baseText);
  const increases=Math.log(3)/Math.log(base)>Math.log(2)/Math.log(base);
  const hint=task.steps[2].hint;
  assert.ok(hint.includes('Основание '+baseText+' '),task.id);
  assert.equal(hint.includes('возрастает'),increases,task.id);
  assert.equal(hint.includes('убывает'),!increases,task.id);
  assert.ok(task.steps[2].answers.includes(increases?'≥':'≤'),task.id);
  const expression=task.steps[3].hint.match(/аргумента: (.+) − 1 = (.+)\. Исследуйте/);
  assert.ok(expression,task.id);
  for(const x of samples){
   if(x===task.meta.c)continue;
   near(at(expression[1],x)-1,at(expression[2],x),task.id+' concrete subtraction at '+x);
  }
 }
});

test('log-equation step contains the same two factors and constant as the actual condition',()=>{
 for(const task of family('log-equation')){
  const factors=task.prompt.match(/<sub>[^<]+<\/sub>\(([^)]+)\)/g);
  assert.equal(factors.length,2,task.id);
  const expressions=factors.map(s=>s.match(/\(([^)]+)\)/)[1]);
  const shown=task.steps[1].prompt.match(/логарифмов: \(([^)]+)\)\(([^)]+)\) = (\d+)\./);
  assert.ok(shown,task.id);
  const rhs=Number(task.prompt.match(/ = log<sub>[^<]+<\/sub>(\d+)/)[1]);
  near(Number(shown[3]),rhs,task.id+' right side');
  for(const x of samples){
   near(at(shown[1],x),at(expressions[0],x),task.id+' first factor');
   near(at(shown[2],x),at(expressions[1],x),task.id+' second factor');
  }
 }
});

test('squaring help retains the actual radical and right side including negative constants',()=>{
 for(const task of family('radical-equation')){
  const original=task.prompt.match(/√\(([^)]+)\) = ([^<]+)<\/b>/);
  const hint=task.steps[1].hint.match(/^Решите (.+) = \((.+)\)²\.$/);
  assert.ok(original&&hint,task.id);
  for(const x of samples){
   near(at(hint[1],x),at(original[1],x),task.id+' radicand');
   near(at(hint[2],x),at(original[2],x),task.id+' right side');
  }
  assert.ok(task.steps[2].hint.includes(original[2]),task.id+' checking the candidate');
 }
});

test('variable-base steps retain the exact base and argument and show true constant comparisons',()=>{
 for(const task of family('variable-log-inequality')){
  const [ , base,argument]=task.prompt.match(/log<sub>([^<]+)<\/sub>\(([^)]+)\)/);
  assert.ok(task.steps[0].hint.includes(base+' = 1'),task.id);
  assert.ok(task.steps[2].prompt.includes('аргументом ('+argument+')'),task.id);
  assert.ok(task.steps[2].prompt.includes('основанием ('+base+')'),task.id);
  const comparisons=[...task.solution[1].matchAll(/то есть ([\d/.-]+) (≤|≥) ([\d/.-]+) — (верно|неверно)/g)];
  assert.equal(comparisons.length,2,task.id);
  for(const [,left,sign,right,verdict]of comparisons){
   const a=checker.number(left),b=checker.number(right),truth=sign==='≤'?a<=b:a>=b;
   assert.equal(verdict==='верно',truth,task.id);
  }
  // Cases must still be intersected with argument positivity: log_x(x-2)
  // cannot gain solutions merely because -2 <= 0 is true.
  if(task.id==='p16-variable-base-6'){
   assert.match(task.solution[2],/x > 2/);
   assert.match(task.solution[2],/Ответ: ∅/);
  }
 }
});

test('trig-factor step gives the actual cosine level, including zero and negative radicals',()=>{
 for(const task of family('trig-factor')){
  const coefficient=task.prompt.match(/sin 2x = (.+) · sin x/)[1];
  const displayed=task.steps[1].prompt.match(/cos x = (.+)\. Чему/)[1];
  near(checker.number(displayed),checker.number(coefficient)/2,task.id);
  assert.ok(task.steps[1].hint.includes(displayed),task.id);
  assert.ok(task.steps[3].hint.includes(displayed),task.id);
  assert.ok(task.solution[0].includes('− ('+coefficient+')'),task.id+' safe subtraction');
 }
});

test('repeated-root sign hint uses the fraction remaining from this exact condition',()=>{
 for(const task of family('rational-repeated')){
  const fraction=task.steps[3].hint.match(/знак (.+)\.$/)[1];
  for(const x of samples){
   if(x===task.meta.c)continue;
   near(at(fraction,x),(x-task.meta.b)/(x-task.meta.c),task.id+' sign fraction');
  }
 }
});

test('rational-hole hint stops at the squared expression, including the zero-shift case',()=>{
 for(const task of family('rational-equation')){
  const hint=task.steps[1].hint;
  const shown=hint.match(/получится \((.+)\)² = (\d+)\./);
  assert.ok(shown,task.id);
  for(const x of samples)near(at(shown[1],x),x-task.meta.b,task.id+' reduced expression');
  near(Number(shown[2]),task.meta.k**2,task.id+' squared right side');
  assert.match(hint,/Найдите оба числа с таким квадратом/,task.id);
 }
 const zeroShift=tasks.find(task=>task.id==='p14-rational-hole-3');
 assert.equal(zeroShift.meta.b,0);
 assert.match(zeroShift.steps[1].hint,/\(x\)² = 4/);
 assert.doesNotMatch(zeroShift.steps[1].hint,/x\s*=\s*[-−]?\s*2/);
});
