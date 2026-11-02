// Bounded exact rational/polynomial arithmetic. No eval or dynamic code.
export const abs = n => n < 0n ? -n : n;
export function gcd(a, b) { a = abs(a); b = abs(b); while (b) [a, b] = [b, a % b]; return a; }
export function R(n, d = 1n) {
  n = BigInt(n); d = BigInt(d); if (!d) throw Error('ZERO_DENOMINATOR');
  if (d < 0n) { n = -n; d = -d; } const g = gcd(n, d); n /= g; d /= g;
  if (abs(n) > 10n ** 30n || d > 10n ** 30n) throw Error('ARITHMETIC_LIMIT');
  return { n, d };
}
export const add = (a, b) => R(a.n*b.d+b.n*a.d, a.d*b.d);
export const neg = a => R(-a.n, a.d);
export const sub = (a, b) => add(a, neg(b));
export const mul = (a, b) => R(a.n*b.n, a.d*b.d);
export const div = (a, b) => R(a.n*b.d, a.d*b.n);
export const eq = (a, b) => a.n*b.d === b.n*a.d;
export const compare = (a, b) => a.n*b.d < b.n*a.d ? -1 : eq(a, b) ? 0 : 1;
export const text = a => a.d === 1n ? String(a.n) : `${a.n}/${a.d}`;
export function decimal(s) {
  if (!/^[+-]?\d{1,6}(?:[.,]\d{1,6})?$/.test(s)) throw Error('NUMBER_LIMIT');
  const sign = s.startsWith('-') ? -1n : 1n, [a, b = ''] = s.replace(/^[+-]/, '').replace(',', '.').split('.');
  return R(sign*BigInt(a+b), 10n ** BigInt(b.length));
}
const trim = p => { while (p.length > 1 && p.at(-1).n === 0n) p.pop(); return p; };
export const constant = value => [value];
export function pAdd(a, b) { return trim(Array.from({ length: Math.max(a.length, b.length) }, (_, i) => add(a[i] || R(0), b[i] || R(0)))); }
export function pNeg(p) { return p.map(neg); }
export function pMul(a, b) {
  if (a.length+b.length-2 > 4) throw Error('DEGREE_LIMIT');
  const p = Array.from({ length: a.length+b.length-1 }, () => R(0));
  for (let i=0;i<a.length;i++) for (let j=0;j<b.length;j++) p[i+j] = add(p[i+j], mul(a[i], b[j]));
  return trim(p);
}
export function pEqual(a, b) { return a.length === b.length && a.every((v,i) => eq(v,b[i])); }
export function pAt(p, x) { return p.reduceRight((v, c) => add(mul(v,x),c), R(0)); }
export function pText(p) {
  const terms=[];
  for(let i=p.length-1;i>=0;i--) if(p[i].n) {
    const a=R(abs(p[i].n),p[i].d), sign=p[i].n<0n?'-':terms.length?'+':'';
    const c=i&&eq(a,R(1))?'':a.d===1n?text(a):`(${text(a)})`;
    terms.push(sign+c+(i?'x'+(i>1?`^${i}`:''):''));
  }
  return terms.join('')||'0';
}
export function normalizeExpression(value) {
  if(typeof value!=='string'||value.length>300||/[\r\n]/.test(value))throw Error('EXPRESSION_LIMIT');
  let q=value.trim().replace(/[−–—]/g,'-').replace(/[×·]/g,'*').replaceAll('÷','/').replaceAll('х','x').replaceAll('²','^2').replaceAll('³','^3');
  q=q.replace(/(^|[^\d.,])([+-]?)(\d{1,6})\s+(\d{1,6})\s*\/\s*(\d{1,6})(?!\d)/g,(_m,before,sign,w,n,d)=>{
    if(!BigInt(d)||BigInt(n)>=BigInt(d))throw Error('MIXED_NUMBER_INVALID');
    return `${before}${sign}(${w}+${n}/${d})`;
  });
  if(/\d\s+\d/.test(q)||/\d\s*\/\s*\d\s*x/.test(q))throw Error('AMBIGUOUS_EXPRESSION');
  return q;
}
export function polynomial(value, { variables = true } = {}) {
  const q=normalizeExpression(value), tokens=[]; let i=0;
  while(i<q.length){if(/\s/.test(q[i])){i++;continue;} const m=/^(?:\d+(?:[.,]\d+)?|[x()+*/^\-])/.exec(q.slice(i));if(!m)throw Error('SYNTAX');tokens.push(m[0]);i+=m[0].length;}
  if(!tokens.length||tokens.length>100)throw Error('TOKEN_LIMIT');
  let at=0,depth=0; const trace=[];
  const record=(a,op,b,r)=>{if(a.length===1&&b.length===1&&r.length===1)trace.push(`${a[0].n<0n?'('+text(a[0])+')':text(a[0])} ${op} ${b[0].n<0n?'('+text(b[0])+')':text(b[0])} = ${text(r[0])}`);return r;};
  function atom(){const t=tokens[at++];if(t==='('){if(++depth>10)throw Error('DEPTH_LIMIT');const v=sum();if(tokens[at++]!==')')throw Error('PARENTHESIS');depth--;return v;}if(t==='x'&&variables)return [R(0),R(1)];if(t&&/^\d/.test(t))return [decimal(t)];throw Error('ATOM');}
  function power(){let v=atom();if(tokens[at]==='^'){at++;const exponent=unary();if(exponent.length!==1||exponent[0].d!==1n||abs(exponent[0].n)>12n)throw Error('EXPONENT_LIMIT');const n=Number(exponent[0].n);if(n===0&&(v.length>1||v[0].n===0n))throw Error('ZERO_POWER_ZERO');let out=[R(1)];if(n<0&&v.length!==1)throw Error('VARIABLE_DENOMINATOR');for(let j=0;j<Math.abs(n);j++)out=pMul(out,v);if(n<0)out=[div(R(1),out[0])];v=record(v,'^',exponent,out);}return v;}
  function unary(){if(tokens[at]==='+'||tokens[at]==='-'){const sign=tokens[at++];const v=unary();return sign==='-'?pNeg(v):v;}return power();}
  function product(){let v=unary();while(at<tokens.length){const t=tokens[at], implicit=t==='('||t==='x';if(!['*','/'].includes(t)&&!implicit)break;if(!implicit)at++;const b=unary();let out;if(t==='/'&&!implicit){if(b.length!==1)throw Error('VARIABLE_DENOMINATOR');out=v.map(c=>div(c,b[0]));}else out=pMul(v,b);v=record(v,t==='/'?'/':'*',b,out);}return v;}
  function sum(){let v=product();while(['+','-'].includes(tokens[at])){const op=tokens[at++],b=product();const out=pAdd(v,op==='-'?pNeg(b):b);v=record(v,op,b,out);}return v;}
  const p=sum();if(at!==tokens.length)throw Error('TRAILING_TOKENS');return { p, trace };
}
export function numeric(q) { const {p,trace}=polynomial(q,{variables:false});if(p.length!==1)throw Error('NOT_NUMERIC');return {value:p[0],trace}; }
export function rounded(value, places) {
  if(!Number.isInteger(places)||places<0||places>6)throw Error('ROUND_LIMIT');
  const scale=10n**BigInt(places), numerator=abs(value.n)*scale, whole=numerator/value.d, rest=numerator%value.d;
  return R((whole+(rest*2n>=value.d?1n:0n))*(value.n<0n?-1n:1n),scale);
}
export function sqrtInteger(n) {
  if(n<0n||n>1000000000000n)throw Error('ROOT_LIMIT');
  let lo=0n,hi=n+1n;while(hi-lo>1n){const mid=(lo+hi)/2n;if(mid*mid<=n)lo=mid;else hi=mid;}return lo;
}
