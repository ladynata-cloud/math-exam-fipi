import test from 'node:test';
import assert from 'node:assert/strict';
import { R, eq, text, numeric, polynomial, pEqual, pAt, rounded } from '../src/math-kernel.js';
import { solveArithmetic, solveFractionProduct, solveComparison, solveProportion, solveConversion, solvePolynomial } from '../src/math-foundations.js';
import { answerOffline } from '../src/tutor.js';

test('operator order, negative powers and exact mixed fractions',()=>{
  for(const [q,want] of [['-2^2','-4'],['(-2)^2','4'],['(-2)^-3','-1/8'],['2^3^2','512'],['12/3/2','2'],['1 1/2 * 2/3','1'],['-1 1/2+1/2','-1'],['(1/2+1/3)*6','5']])assert.equal(text(numeric(q).value),want,q);
  assert.match(solveArithmetic('(-2)^2').steps[0],/^\(-2\) \^ 2 = 4$/);
  assert.equal(text(solveFractionProduct('1/2 : 3/4').expected),'2/3');
  assert.equal(text(solveFractionProduct('1 1/2 ÷ 3/4').expected),'2');
  assert.equal(solveFractionProduct('1/2/3/4'),null);
  assert.equal(text(solveArithmetic('1/2 ÷ 3/4').expected),'2/3');
  assert.equal(solveArithmetic('2 + 1/2 ÷ 3/4'),null);
  for(const q of ['1/0','0^-1','0^0','x^0','2^1000','1 2','1/2x','x/x','x^5','process.exit()','Infinity','2**3'])assert.throws(()=>polynomial(q),undefined,q);
  assert.equal(solveArithmetic('(1+2)*(3+4)*(5+6)*(7+8)*(9+10)*(11+12)'),null);
});
test('fraction multiplication/division agree with independent cross-products in 448 cases',()=>{
  let cases=0;for(let a=-4;a<=3;a++)for(let b=1;b<=7;b++)for(let c=1;c<=4;c++){
    const product=solveFractionProduct(`${a}/${b} * ${c}/5`),quotient=solveFractionProduct(`${a}/${b} : ${c}/5`);
    assert(eq(product.expected,R(a*c,b*5)));assert(eq(quotient.expected,R(a*5,b*c)));cases+=2;
  }assert.equal(cases,448);
});
test('root simplification is exact; decimal estimates cannot masquerade as exact radicals',()=>{
  for(const [q,answer] of [['√72','6√2'],['√49','7'],['√0','0'],['sqrt(12)','2√3']])assert.equal(solveArithmetic(q).verify(answer).status,'correct');
  assert.equal(solveArithmetic('√2').verify('1,414214').status,'unsupported');
  assert.equal(solveArithmetic('√72').verify('3√8').status,'incorrect');
  assert.equal(solveArithmetic('√-1'),null);
  for(let n=0;n<=400;n++){const r=solveArithmetic(`√${n}`);assert(r);const m=/^(\d+)?√(\d+)$/.exec(r.expectedText);const square=m?BigInt(m[1]||1)**2n*BigInt(m[2]):BigInt(r.expectedText)**2n;assert.equal(square,BigInt(n));}
});
test('comparison and proportions respect signs, denominator restrictions and exactness',()=>{
  assert.equal(solveComparison('Сравни -1 1/2 и -7/4').verify('>').status,'correct');
  assert.equal(solveComparison('Сравни 1/3 и 0,333333').verify('=').status,'incorrect');
  for(const [q,a] of [['x/3=4/6','2'],['3/x=6/4','2'],['3/6=x/4','2'],['3/6=4/x','8']])assert.equal(solveProportion(q).verify(a).status,'correct');
  assert.equal(solveProportion('3/0=x/4'),null);assert.equal(solveProportion('3*6=x*4'),null);
});
test('rounding is explicit, half away from zero, and decimal conversion displays a decimal',()=>{
  assert.equal(solveArithmetic('1/3').verify('0,333333').status,'incorrect');
  const approx=solveArithmetic('1/3; округли до 2 знаков');assert.equal(approx.verify('0,33').status,'correct');assert.match(approx.steps.at(-1),/0,33 \(приближённо\)/);
  assert.equal(text(rounded(R(-125,100),1)),'-13/10');
  assert.equal(solveConversion('0,25 в проценты').verify('25%').status,'correct');
  assert.equal(solveConversion('25% в дробь').verify('1/4').status,'correct');
  const decimal=solveConversion('1/4 в десятичную дробь');assert.equal(decimal.verify('0,25').status,'correct');assert.match(decimal.steps.at(-1),/0,25/);assert.equal(decimal.verify('1/4').status,'unsupported');
  assert.equal(solveConversion('1/3 в десятичную дробь'),null);
});
test('unit conversion accepts equal quantities and rejects a wrong dimension',()=>{
  const s=solveConversion('250 см в м');for(const a of ['2,5','2,5 м','250 см','2500 мм','0,0025 км'])assert.equal(s.verify(a).status,'correct',a);
  assert.equal(s.verify('2,5 кг').status,'incorrect');assert.equal(s.verify('250 м').status,'incorrect');
  assert.equal(solveConversion('250 см в кг'),null);
  assert.equal(solveConversion('1,5 ч в мин').verify('5400 с').status,'correct');
});
test('polynomial simplification and factorization are identities across independent substitutions',()=>{
  for(const [q,answer] of [['Упрости: 2(x+3)-x','x+6'],['Разложи: x^2-9','(x-3)*(x+3)'],['Разложи: 2x^2+4x','2x(x+2)'],['Разложи: x^3+2x^2+3x+6','(x+2)(x^2+3)']]){
    const s=solvePolynomial(q);assert(s,q);assert.equal(s.verify(answer).status,'correct');const original=polynomial(q.split(':')[1]).p,final=polynomial(s.expectedText).p;assert(pEqual(original,final));
    for(let x=-10;x<=10;x++)assert(eq(pAt(original,R(x)),pAt(final,R(x))));
  }
  assert.equal(solvePolynomial('Разложи: x^2-9').verify('(x-3)^2').status,'incorrect');
  assert.equal(solvePolynomial('Разложи: x^2-9').verify('1*(x^2-9)').status,'unsupported');
  assert.equal(solvePolynomial('Упрости: 2(x+3)-x').verify('2(x+3)-x').kind,'step');
  assert.equal(solveArithmetic('2^3').verify('2^3').status,'unsupported');
  assert.equal(solvePolynomial('Разложи: x^2+1'),null);
});
test('new topics use the checked offline boundary, preserve staged hints and honest unsupported states',()=>{
  for(const [topic,q,a] of [['arithmetic','2^3','8'],['fractions','1/2 : 3/4','2/3'],['comparison','Сравни 1/2 и 2/3','<'],['proportions','x/3=4/6','2'],['conversions','250 см в м','2500 мм'],['polynomials','Упрости: 2(x+3)-x','x+6']]){
    const hint=answerOffline({topic,question:q,attempt:a});assert.equal(hint.verification,'deterministic');assert.equal(hint.complete,false);assert.equal(hint.steps.length,1);assert.equal(hint.attemptStatus,'correct');
  }
  assert.equal(answerOffline({topic:'arithmetic',question:'1/0'}).verification,'needs-teacher');
});

test('polynomial multiplication matches independently expanded integer coefficients',()=>{
  let cases=0;
  for(const a of [-3,-1,1,4])for(const b of [-2,0,5])for(const c of [-2,1,3])for(const d of [-4,0,2]){
    const p=polynomial(`(${a}x+(${b}))*(${c}x+(${d}))`).p;
    for(const x of [-7,-1,0,2,8])assert(eq(pAt(p,R(x)),R((a*x+b)*(c*x+d))));
    assert(eq(p[0]||R(0),R(b*d)));assert(eq(p[1]||R(0),R(a*d+b*c)));assert(eq(p[2]||R(0),R(a*c)));cases++;
  }
  assert.equal(cases,108);
  assert.equal(solvePolynomial('Упрости: x+x+2').verify('x+x+2').kind,'step');
});
