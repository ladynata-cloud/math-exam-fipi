import test from 'node:test';
import assert from 'node:assert/strict';
import { R, polynomial, eq } from '../src/math-kernel.js';
import { parseExact,eText,eAt,eSign,eEqual,rootsOf,verifyRoots,er,eCompare } from '../src/exact-roots.js';
import { polynomialIntervals,rationalIntervals,verifyIntervals,parseIntervals } from '../src/intervals.js';
import { systemSolution,verifySystem } from '../src/linear-system.js';
import { EQUATION_TOPICS,solveExpandedEquation } from '../src/equations-expanded.js';
import { answerOffline,isProviderTopic } from '../src/tutor.js';
import { normalizeTask,inferTopic } from '../public/study-tools.js';
import { parseQuestion } from '../src/privacy.js';
const solve=(topic,q,a)=>{const s=solveExpandedEquation(topic,q);assert(s,`${topic}: ${q}`);if(a!==undefined)assert.equal(s.verify(a).status,'correct',`${q}: ${a}`);return s;};
function includes(intervals,r){const x=er(r);return intervals.some(i=>(!i.l||eCompare(x,i.l)>0||i.lc&&eEqual(x,i.l))&&(!i.r||eCompare(x,i.r)<0||i.rc&&eEqual(x,i.r)));}

test('exact quadratic roots reconstruct zero without approximate grading',()=>{
  for(let a=-6;a<=6;a++)for(let b=-6;b<=6;b++){
    const p=polynomial(`x^2-(${a+b})x+(${a*b})`).p,s=rootsOf(p);
    assert.equal(verifyRoots(s,`${a};${b}`).status,'correct');
    for(const r of s.roots)assert.equal(eSign(eAt(p,r)),0);
  }
  for(const q of ['x^2-2=0','2x^2+x-3=0','x^2-x-1=0','x^2+4x+4=0']){
    const [l,r]=q.split('='),p=polynomial(l).p,s=rootsOf(p);for(const root of s.roots){assert.equal(eSign(eAt(p,root)),0);assert(eEqual(parseExact(eText(root)),root));}
  }
  solve('quadratic-equations','x^2-x-1=0','(1+√5)/2;(1-√5)/2');
  assert.equal(solve('quadratic-equations','x^2-2=0').verify('1.414214;-1.414214').status,'incorrect');
  solve('quadratic-equations','x^2+1=0','нет решений');solve('quadratic-equations','x=x','все действительные числа');
  assert(eEqual(parseExact('3√8'),parseExact('6√2')));assert.throws(()=>parseExact('x'));assert.throws(()=>parseExact('1/√2'));
  assert.equal(eText(parseExact('1/1234567')),'1/1234567');
});

test('linear/quadratic inequality sets match direct integer arithmetic at 16500 probes',()=>{
  let count=0;for(const a of [-2,-1,0,1,2])for(const b of [-2,-1,0,1,2])for(const c of [-2,-1,0,1,2])for(const op of ['>','<','>=','<=']){
    const p=polynomial(`(${a})x^2+(${b})x+(${c})`).p,intervals=polynomialIntervals(p,op);
    for(let k=-16;k<=16;k++){const n=a*k*k+4*b*k+16*c;const want=op==='>'?n>0:op==='<'?n<0:op==='>='?n>=0:n<=0;assert.equal(includes(intervals,R(k,4)),want,`${a},${b},${c},${op},${k}/4`);count++;}
  }assert.equal(count,16500);
  solve('inequalities','-2x+3<7','(-2;+∞)');solve('inequalities','(x-2)^2<=0','{2}');solve('inequalities','-(x-2)^2>=0','{2}');
  assert.equal(verifyIntervals(parseIntervals('[1;2]'),'(1;2] ∪ {1}').status,'correct');
  assert.equal(verifyIntervals(parseIntervals('(1;2)'), '[1;2)').status,'incorrect');assert.throws(()=>parseIntervals('[-∞;2]'));
});

test('rational sign charts match original fractions and never include denominator roots',()=>{
  let count=0;for(const a of [-2,0,2])for(const b of [-2,0,2])for(const c of [-2,0,2])for(const d of [-2,0,2]){
    if(!c&&!d)continue;
    const num=polynomial(`(${a})x+(${b})`).p,den=polynomial(`(${c})x+(${d})`).p;
    for(const op of ['>','<','>=','<=']){const intervals=rationalIntervals(num,den,op);for(let k=-12;k<=12;k++){
      const n=a*k+4*b,denom=c*k+4*d,sign=n*denom;const want=!!denom&&(op==='>'?sign>0:op==='<'?sign<0:op==='>='?sign>=0:sign<=0);assert.equal(includes(intervals,R(k,4)),want);count++;
    }}
  }assert.equal(count,7200);
  solve('rational-inequalities','(x-1)/(x+2)>=0','(-∞;-2) ∪ [1;+∞)');
  solve('rational-inequalities','(x-1)/(x-1)<=0','∅');
});

test('linear systems: independently chosen solution and singular classifications',()=>{
  let unique=0;for(let a=-2;a<=2;a++)for(let b=-2;b<=2;b++)for(let c=-2;c<=2;c++)for(let d=-2;d<=2;d++){
    if(a*d===b*c)continue;const s=systemSolution(`${a}x+(${b})y=${a-2*b};${c}x+(${d})y=${c-2*d}`);
    assert.equal(s.kind,'one');assert(eq(s.x,R(1)));assert(eq(s.y,R(-2)));assert.equal(verifySystem(s,'y=-2;x=1').status,'correct');unique++;
  }assert.equal(unique,496);
  for(const q of ['x+y=2;2x+2y=4','0=0;x=2','0=0;0=0','y=2;2y=4'])solve('linear-systems',q,'бесконечно много решений');
  for(const q of ['x+y=2;2x+2y=5','0=1;x=2','x=1;x=2'])solve('linear-systems',q,'нет решений');
  assert.throws(()=>systemSolution('x*y=2;x+y=3'));assert.throws(()=>systemSolution('1/2x+y=2;x+y=3'));
});

test('domain restrictions and extraneous roots are checked before praise',()=>{
  solve('rational-equations','(x+1)/(x-1)=2','3');solve('rational-equations','(x-1)/(x-1)=0','нет решений');
  solve('rational-equations','(x-1)/(x-1)=1','(-∞;1)∪(1;+∞)');
  solve('radical-equations','√(x+2)=x','2');assert.equal(solve('radical-equations','√(x+2)=x').verify('-1;2').status,'incorrect');
  solve('radical-equations','√(x)=-1','нет решений');solve('radical-equations','√(4)=2','все действительные числа');
  solve('absolute-equations','|x-2|=3','-1;5');solve('absolute-equations','|2x+1|=0','-1/2');solve('absolute-equations','|x|=-1','нет решений');
  solve('logarithmic-equations','log_2(x-1)=3','9');solve('logarithmic-equations','log_2(x)=log_2(-x)','нет решений');solve('logarithmic-equations','log_2(x)=log_2(x)','(0;+∞)');
  solve('exponential-equations','(1/2)^x=8','-3');solve('exponential-equations','2^(x+1)=2^(3-x)','1');solve('exponential-equations','999^x=999','1');
  for(const [topic,q] of [['exponential-equations','2^x+1=4'],['exponential-equations','2^x=3'],['exponential-equations','1^x=1'],['logarithmic-equations','log_1(x)=2'],['rational-equations','x+1/x-1=2'],['radical-equations','√(x^2)=x']])assert.equal(solveExpandedEquation(topic,q),null,q);
});

test('trigonometric roots use exact unit-circle values and interval endpoints',()=>{
  solve('trigonometric-equations','sin(x)=1/2; [0;2pi]','pi/6;5pi/6');
  solve('trigonometric-equations','cos(x)=1; [0;2pi]','0;2pi');solve('trigonometric-equations','cos(x)=1; (0;2pi)','нет решений');
  solve('trigonometric-equations','tan(x)=-1; (-pi;pi]','-pi/4;3pi/4');
  solve('trigonometric-equations','sin(x)=√2/2; [-pi;pi]','pi/4;3pi/4');solve('trigonometric-equations','sin(x)=2; [0;2pi]','нет решений');
  assert.equal(solveExpandedEquation('trigonometric-equations','sin(x)=1/3; [0;2pi]'),null);
  const hint=answerOffline({topic:'trigonometric-equations',question:'sin(x)=1/2; [0;2pi]'});assert.equal(hint.figure,undefined);
  const full=answerOffline({topic:'trigonometric-equations',question:'sin(x)=1/2; [0;2pi]',mode:'explain'});assert.equal(full.figure.kind,'unit-circle');assert.equal(full.figure.points.length,2);assert.doesNotThrow(()=>JSON.stringify(full));
});

test('new offline topics, superscripts, hint boundaries and unsupported input',()=>{
  for(const t of EQUATION_TOPICS){assert.equal(isProviderTopic(t.id),false);const r=answerOffline({topic:t.id,question:t.sample});assert.equal(r.verification,'deterministic',t.id);assert.equal(r.steps.length,1);assert.equal(r.complete,false);assert.doesNotThrow(()=>JSON.stringify(r));}
  assert.equal(normalizeTask('x²+2x³'),'x^2+2x^3');assert.equal(inferTopic('x²-2=0'),'quadratic-equations');
  const q=parseQuestion({topic:'quadratic-equations',question:'x²-2=0',attempt:'-√2;√2',mode:'hint',hintLevel:1,externalConsent:false,requestId:'12345678-1234-4234-8234-123456789abc'},['quadratic-equations']);
  assert.equal(q.question,'x^2-2=0');assert.equal(answerOffline(q).attemptStatus,'correct');
  for(const input of ['x^999=2','x/x=1','globalThis.process=0','('.repeat(100)+'x=1', '9'.repeat(100)+'x=1'])assert.equal(answerOffline({topic:'quadratic-equations',question:input}).verification,'needs-teacher');
});
