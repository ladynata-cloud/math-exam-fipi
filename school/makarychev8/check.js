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
  if(!magnitude)return null;
  entries.push(M.answer(magnitude));
  if(magnitude.n!==0)entries.push(M.answer({n:-magnitude.n,d:magnitude.d}));
 }
 return entries.length?entries:null;
}
function setEqual(user,expected){
 const empty=s=>/^(нет|неткорней|корнейнет|пусто|∅|\{\})$/.test(normalize(s));
 if(empty(user)||empty(expected))return empty(user)&&empty(expected);
 const a=setEntries(user),b=setEntries(expected);if(!a||!b||a.length!==b.length)return false;
 const used=new Set();return a.every(x=>{const i=b.findIndex((y,j)=>!used.has(j)&&(M.parse(y)?M.equal(x,y):normalize(x)===normalize(y)));if(i<0)return false;used.add(i);return true;});
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
function check(user,target){
 if(typeof user!=='string'||user.length>1000||!user.trim()||!target)return false;
 const answers=[target.answer,...(target.accepts||[])].map(String);
 if(target.kind==='separated-rational')return separatedRational(user,target.answer);
 if(target.kind==='proof-chain')return (target.proofOrders||[target.answer]).includes(proofOrder(user,target.proofClaims.length)?.join(';'));
 if(target.kind==='common-factor')return equivalentCommonFactor(user,target.answer);
 if(target.kind==='domain-fraction')return inspectDomainFraction(user,target.exclusions).status==='correct';
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
  if((target.exactAnswers||[]).some(answer=>normalize(user)===normalize(answer)||setEqual(user,answer)))return true;
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
return {proofOrder,inspectDomainFraction,setEntries,check,normalize,setEqual,rootLineCount,squareInteger};
});
