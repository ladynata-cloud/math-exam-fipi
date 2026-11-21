'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const root=path.join(__dirname,'..'),dir='trainers/nikolsky-algebra-7-9/',read=file=>fs.readFileSync(path.join(root,file),'utf8');
const models=vm.createContext({window:{}});
require('./public-page-script.cjs').loadSchoolModels(root,read('school/index.html'),models);
const book=models.window.WorkshopCurriculum.books.find(b=>b.id==='source-75');
assert.equal(book.source.sha256,'f1e6b585cc9c6c4a9cbe17e782ae37128ee032744b3f6a5a8ac2301a8a5fa95b');assert.equal(book.source.pages,305);assert(book.note.includes('978-5-09-027740-2'));
const pages=[5, 11, 14, 19, 22, 26, 30, 33, 35, 39, 41, 45, 48, 51, 58, 60, 62, 66, 69, 74, 76, 80, 85, 87, 91, 94, 96, 99, 101, 104, 107, 111, 114, 119, 126, 129, 131, 133, 138, 143, 146, 149, 150, 155, 157, 163, 167, 169, 173, 175, 178, 184, 188, 191, 195, 201, 203, 210, 213, 218, 222, 224, 228, 232, 283, 285, 288, 290, 292];
assert.deepEqual(Array.from(book.mapping,r=>r.page),pages);
const ids=[[1,2],[2,2],[3,6],[4,6],[5,8],[6,6],[7,6],[8,4],[9,4],[10,6],[11,6],[12,6],[13,12],[14,3],[15,2],[16,2],[17,2],[18,1],[19,3]].flatMap(([n,len])=>Array.from({length:len},(_,i)=>n===18?'18':n+'-'+String.fromCharCode(97+i)));
const printed=ids.map(id=>id.replace(/-([a-l])$/,(_,c)=>'абвгдежзиклм'[c.charCodeAt(0)-97]));
for(const [i,r] of book.mapping.entries()){
 assert.equal(r.sourcePath,'https://pdf.my-uchebnik.ru/pdf/algebra/00000055.pdf#page='+(r.page+1));
 if(i){assert(r.bookOnly);assert(!r.boardPath&&!r.externalPath);}else{assert.equal(r.coverage,'module');assert.equal(r.boardPath,book.exercises[0].path);}
}
const scripts=['trainers/tyurin-statistics/content.js',dir+'natural-numbers.js',dir+'grouping.js',dir+'inequality-data.js',dir+'inequalities.js',dir+'inequality-operations.js',dir+'inequality-proofs.js',dir+'intervals.js',dir+'interval-order.js',dir+'linear-inequality-data.js',dir+'linear-inequalities.js',dir+'figure.js','trainers/tyurin-statistics/app.js'].map(read);
const pure=vm.createContext({window:{}});for(const script of scripts.slice(0,-1))vm.runInContext(script,pure);
function open(entry,stash){
 const dom=new JSDOM(read(dir+'index.html'),{url:'https://math.example'+entry.path,runScripts:'outside-only'}),w=dom.window,doc=w.document;
 w.Math.random=()=>0;w.TextEncoder=TextEncoder;const id=entry.path.split('/').at(-1),key='math:nikolsky-algebra-7-9:v1:'+id;
 w.localStorage.setItem('math:peterson8-2017:v1:71-2','preserved');if(stash)w.localStorage.setItem(key,stash);for(const script of scripts)w.eval(script);
 return {dom,w,doc,key,l:w.MathExamTopicPractice.lessons.get(id)};
}
function solve(i,s){
  const id=ids[i],data=pure.window.MathExamTopicPractice.lessons.get('75-'+id).make(s),vals=data.rows.map(r=>r[1]);
  const parse=v=>{const [a,b=1]=String(v).split('/').map(Number);return a/b;};
  if(id.startsWith('1-')){
    const nums=vals.map(v=>v.split(' < ').map(Number));
    const op=id==='1-a'?(a,b)=>a+b:(a,b)=>a*b;
    const L=op(nums[0][0],nums[1][0]),R=op(nums[0][1],nums[1][1]);return [L,R,R-L];
  }
  if(id.startsWith('2-')){const [a,b]=vals;return [a-b,Math.abs(a-b),Number(a>=b)];}
  const n=Number(id.split('-')[0]);
  if(n>=6&&n<=12){
    const [a,b,op]=vals,sign={'<':-1,'>':1,'≤':-2,'≥':2}[op];let left,right;
    if(n===6){left=a+vals[3];right=b+vals[3];}
    if(n===7||n===11){left=a*vals[3];right=b*vals[3];}
    if(n===8){left=a+vals[3];right=b+vals[4];}
    if(n===9){left=a*vals[3];right=b*vals[4];}
    if(n===10){left=0-a;right=0-b;}
    if(n===12){left=1/a;right=1/b;}
    assert(Math.sign(left-right)===Math.sign(sign)*(n>=10?-1:1));return [left,right,sign*(n>=10?-1:1)];
  }
  if(n===13){const [a,b]=vals;return [a*a,b*b,Math.sign(Math.abs(a)-Math.abs(b))];}
  if(n===14){const [a,b,c,d]=vals;return [Math.abs(a-b),Math.abs(c-d),Math.abs(a-b)+Math.abs(c-d)];}
  if(n===15){const [a,b,c,d]=vals;return [c*d,(a/d)*c*d,(a/d-b/c)*c*d];}
  if(n===16){const [a,b]=vals;return id==='16-a'?[Math.abs(a),Math.abs(b),a*a-b*b]:[a*b,b-a,1/a-1/b];}
  if(n===17){const [a,b,c]=vals;return [b-a,c-b,Number(id==='17-a'?a<=b:a<b)+Number(id==='17-a'?b<c:b<=c)];}
  if(n===18){
    const m=vals.map(row=>row.split(' · ').map(Number)),byRow=m.map(x=>x.toSorted((a,b)=>b-a)[0]),byCol=m[0].map((_,j)=>m.map(r=>r[j]).toSorted((a,b)=>a-b)[0]);
    const lo=byRow.toSorted((a,b)=>a-b)[0],hi=byCol.toSorted((a,b)=>b-a)[0];return [lo,hi,lo-hi];
  }
  if(n===19){
    if(id==='19-c'){
      const [lo,hi]=vals.map(parse);
      for(let den=1;den<100;den++){const nums=Array.from({length:den},(_,k)=>k).filter(k=>k/den>lo&&k/den<hi);if(nums.length){assert.equal(nums.length,1);return [den,nums[0],den];}}
      assert.fail('no internal fraction');
    }
    const [fixed,lo,hi]=vals,found=[];const gcd=(a,b)=>b?gcd(b,a%b):a;
    for(let j=lo+1;j<hi;j++)if(gcd(j,fixed)===1)found.push(j);return [found[0],found.at(-1),found.length];
  }
  const den=vals.pop(),pts=vals.map(parse),a=pts[0],b=pts.at(-1);
  if(id.startsWith('3-'))return [Math.round(a*den),Math.round((a-b)*den),Math.sign(a-b)];
  if(id.startsWith('4-'))return [Math.round(Math.min(a,b)*den),Math.round((a+b)*den),(a+b)/2];
  return [Math.abs(a-pts[1]),Math.abs(b-pts[1]),Math.abs(a-b)];
}
const action=(doc,k)=>doc.querySelector('[data-action="'+k+'"]').click();
function send(doc,v){const a=doc.querySelector('#answer'),E=doc.defaultView.Event;a.value=String(v);a.dispatchEvent(new E('input',{bubbles:true}));doc.querySelector('#work form').dispatchEvent(new E('submit',{bubbles:true,cancelable:true}));}
assert.equal(book.exercises.length,ids.length);
for(const [i,r] of book.exercises.entries()){
 const id='75-'+ids[i];assert.equal(r.path,'/'+dir+'index.html#lesson/'+id);assert.equal(r.boardPath,r.path);assert.equal(r.printed,printed[i]);assert.equal(r.page,Number(ids[i].split('-')[0])<=10?9:10);
 let {dom,w,doc,key,l}=open(r);
 assert.equal(doc.querySelector('#lesson').value,id);assert.equal(doc.querySelectorAll('#lesson option').length,255);
 assert.equal(doc.querySelector('#source').href,'https://pdf.my-uchebnik.ru/pdf/algebra/00000055.pdf#page='+(r.page+1));assert.equal(doc.querySelector('#back').hash,'#book/source-75');
 assert.equal(new URL(doc.querySelector('#board').href).searchParams.get('trainer'),r.path);assert.equal(w.MathExamTopicEdition.nextId(l),ids[i+1]&&'75-'+ids[i+1]);assert.equal(r.title,l.title);
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
console.log('Никольский, 8 класс: 69 строк оглавления, 87 исходных упражнений и подпунктов всего п. 1.1, 2871 проверенный ответ и сохранение.');
