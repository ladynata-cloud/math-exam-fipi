'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {JSDOM} = require('jsdom');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const context = vm.createContext({window:{}});
require('./public-page-script.cjs').loadSchoolModels(root,read('school/index.html'),context);
const book = context.window.WorkshopCurriculum.books.find(b=>b.id==='source-89');
assert.equal(book.source.sha256,'d4a9d47bd2a22b069ff4368bb96ce1033d642abbd488da7c8df1c11f765a00ae');
assert.equal(book.source.pages,234);
assert(book.note.includes('978-5-346-04407-9'));
assert.equal(book.mapping.length,66);
const printedPages=[5,11,12,17,21,31,36,42,48,60,74,77,84,89,92,97,103,107,111,113,120,123,124,129,131,134,137,140,144,147,149,151,154,162,165,167,171,174,179,186,190,195,199,203,209,215,217,224];
const paragraphs=book.mapping.filter(r=>/^§ /.test(r.sectionLabel));
assert.deepEqual(Array.from(paragraphs,r=>r.page),printedPages);
for(const [i,row] of paragraphs.entries()) {
  assert.equal(row.sectionLabel,'§ '+(i+1));
  assert.equal(row.sourcePath,'https://pdf.my-uchebnik.ru/pdf/algebra/00000069.pdf#page='+(row.page+1));
  assert.equal(row.coverage,i<6?'module':'source');
  if(i<6)assert.equal(row.externalPath,row.boardPath);
  else assert(row.bookOnly&&!row.externalPath&&!row.boardPath);
}
const dir='trainers/mordkovich-2019/';
const ids=['1-ex1','1-ex2-a','1-ex2-b','1-ex2-c','1-q1','1-q2','1-q3','1-q4','1-q5','1-q6','1-q7','1-q8','1-q9','1-q10','1-q11','1-q12','2-q1-add','2-q1-div','2-q2','2-q3','2-q4','3-ex1','3-ex2','3-q1','3-q2','3-q3','4-ex1','4-ex2','4-q1','4-q2','4-q3','4-q4','4-q5-a','4-q5-b','4-q5-c','4-q6','4-q7','4-q8-a','4-q8-b','5-ex1','5-ex2','5-ex3','5-ex4','5-ex5','5-ex6','5-ex7','5-ex8','5-ex9','5-ex10','5-ex11','5-ex12','5-ex13','6-ex1','6-ex2','6-ex3','6-q1','6-q2','6-q3','6-q4-a','6-q4-b','6-q4-c','6-q4-d','6-q5-rays','6-q5-bounded'];
const printed=[6,9,9,9,10,10,10,10,10,10,11,11,11,11,11,11,12,12,12,12,12,14,15,17,17,17,19,20,21,21,21,21,21,21,21,21,21,21,21,22,22,23,24,25,26,27,27,28,28,29,30,30,32,33,36,36,36,36,36,36,36,36,36,36];
const html=read(dir+'index.html');
const files=[...html.matchAll(/<script defer src="([^"]+)"/g)].map(m=>m[1])
  .filter(x=>!x.startsWith('/')&&!x.includes('board-bridge')).map(x=>read(path.join(dir,x)));
function open(entry,save) {
  const dom=new JSDOM(html,{url:'https://school.example'+entry.path,runScripts:'outside-only'});
  const w=dom.window, key='math:mordkovich-2019:v1:89-'+entry.path.split('89-').pop();
  w.TextEncoder=TextEncoder;w.Math.random=()=>0;
  if(save)w.localStorage.setItem(key,save);
  files.forEach(s=>w.eval(s));
  return {dom,w,doc:w.document,key};
}
function expected(i,s) {
  const u=s+2,v=s+4,a=s+2,b=ids[i]==='1-ex2-a'?s+4:-(s+1);
  const h=s+2,w=s+6,k=s+1, gap=s+3, initial=gap+2*k;
  switch(ids[i]) {
    case '1-ex1':return [-1/3,-3*(u+v),(-3*(u+v))/(5*s+5)];
    case '1-ex2-a':case '1-ex2-b':return [a-b,a*a-b*b,(a*a+2*a*b+b*b)/(a*a-b*b)];
    case '1-ex2-c':return [-a,a,2];
    case '2-q2':return [2*s+8,(s+2)*(s+4),2*s+8-(s+2)*(s+4)];
    case '2-q3':return [h*w,h*k,h*(w+k)];
    case '2-q4':return [h*w,h*k,h*(w-k)];
    case '3-ex1':return [2*k,initial,3*initial];
    case '3-ex2':return [6,2*s+4,3*s+6];
    case '4-ex1':{const x=(s+1)/3+(s+3)/6;return [6,12*x,4*x];}
    case '5-ex1':{const high=3*s+6,low=2*s+4;const total=high*(s+1)/(high-low);return [high*(s+1),total,low*total];}
    case '6-ex1':return [-s-2,-3*s-6,s+2];
    case '6-ex2':{
      const b=(s+1)/(s+6),c=(s+3+s%3)/(s+6),a=(s+8)/(s+6);
      return [Math.abs(c-b),Math.abs(a-c),2*c<a+b?b:a];
    }
    case '4-ex2':{
      const l=(s+3)/5, r=(s+2)/2;
      return [10*l,10*(l-r),((s+1)/5+(s+3)/2)/(l-r)];
    }
    case '4-q1':{const h=s+2, b=(s+1)*h+s+3;return [h,b,-b/h];}
    case '4-q2':return [1-2*s,s+2,-s];
    case '4-q3':return [(s+2)*(s+1),s+2,0];
    case '4-q4':return [2,s+1,1];
    case '4-q5-a':case '4-q5-b':case '4-q5-c':{
      const root=ids[i]==='4-q5-a'?0:ids[i]==='4-q5-b'?s+1:-s-1;
      return [(s+2)*root,s+4,(s+2)*(root+1)+s+4];
    }
    case '4-q6':return [-2*s-5,-s-2,(2*s+5)/(s+2)];
    case '4-q7':return [-s-3,-(s+2)*(s+3),s+2];
    case '4-q8-a':return [s+2,s+3,0];
    case '4-q8-b':return [3*s+4,s+2,2*s+2];
    case '5-ex2':{
      const t=2+s%3, lead=t*(s+2)-(s+3), pedestrian=(t*(s+2)-lead)/(t+1-t);
      return [t+1,pedestrian,pedestrian*(t+1)];
    }
    case '5-ex3':{
      const t=s+2+30/60, x=s+5, flow=1+s%3;
      return [t,t*(x+flow)+1.5*(x-flow)-x*(t+1.5),x];
    }
    case '5-ex4':{
      const v=s+2, saved=30+15*s, rest=(saved/60)/(1/v-1/(2*v));
      return [saved,rest,v/2+rest];
    }
    case '5-ex5':return [6,2*s+8,3*s+12];
    case '5-ex6':{
      const metres=10*s+40, kph=metres*3600/6000;
      return [metres/6,kph,kph-(2*s+8)];
    }
    case '5-ex7':{
      const d=5+s%3,n=10*(10+s)+d;return [100*d,Math.floor(n/10),n];
    }
    case '5-ex8':{
      const n=(1+s%2)*100000+60000+1001*s;return [Math.floor(n/100000)*100000,n%100000,n];
    }
    case '5-ex9':{
      const a=10*s+20,b=20*s+60;
      return [a,1.2*a-a,1.1*b-b];
    }
    case '5-ex10':{
      const c=3*s+12;return [1+1/5,c+c/4,(1.25*c)/(1.75-1.25*1.2)];
    }
    case '5-ex11':{
      const m=30*s+60,salt=m/5;return [salt,m/10,(salt-0.1*m)/0.3];
    }
    case '5-ex12':{
      const m=50*(s+2),r=20*(s+2),lost=r*(5+5*(s%3))/100,d=4+2*(s%4);
      const x=(lost*100+(m-r)*d)/r;
      return [lost,x,m*x/100-lost];
    }
    case '5-ex13':{
      const m=40*s+40,p=2*s+2,pure=m/2*(1-p/100);
      return [100-p,pure,(m-pure)/m*100];
    }
    case '6-ex3':{
      const n=2*s+1, good=s+1+s-Math.floor((2*s-1)/3)-1;
      return [n,good,good/n];
    }
    case '6-q1':{const h=s+1,t=2+s%3;return [-2*h,t*h,(t+2)*h];}
    case '6-q2':{const a=-s-3,b=2*s,h=(b-a)/3;return [h,b-h,a-h];}
    case '6-q3':return [2*s+1,-s,s+0.5];
    case '6-q4-a':case '6-q4-b':case '6-q4-c':case '6-q4-d':{
      const coords={'6-q4-a':[s+1,2*s+3],'6-q4-b':[-s-2,-2*s-3],'6-q4-c':[-s-1,s+3],'6-q4-d':[s+4,-2*s]}[ids[i]];
      const lo=Math.min(...coords),hi=Math.max(...coords);return [lo,hi-lo,hi+s+1-lo];
    }
    case '6-q5-rays':return [s-7,s-6,s-8];
    case '6-q5-bounded':{
      const values=Array.from({length:2*s+3},(_,k)=>k-s),b=s+2;
      return [values.length,values.filter(x=>x>-s&&x<b).length,values.filter(x=>x<b).length];
    }
    case '1-q1':return [2*s+7,s+2,(2*s+7)*(s+2)];
    case '1-q2':return [s+3,2*s+4,0];
    case '1-q3':return [s+3,(s+3)*(s+2)+s+1,s+3];
    case '1-q4':return [(s+2)**2,-(s+1)*(s+2),s+2];
    case '1-q5':return [-s-3,s+4,0];
    case '1-q6':return [s+4,s+2,(s+4)*(s+2)];
    case '1-q7':return [4*s+3,10*s+10,13*s+12];
    case '1-q8':return [4*s+12,100*s+100,(4*s+12)*25*(s+1)];
    case '1-q9':return [s+2,(s+1)*(s+2),s+4];
    case '1-q10':return [0,s+1,3];
    case '1-q11':return [2,s+4,(s+5)/2];
    case '1-q12':return [-s-3,s+2,2];
    case '2-q1-add':{const d=(s+2)*(2+s%3);return [d/(s+2),3+s%3,1/(s+2)+1/d];}
    case '2-q1-div':return [s+3,(s+2)*(s+3),(s+2)/(s+5)/(1/(s+3))];
    case '3-q1':return [2*s+6,4*s+9,s+1];
    case '3-q2':return [s+3,(s+2)*(s+1),s+3+(s+2)*(s+1)];
    case '3-q3':{const cap=s+3,n=(s+2)*cap+1;return [Math.floor(n/cap),n%cap,Math.ceil(n/cap)];}
    default:throw new Error('Unexpected lesson');
  }
}
assert.equal(book.exercises.length,ids.length);
for(const [i,entry] of book.exercises.entries()){
  const id='89-'+ids[i],{dom,w,doc,key}=open(entry);
  assert.equal(entry.path,'/'+dir+'index.html#lesson/'+id);
  assert.equal(entry.path,entry.boardPath);assert.equal(entry.page,printed[i]);
  assert.equal(doc.querySelector('#lesson').value,id);
  assert.equal(doc.querySelector('#back').hash,'#book/source-89');
  assert.equal(doc.querySelector('#source').href,'https://pdf.my-uchebnik.ru/pdf/algebra/00000069.pdf#page='+(printed[i]+1));
  assert.equal(new URL(doc.querySelector('#board').href).searchParams.get('trainer'),entry.path);
  const lesson=w.MathExamTopicPractice.lessons.get(id);
  assert.equal(lesson.title,entry.title);
  assert.equal(w.MathExamTopicEdition.nextId(lesson),ids[i+1]&&'89-'+ids[i+1]);
  const variants=new Set();
  for(let s=1;s<=11;s++){
    const data=lesson.make(s), answers=expected(i,s);variants.add(JSON.stringify(data.rows));
    data.questions.forEach((q,j)=>{
      assert(Math.abs(q.answer-answers[j])<1e-8,id+' '+s+' '+j);
      for(const [bad,message] of q.mistakes){assert(Math.abs(bad-q.answer)>1e-7);assert(message.length>25);}
    });
    assert(w.MathExamTopicEdition.figure(data).includes('role="img"'));
  }
  assert.equal(variants.size,11);
  assert.deepEqual(JSON.parse(w.localStorage.getItem(key)).results,[]);
  doc.querySelector('[data-action="practice"]').click();
  const input=doc.querySelector('#answer');input.value='99875';input.dispatchEvent(new w.Event('input',{bubbles:true}));
  const saved=w.localStorage.getItem(key);
  const reopened=open(entry,saved);
  assert.equal(reopened.doc.querySelector('#answer').value,'99875');
  assert.deepEqual(JSON.parse(reopened.w.localStorage.getItem(key)).results,[]);
  const current=reopened.doc;
  const action=name=>current.querySelector('[data-action="'+name+'"]').click();
  function send(value){
    const a=current.querySelector('#answer');
    a.value=Number.isInteger(value)?String(value):value.toFixed(9);
    a.dispatchEvent(new reopened.w.Event('input',{bubbles:true}));
    current.querySelector('#work form').dispatchEvent(new reopened.w.Event('submit',{bubbles:true,cancelable:true}));
  }
  send(expected(i,2)[2]);action('next');
  for(let q=0;q<3;q++){
    if(q===0){
      const [wrong,message]=lesson.make(4).questions[q].mistakes[0];
      send(wrong);
      assert(current.querySelector('#feedback').textContent.includes(message));
    }
    if(q===2)action('hint');
    send(expected(i,q+4)[q]);action('next');
  }
  assert.deepEqual(JSON.parse(reopened.w.localStorage.getItem(key)).results,['fixed','first','help']);
  action('again');
  assert.notEqual(JSON.parse(reopened.w.localStorage.getItem(key)).variant,0);
  reopened.dom.window.close();dom.window.close();
}
console.log('Source 89: 48 printed paragraphs, 64 student routes, 2112 independently checked questions and 64 personal draft round trips.');
