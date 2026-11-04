/* Safe answer checking: exact rational numbers, unordered root sets, explicit symbolic forms. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('../peterson6/math.js'):root.PetersonMath);if(typeof module==='object'&&module.exports)module.exports=api;else root.NikolskyCheck=api;})(typeof globalThis!=='undefined'?globalThis:this,function(M){
'use strict';
function normalize(value){return String(value??'').trim().toLowerCase()
 .replace(/[−–—]/g,'-').replace(/[×·⋅]/g,'*').replace(/\s+/g,'')
 .replace(/²/g,'^2').replace(/³/g,'^3').replace(/⁴/g,'^4')
 .replace(/≤/g,'<=').replace(/≥/g,'>=').replace(/≠/g,'!=')
 .replace(/pi/g,'π').replace(/([0-9a-zа-яπ)])\*(?=[a-zа-яπ(])/g,'$1').replace(/∈/g,'in')
 .replace(/([0-9]),(?=[0-9])/g,'$1.').replace(/[х]/g,'x');}
function piCoefficient(value){
 const s=normalize(value);if(/^[+-]?0(?:\.0+)?$/.test(s))return '0';
 const m=/^([+-]?(?:\d+(?:\.\d+)?)?)π(?:\/([+-]?\d+))?$/.exec(s);if(!m)return null;
 const a=M.parse(m[1]===''||m[1]==='+'?'1':m[1]==='-'?'-1':m[1]),d=BigInt(m[2]||'1');
 return a&&d!==0n?String(d<0n?-a.n:a.n)+'/'+String(BigInt(a.d)*(d<0n?-d:d)):null;
}
function textEqual(a,b){if(normalize(a)===normalize(b))return true;const x=piCoefficient(a),y=piCoefficient(b);return x!==null&&y!==null&&M.equal(x,y);}
function setEqual(user,expected){
 const empty=s=>/^(нет|неткорней|корнейнет|пусто|∅|\{\})$/.test(normalize(s));
 if(empty(user)||empty(expected))return empty(user)&&empty(expected);
 const split=s=>String(s).replace(/[{}]/g,'').split(';').map(x=>x.trim()).filter(Boolean);
 const a=split(user),b=split(expected);if(!a.length||a.length!==b.length)return false;
 const used=new Set();return a.every(x=>{const i=b.findIndex((y,j)=>!used.has(j)&&(M.equal(x,y)||textEqual(x,y)));if(i<0)return false;used.add(i);return true;});
}
function check(user,target){
 if(typeof user!=='string'||user.length>1000||!user.trim()||!target)return false;
 const answers=[target.answer,...(target.accepts||[])].map(String);
 if(target.kind==='choice')return user===String(target.answer);
 if(target.kind==='set')return answers.some(a=>setEqual(user,a));
 if(target.kind==='text')return answers.some(a=>textEqual(user,a));
 return answers.some(a=>M.check(user,a,target.answerFormat));
}
return {check,normalize,setEqual,piCoefficient};
});
