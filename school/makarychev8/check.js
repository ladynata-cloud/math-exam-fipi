/* Safe answer checking: exact rational numbers, unordered root sets, explicit symbolic forms. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('../peterson6/math.js'):root.PetersonMath,typeof module==='object'&&module.exports?require('./task-graphs.js'):root.MakarychevTaskGraphs);if(typeof module==='object'&&module.exports)module.exports=api;else root.MakarychevCheck=api;})(typeof globalThis!=='undefined'?globalThis:this,function(M,G){
'use strict';
function normalize(value){return String(value??'').trim().toLowerCase()
 .replace(/[−–—]/g,'-').replace(/[×·⋅]/g,'*').replace(/\s+/g,'')
 .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g,s=>'^'+Array.from(s,c=>'⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)).join(''))
 .replace(/≤/g,'<=').replace(/≥/g,'>=').replace(/≠/g,'!=')
 .replace(/([0-9a-zа-я)])\*(?=[a-zа-я(])/g,'$1').replace(/∈/g,'in').replace(/\bpi\b/g,'π')
 .replace(/([0-9]),(?=[0-9])/g,'$1.').replace(/[х]/g,'x');}
function setEqual(user,expected){
 const empty=s=>/^(нет|неткорней|корнейнет|пусто|∅|\{\})$/.test(normalize(s));
 if(empty(user)||empty(expected))return empty(user)&&empty(expected);
 const split=s=>String(s).replace(/[{}]/g,'').split(';').map(x=>x.trim()).filter(Boolean);
 const a=split(user),b=split(expected);if(!a.length||a.length!==b.length)return false;
 const used=new Set();return a.every(x=>{const i=b.findIndex((y,j)=>!used.has(j)&&(M.equal(x,y)||normalize(x)===normalize(y)));if(i<0)return false;used.add(i);return true;});
}
function check(user,target){
 if(typeof user!=='string'||user.length>1000||!user.trim()||!target)return false;
 const answers=[target.answer,...(target.accepts||[])].map(String);
 if(target.kind==='graph-pair'){
  if(!G?.parsePair(user)||!G?.parsePair(String(target.answer)))return false;
  const u=user.split(';'),v=String(target.answer).split(';');
  return [[0,1,2,3],[2,3,0,1]].some(order=>order.every((j,i)=>M.equal(u[i],v[j])));
 }
 if(target.kind==='graph'){const a=G?.parse(user),b=G?.parse(String(target.answer));if(!a||!b||a.holes.length!==b.holes.length)return false;const u=user.split(';'),v=String(target.answer).split(';');return M.equal(u[0],v[0])&&M.equal(u[1],v[1])&&(a.holes.length===0||u.slice(2).every(x=>v.slice(2).some(y=>M.equal(x,y))));}
 if(target.kind==='choice')return user===String(target.answer);
 if(target.kind==='set')return answers.some(a=>setEqual(user,a));
 if(target.kind==='text')return answers.some(a=>normalize(user)===normalize(a));
 return answers.some(a=>M.check(user,a,target.answerFormat));
}
return {check,normalize,setEqual};
});
