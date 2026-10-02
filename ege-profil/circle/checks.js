(function(root){'use strict';
const parser=typeof module!=='undefined'?require('../start/checks.js'):root.ProfileCheck;
function check(field,value){
 if(field.kind==='number'){if(String(value??'').trim()==='')return false;const n=parser.number(value);return Number.isFinite(n)&&Math.abs(n-field.expected)<=(field.tolerance||1e-7)*Math.max(1,Math.abs(field.expected));}
 if(field.kind==='point'){const n=Number(value);if(value===''||!Number.isFinite(n))return false;const d=Math.atan2(Math.sin(n-field.expected),Math.cos(n-field.expected));return Math.abs(d)<=(field.tolerance||0.035);}
 if(field.kind==='choice')return typeof value==='string'&&value===field.expected;
 if(field.kind==='multi'||field.kind==='order'){if(!Array.isArray(value)||new Set(value).size!==value.length||value.length!==field.expected.length)return false;return field.kind==='multi'?value.every(x=>field.expected.includes(x)):value.every((x,i)=>x===field.expected[i]);}
 return false;
}
function shuffle(options,seed){let a=options.slice(),h=2166136261;for(const c of seed)h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;for(let i=a.length-1;i>0;i--){h=(Math.imul(h,1664525)+1013904223)>>>0;const j=h%(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
const api={check,shuffle,number:parser.number};root.MordCheck=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
