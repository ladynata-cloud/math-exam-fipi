'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const root=path.join(__dirname,'..'),dir='trainers/merzlyak9-2014/',read=file=>fs.readFileSync(path.join(root,file),'utf8');
const models=vm.createContext({window:{}});
require('./public-page-script.cjs').loadSchoolModels(root,read('school/index.html'),models);
const book=models.window.WorkshopCurriculum.books.find(b=>b.id==='source-93');
assert.equal(book.source.sha256,'35ff5da97b8b42439b89a235db47ab2c20acf5500f88d04b76b50e6b50c11a87');assert.equal(book.source.pages,275);assert(book.note.includes('978-5-360-05509-9'));
const pages=[3, 5, 11, 13, 19, 27, 28, 30, 35, 43, 51, 57, 61, 68, 69, 74, 80, 87, 91, 92, 97, 102, 109, 116, 117, 122, 129, 130, 132, 135, 147, 153, 163, 175, 177, 178, 186, 195, 195, 203, 207, 214, 223, 225, 227, 237, 250, 254, 259, 266, 268];
assert.deepEqual(Array.from(book.mapping,r=>r.page),pages);
const counts=[6,12,15,5,4,5,4];
const ids=['example',...counts.flatMap((total,i)=>Array.from({length:total},(_,j)=>(i+1)+'-'+(j+1)))];
const originalCount=ids.length;
const moreCounts=[3,2,6,9,9,2,0,0,0,6,3,3,2,3,2,0,0,3,2,3,2,2,2,2,0];
for(const [i,count] of moreCounts.entries()){const n=i+8;if(count)for(let j=1;j<=count;j++)ids.push(n+'-'+j);else ids.push(String(n));}
const printed=ids.map(id=>id==='example'?'Пример':id.replace(/(\d+)-(\d+)/,'$1($2)'));
for(const [i,r] of book.mapping.entries()){
 assert.equal(r.sourcePath,'https://pdf.my-uchebnik.ru/pdf/algebra/00000071.pdf#page='+(r.page+1));
 if(i!==1){assert(r.bookOnly);assert(!r.boardPath&&!r.externalPath);}else{assert.equal(r.coverage,'module');assert.equal(r.boardPath,book.exercises[0].path);}
}
const scripts=['trainers/tyurin-statistics/content.js',...['edition','inequalities','functions','applied','sequences','expressions-2015','expression-figure','substitutions-2015','verbal-models-2015','shape-formulas-2015','review-2015','algebra-figures-2015'].map(f=>dir+f+'.js'),'trainers/tyurin-statistics/app.js'].map(read);
const pure=vm.createContext({window:{}});for(const script of scripts.slice(0,-1))vm.runInContext(script,pure);
function open(entry,stash){
 const dom=new JSDOM(read(dir+'index.html'),{url:'https://math.example'+entry.path,runScripts:'outside-only'}),w=dom.window,doc=w.document;
 w.Math.random=()=>0;w.TextEncoder=TextEncoder;const id=entry.path.split('/').at(-1),key='math:merzlyak9-2014:v1:'+id;
 w.localStorage.setItem('math:peterson8-2017:v1:71-2','preserved');if(stash)w.localStorage.setItem(key,stash);for(const script of scripts)w.eval(script);
 return {dom,w,doc,key,l:w.MathExamTopicPractice.lessons.get(id)};
}
function parseLabel(source){
 // The authored table uses fully parenthesized internal blocks. Re-evaluate its visible labels, independently of the trainer's rational arithmetic.
 const token=source.replace(/−/g,'-').match(/\d+ \d+\/\d+|\d+\/\d+|\d+(?:,\d+)?|[^\s]/g);let cursor=0;
 const parseAtom=()=>{const v=token[cursor++];if(v==='-')return -parseAtom();if(v==='('){const result=expr();assert.equal(token[cursor++],')');return result;}if(v.includes(' ')){const [n,f]=v.split(' '),[p,q]=f.split('/').map(Number);return +n+p/q;}if(v.includes('/')){const [p,q]=v.split('/').map(Number);return p/q;}return Number(v.replace(',','.'));};
 const expr=()=>{let x=parseAtom();while(cursor<token.length&&token[cursor]!==')'){const op=token[cursor++],y=parseAtom();if(op==='+')x+=y;else if(op==='-')x-=y;else if(op==='·')x*=y;else if(op===':')x/=y;else if(op==='^')x**=y;else throw Error(op);}return x;};
 const val=expr();assert.equal(cursor,token.length);return val;
}
function ratio(v){
 for(let d=1;d<100000;d++){const n=Math.round(v*d);if(Math.abs(v*d-n)<1e-8)return[n,d];}throw Error(v);
}
function solveMore(id,s){
 const d=pure.window.MathExamTopicPractice.lessons.get('93-'+id).make(s),r=d.rows.map(x=>x[1]),m=d.plot,[n,j]=id.split('-').map(Number);
 const nums=x=>String(x).replaceAll('−','-').split(/,\s/).map(x=>Number(x.replace(',','.')));
 if(n===8&&j===1||n===9&&j===1){const xs=nums(r[1]);return xs.map(x=>n===8?2*x-3:.4*x+1);}
 if(n===8&&j===2)return[r[0]/3,r[1]/4,r[0]/3+r[1]/4];
 if(n===8)return[3*r[0]-5*r[1],3*r[2],3*r[0]-5*r[1]+3*r[2]];
 if(n===9)return[2*r[0]/7,r[1]/5,2*r[0]/7-r[1]/5];
 if(n===10||n===11){
  const v=Object.fromEntries(r[1].split(', ').map(k=>{const [c,a]=k.split(' = ');return[c,Number(a)];}));
  const {a,b,c,d,m,x,y,z}=v;
  const facts=n===10?[[1,1,7*a+.3],[3,1,5*x*(y-1/3)],[4,0,(a+b)/c],[4,1,(a+b)/4],[1,0,3*m/5+5/(3*m)],[1,0,9*x-5*y+1/z]]:
   [[2,1,a-(b+c)],[1,1,a+b*c],[2,0,x-y/z],[2,1,2*m-10],[1,0,a/b+c/d],[3,1,(a+b)*c],[1,1,a*c+b*c],[4,0,a/(b+4)],[3,1,(a-b)*(c+d)]];
  return facts[j-1];
 }
 if(n===12){
  const [x,y,z]=r;
  switch(j){
   case 1:return[-x,-y,0];case 2:return[1/x,1/y,1];case 3:return[x+y,x+y+2,x+y-3];
   case 4:return[x+y,1/(x+y),-x];case 5:return[1/x,1/y,(x+y)/(x*y)];case 6:return[x*x,x*(x+1),x*(x-1)];
   case 7:return[-y,-x/y,x/y];case 8:return[x+y,1/z,(x+y)/z];case 9:{const [a,b]=nums(x),[p,q]=nums(y);return[a*b,p/q,a*b-p/q];}
  }
 }
 if(n===13){const [x,y]=r;return j===1?[5*x,7*y,5*x+7*y]:[5*y,3*x,5*y-3*x];}
 if(n===14)return[500*r[1],100*r[2],1000*r[0]+500*r[1]+100*r[2]];
 if(n===15||n===16){const [v,u,dist]=r,rate=n===15?u+v:u-v,t=dist/rate;return[rate,t,t*u];}
 if(n===17||n===18){
  const [x,y,z]=r;if(n===17){switch(j){case 1:return[x-y,x+y,3*(x*x-y*y)];case 2:return[x+1,x+2,3*(x+1)];case 3:return[x-2,x-4,x*(x-2)*(x-4)];case 4:return[1000*x,100*y,1000*x+100*y+z];case 5:return[100,100*x,100*x+y];case 6:return[x*3600,y*60,x*3600+60*y+z];}}
  return j===1?[x-3,(x-3)*(x-2),(x-3)*(x-2)*(x-1)*x]:j===2?[x-2,x*(x-2),(x-1)*(x-2)]:[1000*x,100*y,1000*x+100*y];
 }
 if(n===19||n===20){const {a,b,c,d}=m;if(n===19&&j===1)return[a-c,2*a+2*b,a*b-(b-d)*(a-c)];if(n===19&&j===2)return[d-a,d+a+(d-a)+2*(b+c),d*c+a*b];if(n===19)return[3*c+2*d,d,(d/2)**2];if(j===1)return[a-4*c,2*a+2*b+6*d,a*b-(a-4*c)*d];return[b+c+b,3*(c/2),.5*(c/2)**2];}
 if(n===21){const [a,c]=r;return j===1?[a,c,a-c]:j===2?[a/2,c,a/2+c]:[3*c,a,3*a*c];}
 if(n===22){const [v,k]=r;return j===1?[-v,k,-v*k]:[v+v,3*k,2*v+3*k];}
 if(n===23){const mass=r[0],total=mass/.9;return[9,total/10,total];}
 if(n===24){const c=r[0],m=c*5/8,p=1.8*m;return[m,p,c+m+p];}
 if(n===25){const[a,b]=r;return j===1?[a-b,b-a,0]:j===2?[1/a,1/b,1]:[b/a,a/b,1];}
 if(n===26){const x=r[0],right=j===1?4*x+1-x:x*x,left=j===1?3*x+1:x*(x+2*Math.abs(x));return[left,right,Number(left===right)];}
 if(n===27)return[r[0],r[1]/r[0],r[1]];
 if(n===28){const k=r[0];return j===1?[k,-3*k,4*k]:[-5*k,1.5*k,k*(-5+3)];}
 if(n===29){if(j===1){const a=s+2;return[a+9,a-8,2*(a-8)];}const a=(s+1)/10-1;return[a,-1.1,2*a-1.1];}
 if(n===30){if(j===1)return[0,-3,-3];const t=(s+1)/5;return[t+2,-2*t-6,-2];}
 if(n===31){if(j===1){const a=s+2,b=s+4,x=a+b;return[1,x,x+b];}const a=s+3,b=s+5;return[b,a-b,-b/2];}
 const [a,b]=r[2].split(' и ').map(Number);return[r[0],a%r[0],(b-a)/r[0]];
}

function solve(i,s){
 if(i>=originalCount)return solveMore(ids[i],s);
 const id=ids[i],l=pure.window.MathExamTopicPractice.lessons.get('93-'+id),data=l.make(s),vals=data.rows.map(r=>r[1]);
 if(id==='example')return [-vals[0],7*vals[1],-7*vals[0]*vals[1]];
 const x=parseLabel(vals[1]),y=parseLabel(vals[2]),result=parseLabel(vals[0]),A=ratio(x),B=ratio(y),op=data.tree.op;
 if(data.tree.A.op||data.tree.B.op)return[x,y,result];
 if(op==='+'||op==='-'){let d=Math.max(A[1],B[1]);while(d%A[1]||d%B[1])d++;return[Math.round(x*d),Math.round(y*d),result];}
 if(op==='^')return[A[0]**y,A[1]**y,result];
 return op==='*'?[A[0]*B[0],A[1]*B[1],result]:[A[0]*Math.sign(B[0])*B[1],A[1]*Math.abs(B[0]),result];
}
const originals=['140', '1869/500', '6/5', '27/50', '9/10', '800', '9/4', '7/6', '13/63', '1/10', '8', '6/5', '1/6', '22', '157/24', '22/5', '179/63', '85/8', '3/10', '13/10', '0', '-61/100', '86/5', '-3/2', '-39/5', '12/5', '-7', '-16/5', '3/5', '0', '3/10', '-4/5', '1/8', '16/9', '463/27', '5/4', '-3/10', '-4/3', '1', '58/5', '5/4', '22/5', '-7/10', '-2', '-191/2', '7', '16', '136', '3/4', '-8', '14/5', '-8'];
const action=(doc,k)=>doc.querySelector('[data-action="'+k+'"]').click();
function send(doc,v){const a=doc.querySelector('#answer'),E=doc.defaultView.Event;a.value=String(v);a.dispatchEvent(new E('input',{bubbles:true}));doc.querySelector('#work form').dispatchEvent(new E('submit',{bubbles:true,cancelable:true}));}
assert.equal(book.exercises.length,ids.length);
for(const [i,r] of book.exercises.entries()){
 const id='93-'+ids[i];assert.equal(r.path,'/'+dir+'index.html#lesson/'+id);assert.equal(r.boardPath,r.path);assert.equal(r.printed,printed[i]);assert.equal(r.page,ids[i]==='example'||parseInt(ids[i])<=2?6:parseInt(ids[i])<=7?7:parseInt(ids[i])<=14?8:parseInt(ids[i])<=19?9:parseInt(ids[i])<=26?10:11);
 let {dom,w,doc,key,l}=open(r);
 assert.equal(doc.querySelector('#lesson').value,id);assert.equal(doc.querySelectorAll('#lesson option').length,150);
 assert.equal(doc.querySelector('#source').href,'https://pdf.my-uchebnik.ru/pdf/algebra/00000071.pdf#page='+(r.page+1));assert.equal(doc.querySelector('#back').hash,'#book/source-93');
 assert.equal(new URL(doc.querySelector('#board').href).searchParams.get('trainer'),r.path);assert.equal(w.MathExamTopicEdition.nextId(l),ids[i+1]&&'93-'+ids[i+1]);assert.equal(r.title,l.title);
 if(i>0&&i<originalCount){const m=l.printedGuide.match(/(?:получится|получается|Ответ) ([−-]?\d+(?:\/\d+)?)\.$/i);if(m)assert.equal(parseLabel(m[1]),parseLabel(originals[i]),id+' printed answer');else{const all=l.printedGuide.match(/= ([−-]?\d+(?:\/\d+)?)\.$/);assert(all,id);assert.equal(parseLabel(all[1]),parseLabel(originals[i]),id+' printed answer');}}
 const variants=new Set();for(let s=1;s<=11;s++){
  const d=l.make(s),answers=solve(i,s);variants.add(JSON.stringify(d.rows));
  d.questions.forEach((q,j)=>{assert(Math.abs(q.answer-answers[j])<1e-10,id+'/'+s+'/'+j);assert(q.mistakes.length);for(const [bad,msg] of q.mistakes){assert(Math.abs(q.answer-bad)>1e-7,id+'/'+s+'/'+j);assert(msg.length>20);}});
  assert(w.MathExamTopicEdition.figure(d).includes('role="img"'));
 }
 assert.equal(variants.size,11,id);assert.deepEqual(JSON.parse(w.localStorage.getItem(key)).results,[]);
 action(doc,'printed-guide');assert(doc.querySelector('#work').textContent.includes(l.printedGuide));action(doc,'practice');send(doc,88888888);
 const stash=w.localStorage.getItem(key);dom.window.close();({dom,w,doc,key,l}=open(r,stash));assert.equal(doc.querySelector('#answer').value,'88888888');
 send(doc,solve(i,2)[2]);action(doc,'next');for(let j=0;j<3;j++){
  if(!j){const [bad,msg]=l.make(4).questions[0].mistakes[0];send(doc,bad);assert(doc.querySelector('#feedback').textContent.includes(msg));}
  if(j===2)action(doc,'hint');send(doc,solve(i,j+4)[j]);action(doc,'next');
 }
 assert.deepEqual(JSON.parse(w.localStorage.getItem(key)).results,['fixed','first','help']);action(doc,'again');assert.equal(JSON.parse(w.localStorage.getItem(key)).variant,7);
 assert.equal(w.localStorage.getItem('math:peterson8-2017:v1:71-2'),'preserved');dom.window.close();
}
console.log('Мерзляк‑7, 2015: 51 строка карты, пример и 123 разбора всех №1–32. Проверены 4092 ответа самостоятельных вариантов и восстановление каждого задания.');
