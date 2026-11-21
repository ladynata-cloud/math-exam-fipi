'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {JSDOM} = require('jsdom');
const {loadSchoolModels} = require('./public-page-script.cjs');
const root = path.resolve(__dirname,'..');
const dir = path.join(root,'trainers/alimov-2012');
const read = file => fs.readFileSync(file,'utf8');
const world = vm.createContext({window:{}});
loadSchoolModels(root,read(path.join(root,'school/index.html')),world);
const catalogue=world.window.WorkshopCurriculum;
const book=catalogue.books.find(item=>item.id==='source-19');
const printed=[3,7,11,17,24,39,47,54,60,63,72,77,81,84,90,94,96,100,105,109,117,121,126,132,135,139,142,144,149,152,156,161,168,173,179,184,194,201,204,208,213,217,223,229,236,240,245,251,261,265,271,277,283,291,294,297,301,304,309,317,320,323,326,330,336,339,343,346,350,354,364,370,375,387,388,390,393,395];
assert.equal(book.source.pages,467);assert.equal(book.source.sha256,'7824a45c3875921394c5bb4ac49d4db9608121b950f1cb072d8c38aa31e8de0c');
assert.deepEqual(Array.from(book.mapping,row=>row.page),printed);
assert.equal(book.mapping.filter(row=>row.coverage==='module').length,2);
for(const [i,row] of book.mapping.entries()){
 assert.equal(row.section,i+1);assert.equal(row.sectionLabel.startsWith('Приложение'),i>=73);
 assert.equal(row.sectionLabel.endsWith('*'),[10,30,37,43,53,59].includes(i+1));
 assert.equal(row.boardPath,i===0?book.exercises[0].path:i===1?'/trainers/alimov-2012/index.html#lesson/19-6a':'/trainers/alimov10-11.html#lesson/p'+String(i+1).padStart(2,'0')+'/0');
}
assert.equal(book.mapping[76].title,'Дробно-линейная функция и её график');
const keys=['1a','1b','1c','1d','1e','1f','2a','2b','2c','2d','2e','2f','3a','3b','3c','3d','3e','3f','4a','4b','5a','5b','6a','6b','6c','6d','7','8a','8b','8c','9a','9b','9c','9d','9e','9f','10a','10b','10c','10d','11a','11b','12a','12b','12c'];
const original=['0,(6)','0,(72)','0,6','−0,75','−8,(285714)','0,(13)','0,(29)','1,(282051)','1,58(3)','0,49(6)','0,225','1,3(2)','2/3','14/9','11/90','−8/9','−36/11','−2359/990','126,16:31,54=4','19/4=4,75','7,31+1,19=8,5','1,3+2,5+2=5,8','169/10','6529/900','число иррационально','число иррационально','5,5 и 5,6','|x|=x','|x|=−x','|x|=x','8−9=−1','−31+12√3','даёт 18','даёт 8','2·(3+1)=8','−15−6√5','3·2·7=42','2·5=10','5/2','2/3','√3,9+√8 < √1,1+√17','√11−√2,1 > √10−√3,1','Ответ √10','корень равен 3','Ответ 2+√3'];
const values=[[2,3],[8,11],[3,5],[-3,4],[-58,7],[13,99],[29,99],[50,39],[19,12],[149,300],[9,40],[119,90]];
assert.equal(book.exercises.length,45);
const html=read(path.join(dir,'index.html'));
function open(key,saved){
 const id='19-'+key,storage='math:alimov-2012:v1:'+id;
 const dom=new JSDOM(html,{url:'https://site.test/trainers/alimov-2012/index.html#lesson/'+id,runScripts:'outside-only'});
 const w=dom.window;w.TextEncoder=TextEncoder;w.Math.random=()=>0;
 if(saved)w.localStorage.setItem(storage,saved);
 for(const src of ['../tyurin-statistics/content.js','rationals.js','real-numbers.js','../tyurin-statistics/app.js'])w.eval(read(path.join(dir,src)));
 return {dom,w,storage,doc:w.document,lesson:w.MathExamTopicPractice.lessons.get(id)};
}
const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
function exactPeriod(n,d){
 d=d/gcd(n,d);
 while(d%2===0)d/=2;
 while(d%5===0)d/=5;
 if(d===1)return 0;
 let k=1,residue=10%d;
 while(residue!==1){residue=residue*10%d;k++;}
 return k;
}
function rational(text){
 const m=/^(−?)(\d+),(\d*)(?:\((\d+)\))?$/.exec(text);
 assert.ok(m,text);
 const prefix=m[3],period=m[4]||'',scale=10**prefix.length,k=period?10**period.length-1:1;
 const den=scale*k,num=(Number(m[2])*den+Number(prefix||0)*k+Number(period||0))*(m[1]?-1:1);
 const g=gcd(num,den);
 return [num/g,den/g];
}
function expected(key,d){
 const row=Array.from(d.rows[0]);const group=key[0];
 if(group==='9') {
  const [a,b,n]=row, root=Math.sqrt(n);
  const f=({ '9a':x=>(b*x-a)*(a+b*x), '9b':x=>(b*x-a)*(a-b*x), '9c':x=>(a*x+b*x)*x,
   '9d':x=>(a*x+b*x)/x, '9e':x=>(b*x-a)**2+(b*x+a)**2, '9f':x=>(x-a)**2-(b*x+a)**2 })[key];
  const C=Math.round((f(root)+f(-root))/2)||0,K=Math.round((f(root)-f(-root))/(2*root))||0;
  assert(Math.abs(f(root)-C-K*root)<1e-8);return [C,K,K===0?1:2];
 }
 if(key.startsWith('10')){
  const [p,q,n]=row;const candidates=Array.from({length:101},(_,i)=>i);
  const a=candidates.find(i=>n*i*i===p),b=candidates.find(i=>n*i*i===q);
  const value=key==='10a'||key==='10b'?Math.round(Math.sqrt(p*q)):a/b;
  assert(Math.abs(value-(d.operation==='×'?Math.sqrt(p*q):Math.sqrt(p/q)))<1e-8);return [a,b,value];
 }
 if(key==='11a'){const [a,b]=row,x=Math.sqrt(a-.1)+Math.sqrt(b-.1),y=Math.sqrt(a+.1)+Math.sqrt(b+.1);return [Math.ceil(Math.sqrt(a-.1)),Math.ceil(x),Math.sign(x-y)];}
 if(key==='11b'){const [a,b]=row,x=Math.sqrt(a+1)-Math.sqrt(b),y=Math.sqrt(a)-Math.sqrt(b+1);return [Math.max(a,a+1),Math.min(b,b+1),Math.sign(x-y)];}
 if(key==='12a'){const [p,q,t]=row,v=Math.sqrt(p+q-2*Math.sqrt(p*q)),inside=v+Math.sqrt(q);return [Math.sign(v/(Math.sqrt(p)-Math.sqrt(q))),Math.round(inside**2),Math.round(inside*t*Math.sqrt(p))];}
 if(key==='12b'){const [a,q,k]=row,v=Math.sqrt(a*a+q-2*a*Math.sqrt(q)),inside=v+Math.sqrt(q);return [Math.round((v*v-a*a-q)/Math.sqrt(q)),Math.round(inside),Math.round(Math.sqrt(inside*a*k*k))];}
 if(key==='12c'){const [p,q,t]=row,u=Math.sqrt(p+q+2*Math.sqrt(p*q)),v=Math.sqrt(p+q-2*Math.sqrt(p*q)),y=Math.sqrt((u-v)*t+t*t+q);return [Math.round((u-v)/Math.sqrt(q)),Math.round(y-Math.sqrt(q)),Math.round((y-t)**2)];}
 if(key==='6a'){
  const [whole,n]=row,top=whole*100+n;
  const den=Array.from({length:100},(_,i)=>i+1).find(t=>top*t%100===0);
  return [top,den,1];
 }
 if(key==='6b'){const [whole,pre,repeat]=row;const written=String(whole)+String(pre);return [9*100,Number(written+String(repeat))-Number(written),1];}
 if(key==='6c'){const [n,k]=row,str='1'+'2'.repeat(n+k)+'1';return [str.length-2,str.lastIndexOf('1'),2];}
 if(key==='6d'){const spelling=String(10**row[1]+1);return [spelling.split('0').length-1,Number(spelling.at(-1)),2];}
 if(key==='7'){
  const N=row[0],lo=Array.from({length:100},(_,i)=>i).find(i=>i*i<=100*N && (i+1)*(i+1)>100*N);
  return [lo/10,(lo+1)/10,((2*lo+1)**2<=400*N?lo+1:lo)/10];
 }
 if(group==='8'){const [A,B,C]=row;return [A**2,B**2*C,Math.sign(A-B*Math.sqrt(C))];}
 if(group==='4'||group==='5'){
   const [a,b,c,f]=row;
   if(key==='4a')return [a/2,b/(1/2),(a+4*b)/(2*c+2*f)];
   if(key==='4b')return [3*a/12,8*b/32,(a+b+c)/4];
   if(key==='5a')return [a+b,c-f,((a+b)*3+c-f)/2];
   return [a*5/20,b*8/16,(a*5+b*10+c*8)/20];
 }
 if(group==='3'){
   const [num,den]=rational(d.caption.match(/для (−?\d+,\d*\(\d+\))/)[1]);
   const before=10**row[1]*(10**row[2].length-1);
   return [before,num*before/den,den];
 }
 let [a,b,c,f]=row;
 if(group==='2'){
   const sum=!['2e','2f'].includes(key),n=sum?a*f+c*b:a*c,den=b*f,g=gcd(n,den);
   a=n/g;b=den/g;
 }
 // Recover by dividing integers and by the multiplicative order of ten, without using the course algorithm.
 const result=[Math.trunc(10*a/b),(10*Math.abs(a))%b,exactPeriod(a,b)];
 const [parsedNum,parsedDen]=rational(d.sequence.label);
 assert.equal(parsedNum*b,a*parsedDen);
 for(const step of d.sequence.steps)assert.equal(step.remainder*10,step.digit*b+step.next);
 return result;
}
function submit(doc,value){
 const field=doc.querySelector('#answer'),Event=doc.defaultView.Event;
 field.value=String(value);field.dispatchEvent(new Event('input',{bubbles:true}));
 doc.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
}
const click=(doc,name)=>doc.querySelector('[data-action="'+name+'"]').click();
for(const [i,key] of keys.entries()){
 let view=open(key),{dom,w,doc,storage,lesson}=view;
 assert.equal(book.exercises[i].path,'/trainers/alimov-2012/index.html#lesson/'+lesson.id);
 assert.equal(book.exercises[i].printed,lesson.printedReference.replace('Упражнение №',''));
 assert.equal(doc.querySelector('#lesson').value,lesson.id);assert.equal(doc.querySelectorAll('#lesson option').length,45);
 assert.equal(new URL(doc.querySelector('#source').href).hash,parseInt(key)>5?'#page=11':'#page=7');
 assert.equal(new URL(doc.querySelector('#board').href).searchParams.get('trainer'),book.exercises[i].path);
 assert(lesson.printedGuide.includes(original[i]),key+' printed answer');
 if(i<12)assert.deepEqual(rational(original[i]),values[i]);
 assert.equal(w.MathExamTopicEdition.nextId(lesson),i+1<keys.length?'19-'+keys[i+1]:undefined);
 const variants=new Set();
 for(let sample=1;sample<=11;sample++){
   const data=lesson.make(sample);variants.add(JSON.stringify(data.rows));
   assert.deepEqual(Array.from(data.questions,q=>q.answer),expected(key,data));
   for(const q of data.questions)for(const [wrong,diagnosis] of q.mistakes){assert.notEqual(wrong,q.answer);assert(diagnosis.length>=18);}
 }
 assert.equal(variants.size,11);assert.deepEqual(JSON.parse(w.localStorage.getItem(storage)).results,[]);
 click(doc,'practice');submit(doc,999999);const stored=w.localStorage.getItem(storage);dom.window.close();
 ({dom,w,doc,storage,lesson}=open(key,stored));
 assert.equal(doc.querySelector('#answer').value,'999999');
 submit(doc,expected(key,lesson.make(2))[2]);click(doc,'next');
 for(let j=0;j<3;j++){
   const data=lesson.make(4+j);
   if(j===0){submit(doc,data.questions[j].mistakes[0][0]);assert(doc.querySelector('#feedback').textContent.includes(data.questions[j].mistakes[0][1]));}
   if(j===2)click(doc,'hint');
   submit(doc,expected(key,data)[j]);click(doc,'next');
 }
 assert.deepEqual(JSON.parse(w.localStorage.getItem(storage)).results,['fixed','first','help']);
 click(doc,'again');assert.equal(JSON.parse(w.localStorage.getItem(storage)).variant,7);
 dom.window.close();
}
console.log('Alimov 2012: 78 individual paragraph links, all 45 original entries, 1485 independent numerical checks, 45 saved/corrected/assisted journeys.');
