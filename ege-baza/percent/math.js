(function(root){'use strict';
const valid=(...xs)=>xs.every(Number.isFinite);
function part(whole,p){return valid(whole,p)&&whole>0?whole*p/100:null;}
function whole(value,p){return valid(value,p)&&p>0?100*value/p:null;}
function percent(value,base){return valid(value,base)&&base>0?100*value/base:null;}
function split(total,a,b){return valid(total,a,b)&&total>=0&&a>0&&b>0?{unit:total/(a+b),first:total*a/(a+b),second:total*b/(a+b)}:null;}
function chain(start,ps){return valid(start,...ps)&&start>=0&&ps.every(p=>p>=-100)?ps.reduce((v,p)=>v*(1+p/100),start):null;}
function reverseChange(p){return Number.isFinite(p)&&p>-100?100*(1/(1+p/100)-1):null;}
function concentration(solute,mass){return valid(solute,mass)&&mass>0&&solute>=0&&solute<=mass?100*solute/mass:null;}
function mix(m1,p1,m2,p2){return valid(m1,p1,m2,p2)&&m1>0&&m2>=0&&p1>=0&&p1<=100&&p2>=0&&p2<=100?(m1*p1+m2*p2)/(m1+m2):null;}
const api={part,whole,percent,split,chain,reverseChange,concentration,mix};root.PercentMath=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
