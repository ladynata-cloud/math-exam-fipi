'use strict';
// Independent robot mathematician: solve from the givens, never use the stored
// answer as input to the oracle. This is automated checking, not a human pupil trial.
const test = require('node:test');
const assert = require('node:assert/strict');
const lessons = require('../ege-profil/start/readiness-data.js');
const close = (actual, expected, label) => assert.ok(Number.isFinite(actual) && Math.abs(actual-expected)<1e-10, `${label}: ${actual} != ${expected}`);

// Deliberately distinct derivations: integer cross multiplication, solving by
// substitution, integer square-root search, Euclidean geometry from coordinates.
function integerRoot(n) { let k=0; while(k*k<n) k++; assert.equal(k*k,n,'fixture must have an exact integer root'); return k; }
function expectedSteps(m) {
  switch(m.kind) {
    case 'bridge-fractions': return [m.d/m.c,m.a*m.d,m.b*m.c,(m.a/m.b)/(m.c/m.d)];
    case 'bridge-signs': return [m.a**2,-(m.a**2),(-m.b)**2,(-m.b)*(-m.b)-(m.a*m.a)];
    case 'bridge-root-fraction': return [integerRoot(m.numerator),integerRoot(m.denominator),integerRoot(m.numerator)/integerRoot(m.denominator)];
    case 'bridge-roots': return [m.a*m.a,integerRoot(m.a*m.a),integerRoot(m.n),integerRoot(m.a*m.a)-integerRoot(m.n)];
    case 'bridge-equations': {
      const solutions=[]; for(let x=-100;x<=100;x++) if(m.k*(x-m.a)===m.b*x+m.c) solutions.push(x);
      assert.equal(solutions.length,1,'exactly one integer solution in the intended range');
      return [-m.k*m.a,m.k-m.b,m.c+m.k*m.a,solutions[0]];
    }
    case 'bridge-coordinates': return [m.x2-m.x1,m.y2-m.y1,(m.x1-m.x2)**2+(m.y1-m.y2)**2,Math.hypot(m.x1-m.x2,m.y1-m.y2)];
    case 'bridge-triangle': {
      assert.equal(m.adjacent**2+m.opposite**2,m.hypotenuse**2,'Pythagorean triangle');
      const angle=Math.atan2(m.opposite,m.adjacent);
      return [Math.hypot(m.adjacent,m.opposite),m.fn==='sin'?m.opposite:m.adjacent,m.fn==='sin'?Math.sin(angle):Math.cos(angle)];
    }
    default: throw new Error('missing independent oracle: '+m.kind);
  }
}

test('six bridge topics, separate guided/independent tasks, clear explanations', () => {
  assert.equal(lessons.length,6);
  const ids=new Set();
  for(const lesson of lessons) {
    assert.equal(lesson.group,'foundations');
    assert.equal(lesson.position,'Основа для профиля');
    assert.match(lesson.intro,/Пример/);
    assert.ok(lesson.prereq.title && lesson.prereq.text && lesson.prereq.href);
    assert.equal(lesson.tasks.length,6);
    const conditions=new Set();
    for(const task of lesson.tasks) {
      assert.ok(!ids.has(task.id),'duplicate ID '+task.id);ids.add(task.id);
      assert.ok(!conditions.has(task.prompt),'same task in guided and independent pools');conditions.add(task.prompt);
      assert.ok(task.explanation.length>20);
      assert.ok(task.steps.length>=3 && task.steps.length<=4);
      for(const step of task.steps) { assert.ok(step.hint.length>10);assert.ok(step.why.length>10); }
      assert.equal(typeof task.steps.at(-1).answer,'number');
      close(task.steps.at(-1).answer,task.answer,task.id+' must ask final answer');
    }
  }
  assert.equal(ids.size,36);
});

for(const lesson of lessons) for(const task of lesson.tasks) {
  test('mathematical oracle: '+task.id, () => {
    const expected=expectedSteps(task.meta);
    assert.equal(task.steps.length,expected.length);
    expected.forEach((n,i)=>close(task.steps[i].answer,n,task.id+' step '+(i+1)));
    close(task.answer,expected.at(-1),task.id+' final');
    // A common misconception must produce a different result, not be credited.
    const m=task.meta;
    if(m.kind==='bridge-fractions') assert.notEqual(task.answer,(m.a/m.b)*(m.c/m.d),'multiplication must not masquerade as division');
    if(m.kind==='bridge-signs') assert.notEqual(task.answer,m.a*m.a+m.b*m.b,'minus before power matters');
    if(m.kind==='bridge-root-fraction') {close(task.answer**2,m.numerator/m.denominator,'square of fraction root');assert.ok(task.answer>0);}
    if(m.kind==='bridge-roots') assert.notEqual(task.answer,m.a-integerRoot(m.n),'sqrt(a²) is not negative a');
    if(m.kind==='bridge-equations') close(m.k*(task.answer-m.a),m.b*task.answer+m.c,'substitution into original equality');
    if(m.kind==='bridge-coordinates') assert.ok(task.answer>0);
    if(m.kind==='bridge-triangle') {
      assert.match(task.prompt,/<svg /);assert.match(task.prompt,/role="img"/);
      assert.ok(task.answer>0 && task.answer<1);
      assert.notEqual(task.answer,(m.fn==='sin'?m.adjacent:m.opposite)/m.hypotenuse,'swapped catheti must fail');
      assert.match(task.prompt,new RegExp('AC = '+m.adjacent+', BC = '+m.opposite+', AB = '+m.hypotenuse));
      // Confirm a common scale was used for both legs in the actual SVG path.
      const [,cx,cy,ax,,bx,by]=task.prompt.match(/<path d="M ([\d.]+) ([\d.]+) L ([\d.]+) ([\d.]+) L ([\d.]+) ([\d.]+) Z"/);
      close((Number(ax)-Number(cx))/(Number(cy)-Number(by)),m.adjacent/m.opposite,'SVG leg ratio');
      close(Number(bx),Number(cx),'vertical cathetus');
    }
  });
}
