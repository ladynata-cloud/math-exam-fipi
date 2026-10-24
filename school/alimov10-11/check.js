/* Safe answer checking: exact rational numbers, unordered root sets, explicit symbolic forms. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('../peterson6/math.js'):root.PetersonMath);if(typeof module==='object'&&module.exports)module.exports=api;else root.AlimovCheck=api;})(typeof globalThis!=='undefined'?globalThis:this,function(M){
'use strict';
function normalize(value){return String(value??'').trim().toLowerCase()
 .replace(/[−–—]/g,'-').replace(/[×·⋅]/g,'*').replace(/\s+/g,'')
 .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g,m=>'^'+Array.from(m,c=>'⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)).join(''))
 .replace(/≤/g,'<=').replace(/≥/g,'>=').replace(/≠/g,'!=')
 .replace(/([0-9a-zа-яπ)])\*(?=[a-zа-яπ(])/g,'$1').replace(/∈/g,'in').replace(/pi/g,'π')
 .replace(/([0-9]),(?=[0-9])/g,'$1.').replace(/[х]/g,'x');}
function setEqual(user,expected){
 const empty=s=>/^(нет|неткорней|корнейнет|пусто|∅|\{\})$/.test(normalize(s));
 if(empty(user)||empty(expected))return empty(user)&&empty(expected);
 const split=s=>String(s).replace(/[{}]/g,'').split(';').map(x=>x.trim()).filter(Boolean);
 const a=split(user),b=split(expected);if(!a.length||a.length!==b.length)return false;
 const used=new Set();return a.every(x=>{const i=b.findIndex((y,j)=>!used.has(j)&&(M.equal(x,y)||normalize(x)===normalize(y)));if(i<0)return false;used.add(i);return true;});
}
function typedEqual(user,answer){
 const u=normalize(user),a=normalize(answer);if(u===a)return true;
 const parse=s=>/^([[(])([^;]+);([^;]+)([)\]])$/.exec(s),x=parse(u),y=parse(a);
 if(x&&y)return x[1]===y[1]&&x[4]===y[4]&&[2,3].every(i=>x[i]===y[i]||M.equal(x[i],y[i]));
 const relation=s=>/^x(<=|>=|<|>)(.+)$/.exec(s),ur=relation(u),ar=relation(a);
 return !!(ur&&ar&&ur[1]===ar[1]&&M.equal(ur[2],ar[2]));
}
function check(user,target){
 if(typeof user!=='string'||user.length>1000||!user.trim()||!target)return false;
 const answers=[target.answer,...(target.accepts||[])].map(String);
 if(target.kind==='choice')return user===String(target.answer);
 if(target.kind==='set')return answers.some(a=>setEqual(user,a));
 if(target.kind==='text')return answers.some(a=>typedEqual(user,a));
 return answers.some(a=>M.check(user,a,target.answerFormat));
}
return {check,normalize,setEqual};
});
