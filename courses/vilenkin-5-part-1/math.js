(function(global){
'use strict';
const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b){[a,b]=[b,a%b]}return a||1n};
function rat(n,d=1n){if(!d)return null;if(d<0n){n=-n;d=-d}const g=gcd(n,d);return{n:n/g,d:d/g}}
function parse(s){s=String(s).trim().replace(/−/g,'-').replace(/,/g,'.');if(s.length>90)return null;if(/^[+-]?\d{1,3}(?:[ \u00a0\u202f]\d{3})+$/.test(s))s=s.replace(/[ \u00a0\u202f]/g,'');let m;
 if(m=s.match(/^([+-]?\d+)\s+(\d+)\s*\/\s*(\d+)$/)){const a=BigInt(m[1]),b=BigInt(m[2]),d=BigInt(m[3]);return rat(a*d+(m[1].startsWith('-')?-b:b),d)}
 if(m=s.match(/^([+-]?\d+(?:\.\d+)?)\s*\/\s*([+-]?\d+(?:\.\d+)?)$/)){let a=parse(m[1]),b=parse(m[2]);return b.n?rat(a.n*b.d,a.d*b.n):null}
 if(m=s.match(/^([+-]?)(\d+)(?:\.(\d+))?$/)){let dec=m[3]||'';return rat(BigInt((m[1]==='-'?'-':'')+m[2]+dec),10n**BigInt(dec.length))}return null;
}
const norm=s=>String(s).trim().toLowerCase().replace(/ё/g,'е').replace(/−/g,'-').replace(/\s+/g,' ');
function equivalent(a,b){if(Array.isArray(b))return b.some(x=>equivalent(a,x));if(!String(a).trim())return false;let x=parse(a),y=parse(b);if(x&&y)return x.n===y.n&&x.d===y.d;return norm(a)===norm(b)}
const esc=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
function fmt(s){return esc(s).replace(/\^([0-9]+|n)(?![a-zA-Z0-9])/g,(_,n)=>`<sup>${n}</sup>`).replace(/\[\[([^\[\]]+)\/([^\[\]]+)\]\]/g,(_,a,b)=>`<span class="f" aria-label="${a} разделить на ${b}"><span class="n">${a}</span><span class="d">${b}</span></span>`)}
global.CourseMath={parse,equivalent,esc,fmt};
})(typeof window==='undefined'?globalThis:window);
