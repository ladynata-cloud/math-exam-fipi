'use strict';
const {JSDOM}=require('jsdom');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const dir=path.join(__dirname,'../trainers/tyurin-statistics'),html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
const scripts=[...html.matchAll(/<script defer src="([^"]+)"/g)].map(m=>m[1]).filter(s=>!s.startsWith('/'));
const src=s=>fs.readFileSync(path.join(dir,s),'utf8');
const math={};math.window=math;vm.createContext(math);
for(const s of scripts.filter(s=>!s.includes('bridge')&&s!=='app.js'))vm.runInContext(src(s),math);
const lessons=math.TyurinStats.lessons,f=math.TyurinStats.f;
const sum=a=>a.reduce((t,x)=>t+x,0),mean=a=>sum(a)/a.length;
const num=v=>typeof v==='number'?v:Number(v.replace(',','.'));
const sq=a=>a*a,perm2=n=>n*(n-1),choose=(n,k)=>k===0||k===n?1:choose(n-1,k-1)+choose(n-1,k);
function oracle(lesson,data,s) {
  const r=data.rows,n=r.length,A=r[0],B=r[1],C=r[2],vs=r.map(row=>row[1]),v=mean(vs),D=mean(vs.map(y=>sq(y-v)));
  switch(lesson.id){
    case '113-4':return [Math.abs(A[1]-B[1]),A[2]-A[1],100*((A[2]+B[2])/(A[1]+B[1])-1)];
    case '113-5':return [sum(vs),B[1]/sum(vs),A[1]+C[1]];
    case '113-6':return [10*B[1],Math.max(...vs)-Math.min(...vs),v];
    case '113-9':return [C[1],vs.at(-1)-vs[0],Math.sign(vs.at(-1)-vs[0])];
    case '113-13':return [A[1]-v,sum(vs.map(x=>x-v)),sq(vs.at(-1)-v)];
    case '113-15':return [sum(vs.map(sq)),n*D,D];
    case '113-16':return [A[0]*A[2]+A[3],A[1],A[1]*sq(A[2])];
    case '113-17':return [B[3]-B[1],B[3]-B[1]-A[3]+A[1],mean(B.slice(1))-mean(A.slice(1))];
    case '113-18':return [B[1]+C[1],A[1]/sum(vs),150];
    case '113-19':return [A[1]/2,A[0]-A[1]/2,A[0]+A[1]/2];
    case '113-24':{const loss=x=>x[1]*num(x[2])*x[3];return [A[1]*num(A[2]),loss(B),loss(A)-loss(B)];}
    case '113-35':return [(A[1]+C[1])/sum(vs),0,(A[1]+B[1])/sum(vs)];
    case '113-41':{const total=perm2(A[0]);return [total,1/total,2/total];}
    case '113-43':{const total=choose(sum(vs),2);return [total,choose(A[1],2)/total,A[1]*B[1]/total];}
    case '113-44':{const area=B[1]*B[2],p=area/(A[1]*A[2]);return [area,p,1-p];}
    case '113-55':return [mean(B.slice(1)),sq((A[2]-A[1])/2),1];
    case '113-57':return [A[0],A[0]*sq(A[2]),A[0]*sq(A[2])+A[1]];
    case '113-61':{const p=A[1]/A[0],d=Math.abs(p-A[2]/100);return [p,d,100*d];}
    case '113-62':return [(A[2]+B[2])/2,(A[1]*A[2]+B[1]*B[2])/100,0];
    case '113-63':{const p=num(A[0]),nu=A[2]/A[1];return [nu,p,Math.abs(nu-p)];}
    case '113-65':return [choose(A[0],2),choose(A[0],2)*sq(A[1]),2**A[0]];
    case '113-66':return [choose(A[0],A[0]-A[1]),choose(A[0]+1,A[1]),2**A[0]];
    case '113-67':{const k=2+s%2;return [r[k][2],r[k-1][2]+r[k][2],n+1];}
    case '114-10':{const b=num(A[1])+num(A[2]);return [num(B[1]),b,num(A[2])/b];}
    case '114-11':return [A[1]+B[1],A[2]+B[2],4*A[2]];
    case '114-12':{const row=A[1]+A[2],col=A[1]+B[1],v=row*col/100;return [row,v,v===A[1]?1:0];}
    case '114-13':{const p=num(A[0]),k=A[1],tail=(1-p)**k;return [tail*p/(1-p),tail,1/p];}
    case '114-20':{const D=sq(A[1]),bound=D/sq(A[2]);return [D,bound,1-bound];}
    case '114-21':return [A[1],A[2]/A[0],A[2]/(A[0]*sq(A[3]))];
    case '114-22':{const n=A[0],p=num(A[1]),D=p*(1-p)/n;return [n*p,D,D/sq(num(A[2]))];}
    case '114-23':return [A[2]/A[1],A[0]*A[2]/A[1],A[3]/Math.sqrt(A[1])];
    case '114-28':
    case '114-29':{
      const xs=r.map(row=>row[0]),ys=vs,x=mean(xs),y=mean(ys),cov=sum(r.map(row=>(row[0]-x)*(row[1]-y)));
      const xx=sum(xs.map(i=>sq(i-x))),yy=sum(ys.map(i=>sq(i-y))),k=cov/xx,b=y-k*x;
      return lesson.id==='114-28'?[k,b,ys[1]-k*xs[1]-b]:[cov,cov/Math.sqrt(xx*yy),-cov/Math.sqrt(xx*yy)];
    }
    default:throw Error(lesson.id);
  }
}
let checked=0;
for(const lesson of lessons.values()){
  const unique=new Set();
  for(let s=1;s<=11;s++){
    const data=lesson.make(s), expected=oracle(lesson,data,s);
    assert.equal(new Set(data.questions.map(q=>q.prompt)).size,3);
    for(const [i,q] of data.questions.entries()){
      assert(Math.abs(q.answer-expected[i])<1e-9,lesson.id+' form '+i+' sample '+s);
      assert(q.calculation.length>=2 && q.error.length>13,lesson.id+' '+i+' '+q.calculation);
      const shown=f(q.answer).replace(',','.').split('/').map(Number);
      assert(Math.abs(shown[0]/(shown[1]??1)-q.answer)<1e-9,lesson.id+' worked display');checked++;
    }
    unique.add(JSON.stringify(data.rows));
  }
  assert(unique.size>=2,lesson.id+' fresh input data');
}
function page(id,saved){
 const dom=new JSDOM(html,{url:'https://math.test/trainers/tyurin-statistics/index.html#lesson/'+id,runScripts:'outside-only'}),w=dom.window;
 w.TextEncoder=TextEncoder;w.Math.random=()=>0;if(saved)w.localStorage.setItem('math:tyurin-stats:v1:'+id,saved);
 for(const s of scripts)w.eval(src(s));return dom;
}
function input(w,selector,value){const el=w.document.querySelector(selector);el.value=value;el.dispatchEvent(new w.Event('input',{bubbles:true}));}
function submit(w){w.document.querySelector('form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));}
function action(w,name){w.document.querySelector('[data-action='+name+']').click();}
for(const l of lessons.values()){
 let dom=page(l.id),w=dom.window;const key='math:tyurin-stats:v1:'+l.id;
 assert.equal(w.document.querySelector('#title').textContent,l.title);
 assert.equal(new URL(w.document.querySelector('#board').href).searchParams.get('trainer'),'/trainers/tyurin-statistics/index.html#lesson/'+l.id);
 assert(w.document.querySelector('#related').href.includes('/'));const prev=w.document.querySelector('#work').textContent;
 input(w,'#model','4');assert.notEqual(w.document.querySelector('#work').textContent,prev);
 action(w,'practice');input(w,'#answer','9999999');submit(w);assert.match(w.document.querySelector('#feedback').textContent,/Проверь/);
 const raw=w.localStorage.getItem(key);dom.window.close();dom=page(l.id,raw);w=dom.window;assert.equal(w.document.querySelector('#answer').value,'9999999');
 action(w,'hint');action(w,'hint');input(w,'#answer',f(oracle(l,l.make(2),2)[2]));submit(w);action(w,'next');
 for(let i=0;i<3;i++){
   if(i===2)action(w,'hint');const d=l.make(4+i);
   input(w,'#answer',f(oracle(l,d,4+i)[i]));submit(w);assert.match(w.document.querySelector('#feedback').textContent,/Верно/);action(w,'next');
 }
 assert.match(w.document.querySelector('#work h2').textContent,/пройдена/);assert.deepEqual(JSON.parse(w.localStorage.getItem(key)).results,['first','first','help']);
 action(w,'again');assert.equal(JSON.parse(w.localStorage.getItem(key)).variant,7);dom.window.close();
}
console.log(checked+' independently recalculated questions; '+lessons.size+' full study, practice, mastery and resume journeys');
