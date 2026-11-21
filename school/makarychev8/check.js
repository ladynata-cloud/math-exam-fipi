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
function sameReducedExpression(input, expected) {
 const source=normalize(input);
 if(source.length>120||/[^0-9.a-z()+*/^\-]/.test(source))return false;
 const symbols=new Set(String(expected).match(/[a-z]/g)||[]);
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
 try{
  const [n1,d1]=parse(source),[n2,d2]=parse(normalize(expected));
  if(n1.size!==n2.size||d1.size!==d2.size)return false;
  const [pivot,q2]=d2.entries().next().value,q1=d1.get(pivot);if(!q1)return false;
  return [[n1,n2],[d1,d2]].every(([left,right])=>
   [...right].every(([key,value])=>left.has(key)&&left.get(key)*q2===value*q1));
 }catch(_){return false;}
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
return {setEntries,check,normalize,setEqual,rootLineCount,squareInteger};
});
