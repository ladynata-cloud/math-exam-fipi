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
function parameterFormulas(value, target) {
 const fields=value.split(';'), expected=String(target.answer).split(';');
 if(fields.length!==expected.length||!fields.every(v=>v.trim()))return false;
 const symbols=new Set([target.symbol]),excluded=target.exclusions||[];
 function coefficients(poly){
  const degree=Math.max(0,...[...poly.keys()].map(key=>key.length));
  return Array.from({length:degree+1},(_,i)=>poly.get(target.symbol.repeat(i))||0n);
 }
 function product(a,b){
  const result=Array(a.length+b.length-1).fill(0n);
  a.forEach((v,i)=>b.forEach((w,j)=>{result[i+j]+=v*w;}));
  return result;
 }
 function equivalent(field, reference){
  try{
   const [n,d]=polynomialFraction(normalize(field),symbols).map(coefficients);
   const [rn,rd]=polynomialFraction(normalize(reference),symbols).map(coefficients);
   // A cancelled factor may still remove a legitimate parameter value.
   const allowed=excluded.filter(point=>evaluateAt(d,point)===0n).length;
   if(Number.isInteger(target.below)||Number.isInteger(target.above)){
    const bound=target.below??target.above,sign=target.below===undefined?1n:-1n;
    // z = bound ± u² covers precisely the open half-line when u is nonzero.
    let transformed=[];
    for(const coefficient of [...d].reverse()){
     transformed=product(transformed.length?transformed:[0n],[BigInt(bound),0n,sign]);
     transformed[0]+=coefficient;
    }
    if(realRootCount(transformed)>(evaluateAt(d,String(bound))===0n?1:0))return false;
   }else if(realRootCount([...d])>allowed)return false;
   const left=product(n,rd),right=product(rn,d);
   return Array.from({length:Math.max(left.length,right.length)},(_,i)=>(left[i]||0n)===(right[i]||0n)).every(Boolean);
  }catch(_){return false;}
 }
 if(target.ordered)return fields.every((field,i)=>equivalent(field,expected[i]));
 const remaining=[...expected];
 return fields.every(field=>{
  const i=remaining.findIndex(reference=>equivalent(field,reference));
  if(i<0)return false;remaining.splice(i,1);return true;
 });
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
  const rawMagnitude=pair?pair[1]:term;
  const rational=M.parse(rawMagnitude);
  if(!rational&&/\d\s+\d/.test(rawMagnitude))return null;
  if(!pair){entries.push(rational?M.answer(rational):term);continue;}
  const magnitude=rational;
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
   const single=/^([a-z])(?:\^(\d+))?/.exec(s);
   if(single&&symbols.has(single[1])){count+=Number(single[2]||1);s=s.slice(single[0].length).replace(/^\*/,'');continue;}
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
 if(q.kind==='three-solutions'||q.kind==='equation-point-example'){
  if(groups.length!==1||groups[0].length!==(q.kind==='equation-point-example'?1:3))return 'count';
  if(new Set(groups[0].map(key)).size!==groups[0].length)return 'duplicate';
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

function algebraPairs(input){
 const text=String(input||'').trim();
 if(/^(нет|нетрешений|решенийнет|∅|\{\})$/.test(normalize(text)))return [];
 if(!text||text.length>700)return null;
 const pairs=[];let index=0;
 while(index<text.length){
  if(text[index]!=='(')return null;
  let depth=1,split=-1,end=-1;
  for(let j=index+1;j<text.length;j++){
   if(text[j]==='(')depth++;
   else if(text[j]===')'){if(!--depth){end=j;break;}}
   else if(text[j]===';'&&depth===1){if(split>=0)return null;split=j;}
  }
  if(end<0||split<0)return null;
  const pair=[text.slice(index+1,split).trim(),text.slice(split+1,end).trim()];
  if(pair.some(x=>!radicalSum(x)))return null;
  pairs.push(pair);if(pairs.length>8)return null;index=end+1;
  if(index<text.length){const delim=/^\s*[,|;]\s*/.exec(text.slice(index));if(!delim)return null;index+=delim[0].length;if(index===text.length)return null;}
 }
 return pairs;
}
function sameAlgebraPairs(raw,expected){
 const user=algebraPairs(raw),right=algebraPairs(expected);
 if(!user||!right||user.length!==right.length)return false;
 const unused=right.slice();
 for(const [x,y] of user){
  const i=unused.findIndex(([a,b])=>sameRadicalSum(x,a)&&sameRadicalSum(y,b));
  if(i<0)return false;unused.splice(i,1);
 }
 return true;
}
function orderInput(raw,target){
 const parts=/^\s*([^<>]+)\s*([<>])\s*([^<>]+)\s*$/.exec(String(raw??''));if(!parts)return null;
 const sides=[parts[1],parts[3]];
 if(target.numericSides)return sides.every(v=>M.parse(v))?parts:null;
 const symbols=new Set(String(target.answer).match(/[a-z]/g)||[]);
 try{for(const side of sides)polynomialFraction(normalize(side),symbols);return parts;}catch(_){return null;}
}
function transformedOrder(input,target){
 const split=v=>/^\s*([^<>]+)\s*([<>])\s*([^<>]+)\s*$/.exec(String(v??''));
 const user=split(input),goal=split(target.answer);if(!user||!goal)return false;
 const equal=target.numericSides?M.equal:sameReducedExpression;
 if(target.numericSides&&(!M.parse(user[1])||!M.parse(user[3])))return false;
 return user[2]===goal[2]?equal(user[1],goal[1])&&equal(user[3],goal[3]):equal(user[1],goal[3])&&equal(user[3],goal[1]);
}
function systemTriple(raw){
 const parts=String(raw??'').split(';').map(p=>M.parse(p.trim()));
 if(parts.length!==3||parts.some(p=>!p))return null;
 const [a,b,c]=parts,nonzero=-8n*BigInt(b.n)*BigInt(a.d)-9n*BigInt(a.n)*BigInt(b.d)!==0n;
 const same=!nonzero&&a.n!==0&&-8n*BigInt(c.n)*BigInt(a.d)===10n*BigInt(a.n)*BigInt(c.d);
 return {values:parts.map(p=>p.n/p.d),nonzero,same};
}
function excludedParameter(raw,excluded){
 const text=String(raw??'').trim().replace(/[−–]/g,'-');
 const one=/^\s*(?:c|с)\s*(?:≠|!=|<>)\s*(.+)$/i.exec(text);
 if(one)return M.equal(one[1],excluded);
 const real=/^(?:R|ℝ)\s*[\\∖]\s*\{\s*([^{}]+)\s*\}$/i.exec(text);
 if(real)return M.equal(real[1],excluded);
 return intervalMatch(text,'(-∞;'+excluded+')∪('+excluded+';+∞)');
}
function affinePlot(raw){
 const values=normalize(raw).split('=');
 if(values.length!==2||values.some(s=>!s))return null;
 try{
  const [n,d]=polynomialFraction('('+values[0]+')-('+values[1]+')',new Set(['x','y']));
  if(d.size!==1||!d.has('')||[...n.keys()].some(k=>!['','x','y'].includes(k)))return null;
  const a=n.get('x')||0n,b=n.get('y')||0n,c=-(n.get('')||0n);
  if(!b)return null;
  return {k:-Number(a)/Number(b),b:Number(c)/Number(b),coefficients:[a,b,c],atPoint:(x,y)=>a*BigInt(x)+b*BigInt(y)===c};
 }catch(_){return null;}
}

function lineCondition(raw, g) {
 const proposal=affinePlot(raw);if(!proposal)return {status:'format'};
 const [a,b,c]=g.line.map(BigInt),[u,v,w]=proposal.coefficients;
 const det=a*v-u*b,nx=c*v-w*b,ny=a*w-u*c;
 const mode=g.mode;
 if(det===0n){
  if(nx===0n&&ny===0n)return {status:'same',proposal};
  if(mode!=='parallel')return {status:'parallel',proposal};
  return {status:proposal.atPoint(...g.point)?'valid':'point',proposal};
 }
 const x=Number(nx)/Number(det),y=Number(ny)/Number(det);
 const sign=n=>n===0n?0:(n<0n)===(det<0n)?1:-1;
 const valid=mode==='third'?sign(nx)<0&&sign(ny)<0:mode==='ox'?ny===0n:mode==='oy'?nx===0n:false;
 return {status:valid?'valid':mode==='parallel'?'slope':'location',proposal,x,y};
}

function systemEvidence(input,graph){
 const submitted=algebraPairs(input);
 if(!submitted)return null;
 const mul=(a,b)=>a.flatMap(u=>b.map(v=>({sign:u.sign*v.sign,n:u.n*v.n,d:u.d*v.d})));
 const one=[{sign:1,n:1n,d:1n}];
 return submitted.map(([a,b])=>{
   const x=radicalSum(a),y=radicalSum(b);
   const excluded=graph.excludeZero&&(sameRadicalTerms(x,[])||sameRadicalTerms(y,[]));
   if(excluded)return {a,b,excluded:true,valid:[]};
   const powers=[x,y].map(z=>[one,z,mul(z,z)]);
   const valid=graph.terms.map(poly=>{
    const terms=poly.flatMap(([c,i,j])=>mul(mul(radicalSum(c),powers[0][i]),powers[1][j]));
    return sameRadicalTerms(terms,[]);
   });
   return {a,b,excluded:false,valid};
 });
}
function vietaAudit(value,target){
 const entries=quadraticEntries(value);
 if(!entries||entries.length!==2)return null;
 const [first,second]=entries.map(radicalSum);
 const product=first.flatMap(a=>second.map(b=>({sign:a.sign*b.sign,n:a.n*b.n,d:a.d*b.d})));
 return {sum:sameRadicalTerms([...first,...second],radicalSum(target.sum)),product:sameRadicalTerms(product,radicalSum(target.product))};
}
function coefficientAndRoots(value,answer){
 const [user,...roots]=String(value).split(';'),[parameter,...expected]=String(answer).split(';');
 return Boolean(M.parse(user)&&M.equal(user,parameter)&&roots.length===2&&sameQuadraticRoots(roots.join(';'),expected.join(';')));
}

function radicalApprox(raw){
 const terms=radicalSum(raw);
 return terms?terms.reduce((sum,t)=>sum+t.sign*Math.sqrt(Number(t.n)/Number(t.d)),0):null;
}
function graphRootEntries(raw){
 let text=String(raw??'').trim().replace(/[−–]/g,'-');
 if(!text||text.length>180)return null;
 text=text.replace(/\+\/-/g,'±');
 if(text.includes('±')&&!text.includes(';'))text=text.replace('±','-')+';'+text.replace('±','+');
 const entries=text.split(';').map(v=>v.trim());
 if(entries.length>2)return null;
 const parts=entries.map(item=>{
  const z=item.replace(/\s/g,'').toLowerCase(),cube=/^([+-]?)(?:∛5|∛\(5\)|cbrt\(5\)|5\^\(1\/3\))$/.exec(z);
  if(cube)return {value:item,x:(cube[1]==='-'?-1:1)*Math.cbrt(5),syntax:'cube'};
  const r=M.parse(item);if(r)return {value:item,x:r.n/r.d,syntax:'number'};
  const x=radicalApprox(item);return x===null?null:{value:item,x,syntax:'radical'};
 });
 return parts.every(p=>p&&Number.isFinite(p.x))?parts:null;
}
function graphReadingCorrect(raw,question){
 const user=graphRootEntries(raw),wanted=graphRootEntries(question.answer);
 if(!user||!wanted||user.length!==wanted.length)return false;
 const remaining=[...wanted];
 return user.every(u=>{
  const i=remaining.findIndex(w=>u.syntax==='number'?Math.abs(u.x-w.x)<=0.05:u.syntax==='cube'?w.syntax==='cube'&&u.x===w.x:w.syntax!=='cube'&&sameRadicalSum(u.value,w.value));
  if(i<0)return false;remaining.splice(i,1);return true;
 });
}
function rationalRootTrial(value,config){
 return quadraticTrial(value,config.coefficients).map(row=>({...row,forbidden:(config.excluded||[]).some(x=>sameRadicalSum(row.value,x))}));
}

function quadraticTrial(value,coefficients){
 const entries=quadraticEntries(value);if(!entries||!entries.length)return [];
 const terms=[coefficients.map((v,i)=>[String(v),2-i,0])];
 return entries.map(raw=>{
  const pair=systemEvidence('('+raw+';0)',{terms});
  const x=radicalSum(raw).reduce((sum,t)=>sum+t.sign*Math.sqrt(Number(t.n)/Number(t.d)),0);
  return {value:raw,x,exact:pair[0].valid[0]};
 });
}
function openIntervals(input){
 const text=String(input||'').trim().replace(/−|–/g,'-').replace(/\s+/g,'').replace(/или|union|∪/gi,'|');
 if(!text||text.length>180)return null;
 const endpoint=s=>/^-∞$|^-inf(?:inity)?$/i.test(s)?'-∞':/^\+?(∞|inf(?:inity)?)$/i.test(s)?'+∞':M.parse(s);
 const list=[];
 for(const part of text.split('|')){
  const m=/^([[(])([^;]+);([^;]+)([\])])$/.exec(part);if(!m)return null;
  const left=endpoint(m[2]),right=endpoint(m[3]);
  if(!left||!right)return null;
  function value(r){return r==='-∞'?-Infinity:r==='+∞'?Infinity:r.n/r.d;}
  list.push({left,right,min:value(left),max:value(right),open:m[1]==='('&&m[4]===')',leftOpen:m[1]==='(',rightOpen:m[4]===')'});
 }
 return list;
}
function asThreshold(sign,bound){
 const b=M.parse(bound);if(!b)return null;const value=M.answer(b);
 if(sign==='>')return '('+value+';+∞)';if(sign==='>=')return '['+value+';+∞)';if(sign==='<')return '(-∞;'+value+')';if(sign==='<=')return '(-∞;'+value+']';return null;
}
function linearRay(raw,variable){
 const text=String(raw??'').trim().replace(/≤/g,'<=').replace(/≥/g,'>=');
 if(axisRanges(text))return text;
 const sides=/^([^<>=]+?)\s*(<=|>=|<|>)\s*([^<>=]+)$/.exec(text);if(!sides)return null;
 const left=sides[1].trim(),right=sides[3].trim();
 if(left===variable)return asThreshold(sides[2],right);
 if(right!==variable)return null;return asThreshold({'<':'>','>':'<','<=':'>=','>=':'<='}[sides[2]],left);
}
function landmarkInput(raw,landmarks){
 let text=String(raw??'');
 const left=/(?:альфа|alpha|α|a)/gi,right=/(?:бета|beta|β|b)/gi;
 if(!left.test(text)||!right.test(text))return null;
 text=text.replace(left,String(landmarks[0])).replace(right,String(landmarks[1]));
 return systemInput(text,'x');
}
function systemInput(raw,variable){
 const text=String(raw??'').trim().replace(/−/g,'-').replace(/≤/g,'<=').replace(/≥/g,'>=');
 if(/^(нет решений|пустое множество)$/i.test(text))return '∅';
 if(/^(все( действительные( числа)?| числа)?|r|ℝ)$/i.test(text))return '(-∞;+∞)';
 const exclusions=text.replace(/≠/g,'!=').split(/\s+и\s+|\s*&&\s*/i);
 if(typeof variable==='string'&&exclusions.length<=20&&exclusions.every(s=>s.split('!=')[0]?.trim()===variable&&s.split('!=').length===2)){
  const points=exclusions.map(s=>M.parse(s.split('!=')[1].trim()));
  if(points.every(Boolean)){
   points.sort((a,b)=>{const x=BigInt(a.n)*BigInt(b.d),y=BigInt(b.n)*BigInt(a.d);return x<y?-1:x>y?1:0;});
   const bounds=['-∞',...new Set(points.map(q=>M.answer(q))),'+∞'];return bounds.slice(0,-1).map((left,i)=>'('+left+';'+bounds[i+1]+')').join('∪');
  }
 }
 const single=linearRay(text,variable);if(single)return single;
 const equal=text.split('=');
 if(equal.length===2&&equal[0].trim()===variable){const v=M.parse(equal[1]);if(v){const n=M.answer(v);return '['+n+';'+n+']';}}
 const chain=/^([^<>=]+?)\s*(<=|>=|<|>)\s*([a-z])\s*(<=|>=|<|>)\s*([^<>=]+)$/i.exec(text);
 if(!chain||chain[3]!==variable||chain[2][0]!==chain[4][0])return null;
 const a=M.parse(chain[1].trim()),b=M.parse(chain[5].trim());if(!a||!b)return null;
 const inc=chain[2][0]==='<',left=inc?a:b,right=inc?b:a,first=inc?chain[2]:chain[4],last=inc?chain[4]:chain[2];
 const range=(first.length===2?'[':'(')+M.answer(left)+';'+M.answer(right)+(last.length===2?']':')');
 return axisRanges(range)?range:null;
}
function systemExamples(raw,target){
 const xs=rationalList(raw);if(!xs||xs.length!==target.exampleCount||new Set(xs.map(M.answer)).size!==xs.length)return false;
 return xs.every(x=>target.graph.rows.every(r=>G.linearTrial(r,M.answer(x)).holds)&&!(target.graph.holes||[]).some(h=>M.equal(x,M.parse(h))));
}


function linearExamples(raw,t){
 const samples=rationalList(raw);if(!samples||samples.length!==t.exampleCount||new Set(samples.map(M.answer)).size!==samples.length)return false;
 const bound=M.parse(t.graph.threshold);return samples.every(v=>{const d=endpointCompare(v,bound);return {'>':d>0,'>=':d>=0,'<':d<0,'<=':d<=0}[t.graph.relation];});
}


function endpointCompare(a,b){
 if(a===b)return 0;
 if(a==='-∞'||b==='+∞')return -1;if(a==='+∞'||b==='-∞')return 1;
 const delta=BigInt(a.n)*BigInt(b.d)-BigInt(b.n)*BigInt(a.d);return delta<0n?-1:delta>0n?1:0;
}
function axisRanges(raw){
 const text=String(raw??'').trim();if(['∅','нет'].includes(text.toLowerCase()))return [];
 const ranges=openIntervals(text);if(!ranges||ranges.length>10)return null;
 for(const r of ranges){
  const cmp=endpointCompare(r.left,r.right);
  if(r.left==='+∞'||r.right==='-∞'||r.left==='-∞'&&!r.leftOpen||r.right==='+∞'&&!r.rightOpen||cmp>0||cmp===0&&(r.leftOpen||r.rightOpen))return null;
 }
 ranges.sort((a,b)=>endpointCompare(a.left,b.left)||Number(a.leftOpen)-Number(b.leftOpen));
 const result=[];
 for(const r of ranges){
  const prev=result.at(-1),cmp=prev?endpointCompare(prev.right,r.left):-1;
  if(!prev||cmp<0||cmp===0&&prev.rightOpen&&r.leftOpen){result.push({...r});continue;}
  const end=endpointCompare(prev.right,r.right);
  if(end<0){prev.right=r.right;prev.max=r.max;prev.rightOpen=r.rightOpen;}
  if(end===0)prev.rightOpen=prev.rightOpen&&r.rightOpen;
 }
 return result;
}
function equalAxisSets(raw,expected){
 const a=axisRanges(raw),b=axisRanges(expected);return Boolean(a&&b&&a.length===b.length&&a.every((x,i)=>endpointCompare(x.left,b[i].left)===0&&endpointCompare(x.right,b[i].right)===0&&x.leftOpen===b[i].leftOpen&&x.rightOpen===b[i].rightOpen));
}
function axisName(raw){
 const name=String(raw??'').trim().toLowerCase().replace(/ё/g,'е');
 return {'числовой отрезок':'отрезок','луч':'числовой луч','открытый луч':'открытый числовой луч','координатная прямая':'числовая прямая','вся прямая':'числовая прямая'}[name]||name;
}
function rationalList(raw){
 const s=String(raw??'').trim().replace(/^[{](.*)[}]$/,'$1');if(!s)return null;
 const fields=s.split(';').map(x=>M.parse(x.trim()));return fields.length<=50&&fields.every(Boolean)?fields:null;
}
function axisListEqual(raw,target){
 const a=rationalList(raw),b=rationalList(target.answer);if(!a||!b)return false;
 if(target.kind==='fixed-denominator-list'&&!String(raw).split(';').every(v=>new RegExp('^\\s*\\d+\\s*/\\s*'+target.expectedDenominator+'\\s*$').test(v)))return false;
 return b.every(x=>a.some(y=>M.equal(x,y)))&&a.every(x=>b.some(y=>M.equal(x,y)));
}


function estimateInput(raw,expression){
 const src=String(raw??'').trim().replace(/<=/g,'≤').replace(/>=/g,'≥');
 let ranges=openIntervals(src);
 if(!ranges){
  const m=/^([^<>≤≥]+)([<≤>≥])([^<>≤≥]+)([<≤>≥])([^<>≤≥]+)$/.exec(src);
  if(!m||normalize(m[3])!==normalize(expression))return null;
  const asc='<≤'.includes(m[2]);if(asc!=='<≤'.includes(m[4]))return null;
  ranges=openIntervals(asc?(m[2]==='≤'?'[':'(')+m[1]+';'+m[5]+(m[4]==='≤'?']':')'):(m[4]==='≥'?'[':'(')+m[5]+';'+m[1]+(m[2]==='≥'?']':')'));
 }
 return ranges?.length===1&&typeof ranges[0].left!=='string'&&typeof ranges[0].right!=='string'?ranges[0]:null;
}
function estimateStatus(raw,t){
 const u=estimateInput(raw,t.graph.expression),g=openIntervals(t.answer)[0];if(!u)return 'format';
 if(BigInt(u.left.n)*BigInt(u.right.d)>=BigInt(u.right.n)*BigInt(u.left.d))return 'order';
 if(!M.equal(u.left,g.left)||!M.equal(u.right,g.right))return 'ends';
 return u.leftOpen===g.leftOpen&&u.rightOpen===g.rightOpen?'correct':'inclusion';
}
function intervalMatch(user,right){
 const a=openIntervals(user),b=openIntervals(right);
 if(!a||!b||a.length!==b.length)return false;
 const equal=(v,w)=>typeof v==='string'||typeof w==='string'?v===w:M.equal(v,w);
 const pending=b.slice();
 for(const item of a){
  if(!item.open||item.min>=item.max)return false;
  const i=pending.findIndex(p=>equal(item.left,p.left)&&equal(item.right,p.right));
  if(i<0)return false;pending.splice(i,1);
 }
 return true;
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
function squaredBinomial(value,expected){
 const status=factoredPair(value,expected),v=normalize(value);
 if(status==='different')return status;
 if(status==='factored'&&v.startsWith('(')&&v.endsWith(')^2')){
  let depth=0;for(let i=0;i<v.length-2;i++){
    if(v[i]==='(')depth++;else if(v[i]===')'&&!--depth&&i!==v.length-3)return 'form';
  }
  return 'square';
 }
 return 'form';
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
 if(target.kind==='graph-root-reading')return graphReadingCorrect(user,target);
 if(target.kind==='fraction-sample')return G.fractionSample(user,target.probeCount)!==null;
 if(target.kind==='symbolic-coefficients'){
  const fields=user.split(';'),expected=String(target.answer).split(';');
  return fields.length===expected.length&&fields.every((v,i)=>sameReducedExpression(v,expected[i]));
 }
 if(target.kind==='coefficient-and-roots')return coefficientAndRoots(user,target.answer);
 if(target.kind==='integer-runs'){
  const rows=G.sequenceEvidence(user,target.graph),expected=G.sequenceRows(target.answer,target.graph);
  return rows.length===expected.length&&new Set(rows.map(item=>item.row[0])).size===rows.length&&rows.every(item=>item.correct);
 }
 if(target.kind==='parameter-formulas')return parameterFormulas(user,target);
 if(target.kind==='parameter-sample')return G.parameterSample(user)!==null;
 if(target.kind==='squared-binomial')return squaredBinomial(user,target.answer)==='square';
 if(['three-solutions','equation-point-example','construct-lines'].includes(target.kind))return planeResponse(user,target)==='correct';
 if(['trip-knots','full-range-knots'].includes(target.kind))return G.graphKnots(target.graph,pointGroups(user)).status==='valid';
 if(target.kind==='sorted-root-values'){
  const n=target.graph.xs.length,a=G.domainCoefficients(user,n),b=G.domainCoefficients(target.answer,n);
  return Boolean(a&&b&&a.every((v,i)=>M.equal(M.answer(v),M.answer(b[i]))));
 }
 if(target.kind==='punctured-root-points')return G.puncturedPoints(target.graph,pointGroups(user)).status==='valid';
 if(target.kind==='absolute-reciprocal-points')return G.reciprocalPoints({...target.graph,absolute:true},pointGroups(user)).status==='valid';
 if(target.kind==='floor-graph-piece')return G.floorPiece(target.graph,{pointGroups},user).status==='valid';
 if(target.kind==='reciprocal-pair-points')return G.reciprocalPair(target.graph,pointGroups(user)).status==='valid';
 if(target.kind==='reciprocal-points')return G.reciprocalPoints(target.graph,pointGroups(user)).status==='valid';
 if(target.kind==='root-transform-points')return G.transformedRootPoints(target.graph,pointGroups(user)).status==='valid';
 if(target.kind==='affine-condition')return lineCondition(user,target.graph).status==='valid';
 if(target.kind==='line-placement'){const proposed=G.positionCoefficients(target.graph,user);return Boolean(proposed?.validK&&proposed.validB);}
 if(target.kind==='line-signed-coefficient'){const q=M.parse(user);return Boolean(q&&Math.sign(q.n)===target.sign);}
 if(target.kind==='own-affine-points')return G.ownAffine(target.graph,pointGroups(user)).status==='valid';
 if(target.kind==='review-slope'){const v=M.parse(user);return Boolean(v&&(target.positive?v.n>0:v.n<0));}
 if(target.kind==='review-line-index'){const v=M.parse(user);return Boolean(v&&v.d===1&&v.n>=1&&v.n<=5);}
 if(target.kind==='review-precision'){const v=M.parse(user);return Boolean(v&&v.d===1&&v.n>=1&&v.n<=6);}
 if(target.kind==='intersection-points'){
  const list=pointGroups(user),expected=pointGroups(target.answer);
  if(list?.length!==1||list[0].length!==expected[0].length)return false;
  const key=pair=>pair.map(v=>v.n+'/'+v.d).join(';');
  return list[0].map(key).sort().join('|')===expected[0].map(key).sort().join('|');
 }
 if(target.kind==='rational-probe')return Boolean(M.parse(user));
 if(target.kind==='linear-ray'){const u=linearRay(user,target.graph.variable);return Boolean(u&&equalAxisSets(u,asThreshold(target.graph.relation,target.graph.threshold)));}
 if(target.kind==='trip-table'){
  const a=G.domainCoefficients(user,4),b=G.domainCoefficients(target.answer,4);return Boolean(a&&b&&a.every((v,i)=>M.equal(M.answer(v),M.answer(b[i]))));
 }
 if(target.kind==='behavior-table'){
  const fields=G.domainCoefficients(user,target.graph.xs.length),expected=target.graph.tableValues;return Boolean(fields&&fields.every((q,i)=>M.equal(M.answer(q),expected[i])));
 }
 if(target.kind==='feature-points'){
  const n=target.graph.constructionXs.length,a=G.domainCoefficients(user,n),b=G.domainCoefficients(target.answer,n);return Boolean(a&&b&&a.every((v,i)=>M.equal(M.answer(v),M.answer(b[i]))));
 }
 if(target.kind==='feature-coefficients'){
  const a=G.domainCoefficients(user,2),b=G.domainCoefficients(target.answer,2);return Boolean(a&&b&&a.every((v,i)=>M.equal(M.answer(v),M.answer(b[i]))));
 }
 if(target.kind==='positive-probe'){const r=M.parse(user);return Boolean(r&&r.n>0);}
 if(target.kind==='domain-family'){
  const f=G.familyDomain(user);if(!f)return false;
  return target.graph.excluded===null?f.domain==='all':f.domain==='except'&&M.equal(f.cut,String(target.graph.excluded));
 }
 if(target.kind==='reciprocal-hole'){
  const a=G.domainCoefficients(user,3),b=G.domainCoefficients(target.answer,3);
  return Boolean(a&&b&&a.every((v,i)=>M.equal(M.answer(v),M.answer(b[i]))));
 }
 if(target.kind==='monotone-construction'||target.kind==='zero-construction')return G.witnessMarks(target.graph,user).valid;
 if(target.kind==='grid-estimate'){const a=M.parse(user),b=M.parse(target.answer);return Boolean(a&&b&&Math.abs(a.n/a.d-b.n/b.d)<=target.tolerance);}
 if(target.kind==='landmark-interval'){const marks=G.propertyCurve(target.graph).landmarks;return equalAxisSets(landmarkInput(user,marks),landmarkInput(target.answer,marks));}
 if(target.kind==='system-single'||target.kind==='system-intersection')return equalAxisSets(systemInput(user,target.variable||target.graph?.variable),target.answer);
 if(target.kind==='system-examples')return systemExamples(user,target);
 if(target.kind==='linear-examples')return linearExamples(user,target);
 if(target.kind==='universal-set'){
  const s=String(user??'').trim().toLowerCase(),summary=['все','все действительные','r','ℝ','все числа'].includes(s)?'(-∞;+∞)':s;
  return equalAxisSets(summary,target.answer);
 }
 if(target.kind==='cube-graph-root')return Boolean(G.cubeRead(user)?.valid);
 if(target.kind==='axis-set')return equalAxisSets(user,target.answer);
 if(target.kind==='named-interval'){const a=String(user).split('|'),b=target.answer.split('|');return a.length===2&&equalAxisSets(a[0],b[0])&&axisName(a[1])===axisName(b[1]);}
 if(['rational-axis-list','fixed-denominator-list'].includes(target.kind))return axisListEqual(user,target);
 if(target.kind==='near-two-examples'){const p=rationalList(user);return Boolean(p?.length===2&&!M.equal(p[0],p[1])&&p.every(v=>endpointCompare(v,M.parse('1.98'))>0&&endpointCompare(v,M.parse('2'))<0));}
 if(target.kind==='explicit-set'){const a=G.setTokens(user,target.letters),b=G.setTokens(target.answer,target.letters);return Boolean(a&&b&&a.length===b.length&&a.every(x=>b.includes(x)));}
 if(target.kind==='integer-probe')return G.integerProbe(user)!==null;
 if(target.kind==='multiple-witness'){const n=G.integerProbe(user);return n!==null&&n%3===0&&n%5!==0;}
 if(target.kind==='segment-name'){const p=String(user??'').toUpperCase().replace(/\s/g,'');return p===target.answer||p===target.answer.split('').reverse().join('');}
 if(['bound-corner','yield-pair','speed-pair'].includes(target.kind)){
  const p=G.cornerValues(user),q=G.cornerValues(target.answer);return Boolean(p&&q&&p.every((x,i)=>M.equal(x,q[i])));
 }
 if(target.kind==='triangle-vertex'){const p=G.cornerValues(user);return Boolean(p&&p[1].n>0);}
 if(target.kind==='estimate-interval')return estimateStatus(user,target)==='correct';
 if(target.kind==='ordered-coordinates')return Boolean(G.coordinateEvidence(user,target.coordinateSymbols,target.coordinateOrder,target.coordinateBounds)?.valid);
 if(target.kind==='ordered-comparison-sample')return G.admissibleSample(user,target.graph.sourceDomain,2)&&G.inequalityTrial(target.graph,user,true)?.sign===target.requiredSign;
 if(target.kind==='transformed-order')return transformedOrder(user,target);
 if(target.kind==='between-surd')return G.betweenSurd(user,target);
 if(target.kind==='extrema-pair'){
  const parts=String(user).split(';'),expected=target.answer.split(';');
  return parts.length===2&&parts.every((p,i)=>expected[i]==='нет'?['нет','не существует','отсутствует'].includes(p.trim().toLowerCase()):M.equal(p,expected[i]));
 }
 if(target.kind==='bounded-point')return G.withinBounds(user,target.limits);
 if(target.kind==='source-domain-sample')return G.admissibleSample(user,target.sourceDomain,target.probeCount);
 if(target.kind==='inequality-counterexample'){const probe=G.inequalityTrial(target.graph,user,true);return Boolean(probe&&probe.sign!==target.graph.operator);}
 if(target.kind==='unique-system-triple')return Boolean(systemTriple(user)?.nonzero);
 if(target.kind==='parameter-exclusion')return excludedParameter(user,target.excluded);
 if(target.kind==='line-pair-equation')return equationPlaneStatus(user,target.answer)==='correct';
 if(target.kind==='algebra-pairs')return sameAlgebraPairs(user,target.answer);
 if(target.kind==='open-intervals')return intervalMatch(user,target.answer);
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
 if(target.kind==='choice')return target.hypothesis===true?target.choices.includes(user):user===String(target.answer);
 if(target.kind==='set')return answers.some(a=>setEqual(user,a));
 if(target.reducedExpression && target.kind==='text')return sameReducedExpression(user,target.answer);
 if(target.kind==='text')return answers.some(a=>normalize(user)===normalize(a));
 return answers.some(a=>M.check(user,a,target.answerFormat));
}
return {lineCondition,landmarkInput,systemInput,linearRay,asThreshold,axisRanges,equalAxisSets,axisName,rationalList,estimateInput,estimateStatus,orderInput,systemTriple,excludedParameter,affinePlot,radicalApprox,graphRootEntries,rationalRootTrial,vietaAudit,quadraticTrial,squaredBinomial,algebraPairs,systemEvidence,openIntervals,absLineIntersections,pointGroups,planeResponse,equationPlaneStatus,equationRatioStatus,exampleEquationsStatus,reciprocalIntersections,classifyRationalCandidates,factoredPair,progressionFactors,radicalSum,quadraticEntries,sameRadicalSum,signedSquare,proofOrder,inspectDomainFraction,setEntries,check,normalize,setEqual,rootLineCount,squareInteger};
});
