(function(root){'use strict';
const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
function rational(n,d=1){if(!Number.isSafeInteger(n)||!Number.isSafeInteger(d)||d===0)return null;const g=gcd(n,d),sg=d<0?-1:1;return {n:n/g*sg,d:Math.abs(d/g)};}
function parse(value){let s=String(value).trim().replace(/−/g,'-').replace(',','.');if(s.length>32)return null;let m;
 if((m=s.match(/^([+-]?)(\d{1,4})\s+(\d{1,4})\/(\d{1,4})$/))){const [,sign,w,n,d]=m;if(+d===0||+n>=+d)return null;return rational((sign==='-'?-1:1)*(+w*+d + +n),+d);}
 if((m=s.match(/^([+-]?\d{1,4})\/([+-]?\d{1,4})$/)))return rational(+m[1],+m[2]);
 if(!/^[+-]?(?:\d{1,8}(?:\.\d{0,4})?|\.\d{1,4})$/.test(s))return null;const places=(s.split('.')[1]||'').length;return rational(Math.round(Number(s)*10**places),10**places);
}
const value=r=>r.n/r.d,equal=(a,b)=>!!a&&!!b&&a.n===b.n&&a.d===b.d;
function operate(a,b,op){if(!a||!b)return null;return op==='+'?rational(a.n*b.d+b.n*a.d,a.d*b.d):op==='-'?rational(a.n*b.d-b.n*a.d,a.d*b.d):op==='*'?rational(a.n*b.n,a.d*b.d):op==='/'?rational(a.n*b.d,a.d*b.n):null;}
const text=r=>r?(r.d===1?String(r.n):`${r.n}/${r.d}`):'не определено';
const exponential=(base,x)=>Math.pow(base,x),logarithm=(base,x)=>base>0&&base!==1&&x>0?Math.log(x)/Math.log(base):null;
const api={gcd,rational,parse,value,equal,operate,text,exponential,logarithm};root.AlgebraMath=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
