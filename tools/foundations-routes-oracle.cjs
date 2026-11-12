'use strict';
// Independent exact rational oracle: reads the mathematical relation from the
// condition witness, not a copied expected-answer index or runtime comparator.
function gcd(a,b){a=a<0n?-a:a;b=b<0n?-b:b;while(b){const r=a%b;a=b;b=r;}return a||1n;}
function R(n,d=1n){if(!d)throw Error('zero denominator');if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return[n/g,d/g];}
function literal(x){if(typeof x==='number'){if(!Number.isSafeInteger(x))throw Error('non-integer numeric leaf '+x);return R(BigInt(x));}
 if(typeof x!=='string')throw Error('invalid exact leaf '+x);
 const value=x.trim().replace(/−/g,'-').replace(/,/g,'.'),parts=value.split('/');
 if(parts.length===2){const a=literal(parts[0]),b=literal(parts[1]);return R(a[0]*b[1],a[1]*b[0]);}
 const mixed=value.match(/^(-?)(\d+)\s+(\d+)\/(\d+)$/);if(mixed)return R((mixed[1]? -1n:1n)*(BigInt(mixed[2])*BigInt(mixed[4])+BigInt(mixed[3])),BigInt(mixed[4]));
 const m=value.match(/^([+-]?)(\d*)(?:\.(\d+))?$/);if(!m||!(m[2]||m[3]))throw Error('invalid exact number '+x);return R(BigInt((m[1]==='-'?'-':'')+(m[2]||'0')+(m[3]||'')),10n**BigInt((m[3]||'').length));}
const add=(a,b)=>R(a[0]*b[1]+b[0]*a[1],a[1]*b[1]),neg=a=>[-a[0],a[1]],mul=(a,b)=>R(a[0]*b[0],a[1]*b[1]),div=(a,b)=>R(a[0]*b[1],a[1]*b[0]);
const eq=(a,b)=>a[0]*b[1]===b[0]*a[1],cmp=(a,b)=>a[0]*b[1]<b[0]*a[1]?-1:a[0]*b[1]>b[0]*a[1]?1:0;
function floor(a){return R(a[0]>=0n?a[0]/a[1]:-((-a[0]+a[1]-1n)/a[1]));}
function integer(a){if(a[1]!==1n)throw Error('integer expected');return a[0];}
function evaluate(expr){
 if(!Array.isArray(expr))return literal(expr);
 const [op,...raw]=expr,a=raw.map(evaluate);
 switch(op){
 case'add':return a.reduce(add,R(0n));case'sub':return add(a[0],neg(a[1]));case'mul':return a.reduce(mul,R(1n));case'div':return div(a[0],a[1]);case'neg':return neg(a[0]);case'abs':return R(a[0][0]<0n?-a[0][0]:a[0][0],a[0][1]);
 case'pow':{const p=integer(a[1]);if(p>30n||p< -30n)throw Error('power bounds');return p>=0n?R(a[0][0]**p,a[0][1]**p):R(a[0][1]**(-p),a[0][0]**(-p));}
 case'cmp':return R(BigInt(cmp(a[0],a[1])));
 case'floor':return floor(a[0]);case'ceil':return neg(floor(neg(a[0])));
 case'mod':return add(a[0],neg(mul(a[1],floor(div(a[0],a[1])))));
 case'min':return a.reduce((x,y)=>cmp(x,y)<=0?x:y);case'max':return a.reduce((x,y)=>cmp(x,y)>=0?x:y);
 case'gcd':return R(a.map(integer).reduce((x,y)=>gcd(x,y)));
 case'lcm':return R(a.map(integer).reduce((x,y)=>{const z=x*y/gcd(x,y);return z<0n?-z:z;}));
 case'round':{const places=a[1]?integer(a[1]):0n;if(places>12n||places< -12n)throw Error('round places');const scale=places>=0n?R(10n**places):R(1n,10n**(-places));return div(floor(add(mul(a[0],scale),R(1n,2n))),scale);}
 case'prefix':{const n=integer(a[0]),d=integer(a[1]);if(n<d||d<=0n)throw Error('prefix bounds');let p=0n;for(const c of String(n)){p=p*10n+BigInt(c);if(p>=d)return R(p);}throw Error('prefix not found');}
 default:throw Error('Unknown oracle operator '+op);
 }
}
function sqrtInt(n){if(n<0n)throw Error('negative root');if(n<2n)return n;let x=n,y=(x+1n)/2n;while(y<x){x=y;y=(x+n/x)/2n;}if(x*x!==n)throw Error('non-square root');return x;}
function expected(q){
 const o=q.oracle;if(!o)throw Error('Missing oracle');
 if(o.kind==='expression'||o.kind==='choice-expression')return evaluate(o.expr);
 if(o.kind==='linear')return div(add(evaluate(o.c),neg(evaluate(o.b))),evaluate(o.a));
 if(o.kind==='square-root'){const n=evaluate(o.radicand);return R(sqrtInt(n[0]),sqrtInt(n[1]));}
 if(o.kind==='floor-division')return floor(div(evaluate(o.dividend),evaluate(o.divisor)));
 if(o.kind==='table-stat'){const a=o.values.map(evaluate);if(o.operation==='cell')return a[o.index];if(o.operation==='max')return a.reduce((x,y)=>cmp(x,y)>=0?x:y);if(o.operation==='min')return a.reduce((x,y)=>cmp(x,y)<=0?x:y);if(o.operation==='rank')return R(BigInt(1+a.filter(x=>cmp(x,a[o.index])>0).length));throw Error('table operation');}
 throw Error('Unknown oracle kind '+o.kind);
}
function geometryValid(oracle,choice){
 const sameLetters=(a,b)=>[...a].sort().join('')===[...b].sort().join('');
 const shared=sides=>{const common=[...sides[0]].filter(c=>sides[1].includes(c));if(common.length!==1)throw Error('Bad side condition');return common[0];};
 const angles=String(choice).match(/[A-Z]{3}/g)||[];
 if(oracle.rule==='angle-vertex')return choice===oracle.name[1];
 if(oracle.rule==='sas-included-angle'){const groups=[oracle.sidesA,oracle.sidesB];return angles.length===2&&groups.every((sides,i)=>angles[i][1]===shared(sides)&&sameLetters(angles[i],[...new Set(sides.join(''))].join('')));}
 if(oracle.rule==='isosceles-base-angles'){const apex=shared(oracle.equalSides),base=[...oracle.triangle].filter(c=>c!==apex);return angles.length===2&&angles.every(a=>sameLetters(a,oracle.triangle))&&sameLetters(angles.map(a=>a[1]).join(''),base.join(''));}
 if(oracle.rule==='common-segment'){const match=choice.match(/^\s*([A-Z]{2})\s*=\s*([A-Z]{2})\s*$/);return !!match&&sameLetters(match[1],oracle.segment)&&sameLetters(match[2],oracle.segment);}
 throw Error('Unknown geometry fact '+oracle.rule);
}
function verify(q){
 if(q.oracle?.kind==='geometry-fact'){const matches=q.choices.filter(choice=>geometryValid(q.oracle,choice));if(matches.length!==1||matches[0]!==q.answer)throw Error('Ambiguous geometry choice '+q.id);return true;}
 const result=expected(q);
 if(q.input==='number'){if(!eq(literal(String(q.answer)),result))throw Error('Incorrect answer '+q.id+' expected '+result.join('/')+' got '+q.answer);}
 else if(q.oracle.kind==='choice-expression'){
  const values=q.oracle.values;if(!Array.isArray(values)||values.length!==q.choices.length)throw Error('Choice witnesses '+q.id);
  const matches=values.map((v,i)=>eq(evaluate(v),result)?i:-1).filter(i=>i>=0);
  if(matches.length!==1||q.choices[matches[0]]!==q.answer)throw Error('Ambiguous/incorrect choice '+q.id);
 }else throw Error('Choice without independent witness '+q.id);
 return true;
}
module.exports={evaluate,verify,expected,literal,eq,R};
