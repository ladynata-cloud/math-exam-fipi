'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const root=path.join(__dirname,'..'),dir='trainers/vilenkin-analysis-2014/',read=file=>fs.readFileSync(path.join(root,file),'utf8');
const models=vm.createContext({window:{}});
require('./public-page-script.cjs').loadSchoolModels(root,read('school/index.html'),models);
const book=models.window.WorkshopCurriculum.books.find(b=>b.id==='source-30');
assert.equal(book.source.sha256,'1404107938af90df5b120e6c0d34c6c8ad2c39e7660cad1d4884b83f0176926a');assert.equal(book.source.pages,353);assert(book.note.includes('978-5-346-02765-2'));
const pages=[5, 9, 11, 14, 16, 20, 21, 22, 24, 27, 31, 36, 37, 40, 44, 47, 51, 54, 57, 59, 60, 61, 65, 69, 73, 74, 78, 81, 82, 86, 89, 93, 95, 98, 101, 104, 108, 110, 112, 114, 117, 122, 125, 128, 132, 133, 137, 140, 141, 141, 144, 147, 149, 150, 154, 155, 159, 162, 164, 168, 171, 172, 175, 177, 178, 181, 183, 186, 189, 190, 192, 195, 203, 205, 207, 209, 211, 217, 219, 222, 223, 224, 229, 231, 232, 234, 237, 241, 243, 247, 251, 252, 254, 257, 263, 265, 268, 270, 273, 276, 278, 283, 285, 288, 291, 294, 298, 302, 304, 309, 312, 314, 315, 317, 320, 323, 325, 327, 328, 331, 332, 334, 339];
assert.deepEqual(Array.from(book.mapping,r=>r.page),pages);
const ids=["1-1", "1-2", "1-3", "1-4", "2-1", "2-2", "2-3", "2-4", "3", "4", "5", "6", "7-1", "7-2", "7-3", "7-4", "7-5", "7-6"],printed=["1 (1)", "1 (2)", "1 (3)", "1 (4)", "2 (1)", "2 (2)", "2 (3)", "2 (4)", "3", "4", "5", "6", "7 (1)", "7 (2)", "7 (3)", "7 (4)", "7 (5)", "7 (6)"];
ids.push("8-1","8-2","8-3","8-4","8-5","8-6","9","10","11","12","13","14");printed.push("8 (1)","8 (2)","8 (3)","8 (4)","8 (5)","8 (6)","9","10","11","12","13","14");
for(const [i,r] of book.mapping.entries()){
 assert.equal(r.sourcePath,'https://pdf.my-uchebnik.ru/pdf/algebra/00000023.pdf#page='+(r.page+1));
 if(i){assert(r.bookOnly);assert(!r.boardPath&&!r.externalPath);}else{assert.equal(r.coverage,'module');assert.equal(r.boardPath,book.exercises[0].path);}
}
const scripts=['trainers/tyurin-statistics/content.js',dir+'irrationality.js',dir+'decimal-bounds.js',dir+'antiderivatives.js','trainers/tyurin-statistics/app.js'].map(read);
function open(entry,stash){
 const dom=new JSDOM(read(dir+'index.html'),{url:'https://math.example'+entry.path,runScripts:'outside-only'}),w=dom.window,doc=w.document;
 w.Math.random=()=>0;w.TextEncoder=TextEncoder;const id=entry.path.split('/').at(-1),key='math:vilenkin-analysis-2014:v1:'+id;
 w.localStorage.setItem('math:peterson8-2017:v1:71-2','preserved');if(stash)w.localStorage.setItem(key,stash);for(const script of scripts)w.eval(script);
 return {dom,w,doc,key,l:w.MathExamTopicPractice.lessons.get(id)};
}
function solve(i,s){
 const n=s+2;
 if(i<8){const k=i<4?2:3,power=k*(1+s%3)+1;return [power%k,k-power%k,k*(s+1)];}
 if(i===8||i===9)return [n**(i===8?2:3),1,1];
 if(i===10){const p=n,r=p+1,d=(2*p+r)**2-8*p*r;return [d,Math.sqrt(d),r/2];}
 if(i===11)return [0,3,2*n];
 if(i>=18&&i<24){
  const p=5.1+s/5,a=Math.sqrt(s+1),b=Math.sqrt(s+2),r=Math.sqrt;
  const x=[a+b,a-b,r(2+r(p)),r(r(p)-2),r((3+a)*(2+r(3))),r(3+a)/Math.PI][i-18];
  return [x-Math.floor(x),Math.floor(x*10000)/10000,Math.ceil(x*10000)/10000];
 }
 if(i===24){const m=2+s%3,k=s+2,e=k*10**(-m);let n=1;while(k/10**n>=e-1e-12)n++;return [n-1,n,10];}
 if(i===25){const a=Math.hypot(3*(s+1),4*(s+1)),b=Math.hypot(5*(s+2),12*(s+2));return [a,a*b,2*a+2*b];}
 if(i===26)return [3+s%3,1+s%8,0];
 if(i===27){const a=(25+s)/100,b=a+2*(s+1)/1000,m=(b+a)/2;return [m,b-m,(m+a)/2];}
 if(i===28){const d=3+s%6;return [d,d/9,(9*(20+s)+d)/9];}
 if(i===29){const d=2+s%4,p=6+s%3,w=7+s%3;return [d,d/90,(90*w+9*p+d)/90];}
 const j=i-11,negative=j%2===0,whole=j<=2?n:0,units=j<=4?1009+11*s:21+s,tail=3+s%5;
 const value=(negative?-1:1)*((whole*10000+units)*100+tail)/1e6;
 return [value-Math.floor(value),Math.floor(value*1e4)/1e4,Math.ceil(value*1e4)/1e4];
}
const action=(doc,k)=>doc.querySelector('[data-action="'+k+'"]').click();
function send(doc,v){const a=doc.querySelector('#answer'),E=doc.defaultView.Event;a.value=String(v);a.dispatchEvent(new E('input',{bubbles:true}));doc.querySelector('#work form').dispatchEvent(new E('submit',{bubbles:true,cancelable:true}));}
assert.equal(book.exercises.length,ids.length);
for(const [i,r] of book.exercises.entries()){
 const id='30-'+ids[i];assert.equal(r.path,'/'+dir+'index.html#lesson/'+id);assert.equal(r.boardPath,r.path);assert.equal(r.printed,printed[i]);assert.equal(r.page,i<18?8:9);
 let {dom,w,doc,key,l}=open(r);
 assert.equal(doc.querySelector('#lesson').value,id);assert.equal(doc.querySelectorAll('#lesson option').length,42);
 assert.equal(doc.querySelector('#source').href,'https://pdf.my-uchebnik.ru/pdf/algebra/00000023.pdf#page='+(r.page+1));assert.equal(doc.querySelector('#back').hash,'#book/source-30');
 assert.equal(new URL(doc.querySelector('#board').href).searchParams.get('trainer'),r.path);assert.equal(w.MathExamTopicEdition.nextId(l),ids[i+1]&&'30-'+ids[i+1]);assert.equal(r.title,l.title);
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
console.log('Vilenkin advanced grade 10: 121 numbered source topics and two supplements, 30 exact practice entries through exercise 14, 990 independent answers.');
