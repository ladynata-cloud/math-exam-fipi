'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),folder='trainers/peterson7-2011/',read=p=>fs.readFileSync(path.join(root,p),'utf8');
const catalog=vm.createContext({window:{}});
require('./public-page-script.cjs').loadSchoolModels(root,read('school/index.html'),catalog);
const html=read(folder+'index.html');
const scripts=[...html.matchAll(/<script defer src="([^"]+)"/g)].map(m=>m[1]).filter(src=>!src.startsWith('/')&&!src.includes('board-bridge')).map(src=>read(path.join(folder,src)));
const books=catalog.window.WorkshopCurriculum.books;
const letters='абвгдежз',letterKeys='abcdefgh';
const letterNumbers=(n,k)=>Array.from({length:k},(_,i)=>[n+letterKeys[i],n+letters[i]]);
const plans=[
  {book:102,count:155,hash:'91997f47edb243ebdad947970dbe26919c45f13e79aacf2713f6eaa27b6c711a',file:'00000006',pages:[3,10,19,25,32,38,46,52,62,70,80,88,98,107,116,127,136],
   items:[['1a','1а'],['1b-1','1б(1)'],['1b-2','1б(2)'],['1c','1в'],...letterNumbers(2,4),...letterNumbers(3,8)]},
  {book:103,count:219,hash:'957031260835d66d763824274bc17ec50d061d15582849caa19f9a91f8c6420f',file:'00000007',pages:[3,11,20,27,36,46,59,63,76,88,98,114,124,129,137,144,156,168,176,184,190],
   items:[...letterNumbers(1,6),...Array.from({length:4},(_,i)=>['2-1'+letterKeys[i],'2(1)'+letters[i]]),['2-2','2(2)'],['2-3','2(3)'],['2-4','2(4)'],...letterNumbers(3,4)]}
];
function open(entry,previous){
 const id=entry.path.split('/').pop(),key='math:peterson7-2011:v1:'+id;
 const dom=new JSDOM(html,{url:'https://math.example'+entry.path,runScripts:'outside-only'}),w=dom.window;w.TextEncoder=TextEncoder;w.Math.random=()=>0;
 if(previous)w.localStorage.setItem(key,previous);for(const js of scripts)w.eval(js);
 return {w,d:w.document,dom,key};
}
function multiply(x,n){let v=1;for(let j=0;j<n;j++)v*=x;return v;}
function expected102(i,d){
 const {kind,a,n,m,den,b,coef,x,y}=d;
 if(i<3)return [n,n-1,multiply(a,n)];
 if(i===3)return [n,multiply(-1,n),multiply(a,n)];
 if(i===4)return [n,multiply(-1,n),multiply(-1/den,n)];
 if(i===5)return [1,-1,-multiply(a,n)];
 if(i===6)return [n+m,multiply(a,n),multiply(-a,n)*multiply(-1,m)];
 if(i===7)return [9*d.whole+d.digit,n,multiply(den,m)];
 if(kind===0||kind===1)return [n,kind?1:n,kind?-multiply(a,n):multiply(-a,n)];
 if(kind===2||kind===3)return [kind===2?n:1,n,multiply(a,kind===2?n:1)*multiply(b,n)];
 if(kind===4||kind===5)return [kind===4?coef*coef*multiply(2,m):-coef*2,2,m];
 return [kind===6?x-y:y,n,kind===6?multiply(x-y,n):x-multiply(y,n)];
}
function expected103(d){
 const xs=Array.from(d.xs),ys=Array.from(d.ys),pairs=Array.from(d.pairs,p=>Array.from(p));
 const outputs=x=>new Set(pairs.filter(p=>p[0]===x).map(p=>p[1]));
 const functional=Number(xs.every(x=>outputs(x).size===1));
 if(d.family==='formula'||d.family==='ticket'){
   const rules=[x=>d.c*x,x=>x/d.c,x=>d.c/x,x=>d.c*x*x,x=>d.c+x,()=>d.c];
   const expected=xs.map(rules[d.kind]);for(let j=0;j<xs.length;j++)assert(Math.abs(pairs[j][1]-expected[j])<1e-8);
   return expected;
 }
 if(d.family==='relation')return [outputs(d.focus).size,functional,ys.filter(y=>pairs.every(p=>p[1]!==y)).length];
 return [new Set(pairs.map(p=>p[0])).size,new Set(pairs.map(p=>p[1])).size,functional];
}
const marks102=['4⁷','n множителей','a¹ = a','−8/27','−1/343','−(9,4)⁵','(−1)⁶','(26/9)⁴ · (5/6)⁷','(−y)⁴ = y⁴','−y⁴','(ab)⁶ = a⁶b⁶','ab⁶','200m²n³','−10m²n³','(p − q)⁵','p − q⁵'];
const marks103=['3, 9, 15, 9','1/2, 2, 0, −2','4, −4, 2, −2','5, 5, 0, 20','3, 0, 4, 6','7, 7, 7, 7','1→7, 2→4, 4→12, 6→9','к 11 и к 12','5 и 6 переходят в 7','аргумента 1','количество одинаковых билетов','единственное значение','различные выходы','{−2, −1, 0, 1, 3}','0,1 и 0,3','{−3, −1}','{4, 5, 6}'];
const click=(doc,action)=>doc.querySelector('[data-action="'+action+'"]').click();
let num=0;
for(const p of plans){
 const book=books.find(b=>b.id==='source-'+p.book);
 assert.equal(book.source.pages,p.count);assert.equal(book.source.sha256,p.hash);
 assert.deepEqual(Array.from(book.mapping,r=>r.page),p.pages);
 for(const [i,r] of book.mapping.entries()){
   assert.equal(r.sourcePath,'https://pdf.my-uchebnik.ru/pdf/mathematics/'+p.file+'.pdf#page='+(r.page+2));
   if(i){assert.equal(r.bookOnly,true);assert(!r.boardPath&&!r.externalPath);}else{assert.equal(r.coverage,'partial');assert.equal(r.boardPath,book.exercises[0].path);}
 }
 assert.deepEqual(Array.from(book.exercises,r=>[r.path.split('/').pop(),r.printed]),p.items.map(([k,printed])=>[p.book+'-'+k,printed]));
 for(const [i,entry] of book.exercises.entries()){
   let {w,d,dom,key}=open(entry);
   const id=p.book+'-'+p.items[i][0],l=w.MathExamTopicPractice.lessons.get(id),course=w.MathExamTopicEdition;
   assert.equal(d.querySelector('#lesson').value,id);
   const options=Array.from(d.querySelectorAll('#lesson option'),x=>x.value);
   assert.deepEqual([101,102,103].map(b=>options.filter(x=>x.startsWith(b+'-')).length),[69,16,17]);
   assert.equal(d.querySelector('#back').hash,'#book/source-'+p.book);
   assert.equal(d.querySelector('#source').href,'https://pdf.my-uchebnik.ru/pdf/mathematics/'+p.file+'.pdf#page='+(entry.page+2));
   assert(d.querySelector('#edition').textContent.includes('часть '+(p.book-100)));
   assert.equal(d.querySelector('#board').href.includes(encodeURIComponent(entry.path)),true);
   assert.equal(l.printedReference,'Упражнение №'+entry.printed);assert.equal(l.page,entry.page);assert.equal(l.title,entry.title);
   assert(l.printedGuide.includes((p.book===102?marks102:marks103)[i]),id);
   assert.equal(course.nextId(l),p.items[i+1]&&p.book+'-'+p.items[i+1][0]);
   assert(!d.querySelector('#work').textContent.includes(l.printedGuide));click(d,'printed-guide');assert(d.querySelector('#work').textContent.includes(l.printedGuide));
   const seen=new Set();for(let s=1;s<=11;s++){
     const model=l.make(s),answers=p.book===102?expected102(i,model):expected103(model);
     seen.add(JSON.stringify([model.caption,model.rows,model.pairs,model.groups]));
     for(const [j,task] of model.questions.entries()){
       assert(Math.abs(task.answer-answers[j])<1e-7,id+'/'+s+'/'+j);
       assert(task.calculation.trim().length>0&&task.error.length>=12,id+' '+s+' '+j+' '+task.calculation+' '+task.error);for(const [wrong,msg] of task.mistakes){assert(Math.abs(wrong-task.answer)>0.00000051,id+' '+wrong+' '+task.answer);assert(msg.length>=20);}
       num++;
     }
     assert(course.figure(model).includes('role="img"'));
   }
   assert.equal(seen.size,11,id+' fresh data');
   click(d,'practice');const input=d.querySelector('#answer');input.value='-12345';input.dispatchEvent(new w.Event('input',{bubbles:true}));
   const first=JSON.parse(w.localStorage.getItem(key));assert.equal(first.draft,'-12345');assert.deepEqual(first.results,[]);
   const saved=w.localStorage.getItem(key);dom.window.close();
   ({w,d,dom,key}=open(entry,saved));assert.equal(d.querySelector('#answer').value,'-12345');assert.equal(w.localStorage.length,1);
   dom.window.close();
 }
}
assert.equal(num,1089);
console.log('Two physically matched Peterson grade 7 volumes, 38 mapped points/checkpoints, 33 original lessons, 1089 independent answer checks.');
