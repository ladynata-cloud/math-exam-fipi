'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'trainers/merzlyak9-2014'),html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
const scripts=[...html.matchAll(/<script defer src="([^"]+)"/g)].map(m=>m[1]).filter(s=>!s.startsWith('/'));
function open(id,state){
 const dom=new JSDOM(html,{url:'https://math.test/trainers/merzlyak9-2014/index.html#lesson/'+id,runScripts:'outside-only'}),w=dom.window;w.Math.random=()=>0;w.TextEncoder=TextEncoder;
 if(state)w.localStorage.setItem('math:merzlyak9-2014:v1:'+id,state);
 for(const s of scripts)w.eval(fs.readFileSync(path.join(dir,s),'utf8'));return dom;
}
const poly=(x,u,v)=>x*x-(u+v)*x+u*v;
const range=(count,start=1)=>Array.from({length:count},(_,i)=>i+start);
const sum=vs=>vs.reduce((total,v)=>total+v,0);
function oracle(l,rows,s){
 const [r,t]=rows,[a,b,c,d]=r;let k,arr,h,u,v,n,r0,items;
 switch(l.point){
  case 1:return [Math.max(a,b),Math.abs(a-b),range(Math.abs(a-b)+1,Math.min(a,b)).filter(x=>x>Math.min(a,b)&&x<Math.max(a,b)).length];
  case 2:return [Math.min(a+d,b+d),Math.min(-c*a,-c*b),Math.abs(c*a-c*b)];
  case 3:return [b+t[1],c*t[2],b-t[2]];
  case 4:h=b/a;arr=r[2].split(',').map(Number);return [Math.max(...arr.filter(x=>a*x<b)),arr.filter(x=>a*x<=b).length,range(h+1).filter(x=>a*x<b).length];
  case 5:return [Math.ceil(b/a),Math.floor(b/a)+1,Math.ceil(b/a)-1];
  case 6:arr=range(100,-30).filter(x=>2*x>=a&&3*x<b);return [Math.min(...arr),Math.max(...arr),arr.length];
  case 7:return [a*c+b,c+1,(a*(c+1)+b)-(a*c+b)];
  case 8:return [a,b,a-c];
  case 9:return [a*b*b,b,3*b*b/(b*b)];
  case 10:return [-a,b,2-a];
  case 11:h=(a+b)/2;return [h,poly(0,a,b),poly(h,a,b)];
  case 12:arr=range(80,-20);return [arr.filter(x=>poly(x,a,b)<0).length,Math.max(...arr.filter(x=>poly(x,a,b)<=0)),Math.min(...arr.filter(x=>x>=a&&poly(x,a,b)>0))];
  case 13:arr=range(70,-20).filter(x=>x*x===a*x+b);return [arr[0],arr.at(-1)**2,sum(arr)];
  case 14:return [a+b*c,c+2,3*b];
  case 15:h=a*(1+b/100);u=h*(1-b/100);return [h,u,100*(a-u)/a];
  case 16:h=Math.abs(a-b);return [h,h/a,100*h/a];
  case 17:return [a+b,a*b,a*b*c];
  case 18:return [r[2]/r[1],(r[2]+t[2])/(r[1]+t[1]),1-t[2]/t[1]];
  case 19:arr=range(a);return [arr.filter(x=>x%2===0).length/a,arr.filter(x=>x<=b).length/a,arr.filter(x=>x%3===0).length/a];
  case 20:arr=rows.map(r=>r[1]).sort((x,y)=>x-y);return [arr[2],sum(arr)/arr.length,arr.at(-1)-arr[0]];
  case 21:return [b*b+a,b+1,(b+1)**2-b*b];
  case 22:r0=b-a;arr=range(c+1).map(i=>a+(i-1)*r0);return [r0,arr[c-1],arr.indexOf(arr.at(-1))+1];
  case 23:arr=range(c).map(i=>a+(i-1)*b);return [a+arr.at(-1),sum(arr),sum(arr.slice(1))];
  case 24:r0=b/a;items=range(c+2).map(i=>a*r0**(i-1));return [r0,items[c-1],items[c+1]/items[c-1]];
  case 25:arr=range(c).map(i=>a*b**(i-1));return [sum(arr),sum(arr.slice(1)),a*c];
  case 26:{
   const ratioParts=String(b).replace(',','.').split('/').map(Number);const ratio=ratioParts[0]/(ratioParts[1]||1);
   // Direct partial sums provide an independent oracle at these ratios, |q|≤1/2.
   arr=range(120).map(i=>a*ratio**(i-1));return [sum(arr),sum(arr.slice(2)),0];
  }
  default:throw Error(l.point);
 }
}
function click(w,name){w.document.querySelector('[data-action="'+name+'"]').click();}
function answer(w,value){const el=w.document.getElementById('answer');el.value=value;el.dispatchEvent(new w.Event('input',{bubbles:true}));w.document.querySelector('#work form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));}
const expectedPages=[5,11,16,27,30,40,55,63,72,81,94,113,122,136,145,150,154,159,168,180,204,212,219,225,233,238];
let answers=0;
for(const [i,page] of expectedPages.entries()){
 const id='55-'+(i+1);let dom=open(id),w=dom.window;
 const l=w.MathExamTopicPractice.lessons.get(id),fmt=w.MathExamTopicPractice.f;
 assert.equal(l.page,page);
 assert(w.document.querySelector('#source').href.endsWith('#page='+(page+1)));
 assert.equal(new URL(w.document.querySelector('#board').href).searchParams.get('trainer'),'/trainers/merzlyak9-2014/index.html#lesson/'+id);
 for(let s=1;s<=11;s++){
  const data=l.make(s),result=oracle(l,data.rows,s);
  assert.equal(data.questions.length,3);assert.equal(new Set(data.questions.map(q=>q.prompt)).size,3);
  for(const [j,q] of data.questions.entries()){
   assert(Math.abs(q.answer-result[j])<1e-9,id+' seed '+s+' form '+j+' ≠ '+result[j]);
   assert(q.error.length>15&&q.calculation.length>=3,id+' help');answers++;
  }
 }
 if(i===5||i>=6&&i<=12||i>=20)assert(w.document.querySelector('#work svg'),id+' visual');
 if(l.point===9){
   const scaled=l.make(3);
   const [[factor,argument]]=scaled.rows;
   assert.equal(w.document.querySelectorAll('#work svg polyline').length,2);
   assert.deepEqual(Array.from(scaled.second,p=>p[1]),Array.from(scaled.plot,p=>factor*p[1]));
   const exercise=open(id,JSON.stringify({id,variant:1,stage:'practice',model:0,results:[],draft:'',attempts:0,hint:0,feedback:''}));
   answer(exercise.window,argument*argument);
   assert.match(exercise.window.document.getElementById('feedback').textContent,/сплошной параболе/);
   answer(exercise.window,factor*argument*argument);
   assert.match(exercise.window.document.getElementById('feedback').textContent,/после исправления/);
   exercise.window.close();
 }
 click(w,'practice');answer(w,'9999999');assert.match(w.document.querySelector('#feedback').textContent,/Проверь/);
 const key='math:merzlyak9-2014:v1:'+id,raw=w.localStorage.getItem(key);dom.window.close();dom=open(id,raw);w=dom.window;
 assert.equal(w.document.querySelector('#answer').value,'9999999');click(w,'hint');click(w,'hint');
 answer(w,fmt(oracle(l,l.make(2).rows,2)[2]));click(w,'next');
 for(let j=0;j<3;j++){if(j===2)click(w,'hint');answer(w,fmt(oracle(l,l.make(4+j).rows,4+j)[j]));click(w,'next');}
 assert.match(w.document.querySelector('#work h2').textContent,/пройдена/);assert.deepEqual(JSON.parse(w.localStorage.getItem(key)).results,['first','first','help']);
 if(i<25){const saved=w.localStorage.getItem(key);click(w,'advance');assert.equal(w.document.querySelector('#lesson').value,'55-'+(i+2));dom.window.close();dom=open(id,saved);w=dom.window;}
 click(w,'again');assert.equal(JSON.parse(w.localStorage.getItem(key)).variant,7);dom.window.close();
}
console.log(answers+' math checks and 26 complete independent lessons with recovery, save and chapter links');
