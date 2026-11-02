import { R, abs, gcd, add, sub, mul, div, eq, compare, text, polynomial, pAdd, pNeg, sqrtInteger } from './math-kernel.js';
export function squarePart(n) {
  if(n<0n||n>1000000000000n)throw Error('RADICAL_LIMIT');
  const whole=sqrtInteger(n);if(whole*whole===n)return {outside:whole,inside:1n};
  let outside=1n,inside=n;
  for(let d=2n;d*d<=inside;d++)while(inside%(d*d)===0n){outside*=d;inside/=d*d;}
  return {outside,inside};
}
export function E(a,b=R(0),d=0n){if(!b.n||!d)return {a,b:R(0),d:0n};if(d===1n)return {a:add(a,b),b:R(0),d:0n};return {a,b,d};}
export const er = value => E(value);
export function eAdd(x,y){if(x.b.n&&y.b.n&&x.d!==y.d)throw Error('DISTINCT_RADICALS');return E(add(x.a,y.a),add(x.b,y.b),x.b.n?x.d:y.d);}
export const eNeg=x=>E(R(-x.a.n,x.a.d),R(-x.b.n,x.b.d),x.d);
export const eSub=(x,y)=>eAdd(x,eNeg(y));
export function eMul(x,y){if(x.b.n&&y.b.n&&x.d!==y.d)throw Error('DISTINCT_RADICALS');const d=x.b.n?x.d:y.d;return E(add(mul(x.a,y.a),mul(mul(x.b,y.b),R(d))),add(mul(x.a,y.b),mul(x.b,y.a)),d);}
export const eEqual=(x,y)=>eq(x.a,y.a)&&eq(x.b,y.b)&&(!x.b.n||x.d===y.d);
export function eSign(x){const a=x.a.n<0n?-1:x.a.n?1:0,b=x.b.n<0n?-1:x.b.n?1:0;if(!b)return a;if(!a)return b;if(a===b)return a;const c=compare(mul(x.a,x.a),mul(mul(x.b,x.b),R(x.d)));return c===0?0:c*a;}
export const eCompare=(x,y)=>eSign(eSub(x,y));
export function eAt(p,x){return p.reduceRight((value,c)=>eAdd(eMul(value,x),er(c)),er(R(0)));}
export function eText(x){if(!x.b.n)return text(x.a);const coeff=abs(x.b.n)===1n?'':String(abs(x.b.n));const term=`${coeff}√${x.d}${x.b.d===1n?'':'/'+x.b.d}`;return (x.a.n?text(x.a):'')+(x.b.n<0n?'-':x.a.n?'+':'')+term;}
export function parseExact(value){
  if(typeof value!=='string'||value.length>200)throw Error('EXACT_FORMAT');
  let q=value.trim().replace(/[−–—]/g,'-').replace(/^x(?:[12])?\s*=\s*/,'').replace(/sqrt\((\d+)\)/g,'√$1'),d=0n;
  if(/[xхy]/.test(q))throw Error('EXACT_FORMAT');
  q=q.replace(/√\s*(?:\((\d{1,12})\)|(\d{1,12}))/g,(_m,a,b)=>{const s=squarePart(BigInt(a||b));if(s.inside===1n)return String(s.outside);if(d&&d!==s.inside)throw Error('DISTINCT_RADICALS');d=s.inside;return `(${s.outside}x)`;});
  if(!d){const p=polynomial(q,{variables:false,maxDigits:12}).p;return er(p[0]);}
  const p=polynomial(q,{maxDigits:12}).p;let a=R(0),b=R(0);
  for(let i=0;i<p.length;i++){const scale=R(d**BigInt(Math.floor(i/2)));if(i%2)b=add(b,mul(p[i],scale));else a=add(a,mul(p[i],scale));}
  return E(a,b,d);
}
export function equationPolynomial(q){const sides=q.split('=');if(sides.length!==2)throw Error('EQUATION_FORMAT');return pAdd(polynomial(sides[0]).p,pNeg(polynomial(sides[1]).p));}
export function rootsOf(p){
  if(p.length>3)throw Error('QUADRATIC_LIMIT');
  if(p.length===1)return {kind:p[0].n?'none':'all',roots:[],p};
  if(p.length===2)return {kind:'finite',roots:[er(div(R(-p[0].n,p[0].d),p[1]))],p};
  const common=p.reduce((d,c)=>d/gcd(d,c.d)*c.d,1n);let [c,b,a]=p.map(v=>v.n*(common/v.d));
  const g=gcd(gcd(a,b),c);a/=g;b/=g;c/=g;if(a<0n){a=-a;b=-b;c=-c;}
  if([a,b,c].some(v=>abs(v)>1000000n))throw Error('COEFFICIENT_LIMIT');
  const D=b*b-4n*a*c;if(D<0n)return {kind:'none',roots:[],p,D,a,b,c};
  const s=squarePart(D),center=R(-b,2n*a),part=R(s.outside,2n*a);
  const roots=[E(center,R(-part.n,part.d),s.inside),E(center,part,s.inside)];
  if(eEqual(roots[0],roots[1]))roots.pop();
  return {kind:'finite',roots,p,D,a,b,c};
}
export function verifyRoots(solved,attempt){
  const q=attempt.trim().toLowerCase().replaceAll('х','x');
  if(solved.kind==='none')return /^(?:нет решений|решений нет|∅)$/.test(q)?{status:'correct',text:'Верно: решений нет.'}:{status:'incorrect',text:'Проверь существование корней и ограничения исходного уравнения.'};
  if(solved.kind==='all')return /^(?:любое x|любое число|все действительные числа|любое действительное число|r|ℝ)$/.test(q)?{status:'correct',text:'Верно: подходит любое действительное число.'}:{status:'incorrect',text:'Проверь, остаётся ли ограничение на x после преобразования.'};
  try {const values=q.split(';').map(parseExact);if(values.length>4)throw Error('ROOT_COUNT');const unique=values.filter((v,i)=>!values.slice(0,i).some(x=>eEqual(x,v)));const correct=unique.length===solved.roots.length&&unique.every(x=>solved.roots.some(y=>eEqual(x,y)));return {status:correct?'correct':'incorrect',text:correct?'Все корни указаны верно.':'Проверь каждый корень и не потерял ли ты другие решения.'};}
  catch{return {status:'unsupported',text:'Укажи корни через точку с запятой. Для точного корня можно написать (1+√5)/2.'};}
}
