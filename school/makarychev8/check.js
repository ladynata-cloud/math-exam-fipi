/* Safe answer checking: exact rational numbers, unordered root sets, explicit symbolic forms. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('../peterson6/math.js'):root.PetersonMath,typeof module==='object'&&module.exports?require('./task-graphs.js'):root.MakarychevTaskGraphs);if(typeof module==='object'&&module.exports)module.exports=api;else root.MakarychevCheck=api;})(typeof globalThis!=='undefined'?globalThis:this,function(M,G){
'use strict';
function normalize(value){return String(value??'').trim().toLowerCase()
 // Keep legacy whitespace-tolerant sqrt aliases valid when rechecking saved work.
 .replace(/\s+/g,'')
 .replace(/(?:sqrt|корень)\s*\(/g,'√(')
 .replace(/[−–—]/g,'-').replace(/[×·⋅]/g,'*').replace(/√\((\d+(?:[.,]\d+)?|[a-zа-я])\)(?![\d.,])/g,'√$1')
 .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g,s=>'^'+Array.from(s,c=>'⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)).join(''))
 .replace(/≤/g,'<=').replace(/≥/g,'>=').replace(/≠/g,'!=')
 .replace(/([0-9a-zа-я)])\*(?=[a-zа-я(√])/g,'$1').replace(/∈/g,'in').replace(/\bpi\b/g,'π')
 .replace(/([0-9]),(?=[0-9])/g,'$1.').replace(/[х]/g,'x');}
// Work with integer-coefficient polynomials in a fraction. Keeping its denominator
// lets the checker reject extra variable factors and lost domain restrictions.
function polynomialFraction(raw, symbols) {
 if(raw.length>120||/[^0-9.a-z()+*/^\-]/.test(raw))throw RangeError();
 const constant=value=>new Map(value===0n?[]:[['',value]]);
 let remaining=5000;
 function term(poly,word,value){
  if(--remaining<0||word.length>40||poly.size>80)throw RangeError();
  value=(poly.get(word)||0n)+value;
  if(value>2n**350n||value<-(2n**350n))throw RangeError();
  if(value)poly.set(word,value);else poly.delete(word);
 }
 function mul(a,b){
  const out=new Map();
  for(const [u,v] of a)for(const [w,x] of b)term(out,[...u,...w].sort().join(''),v*x);
  return out;
 }
 function add(a,b,sign){const out=new Map(a);for(const [k,v] of b)term(out,k,sign*v);return out;}
 function parse(raw){
  const tokens=raw.match(/\d+(?:\.\d+)?|[a-z]|[()+*/^\-]/g)||[];
  if(tokens.join('')!==raw||tokens.length>100)throw Error();
  let i=0;
  const one=()=>constant(1n);
  function factor(){
   let v=tokens[i++],result;
   if(v==='('){result=sum();if(tokens[i++]!==')')throw Error();}
   else if(symbols.has(v))result=[new Map([[v,1n]]),one()];
   else if(v&&/^\d+(?:\.\d+)?$/.test(v)&&v.length<=15){
    const decimals=(v.split('.')[1]||'').length;result=[constant(BigInt(v.replace('.',''))),constant(10n**BigInt(decimals))];
   }else throw Error();
   if(tokens[i]==='^'){
    i++;v=tokens[i++];if(!v||!/^\d{1,2}$/.test(v)||Number(v)>24)throw Error();
    const base=result; result=[one(),one()];
    for(let k=0;k<Number(v);k++)result=[mul(result[0],base[0]),mul(result[1],base[1])];
   }
   return result;
  }
  function unary(){
   if(tokens[i]==='-'){i++;const [n,d]=unary();return [mul(n,constant(-1n)),d];}
   if(tokens[i]==='+'){i++;return unary();}
   return factor();
  }
  function product(){
   let [n,d]=unary();
   while(i<tokens.length){
    const token=tokens[i],implicit=token==='('||symbols.has(token);
    if(!implicit&&token!=='*'&&token!=='/')break;
    if(!implicit)i++;
    const [x,y]=unary();
    if(token==='/'&&!x.size)throw Error();
    if(token==='/'&&y.size!==1)throw Error();
    if(token==='/'&&!y.has(''))throw Error();
    [n,d]=token==='/'?[mul(n,y),mul(d,x)]:[mul(n,x),mul(d,y)];
   }
   return [n,d];
  }
  function sum(){
   let [n,d]=product();
   while(['+','-'].includes(tokens[i])){
    const sign=tokens[i++]==='+'?1n:-1n,[x,y]=product();
    [n,d]=[add(mul(n,y),mul(x,d),sign),mul(d,y)];
   }
   return [n,d];
  }
  const pair=sum();if(i!==tokens.length||!pair[1].size)throw Error();return pair;
 }
 return parse(raw);
}
function sameReducedExpression(input, expected) {
 try{
  const symbols=new Set(String(expected).match(/[a-z]/g)||[]);
  const [n1,d1]=polynomialFraction(normalize(input),symbols),[n2,d2]=polynomialFraction(normalize(expected),symbols);
  if(n1.size!==n2.size||d1.size!==d2.size)return false;
  const [pivot,q2]=d2.entries().next().value,q1=d1.get(pivot);if(!q1)return false;
  return [[n1,n2],[d1,d2]].every(([left,right])=>
   [...right].every(([key,value])=>left.has(key)&&left.get(key)*q2===value*q1));
 }catch(_){return false;}
}
// Coefficients ascend by degree. Positive normalization preserves the signs in
// Sturm's sequence, including when the polynomial has repeated real roots.
function primitive(coefficients){
 while(coefficients.length&&coefficients.at(-1)===0n)coefficients.pop();
 let gcd=0n;
 for(let x of coefficients){
  x=x<0n?-x:x;
  while(x){[gcd,x]=[x,gcd%x];}
 }
 return gcd>1n?coefficients.map(v=>v/gcd):coefficients;
}
function realRootCount(coefficients){
 if(coefficients.length<2)return 0;
 const sequence=[primitive([...coefficients]),primitive(coefficients.slice(1).map((c,i)=>c*BigInt(i+1)))];
 while(sequence.at(-1).length>1){
  let rest=[...sequence.at(-2)];
  const divisor=sequence.at(-1),lead=divisor.at(-1),sign=lead<0n?-1n:1n;
  while(rest.length>=divisor.length){
   const shift=rest.length-divisor.length,top=rest.at(-1);
   rest=primitive(rest.map((c,i)=>sign*(lead*c-(i>=shift?top*divisor[i-shift]:0n))));
  }
  if(!rest.length)break;
  sequence.push(rest.map(c=>-c));
 }
 function variations(negative){
  let previous=0,changes=0;
  for(const poly of sequence){
   const sign=(poly.at(-1)>0n?1:-1)*(negative&&(poly.length-1)%2?-1:1);
   if(previous&&previous!==sign)changes++;
   previous=sign;
  }
  return changes;
 }
 return variations(true)-variations(false);
}
function evaluateAt(coefficients, point){
 const rational=M.parse(point),n=BigInt(rational.n),d=BigInt(rational.d);
 let value=0n,power=1n;
 for(let i=coefficients.length-1;i>=0;i--){value=value*n+coefficients[i]*power;power*=d;}
 return value;
}
function inspectDomainFraction(input, exclusions){
 // A single fraction of polynomials. Coefficients may be fractions or decimals.
 let raw=normalize(input);
 if(!raw||raw.length>120)return {status:'format'};
 const stripOuter=text=>{
  while(text[0]==='('&&text.at(-1)===')'){
   let depth=0,end=0;
   for(;end<text.length;end++){
    if(text[end]==='(')depth++;
    if(text[end]===')'&&--depth===0)break;
   }
   if(end!==text.length-1)break;
   text=text.slice(1,-1);
  }
  return text;
 };
 raw=stripOuter(raw);
 let depth=0,division=-1;
 for(let i=0;i<raw.length;i++){
  if(raw[i]==='(')depth++;
  else if(raw[i]===')')depth--;
  else if(raw[i]==='/'&&!depth){if(division>=0)return {status:'format'};division=i;}
  if(depth<0)return {status:'format'};
 }
 if(depth||division<1||division===raw.length-1)return {status:'format'};
 const numeratorText=raw.slice(0,division),denominatorText=raw.slice(division+1);
 // Match ordinary operator precedence: 1/x-2 must never stand for 1/(x-2).
 if(stripOuter(denominatorText)===denominatorText&&!/^[+-]?(?:x(?:\^\d+)?|\d+(?:\.\d+)?)$/.test(denominatorText))return {status:'format'};
 depth=0;
 for(let i=0;i<numeratorText.length;i++){
  if(numeratorText[i]==='(')depth++;
  else if(numeratorText[i]===')')depth--;
  else if(!depth&&i&&/[+-]/.test(numeratorText[i]))return {status:'format'};
 }
 try{
  const symbols=new Set(['x']);
  function coefficients(part){
   const [poly,scale]=polynomialFraction(part,symbols);
   if(!scale.has('')||scale.size!==1)throw Error();
   const result=[];
   for(const [key,value] of poly)result[key.length]=value;
   return Array.from(result,v=>v||0n);
  }
  coefficients(numeratorText);
  const denominator=coefficients(denominatorText);
  if(!denominator.length)return {status:'zero'};
  const zeros=exclusions.map(point=>evaluateAt(denominator,point)===0n);
  const count=realRootCount(denominator);
  return {status:zeros.includes(false)?'missing':count>exclusions.length?'extra':'correct',zeros,count};
 }catch(_){return {status:'format'};}
}
function equivalentCommonFactor(input, expected){
 try{
  const symbols=new Set(normalize(expected).match(/[a-z]/g)||[]);
  const [candidate,d1]=polynomialFraction(normalize(input),symbols),[factor,d2]=polynomialFraction(normalize(expected),symbols);
  if(d1.size!==1||!d1.has('')||d2.size!==1||!d2.has('')||candidate.size!==factor.size)return false;
  const [pivot,reference]=factor.entries().next().value,scale=candidate.get(pivot);
  return Boolean(scale)&&[...factor].every(([key,v])=>candidate.has(key)&&candidate.get(key)*reference===scale*v);
 }catch(_){return false;}
}
function proofOrder(value, count){
 const raw=String(value).trim();
 if(!raw)return [];
 const tokens=raw.split(/\s*(?:;|,|→|->)\s*|\s+/);
 if(tokens.some(token=>!/^\d+$/.test(token)))return null;
 const order=tokens.map(Number);
 return order.some(n=>n<1||n>count)||new Set(order).size!==order.length?null:order;
}
function separatedRational(input, expected){
 const raw=normalize(input);
 let depth=0;
 for(let i=0;i<raw.length;i++){
  if(raw[i]==='(')depth++;
  else if(raw[i]===')')depth--;
  else if(i&&!depth&&(raw[i]==='+'||raw[i]==='-'))return sameReducedExpression(raw,expected);
 }
 return false;
}
// A real rational multiple of one square root is determined by its sign and square.
// Use exact integers so a rounded decimal cannot stand in for an irrational root.
function signedSquare(raw){
 const input=normalize(raw);
 function result(coef,rad,divisor,inverse){
  if(!coef||!rad||!divisor||rad.n<0||!divisor.n||inverse&&!rad.n)return null;
  const n=BigInt(coef.n)*BigInt(divisor.d),d=BigInt(coef.d)*BigInt(divisor.n);
  const rn=BigInt(inverse?rad.d:rad.n),rd=BigInt(inverse?rad.n:rad.d);
  return {sign:n===0n||rn===0n?0:(n<0n)!==(d<0n)?-1:1,n:n*n*rn,d:d*d*rd};
 }
 const unit=M.parse('1'),ordinary=M.parse(raw);
 if(ordinary)return result(ordinary,unit,unit,false);
 if(!input.includes('√')||input.length>80)return null;
 // Outside parentheses the slash after a radical divides the entire product.
 const decimal='(?:[0-9]+(?:\\.[0-9]+)?|\\.[0-9]+)';
 const atom='(?:\\('+decimal+'(?:/'+decimal+')?\\)|'+decimal+')';
 const match=new RegExp('^([+-]?)(?:('+decimal+'(?:/'+decimal+')?)(\\*|/)?)?√('+atom+')(?:/('+decimal+'))?$').exec(input);
 if(!match)return null;
 const [,sign,coefficient,operation,radius,divisor]=match;
 return result(M.parse((sign==='-'?'-':'')+(coefficient||'1')),M.parse(radius.replace(/[()]/g,'')),M.parse(divisor||'1'),operation==='/');
}
function sameReal(a,b){
 const x=signedSquare(a),y=signedSquare(b);
 return Boolean(x&&y&&x.sign===y.sign&&x.n*y.d===y.n*x.d);
}
// Compare sums of rational multiples of square roots without rounding them.
// Two terms combine exactly when the ratio of their squared magnitudes is
// the square of a rational number. This also recognises unsimplified radicals.
function radicalSum(raw){
 if(typeof raw!=='string'||raw.length>160)return null;
 const ordinary=signedSquare(raw);if(ordinary)return [ordinary];
 let input=normalize(raw),scale=M.parse('1'),depth=0;
 // A common denominator, e.g. (3 − √29)/2, scales every numerator term.
 if(input[0]==='('){
  for(let i=0;i<input.length;i++){
   if(input[i]==='(')depth++;else if(input[i]===')')depth--;
   if(depth<0)return null;
   if(!depth){
    const suffix=input.slice(i+1);
    if(!suffix||suffix[0]==='/'){
     if(suffix){scale=M.parse(suffix.slice(1));if(!scale||!scale.n)return null;}
     input=input.slice(1,i);
    }
    break;
   }
  }
 }
 const pieces=[];let start=0;depth=0;
 for(let i=0;i<input.length;i++){
  const c=input[i];
  if(c==='(')depth++;else if(c===')')depth--;
  if(depth<0)return null;
  if(i>start&&!depth&&(c==='+'||c==='-')&&input[i-1]!=='/'){
   pieces.push(input.slice(start,i));start=i;
  }
 }
 if(depth||!input.length)return null;
 pieces.push(input.slice(start));if(pieces.length>9)return null;
 const multiplier=BigInt(scale.d),denominator=BigInt(scale.n);
 const values=pieces.map(part=>signedSquare(part.replace(/^\+/,'')));
 if(values.some(v=>!v))return null;
 return values.map(v=>({sign:v.sign*Math.sign(scale.n),n:v.n*multiplier*multiplier,d:v.d*denominator*denominator}));
}
function gcdInteger(a,b){while(b){const r=a%b;a=b;b=r;}return a<0n?-a:a;}
function integerRoot(n){
 if(n<2n)return n;
 let x=n,next=(x+1n)/2n;while(next<x){x=next;next=(x+n/x)/2n;}
 return x*x===n?x:null;
}
function sameRadicalSum(left,right){
 return sameRadicalTerms(radicalSum(left),radicalSum(right));
}
function sameRadicalTerms(a,b){
 if(!a||!b)return false;
 const pending=[...a,...b.map(v=>({...v,sign:-v.sign}))].filter(v=>v.sign);
 while(pending.length){
  const pivot=pending.pop();let sum=BigInt(pivot.sign),den=1n;
  for(let i=pending.length-1;i>=0;i--){
   const candidate=pending[i];
   let top=candidate.n*pivot.d,bottom=candidate.d*pivot.n;
   const g=gcdInteger(top,bottom);top=integerRoot(top/g);bottom=integerRoot(bottom/g);
   if(top===null||bottom===null)continue;
   sum=sum*bottom+BigInt(candidate.sign)*top*den;den*=bottom;
   const divisor=gcdInteger(sum,den);sum/=divisor;den/=divisor;pending.splice(i,1);
  }
  if(sum!==0n)return false;
 }
 return true;
}
function reducedRadicals(raw,expected){
 const v=normalize(raw);
 const radicands=v=>[...normalize(v).matchAll(/√(\d+)/g)].map(m=>m[1]).sort().join(';');
 if(radicands(v)!==radicands(expected)||/^\(.+\)\//.test(v))return false;
 const terms=radicalSum(raw),correct=radicalSum(expected);
 if(!terms||terms.length!==correct.length)return false;
 const pending=[...correct];
 for(const term of terms){
  const i=pending.findIndex(t=>term.sign===t.sign&&term.n*t.d===t.n*term.d);
  if(i<0)return false;pending.splice(i,1);
 }
 return true;
}
function quadraticEntries(raw){
 const text=String(raw).trim();if(/^(нет|неткорней|корнейнет|пусто|∅|\{\})$/.test(normalize(text)))return [];
 const wrapped=text[0]==='{'&&text.endsWith('}')?text.slice(1,-1):text;
 const parts=wrapped.replace(/\+\/-/g,'±').split(';').map(s=>s.trim());
 if(parts.length>2||parts.some(s=>!s||s.length>160))return null;
 if(parts.length===1&&parts[0].includes('±')){
  if(parts[0].split('±').length!==2)return null;
  const pair=[parts[0].replace('±','-'),parts[0].replace('±','+')];
  return pair.every(radicalSum)?pair:null;
 }
 return parts.every(radicalSum)?parts:null;
}
function sameQuadraticRoots(raw,expected){
 const a=quadraticEntries(raw),b=quadraticEntries(expected);
 return Boolean(a&&b&&a.length===b.length&&(a.every((v,i)=>sameRadicalSum(v,b[i]))||
   (a.length===2&&sameRadicalSum(a[0],b[1])&&sameRadicalSum(a[1],b[0]))));
}

function setEntries(value){
 let body=String(value).trim();
 if(body.startsWith('{')&&body.endsWith('}'))body=body.slice(1,-1);
 if(/[{}]/.test(body))return null;
 const entries=[];
 for(const token of body.split(';')){
  const term=token.trim().replace(/[−–—]/g,'-').replace(/^([+-])\s+/,'$1');
  if(!term)continue;
  const pair=/^(?:±|\+\/-)\s*(.*)$/.exec(term);
  if(!pair){entries.push(term);continue;}
  const magnitude=M.parse(pair[1]);
  if(!magnitude){
   const radical=signedSquare(pair[1]);if(!radical)return null;
   const unsigned=pair[1].trim().replace(/^[+−–—-]/,'');
   entries.push(unsigned);if(radical.sign)entries.push('-'+unsigned);
   continue;
  }
  entries.push(M.answer(magnitude));
  if(magnitude.n!==0)entries.push(M.answer({n:-magnitude.n,d:magnitude.d}));
 }
 return entries.length?entries:null;
}
function setEqual(user,expected){
 const empty=s=>/^(нет|неткорней|корнейнет|пусто|∅|\{\})$/.test(normalize(s));
 if(empty(user)||empty(expected))return empty(user)&&empty(expected);
 const a=setEntries(user),b=setEntries(expected);if(!a||!b||a.length!==b.length)return false;
 const used=new Set();return a.every(x=>{const i=b.findIndex((y,j)=>!used.has(j)&&(normalize(x)===normalize(y)||sameReal(x,y)));if(i<0)return false;used.add(i);return true;});
}
function squareInteger(n){
 n=BigInt(n);if(n<0n)return false;if(n<2n)return true;
 let x=n,y=(x+1n)/2n;while(y<x){x=y;y=(x+n/x)/2n;}return x*x===n;
}
function compareRational(a,b){const delta=BigInt(a.n)*BigInt(b.d)-BigInt(b.n)*BigInt(a.d);return delta<0n?-1:delta>0n?1:0;}
function intervalExamples(user,target){
 const count=target.exampleCount,lower=M.parse(target.lower),upper=M.parse(target.upper);
 if(!Number.isInteger(count)||count<1||count>12||!lower||!upper)return false;
 const values=user.split(';').map(M.parse);if(values.length!==count||values.some(v=>!v))return false;
 return values.every((v,i)=>compareRational(v,lower)>0&&compareRational(v,upper)<0&&values.slice(0,i).every(w=>compareRational(v,w)!==0));
}
function rootLineCount(user){
 if(!G?.parseLine(user))return null;
 const [k,b]=user.split(';').map(M.parse);if(!k||!b)return null;
 const kn=BigInt(k.n),kd=BigInt(k.d),bn=BigInt(b.n),bd=BigInt(b.d);
 // With t=√x≥0, intersections correspond exactly to nonnegative roots
 // of k t²−t+b=0. Rational signs and tangency are compared with integers.
 if(kn===0n)return bn>=0n?1:0;
 const disc=kd*bd-4n*kn*bn;if(disc<0n)return 0;
 if(disc===0n)return kn>0n?1:0;
 const product=kn*bn;if(product<0n)return 1;
 if(product===0n)return kn>0n?2:1;
 return kn>0n?2:0;
}
function factoredPair(value,expected,required=2,maxDegree=1){
 if(!sameReducedExpression(value,expected))return 'different';
 const symbols=new Set(String(expected).match(/[a-z]/g)||[]);
 let s=normalize(value);
 function endGroup(start){
  let depth=0;
  for(let i=start;i<s.length;i++){
   if(s[i]==='(')depth++;
   if(s[i]===')'&&!--depth)return i;
  }
  return -1;
 }
 while(s[0]==='('&&endGroup(0)===s.length-1)s=s.slice(1,-1);
 s=s.replace(/^[+-]/,'');let count=0;
 try{
  while(s.length){
   const scalar=s.match(/^\/?\d+(?:\.\d+)?/);
   if(scalar){s=s.slice(scalar[0].length).replace(/^\*/,'');continue;}
   if(s[0]!=='(')return 'expanded';
   const end=endGroup(0);if(end<0)return 'expanded';
   const [n,d]=polynomialFraction(s.slice(1,end),symbols);
   if(!d.has('')||d.size!==1||[...n.keys()].some(k=>k.length>maxDegree))return 'expanded';
   const nonconstant=[...n.keys()].some(k=>k.length>0);s=s.slice(end+1);
   const power=s.match(/^\^(\d+)/);if(power)s=s.slice(power[0].length);
   if(nonconstant)count+=power?Number(power[1]):1;
   s=s.replace(/^\*/,'');
  }
 }catch(_){return 'expanded';}
 return count===required?'factored':'expanded';
}
function absLineIntersections(raw){
 const fields=String(raw).split(';').map(x=>M.parse(x));
 if(fields.length!==2||fields.some(v=>!v))return null;
 const [k,b]=fields,kn=BigInt(k.n),kd=BigInt(k.d),bn=BigInt(b.n),bd=BigInt(b.d);
 const intercept=kn!==0n&&bn*kd===3n*kn*bd;
 const points=[],slope=k.n/k.d,offset=b.n/b.d;
 let coincident=false;
 for(const sign of [1n,-1n]){
  const denominator=bd*(sign*kd-kn),numerator=bn*kd;
  if(!denominator){if(!numerator)coincident=true;continue;}
  if(sign*numerator*denominator<0n)continue;
  const x=Number(numerator)/Number(denominator);
  if(!points.some(p=>p[0]===x))points.push([x,Math.abs(x)]);
 }
 return {k:slope,b:offset,intercept,count:coincident?Infinity:points.length,points};
}
function reciprocalIntersections(raw){
 const fields=String(raw).split(';');if(fields.length!==2)return null;
 const [slope,intercept]=fields.map(v=>M.parse(v));if(!slope||!intercept)return null;
 const an=BigInt(slope.n),ad=BigInt(slope.d),bn=BigInt(intercept.n),bd=BigInt(intercept.d);
 const numerator=bn*bn*ad+4n*an*bd*bd;
 const count=an===0n?(bn===0n?0:1):numerator<0n?0:numerator===0n?1:2;
 return {a:slope.n/slope.d,b:intercept.n/intercept.d,count,discriminant:Number(numerator)/Number(ad*bd*bd)};
}
function classifyRationalCandidates(value,excluded,answers){
 const entries=quadraticEntries(value);if(!entries)return null;
 const banned=excluded==='нет'?[]:excluded.split(';'),solutions=quadraticEntries(answers)||[];
 return entries.map(term=>({term,status:banned.some(x=>sameRadicalSum(x,term))?'excluded':solutions.some(x=>sameRadicalSum(x,term))?'correct':'different'}));
}

function pointGroups(input){
 const text=String(input||'').trim();
 if(!text||text.length>600)return null;
 const groups=[];
 for(const raw of text.split('|')){
  const list=[],pattern=/\(\s*([^;()]+?)\s*;\s*([^;()]+?)\s*\)/gy;
  let pos=0;const part=raw.trim();
  while(pos<part.length){
   pattern.lastIndex=pos;const m=pattern.exec(part);
   if(!m)return null;const point=m.slice(1).map(v=>M.parse(v));if(point.some(v=>!v))return null;
   list.push(point);if(list.length>6)return null;pos=pattern.lastIndex;
   if(pos<part.length){const sep=/^\s*[,;]\s*/.exec(part.slice(pos));if(!sep)return null;pos+=sep[0].length;if(pos===part.length)return null;}
  }
  if(!list.length||groups.length===2)return null;groups.push(list);
 }
 return groups;
}
function planeResponse(value,q){
 const groups=pointGroups(value);if(!groups)return 'format';
 const key=p=>p.map(v=>v.n+'/'+v.d).join(';');
 if(q.kind==='three-solutions'){
  if(groups.length!==1||groups[0].length!==3)return 'count';
  if(new Set(groups[0].map(key)).size!==3)return 'duplicate';
  for(const [i,[x,y]] of groups[0].entries()){
   const nx=BigInt(x.n),dx=BigInt(x.d),ny=BigInt(y.n),dy=BigInt(y.d);
   const sum=q.terms.reduce((s,[k,a,b])=>s+BigInt(k)*nx**BigInt(a)*ny**BigInt(b)*dx**BigInt(2-a)*dy**BigInt(2-b),0n);
   if(sum)return 'point-'+(i+1);
  }
  return 'correct';
 }
 if(groups.length!==q.lines.length||groups.some(g=>g.length!==2))return 'count';
 if(groups.some(g=>key(g[0])===key(g[1])))return 'duplicate';
 const onLine=([a,b,c],[x,y])=>{
  const A=M.parse(String(a)),B=M.parse(String(b)),C=M.parse(String(c));
  const dx=BigInt(x.d),dy=BigInt(y.d),da=BigInt(A.d),db=BigInt(B.d),dc=BigInt(C.d);
  return BigInt(A.n)*BigInt(x.n)*dy*db*dc+BigInt(B.n)*BigInt(y.n)*dx*da*dc===BigInt(C.n)*dx*dy*da*db;
 };
 const found=groups.map(g=>q.lines.findIndex(l=>g.every(p=>onLine(l,p))));
 const wrong=found.indexOf(-1);
 if(wrong!==-1)return 'branch-'+(wrong+1);
 return new Set(found).size===found.length?'correct':'same-branch';
}
function equationPlaneStatus(input,expected){
 function normalized(raw){
  const values=normalize(raw).split('=');if(values.length!==2||values.some(x=>!x))return null;
  try{
   const [n,d]=polynomialFraction('('+values[0]+')-('+values[1]+')',new Set(['x','y']));
   if(d.size!==1||!d.has(''))return null;
   return n;
  }catch(_){return null;}
 }
 const actual=normalized(input),wanted=normalized(expected);if(!actual||!wanted)return 'format';
 if(actual.size!==wanted.size||[...actual.keys()].some(k=>!wanted.has(k)))return 'different';
 const [pivot,b]=wanted.entries().next().value,a=actual.get(pivot);
 return [...wanted].every(([k,v])=>actual.get(k)*b===v*a)?'correct':'different';
}

function equationRatioStatus(input,ratios){
 const parts=String(input).split(';').map(radicalSum);
 if(parts.length!==3||parts.some(x=>!x))return 'format';
 const [a,b,c]=parts;
 if(sameRadicalTerms(a,[]))return 'leading';
 const multiple=(coeff,ratio)=>{
  const factor=signedSquare(ratio);
  return sameRadicalTerms(coeff,a.map(t=>({sign:t.sign*factor.sign,n:t.n*factor.n,d:t.d*factor.d})));
 };
 if(!multiple(b,ratios[0]))return 'linear';
 return multiple(c,ratios[1])?'correct':'constant';
}
function exampleEquationsStatus(input){
 const parts=String(input).split(';').map(v=>M.parse(v));
 if(parts.length!==4||parts.some(x=>!x))return 'format';
 if(!parts[0].n)return 'linear';
 return 'correct';
}
function progressionFactors(input){
 const pieces=String(input).split(';');
 if(pieces.length!==4||pieces.some(p=>!p.trim()))return 'format';
 const coeffs=pieces.slice(0,3).map(p=>M.parse(p));
 if(coeffs.some(v=>!v))return 'format';
 if(coeffs.some(v=>v.d!==1||v.n<=0))return 'natural';
 const [a,b,c]=coeffs.map(v=>BigInt(v.n)),sorted=[a,b,c].sort((u,v)=>u<v?-1:u>v?1:0);
 if(sorted[1]!==2n*sorted[0]||sorted[2]!==3n*sorted[0])return 'ratio';
 if(b*b-4n*a*c<0n)return 'roots';
 return factoredPair(pieces[3],a+'x^2+'+b+'x+'+c);
}

function check(user,target){
 if(typeof user!=='string'||user.length>1000||!user.trim()||!target)return false;
 const answers=[target.answer,...(target.accepts||[])].map(String);
 if(['three-solutions','construct-lines'].includes(target.kind))return planeResponse(user,target)==='correct';
 if(target.kind==='line-pair-equation')return equationPlaneStatus(user,target.answer)==='correct';
 if(target.kind==='equation-from-roots')return equationRatioStatus(user,target.ratios)==='correct';
 if(target.kind==='examples-of-equations')return exampleEquationsStatus(user)==='correct';
 if(target.kind==='abs-line-example'){const v=absLineIntersections(user);return Boolean(v?.intercept&&v.count===target.reqCount);}
 if(target.kind==='rational-line-example')return reciprocalIntersections(user)?.count===target.intersectionCount;
 if(target.kind==='progression-factor-example')return progressionFactors(user)==='factored';
 if(target.factorizedAnswer)return factoredPair(user,target.answer,target.requiredFactors||2,target.productDegree||1)==='factored';
 if(target.kind==='separated-rational')return separatedRational(user,target.answer);
 if(target.kind==='quadratic-roots')return sameQuadraticRoots(user,target.answer);
 if(target.kind==='radical-value')return sameRadicalSum(user,target.answer)&&(!target.requireSimplified||reducedRadicals(user,target.answer));
 if(target.kind==='proof-chain')return (target.proofOrders||[target.answer]).includes(proofOrder(user,target.proofClaims.length)?.join(';'));
 if(target.kind==='common-factor')return equivalentCommonFactor(user,target.answer);
 if(target.kind==='domain-fraction')return inspectDomainFraction(user,target.exclusions).status==='correct';
 if(target.kind==='incomplete-coefficients'){
  const entries=user.split(';').map(M.parse);
  if(entries.length!==3||entries.some(v=>!v)||entries[0].n===0)return false;
  return (entries[1].n!==0)===target.hasLinear&&(entries[2].n!==0)===target.hasConstant;
 }
 if(target.kind==='integer-pairs'){
  const pairs=G.parseIntegerPairs(user),expected=G.parseIntegerPairs(target.answer);
  if(!pairs||!expected||pairs.length!==expected.length)return false;
  const keys=new Set(pairs.map(pair=>pair.join(';')));
  return keys.size===expected.length&&expected.every(pair=>keys.has(pair.join(';')));
 }
 if(target.kind==='rational-example')return !!M.parse(user);
 if(target.kind==='irrational-example'){
  const value=normalize(user);if(value==='π')return true;
  const m=/^√([1-9][0-9]{0,12})$/.exec(value);return !!m&&BigInt(m[1])<=1000000000000n&&!squareInteger(m[1]);
 }
 if(target.kind==='interval-examples')return intervalExamples(user,target);
 if(target.kind==='square-equation-example'){
  const a=M.parse(user);if(!a)return false;if(target.rootType==='none')return a.n<0;
  if(a.n<=0)return false;const rational=squareInteger(a.n)&&squareInteger(a.d);
  return target.rootType==='rational'?rational:target.rootType==='irrational'?!rational:false;
 }
 if(target.kind==='graph-estimates'){
  if((target.exactAnswers||[]).some(answer=>normalize(user)===normalize(answer)||setEqual(user,answer)||sameQuadraticRoots(user,answer)))return true;
  const entries=user.split(';').map(v=>M.parse(v));
  if(entries.length!==target.rootValues.length||entries.some(v=>!v))return false;
  const values=entries.map(r=>r.n/r.d).sort((a,b)=>a-b);
  return values.every((n,i)=>Math.abs(n-target.rootValues[i])<=target.tolerance+1e-10);
 }
 if(target.kind==='line-sign-example'){
  const values=user.split(';').map(part=>M.parse(part));
  return Boolean(G?.parseLine(user)) && values.length===2 && values.every(Boolean) &&
   Math.sign(values[0].n)===target.slopeSign && Math.sign(values[1].n)===target.interceptSign;
 }
 if(target.kind==='root-line-count')return [0,1,2].includes(target.intersectionCount)&&rootLineCount(user)===target.intersectionCount;
 if(['root-points','graph-values'].includes(target.kind)){
  const u=user.split(';'),v=String(target.answer).split(';');
  return u.length===v.length&&u.length>=2&&u.length<=12&&u.every((x,i)=>M.equal(x,v[i]));
 }
 if(target.kind==='graph-pair'){
  if(!G?.parsePair(user)||!G?.parsePair(String(target.answer)))return false;
  const u=user.split(';'),v=String(target.answer).split(';');
  return [[0,1,2,3],[2,3,0,1]].some(order=>order.every((j,i)=>M.equal(u[i],v[j])));
 }
 if(target.kind==='graph'){const a=G?.parse(user),b=G?.parse(String(target.answer));if(!a||!b||a.holes.length!==b.holes.length)return false;const u=user.split(';'),v=String(target.answer).split(';');return M.equal(u[0],v[0])&&M.equal(u[1],v[1])&&(a.holes.length===0||u.slice(2).every(x=>v.slice(2).some(y=>M.equal(x,y))));}
 if(target.kind==='choice')return user===String(target.answer);
 if(target.kind==='set')return answers.some(a=>setEqual(user,a));
 if(target.reducedExpression && target.kind==='text')return sameReducedExpression(user,target.answer);
 if(target.kind==='text')return answers.some(a=>normalize(user)===normalize(a));
 return answers.some(a=>M.check(user,a,target.answerFormat));
}
return {absLineIntersections,pointGroups,planeResponse,equationPlaneStatus,equationRatioStatus,exampleEquationsStatus,reciprocalIntersections,classifyRationalCandidates,factoredPair,progressionFactors,radicalSum,quadraticEntries,sameRadicalSum,signedSquare,proofOrder,inspectDomainFraction,setEntries,check,normalize,setEqual,rootLineCount,squareInteger};
});
