'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const model=vm.createContext({window:{}});
require('./public-page-script.cjs').loadSchoolModels(root,read('school/index.html'),model);
const C=model.window.WorkshopCurriculum,book=C.books.find(b=>b.id==='source-69'),folder='trainers/makarychev8-2018/';
assert.equal(book.source.pages,353);assert.equal(book.source.sha256,'158fc43fc46ba5ff559b57db0feefe71353442a8071b06d1ca5bd18f2cc26992');
assert(book.note.includes('978-5-09-051123-0'));assert.equal(book.totalPoints,62);
const expectedPages=[4,10,18,25,31,36,39,44,51,57,60,64,67,72,79,84,89,94,97,103,108,111,115,120,125,131,135,141,147,153,159,164,171,174,178,185,189,194,199,203,211,214,219,224,231,239,248,253,257,263,267,272,275,279,283,288,291,296,303,309,317,322];
assert.deepEqual(Array.from(book.mapping,r=>r.page),expectedPages);
assert.equal(book.mapping.filter(r=>r.sectionLabel.startsWith('Пункт')).length,54);
for(const [i,row] of book.mapping.entries()){
 assert.equal(row.sourcePath,'https://pdf.my-uchebnik.ru/pdf/algebra/00000056.pdf#page='+(row.page+1));
 if(i){assert(row.bookOnly&&!row.boardPath&&!row.externalPath);}else{assert.equal(row.coverage,'module');assert.equal(row.boardPath,book.exercises[0].path);}
}
const keys='abcdefgh',letters='абвгдежз',planned=[];
for(const [n,count] of [[1,1],[2,8],[3,1],[4,4],[5,4],[6,6],[7,4],[8,2],[9,2],[10,2],[11,4],[12,6],[13,4],[14,4],[15,4],[16,4],[17,4],[18,6],[19,4],[20,4],[21,2],[22,6],[23,6]]){
 for(let j=0;j<count;j++)planned.push([String(n)+(count===1?'':keys[j]),String(n)+(count===1?'':letters[j])]);
}
assert.deepEqual(Array.from(book.exercises,r=>[r.path.split('/').pop(),r.printed]),planned.map(([id,label])=>['69-'+id,label]));
const html=read(folder+'index.html'),scripts=['trainers/tyurin-statistics/content.js',folder+'fractions.js',folder+'sets-motion.js',folder+'domains.js',folder+'integer-zeros.js',folder+'proofs.js',folder+'edition-sets.js',folder+'edition-sets-practice.js',folder+'edition-sets-model.js',folder+'function-graphs.js',folder+'function-comparison.js',folder+'function-applications.js',folder+'function-figure.js','trainers/tyurin-statistics/app.js'].map(read);
function open(entry,saved){
 const dom=new JSDOM(html,{url:'https://example.test'+entry.path,runScripts:'outside-only'}),w=dom.window;w.TextEncoder=TextEncoder;w.Math.random=()=>0;
 const id=entry.path.split('/').pop(),key='math:makarychev8-2018:v1:'+id;if(saved)w.localStorage.setItem(key,saved);for(const code of scripts)w.eval(code);return {w,d:w.document,dom,key,l:w.MathExamTopicPractice.lessons.get(id)};
}
function values(d){
 const {a,b,c,x,y,kind,sub,den,whole,num,s,u,v}=d;
 if(d.family==='integer'){
   const span=d.top+Math.abs(d.shift)+4,all=Array.from({length:2*span+1},(_,j)=>j-span),ds=all.filter(t=>t!==0&&Number.isInteger(d.top/t)),roots=all.filter(t=>(!d.natural||t>0)&&Number.isInteger(d.top/(d.scale*t+d.shift)));
   assert.deepEqual(Array.from(d.roots),roots);return [ds.length,roots.length,Number(roots.includes(d.chosen))];
 }
 if(d.family==='zeros'){
   const k=d.k,fn=x=>[x,x-k,x*(x-k),x*x-k*k,x*x+k*x,(x-k)*(x-k),k*k*x-x*x*x,k*k-x*x,x**3-k*x*x+x-k,k][d.g];
   const den=x=>[k,x,k+1,x*x+k*k,3*x,x*x+k*x,4*x,2*x+2*k,x**3-(k+1)*x*x+x-(k+1),k*k-x*x][d.g];
   const v=Array.from({length:2*(k+3)+1},(_,j)=>j-k-3),top=v.filter(t=>fn(t)===0),roots=top.filter(t=>den(t)!==0);
   assert.deepEqual(Array.from(d.topRoots).sort((a,b)=>a-b),top);return [top.length,roots.length,Number(roots.includes(d.probe))];
 }
 if(d.family==='proof'){
   const r=d.r,k=d.k;
   if(d.i===0)return [a-r,-a*r,(x*x+(a-r)*x-a*r)/(x-r)];
   if(d.i===1)return [2*a-k*k,a*a,(x**4+(2*a-k*k)*x*x+a*a)/(x*x+k*x+a)];
   if(d.i===2)return [x+y,4,(x+y)**4/(x+y)**3];
   const val=x*x-2*r*x+r*r+a;return [a,0,val*val/val];
 }
 if(d.family==='prime'){
   const simple=Array.from(d.domain).filter(t=>Array.from({length:t-1},(_,i)=>i+1).filter(j=>t%j===0).length===1);
   return [simple[0],simple.at(-1),simple.length];
 }
 if(d.family==='factors'){
   const k=d.k,first=d.n===22?[k*y,k*x,x-k,y-k,x*x-k*k,k-y*y]:[x-k,y+k,x+1-k*x,k,x+k*y,x-k*y];
   const second=d.n===22?[2*x+3*y,3*x-2*y,x+y,2*x-5*y,x*x+k*k,k+y*y]:[x-k,y+k,x+1+k*x,2*y-k,x*x-k*x*y+k*k*y*y,x*x+k*x*y+k*k*y*y];
   const expanded=d.n===22?[2*k*x*y+3*k*y*y,3*k*x*x-2*k*x*y,x*x+x*y-k*x-k*y,2*x*y-5*y*y-2*k*x+5*k*y,x**4-k**4,k*k-y**4]:[x*x-2*k*x+k*k,y*y+2*k*y+k*k,(x+1)**2-(k*x)**2,y*y-(y-k)**2,x**3+(k*y)**3,x**3-(k*y)**3];
   return [first[d.i],second[d.i],expanded[d.i]];
 }

 if(d.family==='domain-line'){
   const k=d.k,fn={
     'square-difference':x=>x*x-k*k,'two-positive':x=>x*x-(2*k+2)*x+k*(k+2),'positive-square':x=>x*x+k,nested:x=>x-k*k/x,
     absolute:x=>Math.abs(x)-k,'absolute-pair':x=>x*x-k*Math.abs(x),constant:()=>k,'opposite-roots':x=>x*x+(k-2)*x-2*k,
     cube:x=>x*x*x-k*k*x,'cube-linear':x=>((2*x+1)-k)*(2*x+1)*((2*x+1)+k),twice:x=>(2*x-k)*(2*x+k),
     'zero-and-root':x=>x*(x-k),removable:x=>k-x,'linear-pair':x=>2*x*x+(k-2)*x-k,one:x=>x-k
   }[d.spec];
   const forbidden=x=>!Number.isFinite(fn(x))||fn(x)===0;
   const actual=Array.from({length:4*(k+4)+1},(_,j)=>-k-4+j/2).filter(forbidden);
   assert.deepEqual(actual,[...d.roots].sort((a,b)=>a-b));
   return [actual.length,Number(!forbidden(d.probe)),fn(d.at)];
 }
 if(d.family==='domain-plane'){
   const fn=(x,y)=>d.axes?2*x*y:(x-y)*(x+y),vals=Array.from(d.pairs,([x,y])=>fn(x,y));
   return [vals.filter(v=>v!==0).length,Number(vals[d.probe]!==0),vals.at(-1)];
 }

 if(d.family==='sequence'){const n=Math.floor((d.limit-d.begin)/d.step)+1;return [d.begin,d.begin+(n-1)*d.step,n];}
 if(d.family==='coprime'){
   const candidates=Array.from({length:den-1},(_,i)=>i+1).filter(k=>{const common=Array.from({length:Math.min(k,den)-1},(_,a)=>a+2).some(div=>k%div===0&&den%div===0);return common===d.reducible;});
   return [den-1,candidates.length,candidates[0]??0];
 }
 if(d.family==='river'){const v=d.boat-d.flow,t=d.distance/v;return [v,t,t*60];}
 if(d.family==='money')return [d.sum/100,100*d.change/d.sum,d.sum+d.change];

 if(kind==='form')return [1,c+a,c/b+a];
 if(kind==='class')return [1,-a,3];
 if(kind==='mixed'){const numerator=whole*den+num;return [whole*den,numerator,(sub===5?x:1)*(whole+num/den)];}
 if(kind==='decimal'){const scale=sub===2?100:10,k=(sub===2?-1:1)*(s+1);return [scale,k,k*(sub===2?1:x)/scale];}
 if(kind==='quotient')return [s+2,(s+2)*(2+s%5),1/(2+s%5)];
 if(kind==='group'){const n=sub===7?x-c:x+c,q=sub===7?y+c:den;return [n,q,n/q];}
 if(kind==='expression'){
   const k=d.k,top=[k,a-1,a+k,a*a+a+1][sub],bottom=[a+k,b*b+1,k,(b-0.5)**2+k-0.25][sub];
   return [top,bottom,top/bottom];
 }
 if(kind==='evaluate'){
   const numer=[(u-v)*(u+v),u*u+2*u*v+v*v,u*u+u*v,a*u-a*v][sub],bottom=[u+v,u+v,c*(u+v),u-v][sub];
   return [bottom,[u-v,u+v,u,a][sub],numer/bottom];
 }
 assert.equal(kind,'substitute');const base=x*(x+d.p),n=base-d.nn,denom=base-d.dd;assert.notEqual(denom,0);return [base,denom,n/denom];
}
function checkPrinted(i,l){
 if(i>=56){
   const facts=['{1, 2, 3, 6}','{−5, −1, 1, 5}','{2, 4, 6, 8, 14}','{−19, −3, −1, 15}','{−4, −1, 0, 3}','{0, 1, 2}','m = −1','{0, 1}',
   'y = 0','y = 2','y = 0 и y = 9','y = −6 и y = 6','только y = −2','Ответ y = 3','два нуля: −2 и 2','Остаётся x = 2','Единственный нуль x = 1','Нулей нет',
   'm ≠ 1','(a² + 1)² − 9a²','1, 4, 6, 4, 1','(a − 1)² + 2 ≥ 2','41, 43, 47','83, 89, 97','5b(2a + 3b)','9a(3a − 2b)','(x − 3)(x + y)','(y − 3)(2x − 5y)','(a − 2)(a + 2)(a² + 4)','(7 − b²)(7 + b²)','(x − 5)²','(y + 3)²','(1 − 2a)(4a + 1)','4(b − 1)','(x + 2y)(x² − 2xy + 4y²)','(x − 3y)(x² + 3xy + 9y²)'];
   assert(l.printedGuide.includes(facts[i-56]),l.id);return;
 }
 if(i>=34){
   const clues=['−9 и 9','2 и 7','каждое действительное','−2, 0 и 2','−1 и 1','−5, 0 и 5','любое действительное','−3 и 1','−8, 0 и 8','−3/2, −1/2 и 1/2','Все действительные','−1/2 и 1/2','x ≠ y и x ≠ −y','x ≠ 0 и y ≠ 0','0 или 1','только при x ≠ 1','любом x','−1/2 и 1','1/(x − 5)','1/(x² − 16)','1/[x(x − 1)(x + 1)]','1/(x² + 1)'];
   assert(l.printedGuide.includes(clues[i-34]),l.id);return;
 }
 if(i>=24){
   const facts=['10 дробей','3, 6, 9, 12, 15, 18','составные 9 и 15','4, 7, 10, 13, 16, 19','1, 2, 4, 7, 8, 11, 13, 14','3, 5, 6, 9, 10, 12','2/3 часа, или 40 минут','3/2 часа, или 90 минут','20 %','6 %'];
   assert(l.printedGuide.includes(facts[i-24]),l.id);return;
 }
 const variants=['позиции 1, 3 и 6','9/7','17/5','−3/4','1/3','x/5','17y/7','(a + b)/3','(x − 5)/(y + 5)','Четвёртое включает |x|','5/(x + 3)','(y − 1)/(y² + 1)','(a + 25)/7','(a² + a + 1)/(b² − b + 7)','52','30','1/3','83'];
 if(i<18){assert(l.printedGuide.includes(variants[i]),l.id);return;}
 const xs=[7,3,0,-2,1/2,19/10],x=xs[i-18],value=(x+8)*(x-3)/((x+6)*(x-1));
 const rendered=['10/13','0','4','5/2','85/13','−121/79'][i-18].replace('−','-'),[n,d=1]=rendered.split('/').map(Number);
 assert(Math.abs(value-n/d)<1e-10);assert(l.printedGuide.includes(rendered.replace('-','−')));assert(l.printedGuide.includes('x = 1 и x = −6'));
}
function click(d,id){d.querySelector('[data-action="'+id+'"]').click();}
function answer(d,w,n){
 const el=d.querySelector('#answer');el.value=String(n);el.dispatchEvent(new w.Event('input',{bubbles:true}));d.querySelector('form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
}
async function verify(){
const first=process.argv[2]===undefined?0:Number(process.argv[2]),last=process.argv[3]===undefined?92:Number(process.argv[3]);
assert(Number.isInteger(first)&&Number.isInteger(last)&&first>=0&&first<last&&last<=92);
let total=0;
for(const [i,entry] of book.exercises.entries()){
 if(i<first||i>=last)continue;
 assert.equal(entry.path,entry.boardPath);
 let {w,d,dom,key,l}=open(entry);const id='69-'+planned[i][0],course=w.MathExamTopicEdition;
 assert.equal(d.querySelector('#lesson').value,id);assert.equal(d.querySelectorAll('#lesson option').length,182);
 assert.equal(d.querySelector('#back').hash,'#book/source-69');assert.equal(d.querySelector('#source').hash,'#page='+(entry.page+1));
 assert.equal(d.querySelector('#related').hash,'#lesson/domain');assert.equal(d.querySelector('#board').href.includes(encodeURIComponent(entry.path)),true);
 assert.equal(l.title,entry.title);assert.equal(l.printedReference,'Упражнение №'+entry.printed);assert.equal(l.page,i<10?7:i<34?8:i<70?9:10);checkPrinted(i,l);
 assert.equal(course.nextId(l),planned[i+1]&&'69-'+planned[i+1][0]);const fresh=JSON.parse(w.localStorage.getItem(key));assert.deepEqual(fresh.results,[]);
 const variants=new Set();for(let seed=1;seed<=11;seed++){
  const data=l.make(seed),ans=values(data);variants.add(JSON.stringify([data.rows,data.caption]));assert(course.figure(data).includes('role="img"'));
  for(const [j,t] of data.questions.entries()){
    assert(Math.abs(ans[j]-t.answer)<1e-8,id+' seed '+seed+' q '+j);for(const [bad,msg] of t.mistakes){assert(Number.isFinite(bad)&&Math.abs(bad-t.answer)>0.00000051,id+' bad '+seed+' q '+j);assert(msg.length>=15);}
    total++;
  }
 }
 assert.equal(variants.size,11,id+' unique models');click(d,'printed-guide');assert(d.querySelector('#work').textContent.includes(l.printedGuide));
 click(d,'practice');answer(d,w,l.make(2).questions[2].answer);click(d,'next');
 for(let j=0;j<3;j++){
   const task=l.make(4+j).questions[j];if(j===0){answer(d,w,task.mistakes[0][0]);assert(d.querySelector('#feedback').textContent.includes(task.mistakes[0][1]));}
   if(j===1)click(d,'hint');answer(d,w,task.answer);click(d,'next');
 }
 assert.deepEqual(JSON.parse(w.localStorage.getItem(key)).results,['fixed','help','first']);
 const saved=w.localStorage.getItem(key);dom.window.close();({w,d,dom,key,l}=open(entry,saved));assert.equal(d.querySelectorAll('#work ol li').length,3);
 click(d,'again');const restored=JSON.parse(w.localStorage.getItem(key));assert.deepEqual(restored.results,[]);assert.notEqual(restored.variant,fresh.variant);dom.window.close();
 // Let JSDOM drain its queued load events before opening the next learner session.
 await new Promise(resolve=>setImmediate(resolve));
}
assert.equal(total,(last-first)*33);console.log('Makarychev advanced 8 (2018): 54 printed points and 8 sets; verified exercises '+(first+1)+'–'+last+' of 92, '+total+' independent answers, personal results and reload.');
}
verify().catch(error=>{console.error(error);process.exitCode=1;});
