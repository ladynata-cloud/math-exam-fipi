(function(root){'use strict';
function walk(t,L=6,slow=4,fast=6){return {slow:slow*t,fast:t<=L/fast?fast*t:2*L-fast*t,turn:L/fast,meeting:2*L/(slow+fast)};}
function average(s1,v1,s2,v2){return (s1+s2)/(s1/v1+s2/v2);}
function scores(total,win,loss,score){const out=[];for(let wrong=1;wrong<=total;wrong++){const right=(score+loss*wrong)/win;if(Number.isInteger(right)&&right>=0&&right+wrong<=total)out.push({right,wrong,skip:total-right-wrong});}return out;}
function table(columns,lo,hi){const total=columns.reduce((a,b)=>a+b,0),ns=[];for(let n=1;n<=Math.floor(total/lo);n++)if(n*lo<=total&&total<=n*hi)ns.push(n);return ns;}
function construct(columns,n,lo,hi){const total=columns.reduce((a,b)=>a+b,0);if(total<n*lo||total>n*hi||columns.some(c=>c<n))return null;const sums=Array(n).fill(lo);let spare=total-lo*n;for(let i=0;i<n;i++){const add=Math.min(hi-lo,spare);sums[i]+=add;spare-=add;}const caps=columns.map(c=>c-n),rows=sums.map(s=>{const row=columns.map(()=>1);let rest=s-columns.length;for(let j=0;j<columns.length;j++){const add=Math.min(rest,caps[j]);row[j]+=add;caps[j]-=add;rest-=add;}return row;});return rows;}
const api={walk,average,scores,table,construct};root.ReasoningMath=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
