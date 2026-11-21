'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const root=path.join(__dirname,'..'),dir='trainers/dorofeev-algebra-7-9/',read=file=>fs.readFileSync(path.join(root,file),'utf8');
const models=vm.createContext({window:{}});
require('./public-page-script.cjs').loadSchoolModels(root,read('school/index.html'),models);
const book=models.window.WorkshopCurriculum.books.find(b=>b.id==='source-96');
assert.equal(book.source.sha256,'9747e71a859899d56fe35089df9e9c046ce5631eb65256b2e26a5d213f69c734');assert.equal(book.source.pages,291);assert(book.note.includes('978-5-09-032509-7'));
const pages=[3, 5, 10, 14, 21, 30, 36, 37, 40, 44, 50, 57, 64, 66, 68, 70, 73, 78, 85, 89, 95, 98, 100, 103, 107, 109, 115, 121, 123, 124, 127, 131, 134, 139, 143, 148, 156, 156, 160, 163, 168, 174, 177, 181, 182, 185, 188, 193, 197, 201, 205, 211, 218, 219, 222, 226, 231, 233, 237, 240, 243, 245, 247, 250, 253, 260, 266, 270, 271, 272, 275, 282, 283];
assert.deepEqual(Array.from(book.mapping,r=>r.page),pages);
const ids=['intro','ex1','ex2','ex3','self1','self2','self3a','self3b','self4a','self4b'];
const heads=['Вводный пример','Пример 1','Пример 2','Пример 3','Вопрос 1','Вопрос 2','Вопрос 3(1)','Вопрос 3(2)','Вопрос 4 · первая пара','Вопрос 4 · вторая пара'];
for(const [i,count] of [4,4,4,2,0,4,0,4,2,2,4,0,2,0,0,0,4,4].entries()){
 const n=i+1;if(count)for(let j=0;j<count;j++)ids.push(String(n)+([13,18].includes(n)?'-'+(j+1):'abcd'[j]));else ids.push(String(n));
 if(n===2)ids.push('sample2');
}
const printed=ids.map((id,i)=>heads[i]||(id==='sample2'?'Образец к №2':id.replace(/([abcd])$/,c=>'абвг'[c.charCodeAt(0)-97]).replace(/-(\d)$/,'($1)')));
for(const [i,r] of book.mapping.entries()){
 assert.equal(r.sourcePath,'https://pdf.my-uchebnik.ru/pdf/algebra/00000072.pdf#page='+(r.page+1));
 if(i!==1){assert(r.bookOnly);assert(!r.boardPath&&!r.externalPath);}else{assert.equal(r.coverage,'module');assert.equal(r.boardPath,book.exercises[0].path);}
}
const scripts=['trainers/tyurin-statistics/content.js',...['fraction-comparison','fraction-properties','algebraic-fractions','figure'].map(f=>dir+f+'.js'),'trainers/tyurin-statistics/app.js'].map(read);
const pure=vm.createContext({window:{}});for(const script of scripts.slice(0,-1))vm.runInContext(script,pure);
function open(entry,stash){
 const dom=new JSDOM(read(dir+'index.html'),{url:'https://math.example'+entry.path,runScripts:'outside-only'}),w=dom.window,doc=w.document;
 w.Math.random=()=>0;w.TextEncoder=TextEncoder;const id=entry.path.split('/').at(-1),key='math:dorofeev-algebra-7-9:v1:'+id;
 w.localStorage.setItem('math:peterson8-2017:v1:71-2','preserved');if(stash)w.localStorage.setItem(key,stash);for(const script of scripts)w.eval(script);
 return {dom,w,doc,key,l:w.MathExamTopicPractice.lessons.get(id)};
}
const frac=t=>{const a=String(t).split('/').map(Number);return a[0]/(a[1]||1);};
const pair=t=>String(t).includes('/')?String(t).split('/').map(Number):[Number(t),1];
const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
function solve(i,s){
 const id=ids[i],d=pure.window.MathExamTopicPractice.lessons.get('96-'+id).make(s),rows=d.rows.map(r=>r[1]),sg=Math.sign;
 if(id==='5'||id.startsWith('18-')){const den=rows[1]/gcd(rows[0],rows[1]);let h=den;while(h%2===0)h/=2;while(h%5===0)h/=5;
  return id==='5'?[den,h,Number(h===1)]:[den,Number(h===1),Number(['18-1','18-4'].includes(id))];}
 if(id==='12'){const rs=rows.map(t=>t.split(', ').map(Number)),ordered=rs.map(([n,k],j)=>[n/k,j+1]).sort((a,b)=>a[0]-b[0]);return [rs[0][1]-rs[0][0],ordered.at(-1)[1],ordered[0][1]];}
 if(id==='13-1')return rows.map(r=>1/frac(r));
 if(id==='13-2'){const vs=rows.map(r=>1/frac(r));return [vs.findIndex(v=>v>0&&v<1)+1,vs.findIndex(v=>v<0&&v> -1)+1,vs.findIndex(v=>v< -1)+1];}
 if(id==='14'){const n=rows[2],cs=rows[1].split(', ').map(Number),bound=frac(rows[0].split(' ')[0]);return[n+1,n/bound,cs.find(x=>n/x<1&&n/x>bound)];}
 if(id==='15'||id==='16'){const ns=rows[0].split(', ').map(Number),all=ns.flatMap(a=>ns.filter(b=>b!==a).map(b=>a/b));return[all.length,Math.min(...all),id==='15'?Math.max(...all):all.filter(v=>v<.5).length];}
 if(id.startsWith('17')){const [f,N,probe]=rows,test=x=>id==='17a'?N/x>2:id==='17b'?N/x<2:id==='17c'?N/x>1&&N/x<3:N/x>.5;const sol=Array.from({length:2*N+5},(_,i)=>i+1).filter(test);return id==='17b'?[sol[0],0,Number(test(probe))]:[sol[0],sol.at(-1),sol.length];}
 if(/^4[ab]$/.test(id)){const [r,t]=rows.map(z=>z.split(', ').map(Number)),x=r[0]/r[1],y=t[0]/t[1];return[x,y,sg(x-y)];}
 if(/^2[abcd]$/.test(id)){const a=pair(rows[0]),v=frac(rows[2]),b=frac(rows[1]);return [a[1]*v,sg(frac(rows[0])-v),sg(frac(rows[0])-b)];}
 if(id==='ex3'||id==='self3b'||id==='7'||/^9[ab]$|^10[ab]$/.test(id)){const dir=id==='self3b'||id.startsWith('10')?-1:1,order=rows.map((t,i)=>[frac(t),i+1]).sort((a,b)=>dir*(a[0]-b[0]));return [order[0][1],order[1][1],order.at(-1)[1]];}
 const [a,b]=rows.map(pair);return[a[0]*b[1],a[1]*b[0],sg(a[0]/a[1]-b[0]/b[1])];
}
const action=(doc,k)=>doc.querySelector('[data-action="'+k+'"]').click();
function send(doc,v){const a=doc.querySelector('#answer'),E=doc.defaultView.Event;a.value=String(v);a.dispatchEvent(new E('input',{bubbles:true}));doc.querySelector('#work form').dispatchEvent(new E('submit',{bubbles:true,cancelable:true}));}
assert.equal(book.exercises.length,ids.length);
for(const [i,r] of book.exercises.entries()){
 const id='96-'+ids[i];assert.equal(r.path,'/'+dir+'index.html#lesson/'+id);assert.equal(r.boardPath,r.path);assert.equal(r.printed,printed[i]);assert.equal(r.page,ids[i]==='intro'?5:ids[i].startsWith('ex')?6:ids[i].startsWith('self')?7:ids[i]==='sample2'||parseInt(ids[i])<=10?8:parseInt(ids[i])<=17?9:10);
 let {dom,w,doc,key,l}=open(r);
 assert.equal(doc.querySelector('#lesson').value,id);assert.equal(doc.querySelectorAll('#lesson option').length,84);
 assert.equal(doc.querySelector('#source').href,'https://pdf.my-uchebnik.ru/pdf/algebra/00000072.pdf#page='+(r.page+1));assert.equal(doc.querySelector('#back').hash,'#book/source-96');
 assert.equal(new URL(doc.querySelector('#board').href).searchParams.get('trainer'),r.path);assert.equal(w.MathExamTopicEdition.nextId(l),ids[i+1]&&'96-'+ids[i+1]);assert.equal(r.title,l.title);
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
console.log('Дорофеев‑7: 73 строки оглавления, 57 собственных разборов всех примеров, вопросов и №1–18; 1881 независимо проверенный ответ.');
